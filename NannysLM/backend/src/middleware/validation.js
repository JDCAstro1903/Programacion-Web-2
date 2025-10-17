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

const validateRegister = handleValidationErrors(registerSchema);
const validateLogin = handleValidationErrors(loginSchema);
const validateUpdateProfile = handleValidationErrors(updateProfileSchema);

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    handleValidationErrors
};