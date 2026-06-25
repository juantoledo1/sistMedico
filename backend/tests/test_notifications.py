"""Tests para el módulo de notificaciones"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.notification import NotificationCreate


class TestNotificationCreate:
    """Tests del schema NotificationCreate"""

    def test_valid_minimal(self):
        data = NotificationCreate(
            target_user_id="abc123",
            title="Test",
            message="Mensaje de prueba",
        )
        assert data.target_user_id == "abc123"
        assert data.target_all is False
        assert data.type == "info"

    def test_valid_type_warning(self):
        data = NotificationCreate(
            target_all=True,
            type="warning",
            title="Cuidado",
            message="Algo importante",
        )
        assert data.target_all is True
        assert data.type == "warning"

    def test_valid_type_alert(self):
        data = NotificationCreate(
            target_all=True,
            type="alert",
            title="Alerta",
            message="Urgente",
        )
        assert data.type == "alert"

    def test_invalid_type(self):
        with pytest.raises(ValueError):
            NotificationCreate(
                target_all=True,
                type="invalid",
                title="Test",
                message="Test",
            )

    def test_title_required(self):
        with pytest.raises(ValueError):
            NotificationCreate(
                target_all=True,
                title="",
                message="Test",
            )

    def test_message_empty(self):
        with pytest.raises(ValueError):
            NotificationCreate(
                target_all=True,
                title="Test",
                message="",
            )


class TestNotificationService:
    """Tests unitarios del servicio de notificaciones"""

    @pytest.mark.asyncio
    async def test_create_single_user(self):
        mock_db = MagicMock()
        mock_db.notifications.insert_one = AsyncMock()

        data = NotificationCreate(
            target_user_id="user1",
            title="Notif",
            message="Hello",
        )

        from app.services.notification import create_notification
        count = await create_notification(data, "admin1", mock_db)

        assert count == 1
        mock_db.notifications.insert_one.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_all_users(self):
        mock_db = MagicMock()
        # Simular 3 usuarios activos
        mock_db.users.find.return_value.__aiter__.return_value = [
            {"_id": "u1"}, {"_id": "u2"}, {"_id": "u3"},
        ]
        mock_db.notifications.insert_many = AsyncMock()
        mock_db.notifications.insert_many.return_value.inserted_ids = ["a", "b", "c"]

        data = NotificationCreate(
            target_all=True,
            title="A todos",
            message="Mensaje global",
        )

        from app.services.notification import create_notification
        count = await create_notification(data, "admin1", mock_db)

        assert count == 3
        mock_db.notifications.insert_many.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_all_no_users(self):
        mock_db = MagicMock()
        mock_db.users.find.return_value.__aiter__.return_value = []

        data = NotificationCreate(
            target_all=True,
            title="Vacio",
            message="Sin usuarios",
        )

        from app.services.notification import create_notification
        count = await create_notification(data, "admin1", mock_db)
        assert count == 0

    @pytest.mark.asyncio
    async def test_get_unread_count(self):
        mock_db = MagicMock()
        mock_db.notifications.count_documents = AsyncMock(return_value=5)

        from app.services.notification import get_unread_count
        count = await get_unread_count("user1", mock_db)

        assert count == 5
        mock_db.notifications.count_documents.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_mark_as_read_found(self):
        mock_db = MagicMock()
        mock_db.notifications.update_one = AsyncMock()
        mock_db.notifications.update_one.return_value.modified_count = 1

        from app.services.notification import mark_as_read
        oid = "507f1f77bcf86cd799439011"  # 24-char valid ObjectId hex
        result = await mark_as_read(oid, "user1", mock_db)

        assert result is True

    @pytest.mark.asyncio
    async def test_mark_as_read_not_found(self):
        mock_db = MagicMock()
        mock_db.notifications.update_one = AsyncMock()
        mock_db.notifications.update_one.return_value.modified_count = 0

        from app.services.notification import mark_as_read
        oid = "507f1f77bcf86cd799439012"  # 24-char valid ObjectId hex
        result = await mark_as_read(oid, "user1", mock_db)

        assert result is False
