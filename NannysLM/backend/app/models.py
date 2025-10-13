"""
Modelos de base de datos usando SQLAlchemy
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Decimal, Enum, ForeignKey, JSON, Time, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# Enums para tipos de datos específicos
class TipoUsuario(str, enum.Enum):
    ADMIN = "admin"
    CLIENTE = "cliente"
    NANNY = "nanny"

class EstadoServicio(str, enum.Enum):
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    EN_PROGRESO = "en_progreso"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"

class EstadoPago(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    SIN_VERIFICAR = "sin_verificar"
    REEMBOLSADO = "reembolsado"

class MetodoPago(str, enum.Enum):
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    TARJETA = "tarjeta"
    PAYPAL = "paypal"

class EstadoDisponibilidad(str, enum.Enum):
    DISPONIBLE = "disponible"
    OCUPADA = "ocupada"
    INACTIVA = "inactiva"

class TipoCuenta(str, enum.Enum):
    AHORRO = "ahorro"
    CORRIENTE = "corriente"

class TipoNotificacion(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

# Modelo Usuario
class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    telefono = Column(String(20))
    direccion = Column(Text)
    password_hash = Column(String(255), nullable=False)
    tipo_usuario = Column(Enum(TipoUsuario), nullable=False, index=True)
    foto_perfil = Column(String(500))
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    esta_activo = Column(Boolean, default=True, index=True)
    esta_verificado = Column(Boolean, default=False)
    documento_identificacion = Column(String(500))
    
    # Relaciones
    perfil_nanny = relationship("PerfilNanny", back_populates="usuario", uselist=False)
    servicios_como_cliente = relationship("Servicio", foreign_keys="Servicio.cliente_id", back_populates="cliente")
    servicios_como_nanny = relationship("Servicio", foreign_keys="Servicio.nanny_id", back_populates="nanny")
    pagos_como_cliente = relationship("Pago", foreign_keys="Pago.cliente_id", back_populates="cliente")
    pagos_como_nanny = relationship("Pago", foreign_keys="Pago.nanny_id", back_populates="nanny")
    calificaciones_como_cliente = relationship("Calificacion", foreign_keys="Calificacion.cliente_id", back_populates="cliente")
    calificaciones_como_nanny = relationship("Calificacion", foreign_keys="Calificacion.nanny_id", back_populates="nanny")
    datos_bancarios = relationship("DatosBancarios", back_populates="nanny")
    notificaciones = relationship("Notificacion", back_populates="usuario")

# Modelo Perfil Nanny
class PerfilNanny(Base):
    __tablename__ = "perfiles_nanny"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    experiencia_anos = Column(Integer, default=0)
    tarifa_hora = Column(Decimal(8, 2), nullable=False)
    disponibilidad = Column(JSON)
    especialidades = Column(Text)
    certificaciones = Column(Text)
    descripcion_personal = Column(Text)
    calificacion_promedio = Column(Decimal(3, 2), default=0.00)
    total_servicios_completados = Column(Integer, default=0)
    total_calificaciones = Column(Integer, default=0)
    estado_disponibilidad = Column(Enum(EstadoDisponibilidad), default=EstadoDisponibilidad.DISPONIBLE, index=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="perfil_nanny")

# Modelo Tipo de Servicio
class TipoServicio(Base):
    __tablename__ = "tipos_servicios"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    permite_multiples_dias = Column(Boolean, default=False)
    tarifa_base = Column(Decimal(8, 2))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    servicios = relationship("Servicio", back_populates="tipo_servicio")

# Modelo Servicio
class Servicio(Base):
    __tablename__ = "servicios"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nanny_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    tipo_servicio_id = Column(Integer, ForeignKey("tipos_servicios.id"), nullable=False)
    fecha_inicio = Column(Date, nullable=False, index=True)
    fecha_fin = Column(Date)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    ubicacion = Column(Text, nullable=False)
    instrucciones_especiales = Column(Text)
    estado = Column(Enum(EstadoServicio), default=EstadoServicio.PENDIENTE, index=True)
    tarifa_acordada = Column(Decimal(8, 2), nullable=False)
    total_horas = Column(Decimal(4, 2))
    costo_total = Column(Decimal(10, 2), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    motivo_cancelacion = Column(Text)
    cancelado_por = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    
    # Relaciones
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="servicios_como_cliente")
    nanny = relationship("Usuario", foreign_keys=[nanny_id], back_populates="servicios_como_nanny")
    tipo_servicio = relationship("TipoServicio", back_populates="servicios")
    pagos = relationship("Pago", back_populates="servicio")
    calificaciones = relationship("Calificacion", back_populates="servicio", uselist=False)

# Modelo Pago
class Pago(Base):
    __tablename__ = "pagos"
    
    id = Column(Integer, primary_key=True, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nanny_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    monto = Column(Decimal(10, 2), nullable=False)
    estado = Column(Enum(EstadoPago), default=EstadoPago.PENDIENTE, index=True)
    metodo_pago = Column(Enum(MetodoPago), default=MetodoPago.TRANSFERENCIA)
    comprobante_pago = Column(String(500))
    referencia_transaccion = Column(String(100))
    fecha_pago = Column(DateTime(timezone=True), index=True)
    fecha_verificacion = Column(DateTime(timezone=True))
    verificado_por = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    notas_admin = Column(Text)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    servicio = relationship("Servicio", back_populates="pagos")
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="pagos_como_cliente")
    nanny = relationship("Usuario", foreign_keys=[nanny_id], back_populates="pagos_como_nanny")

# Modelo Calificación
class Calificacion(Base):
    __tablename__ = "calificaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"), nullable=False, unique=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nanny_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    calificacion_cliente_a_nanny = Column(Integer)
    comentario_cliente = Column(Text)
    calificacion_nanny_a_cliente = Column(Integer)
    comentario_nanny = Column(Text)
    fecha_calificacion_cliente = Column(DateTime(timezone=True))
    fecha_calificacion_nanny = Column(DateTime(timezone=True))
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    servicio = relationship("Servicio", back_populates="calificaciones")
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="calificaciones_como_cliente")
    nanny = relationship("Usuario", foreign_keys=[nanny_id], back_populates="calificaciones_como_nanny")

# Modelo Datos Bancarios
class DatosBancarios(Base):
    __tablename__ = "datos_bancarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nanny_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre_titular = Column(String(150), nullable=False)
    numero_cuenta = Column(String(50), nullable=False)
    banco = Column(String(100), nullable=False)
    clabe = Column(String(18))
    tipo_cuenta = Column(Enum(TipoCuenta), default=TipoCuenta.AHORRO)
    es_activa = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    nanny = relationship("Usuario", back_populates="datos_bancarios")

# Modelo Notificación
class Notificacion(Base):
    __tablename__ = "notificaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=False)
    tipo = Column(Enum(TipoNotificacion), default=TipoNotificacion.INFO)
    leida = Column(Boolean, default=False, index=True)
    url_accion = Column(String(500))
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    fecha_lectura = Column(DateTime(timezone=True))
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="notificaciones")

# Modelo Configuración
class Configuracion(Base):
    __tablename__ = "configuraciones"
    
    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), unique=True, nullable=False)
    valor = Column(Text)
    descripcion = Column(Text)
    tipo_dato = Column(Enum("string", "number", "boolean", "json", name="tipo_dato_enum"), default="string")
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())