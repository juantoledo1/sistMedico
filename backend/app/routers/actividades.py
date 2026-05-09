"""
Rutas de Actividades (CRUD)
Multi-tenant: CADA consulta incluye userId del token JWT
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
import logging

from app.config import settings
from app.models.actividad import (
    ActividadCreate, ActividadResponse, ActividadUpdate,
    ActividadStats, ActivityType, PaymentStatus
)
from app.services.auth import decode_token
from app.db.mongo import get_database

router = APIRouter(prefix="/api/actividades", tags=["🏥 Actividades"])
logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user_id(credentials = Depends(security)) -> str:
    """Extraer userId desde JWT"""
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, detail="Token inválido")
    return payload.get("sub")


async def verify_user_active(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Verificar que el usuario está activo (status = 'active')"""
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=403, detail="Usuario no encontrado")
    
    if user.get("is_deleted", False):
        raise HTTPException(status_code=403, detail="Cuenta eliminada")
    
    if user.get("status", "active") != "active" or not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Cuenta suspendida - No puede realizar esta acción")


@router.post("/", response_model=ActividadResponse, status_code=201)
async def crear_actividad(
    actividad: ActividadCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _ = Depends(verify_user_active)
):
    """Crear nueva actividad - SIEMPRE asociada al userId del token"""
    
    # Calcular monto automático si es guardia
    if actividad.type == ActivityType.GUARDIA and actividad.hours and actividad.hourly_rate:
        actividad.amount = actividad.hours * actividad.hourly_rate
    
    # Calcular monto si es procedimiento
    if actividad.type == ActivityType.PROCEDIMIENTO and actividad.quantity and actividad.unit_value:
        actividad.amount = actividad.quantity * actividad.unit_value
    
    # Aplicar recargo 50% si es extraservicio o alta complejidad
    if actividad.type == ActivityType.INTERCONSULTA:
        if actividad.patient_location == "extraservicio" or actividad.complexity:
            actividad.amount = int(actividad.amount * 1.5)
    
    doc = {
        "userId": user_id,  # 🔐 CRÍTICO: Aisla datos por médico
        "type": actividad.type.value,
        "institution": actividad.institution,
        "date": actividad.date,
        "amount": actividad.amount,
        "status": actividad.status.value if actividad.status else PaymentStatus.PENDIENTE.value,
        "notes": actividad.notes,
        # Guardia
        "hours": actividad.hours,
        "hourly_rate": actividad.hourly_rate,
        "start_time": actividad.start_time,
        "end_time": actividad.end_time,
        # Procedimiento
        "procedure_name": actividad.procedure_name,
        "quantity": actividad.quantity,
        "unit_value": actividad.unit_value,
        # Interconsulta
        "specialty": actividad.specialty,
        "patient_location": actividad.patient_location.value if actividad.patient_location else None,
        "complexity": actividad.complexity,
        "patient_initials": actividad.patient_initials,
        # Timestamps
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.actividades.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["userId"] = user_id
    
    logger.info(f"✅ Actividad creada: {actividad.type} por usuario {user_id}")
    return doc


@router.get("/", response_model=List[ActividadResponse])
async def listar_actividades(
    tipo: Optional[str] = None,
    status_filter: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Listar actividades - SOLO del médico actual (userId)"""
    
    # 🔐 FILTRO OBLIGATORIO: Solo datos del usuario actual
    query = {"userId": user_id}
    
    if tipo:
        query["type"] = tipo
    if status_filter:
        query["status"] = status_filter
    if year and month:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1}-01-01"
        else:
            end_date = f"{year}-{month+1:02d}-01"
        query["date"] = {"$gte": start_date, "$lt": end_date}
    
    cursor = db.actividades.find(query).sort("date", -1).limit(100)
    actividades = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        actividades.append(doc)
    
    return actividades


@router.get("/stats", response_model=ActividadStats)
async def obtener_estadisticas(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Estadísticas del médico actual"""
    
    # Aggregations filtradas por userId
    pipeline = [
        {"$match": {"userId": user_id}},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.actividades.aggregate(pipeline).to_list(10)
    
    # Calcular totales
    total_guardias = sum(r["total"] for r in results if r["_id"] == "guardia")
    total_procedimientos = sum(r["total"] for r in results if r["_id"] == "procedimiento")
    total_interconsultas = sum(r["total"] for r in results if r["_id"] == "interconsulta")
    
    # Totales generales
    all_pipeline = [{"$match": {"userId": user_id}}]
    all_cursor = db.actividades.find({"userId": user_id})
    total_ingresos = 0
    cobrado = 0
    pendiente = 0
    
    async for doc in all_cursor:
        total_ingresos += doc.get("amount", 0)
        if doc.get("status") == "pagado":
            cobrado += doc.get("amount", 0)
        else:
            pendiente += doc.get("amount", 0)
    
    now = datetime.utcnow()
    
    return ActividadStats(
        total_ingresos=total_ingresos,
        total_guardias=total_guardias,
        total_procedimientos=total_procedimientos,
        total_interconsultas=total_interconsultas,
        Cobrado=cobrado,
        Pendiente=pendiente,
        mes_actual=now.strftime("%m"),
        anio_actual=now.year
    )


@router.get("/{actividad_id}", response_model=ActividadResponse)
async def obtener_actividad(
    actividad_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Obtener una actividad específica - SOLO del propio médico"""
    from bson import ObjectId
    
    doc = await db.actividades.find_one({
        "_id": ObjectId(actividad_id),
        "userId": user_id  # 🔐 SEGURIDAD: Verifica propiedad
    })
    
    if not doc:
        raise HTTPException(404, detail="Actividad no encontrada")
    
    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/{actividad_id}", response_model=ActividadResponse)
async def actualizar_actividad(
    actividad_id: str,
    data: ActividadUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _ = Depends(verify_user_active)
):
    """Actualizar actividad - SOLO del propio médico"""
    from bson import ObjectId
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.actividades.find_one_and_update(
        {"_id": ObjectId(actividad_id), "userId": user_id},  # 🔐 FILTRO
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(404, detail="Actividad no encontrada")
    
    result["_id"] = str(result["_id"])
    return result


@router.delete("/{actividad_id}")
async def eliminar_actividad(
    actividad_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _ = Depends(verify_user_active)
):
    """Eliminar actividad - SOLO del propio médico"""
    from bson import ObjectId
    
    result = await db.actividades.delete_one({
        "_id": ObjectId(actividad_id),
        "userId": user_id  # 🔐 FILTRO
    })
    
    if result.deleted_count == 0:
        raise HTTPException(404, detail="Actividad no encontrada")
    
    return {"message": "Actividad eliminada"}