import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateNannyPayload {
  // Datos de users
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  password: string;
  
  // Datos de nannys
  description: string;
  experience_years: number;
  hourly_rate: number;
  status?: 'active' | 'inactive';
  
  // Datos de nanny_availability
  is_available?: boolean;
  reason?: string;
}

export interface NannyResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NannyService {
  private apiUrl = 'http://localhost:8000/api/v1/nannys';

  constructor(private http: HttpClient) {}

  /**
   * Crear una nueva nanny (SOLO ADMIN)
   */
  createNanny(nannyData: CreateNannyPayload): Observable<NannyResponse> {
    console.log('🧑‍💼 Enviando datos para crear nanny:', nannyData);
    return this.http.post<NannyResponse>(this.apiUrl, nannyData);
  }

  /**
   * Obtener todas las nannys
   */
  getAllNannys(): Observable<NannyResponse> {
    console.log('📋 Obteniendo todas las nannys');
    return this.http.get<NannyResponse>(this.apiUrl);
  }

  /**
   * Obtener una nanny específica
   */
  getNannyById(nannyId: number): Observable<NannyResponse> {
    console.log(`📋 Obteniendo nanny ${nannyId}`);
    return this.http.get<NannyResponse>(`${this.apiUrl}/${nannyId}`);
  }

  /**
   * Obtener servicios de una nanny específica
   */
  getNannyServices(nannyId: number): Observable<any> {
    const servicesUrl = 'http://localhost:8000/api/v1/services';
    console.log(`📋 Obteniendo servicios de la nanny ${nannyId}`);
    return this.http.get<any>(`${servicesUrl}?nannyId=${nannyId}`);
  }

  /**
   * Obtener información completa de la nanny actual (desde user_id)
   */
  getNannyByUserId(userId: number): Observable<NannyResponse> {
    console.log(`📋 Obteniendo nanny por user_id ${userId}`);
    return this.http.get<NannyResponse>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Obtener calificaciones de una nanny
   */
  getNannyRatings(nannyId: number): Observable<any> {
    const ratingsUrl = 'http://localhost:8000/api/v1/ratings';
    console.log(`⭐ Obteniendo ratings de la nanny ${nannyId}`);
    return this.http.get<any>(`${ratingsUrl}?nannyId=${nannyId}`);
  }

  /**
   * Cambiar el estado de una nanny
   */
  updateNannyStatus(nannyId: number, status: 'active' | 'inactive' | 'suspended'): Observable<NannyResponse> {
    console.log(`🔄 Actualizando status de nanny ${nannyId} a: ${status}`);
    return this.http.patch<NannyResponse>(`${this.apiUrl}/${nannyId}/status`, { status });
  }
}
