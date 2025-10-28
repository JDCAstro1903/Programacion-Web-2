const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { testConnection } = require('../src/config/database');

const app = express();
const PORT = process.env.TEST_PORT || 1903;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Montar los routers de prueba (ruta base)
app.use('/api/v1/test', require('./index'));

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, base: '/api/v1/test' });
});

(async function start() {
  try {
    // Intentar probar conexión a la base de datos (si falla, seguimos igual)
    if (typeof testConnection === 'function') {
      await testConnection();
      console.log('✅ Conexión a la base de datos OK');
    }
  } catch (err) {
    console.warn('⚠️  No se pudo conectar a la base de datos de prueba:', err.message || err);
    console.warn('El servidor seguirá escuchando; las consultas que usen la DB pueden fallar hasta que la DB esté disponible.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor de endpoints de prueba escuchando en http://localhost:${PORT}`);
    console.log(`🔗 Rutas de prueba base: http://localhost:${PORT}/api/v1/test/`);
  });
})();
