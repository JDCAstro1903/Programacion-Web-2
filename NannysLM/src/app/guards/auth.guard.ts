import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.getToken()) {
          // Usuario autenticado con token válido
          return true;
        } else {
          // No autenticado, redirigir al login
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}