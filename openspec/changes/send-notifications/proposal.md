# Notificaciones — Admin → Usuario

> Propuesta de cambio — SDD

## Problema

El admin no tiene forma de comunicarse con los médicos desde la plataforma. Ahora mismo, si hay una actualización, un cambio de precios, un aviso de pago o un mantenimiento, no hay canal.

Además, en Settings ya existe un item "Notificaciones" marcado como "Próximamente" — está pidiendo existir.

## Solución propuesta

Agregar un botón "Enviar notificación" en el panel de admin que abre un modal. El admin puede seleccionar el destinatario (usuario específico, filtro actual, o todos) y escribir un mensaje. Ese mensaje se guarda en MongoDB y aparece como notificación para el médico en la app.

## Scope

### Incluye

| Capa | Qué |
|------|-----|
| **MongoDB** | Colección `notifications` con índices |
| **Backend** | Modelo + Router + Service para CRUD de notificaciones |
| **Frontend Admin** | Botón + Modal de envío con selector de destinatarios |
| **Frontend User** | Badge de no leídas + vista de notificaciones en Settings |
| **Traducciones** | Strings ES/EN |

### No incluye (para otro momento)

- Notificaciones push / email
- WebSockets en tiempo real
- Adjuntar archivos al mensaje
- Notificaciones programadas

## Enfoque técnico

**Backend:**
- Nuevo modelo `Notification` (Pydantic) con: `id`, `userId` o `"all"`, `title`, `message`, `type` (info/warning/alert), `read`, `createdAt`
- Router `/api/notifications` con endpoints protegidos por rol
- Admin puede crear notifs; usuario solo lee y marca leídas

**Frontend Admin:**
- Botón al lado de los filtros en `AdminView.tsx`
- Modal con: input de título, textarea de mensaje, selector de destinatarios (usuario actual del filtro / todos)
- Submit → POST a `/api/notifications`

**Frontend User:**
- Badge en navbar con count de no leídas
- Settings "Notificaciones" reemplaza "Próximamente" con lista de notifs recibidas

## Riesgos

- Bajo: feature acotado, sin cambios en modelos existentes
- Medio: el badge requiere un endpoint rápido de count o incluir en el response de auth
- Bajo: el modal de admin necesita saber a qué usuarios enviar (el admin router ya lista usuarios)

---

**¿Qué opinás? ¿Ajustamos algo o seguimos a la especificación?**
