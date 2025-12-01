const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/RatingController');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/v1/ratings - Crear nueva calificación
 */
router.post('/', verifyToken, RatingController.createRating);

/**
 * GET /api/v1/ratings - Obtener calificaciones de una nanny (por query param nannyId)
 */
router.get('/', RatingController.getNannyRatings);

/**
 * GET /api/v1/ratings/service/:serviceId - Obtener calificación de un servicio
 */
router.get('/service/:serviceId', RatingController.getServiceRating);

/**
 * GET /api/v1/ratings/nanny/:nannyId/average - Obtener promedio de calificaciones de una nanny
 */
router.get('/nanny/:nannyId/average', RatingController.getNannyAverageRating);

/**
 * POST /api/v1/ratings/recalculate/all - Recalcular promedios de todas las nannys
 */
router.post('/recalculate/all', RatingController.recalculateAllRatings);

module.exports = router;
