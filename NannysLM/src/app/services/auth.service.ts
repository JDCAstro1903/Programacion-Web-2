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
   * Solicitar restablecimiento de contraseña (envía email con enlace)
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  /**
   * Restablecer contraseña usando token recibido por email
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, password });
  }

  /**
   * Registrar nuevo usuario
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    // Registration should not automatically log the user in (activation via email required).
    // The backend returns a simple success message after creating the user and sending the activation link.
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
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
    // Decidir almacenamiento según la preferencia de "rememberUser"
    // Si el usuario eligió "recordarme" se guardará en localStorage, en otro caso en sessionStorage.
    const remember = localStorage.getItem('rememberUser') === 'true';
    const storage: Storage = remember ? localStorage : sessionStorage;

    const currentUser = { ...user, token };
    storage.setItem('currentUser', JSON.stringify(currentUser));
    storage.setItem('user', JSON.stringify(user));
    storage.setItem('token', token);

    // Para compatibilidad también limpiar el otro storage para evitar inconsistencias
    const otherStorage: Storage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('currentUser');
    otherStorage.removeItem('user');
    otherStorage.removeItem('token');

    this.currentUserSubject.next(user);
    this.tokenSubject.next(token);

    console.log('✅ AuthService - Datos guardados (remember=' + remember + ')', { user, token: token.substring(0, 20) + '...' });
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    // Limpiar tanto localStorage como sessionStorage para cubrir ambos casos
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    // También eliminar la bandera de "rememberUser" para evitar confusiones
    localStorage.removeItem('rememberUser');

    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    console.log('🗑️ AuthService - Sesión limpiada (storages cleared)');
  }

  /**
   * Cargar usuario del localStorage
   */
  private loadUserFromStorage(): void {
    try {
      // Preferir sessionStorage (sesión sin "recordarme") y si no existe usar localStorage
      const storages: Storage[] = [sessionStorage, localStorage];

      for (const storage of storages) {
        const currentUserStr = storage.getItem('currentUser');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser && currentUser.token) {
            this.currentUserSubject.next(currentUser);
            this.tokenSubject.next(currentUser.token);
            console.log('✅ AuthService - Usuario cargado desde ' + (storage === sessionStorage ? 'sessionStorage' : 'localStorage'));
            // Actualizar perfil desde el backend para obtener datos frescos (incluyendo profile_image)
            this.refreshUserProfile();
            return;
          }
        }

        const userStr = storage.getItem('user');
        const token = storage.getItem('token');
        if (userStr && token) {
          const userData = JSON.parse(userStr);
          this.currentUserSubject.next(userData);
          this.tokenSubject.next(token);
          // Sincronizar currentUser en el mismo storage
          const currentUser = { ...userData, token };
          storage.setItem('currentUser', JSON.stringify(currentUser));
          console.log('✅ AuthService - Usuario cargado desde ' + (storage === sessionStorage ? 'sessionStorage' : 'localStorage') + ' (user/token)');
          return;
        }
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

  /**
   * Refrescar perfil del usuario desde el backend
   */
  private refreshUserProfile(): void {
    this.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data.user_data) {
          const updatedUser = response.data.user_data;
          const currentToken = this.getToken();
          
          // Actualizar en memoria y localStorage
          if (currentToken) {
            this.setAuthData(updatedUser, currentToken);
            console.log('✅ AuthService - Perfil actualizado con profile_image:', updatedUser.profile_image);
          }
        }
      },
      error: (error) => {
        console.error('❌ AuthService - Error refrescando perfil:', error);
      }
    });
  }
}