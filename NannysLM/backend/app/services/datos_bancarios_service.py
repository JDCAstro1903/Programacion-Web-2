"""
Servicios para manejar datos bancarios
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import DatosBancarios, Usuario, PerfilNanny
from app.schemas.datos_bancarios import DatosBancariosCreate, DatosBancariosUpdate
from typing import List, Optional, Dict, Any
from fastapi import HTTPException

class DatosBancariosService:
    
    @staticmethod
    def crear_datos_bancarios(db: Session, datos: DatosBancariosCreate) -> DatosBancarios:
        """Crear nuevos datos bancarios para una nanny"""
        
        # Verificar que la nanny existe
        nanny = db.query(Usuario).filter(
            Usuario.id == datos.nanny_id,
            Usuario.tipo_usuario == "nanny"
        ).first()
        
        if not nanny:
            raise HTTPException(status_code=404, detail="Nanny no encontrada")
        
        # Verificar que no tenga datos bancarios activos
        datos_existentes = db.query(DatosBancarios).filter(
            DatosBancarios.nanny_id == datos.nanny_id,
            DatosBancarios.es_activa == True
        ).first()
        
        if datos_existentes:
            raise HTTPException(
                status_code=400, 
                detail="La nanny ya tiene datos bancarios activos"
            )
        
        # Crear los datos bancarios
        db_datos = DatosBancarios(**datos.dict())
        db.add(db_datos)
        db.commit()
        db.refresh(db_datos)
        
        return db_datos
    
    @staticmethod
    def obtener_datos_bancarios_por_id(db: Session, datos_id: int) -> Optional[DatosBancarios]:
        """Obtener datos bancarios por ID"""
        return db.query(DatosBancarios).filter(DatosBancarios.id == datos_id).first()
    
    @staticmethod
    def obtener_datos_bancarios_por_nanny(db: Session, nanny_id: int) -> Optional[DatosBancarios]:
        """Obtener datos bancarios de una nanny específica"""
        return db.query(DatosBancarios).filter(
            DatosBancarios.nanny_id == nanny_id,
            DatosBancarios.es_activa == True
        ).first()
    
    @staticmethod
    def listar_todos_los_datos_bancarios(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Listar todos los datos bancarios con información de las nannys"""
        query = db.query(
            DatosBancarios.id,
            DatosBancarios.nanny_id,
            DatosBancarios.nombre_titular,
            DatosBancarios.banco,
            DatosBancarios.numero_cuenta,
            DatosBancarios.tipo_cuenta,
            DatosBancarios.es_activa,
            DatosBancarios.fecha_creacion,
            Usuario.nombre,
            Usuario.apellido,
            Usuario.email,
            Usuario.esta_verificado
        ).join(Usuario, DatosBancarios.nanny_id == Usuario.id).filter(
            Usuario.tipo_usuario == "nanny"
        ).order_by(desc(DatosBancarios.fecha_creacion)).offset(skip).limit(limit)
        
        resultados = query.all()
        
        # Formatear los resultados
        datos_formateados = []
        for resultado in resultados:
            # Ocultar número de cuenta (mostrar solo últimos 4 dígitos)
            numero_oculto = f"****{resultado.numero_cuenta[-4:]}" if len(resultado.numero_cuenta) >= 4 else "****"
            
            datos_formateados.append({
                "id": resultado.id,
                "nanny_id": resultado.nanny_id,
                "nombre_titular": resultado.nombre_titular,
                "banco": resultado.banco,
                "numero_cuenta_oculto": numero_oculto,
                "numero_cuenta_completo": resultado.numero_cuenta,  # Solo para admin
                "tipo_cuenta": resultado.tipo_cuenta,
                "es_activa": resultado.es_activa,
                "fecha_creacion": resultado.fecha_creacion,
                "nanny_nombre": f"{resultado.nombre} {resultado.apellido}",
                "nanny_email": resultado.email,
                "nanny_verificada": resultado.esta_verificado
            })
        
        return datos_formateados
    
    @staticmethod
    def actualizar_datos_bancarios(db: Session, datos_id: int, datos_update: DatosBancariosUpdate) -> Optional[DatosBancarios]:
        """Actualizar datos bancarios existentes"""
        db_datos = db.query(DatosBancarios).filter(DatosBancarios.id == datos_id).first()
        
        if not db_datos:
            raise HTTPException(status_code=404, detail="Datos bancarios no encontrados")
        
        # Actualizar solo los campos proporcionados
        update_data = datos_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_datos, field, value)
        
        db.commit()
        db.refresh(db_datos)
        
        return db_datos
    
    @staticmethod
    def eliminar_datos_bancarios(db: Session, datos_id: int) -> bool:
        """Eliminar datos bancarios (soft delete - marcar como inactiva)"""
        db_datos = db.query(DatosBancarios).filter(DatosBancarios.id == datos_id).first()
        
        if not db_datos:
            raise HTTPException(status_code=404, detail="Datos bancarios no encontrados")
        
        # Soft delete - marcar como inactiva
        db_datos.es_activa = False
        db.commit()
        
        return True
    
    @staticmethod
    def obtener_estadisticas(db: Session) -> Dict[str, Any]:
        """Obtener estadísticas de datos bancarios"""
        
        # Total de nannys
        total_nannys = db.query(Usuario).filter(Usuario.tipo_usuario == "nanny").count()
        
        # Nannys con datos bancarios
        nannys_con_datos = db.query(DatosBancarios.nanny_id).filter(
            DatosBancarios.es_activa == True
        ).distinct().count()
        
        # Nannys sin datos bancarios
        nannys_sin_datos = total_nannys - nannys_con_datos
        
        # Cuentas activas/inactivas
        cuentas_activas = db.query(DatosBancarios).filter(DatosBancarios.es_activa == True).count()
        cuentas_inactivas = db.query(DatosBancarios).filter(DatosBancarios.es_activa == False).count()
        
        # Bancos más usados
        bancos_query = db.query(
            DatosBancarios.banco,
            func.count(DatosBancarios.id).label('count')
        ).filter(
            DatosBancarios.es_activa == True
        ).group_by(DatosBancarios.banco).order_by(desc('count')).limit(5)
        
        bancos_mas_usados = [
            {"banco": banco, "count": count} 
            for banco, count in bancos_query.all()
        ]
        
        return {
            "total_nannys_con_datos": nannys_con_datos,
            "total_nannys_sin_datos": nannys_sin_datos,
            "total_cuentas_activas": cuentas_activas,
            "total_cuentas_inactivas": cuentas_inactivas,
            "bancos_mas_usados": bancos_mas_usados
        }
    
    @staticmethod
    def buscar_por_banco(db: Session, banco: str) -> List[Dict[str, Any]]:
        """Buscar datos bancarios por banco"""
        query = db.query(
            DatosBancarios.id,
            DatosBancarios.nanny_id,
            DatosBancarios.nombre_titular,
            DatosBancarios.banco,
            DatosBancarios.numero_cuenta,
            DatosBancarios.tipo_cuenta,
            DatosBancarios.es_activa,
            Usuario.nombre,
            Usuario.apellido,
            Usuario.email
        ).join(Usuario, DatosBancarios.nanny_id == Usuario.id).filter(
            DatosBancarios.banco.ilike(f"%{banco}%"),
            Usuario.tipo_usuario == "nanny"
        ).order_by(DatosBancarios.nombre_titular)
        
        resultados = query.all()
        
        return [
            {
                "id": r.id,
                "nanny_id": r.nanny_id,
                "nombre_titular": r.nombre_titular,
                "banco": r.banco,
                "numero_cuenta_oculto": f"****{r.numero_cuenta[-4:]}",
                "tipo_cuenta": r.tipo_cuenta,
                "es_activa": r.es_activa,
                "nanny_nombre": f"{r.nombre} {r.apellido}",
                "nanny_email": r.email
            }
            for r in resultados
        ]