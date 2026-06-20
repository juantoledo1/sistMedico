from fastapi import APIRouter, HTTPException, Depends, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

from app.config import settings
from app.limiter import limiter
from app.models.user import (
    UserCreate, LoginRequest, TokenResponse, MessageResponse, RefreshTokenRequest
)
from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    validate_password_strength, hash_password, verify_password
)
from app.core.dependencies import get_current_user
from app.core.object_id_utils import safe_object_id
from app.services.auth import authenticate_user, create_user
from app.db.mongo import get_database

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    is_valid, msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    if user_data.password != user_data.password_confirm:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    new_user = await create_user(
        email=user_data.email, password=user_data.password,
        full_name=user_data.full_name, db=db,
        specialty=user_data.specialty, institution=user_data.institution,
        phone=user_data.phone
    )
    if not new_user:
        raise HTTPException(status_code=500, detail="Error al crear usuario")

    return MessageResponse(message="Registro exitoso. Su cuenta ha sido activada automáticamente.")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await authenticate_user(credentials.email, credentials.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")

    if user.get("is_deleted", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta eliminada. Contacte administración.")

    user_status = user.get("status", "active")
    if user_status == "inactive":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta pendiente de activación. Contacte administración.")
    if user_status == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta suspendida por falta de pago. Contacte administración.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta suspendida - Contacte administración")

    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    refresh_token = create_refresh_token({"sub": user["id"], "email": user["email"]})
    logger.info(f"Login exitoso: {user['email']}")

    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token,
        token_type="bearer", expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh: RefreshTokenRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    payload = decode_token(refresh.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": safe_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if user.get("is_deleted", False):
        raise HTTPException(status_code=403, detail="Cuenta eliminada")
    if user.get("status", "active") == "inactive":
        raise HTTPException(status_code=403, detail="Cuenta pendiente de activación")

    access_token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
    return TokenResponse(
        access_token=access_token, refresh_token=refresh.refresh_token,
        token_type="bearer", expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": safe_object_id(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.get("is_deleted", False):
        raise HTTPException(status_code=403, detail="Cuenta eliminada")
    if user.get("status", "active") == "inactive":
        raise HTTPException(status_code=403, detail="Cuenta pendiente de activación")

    return {
        "id": str(user["_id"]), "email": user["email"],
        "full_name": user.get("full_name"), "specialty": user.get("specialty"),
        "institution": user.get("institution"), "avatar": user.get("avatar"),
        "is_admin": user.get("is_admin", False), "status": user.get("status", "active"),
        "is_active": user.get("is_active", True), "is_deleted": user.get("is_deleted", False),
        "created_at": str(user.get("created_at")) if user.get("created_at") else None
    }


@router.put("/me", response_model=dict)
async def update_me(
    updates: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    allowed_fields = {"full_name", "specialty", "institution", "avatar"}
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    if not update_data:
        raise HTTPException(400, detail="No hay campos válidos para actualizar")

    await db.users.update_one({"_id": safe_object_id(current_user["id"])}, {"$set": update_data})

    user = await db.users.find_one({"_id": safe_object_id(current_user["id"])})
    logger.info(f"Perfil actualizado: {current_user['email']}")

    return {
        "id": str(user["_id"]), "email": user["email"],
        "full_name": user.get("full_name"), "specialty": user.get("specialty"),
        "institution": user.get("institution"), "avatar": user.get("avatar")
    }


@router.post("/change-password", response_model=dict)
async def change_password(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not current_password or not new_password:
        raise HTTPException(400, detail="Contraseñas requeridas")

    user = await db.users.find_one({"_id": safe_object_id(current_user["id"])})
    if not user or not verify_password(current_password, user.get("password_hash", "")):
        raise HTTPException(401, detail="Contraseña actual incorrecta")
    if len(new_password) < 6:
        raise HTTPException(400, detail="Nueva contraseña muy corta (mínimo 6 caracteres)")

    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"_id": safe_object_id(current_user["id"])},
        {"$set": {"password_hash": new_hash}}
    )
    logger.info(f"Contraseña cambiada: {current_user['email']}")
    return {"message": "Contraseña actualizada correctamente"}
