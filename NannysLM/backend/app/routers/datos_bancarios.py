"""
Router para manejar datos bancarios - Solo Admin
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.datos_bancarios import (
    DatosBancariosCreate, 
    DatosBancariosUpdate, 
    DatosBancariosResponse,
    DatosBancariosListResponse,
    EstadisticasDatosBancarios
)
from app.services.datos_bancarios_service import DatosBancariosService

router = APIRouter()

@router.post("/", response_model=DatosBancariosResponse, summary="Crear datos bancarios")
async def crear_datos_bancarios(
    datos: DatosBancariosCreate,
    db: Session = Depends(get_db)
):
    """
    Crear nuevos datos bancarios para una nanny.
    Solo administradores pueden realizar esta acción.
    """
    try:
        nuevo_dato = DatosBancariosService.crear_datos_bancarios(db, datos)
        
        # Obtener información adicional de la nanny
        from app.models import Usuario
        nanny = db.query(Usuario).filter(Usuario.id == nuevo_dato.nanny_id).first()
        
        response = DatosBancariosResponse(
            id=nuevo_dato.id,
            nanny_id=nuevo_dato.nanny_id,
            nombre_titular=nuevo_dato.nombre_titular,
            numero_cuenta=nuevo_dato.numero_cuenta,
            banco=nuevo_dato.banco,
            clabe=nuevo_dato.clabe,
            tipo_cuenta=nuevo_dato.tipo_cuenta,
            es_activa=nuevo_dato.es_activa,
            fecha_creacion=nuevo_dato.fecha_creacion,
            fecha_actualizacion=nuevo_dato.fecha_actualizacion,
            nanny_nombre=f"{nanny.nombre} {nanny.apellido}" if nanny else None,
            nanny_email=nanny.email if nanny else None
        )
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/", summary="Listar todos los datos bancarios")
async def listar_datos_bancarios(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    banco: Optional[str] = Query(None, description="Filtrar por banco"),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de todos los datos bancarios registrados.
    Solo administradores pueden acceder a esta información.
    """
    try:
        if banco:
            datos = DatosBancariosService.buscar_por_banco(db, banco)
        else:
            datos = DatosBancariosService.listar_todos_los_datos_bancarios(db, skip, limit)
        
        return {
            "datos": datos,
            "total": len(datos),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/estadisticas", response_model=EstadisticasDatosBancarios, summary="Estadísticas de datos bancarios")
async def obtener_estadisticas(db: Session = Depends(get_db)):
    """
    Obtener estadísticas generales de los datos bancarios.
    Información útil para el dashboard del administrador.
    """
    try:
        stats = DatosBancariosService.obtener_estadisticas(db)
        return EstadisticasDatosBancarios(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/nanny/{nanny_id}", response_model=DatosBancariosResponse, summary="Obtener datos bancarios de una nanny")
async def obtener_datos_bancarios_nanny(
    nanny_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener los datos bancarios de una nanny específica.
    """
    try:
        datos = DatosBancariosService.obtener_datos_bancarios_por_nanny(db, nanny_id)
        
        if not datos:
            raise HTTPException(status_code=404, detail="No se encontraron datos bancarios para esta nanny")
        
        # Obtener información de la nanny
        from app.models import Usuario
        nanny = db.query(Usuario).filter(Usuario.id == datos.nanny_id).first()
        
        response = DatosBancariosResponse(
            id=datos.id,
            nanny_id=datos.nanny_id,
            nombre_titular=datos.nombre_titular,
            numero_cuenta=datos.numero_cuenta,
            banco=datos.banco,
            clabe=datos.clabe,
            tipo_cuenta=datos.tipo_cuenta,
            es_activa=datos.es_activa,
            fecha_creacion=datos.fecha_creacion,
            fecha_actualizacion=datos.fecha_actualizacion,
            nanny_nombre=f"{nanny.nombre} {nanny.apellido}" if nanny else None,
            nanny_email=nanny.email if nanny else None
        )
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{datos_id}", response_model=DatosBancariosResponse, summary="Obtener datos bancarios por ID")
async def obtener_datos_bancarios_por_id(
    datos_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener datos bancarios específicos por su ID.
    """
    try:
        datos = DatosBancariosService.obtener_datos_bancarios_por_id(db, datos_id)
        
        if not datos:
            raise HTTPException(status_code=404, detail="Datos bancarios no encontrados")
        
        # Obtener información de la nanny
        from app.models import Usuario
        nanny = db.query(Usuario).filter(Usuario.id == datos.nanny_id).first()
        
        response = DatosBancariosResponse(
            id=datos.id,
            nanny_id=datos.nanny_id,
            nombre_titular=datos.nombre_titular,
            numero_cuenta=datos.numero_cuenta,
            banco=datos.banco,
            clabe=datos.clabe,
            tipo_cuenta=datos.tipo_cuenta,
            es_activa=datos.es_activa,
            fecha_creacion=datos.fecha_creacion,
            fecha_actualizacion=datos.fecha_actualizacion,
            nanny_nombre=f"{nanny.nombre} {nanny.apellido}" if nanny else None,
            nanny_email=nanny.email if nanny else None
        )
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/{datos_id}", response_model=DatosBancariosResponse, summary="Actualizar datos bancarios")
async def actualizar_datos_bancarios(
    datos_id: int,
    datos_update: DatosBancariosUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar datos bancarios existentes.
    Solo administradores pueden realizar esta acción.
    """
    try:
        datos_actualizados = DatosBancariosService.actualizar_datos_bancarios(db, datos_id, datos_update)
        
        # Obtener información de la nanny
        from app.models import Usuario
        nanny = db.query(Usuario).filter(Usuario.id == datos_actualizados.nanny_id).first()
        
        response = DatosBancariosResponse(
            id=datos_actualizados.id,
            nanny_id=datos_actualizados.nanny_id,
            nombre_titular=datos_actualizados.nombre_titular,
            numero_cuenta=datos_actualizados.numero_cuenta,
            banco=datos_actualizados.banco,
            clabe=datos_actualizados.clabe,
            tipo_cuenta=datos_actualizados.tipo_cuenta,
            es_activa=datos_actualizados.es_activa,
            fecha_creacion=datos_actualizados.fecha_creacion,
            fecha_actualizacion=datos_actualizados.fecha_actualizacion,
            nanny_nombre=f"{nanny.nombre} {nanny.apellido}" if nanny else None,
            nanny_email=nanny.email if nanny else None
        )
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.delete("/{datos_id}", summary="Eliminar datos bancarios")
async def eliminar_datos_bancarios(
    datos_id: int,
    db: Session = Depends(get_db)
):
    """
    Eliminar (desactivar) datos bancarios.
    Solo administradores pueden realizar esta acción.
    """
    try:
        eliminado = DatosBancariosService.eliminar_datos_bancarios(db, datos_id)
        
        if eliminado:
            return {"message": "Datos bancarios eliminados correctamente", "id": datos_id}
        else:
            raise HTTPException(status_code=500, detail="Error al eliminar los datos bancarios")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/buscar/banco", summary="Buscar por banco")
async def buscar_por_banco(
    banco: str = Query(..., description="Nombre del banco a buscar"),
    db: Session = Depends(get_db)
):
    """
    Buscar datos bancarios por nombre de banco.
    """
    try:
        datos = DatosBancariosService.buscar_por_banco(db, banco)
        
        return {
            "datos": datos,
            "total": len(datos),
            "banco_buscado": banco
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")