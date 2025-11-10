import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Notification } from '../shared/components/header/header.component';

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message?: string;
  count?: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  affectedRows?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8000/api/v1/notifications';
  
  // BehaviorSubject para mantener las notificaciones en memoria
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  // Suscripción al polling (para limpiarla después)
  private pollingSubscription: any = null;

  constructor(private http: HttpClient) {
    console.log('🔔 NotificationService inicializado con endpoint:', this.apiUrl);
  }

  /**
   * Obtener todas las notificaciones del usuario autenticado
   */
  getNotifications(): Observable<Notification[]> {
    console.log('📋 Obteniendo notificaciones...');
    
    return this.http.get<NotificationResponse>(this.apiUrl).pipe(
      tap((response) => {
        console.log(`✅ Se obtuvieron ${response.data?.length || 0} notificaciones`);
        if (response.data) {
          this.notificationsSubject.next(response.data);
        }
      }),
      switchMap((response) => of(response.data || [])),
      catchError((error) => {
        console.error('❌ Error al obtener notificaciones:', error);
        return of([]);
      })
    );
  }

  /**
   * Marcar una notificación específica como leída
   */
  markAsRead(notificationId: number): Observable<NotificationActionResponse> {
    console.log(`📖 Marcando notificación ${notificationId} como leída...`);
    
    return this.http.put<NotificationActionResponse>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap((response) => {
        console.log(`✅ Notificación ${notificationId} marcada como leída`);
        
        // Actualizar en el BehaviorSubject
        const currentNotifications = this.notificationsSubject.value;
        const updated = currentNotifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        this.notificationsSubject.next(updated);
      }),
      catchError((error) => {
        console.error('❌ Error al marcar como leída:', error);
        return of({ success: false, message: 'Error' });
      })
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<NotificationActionResponse> {
    console.log('📖 Marcando todas las notificaciones como leídas...');
    
    return this.http.put<NotificationActionResponse>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap((response) => {
        console.log('✅ Todas las notificaciones marcadas como leídas');
        
        // Actualizar en el BehaviorSubject
        const currentNotifications = this.notificationsSubject.value;
        const updated = currentNotifications.map(n => ({ ...n, is_read: true }));
        this.notificationsSubject.next(updated);
      }),
      catchError((error) => {
        console.error('❌ Error al marcar todas como leídas:', error);
        return of({ success: false, message: 'Error' });
      })
    );
  }

  /**
   * Eliminar una notificación
   */
  deleteNotification(notificationId: number): Observable<NotificationActionResponse> {
    console.log(`🗑️ Eliminando notificación ${notificationId}...`);
    
    return this.http.delete<NotificationActionResponse>(`${this.apiUrl}/${notificationId}`).pipe(
      tap((response) => {
        console.log(`✅ Notificación ${notificationId} eliminada`);
        
        // Actualizar en el BehaviorSubject
        const currentNotifications = this.notificationsSubject.value;
        const updated = currentNotifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updated);
      }),
      catchError((error) => {
        console.error('❌ Error al eliminar notificación:', error);
        return of({ success: false, message: 'Error' });
      })
    );
  }

  /**
   * Obtener el número de notificaciones sin leer
   */
  getUnreadCount(): number {
    const notifications = this.notificationsSubject.value;
    return notifications.filter(n => !n.is_read).length;
  }

  /**
   * Obtener observador del conteo de notificaciones sin leer
   */
  getUnreadCount$(): Observable<number> {
    return this.notifications$.pipe(
      switchMap((notifications) => of(notifications.filter(n => !n.is_read).length))
    );
  }

  /**
   * Iniciar polling automático de notificaciones
   * @param intervalMs Intervalo en milisegundos (default: 30000 = 30 segundos)
   */
  startPolling(intervalMs: number = 30000): void {
    console.log(`⏱️ Iniciando polling de notificaciones cada ${intervalMs}ms`);
    
    this.pollingSubscription = interval(intervalMs)
      .pipe(
        switchMap(() => this.getNotifications())
      )
      .subscribe({
        next: (notifications) => {
          console.log(`✅ Polling completado: ${notifications.length} notificaciones`);
        },
        error: (error) => {
          console.error('❌ Error en polling de notificaciones:', error);
        }
      });
  }

  /**
   * Detener el polling automático
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      console.log('⏹️ Deteniendo polling de notificaciones');
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Obtener notificaciones actuales del BehaviorSubject
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }
}
