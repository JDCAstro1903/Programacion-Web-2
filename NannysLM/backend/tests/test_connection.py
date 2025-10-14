# Script para probar la conexión a la base de datos
from app.database import engine
from sqlalchemy import text

def test_connection():
    """Probar conexión a MySQL"""
    try:
        with engine.connect() as connection:
            # Probar consulta simple
            result = connection.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            print("✅ Conexión a la base de datos exitosa!")
            print(f"   Resultado de prueba: {row[0]}")
            
            # Probar que la base de datos existe
            result = connection.execute(text("SELECT DATABASE() as db_name"))
            db_name = result.fetchone()
            print(f"   Base de datos actual: {db_name[0]}")
            
            # Mostrar tablas existentes
            result = connection.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            print(f"   Tablas encontradas: {len(tables)}")
            for table in tables:
                print(f"     - {table[0]}")
                
    except Exception as e:
        print(f"❌ Error de conexión a la base de datos:")
        print(f"   {str(e)}")
        print("\n🔧 Posibles soluciones:")
        print("   1. Verificar que MySQL esté ejecutándose")
        print("   2. Revisar credenciales en el archivo .env")
        print("   3. Verificar que la base de datos 'nannys_lm' existe")
        print("   4. Instalar pymysql: pip install pymysql")

if __name__ == "__main__":
    print("🔍 Probando conexión a MySQL...")
    test_connection()