const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PaymentController = require('../controllers/PaymentController');
const { verifyToken } = require('../middleware/auth');

/**
 * Rutas para gestión de pagos
 * Base: /api/v1/payments
 */

// Configurar multer para subir recibos de pago (usar memoryStorage para Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo imágenes y PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});

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

// Subir comprobante de pago (por el cliente) - CON MULTER
router.post('/:paymentId/receipt', verifyToken, upload.single('receipt'), PaymentController.uploadPaymentReceipt);

// Verificar/Aprobar o rechazar pago (por admin)
router.patch('/:paymentId/verify', verifyToken, PaymentController.verifyPayment);

// Actualizar estado de un pago
router.patch('/:id/status', PaymentController.updatePaymentStatus);

module.exports = router;
