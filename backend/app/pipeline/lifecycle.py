import logging
from datetime import datetime, timedelta, timezone
import httpx
from sqlalchemy.orm import Session

from app.models import Application, ApplicationStatus, Notification, Opportunity, OpportunityStatus, utc_now

logger = logging.getLogger(__name__)

def run_daily_expiry_sweep(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    seven_days_later = now + timedelta(days=7)

    # 1. Active/Expiring -> Expired
    expired_opps = db.query(Opportunity).filter(
        Opportunity.deadline != None,
        Opportunity.deadline < now,
        Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value])
    ).all()

    for opp in expired_opps:
        opp.status = OpportunityStatus.EXPIRED.value

    # 2. Active -> Expiring Soon
    expiring_soon_opps = db.query(Opportunity).filter(
        Opportunity.deadline != None,
        Opportunity.deadline >= now,
        Opportunity.deadline <= seven_days_later,
        Opportunity.status == OpportunityStatus.ACTIVE.value
    ).all()

    for opp in expiring_soon_opps:
        opp.status = OpportunityStatus.EXPIRING_SOON.value

    db.commit()

    # 3. Deadline reminder notifications for tracked (saved, not yet applied)
    # applications closing within 14 days. Deduped: a user gets at most one
    # reminder per opportunity per week.
    reminder_count = _send_deadline_reminders(db, now, seven_days_later)

    logger.info(
        f"Expiry sweep completed: {len(expired_opps)} marked expired, "
        f"{len(expiring_soon_opps)} marked expiring soon, "
        f"{reminder_count} deadline reminders sent."
    )
    return {
        "expired_count": len(expired_opps),
        "expiring_soon_count": len(expiring_soon_opps),
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

def check_dead_links(db: Session, max_checks: int = 50) -> int:
    active_opps = db.query(Opportunity).filter(
        Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value])
    ).limit(max_checks).all()

    dead_count = 0
    headers = {"User-Agent": "NexoraLinkChecker/1.0"}

    with httpx.Client(timeout=5.0, headers=headers, follow_redirects=True) as client:
        for opp in active_opps:
            try:
                resp = client.head(opp.apply_url)
                if resp.status_code == 405:  # Method Not Allowed -> fallback to GET
                    resp = client.get(opp.apply_url)
                if resp.status_code >= 400:
                    opp.status = OpportunityStatus.DEAD_LINK.value
                    dead_count += 1
            except Exception as e:
                logger.warning(f"Link check failed for opp ID {opp.id} ({opp.apply_url}): {e}")
                opp.status = OpportunityStatus.DEAD_LINK.value
                dead_count += 1

    db.commit()
    logger.info(f"Link check completed. {dead_count} opportunities marked dead_link.")
    return dead_count
