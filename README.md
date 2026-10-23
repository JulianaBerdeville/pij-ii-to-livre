# Tô Livre

Plataforma de agendamento com duas visões:
- **Cliente**: visualiza a agenda de horários disponíveis de um proprietário/barbeiro e agenda serviços (corte, barba, etc).
- **Proprietário**: define horários disponíveis na agenda, gerencia serviços e recebe insights gráficos (pizza, barras) e análises de comportamento dos clientes.

## Stack

- **Backend**: Python (FastAPI), SQLAlchemy, PostgreSQL, JWT (auth), Pandas (analytics).
- **Frontend**: React + TypeScript (Vite), React Router, Axios, Recharts.

## Estrutura

```
backend/    -> API FastAPI
frontend/   -> SPA React
```

## Como executar

### Backend (Docker)

Requer apenas o [Docker](https://www.docker.com/products/docker-desktop/). Na raiz do projeto:

```bash
docker compose up --build
```

Isso sobe o PostgreSQL e a API, sem instalar Python nem configurar `.env`. Para parar: `Ctrl+C` (ou `docker compose down`; adicione `-v` para apagar os dados do banco).


A API sobe em `http://localhost:8000` (docs em `/docs`). As tabelas são criadas automaticamente no startup (via `Base.metadata.create_all`); para produção, migrar para Alembic é recomendado.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

SPA sobe em `http://localhost:5173`, consumindo a API em `http://localhost:8000` (configurável em `frontend/.env` via `VITE_API_URL`).

## Domínio

- `User` (role: `client` | `owner`)
- `Service` (nome, duração, preço) — pertence a um `owner`
- `AvailabilitySlot` (horário disponível criado pelo `owner`)
- `Appointment` (agendamento de um `client` em um `slot`, para um `service`)

## Analytics / simulação de análise comportamental

Endpoints em `/analytics/*` (somente `owner`):
- `summary`: totais gerais (agendamentos, clientes, taxa de cancelamento)
- `by-service`: distribuição por serviço (gráfico de pizza)
- `by-weekday`: distribuição por dia da semana (gráfico de barras)
- `by-hour`: distribuição por horário do dia (gráfico de barras)
- `top-clients`: clientes mais frequentes
- `client-retention`: clientes novos vs recorrentes por mês

Esses endpoints usam Pandas para agregações e podem evoluir para modelos mais avançados (ex: clusterização de clientes, previsão de no-show).
