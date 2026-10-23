from datetime import datetime

from pydantic import BaseModel

from app.models.availability import SlotStatus


class AvailabilitySlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime


class AvailabilityBulkCreate(BaseModel):
    date: datetime
    start_hour: int
    end_hour: int
    slot_minutes: int = 30


class AvailabilitySlotRead(BaseModel):
    id: int
    owner_id: int
    start_time: datetime
    end_time: datetime
    status: SlotStatus

    model_config = {"from_attributes": True}
