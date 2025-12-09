const UserModel = require('../models/User');
const logger = require('./logger');
const jwt = require('jsonwebtoken');
const { 
    hashPassword, 
    comparePassword, 
    generateToken, 
    createAuthResponse 
} = require('../utils/auth');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/email');

/**
 * Controlador para manejo de autenticación
 */
class AuthController {
    
    /**
     * Registrar nuevo usuario
     */
    static async register(req, res) {
        try {
            const {
                first_name,
                last_name,
                email,
                password,
                phone_number,
                address,
                user_type
            } = req.body;
            
            // Verificar si el email ya existe
            const existingUser = await UserModel.emailExists(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un usuario registrado con este email'
                });
            }
            
            // Encriptar contraseña
            const password_hash = await hashPassword(password);
            
            // Crear usuario (por seguridad marcar is_verified e is_active en false)
            const userData = {
                email,
                password_hash,
                first_name,
                last_name,
                phone_number,
                address,
                user_type,
                is_verified: false,
                is_active: false
            };

            const newUser = await UserModel.create(userData);

            // Generar token de activación (expira en 24h)
            const activationToken = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_ACTIVATION_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.ACTIVATION_TOKEN_EXPIRES_IN || '24h' });

            // Enlace de activación - apunta al endpoint de activación del backend
            const backendUrl = process.env.BACKEND_URL || 
                              (process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : `http://localhost:${process.env.PORT || 8000}`);
            const activationLink = `${backendUrl}/api/v1/auth/activate?token=${activationToken}`;

            // Enviar correo de activación (si no está configurado enviará el link por consola)
            try {
                await sendActivationEmail(newUser.email, `${newUser.first_name} ${newUser.last_name}`, activationLink);
            } catch (err) {
                logger.error('Error enviando email de activación:', err);
            }

            // No iniciar sesión automáticamente: requerir activación por email
            res.status(201).json({
                success: true,
                message: 'Registro creado. Revisa tu correo para activar la cuenta.'
            });
            
        } catch (error) {
            logger.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Solicitud de restablecimiento de contraseña
     * POST /api/auth/forgot-password
     * body: { email }
     */
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'El email es requerido' });
            }

            const user = await UserModel.findByEmail(email);

            // Siempre responder con éxito para no revelar si el email existe
            if (!user) {
                return res.status(200).json({ success: true, message: 'Si existe una cuenta asociada, recibirás un correo con instrucciones para restablecer tu contraseña.' });
            }

            // Generar token de restablecimiento (expira en 1h)
            const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_PASSWORD_RESET_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h' });

            // Enlace de restablecimiento que apunta al frontend
            const frontend = process.env.FRONTEND_URL || `http://localhost:4200`;
            const resetLink = `${frontend}/reset-password?token=${resetToken}`;

            try {
                await sendPasswordResetEmail(user.email, `${user.first_name} ${user.last_name}`, resetLink);
            } catch (err) {
                // Error silencioso - el usuario no debe saber si falló
            }

            return res.status(200).json({ success: true, message: 'Si existe una cuenta asociada, recibirás un correo con instrucciones para restablecer tu contraseña.' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Restablecer contraseña usando token
     * POST /api/auth/reset-password
     * body: { token, password }
     */
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
            }

            let payload;
            try {
                payload = jwt.verify(token, process.env.JWT_PASSWORD_RESET_SECRET || process.env.JWT_SECRET);
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
            }

            const user = await UserModel.findByEmail(payload.email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            // Validar fuerza de la contraseña (usar utilidad en utils/auth si se desea)
            const { validatePasswordStrength } = require('../utils/auth');
            const check = validatePasswordStrength(password);
            if (!check.isValid) {
                return res.status(400).json({ success: false, message: 'La contraseña no cumple los requisitos mínimos', details: check.feedback });
            }

            // Hashear y actualizar la contraseña
            const { hashPassword } = require('../utils/auth');
            const password_hash = await hashPassword(password);
            await UserModel.update(user.id, { password_hash });

            return res.status(200).json({ success: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
        } catch (error) {
            logger.error('Error en resetPassword:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
    
    /**
     * Iniciar sesión
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Buscar usuario por email
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado',
                    errors: [
                        {
                            field: 'email',
                            message: 'No existe una cuenta asociada a este correo electrónico'
                        }
                    ]
                });
            }
            
            // Verificar si el usuario está activo
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Cuenta desactivada',
                    errors: [
                        {
                            field: 'general',
                            message: 'Tu cuenta ha sido desactivada. Contacta al soporte técnico.'
                        }
                    ]
                });
            }
            
            // Verificar contraseña
            const isPasswordValid = await comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña incorrecta',
                    errors: [
                        {
                            field: 'password',
                            message: 'La contraseña ingresada es incorrecta'
                        }
                    ]
                });
            }
            
            // Generar token JWT
            const token = generateToken(user);
            
            // Actualizar último login
            await UserModel.updateLastLogin(user.id);
            
            // Respuesta exitosa
            res.status(200).json(createAuthResponse(user, token));
            
        } catch (error) {
            logger.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Activar cuenta vía token enviado por email
     * GET /api/v1/auth/activate?token=...
     */
    static async activate(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token de activación requerido' });
            }

            let payload;
            try {
                payload = jwt.verify(token, process.env.JWT_ACTIVATION_SECRET || process.env.JWT_SECRET);
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
            }

            const userId = payload.id;
            const user = await UserModel.findByEmail(payload.email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            // Activar la cuenta (is_active = true)
            await UserModel.update(userId, { is_active: true });

            // Redirigir al frontend con query param de éxito si FRONTEND_URL existe
            const frontend = process.env.FRONTEND_URL || null;
            if (frontend) {
                return res.redirect(`${frontend}/login?activated=1`);
            }

            res.status(200).json({ success: true, message: 'Cuenta activada correctamente. Ya puedes iniciar sesión.' });
        } catch (error) {
            logger.error('Error activando cuenta:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
    
    /**
     * Obtener perfil del usuario autenticado
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            // Remover información sensible
            const { password_hash, ...userProfile } = user;
            
            res.status(200).json({
                success: true,
                message: 'Perfil obtenido exitosamente',
                data: userProfile
            });
            
        } catch (error) {
            logger.error('Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Actualizar perfil del usuario
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;
            
            // Remover campos que no se deben actualizar aquí
            delete updateData.email;
            delete updateData.password;
            delete updateData.password_hash;
            delete updateData.user_type;
            delete updateData.is_verified;
            delete updateData.is_active;
            
            const updatedUser = await UserModel.update(userId, updateData);
            
            // Remover información sensible
            const { password_hash, ...userProfile } = updatedUser;
            
            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: userProfile
            });
            
        } catch (error) {
            logger.error('Error al actualizar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Verificar si un email está disponible
     */
    static async checkEmailAvailability(req, res) {
        try {
            const { email } = req.query;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email es requerido'
                });
            }
            
            const exists = await UserModel.emailExists(email);
            
            res.status(200).json({
                success: true,
                data: {
                    email,
                    available: !exists
                }
            });
            
        } catch (error) {
            logger.error('Error al verificar email:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Logout (por ahora solo respuesta, el token se maneja en el frontend)
     */
    static async logout(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        } catch (error) {
            logger.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;