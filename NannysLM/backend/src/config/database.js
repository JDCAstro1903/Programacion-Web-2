const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Configuración de la conexión a la base de datos MySQL
 * Utiliza variables de entorno para mantener la seguridad
 */
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nannys_lm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Configuraciones válidas para MySQL2
    charset: 'utf8mb4',
    acquireTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

/**
 * Función para probar la conexión a la base de datos
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a la base de datos MySQL');
        console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
        console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error.message);
        return false;
    }
};

/**
 * Función helper para ejecutar queries con manejo de errores
 */
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results };
    } catch (error) {
        console.error('Error en query:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Función helper para ejecutar transacciones
 */
const executeTransaction = async (queries) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params || []);
            results.push(result);
        }
        
        await connection.commit();
        return { success: true, data: results };
    } catch (error) {
        await connection.rollback();
        console.error('Error en transacción:', error.message);
        return { success: false, error: error.message };
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction
};