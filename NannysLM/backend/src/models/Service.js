const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const notificationSystem = require('../utils/NotificationSystem');

class Service {
  /**
   * Encuentra la mejor nanny disponible para un servicio
   */
  static async findAvailableNanny(startDate, endDate, startTime, endTime, numberOfChildren) {
    try {
      logger.debug('🔍 Buscando nanny con parámetros:', { startDate, endDate: endDate || startDate, startTime, endTime, numberOfChildren });
      
      // Primero, obtener todas las nannys que están activas y disponibles
      const query = `
        SELECT DISTINCT 
          n.id as nanny_id,
          n.rating_average,
          n.hourly_rate,
          u.first_name,
          u.last_name,
          u.id as user_id,
          na.is_available
        FROM nannys n
        INNER JOIN users u ON n.user_id = u.id
        LEFT JOIN nanny_availability na ON n.id = na.nanny_id
        WHERE 
          n.status = 'active'
          AND u.is_active = TRUE
          AND (na.is_available = TRUE OR na.id IS NULL)
        ORDER BY n.rating_average DESC
      `;
      
      logger.debug('📝 Buscando nannys disponibles...');
      
      const result = await executeQuery(query, []);
      
      console.log('📊 Nannys disponibles encontradas:', {
        success: result.success,
        rowCount: result.data?.length || 0,
        nannys: result.data?.map(n => ({ id: n.nanny_id, name: `${n.first_name} ${n.last_name}`, rating: n.rating_average }))
      });
      
      if (result.success && result.data.length > 0) {
        // De las nannys disponibles, verificar que no tengan conflictos de horario
        for (const nanny of result.data) {
          const hasConflict = await this.hasScheduleConflict(nanny.nanny_id, startDate, startTime, endTime);
          
          if (!hasConflict) {
            logger.success(`Nanny ${nanny.first_name} ${nanny.last_name} (ID: ${nanny.nanny_id}) está disponible sin conflictos`);
            return nanny;
          } else {
            logger.info(`⚠️ Nanny ${nanny.first_name} ${nanny.last_name} (ID: ${nanny.nanny_id}) tiene conflicto de horario`);
          }
        }
        
        logger.info('⚠️ Todas las nannys disponibles tienen conflictos de horario');
        return null;
      }
      
      logger.info('❌ No hay nannys disponibles');
      return null;
    } catch (error) {
      logger.error('❌ Error finding available nanny:', error);
      return null;
    }
  }

  /**
   * Verifica si una nanny tiene conflicto de horario en una fecha/hora específica
   */
  static async hasScheduleConflict(nannyId, startDate, startTime, endTime) {
    try {
      const query = `
        SELECT COUNT(*) as conflict_count
        FROM services
        WHERE 
          nanny_id = ?
          AND start_date = ?
          AND status IN ('confirmed', 'in_progress')
          AND (
            (start_time < ? AND end_time > ?)
            OR (start_time < ? AND end_time > ?)
            OR (start_time >= ? AND end_time <= ?)
          )
      `;
      
      const result = await executeQuery(query, [
        nannyId,
        startDate,
        endTime,      // El servicio existente comienza antes de que termine el nuevo
        startTime,    // El servicio existente termina después de que comience el nuevo
        startTime,    // El nuevo servicio comienza antes de que termine el existente
        endTime,      // El nuevo servicio termina después de que comience el existente
        startTime,    // El nuevo servicio está completamente dentro del existente
        endTime
      ]);
      
      const hasConflict = result.success && result.data[0]?.conflict_count > 0;
      return hasConflict;
    } catch (error) {
      logger.error('❌ Error checking schedule conflict:', error);
      return false;
    }
  }

  /**
   * Calcula el total de horas entre dos tiempos y dos fechas (considerando multi-día)
   */
  static calculateTotalHours(startTime, endTime, startDate = null, endDate = null) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinFraction = startMin / 60;
    const endMinFraction = endMin / 60;
    
    // Si no hay endDate o es el mismo día, calcular solo para un día
    if (!endDate || startDate === endDate) {
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
    
    // Multi-día: calcular primer día + días completos + último día
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      if (numberOfDays <= 1) {
        // Si es el mismo día, calcular normal
        let hours = endHour - startHour;
        let minutes = endMin - startMin;
        
        if (hours < 0) {
          hours += 24;
        }
        
        if (minutes < 0) {
          hours -= 1;
          minutes += 60;
        }
        
        return hours + (minutes / 60);
      }
      
      // Fórmula de tres partes:
      // Primer día: 24 - startHour - (startMin/60)
      const firstDayHours = 24 - startHour - startMinFraction;
      
      // Últmo día: endHour + (endMin/60)
      const lastDayHours = endHour + endMinFraction;
      
      // Días completos en medio: (numberOfDays - 1) * 24
      const middleDaysCount = numberOfDays - 1;
      const middleDaysHours = middleDaysCount * 24;
      
      const totalHours = firstDayHours + middleDaysHours + lastDayHours;
      
      console.log('📊 Cálculo multi-día:', {
        startDate,
        endDate,
        numberOfDays,
        firstDayHours: parseFloat(firstDayHours.toFixed(2)),
        middleDaysHours,
        lastDayHours: parseFloat(lastDayHours.toFixed(2)),
        totalHours: parseFloat(totalHours.toFixed(2))
      });
      
      return totalHours;
    } catch (error) {
      logger.error('Error en cálculo multi-día, revertiendo a cálculo simple:', error);
      
      let hours = endHour - startHour;
      let minutes = endMin - startMin;
      
      if (hours < 0) {
        hours += 24;
      }
      
      if (minutes < 0) {
        hours -= 1;
        minutes += 60;
      }
      
      return hours + (minutes / 60);
    }
  }

  /**
   * Actualiza la disponibilidad de la nanny - marca como ocupada
   */
  static async updateNannyAvailability(nannyId, startDate, endDate, startTime, endTime) {
    try {
      // La tabla nanny_availability ahora solo tiene un registro por nanny con disponibilidad general
      // No necesitamos actualizar por fecha específica, esto se maneja por conflictos de servicio
      logger.debug(`📝 Nota: Disponibilidad de nanny ID: ${nannyId} se verifica a través de servicios confirmados`);
      // Este método se mantiene por compatibilidad pero ya no hace actualización en nanny_availability
      // La disponibilidad se determina dinámicamente en hasScheduleConflict()
    } catch (error) {
      logger.error('Error updating nanny availability:', error);
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
      
      logger.success(`Notificación enviada a nanny (user_id: ${nannyUserId})`);
    } catch (error) {
      logger.error('Error sending notification to nanny:', error);
    }
  }

  /**
   * Obtener servicios con filtros
   */
  static async getAll(clientId = null, nannyId = null, status = null, limit = 100) {
    try {
      let query = `
        SELECT 
          s.*,
          c.user_id as client_user_id,
          uc.first_name as client_first_name,
          uc.last_name as client_last_name,
          uc.address as client_address,
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
      
      if (nannyId) {
        query += ' AND s.nanny_id = ?';
        params.push(nannyId);
        logger.debug(`🔍 Filtrando por nannyId: ${nannyId}`);
      }
      
      if (status) {
        query += ' AND s.status = ?';
        params.push(status);
      }
      
      const limitNum = parseInt(limit) || 100;
      query += ` ORDER BY s.created_at DESC LIMIT ${limitNum}`;
      
      logger.debug('📊 Query servicios:', query);
      logger.debug('📊 Params:', params);
      
      const result = await executeQuery(query, params);
      logger.success(`Servicios encontrados: ${result.data?.length || 0}`);
      
      if (result.data && result.data.length > 0) {
        logger.info('📋 Primer servicio:', JSON.stringify(result.data[0], null, 2));
      }
      
      return result;
    } catch (error) {
      logger.error('Error fetching services:', error);
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
      logger.error('Error fetching service by ID:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo servicio SIN asignar nanny (queda pendiente hasta que una nanny lo acepte)
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

      // Calcular horas totales (considerando fechas para multi-día)
      const totalHours = this.calculateTotalHours(normalizedStartTime, normalizedEndTime, start_date, end_date);

      // Crear el servicio SIN nanny_id y con estado 'pending'
      const insertQuery = `
        INSERT INTO services 
        (client_id, nanny_id, title, service_type, description, start_date, end_date, 
         start_time, end_time, total_hours, total_amount, number_of_children, 
         special_instructions, address, status)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'pending')
      `;

      const result = await executeQuery(insertQuery, [
        client_id,
        title,
        service_type,
        description || null,
        start_date,
        end_date || null,
        normalizedStartTime,
        normalizedEndTime,
        totalHours,
        number_of_children || 1,
        special_instructions || null,
        address || null
      ]);

      const serviceId = result.data.insertId;

      logger.success(`Servicio creado con ID: ${serviceId} en estado PENDING (sin nanny asignada)`);

      // Notificar a todas las nannys disponibles
      await this.notifyAllAvailableNannys(serviceId, {
        id: serviceId,
        title,
        service_type,
        start_date,
        end_date,
        start_time: normalizedStartTime,
        end_time: normalizedEndTime,
        number_of_children: number_of_children || 1,
        address
      });

      return {
        success: true,
        message: 'Servicio creado exitosamente. Las nannys disponibles serán notificadas.',
        data: {
          serviceId,
          status: 'pending',
          totalHours,
          message: 'Esperando aceptación de una nanny'
        }
      };
    } catch (error) {
      logger.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Notificar a todas las nannys disponibles sobre un nuevo servicio
   */
  static async notifyAllAvailableNannys(serviceId, serviceData) {
    try {
      logger.info('📢 Notificando a todas las nannys disponibles sobre servicio:', serviceId);

      // Obtener todas las nannys activas
      const query = `
        SELECT 
          n.id as nanny_id,
          n.user_id,
          u.first_name,
          u.last_name,
          u.email
        FROM nannys n
        INNER JOIN users u ON n.user_id = u.id
        WHERE 
          n.status = 'active'
          AND u.is_active = TRUE
      `;

      const result = await executeQuery(query, []);

      if (!result.success || result.data.length === 0) {
        logger.info('⚠️ No hay nannys disponibles para notificar');
        return;
      }

      logger.debug(`📊 Encontradas ${result.data.length} nannys activas para notificar`);

      // Enviar notificación a cada nanny
      const { sendServiceNotificationEmail } = require('../utils/email');

      for (const nanny of result.data) {
        // Crear notificación en la base de datos
        const notificationQuery = `
          INSERT INTO notifications 
          (user_id, title, message, type, is_read, action_url, related_id, related_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const notificationMessage = `Nuevo servicio disponible: ${serviceData.title}. Fecha: ${serviceData.start_date} de ${serviceData.start_time} a ${serviceData.end_time}. ${serviceData.number_of_children} niño(s).`;

        await executeQuery(notificationQuery, [
          nanny.user_id,
          'Nuevo servicio disponible',
          notificationMessage,
          'service',
          false,
          `/nanny/service-details/${serviceId}`,
          serviceId,
          'service'
        ]);

        // Enviar correo electrónico
        try {
          await sendServiceNotificationEmail(
            nanny.email,
            `${nanny.first_name} ${nanny.last_name}`,
            serviceData
          );
          logger.success(`Correo enviado a ${nanny.email}`);
        } catch (emailError) {
          logger.error(`❌ Error enviando correo a ${nanny.email}:`, emailError);
        }
      }

      logger.success(`Notificaciones enviadas a ${result.data.length} nannys`);
    } catch (error) {
      logger.error('❌ Error notificando a nannys:', error);
    }
  }

  /**
   * Aceptar un servicio por parte de una nanny (con control de concurrencia)
   */
  static async acceptService(serviceId, nannyId) {
    const mysql = require('mysql2/promise');
    const { getConnectionConfig } = require('../config/database');
    let conn = null;

    try {
      logger.info(`🤝 Nanny ${nannyId} intentando aceptar servicio ${serviceId}`);

      // Crear conexión para usar transacciones
      conn = await mysql.createConnection(getConnectionConfig());
      await conn.beginTransaction();

      // Verificar que el servicio existe y está pendiente CON BLOQUEO (FOR UPDATE)
      // Esto evita que otra nanny pueda leer el mismo estado al mismo tiempo
      const [serviceRows] = await conn.query(
        'SELECT * FROM services WHERE id = ? AND status = ? FOR UPDATE',
        [serviceId, 'pending']
      );

      if (serviceRows.length === 0) {
        await conn.rollback();
        return {
          success: false,
          message: 'El servicio no está disponible o ya fue asignado a otra nanny'
        };
      }

      const service = serviceRows[0];

      // Verificar que la nanny no tenga conflictos de horario
      const hasConflict = await this.hasScheduleConflict(
        nannyId,
        service.start_date,
        service.start_time,
        service.end_time
      );

      if (hasConflict) {
        await conn.rollback();
        return {
          success: false,
          message: 'Ya tienes un servicio confirmado en ese horario'
        };
      }

      // Obtener tarifa de la nanny y calcular el monto total
      const nannyQuery = 'SELECT hourly_rate, user_id FROM nannys WHERE id = ?';
      const nannyResult = await executeQuery(nannyQuery, [nannyId]);
      
      if (!nannyResult.success || nannyResult.data.length === 0) {
        await conn.rollback();
        return {
          success: false,
          message: 'Nanny no encontrada'
        };
      }

      const nanny = nannyResult.data[0];
      const totalAmount = service.total_hours * nanny.hourly_rate;

      // Actualizar el servicio: asignar nanny y cambiar estado a 'confirmed'
      const [updateResult] = await conn.query(
        `UPDATE services 
         SET nanny_id = ?, 
             status = 'confirmed', 
             total_amount = ?,
             updated_at = NOW()
         WHERE id = ? AND status = 'pending'`,
        [nannyId, totalAmount, serviceId]
      );

      if (updateResult.affectedRows === 0) {
        await conn.rollback();
        
        // Notificar a esta nanny que el servicio ya fue tomado
        await this.notifyNannyServiceTaken(nanny.user_id, service.title, serviceId);
        
        return {
          success: false,
          message: 'No se pudo asignar el servicio. Otra nanny lo aceptó primero.'
        };
      }

      // Commit de la transacción - el servicio fue asignado exitosamente
      await conn.commit();
      logger.success(`Servicio ${serviceId} asignado a nanny ${nannyId} exitosamente`);

      // Notificar al cliente que su servicio fue aceptado
      const clientQuery = 'SELECT user_id FROM clients WHERE id = ?';
      const clientResult = await executeQuery(clientQuery, [service.client_id]);

      if (clientResult.success && clientResult.data.length > 0) {
        const nannyNameQuery = 'SELECT first_name, last_name FROM users WHERE id = ?';
        const nannyNameResult = await executeQuery(nannyNameQuery, [nanny.user_id]);
        const nannyName = nannyNameResult.data[0] 
          ? `${nannyNameResult.data[0].first_name} ${nannyNameResult.data[0].last_name}`
          : 'una nanny';

        // Obtener información del cliente para enviar correo
        const clientInfoQuery = 'SELECT u.first_name, u.last_name, u.email FROM users u WHERE u.id = ?';
        const clientInfoResult = await executeQuery(clientInfoQuery, [clientResult.data[0].user_id]);
        
        if (clientInfoResult.success && clientInfoResult.data.length > 0) {
          const clientInfo = clientInfoResult.data[0];
          const clientName = `${clientInfo.first_name} ${clientInfo.last_name}`;
          const clientEmail = clientInfo.email;
          
          // Formatear fecha del servicio
          const serviceDate = new Date(service.start_date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // Enviar notificación Y correo al cliente
          logger.info('📧 Enviando notificación y correo al cliente sobre servicio aceptado...');
          await notificationSystem.notifyClientServiceAccepted(
            clientEmail,
            clientResult.data[0].user_id,
            clientName,
            nannyName,
            service.title,
            serviceDate,
            serviceId
          );
        }
      }

      // Notificar a TODAS las demás nannys que el servicio ya fue tomado
      await this.notifyOtherNannysServiceTaken(nannyId, service.title, serviceId);

      return {
        success: true,
        message: 'Servicio aceptado exitosamente',
        data: {
          serviceId,
          totalAmount,
          status: 'confirmed'
        }
      };
    } catch (error) {
      if (conn) {
        await conn.rollback();
      }
      logger.error('❌ Error aceptando servicio:', error);
      throw error;
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }

  /**
   * Notificar a una nanny específica que el servicio ya fue tomado
   */
  static async notifyNannyServiceTaken(nannyUserId, serviceTitle, serviceId) {
    try {
      const notificationQuery = `
        INSERT INTO notifications 
        (user_id, title, message, type, is_read, action_url, related_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await executeQuery(notificationQuery, [
        nannyUserId,
        'Servicio ya asignado',
        `El servicio "${serviceTitle}" ya fue aceptado por otra nanny. Te invitamos a ver otros servicios disponibles.`,
        'service',
        false,
        '/nanny/dashboard?view=services',
        serviceId,
        'service'
      ]);

      logger.info(`📢 Notificación enviada a nanny (user_id: ${nannyUserId}) - servicio ya tomado`);
    } catch (error) {
      logger.error('❌ Error notificando a nanny sobre servicio tomado:', error);
    }
  }

  /**
   * Notificar a todas las demás nannys que el servicio ya fue tomado
   */
  static async notifyOtherNannysServiceTaken(acceptingNannyId, serviceTitle, serviceId) {
    try {
      logger.info('📢 Notificando a otras nannys que el servicio fue tomado...');

      // Obtener todas las nannys activas excepto la que aceptó
      const query = `
        SELECT 
          n.id as nanny_id,
          n.user_id,
          u.first_name,
          u.last_name
        FROM nannys n
        INNER JOIN users u ON n.user_id = u.id
        WHERE 
          n.status = 'active'
          AND u.is_active = TRUE
          AND n.id != ?
      `;

      const result = await executeQuery(query, [acceptingNannyId]);

      if (!result.success || result.data.length === 0) {
        logger.info('⚠️ No hay otras nannys para notificar');
        return;
      }

      logger.debug(`📊 Notificando a ${result.data.length} nannys sobre servicio tomado`);

      // Enviar notificación a cada nanny
      for (const nanny of result.data) {
        const notificationQuery = `
          INSERT INTO notifications 
          (user_id, title, message, type, is_read, action_url, related_id, related_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const notificationMessage = `El servicio "${serviceTitle}" ya fue aceptado por otra nanny. Revisa otros servicios disponibles.`;

        await executeQuery(notificationQuery, [
          nanny.user_id,
          'Servicio ya asignado',
          notificationMessage,
          'service',
          false,
          '/nanny/dashboard?view=services',
          serviceId,
          'service'
        ]);
      }

      logger.success(`Notificaciones enviadas a ${result.data.length} nannys`);
    } catch (error) {
      logger.error('❌ Error notificando a otras nannys:', error);
    }
  }

  /**
   * Actualizar un servicio
   */
  static async update(serviceId, updates) {
    try {
      const allowedFields = ['title', 'description', 'start_date', 'end_date', 'start_time', 'end_time', 'status', 'special_instructions', 'completed_at'];
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
      logger.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Cancelar o eliminar un servicio
   * @param {number} serviceId - ID del servicio
   * @param {boolean} permanentDelete - Si es true, elimina completamente de la BD (útil para cambio de fecha)
   */
  static async delete(serviceId, permanentDelete = false) {
    try {
      // Primero obtener información del servicio
      const serviceQuery = 'SELECT nanny_id, start_date, end_date, start_time, end_time, status FROM services WHERE id = ?';
      const serviceResult = await executeQuery(serviceQuery, [serviceId]);

      if (!serviceResult.success || serviceResult.data.length === 0) {
        return { success: false, message: 'Servicio no encontrado' };
      }

      const service = serviceResult.data[0];

      // Solo permitir cancelar si no está ya cancelado (excepto para eliminación permanente)
      if (service.status === 'cancelled' && !permanentDelete) {
        return { success: false, message: 'Este servicio ya fue cancelado' };
      }

      // Liberar la disponibilidad de la nanny solo si el servicio aún no está completado
      if (service.nanny_id && service.status !== 'completed') {
        const updateAvailabilityQuery = `
          UPDATE nanny_availability 
          SET is_available = TRUE, reason = NULL
          WHERE nanny_id = ?
        `;
        
        await executeQuery(updateAvailabilityQuery, [service.nanny_id]);
      }

      let result;
      if (permanentDelete) {
        // Eliminar COMPLETAMENTE de la base de datos (para cambio de fecha)
        logger.info(`🗑️ ELIMINANDO PERMANENTEMENTE servicio ${serviceId} de la base de datos`);
        const deleteQuery = 'DELETE FROM services WHERE id = ?';
        result = await executeQuery(deleteQuery, [serviceId]);
        
        if (result.success) {
          return {
            success: true,
            message: 'Servicio eliminado completamente de la base de datos'
          };
        }
      } else {
        // Cambiar el estado del servicio a 'cancelled' (cancelación normal)
        logger.info(`🚫 Cancelando servicio ${serviceId} (cambio de estado)`);
        const updateQuery = 'UPDATE services SET status = ?, updated_at = NOW() WHERE id = ?';
        result = await executeQuery(updateQuery, ['cancelled', serviceId]);
        
        if (result.success) {
          return {
            success: true,
            message: 'Servicio cancelado exitosamente'
          };
        }
      }

      return result;
    } catch (error) {
      logger.error('Error cancelling service:', error);
      throw error;
    }
  }
}

module.exports = Service;
