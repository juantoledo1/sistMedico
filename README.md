# MedFlow Pro - SaaS de Gestión Médica

Sistema SaaS para médicos: gestión de guardias, procedimientos e interconsultas con seguimiento de ingresos.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: FastAPI + Python 3.11
- **Database**: MongoDB (Motor async)
- **Docker**: Contenedores para desarrollo

## Estructura

```
sist_med/
├── frontend/     # React app
├── backend/      # FastAPI app
├── docker/       # Docker configs
├── .env         # Variables de entorno (NUNCA subir a git)
└── .gitignore  # Archivos a ignorar
```

## Seguridad

- JWT con expiración de 15 minutos
- BCrypt para contraseñas (12 rounds)
- Multi-tenant: todas las queries filtradas por userId
- CORS estricto: solo orígenes permitidos
- Headers de seguridad (X-Frame-Options, HSTS, etc.)

## API Endpoints

| Método | Endpoint | Descripción |
|-------|----------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Obtener perfil |
| PUT | /api/auth/me | Actualizar perfil |
| POST | /api/auth/change-password | Cambiar contraseña |
| GET/POST | /api/actividades/ | CRUD actividades |
| GET | /api/actividades/stats | Estadísticas |

## Desarrollo

### Prerequisites

- Docker + Docker Compose
- Node.js 19+
- Python 3.11+ (para desarrollo local)

### Iniciar

```bash
# MongoDB
docker run -d --name medflow-mongo -p 27017:27017 mongo:latest

# Backend
cd backend && docker build -t medflow-api . 
docker run -d --name medflow-api -p 8000:8000 --network host -e MONGO_URI="mongodb://localhost:27017/medflow" medflow-api

# Frontend
cd frontend && npm install && npm run dev
```

### Variables de Entorno

`.env` (NUNCA subir a git):
```
MONGO_URI=mongodb://localhost:27017/medflow
SECRET_KEY=tu-key-secreta-min-32-caracteres
```

## Licencia

MIT