-- Script SQL simplificado para crear tablas esenciales
-- Tablas mínimas para hacer funcionar el sistema de login

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    tipo_usuario ENUM('admin', 'cliente', 'nanny') NOT NULL,
    es_verificado BOOLEAN DEFAULT FALSE,
    es_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de datos bancarios (simplificada)
CREATE TABLE IF NOT EXISTS datos_bancarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nanny_id INT NOT NULL,
    nombre_titular VARCHAR(150) NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    clabe VARCHAR(18),
    tipo_cuenta ENUM('ahorro', 'corriente') DEFAULT 'ahorro',
    es_activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nanny_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar usuarios de prueba
INSERT IGNORE INTO usuarios (email, password, nombre, apellido, tipo_usuario, es_verificado) VALUES
('admin@nannys-lm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'Admin', 'Sistema', 'admin', TRUE),
('juan.perez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'Juan', 'Pérez', 'cliente', TRUE),
('maria.garcia@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'María', 'García', 'nanny', TRUE),
('ana.lopez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'Ana', 'López', 'nanny', TRUE);

-- Insertar datos bancarios de prueba
INSERT IGNORE INTO datos_bancarios (nanny_id, nombre_titular, numero_cuenta, banco, clabe, tipo_cuenta) VALUES
(3, 'María García', '1234567890123456', 'BBVA Bancomer', '012180001234567890', 'ahorro'),
(4, 'Ana López', '9876543210987654', 'Santander', '014180009876543210', 'corriente');

-- Verificar que se crearon los datos
SELECT 'Usuarios creados:' as Info;
SELECT id, email, nombre, apellido, tipo_usuario FROM usuarios;

SELECT 'Datos bancarios creados:' as Info;
SELECT db.id, u.nombre, u.apellido, db.banco, db.numero_cuenta 
FROM datos_bancarios db 
JOIN usuarios u ON db.nanny_id = u.id;