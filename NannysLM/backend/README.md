# 🍼 NannysLM Backend API

Backend desarrollado en **Node.js + Express** para la plataforma de gestión de niñeras NannysLM.

## 🚀 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación y autorización
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Manejo de uploads
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, JWT, etc.)
│   ├── controllers/     # Lógica de negocio
│   ├── models/          # Modelos de datos
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middlewares personalizados
│   └── utils/           # Utilidades y helpers
├── uploads/             # Archivos subidos por usuarios
├── server.js           # Punto de entrada del servidor
├── package.json        # Dependencias y scripts
└── .env               # Variables de entorno
```

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura tus valores:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nannys_lm

# JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:4200
```

### 3. Configurar Base de Datos

1. Crea la base de datos MySQL:
```sql
CREATE DATABASE nannys_lm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Ejecuta el script de la base de datos:
```bash
mysql -u root -p nannys_lm < ../extras/NannysLM_Database_Complete.sql
```

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Desarrollo (con nodemon)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

### Ejecutar Tests
```bash
npm test
```

## 📡 Endpoints de la API

### Health Check
- `GET /api/health` - Verificar estado del servidor
- `GET /api/info` - Información de la API

### Autenticación (Próximamente)
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios (Próximamente)
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/nannys` - Listar niñeras

### Servicios (Próximamente)
- `GET /api/services` - Listar servicios
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio

## 🔒 Seguridad Implementada

- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Límite de requests por IP
- **CORS**: Control de acceso cross-origin
- **JWT**: Tokens de autenticación seguros
- **Bcrypt**: Encriptación de contraseñas
- **Input Validation**: Validación de datos de entrada

## 🐛 Debugging

### Logs de Desarrollo
El servidor utiliza **Morgan** para logging en modo desarrollo. Verás información detallada de cada request.

### Variables de Entorno de Debug
```env
NODE_ENV=development
DEBUG=app:*
```

## 🚀 Despliegue

### Variables de Entorno de Producción
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_host_produccion
JWT_SECRET=clave_super_segura_de_produccion
```

### PM2 (Recomendado para producción)
```bash
npm install -g pm2
pm2 start server.js --name "nannys-api"
pm2 startup
pm2 save
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Próximos Pasos

- [ ] Implementar autenticación JWT
- [ ] Crear controladores para usuarios
- [ ] Desarrollar API de servicios
- [ ] Implementar sistema de pagos
- [ ] Agregar tests unitarios
- [ ] Documentación con Swagger

---

💡 **Tip**: Usa `npm run dev` para desarrollo con auto-reload activado.