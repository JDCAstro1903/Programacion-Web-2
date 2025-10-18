const UserModel = require('../models/User');
const { 
    hashPassword, 
    comparePassword, 
    generateToken, 
    createAuthResponse 
} = require('../utils/auth');

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
            
            // Crear usuario
            const userData = {
                email,
                password_hash,
                first_name,
                last_name,
                phone_number,
                address,
                user_type
            };
            
            const newUser = await UserModel.create(userData);
            
            // Generar token JWT
            const token = generateToken(newUser);
            
            // Actualizar último login
            await UserModel.updateLastLogin(newUser.id);
            
            // Respuesta exitosa
            res.status(201).json(createAuthResponse(newUser, token));
            
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
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
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
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
            console.error('Error al obtener perfil:', error);
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
            console.error('Error al actualizar perfil:', error);
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
            console.error('Error al verificar email:', error);
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
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;