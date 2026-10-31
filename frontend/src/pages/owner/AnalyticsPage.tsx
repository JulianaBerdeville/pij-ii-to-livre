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
  getTimeByService,
  getTopClients,
  getRetention,
} from "../../api/analytics";
import type {
  SummaryData,
  ServiceCount,
  ServiceTime,
  WeekdayCount,
  HourCount,
  TopClient,
  RetentionMonth,
} from "../../api/analytics";

const COLORS = ["#6d6037", "#6b80ac", "#79a377", "#8b5f75", "#a36f56", "#703131"];

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return minutes === 0 ? "0" : `${minutes}min`;
  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, "0")}min`;
}

// Marcadores em horas cheias, com no máximo ~4 intervalos
function hourTicks(maxMinutes: number): number[] {
  const maxHours = Math.max(1, Math.ceil(maxMinutes / 60));
  const stepHours = Math.ceil(maxHours / 4);
  const ticks: number[] = [];
  for (let h = 0; h <= maxHours + stepHours - 1; h += stepHours) {
    ticks.push(h * 60);
    if (h >= maxHours) break;
  }
  return ticks;
}

export function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [byService, setByService] = useState<ServiceCount[]>([]);
  const [byWeekday, setByWeekday] = useState<WeekdayCount[]>([]);
  const [byHour, setByHour] = useState<HourCount[]>([]);
  const [timeByService, setTimeByService] = useState<ServiceTime[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [retention, setRetention] = useState<RetentionMonth[]>([]);

  useEffect(() => {
    getSummary().then(setSummary);
    getByService().then(setByService);
    getByWeekday().then(setByWeekday);
    getByHour().then(setByHour);
    getTimeByService().then(setTimeByService);
    getTopClients().then(setTopClients);
    getRetention().then(setRetention);
  }, []);

  const timeTicks = hourTicks(Math.max(0, ...timeByService.map((s) => s.total_minutes)));

  return (
    <div className="dashboard">
      <header>
        <h1>Painel analítico</h1>
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
          <div className="card card-tooltip">
            <strong>{(summary.cancellation_rate * 100).toFixed(1)}%</strong>
            <span>Taxa de cancelamento</span>
            <div className="recharts-like-tooltip" role="tooltip">
              <p>Cancelamentos</p>
              <span>
                Total : {Math.round(summary.cancellation_rate * summary.total_appointments)}
              </span>
            </div>
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
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie data={byService} dataKey="count" nameKey="service_name" outerRadius={120} label>
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
              <Bar dataKey="count" fill="#6b80ac" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Agendamentos por horário</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`} />
              <YAxis
                width={100}
                allowDecimals={false}
                label={{ value: "agendamentos", angle: -90, position: "insideLeft", offset: 15 }}
              />
              <Tooltip labelFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`} />
              <Bar dataKey="count" fill="#79a377" />
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
              <Bar dataKey="new_clients"               name="Novos" fill="#6b80ac" />
                            <Bar dataKey="returning_clients" name="Recorrentes" fill="#8b5f75" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Tempo gasto por serviço</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timeByService} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                ticks={timeTicks}
                domain={[0, timeTicks[timeTicks.length - 1]]}
                tickFormatter={formatDuration}
                label={{ value: "tempo", position: "insideBottom", offset: -4 }}
              />
              <YAxis type="category" dataKey="service_name" width={130} interval={0} />
              <Tooltip formatter={(value) => [formatDuration(Number(value)), "Tempo total"]} />
              <Bar dataKey="total_minutes" name="Tempo total" fill="#a36f56" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Clientes mais frequentes</h2>
          <ResponsiveContainer width="100%" height={Math.max(220, topClients.length * 60 + 80)}>
            <BarChart data={topClients} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="client_name" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_appointments"               name="Agendamentos" fill="#6b80ac" />
                            <Bar dataKey="cancellations" name="Cancelamentos" fill="#703131" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
