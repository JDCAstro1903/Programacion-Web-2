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
  @Output() onLogout = new EventEmitter<void>();
  @Output() onProfileClick = new EventEmitter<void>();

  showUserMenu = false;
  private imageTimestamp: number = Date.now();

  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Actualizar timestamp solo cuando cambia el avatar
    if (changes['config'] && changes['config'].currentValue?.userAvatar !== changes['config'].previousValue?.userAvatar) {
      this.imageTimestamp = Date.now();
    }
  }

  getAvatarUrl(): string {
    if (!this.config?.userAvatar) {
      return '/assets/logo.png';
    }

    // Si ya es una URL completa
    if (this.config.userAvatar.startsWith('http')) {
      return `${this.config.userAvatar}?t=${this.imageTimestamp}`;
    }

    // Si es data:image (base64)
    if (this.config.userAvatar.startsWith('data:image')) {
      return this.config.userAvatar;
    }

    // Si empieza con /uploads/
    if (this.config.userAvatar.startsWith('/uploads/')) {
      return `http://localhost:8000${this.config.userAvatar}?t=${this.imageTimestamp}`;
    }

    // Si es solo el nombre del archivo
    if (this.config.userAvatar && !this.config.userAvatar.startsWith('/')) {
      return `http://localhost:8000/uploads/${this.config.userAvatar}?t=${this.imageTimestamp}`;
    }

    // Caso por defecto
    return '/assets/logo.png';
  }

  toggleUserMenu() {
    console.log('Toggle menu clicked');
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu() {
    console.log('Closing menu');
    this.showUserMenu = false;
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
