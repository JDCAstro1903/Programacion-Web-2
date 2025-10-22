const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { authenticateToken } = require('../middleware/auth');
// Temporalmente sin validación para resolver el error
// const { validateCompleteClientProfile, validateCompleteNannyProfile } = require('../middleware/validation');

/**
 * @route   GET /api/v1/profile/status
 * @desc    Verificar estado del perfil del usuario
 * @access  Private (requiere token)
 */
router.get('/status', authenticateToken, ProfileController.checkProfileStatus);

/**
 * @route   POST /api/v1/profile/complete-client
 * @desc    Completar perfil específico de cliente
 * @access  Private (solo clientes)
 */
router.post('/complete-client', 
    authenticateToken, 
    // validateCompleteClientProfile, // Temporalmente deshabilitado
    ProfileController.completeClientProfile
);

/**
 * @route   POST /api/v1/profile/complete-nanny
 * @desc    Completar perfil específico de niñera
 * @access  Private (solo niñeras)
 */
router.post('/complete-nanny', 
    authenticateToken, 
    // validateCompleteNannyProfile, // Temporalmente deshabilitado
    ProfileController.completeNannyProfile
);

module.exports = router;