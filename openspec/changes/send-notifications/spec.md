# Notificaciones — Especificación

> Especificación detallada basada en la propuesta aprobada.

## Modelo de datos

### MongoDB: `notifications`

```json
{
  "_id": "ObjectId",
  "userId": "string | 'all'",
  "type": "info | warning | alert",
  "title": "string",
  "message": "string",
  "read": false,
  "createdAt": "ISODate"
}
```

**Índices:**
- `{userId: 1, read: 1}` — query rápida de no leídas por usuario
- `{createdAt: -1}` — ordenar por fecha

### Tipos frontend (types.ts)

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

## API Endpoints

### Admin — crear notificación

`POST /api/notifications`

```json
{
  "targetUserId": "string | null",  
  "targetAll": false,
  "type": "info",
  "title": "string",
  "message": "string"
}
```

- Si `targetAll: true` → se crea con `userId: "all"`
- `targetUserId` presente sin `targetAll` → notificación individual
- Requiere rol admin

### Usuario — listar mis notificaciones

`GET /api/notifications/mine?unreadOnly=false`

- Trae notifs donde `userId === currentUserId` O `userId === "all"`
- `unreadOnly=true` → solo no leídas (para el badge)
- Ordenadas por `createdAt` descendente

### Usuario — marcar como leída

`PATCH /api/notifications/{id}/read`

- Marca `read: true`
- Solo el dueño puede marcar

### Usuario — count de no leídas

`GET /api/notifications/unread-count`

- Devuelve `{ count: number }`
- Para el badge en navbar

## Frontend — Admin

### Botón en AdminView

- Se agrega un botón "Enviar notificación" (`<Button>`) después de los filtros, alineado a la derecha
- Variante `primary`

### Modal: AdminNotifyModal

**Props:**
- `show: boolean`
- `onClose: () => void`
- `currentFilter: string` — para pre-seleccionar "todos los del filtro actual"

**Contenido del modal:**
1. Selector de destinatarios:
   - "Usuario específico" → dropdown con lista de usuarios (name + email)
   - "Todos los médicos" → envía a todos
   - "Filtro actual" → envía a los usuarios del filtro activo
2. Selector de tipo: `info` / `warning` / `alert`
3. Input: título
4. Textarea: mensaje
5. Botón "Enviar"

**Estados:**
- `isPending` → botón deshabilitado + spinner
- Error → mensaje de error inline
- Éxito → cerrar modal, mostrar toast/snackbar

## Frontend — Usuario

### Badge en Navbar

- Al lado del ícono de Settings o nombre de usuario
- Muestra count de no leídas desde `GET /notifications/unread-count`
- Se refresca al montar y después de abrir la vista de notificaciones

### Settings — Vista de notificaciones

- Reemplaza el placeholder "Próximamente" en `SettingsView`
- Muestra lista de notificaciones (todas, no solo no leídas)
- Cada item: ícono según tipo, título, fecha, preview del mensaje
- Click → expande para ver mensaje completo y marca como leída
- Si no hay notificaciones: mensaje vacío "No hay notificaciones"

## Traducciones

### translations.ts

```typescript
notificaciones: {
  title: "Notificaciones",
  empty: "No hay notificaciones",
  markAsRead: "Marcar como leída",
  sendNotification: "Enviar notificación",
  sendTo: "Enviar a",
  specificUser: "Usuario específico",
  allUsers: "Todos los médicos",
  currentFilter: "Filtro actual",
  type: "Tipo",
  title_field: "Título",
  message_field: "Mensaje",
  send: "Enviar",
  sending: "Enviando...",
  sent: "Notificación enviada",
  info: "Informativo",
  warning: "Advertencia",
  alert: "Alerta",
  selectUser: "Seleccionar usuario",
},
```

## Escenarios

### Happy path — Admin envía a todos
1. Admin abre panel, click "Enviar notificación"
2. Selecciona "Todos los médicos", tipo `info`, titulo "Nueva versión disponible", mensaje "Se actualizó el módulo de reportes"
3. Click "Enviar"
4. Modal se cierra, aparece toast de éxito
5. Cada médico ve badge con `(1)` en navbar
6. Abre Settings → Notificaciones → ve el mensaje

### Happy path — Usuario lee notificación
1. Usuario ve badge `(1)` en navbar
2. Va a Settings → Notificaciones
3. Ve lista con título y preview
4. Click en una → se expande, se marca como leída
5. Badge desaparece

### Edge — Sin notificaciones
1. Usuario nuevo o sin notificaciones
2. Settings → Notificaciones muestra "No hay notificaciones"

### Edge — Error al enviar
1. Admin completa formulario, click "Enviar"
2. Error de red → mensaje inline en modal
3. Formulario conserva datos, puede reintentar

## Criterios de aceptación

- [ ] Admin puede enviar notif a un usuario específico
- [ ] Admin puede enviar notif a todos
- [ ] Admin puede enviar notif al filtro actual
- [ ] Usuario ve badge con count de no leídas
- [ ] Usuario puede listar sus notificaciones en Settings
- [ ] Usuario puede expandir y marcar como leída
- [ ] Traducciones completas ES/EN
- [ ] Tests backend para endpoints de notificaciones
- [ ] TypeScript strict, sin `any`
