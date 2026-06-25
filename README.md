# MedFlow Pro

> SaaS de gestión financiera para guardias médicas. Dashboard, calendario y reportes.

MedFlow Pro ayuda a médicos a registrar y dar seguimiento a sus actividades — guardias, procedimientos e interconsultas — con cálculo automático de montos, dashboard financiero y reportes exportables.

## Features

| | |
|---|---|
| 📊 **Dashboard financiero** | Gráfico SVG de rendimiento mensual, balance, historial de transacciones |
| 📅 **Calendario de guardias** | Vista mensual con solapamientos, totales por día, edición inline |
| 📋 **Registro de actividades** | Guardias (activa/pasiva), procedimientos, interconsultas con cálculo automático |
| 🏥 **Gestión de instituciones** | CRUD con tarifas por tipo de actividad |
| 📄 **Reportes** | Filtros por período, institución, tipo; vista imprimible |
| 🔐 **Roles** | Usuario y administrador con panel de gestión de usuarios |
| 🌙 **Modo oscuro** | Soporte completo |
| 🌐 **Idioma** | Español e inglés |
| 📱 **Responsive** | Mobile y desktop |

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.11, Motor (MongoDB async) |
| Base de datos | MongoDB 7.0 |
| Infraestructura | Docker Compose |

## Inicio rápido

```bash
# 1. Clonar y configurar
cp .env.example .env

# 2. MongoDB + Backend
docker compose up -d

# 3. Frontend
cd frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/docs (Swagger)
- **Backend Health:** http://localhost:8000/health

## Estructura del proyecto

```
sist_med/
├── frontend/
│   ├── components/        # Feature-based components
│   │   ├── Auth/          # Login, Register
│   │   ├── Dashboard/     # Dashboard, chart, stats, transactions
│   │   ├── Calendar/      # Calendar grid, day panel, navigation
│   │   ├── ShiftForm/     # Activity creation form
│   │   ├── Reports/       # Reports view + filters + print
│   │   ├── Settings/      # Profile, password, preferences
│   │   ├── Admin/         # User management panel
│   │   └── ui/            # Button, Input, Card, Select, Modal
│   ├── hooks/             # Custom hooks (useAuth, useTransactions, useAppState)
│   ├── services/          # API client, Gemini, outbox
│   └── types.ts           # Shared TypeScript types
├── backend/
│   └── app/
│       ├── core/          # Security (JWT/bcrypt), dependencies, utilities
│       ├── db/            # MongoDB connection, indexes
│       ├── models/        # Pydantic models (User, Actividad, Institution)
│       ├── routers/       # API endpoints (auth, admin, actividades, institutions)
│       └── services/      # Business logic (auth service)
└── docker-compose.yml     # MongoDB + Backend
```

## Desarrollo

### Frontend conventions

- **Components:** máx. 200 líneas, máx. 3 `useState`, máx. 2 `useEffect`
- **Custom hooks:** toda la lógica de estado va en hooks, no en componentes
- **Forms:** siempre `useActionState` (React 19), nunca `useState` + submit manual
- **Styling:** `cn()` utility (clsx + tailwind-merge), mobile-first, dark mode
- **Types:** strict mode, no `any`, Props interface en cada componente
- **Estructura:** feature folders para vistas con 2+ archivos
- **Gráficos:** SVG nativo, sin librerías externas

### Backend conventions

- **Clean architecture:** routers (HTTP) → services (lógica) → db (datos)
- **Auth:** JWT con access + refresh tokens, bcrypt (12 rounds)
- **Rate limiting:** slowapi por IP en endpoints críticos
- **Multi-tenant:** cada query filtra por `userId` del token
- **Validación:** Pydantic models con regex, rangos, model_validators

### Base de datos

MongoDB 7.0 con Motor async. Colecciones: `users`, `actividades`, `institutions`.

## API

Documentación Swagger completa en `/docs` con el servidor corriendo.

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/register` | Registro de usuario |
| `POST /api/auth/login` | Inicio de sesión |
| `POST /api/auth/refresh` | Renovar token |
| `GET /api/auth/me` | Perfil del usuario |
| `PUT /api/auth/me` | Actualizar perfil |
| `POST /api/auth/change-password` | Cambiar contraseña |
| `GET/POST /api/actividades/` | Listar / Crear actividades |
| `GET /api/actividades/stats` | Estadísticas agregadas |
| `GET/PUT/DELETE /api/actividades/{id}` | CRUD actividad individual |
| `GET/POST /api/institutions/` | Listar / Crear instituciones |
| `PUT/DELETE /api/institutions/{id}` | CRUD institución individual |

## Licencia

MIT
