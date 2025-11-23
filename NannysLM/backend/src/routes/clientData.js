// Rutas para gestionar información específica del cliente
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const { validateClientData } = require('../middleware/clientValidation');
const { getClientData, upsertClientData, verifyClient, getAllClients } = require('../controllers/ClientDataController');

// Configurar multer para subir documentos de identificación
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'identification-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// GET /api/v1/client/data - Obtener información del cliente
router.get('/data', verifyToken, getClientData);

// POST /api/v1/client/data - Crear o actualizar información del cliente
router.post(
  '/data',
  verifyToken,
  upload.single('identification_document'),
  validateClientData,
  upsertClientData
);

// GET /api/v1/client/all - Obtener todos los clientes (solo admin)
router.get('/all', verifyToken, getAllClients);

// PUT /api/v1/client/:clientId/verify - Verificar cliente (solo admin)
router.put('/:clientId/verify', verifyToken, verifyClient);

module.exports = router;
