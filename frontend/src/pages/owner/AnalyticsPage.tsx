import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getSummary,
  getByService,
  getByWeekday,
  getByHour,
  getTopClients,
  getRetention,
} from "../../api/analytics";
import type {
  SummaryData,
  ServiceCount,
  WeekdayCount,
  HourCount,
  TopClient,
  RetentionMonth,
} from "../../api/analytics";

const COLORS = ["#4f46e5", "#22c55e", "#f97316", "#ec4899", "#06b6d4", "#a855f7"];

export function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [byService, setByService] = useState<ServiceCount[]>([]);
  const [byWeekday, setByWeekday] = useState<WeekdayCount[]>([]);
  const [byHour, setByHour] = useState<HourCount[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [retention, setRetention] = useState<RetentionMonth[]>([]);

  useEffect(() => {
    getSummary().then(setSummary);
    getByService().then(setByService);
    getByWeekday().then(setByWeekday);
    getByHour().then(setByHour);
    getTopClients().then(setTopClients);
    getRetention().then(setRetention);
  }, []);

  return (
    <div className="dashboard">
      <header>
        <h1>Insights e comportamento dos clientes</h1>
        <Link to="/owner">Voltar</Link>
      </header>

      {summary && (
        <section className="summary-cards">
          <div className="card">
            <strong>{summary.total_appointments}</strong>
            <span>Agendamentos</span>
          </div>
          <div className="card">
            <strong>{summary.unique_clients}</strong>
            <span>Clientes únicos</span>
          </div>
          <div className="card">
            <strong>{(summary.cancellation_rate * 100).toFixed(1)}%</strong>
            <span>Taxa de cancelamento</span>
          </div>
          <div className="card">
            <strong>{summary.completed}</strong>
            <span>Concluídos</span>
          </div>
        </section>
      )}

      <section className="chart-grid">
        <div className="chart-box">
          <h2>Agendamentos por serviço</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byService} dataKey="count" nameKey="service_name" outerRadius={100} label>
                {byService.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Agendamentos por dia da semana</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byWeekday}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekday" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Agendamentos por horário</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Clientes novos x recorrentes por mês</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={retention}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="new_clients" name="Novos" fill="#06b6d4" />
              <Bar dataKey="returning_clients" name="Recorrentes" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2>Clientes mais frequentes</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Agendamentos</th>
              <th>Cancelamentos</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((c) => (
              <tr key={c.client_id}>
                <td>{c.client_name}</td>
                <td>{c.total_appointments}</td>
                <td>{c.cancellations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
