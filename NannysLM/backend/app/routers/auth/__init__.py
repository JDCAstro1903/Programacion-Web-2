"""
Módulo de autenticación
Contiene todas las rutas relacionadas with login y registro
"""
from .login import router as login_router
from .register import router as register_router
from fastapi import APIRouter

# Router principal de autenticación
router = APIRouter()

# Incluir sub-routers
router.include_router(login_router, tags=["Login"])
router.include_router(register_router, tags=["Registro"])