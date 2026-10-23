import { api } from "./client";
import type { AvailabilitySlot } from "../types";

export async function listAvailability(
  ownerId: number,
  onlyAvailable = true
): Promise<AvailabilitySlot[]> {
  const { data } = await api.get<AvailabilitySlot[]>("/availability", {
    params: { owner_id: ownerId, only_available: onlyAvailable },
  });
  return data;
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
