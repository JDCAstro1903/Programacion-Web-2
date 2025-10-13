# NannysLM Backend - Guía de Instalación y Configuración

Este documento te guiará paso a paso para configurar y ejecutar el backend de NannysLM con FastAPI y MySQL.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Python 3.8+** - [Descargar aquí](https://www.python.org/downloads/)
- **MySQL 8.0+** - [Descargar aquí](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Descargar aquí](https://git-scm.com/downloads)

## 🗄️ Configuración de MySQL

### 1. Instalación de MySQL

#### Windows:
1. Descarga MySQL Community Server desde el sitio oficial
2. Ejecuta el instalador y sigue las instrucciones
3. Durante la instalación, configura la contraseña del usuario root
4. Asegúrate de que el servicio MySQL esté ejecutándose

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS:
```bash
brew install mysql
brew services start mysql
```

### 2. Crear la Base de Datos

1. **Conectarse a MySQL:**
   ```bash
   mysql -u root -p
   ```

2. **Ejecutar el script de la base de datos:**
   ```sql
   source /ruta/completa/backend/database/nannys_db.sql
   ```
   
   O alternativamente:
   ```bash
   mysql -u root -p < backend/database/nannys_db.sql
   ```

3. **Verificar que la base de datos se creó correctamente:**
   ```sql
   USE nannys_lm;
   SHOW TABLES;
   ```

## 🐍 Configuración del Backend

### 1. Crear Entorno Virtual

```bash
# Navegar al directorio del backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno

1. **Copiar el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Editar el archivo `.env`** con tus configuraciones:
   ```env
   # Base de datos MySQL
   DATABASE_URL=mysql+pymysql://root:tu_password@localhost:3306/nannys_lm
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_password_mysql
   DB_NAME=nannys_lm

   # Seguridad
   SECRET_KEY=cambia-esta-clave-por-una-muy-segura-en-produccion
   
   # CORS (para conectar con Angular)
   ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
   ```

### 4. Verificar Conexión a Base de Datos

Puedes crear un script de prueba:

```python
# test_connection.py
from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Conexión a la base de datos exitosa!")
except Exception as e:
    print(f"❌ Error de conexión: {e}")
```

```bash
python test_connection.py
```

## 🚀 Ejecutar el Backend

### Modo Desarrollo

```bash
# Desde el directorio backend/
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

O alternativamente:

```bash
python app/main.py
```

### Verificar que está funcionando

1. **Abrir navegador en:** http://localhost:8000
2. **Documentación automática:** http://localhost:8000/docs
3. **ReDoc:** http://localhost:8000/redoc

## 🧪 Datos de Prueba

La base de datos incluye datos de ejemplo:

### Usuarios Admin:
- **Email:** admin@nannyslm.com
- **Password:** (hash de ejemplo, implementar autenticación)

### Usuarios Cliente:
- **Email:** juan.perez@email.com
- **Email:** maria.garcia@email.com
- **Email:** carlos.mendoza@email.com

### Usuarios Nanny:
- **Email:** leslie.ruiz@nannyslm.com
- **Email:** ana.martinez@nannyslm.com
- **Email:** sofia.lopez@nannyslm.com

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicación principal FastAPI
│   ├── config.py            # Configuración y settings
│   ├── database.py          # Configuración de SQLAlchemy
│   ├── models.py            # Modelos de base de datos
│   ├── schemas/             # Schemas de Pydantic (próximamente)
│   ├── routers/             # Endpoints de la API (próximamente)
│   ├── services/            # Lógica de negocio (próximamente)
│   └── utils/               # Utilidades (próximamente)
├── database/
│   └── nannys_db.sql        # Script de base de datos
├── uploads/                 # Archivos subidos
├── requirements.txt         # Dependencias de Python
├── .env.example            # Ejemplo de variables de entorno
└── README.md               # Este archivo
```

## 🔧 Próximos Pasos

Una vez que tengas el backend básico funcionando, los próximos pasos serían:

1. **Implementar autenticación JWT**
2. **Crear endpoints para usuarios**
3. **Crear endpoints para servicios**
4. **Crear endpoints para pagos**
5. **Implementar validaciones con Pydantic**
6. **Agregar tests**

## 🐛 Solución de Problemas

### Error de conexión a MySQL
```bash
# Verificar que MySQL esté ejecutándose
# Windows:
net start mysql80

# Linux:
sudo systemctl start mysql

# macOS:
brew services restart mysql
```

### Error de puerto ocupado
```bash
# Cambiar puerto en el comando uvicorn
uvicorn app.main:app --reload --port 8001
```

### Error de dependencias
```bash
# Actualizar pip y reinstalar
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## 📞 Soporte

Si tienes problemas:
1. Revisa que todos los prerrequisitos estén instalados
2. Verifica que MySQL esté ejecutándose
3. Asegúrate de que las variables de entorno estén configuradas correctamente
4. Revisa los logs en la consola donde ejecutas uvicorn

¡Tu backend de NannysLM estará listo para conectarse con el frontend de Angular! 🎉