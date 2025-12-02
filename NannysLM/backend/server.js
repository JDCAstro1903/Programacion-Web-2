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
const aiRoutes = require('./src/routes/ai');

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

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde' },
    standardHeaders: true,
    legacyHeaders: false
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
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'NannysLM API está funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
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
app.use('/api/v1/ai', aiRoutes);

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
        const serviceReminderScheduler = require('./src/utils/ServiceReminderScheduler');
        serviceReminderScheduler.start();
        
        const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
        
        app.listen(PORT, HOST, () => {
            logger.info(`Servidor iniciado en ${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(` 🩺 Health: http://${HOST}:${PORT}/api/health`);
            }
        });
        
    } catch (error) {
        logger.error('Error al iniciar el servidor', error);
        process.exit(1);
    }
};

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
