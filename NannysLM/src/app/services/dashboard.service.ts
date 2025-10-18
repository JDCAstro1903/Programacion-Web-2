import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  admin: {
    total: number;
  };
}

export interface Nanny {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  description?: string;
  rating: number;
  totalRatings: number;
  servicesCompleted: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
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
  createdAt: string;
  lastLogin?: string;
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
  private apiUrl = 'http://localhost:8000/api/v1/dashboard';

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
    return this.http.get<ApiResponse<Client[]>>(`${this.apiUrl}/clients`);
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