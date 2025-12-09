const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const notificationSystem = require('../utils/NotificationSystem');

class RatingController {
  /**
   * Crear una nueva calificación de servicio
   */
  static async createRating(req, res) {
    try {
      const { service_id, rating, punctuality_rating, communication_rating, care_quality_rating, would_recommend } = req.body;
      const client_id = req.user.id; // Del JWT token

      // Validar datos requeridos
      if (!service_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere service_id y rating'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe estar entre 1 y 5'
        });
      }

      // Obtener información del servicio
      const serviceQuery = 'SELECT * FROM services WHERE id = ? AND client_id = ?';
      const serviceResult = await executeQuery(serviceQuery, [service_id, client_id]);

      if (!serviceResult.success || serviceResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      const service = serviceResult.data[0];

      // Verificar que el servicio esté completado
      if (service.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden calificar servicios completados'
        });
      }

      // Verificar que no exista una calificación previa
      const existingRatingQuery = 'SELECT id FROM ratings WHERE service_id = ? AND client_id = ?';
      const existingRating = await executeQuery(existingRatingQuery, [service_id, client_id]);

      if (existingRating.success && existingRating.data.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Este servicio ya ha sido calificado'
        });
      }

      // Crear la calificación
      const insertQuery = `
        INSERT INTO ratings (
          service_id, 
          client_id, 
          nanny_id, 
          rating, 
          punctuality_rating, 
          communication_rating, 
          care_quality_rating, 
          would_recommend, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const values = [
        service_id,
        client_id,
        service.nanny_id,
        rating,
        punctuality_rating || rating,
        communication_rating || rating,
        care_quality_rating || rating,
        would_recommend !== undefined ? would_recommend : (rating >= 4)
      ];

      const insertResult = await executeQuery(insertQuery, values);

      if (!insertResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Error al guardar la calificación'
        });
      }

      // Actualizar el promedio de ratings de la nanny
      const avgQuery = `
        SELECT 
          AVG(rating) as avg_rating,
          COUNT(*) as total_ratings
        FROM ratings
        WHERE nanny_id = ?
      `;
      const avgResult = await executeQuery(avgQuery, [service.nanny_id]);
      
      if (avgResult.success && avgResult.data && avgResult.data.length > 0) {
        const updateQuery = `
          UPDATE nannys 
          SET rating_average = ?, total_ratings = ?
          WHERE id = ?
        `;
        await executeQuery(updateQuery, [
          avgResult.data[0].avg_rating,
          avgResult.data[0].total_ratings,
          service.nanny_id
        ]);
      }

      logger.info(`✓ Calificación creada para servicio ${service_id} por cliente ${client_id}`);

      // Notificar a la nanny sobre la nueva calificación
      try {
        // Obtener información completa para la notificación
        const notificationQuery = `
          SELECT 
            n.user_id as nanny_user_id,
            u_nanny.first_name as nanny_first_name,
            u_nanny.last_name as nanny_last_name,
            u_nanny.email as nanny_email,
            u_client.first_name as client_first_name,
            u_client.last_name as client_last_name,
            s.title as service_title
          FROM nannys n
          JOIN users u_nanny ON n.user_id = u_nanny.id
          JOIN services s ON s.id = ?
          JOIN clients c ON s.client_id = c.id
          JOIN users u_client ON c.user_id = u_client.id
          WHERE n.id = ?
        `;
        
        const notifResult = await executeQuery(notificationQuery, [service_id, service.nanny_id]);
        
        if (notifResult.success && notifResult.data.length > 0) {
          const notifData = notifResult.data[0];
          const nannyName = `${notifData.nanny_first_name} ${notifData.nanny_last_name}`;
          const clientName = `${notifData.client_first_name} ${notifData.client_last_name}`;
          
          logger.info('📧 Enviando notificación a nanny sobre nueva calificación...');
          await notificationSystem.notifyNannyNewRating(
            notifData.nanny_email,
            notifData.nanny_user_id,
            nannyName,
            clientName,
            rating,
            notifData.service_title,
            service_id,
            req.body.comment || ''
          );
        }
      } catch (notifError) {
        logger.error('⚠️ Error al notificar a nanny sobre calificación:', notifError);
      }

      return res.json({
        success: true,
        message: 'Calificación guardada exitosamente',
        data: {
          rating_id: insertResult.insertId,
          service_id,
          rating
        }
      });
    } catch (error) {
      logger.error('Error creating rating:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener calificación de un servicio
   */
  static async getServiceRating(req, res) {
    try {
      const { serviceId } = req.params;

      const query = `
        SELECT 
          r.id,
          r.service_id,
          r.client_id,
          r.nanny_id,
          r.rating,
          u.first_name,
          u.last_name
        FROM ratings r
        LEFT JOIN users u ON r.client_id = u.id
        WHERE r.service_id = ?
      `;

      const result = await executeQuery(query, [serviceId]);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Error al obtener calificación'
        });
      }

      return res.json({
        success: true,
        data: result.data.length > 0 ? result.data[0] : null
      });
    } catch (error) {
      logger.error('Error getting rating:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener promedio de calificaciones de una nanny
   */
  static async getNannyAverageRating(req, res) {
    try {
      const { nannyId } = req.params;

      const query = `
        SELECT 
          COUNT(*) as total_ratings,
          AVG(rating) as average_rating,
          AVG(punctuality_rating) as average_punctuality,
          AVG(communication_rating) as average_communication,
          AVG(care_quality_rating) as average_care_quality
        FROM ratings
        WHERE nanny_id = ?
      `;

      const result = await executeQuery(query, [nannyId]);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Error al obtener calificaciones'
        });
      }

      const data = result.data[0];

      return res.json({
        success: true,
        data: {
          total_ratings: data.total_ratings || 0,
          average_rating: data.average_rating ? parseFloat(data.average_rating).toFixed(1) : 0,
          average_punctuality: data.average_punctuality ? parseFloat(data.average_punctuality).toFixed(1) : 0,
          average_communication: data.average_communication ? parseFloat(data.average_communication).toFixed(1) : 0,
          average_care_quality: data.average_care_quality ? parseFloat(data.average_care_quality).toFixed(1) : 0
        }
      });
    } catch (error) {
      logger.error('Error getting nanny rating:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener todas las calificaciones de una nanny con detalles completos
   */
  static async getNannyRatings(req, res) {
    try {
      const { nannyId } = req.query;

      if (!nannyId) {
        return res.status(400).json({
          success: false,
          message: 'nannyId es requerido'
        });
      }

      logger.info(`⭐ Obteniendo ratings para nanny ${nannyId}`);

      const query = `
        SELECT 
          r.id,
          r.service_id,
          r.client_id,
          r.nanny_id,
          r.rating,
          r.punctuality_rating,
          r.communication_rating,
          r.care_quality_rating,
          r.would_recommend,
          r.created_at,
          COALESCE(u.first_name, 'Cliente') as client_first_name,
          COALESCE(u.last_name, 'Anónimo') as client_last_name,
          COALESCE(s.title, 'Servicio') as service_title
        FROM ratings r
        LEFT JOIN clients c ON r.client_id = c.id
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN services s ON r.service_id = s.id
        WHERE r.nanny_id = ?
        ORDER BY r.created_at DESC
      `;

      const result = await executeQuery(query, [nannyId]);

      logger.debug(`📊 Resultado de executeQuery:`, {success: result.success, count: result.data ? result.data.length : 0});

      if (!result.success) {
        logger.error('❌ Error en la query:', result.error);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener calificaciones',
          error: result.error
        });
      }

      const ratingsArray = Array.isArray(result.data) ? result.data : [];
      logger.success(`Se obtuvieron ${ratingsArray.length} ratings para nanny ${nannyId}`);

      return res.json({
        success: true,
        message: 'Calificaciones obtenidas correctamente',
        data: ratingsArray,
        count: ratingsArray.length
      });

    } catch (error) {
      logger.error('❌ Error al obtener ratings:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * Recalcular promedios de ratings para todas las nannys
   * POST /api/v1/ratings/recalculate/all
   */
  static async recalculateAllRatings(req, res) {
    try {
      logger.info(`⭐ Recalculando promedios de ratings para todas las nannys...`);

      const query = `
        SELECT 
          nanny_id,
          AVG(rating) as avg_rating,
          COUNT(*) as total_ratings
        FROM ratings
        GROUP BY nanny_id
      `;

      const result = await executeQuery(query, []);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Error al recalcular ratings'
        });
      }

      // Actualizar cada nanny
      let updated = 0;
      for (const row of result.data) {
        const updateQuery = `
          UPDATE nannys 
          SET rating_average = ?, total_ratings = ?
          WHERE id = ?
        `;
        const updateResult = await executeQuery(updateQuery, [
          row.avg_rating,
          row.total_ratings,
          row.nanny_id
        ]);
        
        if (updateResult.success) {
          updated++;
          logger.success(`Nanny ${row.nanny_id}: ${row.avg_rating.toFixed(2)} promedio, ${row.total_ratings} ratings`);
        }
      }

      return res.json({
        success: true,
        message: `Promedios recalculados para ${updated} nannys`,
        updated
      });

    } catch (error) {
      logger.error('❌ Error al recalcular ratings:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = RatingController;
