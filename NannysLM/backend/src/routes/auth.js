const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 * @body    { first_name, last_name, email, password, phone_number?, address?, user_type }
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/profile', verifyToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { first_name?, last_name?, phone_number?, address? }
 */
router.put('/profile', verifyToken, validateUpdateProfile, AuthController.updateProfile);

/**
 * @route   GET /api/auth/check-email
 * @desc    Verificar disponibilidad de email
 * @access  Public
 * @query   email=usuario@email.com
 */
router.get('/check-email', AuthController.checkEmailAvailability);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', verifyToken, AuthController.logout);

module.exports = router;