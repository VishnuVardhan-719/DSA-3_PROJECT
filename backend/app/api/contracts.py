"""Contract mutation routes."""

from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_session
from ..errors import ApiError
from ..services.identifiers import next_identifier
from ..services.lifecycle import (
    archive_contract,
    audit_event,
    check_concurrency,
    contract_or_404,
    restore_contract,
)


router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.post("", response_model=schemas.ContractSummary, status_code=status.HTTP_201_CREATED)
def create_contract(payload: schemas.ContractCreate, session: Session = Depends(get_session)):
    contract_id = payload.id or next_identifier(session, models.Contract, "CTR")
    if session.get(models.Contract, contract_id):
        raise ApiError(409, "duplicate_contract", f"Contract {contract_id} already exists")
    values = payload.model_dump(exclude={"id"})
    now = datetime.now()
    contract = models.Contract(
        id=contract_id,
        current_version="Unversioned",
        last_modified=payload.effective_date,
        updated_at=now,
        **values,
    )
    session.add(contract)
    audit_event(session, payload.owner, "Contract Created", "Contract", contract.id, contract.name)
    session.commit()
    session.refresh(contract)
    return contract


@router.patch("/{contract_id}", response_model=schemas.ContractSummary)
def update_contract(contract_id: str, payload: schemas.ContractUpdate, session: Session = Depends(get_session)):
    contract = contract_or_404(session, contract_id)
    check_concurrency(contract, payload.updated_at)
    changes = payload.model_dump(exclude={"updated_at"}, exclude_none=True)
    for key, value in changes.items():
        setattr(contract, key, value)
    contract.updated_at = datetime.now()
    contract.last_modified = contract.updated_at.date()
    audit_event(session, contract.owner, "Contract Updated", "Contract", contract.id, ", ".join(sorted(changes)))
    session.commit()
    session.refresh(contract)
    return contract


@router.post("/{contract_id}/archive", response_model=schemas.ContractSummary)
def archive(contract_id: str, session: Session = Depends(get_session)):
    contract = contract_or_404(session, contract_id)
    archive_contract(session, contract, actor=contract.owner)
    session.commit()
    return contract


@router.post("/{contract_id}/restore", response_model=schemas.ContractSummary)
def restore(contract_id: str, session: Session = Depends(get_session)):
    contract = contract_or_404(session, contract_id, include_archived=True)
    restore_contract(session, contract, actor=contract.owner)
    session.commit()
    return contract


@router.post("/bulk-actions", response_model=schemas.BulkActionResult)
def bulk_action(payload: schemas.ContractBulkAction, session: Session = Depends(get_session)):
    if len(set(payload.contract_ids)) != len(payload.contract_ids):
        raise ApiError(422, "validation_error", "Contract IDs must be unique")
    contracts = [contract_or_404(session, contract_id, include_archived=True) for contract_id in payload.contract_ids]
    for contract in contracts:
        if payload.action == "archive":
            archive_contract(session, contract, actor="Compliance Reviewer", action="Bulk Contract Archive")
        elif payload.action == "restore":
            restore_contract(session, contract, actor="Compliance Reviewer", action="Bulk Contract Restore")
        else:
            contract.compliance = payload.value
            contract.updated_at = datetime.now()
            audit_event(
                session,
                "Compliance Reviewer",
                "Bulk Compliance Updated",
                "Contract",
                contract.id,
                payload.value,
            )
    session.commit()
    return {"affected": len(contracts), "action": payload.action}
