from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_owner
from app.db.session import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceRead])
def list_services(owner_id: int | None = None, active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Service)
    if owner_id is not None:
        query = query.filter(Service.owner_id == owner_id)
    if active_only:
        query = query.filter(Service.active.is_(True))
    return query.order_by(Service.name).all()


@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)
):
    service = Service(owner_id=owner.id, **payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    service = db.query(Service).filter(Service.id == service_id, Service.owner_id == owner.id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    service = db.query(Service).filter(Service.id == service_id, Service.owner_id == owner.id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    db.delete(service)
    db.commit()
