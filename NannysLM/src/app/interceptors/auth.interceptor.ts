import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Intentar cargar currentUser desde sessionStorage (preferible cuando no se eligió "recordarme")
  const storages: Storage[] = [sessionStorage, localStorage];

  for (const storage of storages) {
    const currentUserStr = storage.getItem('currentUser');
    if (!currentUserStr) continue;

    try {
      const currentUser = JSON.parse(currentUserStr);
      const token = currentUser?.token || storage.getItem('token');

      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('🔐 Interceptor - Agregando token desde ' + (storage === sessionStorage ? 'sessionStorage' : 'localStorage') + ' a:', req.url);
        return next(authReq);
      }
    } catch (error) {
      console.error('❌ Interceptor - Error al parsear currentUser desde ' + (storage === sessionStorage ? 'sessionStorage' : 'localStorage') + ':', error);
    }
  }

  // Si no hay token en ningún storage, continuar con la petición original
  return next(req);
};
