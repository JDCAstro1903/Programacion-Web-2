/**
 * Middleware de validación para actualizaciones de perfil
 */

/**
 * Validar datos de actualización de perfil
 */
const validateProfileUpdate = (req, res, next) => {
    const { first_name, last_name, phone_number, address } = req.body;
    const errors = [];

    // Validar nombre
    if (first_name !== undefined) {
        if (!first_name || first_name.trim().length === 0) {
            errors.push('El nombre es requerido');
        } else if (first_name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        } else if (first_name.trim().length > 50) {
            errors.push('El nombre no puede tener más de 50 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(first_name.trim())) {
            errors.push('El nombre solo puede contener letras y espacios');
        }
    }

    // Validar apellido
    if (last_name !== undefined) {
        if (!last_name || last_name.trim().length === 0) {
            errors.push('El apellido es requerido');
        } else if (last_name.trim().length < 2) {
            errors.push('El apellido debe tener al menos 2 caracteres');
        } else if (last_name.trim().length > 50) {
            errors.push('El apellido no puede tener más de 50 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(last_name.trim())) {
            errors.push('El apellido solo puede contener letras y espacios');
        }
    }

    // Validar teléfono (opcional)
    if (phone_number !== undefined && phone_number) {
        const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
        if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
            errors.push('El teléfono debe tener entre 10 y 15 dígitos');
        }
    }

    // Validar dirección (opcional)
    if (address !== undefined && address) {
        if (address.trim().length > 200) {
            errors.push('La dirección no puede tener más de 200 caracteres');
        }
    }

    // Validar archivo de imagen si existe
    if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            errors.push('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
        }

        // Verificar tamaño (5MB)
        if (req.file.size > 5 * 1024 * 1024) {
            errors.push('La imagen no puede ser mayor a 5MB');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors
        });
    }

    next();
};

/**
 * Validar cambio de contraseña
 */
const validatePasswordChange = (req, res, next) => {
    const { current_password, new_password } = req.body;
    const errors = [];

    // Validar contraseña actual
    if (!current_password) {
        errors.push('La contraseña actual es requerida');
    }

    // Validar nueva contraseña
    if (!new_password) {
        errors.push('La nueva contraseña es requerida');
    } else {
        if (new_password.length < 6) {
            errors.push('La nueva contraseña debe tener al menos 6 caracteres');
        }
        if (new_password.length > 100) {
            errors.push('La nueva contraseña no puede tener más de 100 caracteres');
        }
        // Verificar que tenga al menos una letra y un número
        if (!/[a-zA-Z]/.test(new_password)) {
            errors.push('La contraseña debe contener al menos una letra');
        }
        if (!/[0-9]/.test(new_password)) {
            errors.push('La contraseña debe contener al menos un número');
        }
    }

    // Verificar que no sean iguales
    if (current_password && new_password && current_password === new_password) {
        errors.push('La nueva contraseña debe ser diferente a la actual');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors
        });
    }

    next();
};

module.exports = {
    validateProfileUpdate,
    validatePasswordChange
};
