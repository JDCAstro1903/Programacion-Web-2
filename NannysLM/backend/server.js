const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ===============================================
// DESACTIVAR CONSOLE.LOG EN PRODUCCIÓN
// ===============================================
if (process.env.NODE_ENV === 'production') {
    // Silenciar console.log en producción para evitar saturación de memoria
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    // Mantener console.error y console.warn para errores críticos
}

// Importar logger optimizado
const logger = require('./src/utils/logger');

// Importar configuración de base de datos
const { testConnection } = require('./src/config/database');

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
const clientDataRoutes = require('./src/routes/clientData');
const ratingRoutes = require('./src/routes/ratings');

const app = express();
const PORT = process.env.PORT || 8000;

// ===============================================
// CONFIGURACIÓN DE TRUST PROXY (Railway/Heroku)
// ===============================================
app.set('trust proxy', 1);

// ===============================================
// CONFIGURACIÓN DE DIRECTORIOS
// ===============================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true});
    logger.info('Directorio uploads creado');
}

// ===============================================
// MIDDLEWARES DE SEGURIDAD
// ===============================================
app.use(helmet());
app.use(compression());

// Rate limiting - Configuración más permisiva para desarrollo y uso normal
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // 500 requests por ventana
    message: { error: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    // Omitir el rate limiting para ciertas rutas si es necesario
    skip: (req) => {
        // No aplicar rate limiting a health checks
        return req.path === '/api/health' || req.path === '/api/info';
    }
});
app.use('/api/', limiter);

// ===============================================
// CORS - Configuración mejorada
// ===============================================
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:4200',
            'http://localhost:3000',
            'http://127.0.0.1:4200',
            'http://127.0.0.1:3000',
            'https://programacion-web-2-two.vercel.app',
            process.env.FRONTEND_URL
        ];
        
        // Permitir requests sin origin (como requests desde Postman o aplicaciones móviles)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS: Origen no listado: ${origin}`);
            callback(null, true); // Permitir de todas formas para desarrollo
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Length', 'X-Total-Count'],
    maxAge: 86400, // 24 horas
    optionsSuccessStatus: 200,
    preflightContinue: false
};

// Aplicar CORS globalmente - ANTES de cualquier otra ruta
app.use(cors(corsOptions));

// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

// ===============================================
// PARSEO Y ARCHIVOS
// ===============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Nota: express-fileupload ha sido deshabilitado para evitar conflictos con multer
// const fileUpload = require('express-fileupload');
// app.use(fileUpload({
//     limits: { fileSize: 50 * 1024 * 1024 },
//     useTempFiles: true,
//     tempFileDir: '/tmp/'
// }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Servir archivos estáticos
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
// Health check mejorado
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a DB
        let dbStatus = 'unknown';
        try {
            const dbTest = await testConnection();
            dbStatus = dbTest ? 'connected' : 'disconnected';
        } catch (dbError) {
            dbStatus = 'error: ' + dbError.message;
        }

        res.status(200).json({
            status: 'OK',
            message: 'NannysLM API está funcionando correctamente',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            database: dbStatus,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            },
            uptime: Math.round(process.uptime()) + ' segundos'
        });
    } catch (error) {
        logger.error('Error en health check:', error);
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Info de la API
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
            client: '/api/v1/client',
            services: '/api/v1/services',
            payments: '/api/v1/payments',
            ratings: '/api/v1/ratings',
            nannys: '/api/v1/nannys',
            notifications: '/api/v1/notifications',
            users: '/api/v1/users',
            bankDetails: '/api/v1/bank-details'
        }
    });
});

// Rutas principales
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/bank-details', bankDetailsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/nannys', nannyRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/client', clientDataRoutes);
app.use('/api/v1/client', clientRoutes);

// ===============================================
// MANEJO DE ERRORES
// ===============================================
// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        error: 'Not Found'
    });
});

// Error handler global
app.use((err, req, res, next) => {
    logger.error('Error no manejado', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal Server Error'
    });
});

// ===============================================
// INICIAR SERVIDOR Y SCHEDULERS
// ===============================================
const startServer = async () => {
    try {
        logger.info('Verificando conexión a base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            logger.error('No se pudo conectar a la base de datos');
            logger.error('Verifica que MySQL esté ejecutándose y las credenciales en .env sean correctas');
            process.exit(1);
        }
        
        // Iniciar scheduler de recordatorios de servicios
        try {
            const serviceReminderScheduler = require('./src/utils/ServiceReminderScheduler');
            serviceReminderScheduler.start();
            logger.info('Scheduler de recordatorios iniciado correctamente');
        } catch (schedulerError) {
            logger.error('Error al iniciar scheduler de recordatorios:', schedulerError.message);
            logger.warn('El servidor continuará sin el scheduler de recordatorios');
        }
        
        const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
        
        app.listen(PORT, HOST, () => {
            logger.success('═══════════════════════════════════════════════════');
            logger.success(`✅ SERVIDOR INICIADO CORRECTAMENTE`);
            logger.success(`📍 Host: ${HOST}:${PORT}`);
            logger.success(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            logger.success(`🗄️  Base de datos: ${process.env.DB_NAME}`);
            logger.success(`🔗 Health check: http://${HOST}:${PORT}/api/health`);
            logger.success('═══════════════════════════════════════════════════');
            
            // Hacer un health check inicial
            setTimeout(async () => {
                try {
                    const dbTest = await testConnection();
                    if (dbTest) {
                        logger.success('✅ Conexión a base de datos verificada');
                    } else {
                        logger.warn('⚠️  Advertencia: Problemas con la conexión a base de datos');
                    }
                } catch (e) {
                    logger.error('❌ Error verificando conexión a DB:', e.message);
                }
            }, 2000);
        });
        
    } catch (error) {
        logger.error('Error al iniciar el servidor', error);
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    logger.error('❌ Excepción no capturada:', error);
    logger.error('Stack:', error.stack);
    // No cerrar el servidor en producción
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rechazada no manejada:', reason);
    logger.error('Promise:', promise);
    // No cerrar el servidor en producción
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    logger.info('Señal SIGTERM recibida, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('Señal SIGINT recibida, cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;
