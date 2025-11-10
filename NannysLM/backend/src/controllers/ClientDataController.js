// Controlador para gestionar información específica del cliente
const { pool } = require('../config/database');

// Obtener información del cliente por user_id
const getClientData = async (req, res) => {
    try {
      const userId = req.user.id; // Del token JWT verificado por middleware
      
      console.log(`📋 Obteniendo datos del cliente para user_id: ${userId}`);
      
      const [rows] = await pool.query(
        'SELECT * FROM clients WHERE user_id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado. Por favor completa tu información.',
          data: null
        });
      }
      
      const clientData = rows[0];
      console.log('✅ Datos del cliente obtenidos:', clientData);
      
      return res.status(200).json({
        success: true,
        message: 'Datos del cliente obtenidos correctamente',
        data: clientData
      });
      
    } catch (error) {
      console.error('❌ Error al obtener datos del cliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener los datos',
        error: error.message
      });
    }
};

// Crear o actualizar información del cliente
const upsertClientData = async (req, res) => {
    try {
      const userId = req.user.id; // Del token JWT verificado por middleware
      const {
        emergency_contact_name,
        emergency_contact_phone,
        number_of_children,
        special_requirements
      } = req.body;
      
      console.log(`💾 Guardando datos del cliente para user_id: ${userId}`);
      console.log('📝 Datos recibidos:', req.body);
      console.log('📎 Archivo recibido:', req.file);
      
      // Manejar archivo de identificación
      let identification_document = null;
      if (req.file) {
        identification_document = req.file.filename;
        console.log('✅ Documento de identificación guardado:', identification_document);
      }
      
      // Verificar si el cliente ya existe
      const [existingClient] = await pool.query(
        'SELECT id, identification_document FROM clients WHERE user_id = ?',
        [userId]
      );
      
      if (existingClient.length > 0) {
        // Cliente existe - actualizar
        console.log('🔄 Cliente existente, actualizando...');
        
        const clientId = existingClient[0].id;
        const oldDocument = existingClient[0].identification_document;
        
        // Si hay nuevo documento, mantener el nuevo; si no, mantener el antiguo
        const finalDocument = identification_document || oldDocument;
        
        const updateQuery = `
          UPDATE clients 
          SET 
            emergency_contact_name = ?,
            emergency_contact_phone = ?,
            number_of_children = ?,
            special_requirements = ?,
            identification_document = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `;
        
        await pool.query(updateQuery, [
          emergency_contact_name,
          emergency_contact_phone,
          number_of_children,
          special_requirements || '',
          finalDocument,
          userId
        ]);
        
        console.log('✅ Datos del cliente actualizados correctamente');
        
        // Obtener datos actualizados
        const [updatedClient] = await pool.query(
          'SELECT * FROM clients WHERE id = ?',
          [clientId]
        );
        
        return res.status(200).json({
          success: true,
          message: 'Información actualizada correctamente',
          data: updatedClient[0]
        });
        
      } else {
        // Cliente no existe - crear nuevo
        console.log('✨ Nuevo cliente, creando registro...');
        
        const insertQuery = `
          INSERT INTO clients (
            user_id,
            identification_document,
            verification_status,
            emergency_contact_name,
            emergency_contact_phone,
            number_of_children,
            special_requirements,
            created_at,
            updated_at
          ) VALUES (?, ?, 'pending', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        const [result] = await pool.query(insertQuery, [
          userId,
          identification_document,
          emergency_contact_name,
          emergency_contact_phone,
          number_of_children,
          special_requirements || ''
        ]);
        
        console.log('✅ Cliente creado correctamente con ID:', result.insertId);
        
        // Obtener datos del cliente recién creado
        const [newClient] = await pool.query(
          'SELECT * FROM clients WHERE id = ?',
          [result.insertId]
        );
        
        return res.status(201).json({
          success: true,
          message: 'Información registrada correctamente',
          data: newClient[0]
        });
      }
      
    } catch (error) {
      console.error('❌ Error al guardar datos del cliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al guardar los datos',
        error: error.message
      });
    }
};

// Verificar cliente (aprobar o rechazar) - solo para administradores
const verifyClient = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { status, reason } = req.body; // status: 'verified' | 'rejected', reason: opcional para rechazos
      
      console.log(`🔍 Verificando cliente ID: ${clientId} con estado: ${status}`);
      
      // Validar que el status sea válido
      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de verificación inválido. Debe ser "verified" o "rejected".'
        });
      }
      
      // Verificar que el cliente existe
      const [clientRows] = await pool.query(
        'SELECT id, user_id, verification_status FROM clients WHERE id = ?',
        [clientId]
      );
      
      if (clientRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
      
      const client = clientRows[0];
      
      // Actualizar estado de verificación
      const updateQuery = `
        UPDATE clients 
        SET 
          verification_status = ?,
          verification_date = ${status === 'verified' ? 'CURRENT_TIMESTAMP' : 'NULL'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await pool.query(updateQuery, [status, clientId]);
      
      // Si es verificado, también actualizar el campo is_verified del usuario
      if (status === 'verified') {
        await pool.query(
          'UPDATE users SET is_verified = TRUE WHERE id = ?',
          [client.user_id]
        );
        
        // Crear notificación de verificación exitosa
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, action_url, related_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            client.user_id,
            '¡Cuenta Verificada! ✓',
            'Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todos los servicios de NannysLM.',
            'success',
            '/dashboard/profile',
            'verification'
          ]
        );
        
        console.log(`📬 Notificación de verificación creada para usuario ${client.user_id}`);
      } else {
        await pool.query(
          'UPDATE users SET is_verified = FALSE WHERE id = ?',
          [client.user_id]
        );
        
        // Crear notificación de verificación rechazada
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, action_url, related_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            client.user_id,
            'Verificación Rechazada',
            `${reason ? 'Razón: ' + reason : 'Tu solicitud de verificación ha sido rechazada. Por favor contacta al equipo de soporte.'}`,
            'warning',
            '/dashboard/profile',
            'verification'
          ]
        );
        
        console.log(`📬 Notificación de rechazo creada para usuario ${client.user_id}`);
      }
      
      console.log(`✅ Cliente ${clientId} ${status === 'verified' ? 'verificado' : 'rechazado'} correctamente`);
      
      // Obtener datos actualizados del cliente
      const [updatedClientRows] = await pool.query(
        `SELECT c.*, u.first_name, u.last_name, u.email, u.is_verified 
         FROM clients c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.id = ?`,
        [clientId]
      );
      
      return res.status(200).json({
        success: true,
        message: `Cliente ${status === 'verified' ? 'verificado' : 'rechazado'} correctamente`,
        data: updatedClientRows[0]
      });
      
    } catch (error) {
      console.error('❌ Error al verificar cliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar cliente',
        error: error.message
      });
    }
};

// Obtener todos los clientes para el administrador
const getAllClients = async (req, res) => {
    try {
      console.log('📋 Obteniendo todos los clientes para admin');
      
      const query = `
        SELECT 
          c.id,
          c.user_id,
          c.identification_document,
          c.verification_status,
          c.verification_date,
          c.emergency_contact_name,
          c.emergency_contact_phone,
          c.number_of_children,
          c.special_requirements,
          c.created_at,
          c.updated_at,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.address,
          u.is_verified,
          u.is_active,
          u.profile_image,
          u.last_login
        FROM clients c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `;
      
      const [rows] = await pool.query(query);
      
      // Formatear datos para el frontend
      const formattedClients = rows.map(client => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone_number,
        address: client.address,
        isVerified: client.is_verified,
        isActive: client.is_active,
        profileImage: client.profile_image,
        emergencyContactName: client.emergency_contact_name,
        emergencyContactPhone: client.emergency_contact_phone,
        numberOfChildren: client.number_of_children,
        specialRequirements: client.special_requirements,
        verificationStatus: client.verification_status,
        verificationDate: client.verification_date,
        identification_document: client.identification_document,
        createdAt: client.created_at,
        lastLogin: client.last_login
      }));
      
      console.log(`✅ ${formattedClients.length} clientes obtenidos para admin`);
      
      return res.status(200).json({
        success: true,
        message: 'Clientes obtenidos correctamente',
        data: formattedClients
      });
      
    } catch (error) {
      console.error('❌ Error al obtener clientes para admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener los clientes',
        error: error.message
      });
    }
};

module.exports = {
  getClientData,
  upsertClientData,
  verifyClient,
  getAllClients
};
