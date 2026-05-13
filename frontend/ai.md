# MedFlow Pro — AI Context

## Project Overview
Sistema de gestión de ingresos médicos. Frontend en React + Vite + TypeScript + Tailwind CSS. Los médicos registran guardias, procedimientos e interconsultas, y visualizan reportes financieros.

## Views
| View | Component | Description |
|------|-----------|-------------|
| `inicio` | Dashboard | Resumen general con insight de IA |
| `turnos` | CalendarView | Calendario de actividades |
| `reportes` | ReportsView | Reportes, gráficos + lista editable agrupada por mes (unificada) |
| `stats` | StatsView | Estadísticas visuales |
| `perfil` | SettingsView | Ajustes de perfil, idioma, favoritos |
| `admin` | AdminView | Panel de administración |

## Recent Changes
### 11 May 2026
- **MongoDB authSource fix**: Agregado `?authSource=admin` a MONGO_URI en docker-compose.yml. El backend fallaba con "Authentication failed" porque el usuario root se crea en la DB `admin` pero el driver de Python autenticaba contra `medflow`.
- **ai.md**: Agregada sección Docker Setup con credentials de prueba y el fix de MongoDB.

### 9 May 2026
- **IncomeHistory → ReportsView unificación**: Se eliminó la vista `finanzas` (componente `IncomeHistory.tsx`). Su funcionalidad de lista editable agrupada por mes se integró dentro de `ReportsView.tsx`, reemplazando el bloque "Detalle de Actividades" anterior.
- **App.tsx**: Limpiada navegación sidebar y mobile tabs, eliminado import de IncomeHistory y el view state `finanzas`.
- **IncomeHistory.tsx**: Archivo eliminado.

## Key Architecture Decisions
- ReportsView ahora recibe props `onOpenForm`, `onEdit`, `onDelete`, `onUpdate` para operaciones CRUD desde la lista.
- El listado en ReportsView permite: toggle pagado/pendiente, editar con el modal ShiftForm, eliminar, y filtrar por texto y estado.
- La agrupación por mes es colapsable, expandiendo por defecto el mes más reciente.

## Props Flow
```
App.tsx
├── Dashboard (transactions, insight, onOpenForm, onViewReports, userProfile, settings)
├── CalendarView (transactions, onOpenForm, onDelete, settings)
├── ReportsView (transactions, settings, onBack, onOpenForm, onEdit, onDelete, onUpdate)
├── StatsView (settings, onBack)
├── SettingsView (profile, settings, isAdmin, ...)
├── AdminView (settings, onBack)
├── ShiftForm (modal, receives onClose, onSubmit, editingTransaction, etc.)
```

## Types
- `Transaction`: id, institution, type, date, amount, status, notes, duration, specialty, procedureName, patientLocation, hours
- `ActivityType`: GUARDIA (guardia), PROCEDIMIENTO (procedimiento), INTERCONSULTA (interconsulta)
- `PaymentStatus`: PAID, PENDING

## Docker Setup
- **docker-compose.yml** levanta: mongodb (puerto 27017), backend (puerto 8000), frontend (puerto 3000 opcional)
- El frontend se corre localmente con `npm run dev` en puerto 5173

### MongoDB Fix ⚠️
La MONGO_URI en `docker-compose.yml` debe incluir `?authSource=admin`:
```yaml
MONGO_URI: mongodb://admin:password@mongodb:27017/medflow?authSource=admin
```
Sin esto, el backend falla con "Authentication failed" porque el usuario root se crea en la DB `admin` pero por defecto el driver intenta autenticar contra la DB del path (`medflow`).

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@medflow.com` | `Admin1234` |
| Médico | `drrodriguez@test.com` | `Medico123!` |
| Médico | `dra.perez@test.com` | `Medico123!` |
| Médico | `dratest@test.com` | `Medico123!` |

Admin secret para register-admin: `medflow-admin-2026`

## API Services
- `api.getActividades()`, `api.createActividad()`, `api.updateActividad()`, `api.deleteActividad()`
- `api.login()`, `api.logout()`, `api.getProfile()`
- `GeminiService` para insights financieros
