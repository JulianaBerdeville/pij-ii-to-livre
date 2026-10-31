import { api } from "./client";

export interface SummaryData {
  total_appointments: number;
  unique_clients: number;
  cancellation_rate: number;
  completed: number;
}

export interface ServiceCount {
  service_name: string;
  count: number;
}

export interface WeekdayCount {
  weekday: string;
  count: number;
}

export interface HourCount {
  hour: number;
  count: number;
}

export interface ServiceTime {
  service_name: string;
  total_minutes: number;
  appointments: number;
}

export interface TopClient {
  client_id: number;
  client_name: string;
  total_appointments: number;
  cancellations: number;
}

export interface RetentionMonth {
  month: string;
  new_clients: number;
  returning_clients: number;
}

export async function getSummary(): Promise<SummaryData> {
  const { data } = await api.get<SummaryData>("/analytics/summary");
  return data;
}

export async function getByService(): Promise<ServiceCount[]> {
  const { data } = await api.get<ServiceCount[]>("/analytics/by-service");
  return data;
}

export async function getTimeByService(): Promise<ServiceTime[]> {
  const { data } = await api.get<ServiceTime[]>("/analytics/time-by-service");
  return data;
}

export async function getByWeekday(): Promise<WeekdayCount[]> {
  const { data } = await api.get<WeekdayCount[]>("/analytics/by-weekday");
  return data;
}

export async function getByHour(): Promise<HourCount[]> {
  const { data } = await api.get<HourCount[]>("/analytics/by-hour");
  return data;
}

export async function getTopClients(): Promise<TopClient[]> {
  const { data } = await api.get<TopClient[]>("/analytics/top-clients");
  return data;
}

export async function getRetention(): Promise<RetentionMonth[]> {
  const { data } = await api.get<RetentionMonth[]>("/analytics/client-retention");
  return data;
}
