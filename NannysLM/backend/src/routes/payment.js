const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { verifyToken } = require('../middleware/auth');

/**
 * Rutas para gestión de pagos
 * Base: /api/v1/payments
 */

// Obtener todos los pagos (admin)
router.get('/', PaymentController.getPayments);

// Obtener estadísticas de pagos (admin)
router.get('/stats', PaymentController.getPaymentStats);

// Obtener pagos del cliente autenticado
router.get('/client/my-payments', verifyToken, PaymentController.getClientPayments);

// Obtener un pago por ID
router.get('/:id', PaymentController.getPaymentById);

// Crear un nuevo pago
router.post('/', PaymentController.createPayment);

// Inicializar pago después de completar servicio
router.post('/client/initialize', verifyToken, PaymentController.initializePayment);

// Subir comprobante de pago (por el cliente)
router.post('/:paymentId/receipt', verifyToken, PaymentController.uploadPaymentReceipt);

// Verificar/Aprobar o rechazar pago (por admin)
router.patch('/:paymentId/verify', verifyToken, PaymentController.verifyPayment);

// Actualizar estado de un pago
router.patch('/:id/status', PaymentController.updatePaymentStatus);

module.exports = router;
