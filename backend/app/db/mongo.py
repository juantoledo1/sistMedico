"""
Conexión a MongoDB - Motor (Async)
Con validación y pool de conexiones
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from motor.motor_asyncio import AsyncIOMotorClientSession
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Cliente singleton
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def get_database() -> AsyncIOMotorDatabase:
    """Obtener base de datos (singleton)"""
    global _client, _database
    
    if _database is None:
        await connect()
    
    return _database


async def connect():
    """Conectar a MongoDB"""
    global _client, _database
    
    try:
        logger.info(f"🔌 Conectando a MongoDB...")
        
        # Cliente con opciones de seguridad
        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            retryWrites=True,
            retryReads=True,
            w="majority"
        )
        
        # Obtener DB del URI
        _database = _client.get_default_database()
        
        # Test de conexión
        await _client.admin.command('ping')
        logger.info(f"✅ MongoDB conectado exitosamente")
        
        # Crear índices únicos
        await create_indexes()
        
    except Exception as e:
        logger.error(f"❌ Error conectando a MongoDB: {e}")
        raise


async def create_indexes():
    """Crear índices para seguridad y rendimiento"""
    if _database is None:
        return
    
    try:
        # Índice único en email de usuarios
        await _database.users.create_index(
            "email", 
            unique=True,
            name="unique_email_index"
        )
        
        # Índice compuesto para actividades (userId + fecha)
        await _database.actividades.create_index(
            [("user_id", 1), ("date", -1)],
            name="user_date_index"
        )
        
        # Índice en institution para búsqueda
        await _database.actividades.create_index(
            "institution",
            name="institution_index"
        )
        
        logger.info("✅ Índices creados")
        
    except Exception as e:
        logger.warning(f"⚠️ Índice ya existe o error: {e}")


async def disconnect():
    """Desconectar de MongoDB"""
    global _client, _database
    
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("🔌 MongoDB desconectado")


# ==================== HELPERS ====================

def serialize_doc(doc: dict) -> dict:
    """Convertir ObjectId a string"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def serialize_docs(docs: list) -> list:
    """Convertir múltiples documentos"""
    return [serialize_doc(doc) for doc in docs]