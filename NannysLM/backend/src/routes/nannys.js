// Rutas para gestionar nannys
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { createNanny, getAllNannys, getNannyById, getNannyByUserId, updateNannyStatus, updateNannyHourlyRate } = require('../controllers/NannyController');

/**
 * POST /api/v1/nannys - Crear nueva nanny (SOLO ADMIN)
 */
router.post('/', verifyToken, createNanny);

/**
 * GET /api/v1/nannys - Obtener todas las nannys (SOLO ADMIN)
 */
router.get('/', verifyToken, getAllNannys);

/**
 * GET /api/v1/nannys/user/:userId - Obtener nanny por user_id
 */
router.get('/user/:userId', verifyToken, getNannyByUserId);

/**
 * PATCH /api/v1/nannys/:id/status - Cambiar estado de una nanny (SOLO ADMIN)
 */
router.patch('/:id/status', verifyToken, updateNannyStatus);

/**
 * PATCH /api/v1/nannys/:id/hourly-rate - Actualizar tarifa por hora (SOLO ADMIN)
 */
router.patch('/:id/hourly-rate', verifyToken, updateNannyHourlyRate);

/**
 * GET /api/v1/nannys/:nannyId - Obtener nanny específica (SOLO ADMIN)
 */
router.get('/:nannyId', verifyToken, getNannyById);

module.exports = router;

