```markdown
# Endpoints del backend

Esta carpeta contiene módulos de routers Express listos para usar que implementan endpoints CRUD básicos para las principales tablas de la base de datos. Cada router utiliza el helper `executeQuery` de `../src/config/database`.

Archivos:
- users.js
- clients.js
- nannys.js
- services.js
- ratings.js
- payments.js
- bankDetails.js
- notifications.js
- clientFavorites.js
- index.js (exporta los routers)

Notas:
- Estos routers son módulos independientes. Para montarlos, requiére el router y añádelo a tu aplicación Express (por ejemplo `app.use('/api/v1/users', require('./endpoints/users'))`).
- Los endpoints realizan inserciones/actualizaciones dinámicas basadas en los campos de `req.body`. Valida los datos antes de usar en producción.
- Devuelven JSON con la forma { success: boolean, data|error }.

