"""Router de Notificaciones"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from app.models.notification import (
    NotificationCreate, NotificationResponse, UnreadCountResponse,
)
from app.core.dependencies import get_current_user, get_current_user_admin
from app.services import notification as notif_service
from app.db.mongo import get_database

router = APIRouter(prefix="/api/notifications", tags=["🔔 Notificaciones"])
logger = logging.getLogger(__name__)


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_notification(
    body: NotificationCreate,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin crea una notificación para uno o todos los usuarios."""
    if not body.target_all and not body.target_user_id:
        raise HTTPException(
            status_code=400,
            detail="Debe especificar target_user_id o target_all=true",
        )

    count = await notif_service.create_notification(body, current_user["id"], db)
    return {"created": count, "message": f"Notificación enviada a {count} usuario(s)"}


@router.get("/mine", response_model=list[NotificationResponse])
async def get_my_notifications(
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Usuario ve sus notificaciones."""
    return await notif_service.get_user_notifications(
        current_user["id"], db, unread_only=unread_only,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Cantidad de notificaciones no leídas (para el badge)."""
    count = await notif_service.get_unread_count(current_user["id"], db)
    return UnreadCountResponse(count=count)


@router.patch("/{notif_id}/read", response_model=dict)
async def mark_notification_read(
    notif_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Marcar notificación como leída."""
    ok = await notif_service.mark_as_read(notif_id, current_user["id"], db)
    if not ok:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return {"message": "Marcada como leída"}
