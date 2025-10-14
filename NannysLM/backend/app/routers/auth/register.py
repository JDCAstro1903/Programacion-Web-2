"""
Router de Registro
Maneja el registro de nuevos usuarios
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Usuario
from app.schemas.auth import UserCreate, UserResponse

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

def get_password_hash(password: str) -> str:
    """Obtener hash de contraseña"""
    return pwd_context.hash(password)

def validate_password(password: str) -> bool:
    """
    Validar que la contraseña cumpla con los requisitos mínimos
    - Al menos 8 caracteres
    - Al menos una letra mayúscula
    - Al menos una letra minúscula
    - Al menos un número
    """
    if len(password) < 8:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    return has_upper and has_lower and has_digit

@router.post("/register", response_model=UserResponse, summary="Registrar nuevo usuario")
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar un nuevo usuario en el sistema
    
    - **nombre**: Nombre del usuario
    - **apellido**: Apellido del usuario
    - **email**: Email único del usuario
    - **password**: Contraseña (mín 8 caracteres, mayús, minús, número)
    - **telefono**: Número de teléfono
    - **tipo_usuario**: Tipo de usuario (cliente, cuidadora, admin)
    """
    
    # Validar contraseña
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
        )
    
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ya está registrado"
        )
    
    # Crear hash de la contraseña
    hashed_password = get_password_hash(user_data.password)
    
    # Crear nuevo usuario
    new_user = Usuario(
        nombre=user_data.nombre,
        apellido=user_data.apellido,
        email=user_data.email,
        password=hashed_password,
        telefono=user_data.telefono,
        tipo_usuario=user_data.tipo_usuario,
        fecha_registro=datetime.now(),
        es_verificado=False,  # Por defecto no verificado
        activo=True
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserResponse(
            id=new_user.id,
            nombre=new_user.nombre,
            apellido=new_user.apellido,
            email=new_user.email,
            telefono=new_user.telefono,
            tipo_usuario=new_user.tipo_usuario,
            fecha_registro=new_user.fecha_registro,
            es_verificado=new_user.es_verificado,
            activo=new_user.activo
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear usuario: email o teléfono ya registrado"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.post("/register/cuidadora", response_model=UserResponse, summary="Registrar nueva cuidadora")
async def register_cuidadora(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar específicamente una nueva cuidadora
    Endpoint especializado que automáticamente asigna el tipo 'cuidadora'
    """
    # Forzar tipo de usuario a cuidadora
    user_data.tipo_usuario = "cuidadora"
    
    return await register_user(user_data, db)

@router.post("/register/cliente", response_model=UserResponse, summary="Registrar nuevo cliente")
async def register_cliente(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar específicamente un nuevo cliente
    Endpoint especializado que automáticamente asigna el tipo 'cliente'
    """
    # Forzar tipo de usuario a cliente
    user_data.tipo_usuario = "cliente"
    
    return await register_user(user_data, db)