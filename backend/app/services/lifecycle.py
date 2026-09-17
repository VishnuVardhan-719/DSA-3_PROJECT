"""Contract lifecycle and audit transaction helpers."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..errors import ApiError


def contract_or_404(session: Session, contract_id: str, *, include_archived: bool = False) -> models.Contract:
    contract = session.get(models.Contract, contract_id)
    if not contract or (contract.archived_at is not None and not include_archived):
        raise ApiError(404, "not_found", f"Contract {contract_id} was not found")
    return contract


def audit_event(
    session: Session,
    actor: str,
    action: str,
    entity_type: str,
    entity_id: str,
    detail: str,
    event_status: str = "Completed",
) -> models.AuditEvent:
    pending_count = sum(isinstance(item, models.AuditEvent) for item in session.new)
    next_number = (session.scalar(select(func.count()).select_from(models.AuditEvent)) or 0) + pending_count + 1
    event = models.AuditEvent(
        id=f"AUD-{next_number:06d}",
        occurred_at=datetime.now(),
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
        status=event_status,
    )
    session.add(event)
    return event


def check_concurrency(contract: models.Contract, expected_updated_at: datetime) -> None:
    if contract.updated_at != expected_updated_at.replace(tzinfo=None):
        raise ApiError(409, "stale_record", "This contract was changed after it was loaded")


def archive_contract(session: Session, contract: models.Contract, *, actor: str, action: str = "Contract Archived") -> None:
    if contract.archived_at is not None:
        raise ApiError(409, "invalid_state", f"Contract {contract.id} is already archived")
    now = datetime.now()
    contract.archived_at = now
    contract.updated_at = now
    audit_event(session, actor, action, "Contract", contract.id, contract.name)


def restore_contract(session: Session, contract: models.Contract, *, actor: str, action: str = "Contract Restored") -> None:
    if contract.archived_at is None:
        raise ApiError(409, "invalid_state", f"Contract {contract.id} is not archived")
    contract.archived_at = None
    contract.updated_at = datetime.now()
    audit_event(session, actor, action, "Contract", contract.id, contract.name)
