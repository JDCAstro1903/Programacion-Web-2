/**
 * Sistema de logging optimizado para producción
 * Previene saturación de memoria por exceso de console.log
 */

const LOG_LEVELS = {
    ERROR: 0,   // Siempre se muestra
    WARN: 1,    // Advertencias importantes
    INFO: 2,    // Información general
    DEBUG: 3    // Solo en desarrollo
};

// Configurar nivel según entorno
// En producción: SOLO errores críticos (0)
// En desarrollo: Todo (3)
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' 
    ? LOG_LEVELS.ERROR  // ⚠️ CAMBIO: En producción SOLO errores
    : LOG_LEVELS.DEBUG; // En desarrollo todo

// Contador para evitar spam de logs repetidos
const logCache = new Map();
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Verifica si un log debe mostrarse (evita repetición excesiva)
 */
const shouldLog = (key) => {
    const now = Date.now();
    const lastLog = logCache.get(key);
    
    if (!lastLog || now - lastLog > CACHE_DURATION) {
        logCache.set(key, now);
        return true;
    }
    
    return false;
};

/**
 * Limpia cache periódicamente para evitar memory leak
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of logCache.entries()) {
        if (now - timestamp > CACHE_DURATION) {
            logCache.delete(key);
        }
    }
}, CACHE_DURATION);

/**
 * Logger principal
 */
const logger = {
    /**
     * Errores críticos - SIEMPRE se muestran
     */
    error: (message, error = null) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ❌ ERROR:`, message);
        if (error && process.env.NODE_ENV !== 'production') {
            console.error('Stack:', error.stack || error);
        }
    },

    /**
     * Advertencias importantes
     */
    warn: (message, data = null) => {
        if (CURRENT_LEVEL < LOG_LEVELS.WARN) return;
        
        const key = `warn:${message}`;
        if (!shouldLog(key)) return;
        
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] ⚠️ WARN:`, message);
        if (data && process.env.NODE_ENV !== 'production') {
            console.warn('Data:', data);
        }
    },

    /**
     * Información general - Solo en desarrollo o si está habilitado
     */
    info: (message, data = null) => {
        if (CURRENT_LEVEL < LOG_LEVELS.INFO) return;
        
        const key = `info:${message}`;
        if (!shouldLog(key)) return;
        
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ℹ️ INFO:`, message);
        if (data && process.env.NODE_ENV !== 'production') {
            console.log('Data:', data);
        }
    },

    /**
     * Debug detallado - Solo en desarrollo
     */
    debug: (message, data = null) => {
        if (CURRENT_LEVEL < LOG_LEVELS.DEBUG) return;
        
        console.log(`[DEBUG] 🔍`, message);
        if (data) {
            console.log(data);
        }
    },

    /**
     * Log de operación exitosa - Limitado en producción
     */
    success: (message) => {
        if (process.env.NODE_ENV === 'production') {
            const key = `success:${message}`;
            if (!shouldLog(key)) return;
        }
        
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ✅`, message);
    },

    /**
     * Log de email enviado - Silencioso en producción
     */
    email: (to, subject) => {
        if (process.env.NODE_ENV === 'production') return;
        console.log(`📧 Email: ${subject} -> ${to}`);
    },

    /**
     * Log de operación de base de datos - Silencioso en producción
     */
    db: (operation, details = null) => {
        if (process.env.NODE_ENV === 'production') return;
        console.log(`💾 DB: ${operation}`, details || '');
    }
};

module.exports = logger;
