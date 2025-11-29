const express = require('express');
const UserController = require('../controllers/UserController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Rutas de usuarios
 * Base: /api/v1/users
 */

// Obtener usuario por ID (solo usuarios autenticados)
router.get('/:id', verifyToken, UserController.getUserById);

// Obtener solo el teléfono de un usuario (solo usuarios autenticados)
router.get('/:id/phone', verifyToken, UserController.getUserPhone);

// Obtener usuario por email (solo usuarios autenticados)
router.get('/email/:email', verifyToken, UserController.getUserByEmail);

// Buscar usuarios (solo admin)
router.get('/search', verifyToken, UserController.searchUsers);

module.exports = router;
