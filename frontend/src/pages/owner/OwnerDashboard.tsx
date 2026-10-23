import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { createService, deleteService, listServices } from "../../api/services";
import { createSlotsBulk, deleteSlot, listAvailability } from "../../api/availability";
import { ownerAppointments, cancelAppointment } from "../../api/appointments";
import type { Appointment, AvailabilitySlot, Service } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { appointmentStatusLabels, slotStatusLabels } from "../../utils/labels";

export function OwnerDashboard() {
  const { user, logout } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);

  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [slotMinutes, setSlotMinutes] = useState(30);

  useEffect(() => {
    if (!user) return;
    refreshAll();
  }, [user]);

  function refreshAll() {
    if (!user) return;
    listServices(user.id, false).then(setServices);
    listAvailability(user.id, false).then(setSlots);
    ownerAppointments().then(setAppointments);
  }

  async function handleCreateService(e: FormEvent) {
    e.preventDefault();
    await createService({ name: serviceName, duration_minutes: duration, price });
    setServiceName("");
    refreshAll();
  }

  async function handleDeleteService(id: number) {
    await deleteService(id);
    refreshAll();
  }

  async function handleCreateSlots(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    await createSlotsBulk({
      date: new Date(`${date}T00:00:00`).toISOString(),
      start_hour: startHour,
      end_hour: endHour,
      slot_minutes: slotMinutes,
    });
    refreshAll();
  }

  async function handleDeleteSlot(id: number) {
    await deleteSlot(id);
    refreshAll();
  }

  async function handleCancelAppointment(id: number) {
    await cancelAppointment(id);
    refreshAll();
  }

  return (
    <div className="dashboard">
      <header>
        <span>Olá, {user?.full_name}!</span>
        <div>
          <Link to="/owner/analytics">analytics</Link>
          <button onClick={logout}>Sair</button>
        </div>
      </header>

      <section>
        <h2>Disponibilizar serviços</h2>
        <form onSubmit={handleCreateService}>
          <label>
            Nome do serviço
            <input
              placeholder="nome do serviço"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </label>
          <label>
            Duração (min)
            <input
              type="number"
              placeholder="duração (min)"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
            />
          </label>
          <label>
            Preço (R$)
            <input
              type="number"
              placeholder="preço"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={0}
              step={0.01}
            />
          </label>
          <button type="submit">adicionar serviço</button>
        </form>
        <ul className="slot-list">
          {services.map((s) => (
            <li key={s.id}>
              {s.name} — {s.duration_minutes}min — R$ {s.price}
              <button onClick={() => handleDeleteService(s.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Disponibilizar horários</h2>
        <form onSubmit={handleCreateSlots}>
          <label>
            Data
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            Hora inicial
            <input
              type="number"
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              min={0}
              max={23}
            />
          </label>
          <label>
            Hora final
            <input
              type="number"
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              min={1}
              max={24}
            />
          </label>
          <label>
            Duração do horário (min)
            <input
              type="number"
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              min={5}
            />
          </label>
          <button type="submit">gerar horários</button>
        </form>
        <ul className="slot-list">
          {slots.map((slot) => (
            <li key={slot.id}>
              {new Date(slot.start_time).toLocaleString("pt-BR")} — {slotStatusLabels[slot.status]}
              {slot.status === "available" && (
                <button onClick={() => handleDeleteSlot(slot.id)}>remover</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Agendamentos recebidos</h2>
        {appointments.length === 0 ? (
          <p>Você ainda não tem horários reservados</p>
        ) : (
          <ul className="slot-list">
            {appointments.map((a) => (
              <li key={a.id}>
                #{a.id} — status: {appointmentStatusLabels[a.status]}
                {a.status === "scheduled" && (
                  <button onClick={() => handleCancelAppointment(a.id)}>cancelar</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
