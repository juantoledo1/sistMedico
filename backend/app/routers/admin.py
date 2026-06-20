from fastapi import APIRouter, HTTPException, Depends, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

from app.config import settings
from app.limiter import limiter
from app.models.user import (
    UserCreate, TokenResponse, MessageResponse, UserListResponse, ToggleActiveRequest,
    AdminRegisterRequest, UserUpdateByAdmin, ResetPasswordResponse
)
from app.core.security import (
    hash_password, create_access_token, create_refresh_token,
    validate_password_strength, generate_random_password
)
from app.core.dependencies import get_current_user_admin
from app.core.object_id_utils import safe_object_id
from app.services.auth import create_user
from app.db.mongo import get_database

router = APIRouter(prefix="/api/auth", tags=["🔐 Admin"])
logger = logging.getLogger(__name__)


@router.post("/register-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register_admin(
    request: Request,
    body: AdminRegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if body.secret != settings.ADMIN_CREATION_SECRET:
        raise HTTPException(status_code=403, detail="Secreto inválido")

    user_data = body.user_data
    is_valid, msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    if user_data.password != user_data.password_confirm:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    new_user = await create_user(
        email=user_data.email, password=user_data.password,
        full_name=user_data.full_name, db=db,
        specialty=user_data.specialty, institution=user_data.institution,
        phone=user_data.phone, is_admin=True
    )
    if not new_user:
        raise HTTPException(status_code=500, detail="Error al crear usuario")

    access_token = create_access_token({"sub": new_user["id"], "email": new_user["email"]})
    refresh_token = create_refresh_token({"sub": new_user["id"], "email": new_user["email"]})
    logger.info(f"Admin creado: {user_data.email}")

    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token,
        token_type="bearer", expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.get("/admin/users", response_model=list[UserListResponse])
async def list_all_users(
    current_user: dict = Depends(get_current_user_admin),
    search: str = "",
    filter: str = "all",
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {}
    if filter == "active":
        query["is_active"] = True
        query["is_deleted"] = {"$ne": True}
    elif filter == "inactive":
        query["is_active"] = False
        query["is_deleted"] = {"$ne": True}
    elif filter == "deleted":
        query["is_deleted"] = True
    else:
        query["is_deleted"] = {"$ne": True}

    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]

    users = []
    async for doc in db.users.find(query):
        users.append(UserListResponse(
            id=str(doc["_id"]), email=doc.get("email"),
            full_name=doc.get("full_name"), specialty=doc.get("specialty"),
            institution=doc.get("institution"), phone=doc.get("phone"),
            status=doc.get("status", "active"), is_active=doc.get("is_active", True),
            is_admin=doc.get("is_admin", False), is_deleted=doc.get("is_deleted", False),
            created_at=doc.get("created_at")
        ))
    return users


@router.get("/admin/users-with-debts", response_model=list)
async def get_users_with_debts(
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    pipeline = [
        {"$match": {"status": "pendiente"}},
        {"$addFields": {"date_obj": {"$toDate": "$date"}}},
        {"$addFields": {
            "days_overdue": {
                "$divide": [
                    {"$subtract": ["$$NOW", "$date_obj"]},
                    86400000
                ]
            }
        }},
        {"$match": {"days_overdue": {"$gt": 0}}},
        {"$group": {
            "_id": "$userId",
            "total_debt": {"$sum": "$amount"},
            "max_days_overdue": {"$max": "$days_overdue"},
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
            if not isinstance(user_id, str):
                user_id = str(user_id)

            med_user = await db.users.find_one({"_id": safe_object_id(user_id)})
            if med_user:
                debts.append({
                    "id": str(med_user["_id"]),
                    "full_name": med_user.get("full_name"),
                    "email": med_user.get("email"),
                    "phone": med_user.get("phone"),
                    "total_debt": r.get("total_debt", 0),
                    "days_overdue": round(r.get("max_days_overdue", 0)),
                    "is_active": med_user.get("is_active", True)
                })
        except Exception:
            continue

    return debts


@router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UserUpdateByAdmin,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    target = await db.users.find_one({"_id": safe_object_id(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    filtered = update_data.model_dump(exclude_none=True)
    if not filtered:
        raise HTTPException(status_code=400, detail="No hay campos válidos")

    if "status" in filtered and "is_active" not in filtered:
        filtered["is_active"] = filtered["status"] == "active"

    filtered["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": target["_id"]}, {"$set": filtered})

    logger.info(f"Usuario actualizado: {target['email']}")

    updated = await db.users.find_one({"_id": target["_id"]})
    return {
        "id": str(updated["_id"]), "email": updated.get("email"),
        "full_name": updated.get("full_name"), "specialty": updated.get("specialty"),
        "institution": updated.get("institution"), "phone": updated.get("phone"),
        "status": updated.get("status", "active"), "is_active": updated.get("is_active", True),
        "is_admin": updated.get("is_admin", False)
    }


@router.delete("/admin/users/{user_id}")
async def soft_delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    target = await db.users.find_one({"_id": safe_object_id(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await db.users.update_one(
        {"_id": target["_id"]},
        {"$set": {"status": "deleted", "is_deleted": True, "is_active": False, "updated_at": datetime.utcnow()}}
    )
    logger.info(f"Usuario eliminado (soft): {target['email']}")
    return {"message": "Usuario eliminado correctamente"}


@router.put("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    data: ToggleActiveRequest,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    target = await db.users.find_one({"_id": safe_object_id(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    new_status = "active" if data.is_active else "suspended"
    await db.users.update_one(
        {"_id": target["_id"]},
        {"$set": {"status": new_status, "is_active": data.is_active, "updated_at": datetime.utcnow()}}
    )
    logger.info(f"Usuario {target['email']} status={new_status} is_active={data.is_active}")
    return {"id": str(target["_id"]), "status": new_status, "is_active": data.is_active}


@router.post("/admin/users/{user_id}/reset-password", response_model=ResetPasswordResponse)
async def admin_reset_password(
    user_id: str,
    current_user: dict = Depends(get_current_user_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    target = await db.users.find_one({"_id": safe_object_id(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    new_password = generate_random_password()
    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"_id": target["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}}
    )

    logger.info(f"Contraseña reseteada: {target['email']} por admin {current_user.get('email')}")
    return ResetPasswordResponse()
