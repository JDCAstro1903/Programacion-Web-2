import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface BankDetail {
  id: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  clabe?: string;
  accountType: 'checking' | 'savings';
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankDetailRequest {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  clabe?: string;
  accountType?: 'checking' | 'savings';
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateBankDetailRequest {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  clabe?: string;
  accountType: 'checking' | 'savings';
  isPrimary: boolean;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BankDetailsService {
  private apiUrl = ApiConfig.BANK_DETAILS_URL;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los datos bancarios
   */
  getBankDetails(): Observable<ApiResponse<BankDetail[]>> {
    return this.http.get<ApiResponse<BankDetail[]>>(this.apiUrl);
  }

  /**
   * Obtener datos bancarios por ID
   */
  getBankDetailById(id: number): Observable<ApiResponse<BankDetail>> {
    return this.http.get<ApiResponse<BankDetail>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevos datos bancarios
   */
  createBankDetails(data: CreateBankDetailRequest): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(this.apiUrl, data);
  }

  /**
   * Actualizar datos bancarios
   */
  updateBankDetails(id: number, data: UpdateBankDetailRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Eliminar datos bancarios
   */
  deleteBankDetails(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Alternar estado activo/inactivo
   */
  toggleActiveStatus(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
