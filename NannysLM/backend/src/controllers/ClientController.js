const UserModel = require('../models/User');
const { executeQuery } = require('../config/database');

/**
 * Controlador para manejo de datos específicos de clientes
 */
const ClientModel = require('../models/Client');


class ClientController {
  /**
   * Actualizar información de perfil del cliente
   */
  static async updateClientProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Verificar que el usuario sea cliente
      const user = await UserModel.findById(userId);
      if (!user || user.user_type !== 'client') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo clientes pueden actualizar su perfil.'
        });
      }

      // Actualizar datos en la tabla clients
      await ClientModel.updateByUserId(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Perfil de cliente actualizado correctamente.'
      });
    } catch (error) {
      console.error('Error al actualizar perfil de cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obtener información completa del cliente
   */
  static async getClientInfo(req, res) {
    try {
      const userId = req.user.id;

      // Verificar que el usuario sea cliente
      const user = await UserModel.findById(userId);
      if (!user || user.user_type !== 'client') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo clientes pueden acceder a esta información'
        });
      }

      // Obtener información del cliente
      const clientQuery = `
        SELECT 
          c.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.address,
          u.is_verified,
          u.profile_image,
          u.created_at as user_created_at
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
      `;

      const result = await executeQuery(clientQuery, [userId]);

      if (result.success && result.data.length > 0) {
        const clientData = result.data[0];
        
        res.status(200).json({
          success: true,
          data: {
            id: clientData.id,
            user_id: clientData.user_id,
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            phone_number: clientData.phone_number,
            address: clientData.address,
            is_verified: clientData.is_verified,
            profile_image: clientData.profile_image,
            emergency_contact_name: clientData.emergency_contact_name,
            emergency_contact_phone: clientData.emergency_contact_phone,
            number_of_children: clientData.number_of_children,
            special_requirements: clientData.special_requirements,
            verification_status: clientData.verification_status,
            verification_date: clientData.verification_date,
            created_at: clientData.user_created_at,
            client_since: clientData.created_at
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Perfil de cliente no encontrado. Complete su perfil primero.'
        });
      }

    } catch (error) {
      console.error('Error al obtener información del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener servicios contratados por el cliente
   */
  static async getClientServices(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      const { status = 'all', limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido'
        });
      }

      // Obtener ID del cliente
      const clientQuery = 'SELECT id FROM clients WHERE user_id = ?';
      const clientResult = await executeQuery(clientQuery, [parseInt(userId)]);

      if (!clientResult.success || clientResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const clientId = clientResult.data[0].id;

      // Construir query para servicios
      let servicesQuery = `
        SELECT 
          s.*,
          u.first_name as nanny_first_name,
          u.last_name as nanny_last_name,
          u.profile_image as nanny_image,
          n.rating_average as nanny_rating,
          r.rating as service_rating,
          r.review as service_review
        FROM services s
        LEFT JOIN nannys n ON s.nanny_id = n.id
        LEFT JOIN users u ON n.user_id = u.id
        LEFT JOIN ratings r ON s.id = r.service_id
        WHERE s.client_id = ?
      `;

      const queryParams = [clientId];

      // Filtrar por estado si se especifica
      if (status !== 'all') {
        servicesQuery += ' AND s.status = ?';
        queryParams.push(status);
      }

      // Asegurar que limit sea un número entero y agregarlo directamente en el query
      const limitNum = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 50;
      servicesQuery += ` ORDER BY s.created_at DESC LIMIT ${limitNum}`;

      console.log('📝 Query params para servicios:', queryParams);
      console.log('📝 Limit procesado:', limitNum);

      const result = await executeQuery(servicesQuery, queryParams);

      if (result.success) {
        const services = result.data.map(service => ({
          id: service.id,
          title: service.title,
          service_type: service.service_type,
          description: service.description,
          start_date: service.start_date,
          end_date: service.end_date,
          start_time: service.start_time,
          end_time: service.end_time,
          total_hours: service.total_hours,
          total_amount: service.total_amount,
          number_of_children: service.number_of_children,
          special_instructions: service.special_instructions,
          address: service.address,
          status: service.status,
          created_at: service.created_at,
          completed_at: service.completed_at,
          nanny: service.nanny_id ? {
            id: service.nanny_id,
            name: `${service.nanny_first_name} ${service.nanny_last_name}`,
            first_name: service.nanny_first_name,
            last_name: service.nanny_last_name,
            profile_image: service.nanny_image,
            rating: service.nanny_rating
          } : null,
          rating: {
            given: !!service.service_rating,
            rating: service.service_rating,
            review: service.service_review
          }
        }));

        res.status(200).json({
          success: true,
          data: services,
          meta: {
            total: services.length,
            status_filter: status,
            limit: parseInt(limit)
          }
        });
      } else {
        throw new Error('Error al obtener servicios');
      }

    } catch (error) {
      console.error('Error al obtener servicios del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener pagos del cliente
   */
  static async getClientPayments(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      const { status = 'all', limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido'
        });
      }

      // Obtener ID del cliente
      const clientQuery = 'SELECT id FROM clients WHERE user_id = ?';
      const clientResult = await executeQuery(clientQuery, [parseInt(userId)]);

      if (!clientResult.success || clientResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const clientId = clientResult.data[0].id;

      // Query para obtener pagos
      let paymentsQuery = `
        SELECT 
          p.*,
          s.title as service_title,
          s.start_date,
          s.start_time,
          s.end_time,
          u.first_name as nanny_first_name,
          u.last_name as nanny_last_name
        FROM payments p
        JOIN services s ON p.service_id = s.id
        LEFT JOIN nannys n ON p.nanny_id = n.id
        LEFT JOIN users u ON n.user_id = u.id
        WHERE p.client_id = ?
      `;

      const queryParams = [clientId];

      if (status !== 'all') {
        paymentsQuery += ' AND p.payment_status = ?';
        queryParams.push(status);
      }

      // Asegurar que limit sea un número entero y agregarlo directamente en el query
      const limitNum = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 50;
      paymentsQuery += ` ORDER BY p.created_at DESC LIMIT ${limitNum}`;

      console.log('📝 Query params para pagos:', queryParams);
      console.log('📝 Limit procesado:', limitNum);

      const result = await executeQuery(paymentsQuery, queryParams);

      if (result.success) {
        const payments = result.data.map(payment => ({
          id: payment.id,
          service_id: payment.service_id,
          service_title: payment.service_title,
          service_date: payment.start_date,
          service_time: `${payment.start_time} - ${payment.end_time}`,
          amount: payment.amount,
          platform_fee: payment.platform_fee,
          nanny_amount: payment.nanny_amount,
          payment_status: payment.payment_status,
          transaction_id: payment.transaction_id,
          payment_date: payment.payment_date,
          receipt_url: payment.receipt_url,
          created_at: payment.created_at,
          nanny: payment.nanny_first_name ? {
            name: `${payment.nanny_first_name} ${payment.nanny_last_name}`
          } : null
        }));

        res.status(200).json({
          success: true,
          data: payments,
          meta: {
            total: payments.length,
            status_filter: status,
            limit: parseInt(limit)
          }
        });
      } else {
        throw new Error('Error al obtener pagos');
      }

    } catch (error) {
      console.error('Error al obtener pagos del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas del cliente
   */
  static async getClientStats(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido'
        });
      }

      // Obtener ID del cliente
      const clientQuery = 'SELECT id FROM clients WHERE user_id = ?';
      const clientResult = await executeQuery(clientQuery, [parseInt(userId)]);

      if (!clientResult.success || clientResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const clientId = clientResult.data[0].id;

      // Obtener estadísticas
      const statsQueries = [
        // Total de servicios
        'SELECT COUNT(*) as total_services FROM services WHERE client_id = ?',
        // Servicios completados
        'SELECT COUNT(*) as completed_services FROM services WHERE client_id = ? AND status = "completed"',
        // Servicios pendientes
        'SELECT COUNT(*) as pending_services FROM services WHERE client_id = ? AND status IN ("pending", "confirmed")',
        // Total gastado
        'SELECT COALESCE(SUM(p.amount), 0) as total_spent FROM payments p WHERE p.client_id = ? AND p.payment_status = "completed"',
        // Nannys favoritas (simulado por ahora)
        'SELECT COUNT(DISTINCT s.nanny_id) as unique_nannys FROM services s WHERE s.client_id = ? AND s.nanny_id IS NOT NULL'
      ];

      const results = await Promise.all([
        executeQuery(statsQueries[0], [clientId]),
        executeQuery(statsQueries[1], [clientId]),
        executeQuery(statsQueries[2], [clientId]),
        executeQuery(statsQueries[3], [clientId]),
        executeQuery(statsQueries[4], [clientId])
      ]);

      const stats = {
        services: {
          total: results[0].success ? results[0].data[0].total_services : 0,
          completed: results[1].success ? results[1].data[0].completed_services : 0,
          pending: results[2].success ? results[2].data[0].pending_services : 0
        },
        financial: {
          total_spent: results[3].success ? parseFloat(results[3].data[0].total_spent) : 0,
          currency: 'MXN'
        },
        nannys: {
          unique_nannys_hired: results[4].success ? results[4].data[0].unique_nannys : 0
        }
      };

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error al obtener estadísticas del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verificar o rechazar cliente (Admin)
   */
  static async verifyClient(req, res) {
    try {
      const clientId = req.params.id;
      const { status } = req.body; // 'approved' o 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de verificación inválido'
        });
      }

      // Obtener datos del cliente
      const clientQuery = `
        SELECT u.id, u.email, u.first_name, u.last_name, c.verification_status
        FROM users u
        JOIN clients c ON u.id = c.user_id
        WHERE c.id = ? AND u.user_type = 'client'
      `;

      const clientResult = await executeQuery(clientQuery, [clientId]);

      if (!clientResult.success || clientResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const client = clientResult.data[0];
      const verificationStatus = status === 'approved' ? 'verified' : 'rejected';

      // Actualizar estado de verificación en tabla clients
      const updateClientQuery = `
        UPDATE clients 
        SET verification_status = ?, verification_date = NOW()
        WHERE id = ?
      `;

      const updateClientResult = await executeQuery(updateClientQuery, [verificationStatus, clientId]);

      if (!updateClientResult.success) {
        throw new Error('Error al actualizar estado de verificación del cliente');
      }

      // Actualizar is_verified en tabla users solo si es aprobado
      if (status === 'approved') {
        const updateUserQuery = `
          UPDATE users 
          SET is_verified = 1
          WHERE id = ?
        `;

        const updateUserResult = await executeQuery(updateUserQuery, [client.id]);

        if (!updateUserResult.success) {
          throw new Error('Error al actualizar is_verified del usuario');
        }
      }

      // Importar funciones de email
      const { sendVerificationApprovedEmail, sendVerificationRejectedEmail } = require('../utils/email');

      // Enviar email según el estado
      const clientName = `${client.first_name} ${client.last_name}`.trim();
      let emailResult;

      if (status === 'approved') {
        emailResult = await sendVerificationApprovedEmail(client.email, clientName);
        console.log('✓ Email de verificación aprobada enviado a:', client.email);
      } else {
        emailResult = await sendVerificationRejectedEmail(client.email, clientName);
        console.log('✗ Email de verificación rechazada enviado a:', client.email);
      }

      res.status(200).json({
        success: true,
        message: `Cliente verificación ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente. Email enviado a ${client.email}`,
        data: {
          clientId,
          verificationStatus,
          emailSent: emailResult.success,
          emailStatus: emailResult.message
        }
      });

    } catch (error) {
      console.error('Error al verificar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// ...existing code...

module.exports = {
  updateClientProfile: ClientController.updateClientProfile,
  getClientInfo: ClientController.getClientInfo,
  getClientServices: ClientController.getClientServices,
  getClientPayments: ClientController.getClientPayments,
  getClientStats: ClientController.getClientStats,
  verifyClient: ClientController.verifyClient
};