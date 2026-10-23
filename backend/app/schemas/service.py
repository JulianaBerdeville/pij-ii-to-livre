from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    duration_minutes: int = Field(gt=0, default=30)
    price: float = Field(ge=0, default=0)


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, ge=0)
    active: bool | None = None


class ServiceRead(BaseModel):
    id: int
    owner_id: int
    name: str
    description: str | None
    duration_minutes: int
    price: float
    active: bool

    model_config = {"from_attributes": True}
