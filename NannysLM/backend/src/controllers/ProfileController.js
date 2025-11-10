const UserModel = require('../models/User');
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Controlador para manejo de perfiles específicos
 */
class ProfileController {
    
    /**
     * Completar perfil de cliente
     */
    static async completeClientProfile(req, res) {
        try {
            const userId = req.user.id;
            const {
                emergency_contact_name,
                emergency_contact_phone,
                number_of_children,
                special_requirements,
                identification_document
            } = req.body;

            // Verificar que el usuario sea de tipo cliente
            const user = await UserModel.findById(userId);
            if (!user || user.user_type !== 'client') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los clientes pueden completar este perfil'
                });
            }

            // Verificar si ya existe un perfil de cliente
            const checkExistingQuery = 'SELECT id FROM clients WHERE user_id = ?';
            const existingResult = await executeQuery(checkExistingQuery, [userId]);
            
            if (existingResult.success && existingResult.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya tienes un perfil de cliente completado'
                });
            }

            // Crear perfil de cliente
            const insertClientQuery = `
                INSERT INTO clients (
                    user_id, 
                    emergency_contact_name, 
                    emergency_contact_phone, 
                    number_of_children, 
                    special_requirements,
                    identification_document,
                    verification_status
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
            `;

            const result = await executeQuery(insertClientQuery, [
                userId,
                emergency_contact_name,
                emergency_contact_phone,
                number_of_children || 0,
                special_requirements || null,
                identification_document || null
            ]);

            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Perfil de cliente completado exitosamente',
                    data: {
                        client_id: result.data.insertId,
                        user_id: userId,
                        profile_completed: true
                    }
                });
            } else {
                throw new Error('Error al crear perfil de cliente');
            }

        } catch (error) {
            console.error('Error al completar perfil de cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Completar perfil de niñera
     */
    static async completeNannyProfile(req, res) {
        try {
            const userId = req.user.id;
            const {
                description,
                experience_years,
                hourly_rate,
                services_offered
            } = req.body;

            // Verificar que el usuario sea de tipo nanny
            const user = await UserModel.findById(userId);
            if (!user || user.user_type !== 'nanny') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo las niñeras pueden completar este perfil'
                });
            }

            // Verificar si ya existe un perfil de niñera
            const checkExistingQuery = 'SELECT id FROM nannys WHERE user_id = ?';
            const existingResult = await executeQuery(checkExistingQuery, [userId]);
            
            if (existingResult.success && existingResult.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya tienes un perfil de niñera completado'
                });
            }

            // Crear perfil de niñera
            const insertNannyQuery = `
                INSERT INTO nannys (
                    user_id, 
                    description,
                    experience_years,
                    hourly_rate,
                    status
                ) VALUES (?, ?, ?, ?, 'active')
            `;

            const result = await executeQuery(insertNannyQuery, [
                userId,
                description || null,
                experience_years || 0,
                hourly_rate || 0.00
            ]);

            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Perfil de niñera completado exitosamente',
                    data: {
                        nanny_id: result.data.insertId,
                        user_id: userId,
                        profile_completed: true
                    }
                });
            } else {
                throw new Error('Error al crear perfil de niñera');
            }

        } catch (error) {
            console.error('Error al completar perfil de niñera:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Verificar si el perfil específico está completo
     */
    static async checkProfileStatus(req, res) {
        try {
            const userId = req.user.id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            let profileCompleted = false;
            let specificProfileData = null;

            // Verificar según el tipo de usuario
            if (user.user_type === 'client') {
                const clientQuery = 'SELECT * FROM clients WHERE user_id = ?';
                const clientResult = await executeQuery(clientQuery, [userId]);
                
                profileCompleted = clientResult.success && clientResult.data.length > 0;
                specificProfileData = profileCompleted ? clientResult.data[0] : null;
                
            } else if (user.user_type === 'nanny') {
                const nannyQuery = 'SELECT * FROM nannys WHERE user_id = ?';
                const nannyResult = await executeQuery(nannyQuery, [userId]);
                
                profileCompleted = nannyResult.success && nannyResult.data.length > 0;
                specificProfileData = profileCompleted ? nannyResult.data[0] : null;
                
            } else if (user.user_type === 'admin') {
                // Los admins no necesitan perfil específico
                profileCompleted = true;
            }

            res.status(200).json({
                success: true,
                data: {
                    user_type: user.user_type,
                    profile_completed: profileCompleted,
                    user_data: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone_number: user.phone_number,
                        address: user.address,
                        is_verified: user.is_verified,
                        is_active: user.is_active,
                        profile_image: user.profile_image,
                        created_at: user.created_at,
                        updated_at: user.updated_at,
                        last_login: user.last_login
                    },
                    specific_profile: specificProfileData
                }
            });

        } catch (error) {
            console.error('Error al verificar estado del perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Actualizar información básica del usuario
     */
    static async updateUserProfile(req, res) {
        try {
            console.log('📝 ProfileController - updateUserProfile iniciado');
            console.log('📝 User ID:', req.user.id);
            console.log('📝 Body:', req.body);
            console.log('📝 File:', req.file);
            const userId = req.user.id;
            const {
                first_name,
                last_name,
                phone_number,
                address
            } = req.body;

            console.log('📝 Actualizando perfil del usuario:', userId);
            console.log('📝 Datos recibidos:', req.body);
            console.log('📝 Archivo recibido:', req.file);

            // Manejar la imagen de perfil si se subió una
            let profile_image = null;
            if (req.file) {
                profile_image = `/uploads/${req.file.filename}`;
                console.log('📝 Imagen de perfil guardada:', profile_image);
            }

            // Construir la consulta de actualización
            let updateQuery, queryParams;
            
            if (profile_image) {
                updateQuery = `
                    UPDATE users 
                    SET 
                        first_name = ?,
                        last_name = ?,
                        phone_number = ?,
                        address = ?,
                        profile_image = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                queryParams = [
                    first_name,
                    last_name,
                    phone_number || null,
                    address || null,
                    profile_image,
                    userId
                ];
            } else {
                updateQuery = `
                    UPDATE users 
                    SET 
                        first_name = ?,
                        last_name = ?,
                        phone_number = ?,
                        address = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                queryParams = [
                    first_name,
                    last_name,
                    phone_number || null,
                    address || null,
                    userId
                ];
            }

            const result = await executeQuery(updateQuery, queryParams);

            if (result.success) {
                console.log('✅ Update query ejecutado exitosamente');
                
                // Obtener el usuario actualizado
                const user = await UserModel.findById(userId);
                console.log('📋 Usuario obtenido después del update:', {
                    id: user?.id,
                    profile_image: user?.profile_image,
                    first_name: user?.first_name,
                    last_name: user?.last_name
                });
                
                res.status(200).json({
                    success: true,
                    message: 'Perfil actualizado exitosamente',
                    data: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone_number: user.phone_number,
                        address: user.address,
                        user_type: user.user_type,
                        is_verified: user.is_verified,
                        is_active: user.is_active,
                        profile_image: user.profile_image,
                        created_at: user.created_at,
                        updated_at: user.updated_at,
                        last_login: user.last_login
                    }
                });
            } else {
                throw new Error('Error al actualizar perfil');
            }

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
     * Cambiar contraseña del usuario
     */
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password } = req.body;

            console.log('🔐 Cambiando contraseña del usuario:', userId);

            // Validar que se enviaron ambas contraseñas
            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren la contraseña actual y la nueva contraseña'
                });
            }

            // Validar longitud de la nueva contraseña
            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            // Obtener el usuario para verificar la contraseña actual
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar la contraseña actual
            const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'La contraseña actual es incorrecta'
                });
            }

            // Hashear la nueva contraseña
            const newPasswordHash = await bcrypt.hash(new_password, 10);

            // Actualizar la contraseña
            const updateQuery = `
                UPDATE users 
                SET password_hash = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const result = await executeQuery(updateQuery, [newPasswordHash, userId]);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Contraseña actualizada exitosamente'
                });
            } else {
                throw new Error('Error al actualizar contraseña');
            }

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = ProfileController;