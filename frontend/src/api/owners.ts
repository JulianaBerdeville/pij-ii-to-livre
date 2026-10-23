import { api } from "./client";
import type { User } from "../types";

export async function listOwners(): Promise<User[]> {
  const { data } = await api.get<User[]>("/owners");
  return data;
}
