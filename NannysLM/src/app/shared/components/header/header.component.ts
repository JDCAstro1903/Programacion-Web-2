import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface HeaderConfig {
  userType: 'admin' | 'client' | 'nanny';
  userName: string;
  userRole: string;
  userAvatar: string;
  showProfileOption?: boolean;
  showLogoutOption?: boolean;
  showNotifications?: boolean;
  unreadNotificationsCount?: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'service' | 'payment';
  is_read: boolean;
  action_url?: string;
  related_id?: number;
  related_type?: string;
  created_at: string;
  read_at?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnChanges {
  @Input() config!: HeaderConfig;
  @Input() notifications: Notification[] = [];
  @Output() onLogout = new EventEmitter<void>();
  @Output() onProfileClick = new EventEmitter<void>();
  @Output() onNotificationClick = new EventEmitter<Notification>();
  @Output() onMarkAllAsRead = new EventEmitter<void>();

  showUserMenu = false;
  showNotificationsMenu = false;
  private imageTimestamp: number = Date.now();

  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Actualizar timestamp solo cuando cambia el avatar
    if (changes['config'] && changes['config'].currentValue?.userAvatar !== changes['config'].previousValue?.userAvatar) {
      this.imageTimestamp = Date.now();
    }
  }

  getAvatarUrl(): string {
    console.log('🎨 getAvatarUrl llamado con:', this.config?.userAvatar);
    
    if (!this.config?.userAvatar) {
      console.log('❌ No hay userAvatar, usando logo por defecto');
      return '/assets/logo.png';
    }

    // Si ya es una URL completa
    if (this.config.userAvatar.startsWith('http')) {
      const url = `${this.config.userAvatar}?t=${this.imageTimestamp}`;
      console.log('🌐 URL completa detectada:', url);
      return url;
    }

    // Si es data:image (base64)
    if (this.config.userAvatar.startsWith('data:image')) {
      console.log('📸 Imagen base64 detectada');
      return this.config.userAvatar;
    }

    // Si empieza con /uploads/
    if (this.config.userAvatar.startsWith('/uploads/')) {
      const url = `http://localhost:8000${this.config.userAvatar}?t=${this.imageTimestamp}`;
      console.log('📁 Ruta /uploads/ detectada, URL construida:', url);
      return url;
    }

    // Si es solo el nombre del archivo
    if (this.config.userAvatar && !this.config.userAvatar.startsWith('/')) {
      const url = `http://localhost:8000/uploads/${this.config.userAvatar}?t=${this.imageTimestamp}`;
      console.log('📄 Solo nombre de archivo, URL construida:', url);
      return url;
    }

    // Caso por defecto
    console.log('⚠️ No coincide con ningún patrón, usando logo por defecto');
    return '/assets/logo.png';
  }

  toggleUserMenu() {
    console.log('Toggle menu clicked');
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotificationsMenu = false;
    }
  }

  closeUserMenu() {
    console.log('Closing menu');
    this.showUserMenu = false;
  }

  toggleNotificationsMenu() {
    console.log('Toggle notifications menu clicked');
    this.showNotificationsMenu = !this.showNotificationsMenu;
    if (this.showNotificationsMenu) {
      this.showUserMenu = false;
    }
  }

  closeNotificationsMenu() {
    console.log('Closing notifications menu');
    this.showNotificationsMenu = false;
  }

  handleNotificationClick(notification: Notification) {
    console.log('Notification clicked:', notification);
    this.onNotificationClick.emit(notification);
    this.closeNotificationsMenu();
  }

  markAllAsRead() {
    console.log('Mark all as read');
    this.onMarkAllAsRead.emit();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'service':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'payment':
        return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getNotificationTypeClass(type: string): string {
    return `notification-${type}`;
  }

  formatNotificationTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  goToProfile() {
    console.log('goToProfile called - Starting navigation');
    this.closeUserMenu();
    // Navegar a la vista de perfil genérica
    this.router.navigate(['/profile']).then(success => {
      console.log('Navigation to /profile result:', success);
      this.onProfileClick.emit();
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }

  logout() {
    console.log('logout called - Emitting logout event');
    this.closeUserMenu();
    this.onLogout.emit();
  }

  get headerClass(): string {
    switch (this.config.userType) {
      case 'admin':
        return 'admin-header';
      case 'client':
        return 'client-header';
      case 'nanny':
        return 'nanny-header';
      default:
        return 'admin-header';
    }
  }

  get panelText(): string {
    switch (this.config.userType) {
      case 'admin':
        return 'Panel de administrador';
      case 'client':
        return 'Panel de cliente';
      case 'nanny':
        return 'Panel de nanny';
      default:
        return 'Panel';
    }
  }
}
