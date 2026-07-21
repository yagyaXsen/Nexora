import logging
from datetime import datetime, timedelta, timezone
import httpx
from sqlalchemy.orm import Session

from app.models import Opportunity, OpportunityStatus

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
    logger.info(f"Expiry sweep completed: {len(expired_opps)} marked expired, {len(expiring_soon_opps)} marked expiring soon.")
    return {
        "expired_count": len(expired_opps),
        "expiring_soon_count": len(expiring_soon_opps)
    }

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
