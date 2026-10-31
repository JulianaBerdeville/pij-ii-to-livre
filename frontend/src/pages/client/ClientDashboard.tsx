import { useEffect, useState } from "react";
import { listOwners } from "../../api/owners";
import { listServices } from "../../api/services";
import { listAvailability } from "../../api/availability";
import { bookAppointment, myAppointments, cancelAppointment } from "../../api/appointments";
import type { Appointment, AvailabilitySlot, Service, User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { appointmentStatusLabels } from "../../utils/labels";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ClientDashboard() {
  const { user, logout } = useAuth();
  const [owners, setOwners] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    listOwners().then((data) => {
      setOwners(data);
      if (data.length > 0) setOwnerId(data[0].id);
    });
    refreshMyAppointments();
  }, []);

  useEffect(() => {
    if (ownerId === null) return;
    listServices(ownerId).then(setServices);
  }, [ownerId]);

  useEffect(() => {
    if (ownerId === null) return;
    listAvailability(ownerId, true, serviceId).then(setSlots);
  }, [ownerId, serviceId]);

  function refreshMyAppointments() {
    myAppointments().then(setMyAppts);
  }

  const slotsByDate = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const key = dateKey(new Date(slot.start_time));
    slotsByDate.set(key, [...(slotsByDate.get(key) ?? []), slot]);
  }

  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  useEffect(() => {
    if (selectedDate && !slotsByDate.has(selectedDate)) {
      setSelectedDate(null);
      setSelectedSlotId(null);
    } else if (selectedSlotId !== null && !slots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(null);
    }
  }, [slots]);

  async function handleBook(slotId: number) {
    if (!serviceId) {
      setMessage("Selecione um serviço antes de agendar.");
      return;
    }
    try {
      await bookAppointment({ slot_id: slotId, service_id: serviceId });
      setMessage("Agendamento realizado com sucesso!");
      setSelectedSlotId(null);
      if (ownerId) listAvailability(ownerId, true, serviceId).then(setSlots);
      refreshMyAppointments();
    } catch {
      setMessage("Não foi possível agendar esse horário.");
      if (ownerId) listAvailability(ownerId, true, serviceId).then(setSlots);
    }
  }

  async function handleCancel(id: number) {
    await cancelAppointment(id);
    refreshMyAppointments();
    if (ownerId) listAvailability(ownerId, true, serviceId).then(setSlots);
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Olá, {user?.full_name}</h1>
        <button onClick={logout}>Sair</button>
      </header>

      <section className="selectors">
        <div>
          <h2>Escolha o profissional</h2>
          <select value={ownerId ?? ""} onChange={(e) => setOwnerId(Number(e.target.value))}>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2>Escolha o serviço</h2>
          <select value={serviceId ?? ""} onChange={(e) => setServiceId(Number(e.target.value))}>
            <option value="">Selecione...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.duration_minutes}min — R$ {s.price}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <h2>Escolha a data e o horário</h2>
        <div className="scheduler">
          <div className="calendar">
            <div className="calendar-nav">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
              <strong>{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="calendar-grid">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <span key={i} className="calendar-weekday">
                  {d}
                </span>
              ))}
              {calendarCells.map((day, i) => {
                if (day === null) return <span key={i} />;
                const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
                const available = slotsByDate.has(key);
                return (
                  <button
                    key={i}
                    disabled={!available}
                    className={`calendar-day${key === selectedDate ? " selected" : ""}`}
                    onClick={() => {
                      setSelectedDate(key);
                      setSelectedSlotId(null);
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="time-picker">
            {selectedDate === null ? (
              <p>Selecione uma data no calendário.</p>
            ) : (
              <div className="time-grid">
                {(slotsByDate.get(selectedDate) ?? []).map((slot) => (
                  <button
                    key={slot.id}
                    className={`time-slot${slot.id === selectedSlotId ? " selected" : ""}`}
                    onClick={() => setSelectedSlotId(slot.id)}
                  >
                    {new Date(slot.start_time).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            )}
            <button
              disabled={selectedSlotId === null}
              title={selectedSlotId === null ? "Selecione uma data e um horário" : undefined}
              onClick={() => selectedSlotId && handleBook(selectedSlotId)}
            >
              Agendar
            </button>
            {message && <p className="info" role="status">{message}</p>}
          </div>
        </div>
        {slots.length === 0 && <p>Nenhum horário disponível.</p>}
      </section>

      <section>
        <h2>Meus agendamentos</h2>
        <ul className="slot-list">
          {myAppts.slice(0, 5).map((a) => (
            <li key={a.id}>
              {formatDateTime(a.start_time)} ({appointmentStatusLabels[a.status]})
              {a.status === "scheduled" && <button onClick={() => handleCancel(a.id)}>Cancelar</button>}
            </li>
          ))}
          {myAppts.length === 0 && <p>Você não agendou nenhum horário</p>}
        </ul>
      </section>
    </div>
  );
}
