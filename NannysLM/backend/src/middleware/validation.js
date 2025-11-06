const Joi = require('joi');

const handleValidationErrors = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }))
            });
        }
        next();
    };
};

const registerSchema = Joi.object({
    first_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/)
        .required()
        .messages({
            'string.min': 'El nombre debe tener al menos 2 caracteres',
            'string.max': 'El nombre no puede exceder 100 caracteres',
            'string.pattern.base': 'El nombre solo puede contener letras y espacios',
            'any.required': 'El nombre es requerido'
        }),
    
    last_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/)
        .required()
        .messages({
            'string.min': 'El apellido debe tener al menos 2 caracteres',
            'string.max': 'El apellido no puede exceder 100 caracteres',
            'string.pattern.base': 'El apellido solo puede contener letras y espacios',
            'any.required': 'El apellido es requerido'
        }),
    
    email: Joi.string()
        .email()
        .max(255)
        .required()
        .messages({
            'string.email': 'Debe ser un email válido',
            'string.max': 'El email no puede exceder 255 caracteres',
            'any.required': 'El email es requerido'
        }),
    
    password: Joi.string()
        .min(6)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.min': 'La contraseña debe tener al menos 6 caracteres',
            'string.max': 'La contraseña no puede exceder 100 caracteres',
            'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
            'any.required': 'La contraseña es requerida'
        }),
    
    phone_number: Joi.string()
        .max(20)
        .pattern(/^(\+52\s?)?(\d{2}\s?)?\d{8}$/)
        .optional()
        .messages({
            'string.max': 'El teléfono no puede exceder 20 caracteres',
            'string.pattern.base': 'Debe ser un número de teléfono válido de México'
        }),
    
    address: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'La dirección no puede exceder 500 caracteres'
        }),
    
    user_type: Joi.string()
        .valid('client', 'nanny', 'admin')
        .required()
        .messages({
            'any.only': 'El tipo de usuario debe ser "client", "nanny" o "admin"',
            'any.required': 'El tipo de usuario es requerido'
        })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Debe ser un email válido',
            'any.required': 'El email es requerido'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'La contraseña es requerida'
        })
});

const updateProfileSchema = Joi.object({
    first_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/)
        .optional()
        .messages({
            'string.min': 'El nombre debe tener al menos 2 caracteres',
            'string.max': 'El nombre no puede exceder 100 caracteres',
            'string.pattern.base': 'El nombre solo puede contener letras y espacios'
        }),
    
    last_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/)
        .optional()
        .messages({
            'string.min': 'El apellido debe tener al menos 2 caracteres',
            'string.max': 'El apellido no puede exceder 100 caracteres',
            'string.pattern.base': 'El apellido solo puede contener letras y espacios'
        }),
    
    phone_number: Joi.string()
        .max(20)
        .pattern(/^(\+52\s?)?(\d{2}\s?)?\d{8}$/)
        .optional()
        .messages({
            'string.max': 'El teléfono no puede exceder 20 caracteres',
            'string.pattern.base': 'Debe ser un número de teléfono válido de México'
        }),
    
    address: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'La dirección no puede exceder 500 caracteres'
        })
});

// Esquema de validación para completar perfil de cliente
const completeClientProfileSchema = Joi.object({
    emergency_contact_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/)
        .required()
        .messages({
            'any.required': 'El nombre del contacto de emergencia es requerido',
            'string.min': 'El nombre debe tener al menos 2 caracteres',
            'string.max': 'El nombre no puede exceder 100 caracteres',
            'string.pattern.base': 'El nombre solo puede contener letras y espacios'
        }),
    
    emergency_contact_phone: Joi.string()
        .max(20)
        .pattern(/^(\+52\s?)?(\d{2}\s?)?\d{8}$/)
        .required()
        .messages({
            'any.required': 'El teléfono del contacto de emergencia es requerido',
            'string.max': 'El teléfono no puede exceder 20 caracteres',
            'string.pattern.base': 'Debe ser un número de teléfono válido de México'
        }),
    
    number_of_children: Joi.number()
        .integer()
        .min(0)
        .max(10)
        .optional()
        .messages({
            'number.base': 'El número de hijos debe ser un número',
            'number.min': 'El número de hijos no puede ser negativo',
            'number.max': 'El número máximo de hijos es 10',
            'number.integer': 'El número de hijos debe ser un número entero'
        }),
    
    special_requirements: Joi.string()
        .max(1000)
        .optional()
        .messages({
            'string.max': 'Los requerimientos especiales no pueden exceder 1000 caracteres'
        }),
    
    identification_document: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'La ruta del documento no puede exceder 500 caracteres'
        })
});

// Esquema de validación para completar perfil de niñera
const completeNannyProfileSchema = Joi.object({
    description: Joi.string()
        .min(50)
        .max(2000)
        .required()
        .messages({
            'any.required': 'La descripción es requerida',
            'string.min': 'La descripción debe tener al menos 50 caracteres',
            'string.max': 'La descripción no puede exceder 2000 caracteres'
        }),
    
    experience_years: Joi.number()
        .integer()
        .min(0)
        .max(50)
        .required()
        .messages({
            'any.required': 'Los años de experiencia son requeridos',
            'number.base': 'Los años de experiencia deben ser un número',
            'number.min': 'Los años de experiencia no pueden ser negativos',
            'number.max': 'Los años de experiencia no pueden exceder 50',
            'number.integer': 'Los años de experiencia deben ser un número entero'
        }),
    
    hourly_rate: Joi.number()
        .precision(2)
        .min(0)
        .max(9999.99)
        .required()
        .messages({
            'any.required': 'La tarifa por hora es requerida',
            'number.base': 'La tarifa debe ser un número',
            'number.min': 'La tarifa no puede ser negativa',
            'number.max': 'La tarifa no puede exceder $9,999.99'
        })
});

const validateRegister = handleValidationErrors(registerSchema);
const validateLogin = handleValidationErrors(loginSchema);
const validateUpdateProfile = handleValidationErrors(updateProfileSchema);
const validateCompleteClientProfile = handleValidationErrors(completeClientProfileSchema);
const validateCompleteNannyProfile = handleValidationErrors(completeNannyProfileSchema);

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateCompleteClientProfile,
    validateCompleteNannyProfile,
    handleValidationErrors
};