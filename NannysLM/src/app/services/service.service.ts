import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

// Interfaz para la respuesta de la API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Interfaz para los datos de un servicio
export interface ServiceData {
  id?: number;
  client_id: number;
  nanny_id?: number;
  title: string;
  service_type: 'hourly' | 'daily' | 'weekly' | 'overnight' | 'event' | 'travel';
  description?: string;
  start_date: string; // formato: YYYY-MM-DD
  end_date?: string; // formato: YYYY-MM-DD
  start_time: string; // formato: HH:MM
  end_time: string; // formato: HH:MM
  total_hours?: number;
  total_amount?: number;
  number_of_children?: number;
  special_instructions?: string;
  address?: string;
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  // Datos adicionales del join con usuarios
  client_user_id?: number;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  client_phone?: string;
  nanny_user_id?: number;
  nanny_first_name?: string;
  nanny_last_name?: string;
  nanny_email?: string;
  nanny_phone?: string;
  nanny_rating?: number;
  nanny_rate?: number;
}

// Interfaz para datos de disponibilidad de nanny
export interface NannyAvailability {
  nanny_id: number;
  rating_average: number;
  hourly_rate: number;
  first_name: string;
  last_name: string;
  profile_image: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// Interfaz para la respuesta de creación de servicio
export interface CreateServiceResponse {
  serviceId: number;
  nannyAssigned: {
    id: number;
    name: string;
    rating: number;
  };
  totalHours: number;
  totalAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = `${ApiConfig.API_URL}/services`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener servicios filtrados
   * @param clientId - ID del cliente (opcional)
   * @param status - Estado del servicio (opcional)
   * @param limit - Límite de resultados (default: 100)
   */
  getServices(clientId?: number, status?: string, limit: number = 100): Observable<ApiResponse<ServiceData[]>> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (clientId) {
      params = params.set('clientId', clientId.toString());
    }
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<ApiResponse<ServiceData[]>>(this.apiUrl, { params });
  }

  /**
   * Obtener un servicio específico por ID
   * @param serviceId - ID del servicio
   */
  getServiceById(serviceId: number): Observable<ApiResponse<ServiceData>> {
    return this.http.get<ApiResponse<ServiceData>>(`${this.apiUrl}/${serviceId}`);
  }

  /**
   * Crear un nuevo servicio con asignación automática de nanny
   * @param serviceData - Datos del servicio a crear
   */
  createService(serviceData: ServiceData): Observable<ApiResponse<CreateServiceResponse>> {
    return this.http.post<ApiResponse<CreateServiceResponse>>(this.apiUrl, serviceData);
  }

  /**
   * Actualizar un servicio existente
   * @param serviceId - ID del servicio
   * @param updates - Campos a actualizar
   */
  updateService(serviceId: number, updates: Partial<ServiceData>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${serviceId}`, updates);
  }

  /**
   * Cancelar/eliminar un servicio
   * @param serviceId - ID del servicio
   * @param permanentDelete - Si es true, elimina completamente de la BD (para cambio de fecha)
   */
  deleteService(serviceId: number, permanentDelete: boolean = false): Observable<ApiResponse<any>> {
    const params = permanentDelete ? new HttpParams().set('permanentDelete', 'true') : new HttpParams();
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${serviceId}`, { params });
  }

  /**
   * Obtener disponibilidad de nannys para un rango de fechas
   * @param startDate - Fecha de inicio (YYYY-MM-DD)
   * @param startTime - Hora de inicio (HH:MM)
   * @param endTime - Hora de fin (HH:MM)
   * @param endDate - Fecha de fin (opcional, YYYY-MM-DD)
   */
  getNannyAvailability(
    startDate: string, 
    startTime: string, 
    endTime: string, 
    endDate?: string
  ): Observable<ApiResponse<NannyAvailability[]>> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('startTime', startTime)
      .set('endTime', endTime);
    
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    
    return this.http.get<ApiResponse<NannyAvailability[]>>(`${this.apiUrl}/availability`, { params });
  }

  /**
   * Formatear fecha a formato YYYY-MM-DD
   * @param date - Objeto Date
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtener nombre del tipo de servicio en español
   */
  getServiceTypeName(type: string): string {
    const types: { [key: string]: string } = {
      'hourly': 'Niñeras a domicilio',
      'daily': 'Niñeras por día',
      'weekly': 'Niñeras por semana',
      'overnight': 'Niñeras nocturnas',
      'event': 'Acompañamiento a eventos',
      'travel': 'Acompañamiento en viajes'
    };
    return types[type] || type;
  }

  /**
   * Obtener código de tipo de servicio desde el nombre
   */
  getServiceTypeCode(name: string): string {
    const codes: { [key: string]: string } = {
      'Niñeras a domicilio': 'hourly',
      'Niñeras por día': 'daily',
      'Niñeras por semana': 'weekly',
      'Niñeras nocturnas': 'overnight',
      'Acompañamiento a eventos': 'event',
      'Acompañamiento en viajes': 'travel'
    };
    return codes[name] || 'hourly';
  }

  /**
   * Aceptar un servicio por parte de una nanny
   * @param serviceId - ID del servicio
   * @param nannyId - ID de la nanny que acepta
   */
  acceptService(serviceId: number, nannyId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${serviceId}/accept`, { nanny_id: nannyId });
  }

  /**
   * Completar un servicio (marcar como finalizado)
   * @param serviceId - ID del servicio a completar
   */
  completeService(serviceId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${serviceId}/complete`, {});
  }

  /**
   * Obtener servicios disponibles (pending) para que las nannys puedan aceptar
   */
  getAvailableServices(): Observable<ApiResponse<ServiceData[]>> {
    return this.getServices(undefined, 'pending', 50);
  }
}
