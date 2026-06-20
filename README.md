# MedFlow Pro

SaaS de gestión de guardias médicas con dashboard financiero.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript 5.8 + Vite 6 |
| Estilos | Tailwind CSS 4.2 |
| Backend | FastAPI + Python 3.11 |
| Base de datos | MongoDB 7.0 (Motor async) |
| Infra | Docker Compose (3 servicios) |

## Inicio rápido

```bash
cp .env.example .env        # configurar variables
docker compose up -d        # MongoDB + Backend

cd frontend
npm install
npm run dev                 # http://localhost:5174
```

- Backend: `http://localhost:8000/docs` (Swagger)
- Frontend: `http://localhost:5174`

## Estructura

```
sist_med/
├── frontend/
│   ├── components/         # Feature-based folders
│   │   ├── Auth/           # Login, Register
│   │   ├── Admin/          # Admin panel + useAdminUsers hook
│   │   ├── Calendar/       # CalendarView, CalendarNav, CalendarGrid, DayDetailsPanel
│   │   ├── Dashboard/      # Dashboard + subcomponentes
│   │   ├── Reports/        # ReportsView + useReportsFilters hook
│   │   ├── Settings/       # SettingsView, modals
│   │   ├── ShiftForm/      # ShiftForm + ExtraActivitiesList + useShiftForm
│   │   └── ui/             # Button, Input, Card, Select, Label, ConfirmModal
│   ├── hooks/              # useAuth, useTransactions, useAppState
│   ├── services/           # api.ts, gemini.ts, outbox.ts
│   └── types.ts            # Interfaces, enums, tipos compartidos
├── backend/
│   └── app/                # FastAPI: routers, models, services, db
└── docker-compose.yml      # MongoDB + Backend + Frontend
```

## Frontend conventions

- **React 19**: components <200 lines, <3 useState, <2 useEffect, Props interface
- **Hooks extracted**: stateful logic in custom hooks, components pure presentation
- **Feature folders**: each view with 2+ files grouped in its own directory
- **Styling**: `cn()` utility, mobile-first, dark mode support
- **Types**: strict mode, no `any`, typed props everywhere

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Perfil |
| GET/POST | `/api/actividades/` | CRUD actividades |
| GET | `/api/actividades/stats` | Estadísticas |
| GET/POST | `/api/institutions/` | CRUD instituciones |

## Seguridad

- JWT (access + refresh tokens)
- BCrypt (12 rounds)
- Multi-tenant por userId
- Rate limiting, security headers
- CORS restringido
