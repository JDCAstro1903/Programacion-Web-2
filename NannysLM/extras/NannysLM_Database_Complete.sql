-- =====================================================
-- BASE DE DATOS NANNYSLM
-- =====================================================

-- Aspectos a considerar
-- Quitar la pagina del login que nos redirecciona a los distintos usuarios
-- Checar bien el Backend, carpetas, rutas y funcionamiento principalmente
-- Hacer validaciones con directivas (hay q aprovechar el uso del framework)

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS nannyslm_db;
USE nannyslm_db;

-- =====================================================
-- TABLA DE USUARIOS (Base para todos los tipos de usuario)
-- Esta tabla almacena la información básica compartida por todos los usuarios del sistema
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- Identificador único del usuario en el sistema
    email VARCHAR(255) UNIQUE NOT NULL,                   -- Email para login y comunicaciones (único en el sistema)
    password_hash VARCHAR(255) NOT NULL,                  -- Contraseña encriptada con hash de seguridad
    first_name VARCHAR(100) NOT NULL,                     -- Nombre(s) del usuario para personalización
    last_name VARCHAR(100) NOT NULL,                      -- Apellido(s) del usuario para identificación completa
    phone_number VARCHAR(20),                             -- Teléfono para contacto y verificación (opcional)
    address TEXT,                                         -- Dirección física para servicios a domicilio
    user_type ENUM('admin', 'client', 'nanny') NOT NULL, -- Tipo de usuario que determina permisos y funcionalidades
    is_verified BOOLEAN DEFAULT FALSE,                    -- Estado de verificación (documentos, identidad validada)
    is_active BOOLEAN DEFAULT TRUE,                       -- Usuario activo/inactivo para suspender cuentas
    profile_image VARCHAR(500),                           -- URL de la foto de perfil del usuario
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha de registro en la plataforma
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última modificación del perfil
    last_login TIMESTAMP NULL                             -- Última vez que inició sesión (para estadísticas)
);

-- cree la bd hasta aqui para ir probando el backend :)

-- =====================================================
-- TABLA DE CLIENTES
-- Información específica de usuarios que contratan servicios de cuidado infantil
-- =====================================================
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único del cliente en el sistema
    user_id INT UNIQUE NOT NULL,                          -- Referencia al usuario base (relación 1:1)
    identification_document VARCHAR(500),                 -- Ruta del archivo de identificación oficial subido
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending', -- Estado del proceso de verificación
    verification_date TIMESTAMP NULL,                     -- Fecha cuando se completó la verificación
    emergency_contact_name VARCHAR(100),                  -- Nombre del contacto de emergencia
    emergency_contact_phone VARCHAR(20),                  -- Teléfono del contacto de emergencia
    number_of_children INT DEFAULT 0,                     -- Número de hijos que necesitan cuidado
    special_requirements TEXT,                            -- Necesidades especiales, alergias, instrucciones específicas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha de registro como cliente
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última actualización del perfil
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DE NIÑERAS
-- Información específica de usuarios que ofrecen servicios de cuidado infantil
-- =====================================================
CREATE TABLE nannys (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único de la niñera en el sistema
    user_id INT UNIQUE NOT NULL,                          -- Referencia al usuario base (relación 1:1)
    description TEXT,                                     -- Descripción personal y enfoque de cuidado
    rating_average DECIMAL(3,2) DEFAULT 0.00,            -- Promedio de calificaciones recibidas (1.00 a 5.00)
    total_ratings INT DEFAULT 0,                         -- Total de calificaciones recibidas (para validar promedio)
    services_completed INT DEFAULT 0,                    -- Número de servicios completados exitosamente
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active', -- Estado actual en la plataforma
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha de registro como niñera
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última actualización del perfil
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DE SERVICIOS
-- Registro de todos los servicios de cuidado infantil solicitados y realizados
-- =====================================================
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único del servicio
    client_id INT NOT NULL,                               -- Cliente que solicita el servicio
    nanny_id INT,                                         -- Niñera asignada (puede ser NULL si aún no se asigna)
    title VARCHAR(200) NOT NULL,                          -- Título descriptivo del servicio
    service_type ENUM('hourly', 'daily', 'weekly', 'overnight', 'event', 'travel') NOT NULL, -- Tipo de servicio solicitado
    description TEXT,                                     -- Descripción detallada del servicio requerido
    start_date DATE NOT NULL,                             -- Fecha de inicio del servicio
    end_date DATE,                                        -- Fecha de fin (para servicios de múltiples días)
    start_time TIME NOT NULL,                             -- Hora de inicio del servicio
    end_time TIME NOT NULL,                               -- Hora de finalización del servicio
    total_hours DECIMAL(5,2),                            -- Total de horas del servicio (calculado)
    total_amount DECIMAL(10,2),                          -- Monto total a pagar (horas × tarifa)
    number_of_children INT DEFAULT 1,                    -- Número de niños a cuidar en este servicio
    special_instructions TEXT,                            -- Instrucciones específicas para la niñera
    address TEXT,                                         -- Dirección donde se realizará el servicio
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending', -- Estado actual del servicio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha cuando se creó la solicitud
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última modificación del servicio
    completed_at TIMESTAMP NULL,                          -- Fecha y hora cuando se completó el servicio
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES nannys(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLA DE CALIFICACIONES Y RESEÑAS
-- Sistema de evaluación de servicios completados para mantener calidad
-- =====================================================
CREATE TABLE ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único de la calificación
    service_id INT NOT NULL,                              -- Servicio que se está calificando
    client_id INT NOT NULL,                               -- Cliente que da la calificación
    nanny_id INT NOT NULL,                                -- Niñera que recibe la calificación
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Calificación general (1.0 a 5.0 estrellas)
    review TEXT,                                          -- Comentario escrito sobre el servicio recibido
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5), -- Calificación de puntualidad (1-5)
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5), -- Calificación de comunicación (1-5)
    care_quality_rating INT CHECK (care_quality_rating >= 1 AND care_quality_rating <= 5), -- Calificación de calidad del cuidado (1-5)
    would_recommend BOOLEAN DEFAULT TRUE,                 -- Si recomendaría esta niñera a otros padres
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha cuando se hizo la calificación
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES nannys(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_rating (service_id)         -- Un servicio solo puede tener una calificación
);

-- =====================================================
-- TABLA DE PAGOS
-- Registro de todas las transacciones financieras del sistema
-- =====================================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único del pago
    service_id INT NOT NULL,                              -- Servicio por el cual se realiza el pago
    client_id INT NOT NULL,                               -- Cliente que realiza el pago
    nanny_id INT NOT NULL,                                -- Niñera que recibirá el pago
    amount DECIMAL(10,2) NOT NULL,                        -- Monto total del pago
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending', -- Estado del pago
    transaction_id VARCHAR(100),                          -- ID de transacción del procesador de pagos
    platform_fee DECIMAL(10,2) DEFAULT 0.00,             -- Comisión que retiene la plataforma
    nanny_amount DECIMAL(10,2),                           -- Cantidad neta que recibe la niñera (monto - comisión)
    payment_date TIMESTAMP NULL,                          -- Fecha cuando se procesó exitosamente el pago
    receipt_url VARCHAR(500),                             -- URL del comprobante de pago subido por el cliente
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha cuando se creó el registro de pago
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última actualización del pago
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES nannys(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DE DATOS BANCARIOS (Para niñeras)
-- Información bancaria de las niñeras para recibir pagos
-- =====================================================
CREATE TABLE bank_details (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único del registro bancario
    nanny_id INT NOT NULL,                                -- Niñera propietaria de esta cuenta bancaria
    account_holder_name VARCHAR(150) NOT NULL,            -- Nombre del titular de la cuenta (debe coincidir con identificación)
    bank_name VARCHAR(100) NOT NULL,                      -- Nombre del banco (BBVA, Santander, Banorte, etc.)
    account_number VARCHAR(50) NOT NULL,                  -- Número de cuenta bancaria
    clabe VARCHAR(18),                                    -- CLABE interbancaria (para México, 18 dígitos)
    account_type ENUM('checking', 'savings') DEFAULT 'checking', -- Tipo de cuenta (corriente o ahorro)
    is_primary BOOLEAN DEFAULT FALSE,                     -- Si es la cuenta principal para recibir pagos
    is_active BOOLEAN DEFAULT TRUE,                       -- Si la cuenta está activa para recibir transferencias
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha cuando se agregó la información bancaria
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última actualización de los datos
    FOREIGN KEY (nanny_id) REFERENCES nannys(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DE NOTIFICACIONES
-- Sistema de notificaciones para mantener informados a los usuarios
-- =====================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único de la notificación
    user_id INT NOT NULL,                                 -- Usuario que recibe la notificación
    title VARCHAR(200) NOT NULL,                          -- Título corto de la notificación
    message TEXT NOT NULL,                                -- Mensaje completo de la notificación
    type ENUM('info', 'success', 'warning', 'error', 'service', 'payment') DEFAULT 'info', -- Tipo para mostrar iconos/colores apropiados
    is_read BOOLEAN DEFAULT FALSE,                        -- Si el usuario ya leyó la notificación
    action_url VARCHAR(500),                              -- URL a la que debe dirigirse al hacer clic
    related_id INT,                                       -- ID del elemento relacionado (servicio, pago, etc.)
    related_type VARCHAR(50),                             -- Tipo de entidad relacionada ('service', 'payment', etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha cuando se creó la notificación
    read_at TIMESTAMP NULL,                               -- Fecha cuando se marcó como leída
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DE FAVORITOS (Clientes pueden marcar niñeras favoritas)
-- Lista de niñeras marcadas como favoritas por los clientes
-- =====================================================
CREATE TABLE client_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único del registro de favorito
    client_id INT NOT NULL,                               -- Cliente que marca como favorita
    nanny_id INT NOT NULL,                                -- Niñera marcada como favorita
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha cuando se marcó como favorita
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (nanny_id) REFERENCES nannys(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (client_id, nanny_id)      -- Un cliente no puede marcar la misma niñera dos veces
);

-- =====================================================
-- TABLA DE DISPONIBILIDAD DE NIÑERAS
-- Control de horarios específicos disponibles para cada niñera
-- =====================================================
CREATE TABLE nanny_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID único del registro de disponibilidad
    nanny_id INT NOT NULL,                                -- Niñera a la que pertenece este horario
    date DATE NOT NULL,                                   -- Fecha específica de disponibilidad
    start_time TIME NOT NULL,                             -- Hora de inicio del horario disponible
    end_time TIME NOT NULL,                               -- Hora de fin del horario disponible
    is_available BOOLEAN DEFAULT TRUE,                    -- Si realmente está disponible en este horario
    reason VARCHAR(200),                                  -- Razón si no está disponible (vacaciones, enfermedad, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Fecha de creación del registro
    FOREIGN KEY (nanny_id) REFERENCES nannys(id) ON DELETE CASCADE,
    UNIQUE KEY unique_availability (nanny_id, date, start_time) -- No puede tener dos registros del mismo horario
);


-- =====================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_services_client ON services(client_id);
CREATE INDEX idx_services_nanny ON services(nanny_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_date ON services(start_date);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_ratings_nanny ON ratings(nanny_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR ESTADÍSTICAS
-- =====================================================

-- Trigger para actualizar rating promedio de niñeras
DELIMITER //
CREATE TRIGGER update_nanny_rating 
AFTER INSERT ON ratings 
FOR EACH ROW
BEGIN
    UPDATE nannys 
    SET 
        rating_average = (
            SELECT AVG(rating) 
            FROM ratings 
            WHERE nanny_id = NEW.nanny_id
        ),
        total_ratings = (
            SELECT COUNT(*) 
            FROM ratings 
            WHERE nanny_id = NEW.nanny_id
        )
    WHERE id = NEW.nanny_id;
END//

-- Trigger para actualizar servicios completados
CREATE TRIGGER update_services_completed 
AFTER UPDATE ON services 
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE nannys 
        SET services_completed = services_completed + 1 
        WHERE id = NEW.nanny_id;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- =====================================================

-- Vista de niñeras con información completa
CREATE VIEW nannys_complete_info AS
SELECT 
    n.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_number,
    u.profile_image,
    n.experience_years,
    n.hourly_rate,
    n.rating_average,
    n.services_completed,
    n.status,
    n.description,
    u.is_verified
FROM nannys n
JOIN users u ON n.user_id = u.id;

-- Vista de servicios con información de cliente y niñera
CREATE VIEW services_complete_info AS
SELECT 
    s.*,
    uc.first_name as client_first_name,
    uc.last_name as client_last_name,
    uc.email as client_email,
    un.first_name as nanny_first_name,
    un.last_name as nanny_last_name,
    un.email as nanny_email,
    n.rating_average as nanny_rating
FROM services s
JOIN clients c ON s.client_id = c.id
JOIN users uc ON c.user_id = uc.id
LEFT JOIN nannys n ON s.nanny_id = n.id
LEFT JOIN users un ON n.user_id = un.id;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para calcular edad basada en fecha de nacimiento
DELIMITER //
CREATE FUNCTION calculate_age(birth_date DATE) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE age INT;
    SET age = TIMESTAMPDIFF(YEAR, birth_date, CURDATE());
    RETURN age;
END//
DELIMITER ;

