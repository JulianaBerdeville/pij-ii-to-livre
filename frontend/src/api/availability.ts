import { api } from "./client";
import type { AvailabilitySlot } from "../types";

export async function listAvailability(
  ownerId: number,
  onlyAvailable = true,
  serviceId?: number | null
): Promise<AvailabilitySlot[]> {
  const { data } = await api.get<AvailabilitySlot[]>("/availability", {
    params: { owner_id: ownerId, only_available: onlyAvailable, service_id: serviceId ?? undefined },
  });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return data.filter((slot) => new Date(slot.start_time) >= startOfToday);
}

export async function createSlotsBulk(payload: {
  date: string;
  start_hour: number;
  end_hour: number;
  slot_minutes: number;
}): Promise<AvailabilitySlot[]> {
  const { data } = await api.post<AvailabilitySlot[]>("/availability/bulk", payload);
  return data;
}

export async function deleteSlot(id: number): Promise<void> {
  await api.delete(`/availability/${id}`);
}
