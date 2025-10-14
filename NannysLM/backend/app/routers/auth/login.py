"""
Router de Login
Maneja la autenticación de usuarios
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Usuario
from app.schemas.auth import Token, UserResponse

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

router = APIRouter()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str) -> Optional[Usuario]:
    """Autenticar usuario"""
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token de acceso JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

@router.post("/login", response_model=Token, summary="Iniciar sesión")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Iniciar sesión con email y contraseña
    
    - **username**: Email del usuario
    - **password**: Contraseña del usuario
    
    Retorna un token JWT válido por el tiempo configurado
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.tipo_usuario}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "tipo_usuario": user.tipo_usuario,
            "es_verificado": user.es_verificado
        }
    }

@router.get("/test-users", summary="Ver usuarios de prueba")
async def get_test_users(db: Session = Depends(get_db)):
    """
    Endpoint para ver usuarios disponibles (solo desarrollo)
    Útil para probar el login con usuarios existentes
    """
    users = db.query(Usuario).limit(5).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "nombre": f"{user.nombre} {user.apellido}",
            "tipo_usuario": user.tipo_usuario,
            "es_verificado": user.es_verificado
        }
        for user in users
    ]

@router.post("/logout", summary="Cerrar sesión")
async def logout():
    """
    Cerrar sesión del usuario
    Nota: Con JWT stateless, el logout se maneja del lado del cliente
    eliminando el token. Aquí se puede implementar una blacklist si es necesario.
    """
    return {"message": "Sesión cerrada exitosamente"}