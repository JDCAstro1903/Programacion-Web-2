const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');

/**
 * Rutas para gestión de pagos
 * Base: /api/v1/payments
 */

// Obtener todos los pagos
router.get('/', PaymentController.getPayments);

// Obtener estadísticas de pagos
router.get('/stats', PaymentController.getPaymentStats);

// Obtener un pago por ID
router.get('/:id', PaymentController.getPaymentById);

// Crear un nuevo pago
router.post('/', PaymentController.createPayment);

// Actualizar estado de un pago
router.patch('/:id/status', PaymentController.updatePaymentStatus);

module.exports = router;
