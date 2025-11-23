import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../header/header.component';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.css'
})
export class NotificationsPanelComponent implements OnInit {
  @Input() title: string = 'Notificaciones';
  @Input() showHeader: boolean = true;
  @Input() showFilters: boolean = true;
  @Output() notificationClicked = new EventEmitter<Notification>();

  notifications: Notification[] = [];
  isLoadingNotifications = false;
  notificationsView: 'all' | 'unread' = 'unread';

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoadingNotifications = true;
    console.log('[NotificationsPanel] Cargando notificaciones...');
    
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        if (notifications && Array.isArray(notifications)) {
          this.notifications = notifications;
          console.log(`[NotificationsPanel] ${this.notifications.length} notificaciones cargadas`);
        } else {
          console.warn('[NotificationsPanel] Sin notificaciones');
          this.notifications = [];
        }
        this.isLoadingNotifications = false;
      },
      error: (error) => {
        console.error('[NotificationsPanel] Error al cargar notificaciones:', error);
        this.notifications = [];
        this.isLoadingNotifications = false;
      }
    });
  }

  getFilteredNotifications(): Notification[] {
    if (this.notificationsView === 'unread') {
      return this.notifications.filter(n => !n.is_read);
    }
    return this.notifications;
  }

  handleNotificationClick(notification: Notification) {
    const timestamp = new Date().toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    console.group(`[NotificationsPanel] Notificación clickeada [${timestamp}]`);
    console.log('ID:', notification.id);
    console.log('Título:', notification.title);
    console.log('Mensaje:', notification.message);
    console.log('Tipo:', notification.type);
    console.log('URL de Acción:', notification.action_url);
    console.log('Leída:', notification.is_read);
    console.groupEnd();
    
    // Emitir evento para padre
    this.notificationClicked.emit(notification);
    
    // Marcar como leída si no está leída
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          console.log(`[NotificationsPanel] Notificación ${notification.id} marcada como leída`);
          notification.is_read = true;
        },
        error: (error) => {
          console.error('[NotificationsPanel] Error al marcar como leída:', error);
        }
      });
    }
    
    // Navegar a la URL de acción si existe
    if (notification.action_url && notification.action_url.trim() !== '' && notification.action_url !== '/') {
      this.router.navigate([notification.action_url]);
    }
  }

  markNotificationAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.is_read = true;
          console.log(`[NotificationsPanel] Notificación ${notification.id} marcada como leída`);
        },
        error: (error) => {
          console.error('[NotificationsPanel] Error:', error);
        }
      });
    }
  }

  deleteNotification(notificationId: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta notificación?')) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      console.log(`[NotificationsPanel] Notificación ${notificationId} eliminada`);
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
      default:
        return '#3b82f6';
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  getTotalCount(): number {
    return this.notifications.length;
  }

  onNotificationMouseEnter(element: HTMLElement): void {
    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  }

  onNotificationMouseLeave(element: HTMLElement): void {
    element.style.boxShadow = 'none';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
