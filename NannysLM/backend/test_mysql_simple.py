#!/usr/bin/env python3
"""
Script simple para probar conexión MySQL sin SQLAlchemy
"""
import pymysql
import sys

def test_mysql_basic():
    """Probar conexión básica a MySQL"""
    print("🔍 Probando conexión básica a MySQL...")
    
    try:
        # Configuración igual que en PHP
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='root',
            port=3306,
            charset='utf8mb4'
        )
        
        print("✅ Conexión a MySQL exitosa!")
        
        cursor = connection.cursor()
        
        # Mostrar bases de datos
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        print("📂 Bases de datos disponibles:")
        for db in databases:
            print(f"   - {db[0]}")
        
        # Verificar si existe nannys_lm
        cursor.execute("SHOW DATABASES LIKE 'nannys_lm'")
        result = cursor.fetchone()
        
        if result:
            print("✅ Base de datos 'nannys_lm' encontrada")
            
            # Conectar a la BD específica
            cursor.execute("USE nannys_lm")
            print("✅ Conectado a nannys_lm")
            
            # Mostrar tablas
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            if tables:
                print(f"📋 Tablas encontradas ({len(tables)}):")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("⚠️  No hay tablas en la base de datos")
                print("💡 Necesitas ejecutar el script SQL")
        else:
            print("📝 Creando base de datos 'nannys_lm'...")
            cursor.execute("CREATE DATABASE nannys_lm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ Base de datos 'nannys_lm' creada!")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_test_user():
    """Crear un usuario de prueba si no existe"""
    print("\n👤 Verificando usuarios de prueba...")
    
    try:
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='root',
            database='nannys_lm',
            port=3306,
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        # Verificar si existe la tabla usuarios
        cursor.execute("SHOW TABLES LIKE 'usuarios'")
        if not cursor.fetchone():
            print("⚠️  Tabla 'usuarios' no existe")
            return False
        
        # Verificar si hay usuarios
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        count = cursor.fetchone()[0]
        
        print(f"👥 Usuarios encontrados: {count}")
        
        if count > 0:
            # Mostrar algunos usuarios
            cursor.execute("SELECT id, email, nombre, apellido, tipo_usuario FROM usuarios LIMIT 3")
            users = cursor.fetchall()
            print("👤 Usuarios de ejemplo:")
            for user in users:
                print(f"   - {user[2]} {user[3]} ({user[1]}) - {user[4]}")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verificando usuarios: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Prueba de Conexión MySQL Simple")
    print("=" * 40)
    
    if test_mysql_basic():
        create_test_user()
        print("\n🎉 ¡MySQL está funcionando correctamente!")
        print("📝 Próximos pasos:")
        print("   1. Ejecutar script SQL si no hay tablas")
        print("   2. Probar servidor FastAPI")
    else:
        print("\n❌ Revisa la configuración de MySQL:")
        print("   - Usuario: root")
        print("   - Contraseña: root") 
        print("   - Puerto: 3306")
        print("   - MySQL debe estar ejecutándose")