const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ProfileController = require('../controllers/ProfileController');
const { verifyToken } = require('../middleware/auth');
const { validateProfileUpdate, validatePasswordChange } = require('../middleware/profileValidation');

// Configurar multer para subida de imágenes de perfil
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Temporalmente sin validación para resolver el error
// const { validateCompleteClientProfile, validateCompleteNannyProfile } = require('../middleware/validation');

/**
 * @route   GET /api/v1/profile/data
 * @desc    Obtener datos completos del perfil del usuario (usuario + cliente)
 * @access  Public (acepta query param userId)
 */
router.get('/data', ProfileController.getProfileData);

/**
 * @route   GET /api/v1/profile/status
 * @desc    Verificar estado del perfil del usuario
 * @access  Private (requiere token)
 */
router.get('/status', verifyToken, ProfileController.checkProfileStatus);

/**
 * @route   POST /api/v1/profile/complete-client
 * @desc    Completar perfil específico de cliente
 * @access  Private (solo clientes)
 */
router.post('/complete-client', 
    verifyToken, 
    // validateCompleteClientProfile, // Temporalmente deshabilitado
    ProfileController.completeClientProfile
);

/**
 * @route   POST /api/v1/profile/complete-nanny
 * @desc    Completar perfil específico de niñera
 * @access  Private (solo niñeras)
 */
router.post('/complete-nanny', 
    verifyToken, 
    // validateCompleteNannyProfile, // Temporalmente deshabilitado
    ProfileController.completeNannyProfile
);

/**
 * @route   PUT /api/v1/profile/update
 * @desc    Actualizar información básica del usuario y foto de perfil
 * @access  Private (requiere token)
 */
router.put('/update', verifyToken, upload.single('profile_image'), validateProfileUpdate, ProfileController.updateUserProfile);

/**
 * @route   PUT /api/v1/profile/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private (requiere token)
 */
router.put('/change-password', verifyToken, validatePasswordChange, ProfileController.changePassword);

module.exports = router;