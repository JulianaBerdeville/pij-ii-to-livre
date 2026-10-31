from datetime import datetime

from pydantic import BaseModel

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    slot_id: int
    service_id: int
    notes: str | None = None


class AppointmentRead(BaseModel):
    id: int
    client_id: int
    service_id: int
    slot_id: int
    start_time: datetime
    status: AppointmentStatus
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
