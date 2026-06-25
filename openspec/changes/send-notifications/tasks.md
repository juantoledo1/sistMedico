# Notificaciones — Tasks

> Desglose de implementación

## Review Workload Forecast

- **Backend:** ~300 líneas (model + router + service + indexes + tests)
- **Frontend:** ~345 líneas (modal + list + hook + api + views + translations + badge)
- **Total estimado:** ~645 líneas
- **400-line budget:** ⚠️ Excedido

## Tareas

### Backend (3 tareas)

**B1 — Modelo + Service**
- Archivos: `models/notification.py`, `services/notification.py`
- Modelo Pydantic con tipos, Create/Response schemas
- Service con create/get/mark-as-read/unread-count
- Tests de unidad para el service

**B2 — Router + Índices**
- Archivos: `routers/notifications.py`, `db/mongo.py`
- 4 endpoints con protección de roles
- Índices en MongoDB
- Tests de integración para endpoints

**B3 — Tests backend**
- pytest para todos los endpoints
- Test de creación, listado, marcado, count, edge cases

### Frontend (4 tareas)

**F1 — Base (types + api + translations + hook)**
- `types.ts`: interfaz Notification
- `services/api.ts`: métodos createNotification, fetchMine, fetchUnreadCount, markAsRead
- `translations.ts`: strings ES/EN
- `hooks/useNotifications.ts`: hook compartido

**F2 — AdminNotifyModal**
- `components/Admin/AdminNotifyModal.tsx`
- Modal con selector de destinatarios, tipo, título, mensaje
- Integración en `AdminView.tsx`

**F3 — NotificationsList + Settings**
- `components/Settings/NotificationsList.tsx`
- Reemplazar placeholder en `SettingsView.tsx`
- Expansión inline + mark as read

**F4 — Badge en Navbar**
- Badge de no leídas en navbar
- Refresh al montar y al cerrar vista
