import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../shared/components/header/header.component';

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  meta?: {
    total: number;
    userId: string;
    unreadOnly: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8000/api/notifications';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las notificaciones de un usuario
   */
  getNotifications(userId: number, unreadOnly: boolean = false, limit: number = 50): Observable<NotificationResponse> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('limit', limit.toString());

    if (unreadOnly) {
      params = params.set('unread', 'true');
    }

    return this.http.get<NotificationResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener el conteo de notificaciones no leídas
   */
  getUnreadCount(userId: number): Observable<UnreadCountResponse> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`, { params });
  }

  /**
   * Obtener una notificación específica
   */
  getNotificationById(id: number): Observable<{ success: boolean; data: Notification }> {
    return this.http.get<{ success: boolean; data: Notification }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear una nueva notificación
   */
  createNotification(notification: {
    user_id: number;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'service' | 'payment';
    action_url?: string;
    related_id?: number;
    related_type?: string;
  }): Observable<NotificationActionResponse> {
    return this.http.post<NotificationActionResponse>(this.apiUrl, notification);
  }

  /**
   * Marcar una notificación como leída
   */
  markAsRead(notificationId: number): Observable<NotificationActionResponse> {
    return this.http.put<NotificationActionResponse>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  markAllAsRead(userId: number): Observable<NotificationActionResponse> {
    return this.http.put<NotificationActionResponse>(`${this.apiUrl}/read-all`, { userId });
  }

  /**
   * Eliminar una notificación
   */
  deleteNotification(notificationId: number): Observable<NotificationActionResponse> {
    return this.http.delete<NotificationActionResponse>(`${this.apiUrl}/${notificationId}`);
  }

  /**
   * Eliminar todas las notificaciones leídas de un usuario
   */
  clearReadNotifications(userId: number): Observable<NotificationActionResponse> {
    return this.http.delete<NotificationActionResponse>(`${this.apiUrl}/clear-read?userId=${userId}`);
  }
}
