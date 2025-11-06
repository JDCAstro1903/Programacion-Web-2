// Middleware de validación para datos del cliente
const { body, validationResult } = require('express-validator');

// Validación para actualizar información del cliente
const validateClientData = [
  body('emergency_contact_name')
    .trim()
    .notEmpty().withMessage('El nombre del contacto de emergencia es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
  
  body('emergency_contact_phone')
    .trim()
    .notEmpty().withMessage('El teléfono del contacto de emergencia es requerido')
    .matches(/^\d{10,15}$/).withMessage('El teléfono debe contener entre 10 y 15 dígitos'),
  
  body('number_of_children')
    .notEmpty().withMessage('El número de niños es requerido')
    .isInt({ min: 0, max: 20 }).withMessage('El número de niños debe ser un entero entre 0 y 20'),
  
  body('special_requirements')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage('Los requisitos especiales no pueden exceder 500 caracteres'),
  
  // Middleware para procesar los errores
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }
    
    // Validar archivo de identificación si se proporciona
    if (req.file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF) o PDF',
          errors: [{ msg: 'Tipo de archivo no válido', param: 'identification_document' }]
        });
      }
      
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'El archivo excede el tamaño máximo permitido de 10MB',
          errors: [{ msg: 'Archivo muy grande', param: 'identification_document' }]
        });
      }
    }
    
    next();
  }
];

module.exports = {
  validateClientData
};
