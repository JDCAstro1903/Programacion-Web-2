const Service = require('../models/Service');

class ServiceController {
  /**
   * Obtener todos los servicios con filtros opcionales
   */
  static async getAllServices(req, res) {
    try {
      const { clientId, nannyId, status, limit = 100 } = req.query;
      
      console.log('📋 GET /api/services - Parámetros:', { clientId, nannyId, status, limit });
      
      const result = await Service.getAll(clientId, nannyId, status, limit);
      return res.json({ success: true, data: result.data || [] });
    } catch (error) {
      console.error('Error fetching services:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Obtener un servicio por ID
   */
  static async getServiceById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Service.getById(id);
      
      if (!result.success || result.data.length === 0) {
        return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
      }
      
      return res.json({ success: true, data: result.data[0] });
    } catch (error) {
      console.error('Error fetching service:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Crear un nuevo servicio
   */
  static async createService(req, res) {
    try {
      console.log('📥 POST /api/services - Body recibido:', JSON.stringify(req.body, null, 2));
      
      const {
        client_id,
        title,
        service_type,
        start_date,
        start_time,
        end_time
      } = req.body;

      // Validar campos requeridos
      if (!client_id || !title || !service_type || !start_date || !start_time || !end_time) {
        console.log('❌ Validación fallida - Campos faltantes:', { client_id, title, service_type, start_date, start_time, end_time });
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: client_id, title, service_type, start_date, start_time, end_time'
        });
      }

      const result = await Service.create(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating service:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Actualizar un servicio existente
   */
  static async updateService(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Service.update(id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.json({ success: true, message: 'Servicio actualizado exitosamente' });
    } catch (error) {
      console.error('Error updating service:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Eliminar un servicio
   */
  static async deleteService(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Service.delete(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.json({ success: true, message: 'Servicio cancelado exitosamente' });
    } catch (error) {
      console.error('Error deleting service:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Obtener disponibilidad de nannys
   */
  static async getNannyAvailability(req, res) {
    try {
      const { startDate, endDate, startTime, endTime } = req.query;

      if (!startDate || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos: startDate, startTime, endTime'
        });
      }

      const query = `
        SELECT 
          n.id as nanny_id,
          n.rating_average,
          n.hourly_rate,
          u.first_name,
          u.last_name,
          u.profile_image,
          na.date,
          na.start_time,
          na.end_time,
          na.is_available
        FROM nannys n
        INNER JOIN users u ON n.user_id = u.id
        INNER JOIN nanny_availability na ON n.id = na.nanny_id
        WHERE 
          n.status = 'active'
          AND u.is_active = TRUE
          AND na.date >= ?
          AND na.date <= ?
          AND na.start_time <= ?
          AND na.end_time >= ?
          AND na.is_available = TRUE
        ORDER BY n.rating_average DESC, n.hourly_rate ASC
      `;

      const { executeQuery } = require('../config/database');
      const result = await executeQuery(query, [
        startDate,
        endDate || startDate,
        startTime,
        endTime
      ]);

      return res.json({ success: true, data: result.data || [] });
    } catch (error) {
      console.error('Error fetching nanny availability:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Aceptar un servicio por parte de una nanny
   */
  static async acceptService(req, res) {
    try {
      const { serviceId } = req.params;
      const { nanny_id } = req.body;

      console.log(`🤝 Request to accept service ${serviceId} by nanny ${nanny_id}`);

      if (!nanny_id) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el ID de la nanny (nanny_id)'
        });
      }

      const result = await Service.acceptService(serviceId, nanny_id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Error accepting service:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Completar un servicio (marcarlo como finalizado)
   */
  static async completeService(req, res) {
    try {
      const serviceId = req.params.serviceId;

      if (!serviceId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el ID del servicio'
        });
      }

      // Primero obtener el servicio para saber qué nanny lo realizó
      const getServiceQuery = `SELECT nanny_id, status FROM services WHERE id = ?`;
      const { executeQuery } = require('../config/database');
      const serviceResult = await executeQuery(getServiceQuery, [serviceId]);

      if (!serviceResult.success || serviceResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      const service = serviceResult.data[0];
      const nannyId = service.nanny_id;

      // Si el servicio ya estaba completado, no hacer nada
      if (service.status === 'completed') {
        return res.json({
          success: true,
          message: 'El servicio ya estaba completado'
        });
      }

      // Actualizar el estado del servicio a completado
      const updateServiceResult = await Service.update(serviceId, { status: 'completed', completed_at: new Date() });

      if (!updateServiceResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Error al completar el servicio'
        });
      }

      // Si hay una nanny asignada, incrementar su contador de servicios completados
      if (nannyId) {
        const incrementQuery = `
          UPDATE nannys 
          SET services_completed = services_completed + 1
          WHERE id = ?
        `;
        
        await executeQuery(incrementQuery, [nannyId]);
        console.log(`✓ Contador de servicios completados incrementado para nanny ${nannyId}`);
      }

      console.log(`✓ Servicio ${serviceId} marcado como completado`);

      return res.json({
        success: true,
        message: 'Servicio completado exitosamente',
        data: { serviceId, status: 'completed', nannyId }
      });
    } catch (error) {
      console.error('Error completing service:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ServiceController;
