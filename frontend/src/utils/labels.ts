import type { AppointmentStatus, SlotStatus } from "../types";

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "agendado",
  completed: "concluído",
  cancelled: "cancelado",
};

export const slotStatusLabels: Record<SlotStatus, string> = {
  available: "disponível",
  booked: "reservado",
  blocked: "bloqueado",
};
