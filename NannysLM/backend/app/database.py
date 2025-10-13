"""
Configuración de la base de datos con SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Crear el engine de la base de datos
engine = create_engine(
    settings.database_url,
    echo=settings.debug,  # Mostrar SQL queries en desarrollo
    pool_pre_ping=True,   # Verificar conexiones antes de usarlas
    pool_recycle=300      # Reciclar conexiones cada 5 minutos
)

# Crear session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependencia para obtener la sesión de base de datos
def get_db():
    """
    Dependencia que proporciona una sesión de base de datos.
    Se cierra automáticamente al finalizar la request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para inicializar la base de datos
def init_db():
    """
    Crear todas las tablas en la base de datos.
    Solo usar en desarrollo o para inicialización.
    """
    Base.metadata.create_all(bind=engine)