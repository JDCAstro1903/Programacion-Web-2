import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'client' | 'nanny' | 'admin';
  phone_number?: string;
  address?: string;
  is_verified: boolean;
  is_active: boolean;
  profile_image?: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    expires_in: string;
  };
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  address?: string;
  user_type: 'client' | 'nanny' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario y token del localStorage al inicializar
    this.loadUserFromStorage();
  }

  /**
   * Registrar nuevo usuario
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.clearAuthData();
        })
      );
  }

  /**
   * Logout forzado (limpia datos locales sin llamar al backend)
   */
  forceLogout(): void {
    this.clearAuthData();
  }

  /**
   * Obtener perfil del usuario
   */
  getProfile(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/profile`, { headers });
  }

  /**
   * Verificar disponibilidad de email
   */
  checkEmailAvailability(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/check-email?email=${email}`);
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
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.user_type === role : false;
  }

  /**
   * Configurar datos de autenticación
   */
  private setAuthData(user: User, token: string): void {
    // Guardar en formato antiguo para compatibilidad
    const currentUser = { ...user, token };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // También guardar en formato nuevo
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    
    this.currentUserSubject.next(user);
    this.tokenSubject.next(token);
    
    console.log('✅ AuthService - Datos guardados:', { user, token: token.substring(0, 20) + '...' });
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    console.log('🗑️ AuthService - Sesión limpiada');
  }

  /**
   * Cargar usuario del localStorage
   */
  private loadUserFromStorage(): void {
    try {
      // Intentar cargar del formato antiguo primero
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.token) {
          this.currentUserSubject.next(currentUser);
          this.tokenSubject.next(currentUser.token);
          console.log('✅ AuthService - Usuario cargado desde currentUser');
          return;
        }
      }
      
      // Si no, cargar del formato nuevo
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (user && token) {
        const userData = JSON.parse(user);
        this.currentUserSubject.next(userData);
        this.tokenSubject.next(token);
        
        // Sincronizar con formato antiguo
        const currentUser = { ...userData, token };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('✅ AuthService - Usuario cargado desde user/token');
      }
    } catch (error) {
      console.error('❌ AuthService - Error loading user from storage:', error);
      this.clearAuthData();
    }
  }

  /**
   * Obtener headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}