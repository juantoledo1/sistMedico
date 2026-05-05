"""
Modelos Pydantic para Usuarios
Seguridad + Validación de entrada
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ==================== ESQUEMAS BASE ====================

class UserBase(BaseModel):
    """Base schema - campos comunes"""
    email: EmailStr = Field(..., description="Email único del usuario")
    full_name: str = Field(..., min_length=2, max_length=100, description="Nombre completo")
    specialty: Optional[str] = Field(None, max_length=100, description="Especialidad médica")
    institution: Optional[str] = Field(None, max_length=200, description="Institución principal")


class UserCreate(UserBase):
    """Schema para crear usuario - CONTRASEÑA"""
    password: str = Field(..., min_length=8, max_length=50, description="Contraseña (mínimo 8 caracteres)")
    password_confirm: str = Field(..., description="Confirmar contraseña")


class UserUpdate(BaseModel):
    """Schema para actualizar usuario"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    specialty: Optional[str] = Field(None, max_length=100)
    institution: Optional[str] = Field(None, max_length=200)
    settings: Optional[dict] = None


class UserResponse(UserBase):
    """Schema para respuesta - SIN DATOS SENSIBLES"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(..., alias="_id")
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Convertir ObjectId a string
    @property
    def user_id(self) -> str:
        return str(self.id)


# ==================== AUTH SCHEMAS ====================

class LoginRequest(BaseModel):
    """Schema para inicio de sesión"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Respuesta de autenticación"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # minutos


class RefreshTokenRequest(BaseModel):
    """Schema para refresh token"""
    refresh_token: str


# ==================== MENSAJES ====================

class MessageResponse(BaseModel):
    """Respuesta genérica"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    error: str
    status_code: int
    detail: Optional[str] = None