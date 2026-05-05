"""
Rutas de Autenticación - Register, Login, Refresh Token
Con seguridad máxima multi-tenant
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

from app.config import settings
from app.models.user import (
    UserCreate, UserResponse, LoginRequest, 
    TokenResponse, ErrorResponse
)
from app.services.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    authenticate_user, create_user, validate_password_strength
)
from app.db.mongo import get_database

router = APIRouter(prefix="/api/auth", tags=["🔐 Autenticación"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Dependencia para obtener usuario actual desde JWT"""
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Extraer user_id del token
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token sin usuario"
            )
        
        return {"id": user_id, "email": payload.get("email")}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Registrar nuevo médico"""
    # Validar fortaleza de contraseña
    is_valid, msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    
    # Verificar que contraseñas coinciden
    if user_data.password != user_data.password_confirm:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    
    # Verificar si el email ya existe
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear usuario
    new_user = await create_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        db=db,
        specialty=user_data.specialty,
        institution=user_data.institution
    )
    
    if not new_user:
        raise HTTPException(status_code=500, detail="Error al crear usuario")
    
    # Generar tokens
    access_token = create_access_token({"sub": new_user["id"], "email": new_user["email"]})
    refresh_token = create_refresh_token({"sub": new_user["id"], "email": new_user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Login de médico - retorna JWT"""
    # Autenticar
    user = await authenticate_user(credentials.email, credentials.password, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Generar tokens
    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    refresh_token = create_refresh_token({"sub": user["id"], "email": user["email"]})
    
    logger.info(f"🔐 Login exitoso: {user['email']}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Renovar access token usando refresh token"""
    payload = decode_token(refresh)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    
    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    # Generar nuevo access token
    access_token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"]
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    """Obtener datos del usuario actual"""
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    except Exception:
        user = await db.users.find_one({"_id": current_user["id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "specialty": user.get("specialty"),
        "institution": user.get("institution"),
        "created_at": str(user.get("created_at")) if user.get("created_at") else None
    }


@router.put("/me", response_model=dict)
async def update_me(
    updates: dict,
    current_user: dict = Depends(get_current_user), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Actualizar datos del perfil - Solo campos permitidos"""
    allowed_fields = {"full_name", "specialty", "institution"}
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(400, detail="No hay campos válidos para actualizar")
    
    try:
        query = {"_id": ObjectId(current_user["id"])}
    except Exception:
        query = {"_id": current_user["id"]}
    
    result = await db.users.update_one(query, {"$set": update_data})
    
    if result.modified_count == 0:
        raise HTTPException(404, detail="Usuario no encontrado")
    
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    except Exception:
        user = await db.users.find_one({"_id": current_user["id"]})
    
    logger.info(f"✅ Perfil actualizado: {current_user['email']}")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "specialty": user.get("specialty"),
        "institution": user.get("institution")
    }


@router.post("/change-password", response_model=dict)
async def change_password(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Cambiar contraseña"""
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(400, detail="Contraseñas requeridas")
    
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not user or not verify_password(current_password, user.get("password_hash", "")):
        raise HTTPException(401, detail="Contraseña actual incorrecta")
    
    if len(new_password) < 6:
        raise HTTPException(400, detail="Nueva contraseña muy corta (mínimo 6 caracteres)")
    
    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"password_hash": new_hash}}
    )
    
    logger.info(f"🔐 Contraseña cambiada: {current_user['email']}")
    
    return {"message": "Contraseña actualizada correctamente"}