from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.availability import AvailabilitySlot, SlotStatus


def covering_run(slots: list[AvailabilitySlot], start_index: int, duration_minutes: int) -> list[AvailabilitySlot] | None:
    """Slots consecutivos e livres, a partir de slots[start_index] (ordenados por início), que cobrem a duração."""
    needed_end = slots[start_index].start_time + timedelta(minutes=duration_minutes)
    run: list[AvailabilitySlot] = []
    cursor = slots[start_index].start_time
    for slot in slots[start_index:]:
        if slot.start_time != cursor:
            return None
        run.append(slot)
        cursor = slot.end_time
        if cursor >= needed_end:
            return run
    return None


def slots_to_book(db: Session, first_slot: AvailabilitySlot, duration_minutes: int) -> list[AvailabilitySlot] | None:
    needed_end = first_slot.start_time + timedelta(minutes=duration_minutes)
    candidates = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.owner_id == first_slot.owner_id,
            AvailabilitySlot.status == SlotStatus.AVAILABLE,
            AvailabilitySlot.start_time >= first_slot.start_time,
            AvailabilitySlot.start_time < needed_end,
        )
        .order_by(AvailabilitySlot.start_time)
        .all()
    )
    if not candidates or candidates[0].id != first_slot.id:
        return None
    return covering_run(candidates, 0, duration_minutes)


def release_slots(db: Session, appointment: Appointment, first_slot: AvailabilitySlot) -> None:
    """Libera o horário do agendamento e os seguintes ocupados pela duração do serviço."""
    needed_end = first_slot.start_time + timedelta(minutes=appointment.service.duration_minutes)
    covered = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.owner_id == first_slot.owner_id,
            AvailabilitySlot.status == SlotStatus.BOOKED,
            AvailabilitySlot.start_time >= first_slot.start_time,
            AvailabilitySlot.start_time < needed_end,
        )
        .all()
    )
    for slot in covered:
        # horários extras não têm agendamento próprio; os que têm pertencem a outro atendimento
        if slot.id == first_slot.id or slot.appointment is None:
            slot.status = SlotStatus.AVAILABLE
