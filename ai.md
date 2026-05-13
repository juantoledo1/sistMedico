# AI.md - Fuente de Verdad para MedFlow Pro

> **REGLA CRÍTICA**: Cada vez que hagas un cambio estructural, agregues una librería o completes una funcionalidad, DEBES ACTUALIZAR ESTE ARCHIVO para que siempre esté alineado.

---

## 1. Propósito del Proyecto

**MedFlow Pro** es un SaaS para médicos: gestión de guardias, procedimientos e interconsultas con seguimiento de ingresos.

Permite a los médicos registrar sus actividades laborales, calcular automáticamente sus earnings y llevar un seguimiento de pagos pendientes/cobrados.

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Puerto | Propósito |
|-------------|--------|----------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Tipado estático |
| Vite Dev Server | **5174** | Puerto desarrollo (5173 puede estar en uso) |
| vite build | 5173 | Puerto producción |
| Tailwind CSS | **LOCAL** | Estilos (NO CDN - vía @tailwindcss/vite) |
| Lucide React | latest | Iconos |

### Backend
| Tecnología | Puerto | Propósito |
|-------------|--------|----------|
| FastAPI | **8000** | API REST |
| Python | 3.11 | Runtime |
| MongoDB | **27017** | Base de datos |
| MongoDB | latest | Base de datos |
| Motor | 3.3+ | Driver async |
| python-jose | 3.3+ | JWT tokens |
| passlib + bcrypt | 4.0.1 | Hash de contraseñas |
| Pydantic | 2.5+ | Validación de datos |
| slowapi | 0.1.9 | Rate limiting (3/min register, 5/min login) |

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
│   │   ├── LoginView.tsx   # Login extraído (refactorizado 2026-05-05)
│   │   ├── LoadingView.tsx # Loading screen extraído (refactorizado 2026-05-05)
│   │   ├── Dashboard.tsx
│   │   ├── StatsView.tsx
│   │   ├── ReportsView.tsx
│   │   └── ...
│   ├── public/             # Archivos estáticos (imágenes,avatars)
│   │   ├── login-bg.webp  # Imagen de fondo login
│   │   └── avatars/      # Avatars de doctores
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

- [x] **Rate Limiting** (slowapi: 3 intentos/minuto register, 5/minuto login)
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
  "phone": "string (optional)",
  "status": "active | inactive | suspended | deleted",
  "is_active": "boolean",
  "is_admin": "boolean",
  "is_deleted": "boolean (soft delete)",
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
- Sistema de estados: `active`, `inactive`, `suspended`, `deleted`
- Login/Refresh/Me verifican `is_deleted` + `status` 
- Actividades writes bloqueados si usuario no está `active`
- Inactivos NO pueden login ni obtener tokens
- Eliminados bloqueados en todos los endpoints
- Suspendidos pueden login/ver datos pero NO crear/editar/eliminar actividades

### Pendiente ❌
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

## 17. Tailwind CSS (CONFIGURACIÓN LOCAL)

### Estado: ✅ IMPLEMENTADO (2026-05-05)
- Tailwind configurado LOCALMENTE (NO usa CDN)
- Dependencias: `tailwindcss`, `@tailwindcss/vite`

### Archivos de Configuración:
- `frontend/vite.config.ts`: Plugin `@tailwindcss/vite()`
- `frontend/src/index.css`: `@import "tailwindcss";`
- NO hay `tailwind.config.js` (usa valores por defecto)

### Cambios Realizados:
- ✅ Eliminado `<script src="https://cdn.tailwindcss.com"></script>` de `index.html`
- ✅ Instalado `npm install -D tailwindcss @tailwindcss/vite`
- ✅ Agregado plugin en `vite.config.ts`
- ✅ Creado `src/index.css` con directivas
- ✅ Importado en `index.tsx`

### Beneficios:
- Build optimizado (purgue de clases no usadas)
- Funciona offline
- Configuración personalizable
- Mejor para producción

---

## 18. Estructura de Componentes (Clean Code)

### Principio: Separación de Responsabilidades
- `App.tsx`: Solo routing y estado global
- `LoginView.tsx`: UI de login (extraído)
- `LoadingView.tsx`: UI de carga (extraído)
- `Dashboard.tsx`: Vista principal
- `StatsView.tsx`: Estadísticas
- `ReportsView.tsx`: Reportes
- `RegisterView.tsx`: Registro de usuarios

### Login Flow Actual:
1. `App.tsx` → Verifica `isAuthenticated`
2. Si no autenticado → `<LoginView onLogin={handleLogin} ... />`
3. `LoginView` → Maneja formulario，输入 credenciales
4. `handleLogin` (en App.tsx) → Llama `api.login()`
5. Éxito → `setIsAuthenticated(true)` → Muestra dashboard

---

## 19. Traducciones del Login (i18n)

### Keys Agregadas (2026-05-05):
```typescript
// translations.ts
es: {
  email: "Email",
  contrasena: "Contraseña",
  bienvenido: "Bienvenido",
  iniciarSesion: "Inicia sesión para continuar",
  noTienesCuenta: "¿No tienes cuenta?",
  registrate: "Regístrate",
  cargando: "Cargando...",
  iniciarSesionBtn: "Iniciar Sesión"
},
en: {
  email: "Email",
  contrasena: "Password",
  bienvenido: "Welcome",
  iniciarSesion: "Sign in to continue",
  noTienesCuenta: "Don't have an account?",
  registrate: "Sign up",
  cargando: "Loading...",
  iniciarSesionBtn: "Sign In"
}
```

---

## 20. Traducciones de Registro (i18n)

### Keys Agregadas (2026-05-13):
```typescript
// translations.ts
es: {
  crearCuenta: "Crear Cuenta",
  registroTitulo: "Registro de Médico",
  registroDesc: "Complete sus datos para registrarse",
  nombreCompleto: "Nombre Completo",
  ingresarNombre: "Ingrese su nombre completo",
  confirmarContrasena: "Confirmar Contraseña",
  confirmarPassword: "Confirme su contraseña",
  registrarse: "Registrarse",
  yaTienesCuenta: "¿Ya tienes cuenta?",
  iniciarSesion: "Inicia sesión",
  passwordRequirements: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
  registroExitoso: "Registro exitoso",
  registroExitosoMsg: "Su cuenta ha sido creada exitosamente. Ahora puede iniciar sesión.",
  errorRegistro: "Error al registrarse",
  errorCrearCuenta: "Error al crear la cuenta",
  requisitosPassword: "Requisitos de contraseña",
  especialidad: "Especialidad",
  institucion: "Institución",
  telefono: "Teléfono",
  passwordStrength: "Fortaleza de contraseña",
  debil: "Débil",
  media: "Media",
  fuerte: "Fuerte",
},
en: {
  crearCuenta: "Create Account",
  registroTitulo: "Doctor Registration",
  registroDesc: "Fill in your details to register",
  nombreCompleto: "Full Name",
  ingresarNombre: "Enter your full name",
  confirmarContrasena: "Confirm Password",
  confirmarPassword: "Confirm your password",
  registrarse: "Register",
  yaTienesCuenta: "Already have an account?",
  passwordRequirements: "Password must have at least 8 characters, one uppercase, one lowercase and one number",
  registroExitoso: "Registration Successful",
  registroExitosoMsg: "Your account has been created successfully. You can now log in.",
  errorRegistro: "Registration Error",
  errorCrearCuenta: "Error creating account",
  requisitosPassword: "Password Requirements",
  especialidad: "Specialty",
  institucion: "Institution",
  telefono: "Phone",
  passwordStrength: "Password Strength",
  debil: "Weak",
  media: "Medium",
  fuerte: "Strong",
}
```

---

## 21. Fondo de Login (ImagenLocal)

### Ubicación: `frontend/public/login-bg.webp`
- Imagen copiada desde build anterior
- Referenciada en `LoginView.tsx`:
  ```tsx
  style={{ backgroundImage: 'url(/login-bg.webp)' }}
  ```

### Efecto Visual:
- `bg-cover bg-center` → Imagen centrada y cubren
- `bg-slate-900/60 backdrop-blur-sm` → Overlay difuminado (60% opacidad, blur pequeño)
- `bg-white/95 backdrop-blur-md` → Tarjeta semitransparente (95% blanco)

### Para Modificar Difuminado/Transparencia:
- línea ~239 en `LoginView.tsx`: `bg-slate-900/60 backdrop-blur-sm`
  - Cambiar `/60` a `/40` (más claro) o `/80` (más oscuro)
  - Cambiar `backdrop-blur-sm` a `md`, `lg`, `xl`

---

## 22. Credenciales de Prueba (Desarrollo)

```
Email: drrodriguez@test.com
Contraseña: Medico123!

Email: dra.perez@test.com
Contraseña: Medico123!

Email: dratest@test.com
Contraseña: Medico123!
```

---

## 23. Panel de Administración (2026-05-06)

### ✅ Implementado

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/register-admin?secret=...` | ❌ | Crear usuario admin |
| GET | `/api/auth/admin/users` | ✅ Admin | Listar todos usuarios |
| GET | `/api/auth/admin/users-with-debts` | ✅ Admin | Usuarios con deudas |
| PUT | `/api/auth/admin/users/{id}/toggle-active` | ✅ Admin | Suspender/Activar cuenta |

### Frontend
- `components/AdminView.tsx`: Panel con tabla de médicos para gestión de usuarios
- App.tsx: Navegación condicional por rol de usuario:
  - **Admin**: Solo ve botones "Admin" (gestión usuarios) y "Perfil" (configuración)
  - **Médico**: Ve botones "Inicio", "Reportes", "Estadísticas", "Finanzas" y "Perfil" (NO ve Admin)
- Flujo de login basado en rol:
  - **Admin**: Login → Redirección directa a vista Admin (gestión usuarios)
  - **Médico**: Login → Redirección a vista Inicio (dashboard)

### Modelo Usuario (Actualizado)
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password_hash": "string (bcrypt)",
  "full_name": "string",
  "specialty": "string",
  "institution": "string",
  "phone": "string (optional)",
  "status": "string (active | inactive | suspended | deleted)",
  "is_active": "boolean (default true)",
  "is_admin": "boolean (default false)",
  "is_deleted": "boolean (default false, soft delete)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Seguridad Admin
- Endpoints solo accesibles para usuarios con `is_admin: true`
- Login/Refresh/Me verifican `is_deleted` + `status`
- Actividades writes (POST/PUT/DELETE) verifican `status == "active"` vía `verify_user_active()`
- Login devuelve: "inactivo" si `status: inactive`, "suspendida" si `is_active: false`, "eliminada" si `is_deleted: true`
- Refresh token rechaza si usuario está `inactive` o `deleted`
- GET /me rechaza si usuario está `inactive` o `deleted`
- Registro nuevo médico → `status: "active"`, `is_active: true` (auto-activación inmediata)
- Admin puede: activar, suspender, eliminar usuarios desde panel
- Soft delete conserva datos para auditoría (no borra registros)

### Gestión de Secretos
- **NUNCA hardcodear secretos** en el código fuente
- **Variables de entorno** (`.env`) para: `MONGO_URI`, `SECRET_KEY`, `ADMIN_CREATION_SECRET`
- **`.env.example`** como plantilla con valores placeholder
- **`.gitignore`** excluye `.env`, `.env.*.local`, `*.pem`, `*.key`, `credentials.json`
- **Frontend `.gitignore`** actualizado con `.env` y patrones de seguridad

### Credenciales Admin
```
Email: admin@medflow.com
Contraseña: Admin1234
Secreto para crear admin: medflow-admin-2026
```

### Credenciales Médicos (prueba)
```
Email: drrodriguez@test.com
Contraseña: Medico123!

Email: dra.perez@test.com
Contraseña: Medico123!

Email: dratest@test.com
Contraseña: Medico123!
```

---

## 24. Lógica de Suscripción SaaS (Modelo de Negocio)

### Estados de Usuario

| Estado | `status` | `is_active` | `is_deleted` | Login | Ver datos | Crear/Editar/Eliminar |
|--------|----------|-------------|-------------|-------|-----------|-----------------------|
| **Activo** | `"active"` | `true` | `false` | ✅ | ✅ | ✅ |
| **Inactivo** (pausado por admin) | `"inactive"` | `false` | `false` | ❌ | ❌ | ❌ |
| **Suspendido** (no pagó) | `"suspended"` | `false` | `false` | ✅ | ✅ | ❌ |
| **Eliminado** (abandono) | `"deleted"` | `false` | `true` | ❌ | ❌ | ❌ |

### Flujo de Ciclo de Vida

```
Registro → Activo (auto-activación inmediata)
    ↓ puede crear actividades, ver datos, etc.
    ↓ (no paga - admin suspende)
Suspendido → puede login, ver datos, NO puede crear/editar/eliminar
    ↓ (paga - admin reactiva)
Activo → vuelve a todo
    ↓ (abandona - admin elimina)
Eliminado → acceso denegado a todo, datos conservados para auditoría
```

### Verificaciones en Código

| Endpoint | Verifica `is_deleted` | Verifica `status` | Dependencia | Respuesta si bloqueado |
|----------|----------------------|-------------------|-------------|------------------------|
| `POST /api/auth/login` | ✅ | ✅ | `authenticate_user()` + inline checks | "Cuenta eliminada" / "Cuenta pendiente de activación" |
| `POST /api/auth/register` | N/A | N/A | `create_user(status="active")` | Registro OK, status="active" |
| `POST /api/auth/refresh` | ✅ | ✅ | Inline checks | "Cuenta eliminada" / "Cuenta pendiente" |
| `GET /api/auth/me` | ✅ | ✅ | Inline checks | "Cuenta eliminada" / "Cuenta pendiente" |
| `GET /api/actividades` | ❌ | ❌ | Solo verifica token (lectura permitida) | N/A |
| `POST/PUT/DELETE /api/actividades/*` | ✅ | ✅ | `verify_user_active()` | "Cuenta suspendida - No puede realizar esta acción" |

### Admin - Gestión de Estados

| Acción | Endpoint | Cambio en DB |
|--------|----------|-------------|
| Activar usuario | `PUT /admin/users/{id}` con `status: "active"` | `status: "active"`, `is_active: true` |
| Suspender usuario | `PUT /admin/users/{id}` con `status: "suspended"` | `status: "suspended"`, `is_active: false` |
| Toggle activo/suspendido | `PUT /admin/users/{id}/toggle-active` con `is_active: bool` | Sincroniza `status` automáticamente |
| Soft delete | `DELETE /admin/users/{id}` | `status: "deleted"`, `is_deleted: true`, `is_active: false` |

---

*Última actualización: 2026-05-13*
*Pruebas realizadas: Login Admin, Listar Usuarios, Toggle Active, Login Bloqueado, Crear Admin, Estados Suscripción, Registro auto-activación, Rate Limiting, Suspendido login bloqueado*
*Todos los tests PASARON ✅*
*Completado: Panel Admin con gestión de usuarios, control de acceso y lógica SaaS de suscripción. Registro con auto-activación, validación en tiempo real, fortaleza de contraseña, rate limiting (3/min register, 5/min login).*