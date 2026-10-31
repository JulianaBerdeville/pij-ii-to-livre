from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_owner
from app.core.scheduling import covering_run
from app.db.session import get_db
from app.models.availability import AvailabilitySlot, SlotStatus
from app.models.service import Service
from app.models.user import User
from app.schemas.availability import AvailabilityBulkCreate, AvailabilitySlotCreate, AvailabilitySlotRead

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("", response_model=list[AvailabilitySlotRead])
def list_slots(
    owner_id: int,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    only_available: bool = True,
    service_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(AvailabilitySlot).filter(AvailabilitySlot.owner_id == owner_id)
    if date_from:
        query = query.filter(AvailabilitySlot.start_time >= date_from)
    if only_available:
        query = query.filter(AvailabilitySlot.status == SlotStatus.AVAILABLE)
    # date_to só é aplicado ao início do atendimento; a cobertura precisa dos horários seguintes
    slots = query.order_by(AvailabilitySlot.start_time).all()

    if service_id is not None:
        service = db.query(Service).filter(Service.id == service_id, Service.owner_id == owner_id).first()
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
        slots = [
            slot
            for i, slot in enumerate(slots)
            if covering_run(slots, i, service.duration_minutes) is not None
        ]

    if date_to:
        slots = [slot for slot in slots if slot.start_time <= date_to]
    return slots


@router.post("", response_model=AvailabilitySlotRead, status_code=status.HTTP_201_CREATED)
def create_slot(
    payload: AvailabilitySlotCreate, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário final deve ser após o inicial")
    slot = AvailabilitySlot(owner_id=owner.id, start_time=payload.start_time, end_time=payload.end_time)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.post("/bulk", response_model=list[AvailabilitySlotRead], status_code=status.HTTP_201_CREATED)
def create_slots_bulk(
    payload: AvailabilityBulkCreate, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)
):
    """Gera slots consecutivos para um dia, de start_hour até end_hour, a cada slot_minutes."""
    if payload.end_hour <= payload.start_hour:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_hour deve ser após start_hour")

    # payload.date é a meia-noite do dia no fuso do usuário; as horas são somadas a partir dela
    day = payload.date
    current = day + timedelta(hours=payload.start_hour)
    day_end = day + timedelta(hours=payload.end_hour)
    step = timedelta(minutes=payload.slot_minutes)

    slots = []
    while current + step <= day_end:
        slots.append(AvailabilitySlot(owner_id=owner.id, start_time=current, end_time=current + step))
        current += step

    db.add_all(slots)
    db.commit()
    for slot in slots:
        db.refresh(slot)
    return slots


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(slot_id: int, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == slot_id, AvailabilitySlot.owner_id == owner.id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horário não encontrado")
    if slot.status == SlotStatus.BOOKED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível remover horário já agendado")
    db.delete(slot)
    db.commit()
