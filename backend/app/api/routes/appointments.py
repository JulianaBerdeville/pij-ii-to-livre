from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_client, get_current_owner, get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.availability import AvailabilitySlot, SlotStatus
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentRead

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate, db: Session = Depends(get_db), client: User = Depends(get_current_client)
):
    slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == payload.slot_id).first()
    if not slot or slot.status != SlotStatus.AVAILABLE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário indisponível")

    service = db.query(Service).filter(
        Service.id == payload.service_id, Service.owner_id == slot.owner_id, Service.active.is_(True)
    ).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Serviço inválido para este proprietário")

    appointment = Appointment(
        client_id=client.id, service_id=service.id, slot_id=slot.id, notes=payload.notes
    )
    slot.status = SlotStatus.BOOKED
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/me", response_model=list[AppointmentRead])
def my_appointments(db: Session = Depends(get_db), client: User = Depends(get_current_client)):
    return (
        db.query(Appointment)
        .filter(Appointment.client_id == client.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )


@router.get("/owner", response_model=list[AppointmentRead])
def owner_appointments(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    return (
        db.query(Appointment)
        .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
        .filter(AvailabilitySlot.owner_id == owner.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )


@router.patch("/{appointment_id}/cancel", response_model=AppointmentRead)
def cancel_appointment(
    appointment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")

    slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == appointment.slot_id).first()
    is_owner = slot is not None and slot.owner_id == user.id
    is_client = appointment.client_id == user.id
    if not (is_owner or is_client):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para cancelar")

    appointment.status = AppointmentStatus.CANCELLED
    if slot:
        slot.status = SlotStatus.AVAILABLE
    db.commit()
    db.refresh(appointment)
    return appointment
