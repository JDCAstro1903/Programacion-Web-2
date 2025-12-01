import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface Payment {
  id: number;
  service_id: number;
  amount: number;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  platform_fee: number;
  nanny_amount: number;
  receipt_url?: string;
  payment_date?: string;
  created_at: string;
  nanny_first_name?: string;
  nanny_last_name?: string;
  start_date?: string;
  title?: string;
  service?: { name?: string; id?: number; title?: string };
  client_id?: number;
  nanny_id?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${ApiConfig.API_URL}/payments`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los pagos (admin)
   */
  getPayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/`);
  }

  /**
   * Obtener pagos del cliente autenticado
   */
  getClientPayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/client/my-payments`);
  }

  /**
   * Obtener un pago por ID
   */
  getPaymentById(paymentId: number): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${this.apiUrl}/${paymentId}`);
  }

  /**
   * Inicializar pago después de completar servicio
   */
  initializePayment(serviceId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/client/initialize`, {
      serviceId: serviceId
    });
  }

  /**
   * Subir comprobante de pago (por el cliente)
   */
  uploadPaymentReceipt(paymentId: number, file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('receipt', file);
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${paymentId}/receipt`,
      formData
    );
  }

  /**
   * Verificar/Aprobar o rechazar pago (por admin)
   */
  verifyPayment(paymentId: number, action: 'approve' | 'reject', notes?: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(
      `${this.apiUrl}/${paymentId}/verify`,
      { action, notes }
    );
  }

  /**
   * Obtener estadísticas de pagos (admin)
   */
  getPaymentStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`);
  }
}
