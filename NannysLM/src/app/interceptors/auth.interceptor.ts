import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const currentUserStr = localStorage.getItem('currentUser');
  
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      const token = currentUser.token;
      
      if (token) {
        // Clonar la petición y agregar el header de Authorization
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('🔐 Interceptor - Agregando token a:', req.url);
        return next(authReq);
      }
    } catch (error) {
      console.error('❌ Interceptor - Error al parsear currentUser:', error);
    }
  }
  
  // Si no hay token, continuar con la petición original
  return next(req);
};
