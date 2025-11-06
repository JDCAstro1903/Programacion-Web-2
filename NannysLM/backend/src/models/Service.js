const { executeQuery } = require('../config/database');

class Service {
  /**
   * Encuentra la mejor nanny disponible para un servicio
   */
  static async findAvailableNanny(startDate, endDate, startTime, endTime, numberOfChildren) {
    try {
      console.log('🔍 Buscando nanny con parámetros:', { startDate, endDate: endDate || startDate, startTime, endTime, numberOfChildren });
      
      const query = `
        SELECT DISTINCT 
          n.id as nanny_id,
          n.rating_average,
          u.first_name,
          u.last_name,
          u.id as user_id,
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
          AND na.date = ?
          AND na.is_available = TRUE
        ORDER BY n.rating_average DESC
        LIMIT 1
      `;
      
      const params = [startDate];
      console.log('📝 Query params:', params);
      
      const result = await executeQuery(query, params);
      
      console.log('📊 Resultado de búsqueda:', {
        success: result.success,
        rowCount: result.data?.length || 0,
        data: result.data
      });
      
      if (result.success && result.data.length > 0) {
        return result.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error finding available nanny:', error);
      return null;
    }
  }

  /**
   * Calcula el total de horas entre dos tiempos
   */
  static calculateTotalHours(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    // Manejar el caso de que el servicio cruce la medianoche
    if (hours < 0) {
      hours += 24;
    }
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    return hours + (minutes / 60);
  }

  /**
   * Actualiza la disponibilidad de la nanny - marca como ocupada
   */
  static async updateNannyAvailability(nannyId, startDate, endDate, startTime, endTime) {
    try {
      const updateQuery = `
        UPDATE nanny_availability 
        SET is_available = FALSE, reason = 'Servicio reservado'
        WHERE nanny_id = ?
          AND date = ?
          AND is_available = TRUE
      `;
      
      await executeQuery(updateQuery, [
        nannyId,
        startDate
      ]);
      
      console.log(`✅ Disponibilidad actualizada para nanny ID: ${nannyId} en fecha: ${startDate}`);
    } catch (error) {
      console.error('Error updating nanny availability:', error);
    }
  }

  /**
   * Envía una notificación a la nanny
   */
  static async notifyNanny(nannyUserId, serviceId, serviceTitle, startDate, startTime) {
    try {
      const notification = {
        user_id: nannyUserId,
        title: 'Nuevo servicio asignado',
        message: `Se te ha asignado el servicio "${serviceTitle}" para el ${startDate} a las ${startTime}`,
        type: 'service',
        is_read: false,
        action_url: `/nanny/services/${serviceId}`,
        related_id: serviceId,
        related_type: 'service'
      };
      
      const insertQuery = `
        INSERT INTO notifications (user_id, title, message, type, is_read, action_url, related_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await executeQuery(insertQuery, [
        notification.user_id,
        notification.title,
        notification.message,
        notification.type,
        notification.is_read,
        notification.action_url,
        notification.related_id,
        notification.related_type
      ]);
      
      console.log(`✅ Notificación enviada a nanny (user_id: ${nannyUserId})`);
    } catch (error) {
      console.error('Error sending notification to nanny:', error);
    }
  }

  /**
   * Obtener servicios con filtros
   */
  static async getAll(clientId = null, status = null, limit = 100) {
    try {
      let query = `
        SELECT 
          s.*,
          c.user_id as client_user_id,
          uc.first_name as client_first_name,
          uc.last_name as client_last_name,
          n.user_id as nanny_user_id,
          un.first_name as nanny_first_name,
          un.last_name as nanny_last_name,
          n.rating_average as nanny_rating
        FROM services s
        INNER JOIN clients c ON s.client_id = c.id
        INNER JOIN users uc ON c.user_id = uc.id
        LEFT JOIN nannys n ON s.nanny_id = n.id
        LEFT JOIN users un ON n.user_id = un.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (clientId) {
        query += ' AND s.client_id = ?';
        params.push(clientId);
      }
      
      if (status) {
        query += ' AND s.status = ?';
        params.push(status);
      }
      
      const limitNum = parseInt(limit) || 100;
      query += ` ORDER BY s.created_at DESC LIMIT ${limitNum}`;
      
      const result = await executeQuery(query, params);
      return result;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Obtener un servicio por ID
   */
  static async getById(serviceId) {
    try {
      const query = `
        SELECT 
          s.*,
          c.user_id as client_user_id,
          uc.first_name as client_first_name,
          uc.last_name as client_last_name,
          uc.email as client_email,
          uc.phone_number as client_phone,
          n.user_id as nanny_user_id,
          un.first_name as nanny_first_name,
          un.last_name as nanny_last_name,
          un.email as nanny_email,
          un.phone_number as nanny_phone,
          un.profile_image as nanny_profile_image,
          n.rating_average as nanny_rating,
          n.hourly_rate as nanny_rate
        FROM services s
        INNER JOIN clients c ON s.client_id = c.id
        INNER JOIN users uc ON c.user_id = uc.id
        LEFT JOIN nannys n ON s.nanny_id = n.id
        LEFT JOIN users un ON n.user_id = un.id
        WHERE s.id = ?
      `;
      
      const result = await executeQuery(query, [serviceId]);
      return result;
    } catch (error) {
      console.error('Error fetching service by ID:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo servicio con asignación automática de nanny
   */
  static async create(serviceData) {
    try {
      const {
        client_id,
        title,
        service_type,
        description,
        start_date,
        end_date,
        start_time,
        end_time,
        number_of_children,
        special_instructions,
        address
      } = serviceData;

      // Normalizar formato de tiempo (agregar segundos si no los tiene)
      const normalizedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
      const normalizedEndTime = end_time.length === 5 ? `${end_time}:00` : end_time;
      
      console.log('⏰ Tiempos normalizados:', { 
        original: { start_time, end_time }, 
        normalized: { normalizedStartTime, normalizedEndTime } 
      });

      // Buscar nanny disponible
      const availableNanny = await this.findAvailableNanny(
        start_date,
        end_date,
        normalizedStartTime,
        normalizedEndTime,
        number_of_children || 1
      );

      if (!availableNanny) {
        return {
          success: false,
          message: 'No hay nannys disponibles para las fechas y horarios solicitados. Por favor, intenta con otro horario o fecha.'
        };
      }

      console.log('✅ Nanny disponible encontrada:', availableNanny);

      // Calcular horas totales
      const totalHours = this.calculateTotalHours(normalizedStartTime, normalizedEndTime);

      // Obtener tarifa de la nanny
      const nannyQuery = 'SELECT hourly_rate FROM nannys WHERE id = ?';
      const nannyResult = await executeQuery(nannyQuery, [availableNanny.nanny_id]);
      const hourlyRate = nannyResult.data[0]?.hourly_rate || 0;

      // Calcular monto total
      const totalAmount = totalHours * hourlyRate;

      // Crear el servicio
      const insertQuery = `
        INSERT INTO services 
        (client_id, nanny_id, title, service_type, description, start_date, end_date, 
         start_time, end_time, total_hours, total_amount, number_of_children, 
         special_instructions, address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `;

      const result = await executeQuery(insertQuery, [
        client_id,
        availableNanny.nanny_id,
        title,
        service_type,
        description || null,
        start_date,
        end_date || null,
        normalizedStartTime,
        normalizedEndTime,
        totalHours,
        totalAmount,
        number_of_children || 1,
        special_instructions || null,
        address || null
      ]);

      const serviceId = result.data.insertId;

      // Enviar notificación a la nanny
      await this.notifyNanny(availableNanny.user_id, serviceId, title, start_date, normalizedStartTime);

      // Actualizar disponibilidad de la nanny
      await this.updateNannyAvailability(
        availableNanny.nanny_id,
        start_date,
        end_date,
        normalizedStartTime,
        normalizedEndTime
      );

      return {
        success: true,
        message: 'Servicio creado exitosamente',
        data: {
          serviceId,
          nannyAssigned: {
            id: availableNanny.nanny_id,
            name: `${availableNanny.first_name} ${availableNanny.last_name}`,
            rating: availableNanny.rating_average
          },
          totalHours,
          totalAmount
        }
      };
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Actualizar un servicio
   */
  static async update(serviceId, updates) {
    try {
      const allowedFields = ['title', 'description', 'start_date', 'end_date', 'start_time', 'end_time', 'status', 'special_instructions'];
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        return { success: false, message: 'No hay campos válidos para actualizar' };
      }

      values.push(serviceId);
      const query = `UPDATE services SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await executeQuery(query, values);
      return result;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Cancelar/eliminar un servicio
   */
  static async delete(serviceId) {
    try {
      // Primero obtener información del servicio
      const serviceQuery = 'SELECT nanny_id, start_date, end_date, start_time, end_time FROM services WHERE id = ?';
      const serviceResult = await executeQuery(serviceQuery, [serviceId]);

      if (!serviceResult.success || serviceResult.data.length === 0) {
        return { success: false, message: 'Servicio no encontrado' };
      }

      const service = serviceResult.data[0];

      // Liberar la disponibilidad de la nanny
      if (service.nanny_id) {
        const updateAvailabilityQuery = `
          UPDATE nanny_availability 
          SET is_available = TRUE, reason = NULL
          WHERE nanny_id = ?
            AND date >= ?
            AND date <= ?
        `;
        
        await executeQuery(updateAvailabilityQuery, [
          service.nanny_id,
          service.start_date,
          service.end_date || service.start_date
        ]);
      }

      // Eliminar el servicio
      const deleteQuery = 'DELETE FROM services WHERE id = ?';
      const result = await executeQuery(deleteQuery, [serviceId]);

      return result;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
}

module.exports = Service;
