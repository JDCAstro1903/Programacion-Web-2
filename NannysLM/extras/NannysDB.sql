DROP DATABASE IF EXISTS NANNYS;

CREATE DATABASE NANNYS;

USE NANNYS;

CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    perfil_img VARCHAR(255),
    tipo_usuario VARCHAR(50) NOT NULL
);

CREATE TABLE Verificacion (
    id_verificacion INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL UNIQUE,
    documento_oficial VARCHAR(255) NOT NULL,
    estado_verificacion VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Nannys (
    id_usuario INT PRIMARY KEY,
    estado_nanny VARCHAR(50) NOT NULL,
    experiencia TEXT,
    habilidades TEXT,
    disponibilidad TEXT,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE TiposServicio (
    id_servicio INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Servicio (
    id_servicio INT PRIMARY KEY AUTO_INCREMENT,
    id_tipo_servicio INT NOT NULL,
    id_usuario INT NOT NULL,
    id_nanny INT NOT NULL,
    fecha DATE,
    horario VARCHAR(100),
    cantidad_pago DECIMAL(10, 2) NOT NULL,
    estado_servicio VARCHAR(50) NOT NULL DEFAULT 'Solicitado',
    FOREIGN KEY (id_tipo_servicio) REFERENCES TiposServicio(id_servicio),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_nanny) REFERENCES Nannys(id_usuario)
);

CREATE TABLE Pagos (
    id_pago INT PRIMARY KEY AUTO_INCREMENT,
    id_servicio INT NOT NULL,
    id_usuario INT NOT NULL,
    id_nanny INT NOT NULL,
    cantidad_pago DECIMAL(10, 2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) DEFAULT 'transferencia',
    FOREIGN KEY (id_servicio) REFERENCES Servicio(id_servicio),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_nanny) REFERENCES Nannys(id_usuario)
);

CREATE TABLE Comisiones (
    id_comision INT PRIMARY KEY AUTO_INCREMENT,
    id_pago INT NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    monto_comision DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pago) REFERENCES Pagos(id_pago)
);

CREATE TABLE Entrevistas (
    id_entrevista INT PRIMARY KEY AUTO_INCREMENT,
    id_familia INT NOT NULL,
    id_nanny INT NOT NULL,
    fecha DATETIME NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    FOREIGN KEY (id_familia) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_nanny) REFERENCES Nannys(id_usuario)
);

CREATE TABLE Sesiones (
    id_sesion INT PRIMARY KEY AUTO_INCREMENT,
    id_servicio INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    confirmada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_servicio) REFERENCES Servicio(id_servicio)
);

CREATE TABLE Recordatorios (
    id_recordatorio INT PRIMARY KEY AUTO_INCREMENT,
    id_sesion INT NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    fecha_envio DATETIME NOT NULL,
    FOREIGN KEY (id_sesion) REFERENCES Sesiones(id_sesion)
);

CREATE TABLE Reseñas (
    id_resena INT PRIMARY KEY AUTO_INCREMENT,
    id_familia INT NOT NULL,
    id_nanny INT NOT NULL,
    calificacion INT CHECK(calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_familia) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_nanny) REFERENCES Nannys(id_usuario)
);