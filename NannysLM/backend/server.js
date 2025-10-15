const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./src/config/database');

// Importar rutas (las crearemos después)
// const authRoutes = require('./src/routes/auth');
// const userRoutes = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
            auth: '/api/auth',
            users: '/api/users',
            services: '/api/services',
            payments: '/api/payments'
        }
    });
});

// Aquí irán las rutas principales cuando las creemos
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

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
        // Probar conexión a la base de datos
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.log('🔧 Verifica la configuración en el archivo .env');
            process.exit(1);
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🚀 ==========================================');
            console.log(`🚀 Servidor NannysLM iniciado exitosamente`);
            console.log(`🚀 Puerto: ${PORT}`);
            console.log(`🚀 Entorno: ${process.env.NODE_ENV}`);
            console.log(`🚀 URL: http://localhost:${PORT}`);
            console.log(`🚀 API Health: http://localhost:${PORT}/api/health`);
            console.log('🚀 ==========================================');
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;