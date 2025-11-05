import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClientInfo {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  is_verified: boolean;
  profile_image?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  number_of_children: number;
  special_requirements?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_date?: string;
  created_at: string;
  client_since: string;
}

export interface ClientServiceData {
  id: number;
  title: string;
  service_type: string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  total_hours?: number;
  total_amount?: number;
  number_of_children: number;
  special_instructions?: string;
  address?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  nanny?: {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    rating: number;
  };
  rating: {
    given: boolean;
    rating?: number;
    review?: string;
  };
}

export interface ClientPayment {
  id: number;
  service_id: number;
  service_title: string;
  service_date: string;
  service_time: string;
  amount: number;
  platform_fee: number;
  nanny_amount: number;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  payment_date?: string;
  receipt_url?: string;
  created_at: string;
  nanny?: {
    name: string;
  };
}

export interface ClientStats {
  services: {
    total: number;
    completed: number;
    pending: number;
  };
  financial: {
    total_spent: number;
    currency: string;
  };
  nannys: {
    unique_nannys_hired: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    status_filter: string;
    limit: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener información completa del cliente
   */
  getClientInfo(userId?: number): Observable<ApiResponse<ClientInfo>> {
    const params: any = {};
    if (userId) {
      params.userId = userId.toString();
    }
    return this.http.get<ApiResponse<ClientInfo>>(`${this.apiUrl}/info`, { params });
  }

  /**
   * Obtener servicios contratados
   */
  getClientServices(userId?: number, status: string = 'all', limit: number = 50): Observable<ApiResponse<ClientServiceData[]>> {
    const params: any = { limit: limit.toString() };
    
    if (userId) {
      params.userId = userId.toString();
    }
    
    if (status !== 'all') {
      params.status = status;
    }
    
    return this.http.get<ApiResponse<ClientServiceData[]>>(`${this.apiUrl}/services`, { params });
  }

  /**
   * Obtener historial de pagos
   */
  getClientPayments(userId?: number, status: string = 'all', limit: number = 50): Observable<ApiResponse<ClientPayment[]>> {
    const params: any = { limit: limit.toString() };
    
    if (userId) {
      params.userId = userId.toString();
    }
    
    if (status !== 'all') {
      params.status = status;
    }
    
    return this.http.get<ApiResponse<ClientPayment[]>>(`${this.apiUrl}/payments`, { params });
  }

  /**
   * Obtener estadísticas del cliente
   */
  getClientStats(userId?: number): Observable<ApiResponse<ClientStats>> {
    const params: any = {};
    
    if (userId) {
      params.userId = userId.toString();
    }
    
    return this.http.get<ApiResponse<ClientStats>>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Actualizar información de perfil del cliente
   */
  updateClientProfile(profileData: Partial<ClientInfo>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/profile`, profileData);
  }
}