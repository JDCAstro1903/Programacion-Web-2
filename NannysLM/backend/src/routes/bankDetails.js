const express = require('express');
const router = express.Router();
const BankDetailsController = require('../controllers/BankDetailsController');

/**
 * Rutas para gestión de datos bancarios
 * Base: /api/v1/bank-details
 */

// Obtener todos los datos bancarios
router.get('/', BankDetailsController.getBankDetails);

// Obtener datos bancarios por ID
router.get('/:id', BankDetailsController.getBankDetailById);

// Crear nuevos datos bancarios
router.post('/', BankDetailsController.createBankDetails);

// Actualizar datos bancarios
router.put('/:id', BankDetailsController.updateBankDetails);

// Eliminar datos bancarios
router.delete('/:id', BankDetailsController.deleteBankDetails);

// Alternar estado activo/inactivo
router.patch('/:id/toggle-status', BankDetailsController.toggleActiveStatus);

module.exports = router;
