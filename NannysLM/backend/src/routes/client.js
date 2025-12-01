const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   GET /api/v1/client/all
 * @desc    Obtener todos los clientes (Admin)
 * @access  Public (para admin dashboard)
 */
router.get('/all', ClientController.getAllClients);

/**
 * @route   PUT /api/v1/client/profile
 * @desc    Actualizar información de perfil del cliente
 * @access  Private (solo clientes)
 */
router.put('/profile', verifyToken, ClientController.updateClientProfile);

/**
 * @route   GET /api/v1/client/info
 * @desc    Obtener información completa del cliente
 * @access  Private (solo clientes)
 */
router.get('/info', verifyToken, ClientController.getClientInfo);

/**
 * @route   GET /api/v1/client/services
 * @desc    Obtener servicios contratados del cliente
 * @access  Private (solo clientes)
 * @query   status (optional) - all, pending, confirmed, completed, cancelled
 * @query   limit (optional) - número máximo de resultados (default: 50)
 */
router.get('/services', verifyToken, ClientController.getClientServices);

/**
 * @route   GET /api/v1/client/payments
 * @desc    Obtener historial de pagos del cliente
 * @access  Private (solo clientes)
 * @query   status (optional) - all, pending, completed, failed, refunded
 * @query   limit (optional) - número máximo de resultados (default: 50)
 */
router.get('/payments', verifyToken, ClientController.getClientPayments);

/**
 * @route   GET /api/v1/client/stats
 * @desc    Obtener estadísticas del cliente
 * @access  Private (solo clientes)
 */
router.get('/stats', verifyToken, ClientController.getClientStats);

/**
 * @route   POST /api/v1/client/rate-service
 * @desc    Calificar un servicio
 * @access  Private (solo clientes)
 * @body    { service_id, rating, review, punctuality_rating, communication_rating, care_quality_rating, would_recommend }
 */
router.post('/rate-service', verifyToken, ClientController.rateService);

/**
 * @route   PUT /api/v1/client/:id/verify
 * @desc    Verificar o rechazar cliente (Admin)
 * @access  Private (solo admin)
 * @body    { status: 'approved' | 'rejected' }
 */
router.put('/:id/verify', verifyToken, ClientController.verifyClient);

module.exports = router;