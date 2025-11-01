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

module.exports = {
  getClientData,
  upsertClientData
};
