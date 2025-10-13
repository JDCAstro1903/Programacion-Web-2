#!/usr/bin/env python3
"""
Script de inicio para el servidor FastAPI
"""
import sys
import os
import uvicorn

# Agregar el directorio actual al Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    print(" Iniciando servidor NannysLM Backend...")
    print(" URL: http://localhost:8000")
    print(" Documentación: http://localhost:8000/docs")
    print(" Recarga automática activada")
    print("-" * 50)
    
    # Configuración del servidor
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )