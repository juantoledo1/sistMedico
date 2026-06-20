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
    phone: Optional[str] = Field(None, max_length=20, description="Teléfono (solo admin)")
    status: str = Field("inactive", description="Estado: active | inactive | suspended")
    is_active: bool = True
    is_deleted: bool = False  # Soft delete


class UserCreate(UserBase):
    """Schema para crear usuario - CONTRASEÑA"""
    password: str = Field(..., min_length=8, max_length=50, description="Contraseña (mínimo 8 caracteres)")
    password_confirm: str = Field(..., description="Confirmar contraseña")
    phone: Optional[str] = Field(None, max_length=20, description="Teléfono")


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


# ==================== ADMIN SCHEMAS ====================

class UserListResponse(BaseModel):
    """Respuesta para lista de usuarios (admin)"""
    id: str
    email: str
    full_name: Optional[str] = None
    specialty: Optional[str] = None
    institution: Optional[str] = None
    phone: Optional[str] = None
    status: str = "inactive"
    is_active: bool = True
    is_admin: bool = False
    is_deleted: bool = False
    created_at: Optional[datetime] = None


class ToggleActiveRequest(BaseModel):
    """Request para activar/desactivar usuario"""
    is_active: bool


class AdminRegisterRequest(BaseModel):
    """Request para crear admin - secreto en body"""
    user_data: UserCreate
    secret: str


class UserUpdateByAdmin(BaseModel):
    """Schema para admin actualizar usuario"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    specialty: Optional[str] = Field(None, max_length=100)
    institution: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, pattern=r"^(active|inactive|suspended)$")
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class ResetPasswordResponse(BaseModel):
    """Respuesta para reset de contraseña - NUNCA devuelve pass en texto plano"""
    message: str = "Contraseña reseteada. El usuario debe cambiarla."