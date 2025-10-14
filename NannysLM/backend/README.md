# Backend NannysLM

Backend de la aplicación NannysLM desarrollado con FastAPI.

## 🏗️ Estructura del Proyecto

```
backend/
├── app/
│   ├── routers/
│   │   ├── auth/
│   │   │   ├── login.py      # APIs de autenticación
│   │   │   └── register.py   # APIs de registro
│   │   └── datos_bancarios.py
│   ├── schemas/              # Modelos Pydantic
│   ├── services/            # Lógica de negocio
│   ├── config.py           # Configuración
│   ├── database.py         # Conexión DB
│   ├── models.py           # Modelos SQLAlchemy
│   └── main.py             # Aplicación principal
├── database/
│   └── nannys_db.sql       # Script de base de datos
├── tests/                  # Archivos de prueba
├── uploads/               # Archivos subidos
├── .env                   # Variables de entorno
└── requirements.txt       # Dependencias
```

## 🚀 Tecnologías

- **FastAPI**: Framework web moderno y rápido
- **MySQL**: Base de datos relacional
- **SQLAlchemy**: ORM para Python
- **JWT**: Autenticación con tokens
- **Bcrypt**: Encriptación de contraseñas
- **Pydantic**: Validación de datos

## 📦 Instalación

1. **Crear entorno virtual:**
```bash
python -m venv venv
```

2. **Activar entorno virtual:**
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1
# Windows CMD
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

## ⚙️ Configuración

1. Copiar `.env.example` a `.env`
2. Configurar las variables de entorno en `.env`
3. Crear la base de datos MySQL
4. Ejecutar el script SQL: `database/nannys_db.sql`

## 🏃‍♂️ Ejecución

**Opción 1 - Uvicorn directo:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Opción 2 - Desde main.py:**
```bash
python -m app.main
```

## 📚 APIs Disponibles

### 🔐 Autenticación (`/api/v1/auth`)
- `POST /login` - Iniciar sesión
- `POST /logout` - Cerrar sesión
- `POST /register` - Registro general
- `POST /register/cliente` - Registro de cliente
- `POST /register/cuidadora` - Registro de cuidadora
- `GET /test-users` - Ver usuarios de prueba

### 🏦 Datos Bancarios (`/api/v1/datos-bancarios`)
- Endpoints para gestión de información bancaria

## 📖 Documentación

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🧪 Testing

```bash
# Ejecutar pruebas de conexión
python tests/test_connection.py
python tests/test_mysql_simple.py
```

## 🔧 Setup de Base de Datos

```bash
python setup_database.py
```