const db = require('../config/database');
const logger = require('./logger');

class UserController {
  /**
   * Obtiene un usuario por ID con datos públicos
   * GET /api/v1/users/:id
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del usuario es requerido'
        });
      }

      const query = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone_number,
          user_type,
          is_active,
          created_at
        FROM users
        WHERE id = ?
      `;

      const [users] = await db.promise().query(query, [id]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const user = users[0];

      res.json({
        success: true,
        data: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number || null,
          user_type: user.user_type,
          is_active: user.is_active,
          created_at: user.created_at
        }
      });
    } catch (error) {
      logger.error('❌ Error en getUserById:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuario'
      });
    }
  }

  /**
   * Obtiene solo el número de teléfono de un usuario
   * GET /api/v1/users/:id/phone
   */
  static async getUserPhone(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del usuario es requerido'
        });
      }

      const query = `
        SELECT phone_number
        FROM users
        WHERE id = ?
      `;

      const [users] = await db.promise().query(query, [id]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          phone_number: users[0].phone_number || null
        }
      });
    } catch (error) {
      logger.error('❌ Error en getUserPhone:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo teléfono del usuario'
      });
    }
  }

  /**
   * Obtiene datos públicos de un usuario por email
   * GET /api/v1/users/email/:email
   */
  static async getUserByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido'
        });
      }

      const query = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone_number,
          user_type,
          is_active,
          created_at
        FROM users
        WHERE email = ?
      `;

      const [users] = await db.promise().query(query, [email]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const user = users[0];

      res.json({
        success: true,
        data: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number || null,
          user_type: user.user_type,
          is_active: user.is_active,
          created_at: user.created_at
        }
      });
    } catch (error) {
      logger.error('❌ Error en getUserByEmail:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuario'
      });
    }
  }

  /**
   * Busca usuarios por nombre o email (solo admin)
   * GET /api/v1/users/search?q=query
   */
  static async searchUsers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La búsqueda debe tener al menos 2 caracteres'
        });
      }

      const query = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone_number,
          user_type,
          is_active
        FROM users
        WHERE 
          first_name LIKE ? OR 
          last_name LIKE ? OR 
          email LIKE ?
        LIMIT 10
      `;

      const searchTerm = `%${q}%`;
      const [users] = await db.promise().query(query, [searchTerm, searchTerm, searchTerm]);

      res.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number || null,
          user_type: user.user_type,
          is_active: user.is_active
        }))
      });
    } catch (error) {
      logger.error('❌ Error en searchUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error buscando usuarios'
      });
    }
  }
}

module.exports = UserController;
