import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user || !this.authService.getToken()) {
          // No autenticado, redirigir al login
          this.router.navigate(['/login']);
          return false;
        }

        // Obtener el rol requerido desde los datos de la ruta
        const requiredRole = route.data['role'] as string;
        const userRole = user.user_type;

        console.log('🔐 RoleGuard - Usuario:', user.email, 'Tipo:', userRole, 'Requerido:', requiredRole);

        if (userRole === requiredRole) {
          // Usuario tiene el rol correcto
          return true;
        } else {
          // Usuario no tiene el rol correcto, redirigir a su dashboard
          console.log('❌ Acceso denegado. Redirigiendo a dashboard correcto...');
          this.redirectToCorrectDashboard(userRole);
          return false;
        }
      })
    );
  }

  private redirectToCorrectDashboard(userType: string): void {
    switch (userType) {
      case 'client':
        this.router.navigate(['/dashboard/client']);
        break;
      case 'nanny':
        this.router.navigate(['/dashboard/nanny']);
        break;
      case 'admin':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}