const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');

// Obtener servicios con filtros opcionales
router.get('/', ServiceController.getAllServices);

// Obtener disponibilidad de nannys
router.get('/availability', ServiceController.getNannyAvailability);

// Obtener un servicio específico por ID
router.get('/:id', ServiceController.getServiceById);

// Crear un nuevo servicio
router.post('/', ServiceController.createService);

// Actualizar un servicio existente
router.put('/:id', ServiceController.updateService);

// Eliminar/cancelar un servicio
router.delete('/:id', ServiceController.deleteService);

module.exports = router;
