from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserRead

router = APIRouter(prefix="/owners", tags=["owners"])


@router.get("", response_model=list[UserRead])
def list_owners(db: Session = Depends(get_db)):
    """Lista pública de proprietários, para o cliente escolher de qual agenda agendar."""
    return db.query(User).filter(User.role == UserRole.OWNER).order_by(User.full_name).all()
