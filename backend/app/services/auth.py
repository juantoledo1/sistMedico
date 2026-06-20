from datetime import datetime
from typing import Optional
import logging

from app.core.security import hash_password, verify_password

logger = logging.getLogger(__name__)


async def authenticate_user(email: str, password: str, db) -> Optional[dict]:
    try:
        user = await db.users.find_one({"email": email})
        if not user:
            return None
        if not verify_password(password, user.get("password_hash", "")):
            return None
        return {
            "id": str(user["_id"]), "email": user["email"],
            "full_name": user.get("full_name", ""), "specialty": user.get("specialty"),
            "institution": user.get("institution"), "status": user.get("status", "active"),
            "is_active": user.get("is_active", True), "is_deleted": user.get("is_deleted", False)
        }
    except Exception as e:
        logger.error(f"Error en autenticación: {e}")
        return None


async def create_user(email: str, password: str, full_name: str, db, specialty: str = None, institution: str = None, phone: str = None, is_admin: bool = False) -> Optional[dict]:
    try:
        existing = await db.users.find_one({"email": email})
        if existing:
            return None

        password_hash = hash_password(password)
        user_doc = {
            "email": email, "password_hash": password_hash,
            "full_name": full_name, "specialty": specialty,
            "institution": institution, "phone": phone,
            "status": "active", "is_active": True,
            "is_admin": is_admin, "is_deleted": False,
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
        }

        result = await db.users.insert_one(user_doc)
        return {"id": str(result.inserted_id), "email": email, "full_name": full_name}
    except Exception as e:
        logger.error(f"Error creando usuario: {e}")
        return None
