from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, appointments, auth, availability, owners, services
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Garante que os models sejam registrados no metadata antes do create_all
from app.models import appointment, availability as availability_model, service, user  # noqa: F401

app = FastAPI(title="Tô Livre API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(owners.router)
app.include_router(services.router)
app.include_router(availability.router)
app.include_router(appointments.router)
app.include_router(analytics.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
