import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  user_type: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8000/api/v1'}/users`;
  private phoneCache: Map<number, string | null> = new Map();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los datos de un usuario por ID
   * @param userId ID del usuario
   * @returns Observable con los datos del usuario
   */
  getUserById(userId: number): Observable<UserData> {
    // Verificar si está en caché
    if (this.phoneCache.has(userId)) {
      const cachedPhone = this.phoneCache.get(userId);
      return of({
        id: userId,
        first_name: '',
        last_name: '',
        email: '',
        phone_number: cachedPhone || null,
        user_type: '',
        is_active: true
      });
    }

    return this.http.get<{ success: boolean; data: UserData }>(
      `${this.apiUrl}/${userId}`
    ).pipe(
      map(response => {
        if (response.data && response.data.phone_number) {
          this.phoneCache.set(userId, response.data.phone_number);
        }
        return response.data;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo usuario:', error);
        return of({
          id: userId,
          first_name: '',
          last_name: '',
          email: '',
          phone_number: null,
          user_type: '',
          is_active: false
        });
      })
    );
  }

  /**
   * Obtiene solo el número de teléfono de un usuario
   * @param userId ID del usuario
   * @returns Observable con el número de teléfono
   */
  getUserPhoneNumber(userId: number): Observable<string | null> {
    // Verificar si está en caché
    if (this.phoneCache.has(userId)) {
      return of(this.phoneCache.get(userId) || null);
    }

    return this.http.get<{ success: boolean; data: UserData }>(
      `${this.apiUrl}/${userId}`
    ).pipe(
      map(response => {
        const phone = response.data?.phone_number || null;
        this.phoneCache.set(userId, phone);
        return phone;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo teléfono del usuario:', error);
        this.phoneCache.set(userId, null);
        return of(null);
      })
    );
  }

  /**
   * Limpia el caché de teléfonos
   */
  clearPhoneCache() {
    this.phoneCache.clear();
  }

  /**
   * Limpia el caché para un usuario específico
   */
  clearPhoneCacheForUser(userId: number) {
    this.phoneCache.delete(userId);
  }
}
