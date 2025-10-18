const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');

/**
 * @route GET /api/v1/dashboard/stats
 * @desc Obtener estadísticas generales del dashboard
 * @access Private (Admin)
 */
router.get('/stats', DashboardController.getStats);

/**
 * @route GET /api/v1/dashboard/users
 * @desc Obtener todos los usuarios con filtros opcionales
 * @access Private (Admin)
 */
router.get('/users', DashboardController.getAllUsers);

/**
 * @route GET /api/v1/dashboard/nannys
 * @desc Obtener información específica de nannys
 * @access Private (Admin)
 */
router.get('/nannys', DashboardController.getNannys);

/**
 * @route GET /api/v1/dashboard/clients
 * @desc Obtener información específica de clientes
 * @access Private (Admin)
 */
router.get('/clients', DashboardController.getClients);

module.exports = router;