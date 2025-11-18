const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection, executeQuery } = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const profileRoutes = require('./src/routes/profile');
const clientRoutes = require('./src/routes/client');
const serviceRoutes = require('./src/routes/service');
const paymentRoutes = require('./src/routes/payment');
const bankDetailsRoutes = require('./src/routes/bankDetails');
const notificationRoutes = require('./src/routes/notifications');
const nannyRoutes = require('./src/routes/nannys');
const userRoutes = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 8000;

// ===============================================
// CONFIGURACIÓN DE MULTER PARA SUBIDA DE ARCHIVOS
// ===============================================
// Crear directorio uploads si no existe (dentro de backend)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Directorio uploads creado en:', uploadsDir);
} else {
    console.log('📁 Directorio uploads existe en:', uploadsDir);
}

// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único: timestamp + userId + original extension
        const userId = req.body.user_id || 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const fieldPrefix = file.fieldname === 'profile_image' ? 'profile' : 'identification';
        const filename = `${fieldPrefix}_${userId}_${timestamp}${extension}`;
        cb(null, filename);
    }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB límite por archivo
        fieldSize: 10 * 1024 * 1024, // 10MB límite por campo (para JSON con base64)
        fieldNameSize: 1000, // Límite del nombre del campo
        fields: 10, // Máximo 10 campos de texto
        files: 5 // Máximo 5 archivos
    }
});

// ===============================================
// MIDDLEWARES DE SEGURIDAD
// ===============================================
app.use(helmet()); // Añade headers de seguridad
app.use(compression()); // Compresión gzip

// Rate limiting - limitar requests por IP
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de requests por ventana
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// ===============================================
// MIDDLEWARES DE CONFIGURACIÓN
// ===============================================
// CORS - permitir requests desde el frontend
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:4200',
            'http://localhost:3000',
            'http://127.0.0.1:4200',
            process.env.FRONTEND_URL
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Length'],
    maxAge: 86400, // 24 horas
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parsing de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar express-fileupload para manejar subidas de archivos
const fileUpload = require('express-fileupload');
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB máximo
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Logging de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Servir archivos estáticos (uploads) con headers CORS correctos
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:4200');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// ===============================================
// RUTAS DE LA API
// ===============================================
// Ruta de health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'NannysLM API está funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Ruta de información de la API
app.get('/api/info', (req, res) => {
    res.status(200).json({
        name: 'NannysLM API',
        version: '1.0.0',
        description: 'API REST para la plataforma de gestión de niñeras',
        endpoints: {
            health: '/api/health',
            info: '/api/info',
            auth: '/api/v1/auth',
            dashboard: '/api/v1/dashboard',
            profile: '/api/v1/profile',
            client: '/api/v1/client'
        }
    });
});

// Rutas principales de la API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/bank-details', bankDetailsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/nannys', nannyRoutes);
app.use('/api/v1/users', userRoutes);

// Importar y usar rutas para datos específicos del cliente
const clientDataRoutes = require('./src/routes/clientData');
app.use('/api/v1/client', clientDataRoutes);

// Cargar rutas del cliente (después de clientData para que tenga prioridad)
app.use('/api/v1/client', clientRoutes);

// ===============================================
// RUTAS BÁSICAS TEMPORALES
// ===============================================

// Rutas de autenticación
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name, user_type, phone_number, address } = req.body;
        
        // Validar campos requeridos
        if (!email || !password || !first_name || !last_name || !user_type) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }
        
        console.log(`📝 Registrando nuevo usuario: ${email} (${user_type})`);
        
        // Verificar si el usuario ya existe
        const checkQuery = 'SELECT id FROM users WHERE email = ?';
        const existingUser = await executeQuery(checkQuery, [email]);
        
        if (existingUser.success && existingUser.data.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        
        // Insertar nuevo usuario (password en texto plano por ahora)
        const insertQuery = `
            INSERT INTO users (email, password_hash, first_name, last_name, phone_number, address, user_type, is_verified, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, false, true)
        `;
        
        const result = await executeQuery(insertQuery, [
            email,
            password, // Por ahora texto plano, en producción usar bcrypt
            first_name,
            last_name,
            phone_number || null,
            address || null,
            user_type
        ]);
        
        if (!result.success) {
            throw new Error('Error al insertar usuario en la base de datos');
        }
        
        const userId = result.insertId;
        
        // Si es cliente, crear registro en tabla clients
        if (user_type === 'client') {
            const clientQuery = `
                INSERT INTO clients (user_id, verification_status, emergency_contact_name, emergency_contact_phone, number_of_children, special_requirements)
                VALUES (?, 'pending', '', '', 0, '')
            `;
            await executeQuery(clientQuery, [userId]);
        }
        
        // Si es niñera, crear registro en tabla nannys
        if (user_type === 'nanny') {
            const nannyQuery = `
                INSERT INTO nannys (user_id, description, experience_years, hourly_rate, status)
                VALUES (?, '', 0, 0.00, 'active')
            `;
            await executeQuery(nannyQuery, [userId]);
        }
        
        console.log(`✅ Usuario registrado exitosamente: ${first_name} ${last_name} (ID: ${userId})`);
        
        res.json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userId,
                    first_name,
                    last_name,
                    email,
                    user_type
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar disponibilidad de email
app.get('/api/v1/auth/check-email', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }
        
        console.log(`🔍 Verificando disponibilidad de email: ${email}`);
        
        // Buscar si el email ya existe
        const query = 'SELECT id FROM users WHERE email = ?';
        const result = await executeQuery(query, [email]);
        
        const isAvailable = !result.success || result.data.length === 0;
        
        console.log(`📧 Email ${email} disponible: ${isAvailable}`);
        
        res.json({
            success: true,
            data: {
                available: isAvailable
            }
        });
        
    } catch (error) {
        console.error('❌ Error verificando email:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validar que se proporcionen email y password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        
        console.log(`🔐 Intento de login para: ${email} con password: ${password}`);
        
        // Primero, ver todos los usuarios en la tabla
        const allUsersQuery = 'SELECT id, email, password_hash, first_name, user_type, is_active FROM users LIMIT 5';
        const allUsersResult = await executeQuery(allUsersQuery, []);
        console.log('📋 Usuarios en la base de datos:', allUsersResult.data);
        
        // Buscar usuario en la base de datos SIN filtro is_active para debuggear
        const query = `
            SELECT id, email, password_hash, first_name, last_name, user_type, is_verified, is_active
            FROM users 
            WHERE email = ?
        `;
        
        const result = await executeQuery(query, [email]);
        console.log('🔍 Resultado de búsqueda:', {
            success: result.success,
            dataLength: result.data?.length || 0,
            data: result.data
        });
        
        if (!result.success || result.data.length === 0) {
            console.log(`❌ Usuario no encontrado: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Verificar si el usuario está activo
        const user = result.data[0];
        if (!user.is_active) {
            console.log(`❌ Usuario inactivo: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }
        
        // Debug: mostrar información del usuario encontrado
        console.log(`🔍 Usuario encontrado:`, {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            password_hash: user.password_hash ? '***[EXISTE]***' : '***[NO EXISTE]***'
        });
        console.log(`🔐 Comparando passwords:`, {
            provided: password,
            stored: user.password_hash,
            match: user.password_hash === password
        });
        
        // Verificar contraseña (por ahora comparación simple, en producción usar bcrypt)
        if (user.password_hash !== password) {
            console.log(`❌ Contraseña incorrecta para: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Actualizar last_login
        const updateLoginQuery = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        await executeQuery(updateLoginQuery, [user.id]);
        
        console.log(`✅ Login exitoso para: ${user.first_name} ${user.last_name} (${user.user_type})`);
        
        // Devolver datos del usuario autenticado
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    user_type: user.user_type,
                    is_verified: user.is_verified
                },
                token: `jwt-token-${user.id}-${Date.now()}` // En producción usar JWT real
            }
        });
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Rutas de cliente
app.get('/api/v1/client/info', async (req, res) => {
    try {
        // En producción esto vendría del JWT token
        const userId = req.query.userId || 2; // Por defecto Daniel Castro Aguilar
        
        console.log(`🔍 Obteniendo información del cliente para usuario ID: ${userId}`);
        
        const query = `
            SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone_number, u.address, 
                u.is_verified, u.profile_image, u.created_at,
                c.id as client_id, c.verification_status, c.emergency_contact_name, 
                c.emergency_contact_phone, c.number_of_children, c.special_requirements
            FROM users u
            LEFT JOIN clients c ON u.id = c.user_id
            WHERE u.id = ? AND u.user_type = 'client' AND u.is_active = true
        `;
        
        const result = await executeQuery(query, [userId]);
        
        if (!result.success || result.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        const clientData = result.data[0];
        
        res.json({
            success: true,
            data: {
                id: clientData.client_id,
                user_id: clientData.id,
                first_name: clientData.first_name,
                last_name: clientData.last_name,
                email: clientData.email,
                phone_number: clientData.phone_number || '',
                address: clientData.address || '',
                is_verified: clientData.is_verified,
                profile_image: clientData.profile_image,
                emergency_contact_name: clientData.emergency_contact_name || '',
                emergency_contact_phone: clientData.emergency_contact_phone || '',
                number_of_children: clientData.number_of_children || 0,
                verification_status: clientData.verification_status || 'pending',
                created_at: clientData.created_at,
                client_since: clientData.created_at
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener información del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

app.get('/api/v1/client/services', (req, res) => {
    res.json({
        success: true,
        data: [],
        meta: {
            total: 0,
            status_filter: 'all',
            limit: 50
        }
    });
});

app.get('/api/v1/client/payments', (req, res) => {
    res.json({
        success: true,
        data: [],
        meta: {
            total: 0,
            status_filter: 'all',
            limit: 50
        }
    });
});

app.get('/api/v1/client/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            services: {
                total: 0,
                completed: 0,
                pending: 0
            },
            financial: {
                total_spent: 0,
                currency: 'MXN'
            },
            nannys: {
                unique_nannys_hired: 0
            }
        }
    });
});

// Endpoint para notificaciones
app.get('/api/notifications', async (req, res) => {
    try {
        const userId = req.query.userId;
        const limit = parseInt(req.query.limit) || 50;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId es requerido'
            });
        }

        console.log('📝 Obteniendo notificaciones para userId:', userId, 'limit:', limit);

        // Asegurar que ambos parámetros sean números enteros
        const userIdNum = parseInt(userId);
        const limitNum = Number.isInteger(limit) ? limit : 50;
        
        console.log('📝 Params procesados - userId:', userIdNum, 'limit:', limitNum);

        const query = `
            SELECT 
                id,
                user_id,
                title,
                message,
                type,
                is_read,
                action_url,
                related_id,
                related_type,
                created_at,
                read_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ${limitNum}
        `;

        const result = await executeQuery(query, [userIdNum]);

        if (result.success) {
            res.json({
                success: true,
                data: result.data || [],
                meta: {
                    total: result.data?.length || 0,
                    unread: result.data?.filter(n => !n.is_read).length || 0
                }
            });
        } else {
            throw new Error('Error al obtener notificaciones');
        }

    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Endpoint para marcar notificación como leída
app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;

        const query = `
            UPDATE notifications 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const result = await executeQuery(query, [parseInt(notificationId)]);

        if (result.success) {
            res.json({
                success: true,
                message: 'Notificación marcada como leída'
            });
        } else {
            throw new Error('Error al actualizar notificación');
        }

    } catch (error) {
        console.error('Error al actualizar notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Rutas de perfil - obtener estado del perfil desde base de datos
app.get('/api/v1/profile/status', async (req, res) => {
    try {
        const userId = req.query.userId || 1; // En producción vendría del JWT
        
        const query = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.user_type,
                   u.phone_number, u.address, u.is_verified, u.is_active,
                   c.verification_status,
                   CASE 
                       WHEN u.first_name IS NOT NULL AND u.first_name != '' AND
                            u.last_name IS NOT NULL AND u.last_name != '' AND
                            u.phone_number IS NOT NULL AND u.phone_number != '' AND
                            u.address IS NOT NULL AND u.address != ''
                       THEN true 
                       ELSE false 
                   END as profile_completed
            FROM users u
            LEFT JOIN clients c ON u.id = c.user_id
            WHERE u.id = ? AND u.user_type = 'client'
        `;
        
        const result = await executeQuery(query, [userId]);
        
        if (!result.success || result.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const userData = result.data[0];
        
        res.json({
            success: true,
            data: {
                user_type: userData.user_type,
                profile_completed: userData.profile_completed,
                is_verified: userData.is_verified,
                verification_status: userData.verification_status || 'pending',
                user_data: {
                    id: userData.id,
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone_number: userData.phone_number,
                    address: userData.address
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener estado del perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para obtener datos completos del perfil
app.get('/api/v1/profile/data', async (req, res) => {
    try {
        const userId = req.query.userId || 1; // En producción vendría del JWT
        console.log('🔍 Obteniendo datos completos del perfil para usuario:', userId);
        
        // Query para obtener datos del usuario
        const userQuery = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.user_type,
                   u.phone_number, u.address, u.is_verified, u.is_active,
                   u.profile_image, u.created_at, u.updated_at
            FROM users u
            WHERE u.id = ?
        `;
        
        const userResult = await executeQuery(userQuery, [userId]);
        
        if (!userResult.success || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const userData = userResult.data[0];
        console.log('👤 Datos del usuario encontrados:', userData);
        
        // Query para obtener datos específicos del cliente
        const clientQuery = `
            SELECT c.id, c.user_id, c.verification_status, c.verification_date,
                   c.emergency_contact_name, c.emergency_contact_phone,
                   c.number_of_children, c.special_requirements,
                   c.created_at, c.updated_at
            FROM clients c
            WHERE c.user_id = ?
        `;
        
        const clientResult = await executeQuery(clientQuery, [userId]);
        
        let clientData = null;
        if (clientResult.success && clientResult.data.length > 0) {
            clientData = clientResult.data[0];
            console.log('👨‍👩‍👧‍👦 Datos del cliente encontrados:', clientData);
        } else {
            console.log('ℹ️ No se encontraron datos específicos del cliente');
        }
        
        res.json({
            success: true,
            data: {
                user_data: {
                    id: userData.id,
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone_number: userData.phone_number,
                    address: userData.address,
                    user_type: userData.user_type,
                    is_verified: userData.is_verified,
                    is_active: userData.is_active,
                    profile_image: userData.profile_image,
                    created_at: userData.created_at,
                    updated_at: userData.updated_at
                },
                client_data: clientData || {
                    id: null,
                    user_id: userId,
                    verification_status: 'pending',
                    verification_date: null,
                    emergency_contact_name: '',
                    emergency_contact_phone: '',
                    number_of_children: 0,
                    special_requirements: '',
                    created_at: null,
                    updated_at: null
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener datos del perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener datos completos del perfil desde la base de datos
app.get('/api/v1/profile/data', async (req, res) => {
    try {
        // En producción, el userId vendría del JWT token
        const userId = req.query.userId || 1;
        
        console.log(`🔍 Obteniendo datos del perfil para usuario ID: ${userId}`);
        
        // Consultar datos del usuario desde la tabla users
        const userQuery = `
            SELECT id, email, first_name, last_name, phone_number, address, 
                   user_type, is_verified, is_active, profile_image, 
                   created_at, updated_at, last_login
            FROM users 
            WHERE id = ? AND user_type = 'client'
        `;
        
        const userResult = await executeQuery(userQuery, [userId]);
        
        if (!userResult.success || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado o no es un cliente'
            });
        }
        
        const userData = userResult.data[0];
        
        // Consultar datos específicos del cliente desde la tabla clients
        const clientQuery = `
            SELECT id, user_id, verification_status, verification_date,
                   identification_document, emergency_contact_name, emergency_contact_phone,
                   number_of_children, special_requirements,
                   created_at, updated_at
            FROM clients 
            WHERE user_id = ?
        `;
        
        const clientResult = await executeQuery(clientQuery, [userId]);
        
        // Si no existe registro en clients, crear uno vacío
        let clientData = null;
        if (clientResult.success && clientResult.data.length > 0) {
            clientData = clientResult.data[0];
        } else {
            // Crear registro vacío en clients si no existe
            const createClientQuery = `
                INSERT INTO clients (user_id, verification_status, identification_document, 
                                   emergency_contact_name, emergency_contact_phone, 
                                   number_of_children, special_requirements)
                VALUES (?, 'pending', '', '', '', 0, '')
            `;
            
            const createResult = await executeQuery(createClientQuery, [userId]);
            
            if (createResult.success) {
                // Obtener el registro recién creado
                const newClientResult = await executeQuery(clientQuery, [userId]);
                if (newClientResult.success && newClientResult.data.length > 0) {
                    clientData = newClientResult.data[0];
                } else {
                    clientData = {
                        id: null,
                        user_id: userId,
                        verification_status: 'pending',
                        verification_date: null,
                        identification_document: '',
                        emergency_contact_name: '',
                        emergency_contact_phone: '',
                        number_of_children: 0,
                        special_requirements: '',
                        created_at: new Date(),
                        updated_at: new Date()
                    };
                }
            }
        }
        
        console.log(`✅ Datos obtenidos exitosamente para ${userData.first_name} ${userData.last_name}`);
        
        res.json({
            success: true,
            data: {
                user_data: userData,
                client_data: clientData
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener datos del perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Actualizar datos del perfil en la base de datos con archivos
app.put('/api/v1/profile/update', (req, res) => {
    const uploadMiddleware = upload.fields([
        { name: 'profile_image', maxCount: 1 },
        { name: 'identification_document', maxCount: 1 }
    ]);
    
    uploadMiddleware(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('❌ Error de Multer:', err.message);
            return res.status(400).json({
                success: false,
                message: `Error al procesar archivo: ${err.message}`,
                error: err.code
            });
        } else if (err) {
            console.error('❌ Error desconocido:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
        
        // Si no hay errores, procesar la solicitud
        await handleProfileUpdate(req, res);
    });
});

// Función para manejar la actualización del perfil
async function handleProfileUpdate(req, res) {
    try {
        const { user_data, client_data, user_id } = req.body;
        const userId = user_id || JSON.parse(user_data).id;
        
        console.log(`🔄 Actualizando perfil para usuario ID: ${userId}`);
        console.log('📄 Archivos recibidos:', req.files);
        
        // Parsear datos JSON
        const userData = JSON.parse(user_data);
        const clientDataParsed = JSON.parse(client_data);
        
        // Procesar archivos subidos
        let profileImagePath = userData.profile_image || '';
        let identificationPath = clientDataParsed.identification_document || '';
        
        if (req.files) {
            if (req.files['profile_image']) {
                profileImagePath = `/uploads/${req.files['profile_image'][0].filename}`;
                console.log('📸 Imagen de perfil guardada:', profileImagePath);
            }
            
            if (req.files['identification_document']) {
                identificationPath = `/uploads/${req.files['identification_document'][0].filename}`;
                console.log('🆔 Documento de identificación guardado:', identificationPath);
            }
        }
        
        // Actualizar datos en la tabla users
        const updateUserQuery = `
            UPDATE users 
            SET first_name = ?, last_name = ?, phone_number = ?, address = ?, 
                profile_image = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const userParams = [
            userData.first_name,
            userData.last_name,
            userData.phone_number,
            userData.address,
            profileImagePath,
            userId
        ];
        
        const userUpdateResult = await executeQuery(updateUserQuery, userParams);
        
        if (!userUpdateResult.success) {
            throw new Error('Error al actualizar datos del usuario');
        }
        
        // Actualizar datos en la tabla clients
        const updateClientQuery = `
            UPDATE clients 
            SET identification_document = ?, emergency_contact_name = ?, emergency_contact_phone = ?, 
                number_of_children = ?, special_requirements = ?, updated_at = NOW()
            WHERE user_id = ?
        `;
        
        const clientParams = [
            identificationPath,
            clientDataParsed.emergency_contact_name,
            clientDataParsed.emergency_contact_phone,
            clientDataParsed.number_of_children,
            clientDataParsed.special_requirements,
            userId
        ];
        
        const clientUpdateResult = await executeQuery(updateClientQuery, clientParams);
        
        if (!clientUpdateResult.success) {
            throw new Error('Error al actualizar datos del cliente');
        }
        
        // Obtener los datos actualizados para devolverlos
        const getUserQuery = `
            SELECT id, email, first_name, last_name, phone_number, address, 
                   user_type, is_verified, is_active, profile_image, 
                   created_at, updated_at
            FROM users WHERE id = ?
        `;
        
        const getClientQuery = `
            SELECT id, user_id, verification_status, verification_date,
                   identification_document, emergency_contact_name, emergency_contact_phone,
                   number_of_children, special_requirements,
                   created_at, updated_at
            FROM clients WHERE user_id = ?
        `;
        
        const updatedUserResult = await executeQuery(getUserQuery, [userId]);
        const updatedClientResult = await executeQuery(getClientQuery, [userId]);
        
        console.log(`✅ Perfil actualizado exitosamente para usuario ID: ${userId}`);
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                user_data: updatedUserResult.data[0],
                client_data: updatedClientResult.data[0]
            }
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el perfil',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Rutas de dashboard (básicas)
app.get('/api/v1/dashboard/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            users: { total: 10, active: 8 },
            nannys: { total: 5, active: 4 },
            clients: { total: 5, verified: 3 },
            services: { total: 15, completed: 10 }
        }
    });
});

// ===============================================
// MANEJO DE ERRORES
// ===============================================
// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
        error: 'Not Found'
    });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal Server Error'
    });
});

// ===============================================
// INICIAR SERVIDOR
// ===============================================
const startServer = async () => {
    try {
        // Verificar conexión a la base de datos
        console.log('🔍 Verificando conexión a la base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Revisa la configuración.');
            console.log('💡 Asegúrate de que:');
            console.log('   - MySQL esté ejecutándose');
            console.log('   - Las credenciales en .env sean correctas');
            console.log('   - La base de datos "nannyslm_db" exista');
            process.exit(1);
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(' ==========================================');
            console.log(` ✅ Servidor NannysLM iniciado exitosamente`);
            console.log(` 🌐 Puerto: ${PORT}`);
            console.log(` 🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(` 🔗 URL: http://localhost:${PORT}`);
            console.log(` 🩺 API Health: http://localhost:${PORT}/api/health`);
            console.log(` 💾 Base de datos: Conectada ✅`);
            console.log(' ==========================================');
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log(' Recibida señal SIGTERM, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log(' Recibida señal SIGINT, cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;