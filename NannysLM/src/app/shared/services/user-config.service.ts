import { Injectable } from '@angular/core';
import { SidebarConfig } from '../components/sidebar/sidebar.component';

export interface UserConfig {
  userType: 'admin' | 'client' | 'nanny';
  sidebarConfig: SidebarConfig;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserConfigService {

  private configs: { [key: string]: UserConfig } = {
    admin: {
      userType: 'admin',
      themeColors: {
        primary: '#E31B7E',
        secondary: '#049BD7',
        accent: '#FFE2ED'
      },
      permissions: ['manage_nannys', 'manage_clients', 'manage_payments', 'view_dashboard'],
      sidebarConfig: {
        userType: 'admin',
        showLogout: true,
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard'
          },
          {
            id: 'nannys',
            label: 'Nannys',
            icon: 'baby'
          },
          {
            id: 'clients',
            label: 'Clientes',
            icon: 'users'
          },
          {
            id: 'payments',
            label: 'Pagos',
            icon: 'dollar-sign'
          },
          {
            id: 'datos-bancarios',
            label: 'Datos Bancarios',
            icon: 'credit-card'
          }
        ]
      }
    },
    
    client: {
      userType: 'client',
      themeColors: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        accent: '#dbeafe'
      },
      permissions: ['view_nannys', 'book_services', 'manage_profile', 'view_history'],
      sidebarConfig: {
        userType: 'client',
        showLogout: true,
        items: [
          {
            id: 'dashboard',
            label: 'Inicio',
            icon: 'dashboard'
          },
          {
            id: 'search',
            label: 'Buscar Nannys',
            icon: 'search'
          },
          {
            id: 'favorites',
            label: 'Favoritas',
            icon: 'heart'
          },
          {
            id: 'bookings',
            label: 'Reservas',
            icon: 'calendar'
          },
          {
            id: 'history',
            label: 'Historial',
            icon: 'briefcase'
          },
          {
            id: 'profile',
            label: 'Mi Perfil',
            icon: 'clients'
          }
        ]
      }
    },
    
    nanny: {
      userType: 'nanny',
      themeColors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#d1fae5'
      },
      permissions: ['manage_availability', 'view_bookings', 'manage_profile', 'view_earnings'],
      sidebarConfig: {
        userType: 'nanny',
        showLogout: true,
        items: [
          {
            id: 'dashboard',
            label: 'Mi Dashboard',
            icon: 'home'
          },
          {
            id: 'availability',
            label: 'Disponibilidad',
            icon: 'calendar'
          },
          {
            id: 'bookings',
            label: 'Reservas',
            icon: 'calendar'
          },
          {
            id: 'clients',
            label: 'Mis Clientes',
            icon: 'users'
          },
          {
            id: 'earnings',
            label: 'Ganancias',
            icon: 'dollar-sign'
          },
          {
            id: 'profile',
            label: 'Mi Perfil',
            icon: 'user'
          }
        ]
      }
    }
  };

  getCurrentUserConfig(userType: 'admin' | 'client' | 'nanny'): UserConfig {
    return this.configs[userType];
  }

  hasPermission(userType: 'admin' | 'client' | 'nanny', permission: string): boolean {
    const config = this.getCurrentUserConfig(userType);
    return config.permissions.includes(permission);
  }

  updateSidebarItemCount(userType: 'admin' | 'client' | 'nanny', itemId: string, count: number): void {
    const config = this.configs[userType];
    const item = config.sidebarConfig.items.find(item => item.id === itemId);
    if (item) {
      item.count = count;
    }
  }

  getSidebarConfig(userType: 'admin' | 'client' | 'nanny'): SidebarConfig {
    return this.getCurrentUserConfig(userType).sidebarConfig;
  }
}