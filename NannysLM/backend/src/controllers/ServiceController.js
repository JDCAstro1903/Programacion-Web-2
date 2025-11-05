const Service = require('../models/Service');

class ServiceController {
  /**
   * Obtener todos los servicios con filtros opcionales
   */
  static async getAllServices(req, res) {
    try {
      const { clientId, status, limit = 100 } = req.query;
      
      const result = await Service.getAll(clientId, status, limit);
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
}

module.exports = ServiceController;
