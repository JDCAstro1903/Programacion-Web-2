-- =====================================================
-- Base de Datos NannysLM - Plataforma de Cuidadoras
-- =====================================================

CREATE DATABASE IF NOT EXISTS nannys_lm;
USE nannys_lm;

-- Configuración de zona horaria
SET time_zone = '-06:00'; -- Ajustar según tu ubicación

-- =====================================================
-- TABLA DE USUARIOS
-- =====================================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('admin', 'cliente', 'nanny') NOT NULL,
    foto_perfil VARCHAR(500) DEFAULT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    esta_activo BOOLEAN DEFAULT TRUE,
    esta_verificado BOOLEAN DEFAULT FALSE,
    documento_identificacion VARCHAR(500) DEFAULT NULL,
    
    INDEX idx_email (email),
    INDEX idx_tipo_usuario (tipo_usuario),
    INDEX idx_activo (esta_activo)
);

-- =====================================================
-- TABLA DE PERFILES DE NANNYS
-- =====================================================
CREATE TABLE perfiles_nanny (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    experiencia_anos INT DEFAULT 0,
    tarifa_hora DECIMAL(8,2) NOT NULL,
    disponibilidad JSON DEFAULT NULL, -- Días y horarios disponibles
    especialidades TEXT, -- Cuidado nocturno, bebés, etc.
    certificaciones TEXT, -- Primeros auxilios, etc.
    descripcion_personal TEXT,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_servicios_completados INT DEFAULT 0,
    total_calificaciones INT DEFAULT 0,
    estado_disponibilidad ENUM('disponible', 'ocupada', 'inactiva') DEFAULT 'disponible',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_calificacion (calificacion_promedio),
    INDEX idx_disponibilidad (estado_disponibilidad)
);

-- =====================================================
-- TABLA DE TIPOS DE SERVICIOS
-- =====================================================
CREATE TABLE tipos_servicios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- 'home-care', 'night-care', etc.
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    permite_multiples_dias BOOLEAN DEFAULT FALSE,
    tarifa_base DECIMAL(8,2) DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE SERVICIOS
-- =====================================================
CREATE TABLE servicios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    nanny_id INT DEFAULT NULL,
    tipo_servicio_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE DEFAULT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    ubicacion TEXT NOT NULL,
    instrucciones_especiales TEXT,
    estado ENUM('pendiente', 'confirmado', 'en_progreso', 'completado', 'cancelado') DEFAULT 'pendiente',
    tarifa_acordada DECIMAL(8,2) NOT NULL,
    total_horas DECIMAL(4,2) DEFAULT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    motivo_cancelacion TEXT DEFAULT NULL,
    cancelado_por INT DEFAULT NULL, -- usuario_id que canceló
    
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (tipo_servicio_id) REFERENCES tipos_servicios(id),
    FOREIGN KEY (cancelado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_nanny_id (nanny_id),
    INDEX idx_fecha_inicio (fecha_inicio),
    INDEX idx_estado (estado),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- =====================================================
-- TABLA DE PAGOS
-- =====================================================
CREATE TABLE pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    servicio_id INT NOT NULL,
    cliente_id INT NOT NULL,
    nanny_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'pagado', 'sin_verificar', 'reembolsado') DEFAULT 'pendiente',
    metodo_pago ENUM('efectivo', 'transferencia', 'tarjeta', 'paypal') DEFAULT 'transferencia',
    comprobante_pago VARCHAR(500) DEFAULT NULL,
    referencia_transaccion VARCHAR(100) DEFAULT NULL,
    fecha_pago TIMESTAMP DEFAULT NULL,
    fecha_verificacion TIMESTAMP DEFAULT NULL,
    verificado_por INT DEFAULT NULL, -- admin que verificó
    notas_admin TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (verificado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_servicio_id (servicio_id),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_nanny_id (nanny_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_pago (fecha_pago)
);

-- =====================================================
-- TABLA DE CALIFICACIONES
-- =====================================================
CREATE TABLE calificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    servicio_id INT NOT NULL,
    cliente_id INT NOT NULL,
    nanny_id INT NOT NULL,
    calificacion_cliente_a_nanny INT DEFAULT NULL, -- 1-5 estrellas
    comentario_cliente TEXT DEFAULT NULL,
    calificacion_nanny_a_cliente INT DEFAULT NULL, -- 1-5 estrellas
    comentario_nanny TEXT DEFAULT NULL,
    fecha_calificacion_cliente TIMESTAMP DEFAULT NULL,
    fecha_calificacion_nanny TIMESTAMP DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_calificacion (servicio_id),
    INDEX idx_servicio_id (servicio_id),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_nanny_id (nanny_id)
);

-- =====================================================
-- TABLA DE DATOS BANCARIOS (para nannys)
-- =====================================================
CREATE TABLE datos_bancarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nanny_id INT NOT NULL,
    nombre_titular VARCHAR(150) NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    clabe VARCHAR(18) DEFAULT NULL,
    tipo_cuenta ENUM('ahorro', 'corriente') DEFAULT 'ahorro',
    es_activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nanny_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_nanny_id (nanny_id)
);

-- =====================================================
-- TABLA DE NOTIFICACIONES
-- =====================================================
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    leida BOOLEAN DEFAULT FALSE,
    url_accion VARCHAR(500) DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP DEFAULT NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_leida (leida),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- =====================================================
-- TABLA DE CONFIGURACIONES DEL SISTEMA
-- =====================================================
CREATE TABLE configuraciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo_dato ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Insertar tipos de servicios
INSERT INTO tipos_servicios (codigo, nombre, descripcion, permite_multiples_dias, tarifa_base) VALUES
('home-care', 'Niñeras a domicilio', 'Cuidado personalizado en la comodidad de tu hogar. Disponible por hora, día o noche.', FALSE, 150.00),
('night-care', 'Niñeras nocturnas', 'Cuidado especializado durante la noche (6:00 PM - 6:00 AM), permitiéndote descansar con tranquilidad.', FALSE, 200.00),
('weekly-care', 'Niñeras por semana', 'Servicio continuo y estable para familias que necesitan apoyo regular.', TRUE, 120.00),
('event-care', 'Acompañamiento a eventos', 'Apoyo profesional durante eventos especiales, bodas y celebraciones.', FALSE, 180.00),
('travel-care', 'Acompañamiento en viajes', 'Niñeras capacitadas para hacer de tus viajes una experiencia más relajada.', TRUE, 250.00);

-- Insertar usuario administrador
INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, tipo_usuario, esta_verificado) VALUES
('Admin', 'Sistema', 'admin@nannyslm.com', '+52 999 999 9999', '$2b$12$sample_hash_admin', 'admin', TRUE);

-- Insertar usuarios de ejemplo (clientes)
INSERT INTO usuarios (nombre, apellido, email, telefono, direccion, password_hash, tipo_usuario, esta_verificado) VALUES
('Juan', 'Pérez', 'juan.perez@email.com', '+52 555 123 4567', 'Calle 123, Colonia Centro, Ciudad de México', '$2b$12$sample_hash_client1', 'cliente', TRUE),
('María', 'García', 'maria.garcia@email.com', '+52 555 234 5678', 'Av. Reforma 456, Col. Roma Norte, CDMX', '$2b$12$sample_hash_client2', 'cliente', FALSE),
('Carlos', 'Mendoza', 'carlos.mendoza@email.com', '+52 555 345 6789', 'Calle Independencia 789, Col. Del Valle', '$2b$12$sample_hash_client3', 'cliente', TRUE);

-- Insertar usuarios nannys
INSERT INTO usuarios (nombre, apellido, email, telefono, direccion, password_hash, tipo_usuario, esta_verificado) VALUES
('Leslie', 'Ruiz', 'leslie.ruiz@nannyslm.com', '+52 555 456 7890', 'Calle de las Flores 123, Col. Jardines', '$2b$12$sample_hash_nanny1', 'nanny', TRUE),
('Ana', 'Martínez', 'ana.martinez@nannyslm.com', '+52 555 567 8901', 'Av. Universidad 456, Col. Copilco', '$2b$12$sample_hash_nanny2', 'nanny', TRUE),
('Sofia', 'López', 'sofia.lopez@nannyslm.com', '+52 555 678 9012', 'Calle Morelos 789, Col. Centro', '$2b$12$sample_hash_nanny3', 'nanny', FALSE);

-- Insertar perfiles de nannys
INSERT INTO perfiles_nanny (usuario_id, experiencia_anos, tarifa_hora, especialidades, descripcion_personal, calificacion_promedio, total_servicios_completados, total_calificaciones, estado_disponibilidad) VALUES
(5, 3, 150.00, 'Cuidado nocturno, Bebés, Primeros auxilios', 'Nanny con experiencia en cuidado nocturno y atención de bebés. Certificada en primeros auxilios.', 4.8, 45, 42, 'disponible'),
(6, 5, 180.00, 'Niños con necesidades especiales, Tareas escolares', 'Especialista en cuidado de niños con necesidades especiales y apoyo en tareas escolares.', 4.9, 67, 61, 'disponible'),
(7, 2, 130.00, 'Cuidado diurno, Actividades recreativas', 'Joven nanny enfocada en actividades recreativas y desarrollo infantil.', 4.5, 23, 20, 'inactiva');

-- Insertar servicios de ejemplo
INSERT INTO servicios (cliente_id, nanny_id, tipo_servicio_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, ubicacion, instrucciones_especiales, estado, tarifa_acordada, total_horas, costo_total) VALUES
(2, 5, 2, '2025-03-19', '2025-03-19', '21:00:00', '06:00:00', 'Calle 123, Colonia Centro, Ciudad de México', 'El niño tiene que comer temprano', 'completado', 200.00, 9.0, 1800.00),
(3, 6, 1, '2025-03-25', '2025-03-25', '14:00:00', '18:00:00', 'Av. Reforma 456, Col. Roma Norte, CDMX', 'Ayuda con la tarea de matemáticas', 'completado', 180.00, 4.0, 720.00),
(4, 5, 2, '2025-04-02', '2025-04-02', '21:00:00', '03:00:00', 'Calle Independencia 789, Col. Del Valle', 'Se deben dormir temprano', 'confirmado', 200.00, 6.0, 1200.00);

-- Insertar pagos
INSERT INTO pagos (servicio_id, cliente_id, nanny_id, monto, estado, metodo_pago, fecha_pago) VALUES
(1, 2, 5, 1800.00, 'pagado', 'transferencia', '2025-03-20 10:30:00'),
(2, 3, 6, 720.00, 'sin_verificar', 'transferencia', '2025-03-26 15:45:00'),
(3, 4, 5, 1200.00, 'pendiente', 'transferencia', NULL);

-- Insertar calificaciones
INSERT INTO calificaciones (servicio_id, cliente_id, nanny_id, calificacion_cliente_a_nanny, comentario_cliente, fecha_calificacion_cliente) VALUES
(1, 2, 5, 5, 'Excelente servicio, muy profesional y puntual. Mi hijo quedó muy contento.', '2025-03-20 08:00:00'),
(2, 3, 6, 4, 'Muy buena nanny, ayudó mucho con las tareas. Recomendada.', '2025-03-26 09:15:00');

-- Insertar datos bancarios para nannys
INSERT INTO datos_bancarios (nanny_id, nombre_titular, numero_cuenta, banco, clabe, tipo_cuenta) VALUES
(5, 'Leslie Ruiz', '1234567890', 'BBVA Bancomer', '012180001234567890', 'ahorro'),
(6, 'Ana Martínez', '0987654321', 'Santander', '014320000987654321', 'corriente');

-- Insertar configuraciones del sistema
INSERT INTO configuraciones (clave, valor, descripcion, tipo_dato) VALUES
('app_name', 'NannysLM', 'Nombre de la aplicación', 'string'),
('commission_percentage', '10.0', 'Porcentaje de comisión de la plataforma', 'number'),
('max_service_hours', '12', 'Máximo de horas por servicio', 'number'),
('notifications_enabled', 'true', 'Notificaciones habilitadas', 'boolean'),
('maintenance_mode', 'false', 'Modo de mantenimiento', 'boolean');

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR CALIFICACIONES AUTOMÁTICAMENTE
-- =====================================================

DELIMITER //

-- Trigger para actualizar calificación promedio de nanny
CREATE TRIGGER actualizar_calificacion_nanny 
AFTER INSERT ON calificaciones
FOR EACH ROW
BEGIN
    IF NEW.calificacion_cliente_a_nanny IS NOT NULL THEN
        UPDATE perfiles_nanny 
        SET 
            calificacion_promedio = (
                SELECT AVG(calificacion_cliente_a_nanny) 
                FROM calificaciones 
                WHERE nanny_id = NEW.nanny_id 
                AND calificacion_cliente_a_nanny IS NOT NULL
            ),
            total_calificaciones = (
                SELECT COUNT(*) 
                FROM calificaciones 
                WHERE nanny_id = NEW.nanny_id 
                AND calificacion_cliente_a_nanny IS NOT NULL
            )
        WHERE usuario_id = NEW.nanny_id;
    END IF;
END//

-- Trigger para actualizar servicios completados de nanny
CREATE TRIGGER actualizar_servicios_completados 
AFTER UPDATE ON servicios
FOR EACH ROW
BEGIN
    IF NEW.estado = 'completado' AND OLD.estado != 'completado' THEN
        UPDATE perfiles_nanny 
        SET total_servicios_completados = total_servicios_completados + 1
        WHERE usuario_id = NEW.nanny_id;
    END IF;
END//

DELIMITER ;

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- =====================================================

-- Vista de servicios con información completa
CREATE VIEW vista_servicios_completa AS
SELECT 
    s.id,
    s.fecha_inicio,
    s.fecha_fin,
    s.hora_inicio,
    s.hora_fin,
    s.ubicacion,
    s.estado,
    s.costo_total,
    CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
    c.email AS cliente_email,
    c.telefono AS cliente_telefono,
    CONCAT(n.nombre, ' ', n.apellido) AS nanny_nombre,
    n.email AS nanny_email,
    n.telefono AS nanny_telefono,
    ts.nombre AS tipo_servicio,
    ts.descripcion AS servicio_descripcion,
    pn.calificacion_promedio AS nanny_calificacion,
    pn.tarifa_hora AS nanny_tarifa
FROM servicios s
LEFT JOIN usuarios c ON s.cliente_id = c.id
LEFT JOIN usuarios n ON s.nanny_id = n.id
LEFT JOIN tipos_servicios ts ON s.tipo_servicio_id = ts.id
LEFT JOIN perfiles_nanny pn ON n.id = pn.usuario_id;

-- Vista de estadísticas del dashboard admin
CREATE VIEW vista_estadisticas_admin AS
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'nanny' AND esta_activo = TRUE) AS nannys_activas,
    (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'cliente' AND esta_verificado = TRUE) AS clientes_verificados,
    (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'cliente' AND esta_verificado = FALSE) AS clientes_sin_verificar,
    (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado = 'pagado' AND MONTH(fecha_pago) = MONTH(CURRENT_DATE) AND YEAR(fecha_pago) = YEAR(CURRENT_DATE)) AS ingresos_mes_actual,
    (SELECT COUNT(*) FROM servicios WHERE estado = 'completado') AS total_servicios_completados,
    (SELECT COUNT(*) FROM servicios WHERE estado IN ('pendiente', 'confirmado')) AS servicios_activos;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_servicios_cliente_fecha ON servicios(cliente_id, fecha_inicio);
CREATE INDEX idx_servicios_nanny_fecha ON servicios(nanny_id, fecha_inicio);
CREATE INDEX idx_pagos_fecha_estado ON pagos(fecha_pago, estado);
CREATE INDEX idx_calificaciones_nanny_fecha ON calificaciones(nanny_id, fecha_calificacion_cliente);

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

DELIMITER //

-- Procedimiento para obtener nannys disponibles en una fecha
CREATE PROCEDURE obtener_nannys_disponibles(
    IN fecha_servicio DATE,
    IN hora_inicio TIME,
    IN hora_fin TIME
)
BEGIN
    SELECT 
        u.id,
        CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
        u.email,
        u.telefono,
        pn.tarifa_hora,
        pn.calificacion_promedio,
        pn.total_servicios_completados,
        pn.especialidades
    FROM usuarios u
    INNER JOIN perfiles_nanny pn ON u.id = pn.usuario_id
    WHERE u.tipo_usuario = 'nanny' 
    AND u.esta_activo = TRUE 
    AND u.esta_verificado = TRUE
    AND pn.estado_disponibilidad = 'disponible'
    AND u.id NOT IN (
        SELECT nanny_id 
        FROM servicios 
        WHERE fecha_inicio = fecha_servicio 
        AND estado IN ('confirmado', 'en_progreso')
        AND (
            (hora_inicio BETWEEN hora_inicio AND hora_fin) OR
            (hora_fin BETWEEN hora_inicio AND hora_fin) OR
            (hora_inicio <= hora_inicio AND hora_fin >= hora_fin)
        )
    )
    ORDER BY pn.calificacion_promedio DESC, pn.total_servicios_completados DESC;
END//

DELIMITER ;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
Esta base de datos incluye:

1. **Gestión completa de usuarios** (admin, cliente, nanny)
2. **Sistema de servicios** con diferentes tipos
3. **Sistema de pagos** con verificación
4. **Sistema de calificaciones** bidireccional
5. **Datos bancarios** para nannys
6. **Notificaciones** del sistema
7. **Configuraciones** flexibles
8. **Triggers automáticos** para mantener estadísticas
9. **Vistas optimizadas** para consultas frecuentes
10. **Procedimientos almacenados** para lógica compleja

Próximos pasos:
- Configurar FastAPI con conexión a MySQL
- Implementar autenticación JWT
- Crear endpoints para cada funcionalidad
- Implementar validaciones de datos
*/