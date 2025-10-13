#!/usr/bin/env python3
"""
Script para crear tablas esenciales en MySQL
"""
import pymysql
import os

def execute_sql_file():
    """Ejecutar el script SQL para crear tablas"""
    print("🔨 Creando tablas esenciales en MySQL...")
    
    try:
        # Conectar a la base de datos
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='root',
            database='nannys_lm',
            port=3306,
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        # Crear tabla usuarios
        print("📝 Creando tabla usuarios...")
        cursor.execute("""
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
            )
        """)
        print("✅ Tabla usuarios creada")
        
        # Crear tabla datos_bancarios
        print("📝 Creando tabla datos_bancarios...")
        cursor.execute("""
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
            )
        """)
        print("✅ Tabla datos_bancarios creada")
        
        # Insertar usuarios de prueba (password123 hasheado con bcrypt)
        print("📝 Insertando usuarios de prueba...")
        usuarios_prueba = [
            ('admin@nannys-lm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'Admin', 'Sistema', 'admin', True),
            ('juan.perez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'Juan', 'Pérez', 'cliente', True),
            ('maria.garcia@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'María', 'García', 'nanny', True),
            ('ana.lopez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJVhRYoX2', 'Ana', 'López', 'nanny', True)
        ]
        
        for email, password, nombre, apellido, tipo, verificado in usuarios_prueba:
            try:
                cursor.execute("""
                    INSERT INTO usuarios (email, password, nombre, apellido, tipo_usuario, es_verificado) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (email, password, nombre, apellido, tipo, verificado))
                print(f"✅ Usuario creado: {nombre} {apellido} ({email})")
            except pymysql.IntegrityError:
                print(f"⚠️  Usuario ya existe: {email}")
        
        # Insertar datos bancarios de prueba
        print("📝 Insertando datos bancarios de prueba...")
        cursor.execute("SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'")
        maria_id = cursor.fetchone()
        cursor.execute("SELECT id FROM usuarios WHERE email = 'ana.lopez@email.com'")
        ana_id = cursor.fetchone()
        
        if maria_id and ana_id:
            datos_bancarios = [
                (maria_id[0], 'María García', '1234567890123456', 'BBVA Bancomer', '012180001234567890', 'ahorro'),
                (ana_id[0], 'Ana López', '9876543210987654', 'Santander', '014180009876543210', 'corriente')
            ]
            
            for nanny_id, titular, cuenta, banco, clabe, tipo in datos_bancarios:
                try:
                    cursor.execute("""
                        INSERT INTO datos_bancarios (nanny_id, nombre_titular, numero_cuenta, banco, clabe, tipo_cuenta) 
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (nanny_id, titular, cuenta, banco, clabe, tipo))
                    print(f"✅ Datos bancarios creados para: {titular}")
                except pymysql.IntegrityError:
                    print(f"⚠️  Datos bancarios ya existen para: {titular}")
        
        # Confirmar cambios
        connection.commit()
        
        # Verificar tablas creadas
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\n✅ Tablas creadas ({len(tables)}):")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Verificar usuarios
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        user_count = cursor.fetchone()[0]
        print(f"\n👥 Usuarios de prueba: {user_count}")
        
        if user_count > 0:
            cursor.execute("SELECT email, nombre, apellido, tipo_usuario FROM usuarios")
            users = cursor.fetchall()
            print("👤 Usuarios disponibles:")
            for user in users:
                print(f"   - {user[1]} {user[2]} ({user[0]}) - {user[3]}")
        
        cursor.close()
        connection.close()
        
        print("\n🎉 ¡Base de datos configurada exitosamente!")
        print("🔑 Contraseña para todos los usuarios: password123")
        
        return True
        
    except Exception as e:
        print(f"❌ Error ejecutando SQL: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Configurador de Base de Datos NannysLM")
    print("=" * 45)
    execute_sql_file()