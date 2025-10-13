"""
Aplicación principal de FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
import os

# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API para la plataforma de cuidadoras NannysLM",
    debug=settings.debug
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

# Servir archivos estáticos
if os.path.exists(settings.upload_folder):
    app.mount("/uploads", StaticFiles(directory=settings.upload_folder), name="uploads")

# Rutas principales
@app.get("/")
async def root():
    """Endpoint de bienvenida"""
    return {
        "message": f"Bienvenido a {settings.app_name}",
        "version": settings.app_version,
        "environment": settings.environment,
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Endpoint para verificar el estado de la API"""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version
    }

# Incluir routers
from app.routers import datos_bancarios, auth
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(datos_bancarios.router, prefix="/api/v1/datos-bancarios", tags=["datos-bancarios"])

# Routers pendientes de implementar
# from app.routers import users, services, payments
# app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
# app.include_router(services.router, prefix="/api/v1/services", tags=["services"])
# app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )