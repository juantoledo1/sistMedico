# AI.md - Fuente de Verdad para MedFlow Pro

> **REGLA CRÍTICA**: Cada vez que hagas un cambio estructural, agregues una librería o completes una funcionalidad, DEBES ACTUALIZAR ESTE ARCHIVO para que siempre esté alineado.

---

## 1. Propósito del Proyecto

**MedFlow Pro** es un SaaS para médicos: gestión de guardias, procedimientos e interconsultas con seguimiento de ingresos.

Permite a los médicos registrar sus actividades laborales, calcular automáticamente sus earnings y llevar un seguimiento de pagos pendientes/cobrados.

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|-------------|---------|----------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Tipado estático |
| Vite | 6.x | Build tool |
| Tailwind CSS | 3.x | Estilos (via classes) |
| Lucide React | latest | Iconos |

### Backend
| Tecnología | Versión | Propósito |
|-------------|---------|----------|
| FastAPI | 0.109+ | API Framework |
| Python | 3.11 | Runtime |
| MongoDB | latest | Base de datos |
| Motor | 3.3+ | Driver async |
| python-jose | 3.3+ | JWT tokens |
| passlib + bcrypt | 4.0.1 | Hash de contraseñas |
| Pydantic | 2.5+ | Validación de datos |
| slowapi | 0.1.9 | Rate limiting (PENDIENTE implementar) |

### Infraestructura
| Tecnología | Propósito |
|-------------|----------|
| Docker | Contenedores |
| Docker Compose | Orquestación |
| MongoDB local | Desarrollo |
| MongoDB Atlas | Producción (pendiente) |

---

## 3. Estructura de Carpetas

```
sist_med/                     # RAÍZ DEL PROYECTO
│
├── frontend/                 # APLICACIÓN REACT
│   ├── src/                  # ✦ CÓDIGO FUENTE ✦
│   │   ├── components/       # Componentes React adicionales
│   │   ├── services/        # API calls (api.ts)
│   │   └── (types.ts)       # ✦ MOVER A RAÍZ SI ESTÁ DUPLICADO ✦
│   ├── components/          # Componentes UI (Dashboard, Forms, etc.)
│   ├── services/           # ✦ DUPLICADO - usar src/services ✦
│   ├── lib/               # Utilidades (utils.ts)
│   ├── App.tsx            # ✦ COMPONENTE PRINCIPAL ✦
│   ├── types.ts           # Tipos TypeScript
│   ├── translations.ts   # i18n
│   ├── package.json       # Dependencias npm
│   ├── tsconfig.json     # Config TypeScript
│   ├── vite.config.ts    # Config Vite
│   └── index.html       # Entry HTML
│
├── backend/                 # API FASTAPI
│   ├── app/               # ✦ CÓDIGO FUENTE ✦
│   │   ├── __init__.py   # Package marker
│   │   ├── main.py      # ✦ ENTRY POINT ✦ (FastAPI app)
│   │   ├── config.py    # Configuración (settings)
│   │   ├── routers/     # ✦ ENDPOINTS ✦
│   │   │   ├── __init__.py
│   │   │   ├── auth.py        # /api/auth/* (register, login, me, change-password)
│   │   │   └── actividades.py # /api/actividades/* (CRUD + stats)
│   │   ├── models/       # ✦ MODELOS PYDANTIC ✦
│   │   │   ├── __init__.py
│   │   │   ├── user.py      # UserCreate, UserResponse
│   │   │   └── actividad.py # ActividadCreate, ActividadResponse
│   │   ├── services/    # ✦ LÓGICA DE NEGOCIO ✦
│   │   │   ├── __init__.py
│   │   │   └── auth.py      # hash_password, verify_password, JWT
│   │   └── db/          # ✦ CONEXIÓN DB ✦
│   │       ├── __init__.py
│   │       └── mongo.py   # MongoDB connection
│   ├── requirements.txt  # Dependencias pip
│   └── Dockerfile        # Imagen Docker
│
├���─ docker/                  # Configs Docker adicionales
│   └── mongo-seed/        # Scripts de seed
│
├── .env                    # ✦ SECRETOS - NUNCA SUBIR A GIT ✦
├── .env.example           # Plantilla de variables
├── .gitignore            # Archivos ignorados
├── docker-compose.yml    # Orquestación Docker
├── README.md            # Documentación general
└── ai.md               # ✦ ESTE ARCHIVO ✦
```

---

## 4. Convenciones de Código

### Frontend (React + TypeScript)

| Convención | Ejemplo | Uso |
|-----------|--------|-----|
| Componentes | `Dashboard.tsx`, `StatsView.tsx` | PascalCase, archivo = nombre componente |
| Funciones/Hooks | `useAuth`, `fetchData` | camelCase |
| Interfaces/Types | `Actividad`, `UserProfile` | PascalCase |
| Constantes | `API_BASE`, `MAX_RETRIES` | UPPER_SNAKE_CASE |
| Estilos | Tailwind CSS classes | NO archivos CSS separados |
| Rutas API | `/api/auth/login`, `/api/actividades/` | REST standard |
| Estados | `isLoading`, `error`, `data` | Prefijos claros |

### Backend (FastAPI + Python)

| Convención | Ejemplo | Uso |
|-----------|--------|-----|
| Rutas/Functions | `def get_me`, `async def login` | snake_case |
| Models/Classes | `class UserCreate`, `class ActividadResponse` | PascalCase |
| Variables | `user_id`, `access_token` | snake_case |
| DB Collections | `users`, `actividades` | snake_case, plural |
| Multi-tenant | `{"userId": user_id}` | SIEMPRE incluir en queries |
| Headers | `Authorization: Bearer {token}` | JWT en header |

### Reglas de Oro

1. **Seguridad**: JWT obligatorio en todas las rutas protected
2. **Multi-tenant**: Toda query a MongoDB debe incluir `{"userId": user_id}` del token
3. **Tipado**: Usar Pydantic en backend, TypeScript interfaces en frontend
4. **Errores**: Manejar try/catch, devolver mensajes claros
5. **Secrets**: NUNCA hardcodear, usar variables de entorno

---

## 5. Estado Actual y Tareas

### ✅ Completado (Working)

- [x] Registro de usuarios (`POST /api/auth/register`)
- [x] Login con JWT (`POST /api/auth/login`)
- [x] Obtener perfil (`GET /api/auth/me`)
- [x] Actualizar perfil (`PUT /api/auth/me`)
- [x] Cambiar contraseña (`POST /api/auth/change-password`)
- [x] CRUD Actividades (`GET/POST/PUT/DELETE /api/actividades/`)
- [x] Estadísticas (`GET /api/actividades/stats`)
- [x] Multi-tenant isolation (todas las queries filtradas por userId)
- [x] Security headers (X-Frame-Options, HSTS, etc.)
- [x] CORS estricto (solo orígenes permitidos)
- [x] Frontend conectado a Backend API
- [x] Docker containers (MongoDB + Backend)
- [x] Git initialized with .gitignore

### ❌ Pendiente (To Do) - PRIORIDAD

- [ ] **Rate Limiting** (slowapi en requirements pero NO implementado) - CRÍTICO para producción
- [ ] HttpOnly Cookies para tokens (MEJORA seguridad)
- [ ] Tests (backend: pytest)
- [ ] Exportar a PDF/Excel (descarga manual)

### ⛔ NO IMPLEMENTAR (Descartado - 2026-05-05)
- ❌ Notificaciones por email (el usuario maneja TODO manualmente desde la app)
- ❌ Envío automático de PDF por email
- ❌ Recuperación de contraseña por email (prioridad baja)

### NOTA: Duplicados identificados (NO eliminar hasta verificar)
- `frontend/src/services/api.ts`: Duplicado de `frontend/services/api.ts` (el correcto)
- `frontend/App.tsx`: En raíz (no en src/)

---

## 6. Base de Datos (MongoDB)

### Colecciones

#### `users` (Médicos)
```json
{
  "_id": "ObjectId",
  "email": "string (único)",
  "password_hash": "string (bcrypt)",
  "full_name": "string",
  "specialty": "string",
  "institution": "string",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### `actividades` (Actividades médicas)
```json
{
  "_id": "ObjectId",
  "userId": "string (ObjectId del usuario)",  // ✦ CRÍTICO para multi-tenant
  "type": "guardia | procedimiento | interconsulta",
  "institution": "string",
  "date": "string (YYYY-MM-DD)",
  "amount": "integer (en centavos)",
  "status": "pendiente | pagado",
  "notes": "string (opcional)",
  "hours": "integer (para guardia)",
  "hourly_rate": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Conexión

- **URI**: `MONGO_URI` (variable de entorno)
- **Driver**: Motor (async, NO usar pymongo sync)
- **Puerto**: 27017 (local) / Atlas URI (producción)
- **Base de datos**: `medflow`

---

## 7. APIs Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Registrar nuevo usuario |
| POST | `/login` | ❌ | Obtener tokens JWT |
| POST | `/refresh` | ❌ | Renovar access token |
| GET | `/me` | ✅ | Obtener perfil |
| PUT | `/me` | ✅ | Actualizar perfil |
| POST | `/change-password` | ✅ | Cambiar contraseña |

### Actividades (`/api/actividades`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Listar actividades (filtradas por userId) |
| POST | `/` | ✅ | Crear actividad |
| GET | `/{id}` | ✅ | Obtener una actividad |
| PUT | `/{id}` | ✅ | Actualizar actividad |
| DELETE | `/{id}` | ✅ | Eliminar actividad |
| GET | `/stats` | ✅ | Estadísticas del usuario |

---

## 8. Cómo Inicializar el Proyecto

### Prerrequisitos
- Docker + Docker Compose
- Node.js 19+ (para desarrollo local del frontend)
- Python 3.11+ (para desarrollo local del backend)

### Inicio Rápido

```bash
# 1. MongoDB (contenedor)
docker run -d --name medflow-mongo -p 27017:27017 mongo:latest

# 2. Backend
cd backend
docker build -t medflow-api .
docker run -d --name medflow-api -p 8000:8000 --network host \
  -e MONGO_URI="mongodb://localhost:27017/medflow" \
  -e SECRET_KEY="medflow-test-key-32-chars-minimum!!" \
  medflow-api

# 3. Frontend
cd frontend
npm install
npm run dev

# 4. Abrir en navegador
# http://localhost:5173
```

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MONGO_URI` | Conexión MongoDB | `mongodb://localhost:27017/medflow` |
| `SECRET_KEY` | Clave JWT (mín 32 chars) | `medflow-pro-secret-key-32!!` |
| `CORS_ORIGINS` | Orígenes permitidos (comma) | `http://localhost:5173` |

---

## 9. Swagger Documentación

- **Swagger UI**: http://localhost:8000/docs
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 10. Seguridad

### Implementado ✅
- JWT con expiración de 15 minutos
- BCrypt con 12 rounds para contraseñas
- Headers de seguridad (X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy)
- CORS estricto (solo orígenes en whitelist)
- Multi-tenant: Todas las queries filtradas por `userId`
- Validación con Pydantic

### Pendiente ❌
- Rate Limiting (slowapi instalado pero NO usado)
- Refresh Token Rotation

---

## 11. Roadmap / Progreso

```
[█░░░░░░░░░░░░] 40% - Estructura base y Auth
[██░░░░░░░░░░░] 40% - CRUD Actividades
[██░░░░░░░░░░░] 50% - Stats básico
[███░░░░░░░░░░] 60% - Frontend conectado
[███░░░░░░░░░░] 65% - Seguridad básica
[███░░░░░░░░░░] 70% - Git + Docs
[████░░░░░░░░░] 80% - Docker containers
[████░░░░░░░░░] 85% - Perfil + contraseña
[████████░░░░░░] 95% - Clean code + estructura

PRÓXIMO:
[ ] Rate Limiting (CRÍTICO)
[ ] Tests
[ ] Limpiar código
[ ] Producción
```

---

## 12. i18n (Inglés/Español)

### Archivo: `frontend/translations.ts`
- **Español**: Idioma **PRINCIPAL** (defecto: `language: 'es'`)
- **Inglés**: Secundario (`settings.language = 'en'`)
- Uso: `const t = translations[settings.language];`

### Idioma Principal:
- ✅ Español es el defecto en `App.tsx` línea ~120
- ✅ SettingsView permite cambiar a 'en'
- ✅ Todas las vistas usan `t.label` para traducción
- ✅ REGLA: Siempre español primero, inglés disponible

### Cambio de Idioma:
- Toggle en `SettingsView.tsx`
- Persiste en `localStorage` → `settings.language`

---

## 13. Modo Oscuro (Dark Mode)

### Estado: ✅ IMPLEMENTADO
- Estado en `App.tsx`: `darkMode: false` (defecto claro)
- Toggle en `SettingsView.tsx`
- Uso de clase condicional:
  ```tsx
  className={cn(
    "bg-white text-slate-900", 
    settings.darkMode && "dark:bg-slate-900 dark:text-white"
  )}
  ```

### Colores:
- Claro: `bg-slate-50`, `text-slate-900`
- Oscuro: `bg-slate-900`, `text-white`

---

## 14. Botón Salir (Logout)

### Ubicación: `App.tsx` línea ~295 (sidebar)
- Icono: `<LogOut />` (lucide-react)
- Texto: "Salir" (es)
- Acción: `handleLogout()` → limpia tokens y redirige a login

### Función handleLogout:
```typescript
const handleLogout = () => {
  api.logout();  // Limpia localStorage
  setIsAuthenticated(false);
  setTransactions([]);
  setActiveView('login');
};
```

---

## 15. Seguridad de Tokens (CRÍTICO)

### Método Actual: localStorage (⚠️ Seguridad Media)
- Tokens almacenados en `localStorage`
- Vulnerable a XSS (scripts maliciosos pueden leer)
- Access token expira en 15 min

### MEJORA RECOMENDADA: HttpOnly Cookies (🔵 Seguridad Máxima)
- **Backend** (_fastapi_): 设置 cookies con `httponly=True`
- **Frontend**: No necesita localStorage, el navegador envía cookies automáticamente
- ✅ XSS no puede leer tokens
- ✅ Más profesional, estándar de industria

### Implementación Sugerida (pendiente):
```python
# Backend - FastAPI
from fastapi.responses import Response

@app.post("/api/auth/login")
async def login(response: Response, ...):
    # ... autenticación ...
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,   # ← ✅ JS no puede leer
        secure=True,     # ← ✅ Solo HTTPS
        samesite="lax",  # ← ✅ CSRF protection
        max_age=900       # 15 min
    )
```

### REGLA DE SEGURIDAD (NUNCA OLVIDAR):
1. ✅ Tokens: localStorage (actual) → HttpOnly (pendiente)
2. ✅ Contraseñas: BCrypt 12 rounds (✓ implementado)
3. ✅ CORS: Solo orígenes permitidos (✓ implementado)
4. ✅ Headers: X-Frame-Options, HSTS (✓ implementado)
5. ✅ Multi-tenant: filtrado por userId (✓ implementado)

---

## 16. Errores Comunes y Soluciones

| Error | Solución |
|-------|---------|
| "Authentication failed" MongoDB | Verificar credenciales en MONGO_URI |
| "Token inválido" | JWT expirado, hacer login de nuevo |
| "User not found" en /me | Verificar que userId en token coincide con ObjectId en DB |
| Puerto 8000 en uso | `docker kill $(docker ps -q)` o cambiar puerto |
| CORS error | Agregar origen a `CORS_ORIGINS` en config.py |

---

## 13. Credenciales de Prueba (Desarrollo)

```
Email: drrodriguez@test.com
Contraseña: Medico123!
```

---

*Última actualización: 2026-05-05*
*Pruebas realizadas: Login, Get Me, Update Profile, Change Password, CRUD Actividades, Stats, Multi-tenant Isolation*
*Todos los tests PASARON ✅*
*Actualizado con: i18n (es principal), Modo Oscuro, Botón Salir, Seguridad Tokens*
*REGLA: Si modificás algo -> actualizá ESTE archivo*