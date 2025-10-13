"""
Schemas de Pydantic para datos bancarios
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TipoCuenta(str, Enum):
    AHORRO = "ahorro"
    CORRIENTE = "corriente"

# Schema base para datos bancarios
class DatosBancariosBase(BaseModel):
    nombre_titular: str = Field(..., min_length=2, max_length=150, description="Nombre completo del titular")
    numero_cuenta: str = Field(..., min_length=8, max_length=50, description="Número de cuenta bancaria")
    banco: str = Field(..., min_length=2, max_length=100, description="Nombre del banco")
    clabe: Optional[str] = Field(None, max_length=18, description="CLABE interbancaria")
    tipo_cuenta: TipoCuenta = Field(default=TipoCuenta.AHORRO, description="Tipo de cuenta")
    es_activa: bool = Field(default=True, description="Si la cuenta está activa")

# Schema para crear datos bancarios
class DatosBancariosCreate(DatosBancariosBase):
    nanny_id: int = Field(..., description="ID de la nanny")

# Schema para actualizar datos bancarios
class DatosBancariosUpdate(BaseModel):
    nombre_titular: Optional[str] = Field(None, min_length=2, max_length=150)
    numero_cuenta: Optional[str] = Field(None, min_length=8, max_length=50)
    banco: Optional[str] = Field(None, min_length=2, max_length=100)
    clabe: Optional[str] = Field(None, max_length=18)
    tipo_cuenta: Optional[TipoCuenta] = None
    es_activa: Optional[bool] = None

# Schema para respuesta de datos bancarios
class DatosBancariosResponse(DatosBancariosBase):
    id: int
    nanny_id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    # Información adicional de la nanny
    nanny_nombre: Optional[str] = None
    nanny_email: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema para listado de datos bancarios (admin)
class DatosBancariosListResponse(BaseModel):
    id: int
    nanny_id: int
    nombre_titular: str
    banco: str
    numero_cuenta_oculto: str  # Solo mostrar últimos 4 dígitos
    tipo_cuenta: TipoCuenta
    es_activa: bool
    fecha_creacion: datetime
    
    # Información de la nanny
    nanny_nombre: str
    nanny_email: str
    nanny_verificada: bool
    
    class Config:
        from_attributes = True

# Schema para estadísticas de datos bancarios
class EstadisticasDatosBancarios(BaseModel):
    total_nannys_con_datos: int
    total_nannys_sin_datos: int
    total_cuentas_activas: int
    total_cuentas_inactivas: int
    bancos_mas_usados: list[dict]