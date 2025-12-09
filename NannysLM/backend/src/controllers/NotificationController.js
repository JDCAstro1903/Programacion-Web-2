// Controlador para gestionar notificaciones
const { pool } = require('../config/database');
const logger = require('./logger');

// Obtener todas las notificaciones del usuario autenticado
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Del token JWT verificado por middleware
        
        logger.info(`📋 Obteniendo notificaciones para user_id: ${userId}`);
        
        const [rows] = await pool.query(
            `SELECT 
                id,
                title,
                message,
                type,
                is_read,
                action_url,
                related_id,
                related_type,
                created_at,
                read_at
            FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC`,
            [userId]
        );
        
        logger.success('Se obtuvieron ${rows.length} notificaciones para user_id: ${userId}`);
        
        return res.status(200).json({
            success: true,
            message: 'Notificaciones obtenidas correctamente',
            data: rows,
            count: rows.length
        });
        
    } catch (error) {
        logger.error('❌ Error al obtener notificaciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener notificaciones',
            error: error.message
        });
    }
};

// Marcar una notificación específica como leída
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        logger.info(`📖 Marcando notificación ${notificationId} como leída para user_id: ${userId}`);
        
        // Verificar que la notificación pertenece al usuario
        const [rows] = await pool.query(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        
        if (rows.length === 0) {
            logger.info(`⚠️ Notificación ${notificationId} no encontrada para user_id: ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }
        
        // Actualizar la notificación
        await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [notificationId]
        );
        
        logger.success('Notificación ${notificationId} marcada como leída`);
        
        return res.status(200).json({
            success: true,
            message: 'Notificación marcada como leída'
        });
        
    } catch (error) {
        logger.error('❌ Error al marcar notificación como leída:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        logger.info(`📖 Marcando todas las notificaciones como leídas para user_id: ${userId}`);
        
        const [result] = await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND is_read = false`,
            [userId]
        );
        
        logger.success('Se marcaron ${result.affectedRows} notificaciones como leídas`);
        
        return res.status(200).json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas',
            affectedRows: result.affectedRows
        });
        
    } catch (error) {
        logger.error('❌ Error al marcar todas las notificaciones como leídas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Eliminar una notificación
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        logger.info(`🗑️ Eliminando notificación ${notificationId} para user_id: ${userId}`);
        
        // Verificar que la notificación pertenece al usuario
        const [rows] = await pool.query(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        
        if (rows.length === 0) {
            logger.info(`⚠️ Notificación ${notificationId} no encontrada para user_id: ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }
        
        // Eliminar la notificación
        await pool.query(
            'DELETE FROM notifications WHERE id = ?',
            [notificationId]
        );
        
        logger.success('Notificación ${notificationId} eliminada`);
        
        return res.status(200).json({
            success: true,
            message: 'Notificación eliminada'
        });
        
    } catch (error) {
        logger.error('❌ Error al eliminar notificación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
