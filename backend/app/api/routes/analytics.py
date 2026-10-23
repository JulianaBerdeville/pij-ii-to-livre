import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_owner
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.availability import AvailabilitySlot
from app.models.service import Service
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])

WEEKDAYS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


def _owner_appointments_df(db: Session, owner_id: int) -> pd.DataFrame:
    rows = (
        db.query(
            Appointment.id,
            Appointment.client_id,
            Appointment.status,
            Appointment.created_at,
            Service.name.label("service_name"),
            AvailabilitySlot.start_time,
        )
        .join(AvailabilitySlot, Appointment.slot_id == AvailabilitySlot.id)
        .join(Service, Appointment.service_id == Service.id)
        .filter(AvailabilitySlot.owner_id == owner_id)
        .all()
    )
    return pd.DataFrame(rows, columns=["id", "client_id", "status", "created_at", "service_name", "start_time"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    df = _owner_appointments_df(db, owner.id)
    if df.empty:
        return {"total_appointments": 0, "unique_clients": 0, "cancellation_rate": 0.0, "completed": 0}

    total = len(df)
    cancelled = int((df["status"] == AppointmentStatus.CANCELLED.value).sum())
    completed = int((df["status"] == AppointmentStatus.COMPLETED.value).sum())
    return {
        "total_appointments": total,
        "unique_clients": int(df["client_id"].nunique()),
        "cancellation_rate": round(cancelled / total, 3) if total else 0.0,
        "completed": completed,
    }


@router.get("/by-service")
def by_service(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    df = _owner_appointments_df(db, owner.id)
    if df.empty:
        return []
    counts = df.groupby("service_name").size().reset_index(name="count")
    return counts.to_dict(orient="records")


@router.get("/by-weekday")
def by_weekday(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    df = _owner_appointments_df(db, owner.id)
    if df.empty:
        return [{"weekday": day, "count": 0} for day in WEEKDAYS_PT]
    df["weekday_idx"] = pd.to_datetime(df["start_time"]).dt.dayofweek
    counts = df.groupby("weekday_idx").size()
    return [{"weekday": WEEKDAYS_PT[i], "count": int(counts.get(i, 0))} for i in range(7)]


@router.get("/by-hour")
def by_hour(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    df = _owner_appointments_df(db, owner.id)
    if df.empty:
        return [{"hour": h, "count": 0} for h in range(24)]
    df["hour"] = pd.to_datetime(df["start_time"]).dt.hour
    counts = df.groupby("hour").size()
    return [{"hour": h, "count": int(counts.get(h, 0))} for h in range(24)]


@router.get("/top-clients")
def top_clients(limit: int = 10, db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    df = _owner_appointments_df(db, owner.id)
    if df.empty:
        return []
    counts = (
        df.groupby("client_id")
        .agg(total_appointments=("id", "count"), cancellations=("status", lambda s: (s == AppointmentStatus.CANCELLED.value).sum()))
        .reset_index()
        .sort_values("total_appointments", ascending=False)
        .head(limit)
    )
    client_ids = counts["client_id"].tolist()
    clients = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(client_ids)).all()}
    counts["client_name"] = counts["client_id"].map(clients)
    return counts.to_dict(orient="records")


@router.get("/client-retention")
def client_retention(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    """Compara clientes novos x recorrentes por mês, para análise de comportamento."""
    df = _owner_appointments_df(db, owner.id)
    if df.empty:
        return []

    df["created_at"] = pd.to_datetime(df["created_at"])
    df["month"] = df["created_at"].dt.to_period("M").astype(str)
    first_seen = df.groupby("client_id")["created_at"].min().dt.to_period("M").astype(str)

    results = []
    for month, group in df.groupby("month"):
        client_ids = group["client_id"].unique()
        new_clients = sum(1 for cid in client_ids if first_seen[cid] == month)
        returning_clients = len(client_ids) - new_clients
        results.append({"month": month, "new_clients": new_clients, "returning_clients": returning_clients})

    return sorted(results, key=lambda r: r["month"])
