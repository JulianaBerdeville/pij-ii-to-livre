import { useEffect, useState } from "react";
import { listOwners } from "../../api/owners";
import { listServices } from "../../api/services";
import { listAvailability } from "../../api/availability";
import { bookAppointment, myAppointments, cancelAppointment } from "../../api/appointments";
import type { Appointment, AvailabilitySlot, Service, User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { appointmentStatusLabels } from "../../utils/labels";

export function ClientDashboard() {
  const { user, logout } = useAuth();
  const [owners, setOwners] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);
  const [message, setMessage] = useState<string | null>(null);

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
    listAvailability(ownerId, true).then(setSlots);
  }, [ownerId]);

  function refreshMyAppointments() {
    myAppointments().then(setMyAppts);
  }

  async function handleBook(slotId: number) {
    if (!serviceId) {
      setMessage("Selecione um serviço antes de agendar.");
      return;
    }
    try {
      await bookAppointment({ slot_id: slotId, service_id: serviceId });
      setMessage("Agendamento realizado com sucesso!");
      if (ownerId) listAvailability(ownerId, true).then(setSlots);
      refreshMyAppointments();
    } catch {
      setMessage("Não foi possível agendar esse horário.");
    }
  }

  async function handleCancel(id: number) {
    await cancelAppointment(id);
    refreshMyAppointments();
    if (ownerId) listAvailability(ownerId, true).then(setSlots);
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Olá, {user?.full_name}</h1>
        <button onClick={logout}>Sair</button>
      </header>

      <section>
        <h2>Escolha o profissional</h2>
        <select value={ownerId ?? ""} onChange={(e) => setOwnerId(Number(e.target.value))}>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2>Escolha o serviço</h2>
        <select value={serviceId ?? ""} onChange={(e) => setServiceId(Number(e.target.value))}>
          <option value="">Selecione...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.duration_minutes}min — R$ {s.price}
            </option>
          ))}
        </select>
      </section>

      {message && <p className="info">{message}</p>}

      <section>
        <h2>Horários disponíveis</h2>
        <ul className="slot-list">
          {slots.map((slot) => (
            <li key={slot.id}>
              {new Date(slot.start_time).toLocaleString("pt-BR")}
              <button onClick={() => handleBook(slot.id)}>Agendar</button>
            </li>
          ))}
          {slots.length === 0 && <p>Nenhum horário disponível.</p>}
        </ul>
      </section>

      <section>
        <h2>Meus agendamentos</h2>
        <ul className="slot-list">
          {myAppts.map((a) => (
            <li key={a.id}>
              #{a.id} — status: {appointmentStatusLabels[a.status]}
              {a.status === "scheduled" && <button onClick={() => handleCancel(a.id)}>Cancelar</button>}
            </li>
          ))}
          {myAppts.length === 0 && <p>Você não agendou nenhum horário</p>}
        </ul>
      </section>
    </div>
  );
}
