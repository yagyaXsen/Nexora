import logging
from typing import Optional
from datetime import datetime, timedelta, timezone
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Application, ApplicationStatus, Notification, Opportunity, OpportunityStatus, utc_now
from app.publishing.live_feed import invalidate_live_feed

logger = logging.getLogger(__name__)


# ── Shared status transitions ──────────────────────────────────────────────────
#
# ONE implementation of "what status does this deadline imply?" — used by the
# deduper at scrape time, the revalidation pass, the scheduled sweep, and the
# link checker. Keeping it in one place guarantees a record whose deadline
# moved back into the future is revived everywhere the same way.

def recompute_status(opp: Opportunity, now: Optional[datetime] = None) -> str:
    """Set opp.status from its deadline relative to `now`.

    Returns the new status value. Rows without a deadline keep their current
    status unless it is dead_link (a live source check supersedes a stale
    link verdict only when the caller verified the source — see callers).
    """
    if now is None:
        now = datetime.now(timezone.utc)

    deadline = opp.deadline
    if deadline is not None and deadline.tzinfo is None:
        # SQLite may hand back naive datetimes — treat as UTC.
        deadline = deadline.replace(tzinfo=timezone.utc)

    if deadline is None:
        return opp.status

    window_end = now + timedelta(days=settings.EXPIRING_SOON_DAYS)
    if deadline < now:
        new_status = OpportunityStatus.EXPIRED.value
    elif deadline <= window_end:
        new_status = OpportunityStatus.EXPIRING_SOON.value
    else:
        new_status = OpportunityStatus.ACTIVE.value

    opp.status = new_status
    return new_status


def run_daily_expiry_sweep(db: Session) -> dict:
    now = datetime.now(timezone.utc)

    # 1. Active/Expiring -> Expired
    expired_opps = db.query(Opportunity).filter(
        Opportunity.deadline != None,
        Opportunity.deadline < now,
        Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value])
    ).all()

    for opp in expired_opps:
        opp.status = OpportunityStatus.EXPIRED.value
        opp.last_checked_at = utc_now()

    # 2. Active -> Expiring Soon
    expiring_soon_opps = db.query(Opportunity).filter(
        Opportunity.deadline != None,
        Opportunity.deadline >= now,
        Opportunity.deadline <= now + timedelta(days=settings.EXPIRING_SOON_DAYS),
        Opportunity.status == OpportunityStatus.ACTIVE.value
    ).all()

    for opp in expiring_soon_opps:
        opp.status = OpportunityStatus.EXPIRING_SOON.value
        opp.last_checked_at = utc_now()

    # 3. Expired -> Active (a source pushed the deadline out; the sweep must
    #    agree with the scrape-time recompute or a revived row would flip back
    #    on the next sweep).
    revived_opps = db.query(Opportunity).filter(
        Opportunity.deadline != None,
        Opportunity.deadline >= now,
        Opportunity.status == OpportunityStatus.EXPIRED.value
    ).all()

    for opp in revived_opps:
        recompute_status(opp, now)
        opp.last_checked_at = utc_now()
    if revived_opps:
        logger.info(f"Expiry sweep revived {len(revived_opps)} opportunity/opportunities with future deadlines.")

    db.commit()

    # Status changes alter publishing eligibility (expired/expired→active
    # transitions) — drop the published feed cache so the frontend reflects
    # them on the next request.
    invalidate_live_feed()

    # 4. Deadline reminder notifications for tracked (saved, not yet applied)
    # applications closing within the window. Deduped: a user gets at most one
    # reminder per opportunity per week.
    reminder_count = _send_deadline_reminders(db, now, now + timedelta(days=settings.EXPIRING_SOON_DAYS))

    logger.info(
        f"Expiry sweep completed: {len(expired_opps)} marked expired, "
        f"{len(expiring_soon_opps)} marked expiring soon, "
        f"{len(revived_opps)} revived, "
        f"{reminder_count} deadline reminders sent."
    )
    return {
        "expired_count": len(expired_opps),
        "expiring_soon_count": len(expiring_soon_opps),
        "revived_count": len(revived_opps),
        "reminder_count": reminder_count,
    }


def _send_deadline_reminders(db: Session, now: datetime, window_end: datetime) -> int:
    """Notify users whose tracked applications close inside the window."""
    week_ago = now - timedelta(days=7)
    targets = db.query(Application, Opportunity).join(
        Opportunity, Application.opportunity_id == Opportunity.id
    ).filter(
        Application.status.in_([ApplicationStatus.SAVED.value, ApplicationStatus.PREPARING.value,
                                ApplicationStatus.READY_TO_APPLY.value]),
        Opportunity.deadline != None,
        Opportunity.deadline >= now,
        Opportunity.deadline <= window_end,
    ).all()

    sent = 0
    for app, opp in targets:
        already = db.query(Notification).filter(
            Notification.user_id == app.user_id,
            Notification.opp_id == opp.id,
            Notification.category == "deadline",
            Notification.created_at >= week_ago,
        ).first()
        if already:
            continue
        # SQLite stores tz-aware datetimes as naive strings, so coerce both
        # sides to aware UTC before subtracting.
        dl = opp.deadline
        if dl.tzinfo is None:
            dl = dl.replace(tzinfo=timezone.utc)
        days_left = (dl - now).days
        db.add(Notification(
            user_id=app.user_id,
            title=f"Deadline in {max(days_left, 1)} day{'s' if days_left != 1 else ''}",
            message=f"{opp.title} closes {dl.strftime('%b %d, %Y')}. Finish your application now.",
            category="deadline",
            priority="critical" if days_left <= 3 else "high",
            opp_id=opp.id,
            organizer=opp.organizer or "Nexora Intelligence",
            created_at=utc_now(),
        ))
        sent += 1
    db.commit()
    return sent


# HTTP statuses that unambiguously mean "this page is gone" — safe to treat as
# a permanent dead link on the first failure. Everything else (5xx, timeouts,
# DNS errors, 403/429 bot-blocks, rate limits) is TRANSIENT: the source may
# simply be down for a moment, which must never expire or delete an
# opportunity on its own.
PERMANENT_LINK_FAILURE_CODES = {404, 410}


def check_dead_links(db: Session, max_checks: Optional[int] = None) -> dict:
    """Verify apply URLs of live opportunities.

    Policy:
      * success (status < 400): reset the transient-failure counter, refresh
        last_verified_at, and recover any row a previous outage killed.
      * 404/410: permanent → dead_link immediately.
      * anything else (5xx, timeout, DNS, …): TRANSIENT — increment
        link_check_failures and only mark dead_link after
        settings.DEAD_LINK_FAILURE_THRESHOLD consecutive failures.
    """
    if max_checks is None:
        max_checks = settings.CRON_MAX_DEAD_LINK_CHECKS

    # dead_link rows are checked too — otherwise a row killed by a transient
    # outage could never be re-verified and recovered.
    active_opps = db.query(Opportunity).filter(
        Opportunity.status.in_([
            OpportunityStatus.ACTIVE.value,
            OpportunityStatus.EXPIRING_SOON.value,
            OpportunityStatus.DEAD_LINK.value,
        ])
    ).limit(max_checks).all()

    now = datetime.now(timezone.utc)
    dead_count = 0
    transient_count = 0
    recovered_count = 0
    headers = {"User-Agent": "NexoraLinkChecker/1.0"}

    with httpx.Client(timeout=5.0, headers=headers, follow_redirects=True) as client:
        for opp in active_opps:
            try:
                resp = client.head(opp.apply_url)
                if resp.status_code == 405:  # Method Not Allowed -> fallback to GET
                    resp = client.get(opp.apply_url)

                if resp.status_code < 400:
                    # Source is alive — data confirmed reachable.
                    opp.link_check_failures = 0
                    opp.last_checked_at = utc_now()
                    opp.last_verified_at = utc_now()
                    if opp.status == OpportunityStatus.DEAD_LINK.value:
                        # Recover a row killed by an earlier outage.
                        recompute_status(opp, now)
                        recovered_count += 1
                    continue

                if resp.status_code in PERMANENT_LINK_FAILURE_CODES:
                    opp.status = OpportunityStatus.DEAD_LINK.value
                    opp.last_checked_at = utc_now()
                    dead_count += 1
                else:
                    transient_count += 1
                    _record_transient_failure(opp)

            except Exception as e:
                logger.warning(f"Link check failed for opp ID {opp.id} ({opp.apply_url}): {e}")
                transient_count += 1
                _record_transient_failure(opp)

    db.commit()
    if dead_count or recovered_count:
        # dead_link / recovery transitions change publishing eligibility.
        invalidate_live_feed()
    logger.info(
        f"Link check completed: {dead_count} permanent dead links, "
        f"{transient_count} transient failures, {recovered_count} recovered."
    )
    return {
        "dead_link_count": dead_count,
        "transient_failure_count": transient_count,
        "recovered_count": recovered_count,
    }


def _record_transient_failure(opp: Opportunity) -> bool:
    """Increment the strike counter; dead_link only after N consecutive strikes.

    Returns True when this failure crossed the threshold and the row was marked
    dead_link.
    """
    opp.link_check_failures = (opp.link_check_failures or 0) + 1
    opp.last_checked_at = utc_now()
    if opp.link_check_failures >= settings.DEAD_LINK_FAILURE_THRESHOLD:
        opp.status = OpportunityStatus.DEAD_LINK.value
        return True
    return False
