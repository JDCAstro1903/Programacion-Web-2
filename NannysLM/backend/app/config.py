"""
Configuración principal de la aplicación FastAPI
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Settings(BaseSettings):
    # Configuración de la aplicación
    app_name: str = "NannysLM API"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"
    
    # Base de datos (configuración adaptada desde PHP)
    database_url: str = "mysql+pymysql://root:root@localhost:3306/nannys_lm"
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "root"
    db_name: str = "nannys_lm"
    
    # Seguridad
    secret_key: str = "tu-clave-secreta-muy-segura-aqui-cambiar-en-produccion"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:4200", "http://127.0.0.1:4200"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    # Archivos
    upload_folder: str = "uploads"
    max_file_size: int = 5242880  # 5MB
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Instancia global de configuración
settings = Settings()

# Crear directorio de uploads si no existe
os.makedirs(settings.upload_folder, exist_ok=True)