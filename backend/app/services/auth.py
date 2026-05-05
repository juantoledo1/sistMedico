"""
Servicios de Autenticación - JWT + BCrypt
Seguridad máxima: contraseña hasheada con BCrypt (12 rounds)
Token cortos (15 min) + Refresh Token (7 días)
"""
from datetime import datetime, timedelta
from typing import Optional
import logging
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId

from app.config import settings

logger = logging.getLogger(__name__)

# BCrypt context - 12 rounds (seguro y rápido)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==================== CONTRASEÑAS ====================

def hash_password(password: str) -> str:
    """
    Hashear contraseña con BCrypt
    """
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8'))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verificar contraseña contra hash
    """
    password_bytes = plain_password.encode('utf-8')[:72]
    return pwd_context.verify(password_bytes.decode('utf-8'), hashed_password)


# ==================== JWT ====================

def create_access_token(data: dict) -> str:
    """
    Crear access token (15 min)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    
    return jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )


def create_refresh_token(data: dict) -> str:
    """
    Crear refresh token (7 días)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    return jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )


def decode_token(token: str) -> Optional[dict]:
    """
    Decodificar y validar token
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        # Verificar tipo de token
        if payload.get("type") not in ["access", "refresh"]:
            return None
            
        # Verificar expiración
        exp = payload.get("exp")
        if exp and datetime.utcnow() > datetime.fromtimestamp(exp):
            return None
            
        return payload
        
    except JWTError as e:
        logger.warning(f"⚠️ Token inválido: {e}")
        return None


async def authenticate_user(email: str, password: str, db) -> Optional[dict]:
    """
    Autenticar usuario - buscar en MongoDB
    """
    try:
        # Buscar usuario por email
        user = await db.users.find_one({"email": email})
        
        if not user:
            return None
            
        # Verificar contraseña
        if not verify_password(password, user.get("password_hash", "")):
            return None
            
        # Verificar si está activo
        if not user.get("is_active", True):
            return None
            
        # Retornar datos del usuario (sin hash)
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "specialty": user.get("specialty"),
            "institution": user.get("institution")
        }
        
    except Exception as e:
        logger.error(f"❌ Error en autenticación: {e}")
        return None


async def create_user(email: str, password: str, full_name: str, db, specialty: str = None, institution: str = None) -> Optional[dict]:
    """
    Crear nuevo usuario
    """
    try:
        # Verificar si ya existe
        existing = await db.users.find_one({"email": email})
        if existing:
            return None
            
        # Hashear contraseña
        password_hash = hash_password(password)
        
        # Crear usuario
        user_doc = {
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "specialty": specialty,
            "institution": institution,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insertar
        result = await db.users.insert_one(user_doc)
        
        return {
            "id": str(result.inserted_id),
            "email": email,
            "full_name": full_name
        }
        
    except Exception as e:
        logger.error(f"❌ Error creando usuario: {e}")
        return None


# ==================== VALIDACIÓN ====================

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validar fortaleza de contraseña
    Retorna: (es_válida, mensaje)
    """
    if len(password) < 8:
        return False, "Mínimo 8 caracteres"
    
    if not any(c.isupper() for c in password):
        return False, "Al menos una mayúscula"
    
    if not any(c.islower() for c in password):
        return False, "Al menos una minúscula"
    
    if not any(c.isdigit() for c in password):
        return False, "Al menos un número"
    
    return True, "Contraseña segura"


def sanitize_input(text: str) -> str:
    """
    Sanitizar input - evitar XSS e inyección
    """
    if not text:
        return ""
    
    # Caracteres peligrosos a remover
    dangerous = ["<", ">", "&", '"', "'", ";", "--", "/*", "*/"]
    
    sanitized = text
    for char in dangerous:
        sanitized = sanitized.replace(char, "")
    
    return sanitized.strip()