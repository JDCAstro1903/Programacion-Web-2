import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  tipo_usuario: 'admin' | 'cliente' | 'nanny';
  es_verificado: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  username: string; // El backend espera 'username' para el email
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8000/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Cargar datos del localStorage al inicializar
    this.loadStoredAuth();
  }

  /**
   * Cargar datos de autenticación almacenados
   */
  private loadStoredAuth(): void {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('current_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearStoredAuth();
      }
    }
  }

  /**
   * Iniciar sesión
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      username: email, // FastAPI OAuth2PasswordRequestForm espera 'username'
      password: password
    };

    // Crear FormData para OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, formData)
      .pipe(
        tap(response => {
          // Guardar token y usuario
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('current_user', JSON.stringify(response.user));
          localStorage.setItem('token_expires_at', (Date.now() + (response.expires_in * 1000)).toString());
          
          this.tokenSubject.next(response.access_token);
          this.currentUserSubject.next(response.user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.clearStoredAuth();
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  /**
   * Limpiar datos almacenados
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('token_expires_at');
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) {
      return false;
    }

    // Verificar si el token ha expirado
    if (Date.now() > parseInt(expiresAt)) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: 'admin' | 'cliente' | 'nanny'): boolean {
    const user = this.getCurrentUser();
    return user?.tipo_usuario === role;
  }

  /**
   * Redirigir según el tipo de usuario
   */
  redirectToDashboard(): void {
    const user = this.getCurrentUser();
    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    switch (user.tipo_usuario) {
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'cliente':
        this.router.navigate(['/client-dashboard']);
        break;
      case 'nanny':
        this.router.navigate(['/nanny-dashboard']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }

  /**
   * Obtener usuarios de prueba (solo desarrollo)
   */
  getTestUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/test-users`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Manejar errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 401:
          errorMessage = 'Email o contraseña incorrectos';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 422:
          errorMessage = 'Datos inválidos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.detail || `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Auth Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}