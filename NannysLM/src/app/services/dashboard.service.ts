import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface DashboardStats {
  nannys: {
    total: number;
    active: number;
    inactive: number;
    verified: number;
  };
  clients: {
    total: number;
    verified: number;
    unverified: number;
  };
  payments: {
    total: number;
    pending: number;
    completed: number;
  };
  admin: {
    total: number;
  };
}

export interface Nanny {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  is_verified: boolean;
  is_active: boolean;
  profile_image?: string;
  description?: string;
  experience_years: number;
  hourly_rate: number;
  rating_average: number;
  total_ratings: number;
  services_completed: number;
  status: 'active' | 'inactive' | 'suspended';
  is_available?: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  numberOfChildren: number;
  specialRequirements?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  identification_document?: string; // Documento de identificación subido
  createdAt: string;
  lastLogin?: string;
}

export interface Payment {
  id: number;
  serviceId: number;
  amount: number;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  platformFee: number;
  nannyAmount: number;
  paymentDate?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: number;
    name: string;
    email: string;
  };
  nanny: {
    id: number;
    name: string;
    email: string;
  };
  service: {
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    totalHours: number;
    status: string;
  };
}

export interface Service {
  id: number;
  client_id: number;
  nanny_id?: number;
  title: string;
  service_type: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  number_of_children: number;
  special_requirements?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  total_hours?: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  nanny?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${ApiConfig.API_URL}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener estadísticas generales del dashboard
   */
  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/stats`);
  }

  /**
   * Obtener todas las nannys
   */
  getNannys(): Observable<ApiResponse<Nanny[]>> {
    return this.http.get<ApiResponse<Nanny[]>>(`${this.apiUrl}/nannys`);
  }

  /**
   * Obtener todos los clientes
   */
  getClients(): Observable<ApiResponse<Client[]>> {
    return this.http.get<ApiResponse<Client[]>>(`${ApiConfig.API_URL}/client/all`);
  }

  /**
   * Obtener todos los pagos
   */
  getPayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${ApiConfig.API_URL}/payments`);
  }

  /**
   * Obtener todos los servicios/reservas
   */
  getServices(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${ApiConfig.API_URL}/services`);
  }

  /**
   * Obtener servicios de un cliente específico
   */
  getClientServices(clientId: number): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${ApiConfig.API_URL}/services?client_id=${clientId}`);
  }

  /**
   * Obtener usuarios con filtros
   */
  getUsers(userType?: string, isActive?: boolean, isVerified?: boolean): Observable<ApiResponse<any[]>> {
    let params = new URLSearchParams();
    
    if (userType) params.append('user_type', userType);
    if (isActive !== undefined) params.append('is_active', isActive.toString());
    if (isVerified !== undefined) params.append('is_verified', isVerified.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/users?${queryString}` : `${this.apiUrl}/users`;
    
    return this.http.get<ApiResponse<any[]>>(url);
  }
}