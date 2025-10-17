const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Genera un token JWT para el usuario
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'NannysLM',
            audience: 'NannysLM-Users'
        }
    );
};

/**
 * Encripta una contraseña usando bcrypt
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compara una contraseña con su hash
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Verifica si un token JWT es válido
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token inválido');
    }
};

/**
 * Genera un nombre de usuario único basado en email
 */
const generateUsername = (email) => {
    const username = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${username}${randomSuffix}`;
};

/**
 * Formato de respuesta estándar para autenticación exitosa
 */
const createAuthResponse = (user, token) => {
    return {
        success: true,
        message: 'Autenticación exitosa',
        data: {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type,
                phone_number: user.phone_number,
                address: user.address,
                is_verified: user.is_verified,
                is_active: user.is_active,
                profile_image: user.profile_image,
                created_at: user.created_at
            },
            token: token,
            expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
    };
};

/**
 * Valida la fuerza de una contraseña
 */
const validatePasswordStrength = (password) => {
    const minLength = 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [
        password.length >= minLength,
        hasLowerCase,
        hasUpperCase,
        hasNumbers,
        hasSpecialChar
    ].filter(Boolean).length;
    
    return {
        isValid: score >= 3,
        score: score,
        feedback: {
            length: password.length >= minLength,
            lowercase: hasLowerCase,
            uppercase: hasUpperCase,
            numbers: hasNumbers,
            special: hasSpecialChar
        }
    };
};

module.exports = {
    generateToken,
    hashPassword,
    comparePassword,
    verifyToken,
    generateUsername,
    createAuthResponse,
    validatePasswordStrength
};