"""
Schemas de autenticación
Modelos Pydantic para validación de datos de autenticación
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserLogin(BaseModel):
    """Schema para login de usuario"""
    email: str  # Temporalmente cambiado de EmailStr a str
    password: str

class Token(BaseModel):
    """Schema para respuesta de token"""
    access_token: str
    token_type: str
    expires_in: int
    user: 'UserBasic'

class TokenData(BaseModel):
    """Schema para datos del token"""
    email: Optional[str] = None

class UserBasic(BaseModel):
    """Schema básico de usuario"""
    id: int
    email: str
    nombre: str
    apellido: str
    tipo_usuario: str
    es_verificado: bool

class UserResponse(BaseModel):
    """Schema completo de respuesta de usuario"""
    id: int
    email: str
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    tipo_usuario: str
    es_verificado: bool
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None

    class Config:
        from_attributes = True

# Actualizar referencia forward
UserBasic.model_rebuild()