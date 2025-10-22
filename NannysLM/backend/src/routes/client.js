
const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   PUT /api/v1/client/profile
 * @desc    Actualizar información de perfil del cliente
 * @access  Private (solo clientes)
 */
router.put('/profile', authenticateToken, ClientController.updateClientProfile);

/**
 * @route   GET /api/v1/client/info
 * @desc    Obtener información completa del cliente
 * @access  Private (solo clientes)
 */
router.get('/info', authenticateToken, ClientController.getClientInfo);

/**
 * @route   GET /api/v1/client/services
 * @desc    Obtener servicios contratados del cliente
 * @access  Private (solo clientes)
 * @query   status (optional) - all, pending, confirmed, completed, cancelled
 * @query   limit (optional) - número máximo de resultados (default: 50)
 */
router.get('/services', authenticateToken, ClientController.getClientServices);

/**
 * @route   GET /api/v1/client/payments
 * @desc    Obtener historial de pagos del cliente
 * @access  Private (solo clientes)
 * @query   status (optional) - all, pending, completed, failed, refunded
 * @query   limit (optional) - número máximo de resultados (default: 50)
 */
router.get('/payments', authenticateToken, ClientController.getClientPayments);

/**
 * @route   GET /api/v1/client/stats
 * @desc    Obtener estadísticas del cliente
 * @access  Private (solo clientes)
 */
router.get('/stats', authenticateToken, ClientController.getClientStats);

module.exports = router;