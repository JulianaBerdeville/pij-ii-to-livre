export type UserRole = "client" | "owner";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
}

export interface Service {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
}

export type SlotStatus = "available" | "booked" | "blocked";

export interface AvailabilitySlot {
  id: number;
  owner_id: number;
  start_time: string;
  end_time: string;
  status: SlotStatus;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: number;
  client_id: number;
  service_id: number;
  slot_id: number;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}
