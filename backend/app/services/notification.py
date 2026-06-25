"""Servicio de Notificaciones - Lógica de negocio"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import Optional
from bson import ObjectId

from app.models.notification import NotificationCreate


async def create_notification(
    data: NotificationCreate,
    admin_id: str,
    db: AsyncIOMotorDatabase,
) -> int:
    """Crear notificación para uno o todos los usuarios activos.
    Retorna la cantidad de notificaciones creadas.
    """
    now = datetime.utcnow()

    if data.target_all:
        # Buscar todos los usuarios activos no eliminados
        cursor = db.users.find(
            {"is_active": True, "is_deleted": {"$ne": True}},
            {"_id": 1},
        )
        user_ids = [str(doc["_id"]) async for doc in cursor]

        if not user_ids:
            return 0

        docs = [
            {
                "userId": uid,
                "type": data.type,
                "title": data.title,
                "message": data.message,
                "read": False,
                "createdAt": now,
                "createdBy": admin_id,
            }
            for uid in user_ids
        ]
        result = await db.notifications.insert_many(docs)
        return len(result.inserted_ids)

    if data.target_user_id:
        doc = {
            "userId": data.target_user_id,
            "type": data.type,
            "title": data.title,
            "message": data.message,
            "read": False,
            "createdAt": now,
            "createdBy": admin_id,
        }
        await db.notifications.insert_one(doc)
        return 1

    return 0


async def get_user_notifications(
    user_id: str,
    db: AsyncIOMotorDatabase,
    unread_only: bool = False,
) -> list[dict]:
    """Obtener notificaciones para un usuario (propias + globales 'all')."""
    query: dict = {
        "$or": [
            {"userId": user_id},
            {"userId": "all"},
        ],
    }
    if unread_only:
        query["read"] = False

    cursor = db.notifications.find(query).sort("createdAt", -1).limit(50)
    results = []
    async for doc in cursor:
        results.append({
            "id": str(doc["_id"]),
            "user_id": doc.get("userId", ""),
            "type": doc.get("type", "info"),
            "title": doc.get("title", ""),
            "message": doc.get("message", ""),
            "read": doc.get("read", False),
            "created_at": doc.get("createdAt"),
        })
    return results


async def get_unread_count(
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> int:
    """Cantidad de notificaciones no leídas."""
    count = await db.notifications.count_documents({
        "$or": [{"userId": user_id}, {"userId": "all"}],
        "read": False,
    })
    return count


async def mark_as_read(
    notif_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> bool:
    """Marcar notificación como leída. Solo el dueño puede."""
    result = await db.notifications.update_one(
        {"_id": ObjectId(notif_id), "userId": user_id},
        {"$set": {"read": True}},
    )
    return result.modified_count > 0
