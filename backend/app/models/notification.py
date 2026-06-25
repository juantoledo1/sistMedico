"""Modelos Pydantic para Notificaciones"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class NotificationCreate(BaseModel):
    """Schema para crear notificación (admin)"""
    target_user_id: Optional[str] = Field(None, description="userId específico")
    target_all: bool = False
    type: Literal["info", "warning", "alert"] = "info"
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)


class NotificationResponse(BaseModel):
    """Schema para respuesta de notificación"""
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    """Cantidad de no leídas"""
    count: int
