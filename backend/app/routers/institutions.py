from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
import logging

from app.models.institution import InstitutionCreate, InstitutionUpdate, InstitutionResponse
from app.services.auth import decode_token
from app.db.mongo import get_database

router = APIRouter(prefix="/api/institutions", tags=["🏥 Instituciones"])
logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user_id(credentials = Depends(security)) -> str:
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, detail="Token inválido")
    return payload.get("sub")


@router.get("/", response_model=List[InstitutionResponse])
async def list_institutions(
    active_only: bool = True,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {"userId": user_id}
    if active_only:
        query["is_active"] = True

    institutions = []
    async for doc in db.institutions.find(query).sort("name", 1):
        doc["_id"] = str(doc["_id"])
        institutions.append(doc)
    return institutions


@router.post("/", response_model=InstitutionResponse, status_code=201)
async def create_institution(
    data: InstitutionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    existing = await db.institutions.find_one({"userId": user_id, "name": data.name})
    if existing:
        raise HTTPException(400, detail="Ya existe una institución con ese nombre")

    doc = {
        "userId": user_id,
        "name": data.name,
        "guardia_rate": data.guardia_rate,
        "procedimiento_rate": data.procedimiento_rate,
        "interconsulta_rate": data.interconsulta_rate,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.institutions.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    logger.info(f"✅ Institución creada: {data.name}")
    return doc


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: str,
    data: InstitutionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    from bson import ObjectId
    try:
        target = await db.institutions.find_one({"_id": ObjectId(institution_id), "userId": user_id})
    except Exception:
        target = await db.institutions.find_one({"_id": institution_id, "userId": user_id})

    if not target:
        raise HTTPException(404, detail="Institución no encontrada")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(400, detail="No hay campos para actualizar")

    update_data["updated_at"] = datetime.utcnow()
    await db.institutions.update_one({"_id": target["_id"]}, {"$set": update_data})

    updated = await db.institutions.find_one({"_id": target["_id"]})
    updated["_id"] = str(updated["_id"])
    logger.info(f"✅ Institución actualizada: {updated['name']}")
    return updated


@router.delete("/{institution_id}")
async def soft_delete_institution(
    institution_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    from bson import ObjectId
    try:
        target = await db.institutions.find_one({"_id": ObjectId(institution_id), "userId": user_id})
    except Exception:
        target = await db.institutions.find_one({"_id": institution_id, "userId": user_id})

    if not target:
        raise HTTPException(404, detail="Institución no encontrada")

    await db.institutions.update_one(
        {"_id": target["_id"]},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    logger.info(f"🗑️ Institución desactivada: {target['name']} (actividades conservadas)")
    return {"message": f"Institución '{target['name']}' desactivada. Las actividades históricas se conservan."}
