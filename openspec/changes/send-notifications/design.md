# Notificaciones — Diseño Técnico

> Arquitectura detallada para implementación

## Backend

### Nuevos archivos

```
backend/app/
├── models/notification.py     # Modelo Pydantic
├── routers/notifications.py   # Endpoints
└── services/notification.py   # Lógica de negocio
```

### Modelo: `models/notification.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    info = "info"
    warning = "warning"
    alert = "alert"

class NotificationCreate(BaseModel):
    """Schema para crear notificación (admin)"""
    target_user_id: Optional[str] = Field(None, description="userId específico")
    target_all: bool = False
    type: NotificationType = NotificationType.info
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime

class UnreadCountResponse(BaseModel):
    count: int
```

### Router: `routers/notifications.py`

```
POST   /api/notifications            → admin crea (requiere admin)
GET    /api/notifications/mine        → usuario lista sus notifs
GET    /api/notifications/unread-count → badge count
PATCH  /api/notifications/{id}/read   → marca como leída
```

**Reglas de negocio:**

- Admin crea notif → busca todos los userIds activos si `targetAll`, o usa el específico
- Se guarda una notif por usuario (no un doc con array)
- Usuario lista: `userId IN [currentUserId, "all"]`, ordenado por fecha desc
- Solo el dueño puede marcar como leída

### Service: `services/notification.py`

- `create_notification(data, db)` → crea notif(s) en batch
- `get_user_notifications(user_id, unread_only, db)` → lista paginada
- `get_unread_count(user_id, db)` → count rápido (usa índice)
- `mark_as_read(notif_id, user_id, db)` → update `read: true`

### Índices en `mongo.py`

```python
await _database.notifications.create_index(
    [("userId", 1), ("read", 1)],
    name="notif_user_read_index"
)
await _database.notifications.create_index(
    [("createdAt", -1)],
    name="notif_created_index"
)
```

## Frontend

### Archivos nuevos

```
frontend/components/Admin/AdminNotifyModal.tsx   # Modal de creación
frontend/components/Settings/NotificationsList.tsx # Vista de notificaciones
frontend/hooks/useNotifications.ts               # Hook compartido
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `AdminView.tsx` | Agregar botón "Enviar notificación" + integrar modal |
| `SettingsView.tsx` | Reemplazar placeholder "Próximamente" con `NotificationsList` |
| `components/ui/Navbar.tsx` | Agregar badge de no leídas |
| `translations.ts` | Agregar strings de notificaciones |
| `services/api.ts` | Agregar métodos de API |
| `types.ts` | Agregar interfaz `Notification` |

### Hook: `useNotifications`

```typescript
function useNotifications() {
  // state: notifications[], unreadCount, loading, error
  // methods: fetchMine, fetchUnreadCount, markAsRead
  // Se monta con fetchUnreadCount para el badge
}
```

### AdminNotifyModal

- Props: `show`, `onClose`, `users: UserListItem[]`, `currentFilter: string`
- Estados internos: `targetMode` ('specific' | 'all' | 'filter'), `selectedUserId`, `type`, `title`, `message`, `error`, `isPending`
- Submit: llama a `POST /api/notifications`
- Validación: título obligatorio, mensaje obligatorio

### NotificationsList

- Props: ninguna (usa `useNotifications`)
- Muestra lista con expansión inline
- Al expandir, llama a `markAsRead`
- Badge se actualiza al cerrar la vista

### Data flow — Badge

```
App carga → useNotifications.fetchUnreadCount() → muestra (N)
Usuario abre Settings/Notificaciones → fetchMine()
Usuario expande notif → markAsRead(id) → setUnreadCount(prev - 1)
Usuario cierra Settings → no necesita refrescar
```

## Riesgos técnicos

| Riesgo | Mitigación |
|--------|-----------|
| Badge desactualizado | Se refresca al montar y al cerrar vista de notifs |
| Admin envía a 500 usuarios | Batch insert, sin await individual |
| Notif "all" multiplicada | Crear una por userId, no referenciar |


## Secuencia de implementación

1. Backend: modelo → service → router → índices → tests
2. Frontend: types.ts → api.ts → translations → useNotifications → AdminNotifyModal → NotificationsList → AdminView → SettingsView → Navbar
3. Verify: tests backend + TypeScript + navegación manual
