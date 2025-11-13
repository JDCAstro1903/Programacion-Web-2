// Rutas para gestionar nannys
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { createNanny, getAllNannys, getNannyById, getNannyByUserId } = require('../controllers/NannyController');

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
 * GET /api/v1/nannys/:nannyId - Obtener nanny específica (SOLO ADMIN)
 */
router.get('/:nannyId', verifyToken, getNannyById);

module.exports = router;
