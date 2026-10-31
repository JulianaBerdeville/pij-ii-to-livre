import { api } from "./client";
import type { Appointment } from "../types";

export async function bookAppointment(payload: {
  slot_id: number;
  service_id: number;
  notes?: string;
}): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", payload);
  return data;
}

export async function myAppointments(): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments/me");
  return data;
}

export async function ownerAppointments(): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments/owner");
  return data;
}

export async function completeAppointment(id: number): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/complete`);
  return data;
}

export async function cancelAppointment(id: number): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/cancel`);
  return data;
}
