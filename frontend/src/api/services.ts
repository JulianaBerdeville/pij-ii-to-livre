import { api } from "./client";
import type { Service } from "../types";

export async function listServices(ownerId?: number, activeOnly = true): Promise<Service[]> {
  const { data } = await api.get<Service[]>("/services", {
    params: { owner_id: ownerId, active_only: activeOnly },
  });
  return data;
}

export async function createService(payload: {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
}): Promise<Service> {
  const { data } = await api.post<Service>("/services", payload);
  return data;
}

export async function deleteService(id: number): Promise<void> {
  await api.delete(`/services/${id}`);
}
