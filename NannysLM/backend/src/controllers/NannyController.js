// Controlador para gestionar nannys
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { sendNannyCredentialsEmail } = require('../utils/email');

/**
 * Crear una nueva nanny (SOLO PARA ADMIN)
 * Crea entrada en users, nannys, y nanny_availability en transacción
 */
const createNanny = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        console.log('📨 Datos recibidos en POST /api/v1/nannys:', req.body);
        
        // Extraer datos del request
        const {
            // Datos de users
            first_name,
            last_name,
            email,
            phone_number,
            address,
            password,
            
            // Datos de nannys
            description,
            experience_years,
            hourly_rate,
            status,
            
            // Datos de nanny_availability
            is_available,
            reason
        } = req.body;
        
        // Validaciones básicas
        if (!first_name || !last_name || !email || !password || !description || experience_years === undefined || experience_years === null || !hourly_rate) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos',
                required: ['first_name', 'last_name', 'email', 'password', 'description', 'experience_years', 'hourly_rate'],
                received: { first_name, last_name, email, password: !!password, description, experience_years, hourly_rate }
            });
        }
        
        console.log(`👩‍💼 Creando nueva nanny: ${first_name} ${last_name}`);
        
        // Iniciar transacción
        await connection.beginTransaction();
        
        // 1️⃣ Verificar que el email no exista
        const [existingUser] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            await connection.rollback();
            console.log(`❌ El email ${email} ya está registrado`);
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado en el sistema'
            });
        }
        
        // 2️⃣ Hashear contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('🔐 Contraseña hasheada');
        
        // 3️⃣ Crear usuario en tabla users
        const [userResult] = await connection.query(
            `INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                phone_number, 
                address, 
                user_type, 
                is_verified, 
                is_active,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                email,
                hashedPassword,
                first_name,
                last_name,
                phone_number || null,
                address || null,
                'nanny',
                true,  // is_verified = true (creada por admin)
                true   // is_active = true (creada por admin)
            ]
        );
        
        const userId = userResult.insertId;
        console.log(`✅ Usuario creado con ID: ${userId}`);
        
        // 4️⃣ Crear nanny en tabla nannys
        const [nannyResult] = await connection.query(
            `INSERT INTO nannys (
                user_id,
                description,
                experience_years,
                hourly_rate,
                rating_average,
                total_ratings,
                services_completed,
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                userId,
                description,
                experience_years,
                hourly_rate,
                0,      // rating_average inicial
                0,      // total_ratings inicial
                0,      // services_completed inicial
                status || 'active',
            ]
        );
        
        const nannyId = nannyResult.insertId;
        console.log(`✅ Nanny creada con ID: ${nannyId}`);
        
        // 5️⃣ Crear entrada en nanny_availability
        const [availabilityResult] = await connection.query(
            `INSERT INTO nanny_availability (
                nanny_id,
                is_available,
                reason,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, NOW(), NOW())`,
            [
                nannyId,
                is_available !== false,  // true por defecto
                (is_available === false && reason) ? reason : null
            ]
        );
        
        console.log(`✅ Disponibilidad creada para nanny ${nannyId}`);
        
        // Confirmar transacción
        await connection.commit();
        console.log(`✅ Transacción completada exitosamente`);
        
        // 6️⃣ Enviar correo con credenciales a la nanny
        const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/login`;
        try {
            const emailResult = await sendNannyCredentialsEmail(
                email,
                `${first_name} ${last_name}`,
                password,  // Enviar contraseña sin hashear (ya que es temporal)
                loginLink
            );
            
            if (emailResult.success) {
                console.log('📧 Correo de credenciales enviado exitosamente a:', email);
            } else {
                console.warn('⚠️ Error al enviar correo de credenciales:', emailResult.message);
                // No hacemos reject aquí, la nanny fue creada correctamente
            }
        } catch (emailError) {
            console.error('❌ Error en el intento de envío de correo:', emailError.message);
            // No bloqueamos la respuesta si falla el correo
        }
        
        return res.status(201).json({
            success: true,
            message: `Nanny ${first_name} ${last_name} creada exitosamente. Se envió un correo con sus credenciales.`,
            data: {
                user_id: userId,
                nanny_id: nannyId,
                first_name,
                last_name,
                email,
                status,
                is_verified: true,
                is_active: true,
                created_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        // Hacer rollback en caso de error
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('❌ Error en rollback:', rollbackError);
        }
        
        console.error('❌ Error creando nanny:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear nanny',
            error: error.message
        });
    } finally {
        // Liberar conexión
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Obtener todas las nannys (para admin)
 */
const getAllNannys = async (req, res) => {
    try {
        console.log('📋 Obteniendo todas las nannys');
        
        const [nannys] = await pool.query(
            `SELECT 
                n.id,
                n.user_id,
                n.description,
                n.experience_years,
                n.hourly_rate,
                n.rating_average,
                n.total_ratings,
                n.services_completed,
                n.status,
                n.created_at,
                n.updated_at,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.address,
                u.is_verified,
                u.is_active,
                u.profile_image,
                ua.is_available,
                ua.reason
            FROM nannys n
            JOIN users u ON n.user_id = u.id
            LEFT JOIN nanny_availability ua ON n.id = ua.nanny_id
            ORDER BY n.created_at DESC`
        );
        
        console.log(`✅ Se obtuvieron ${nannys.length} nannys`);
        
        return res.status(200).json({
            success: true,
            message: 'Nannys obtenidas correctamente',
            data: nannys,
            count: nannys.length
        });
        
    } catch (error) {
        console.error('❌ Error al obtener nannys:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtener una nanny específica
 */
const getNannyById = async (req, res) => {
    try {
        const { nannyId } = req.params;
        
        console.log(`📋 Obteniendo nanny ${nannyId}`);
        
        const [nannys] = await pool.query(
            `SELECT 
                n.id,
                n.user_id,
                n.description,
                n.experience_years,
                n.hourly_rate,
                n.rating_average,
                n.total_ratings,
                n.services_completed,
                n.status,
                n.created_at,
                n.updated_at,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.address,
                u.is_verified,
                u.is_active,
                u.profile_image,
                ua.is_available,
                ua.reason
            FROM nannys n
            JOIN users u ON n.user_id = u.id
            LEFT JOIN nanny_availability ua ON n.id = ua.nanny_id
            WHERE n.id = ?`,
            [nannyId]
        );
        
        if (nannys.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nanny no encontrada'
            });
        }
        
        console.log(`✅ Nanny ${nannyId} obtenida`);
        
        return res.status(200).json({
            success: true,
            message: 'Nanny obtenida correctamente',
            data: nannys[0]
        });
        
    } catch (error) {
        console.error('❌ Error al obtener nanny:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtener una nanny por su user_id
 */
const getNannyByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`🔍 Buscando nanny con user_id: ${userId}`);
        
        const [nannys] = await pool.query(
            `SELECT 
                n.id,
                n.user_id,
                n.description,
                n.experience_years,
                n.hourly_rate,
                n.rating_average,
                n.total_ratings,
                n.services_completed,
                n.status,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.address,
                u.profile_image,
                u.is_verified,
                ua.is_available,
                ua.reason as unavailability_reason
            FROM nannys n
            JOIN users u ON n.user_id = u.id
            LEFT JOIN nanny_availability ua ON n.id = ua.nanny_id
            WHERE n.user_id = ?`,
            [userId]
        );
        
        if (nannys.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nanny no encontrada para este usuario'
            });
        }
        
        console.log(`✅ Nanny encontrada para user_id ${userId}:`, nannys[0].id);
        
        return res.status(200).json({
            success: true,
            message: 'Nanny obtenida correctamente',
            data: nannys[0]
        });
        
    } catch (error) {
        console.error('❌ Error al obtener nanny por user_id:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Actualizar estado de una nanny (PATCH /api/v1/nannys/:id/status)
 * Estados: active, inactive, suspended
 */
const updateNannyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de nanny requerido'
            });
        }

        if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser: active, inactive o suspended'
            });
        }

        console.log(`🔄 Actualizando status de nanny ${id} a: ${status}`);

        // Actualizar en la BD
        const updateQuery = `
            UPDATE nannys
            SET status = ?
            WHERE id = ?
        `;

        const connection = await pool.getConnection();
        const [result] = await connection.execute(updateQuery, [status, id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nanny no encontrada'
            });
        }

        console.log(`✅ Status actualizado a: ${status}`);

        return res.json({
            success: true,
            message: `Estado actualizado a: ${status}`,
            data: { id, status }
        });

    } catch (error) {
        console.error('❌ Error al actualizar status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    createNanny,
    getAllNannys,
    getNannyById,
    getNannyByUserId,
    updateNannyStatus
};
