"""
Rutas de Autenticación - Register, Login, Refresh Token
Con seguridad máxima multi-tenant
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import logging

from app.config import settings
from app.limiter import limiter
from app.models.user import (
    UserCreate, UserResponse, LoginRequest, 
    TokenResponse, MessageResponse, ErrorResponse, UserListResponse, ToggleActiveRequest
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


async def get_current_user_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """Dependencia para obtener admin - verifica token y rol admin"""
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token sin usuario"
            )
        
        # Verificar que sea admin
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        if not user.get("is_admin", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado - se requiere rol de administrador"
            )
        
        return {"id": user_id, "email": user.get("email")}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Registrar nuevo médico - auto-activación inmediata"""
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
    
    # Crear usuario (status: "inactive" por defecto)
    new_user = await create_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        db=db,
        specialty=user_data.specialty,
        institution=user_data.institution,
        phone=user_data.phone
    )
    
    if not new_user:
        raise HTTPException(status_code=500, detail="Error al crear usuario")
    
    return MessageResponse(
        message="Registro exitoso. Su cuenta ha sido activada automáticamente."
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Login de médico - retorna JWT"""
    # Autenticar
    user = await authenticate_user(credentials.email, credentials.password, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if user.get("is_deleted", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta eliminada. Contacte administración."
        )
    
    user_status = user.get("status", "active")
    if user_status == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta pendiente de activación. Contacte administración."
        )
    
    if user_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta suspendida por falta de pago. Contacte administración."
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta suspendida - Contacte administración"
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
    
    if user.get("is_deleted", False):
        raise HTTPException(status_code=403, detail="Cuenta eliminada")
    
    if user.get("status", "active") == "inactive":
        raise HTTPException(status_code=403, detail="Cuenta pendiente de activación")
    
    # Generar nuevo access token
    access_token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"]
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


# ==================== UPDATE USER (ADMIN) ====================

@router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Actualizar usuario - SOLO ADMIN"""
    admin = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not admin or not admin.get("is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        target = await db.users.find_one({"_id": user_id})
    
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Allowed fields to update
    allowed = {"full_name", "specialty", "institution", "phone", "status", "is_active", "is_admin"}
    filtered = {k: v for k, v in update_data.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="No hay campos válidos")
    
    # Sync is_active with status if status is being updated
    if "status" in filtered and "is_active" not in filtered:
        filtered["is_active"] = filtered["status"] == "active"
    
    filtered["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"_id": target["_id"]},
        {"$set": filtered}
    )
    
    logger.info(f"✅ Usuario actualizado: {target['email']}")
    
    updated = await db.users.find_one({"_id": target["_id"]})
    return {
        "id": str(updated["_id"]),
        "email": updated.get("email"),
        "full_name": updated.get("full_name"),
        "specialty": updated.get("specialty"),
        "institution": updated.get("institution"),
        "phone": updated.get("phone"),
        "status": updated.get("status", "active"),
        "is_active": updated.get("is_active", True),
        "is_admin": updated.get("is_admin", False)
    }


# ==================== SOFT DELETE USER (ADMIN) ====================

@router.delete("/admin/users/{user_id}")
async def soft_delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Soft delete usuario - SOLO ADMIN"""
    admin = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not admin or not admin.get("is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        target = await db.users.find_one({"_id": user_id})
    
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Soft delete - mark as deleted
    await db.users.update_one(
        {"_id": target["_id"]},
        {"$set": {"status": "deleted", "is_deleted": True, "is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    logger.info(f"🗑️ Usuario eliminado (soft): {target['email']}")
    
    return {"message": "Usuario eliminado correctamente"}


@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    """Obtener datos del usuario actual"""
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    except Exception:
        user = await db.users.find_one({"_id": current_user["id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user.get("is_deleted", False):
        raise HTTPException(status_code=403, detail="Cuenta eliminada")
    
    user_status = user.get("status", "active")
    if user_status == "inactive":
        raise HTTPException(status_code=403, detail="Cuenta pendiente de activación")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "specialty": user.get("specialty"),
        "institution": user.get("institution"),
        "is_admin": user.get("is_admin", False),
        "status": user.get("status", "active"),
        "is_active": user.get("is_active", True),
        "is_deleted": user.get("is_deleted", False),
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


@router.get("/admin/users", response_model=list[UserListResponse])
async def list_all_users(
    current_user: dict = Depends(get_current_user_admin),
    search: str = "",
    filter: str = "all",  # all, active, inactive, deleted
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Listar todos los usuarios - SOLO ADMIN"""
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Build query
    query = {}
    
    # Filter by status
    if filter == "active":
        query["is_active"] = True
        query["is_deleted"] = {"$ne": True}
    elif filter == "inactive":
        query["is_active"] = False
        query["is_deleted"] = {"$ne": True}
    elif filter == "deleted":
        query["is_deleted"] = True
    else:
        # all (not deleted by default)
        query["is_deleted"] = {"$ne": True}
    
    # Search by name or email
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = []
    async for doc in db.users.find(query):
        users.append({
            "id": str(doc["_id"]),
            "email": doc.get("email"),
            "full_name": doc.get("full_name"),
            "specialty": doc.get("specialty"),
            "institution": doc.get("institution"),
            "phone": doc.get("phone"),
            "status": doc.get("status", "active"),
            "is_active": doc.get("is_active", True),
            "is_admin": doc.get("is_admin", False),
            "is_deleted": doc.get("is_deleted", False),
            "created_at": doc.get("created_at")
        })

    return users


@router.get("/admin/users-with-debts", response_model=list)
async def get_users_with_debts(
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Listar usuarios con deudas - SOLO ADMIN"""
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    from datetime import datetime as dt
    import time
    
    pipeline = [
        {"$match": {"status": "pendiente"}},
        {"$addFields": {
            "date_obj": {"$toDate": "$date"}
        }},
        {"$addFields": {
            "days_overdue": {
                "$divide": [
                    {"$subtract": ["$date_obj", 0]},
                    86400000
                ]
            }
        }},
        {"$match": {"days_overdue": {"$gt": 0}}},
        {"$group": {
            "_id": "$userId",
            "total_debt": {"$sum": "$amount"},
            "days_overdue": {"$max": "$days_overdue"},
            "oldest_date": {"$min": "$date"}
        }}
    ]
    
    try:
        results = await db.actividades.aggregate(pipeline).to_list(100)
    except Exception:
        results = []
    
    debts = []
    for r in results:
        try:
            user_id = r["_id"]
            if isinstance(user_id, ObjectId):
                user_id = str(user_id)
            elif isinstance(user_id, dict):
                user_id = str(user_id.get("$oid", user_id))
            
            med_user = await db.users.find_one(
                {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
            )
            
            if med_user:
                debts.append({
                    "id": str(med_user["_id"]),
                    "full_name": med_user.get("full_name"),
                    "email": med_user.get("email"),
                    "phone": med_user.get("phone"),
                    "total_debt": r.get("total_debt", 0),
                    "days_overdue": r.get("days_overdue", 0),
                    "is_active": med_user.get("is_active", True)
                })
        except Exception:
            continue
    
    return debts


@router.put("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    data: ToggleActiveRequest,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Activar/desactivar usuario - SOLO ADMIN"""
    admin = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    if not admin or not admin.get("is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        target = await db.users.find_one({"_id": user_id})
    
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_status = "active" if data.is_active else "suspended"
    await db.users.update_one(
        {"_id": target["_id"]},
        {"$set": {"status": new_status, "is_active": data.is_active, "updated_at": datetime.utcnow()}}
    )
    
    logger.info(f"✅ Usuario {target['email']} status={new_status} is_active={data.is_active}")
    
    return {"id": str(target["_id"]), "status": new_status, "is_active": data.is_active}


# ==================== CREAR ADMIN ====================

@router.post("/register-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(
    user_data: UserCreate,
    secret: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Crear usuario admin - requiere secreto"""
    if secret != settings.ADMIN_CREATION_SECRET:
        raise HTTPException(status_code=403, detail="Secreto inválido")
    
    is_valid, msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    
    if user_data.password != user_data.password_confirm:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    new_user = await create_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        db=db,
        specialty=user_data.specialty,
        institution=user_data.institution,
        phone=user_data.phone,
        is_admin=True
    )
    
    if not new_user:
        raise HTTPException(status_code=500, detail="Error al crear usuario")
    
    access_token = create_access_token({"sub": new_user["id"], "email": new_user["email"]})
    refresh_token = create_refresh_token({"sub": new_user["id"], "email": new_user["email"]})
    
    logger.info(f"👑 Admin creado: {user_data.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )