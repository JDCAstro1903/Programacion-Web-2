// Rutas para gestionar notificaciones de usuarios
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/NotificationController');

// GET /api/v1/notifications - Obtener todas las notificaciones del usuario autenticado
router.get('/', verifyToken, getNotifications);

// PUT /api/v1/notifications/:notificationId/read - Marcar una notificación como leída
router.put('/:notificationId/read', verifyToken, markAsRead);

// PUT /api/v1/notifications/mark-all-read - Marcar todas las notificaciones como leídas
router.put('/mark-all-read', verifyToken, markAllAsRead);

// DELETE /api/v1/notifications/:notificationId - Eliminar una notificación
router.delete('/:notificationId', verifyToken, deleteNotification);

module.exports = router;
