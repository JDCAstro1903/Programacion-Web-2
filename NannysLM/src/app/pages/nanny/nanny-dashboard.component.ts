import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent, HeaderConfig } from '../../shared/components/header/header.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';

// Interfaz para definir la estructura de un servicio
interface Service {
  id: number;
  date: string;
  dateDisplay: string;
  time: string;
  client: string;
  location: string;
  instructions: string;
  status: 'upcoming' | 'completed';
  rating?: number; // Opcional, solo para servicios completados
}

@Component({
  selector: 'app-nanny-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, LogoutModalComponent],
  templateUrl: './nanny-dashboard.component.html',
  styleUrl: './nanny-dashboard.component.css'
})
export class NannyDashboardComponent implements OnInit {
  // Vista actual del dashboard
  currentView: string = 'dashboard';
  
  // Filtro actual en la vista de servicios
  currentServiceFilter: string = 'upcoming'; // 'upcoming' o 'past'
  
  // Configuración del sidebar
  sidebarConfig: SidebarConfig;
  
  // Configuración del header
  headerConfig: HeaderConfig;
  
  // Estado del modal de logout
  showLogoutModal: boolean = false;

  // Datos del usuario nanny
  currentUser = {
    name: 'Usuario 1',
    role: 'nanny',
    avatar: '/assets/logo.png'
  };

  // Estadísticas de la nanny
  stats = {
    rating: 4.5,
    totalServices: 24,
    upcomingServices: 1
  };

  // Próximo servicio
  nextService = {
    date: '2 de marzo',
    time: '9:00 pm - 3:00 am',
    client: 'Pito Perez Peraza',
    location: 'Calle las granjas, Colonia Alamos Country',
    instructions: 'se deben dormir temprano'
  };

  // Lista de servicios
  services: {
    upcoming: Service[];
    past: Service[];
  } = {
    upcoming: [
      {
        id: 1,
        date: '2024-03-02',
        dateDisplay: '2 de Marzo',
        time: '9:00 pm - 3:00 am',
        client: 'Pito Perez Peraza',
        location: 'Calle las granjas, Colonia Alamos Country',
        instructions: 'se deben dormir temprano',
        status: 'upcoming'
        // No incluimos rating para servicios futuros
      }
    ],
    past: [
      {
        id: 2,
        date: '2024-02-28',
        dateDisplay: '28 de Febrero',
        time: '7:00 pm - 11:00 pm',
        client: 'María García López',
        location: 'Av. Reforma 123, Col. Centro',
        instructions: 'Ayuda con la tarea de matemáticas',
        status: 'completed',
        rating: 5
      },
      {
        id: 3,
        date: '2024-02-25',
        dateDisplay: '25 de Febrero',
        time: '2:00 pm - 6:00 pm',
        client: 'Carlos Mendoza',
        location: 'Calle Independencia 456',
        instructions: 'Preparar merienda saludable',
        status: 'completed',
        rating: 4
      }
    ]
  };

  constructor(
    private userConfigService: UserConfigService, 
    private router: Router,
    private authService: AuthService
  ) {
    // Configurar sidebar específico para nanny con tema rosa como el admin
    this.sidebarConfig = {
      userType: 'admin', // Usar tema admin (rosa) para nanny también
      items: [
        {
          id: 'dashboard',
          label: 'Inicio',
          icon: 'home'
        },
        {
          id: 'services',
          label: 'Servicios',
          icon: 'calendar'
        }
      ]
    };

    // Configurar header genérico
    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Niñera';
    
    console.log('🔍 Nanny Constructor - currentUser completo:', currentUser);
    console.log('🔍 Nanny Constructor - currentUser.profile_image:', currentUser?.profile_image);
    
    // Obtener la imagen de perfil con prioridad:
    // 1. Del localStorage (más reciente)
    // 2. Del objeto currentUser en memoria
    // 3. Logo por defecto
    let userAvatar = '/assets/logo.png';
    
    // Verificar localStorage primero
    const storedUser = localStorage.getItem('currentUser');
    console.log('🔍 Nanny Constructor - storedUser en localStorage:', storedUser ? 'existe' : 'no existe');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔍 Nanny Constructor - parsedUser:', parsedUser);
        console.log('🔍 Nanny Constructor - parsedUser.profile_image:', parsedUser.profile_image);
        
        if (parsedUser.profile_image) {
          userAvatar = parsedUser.profile_image;
          console.log('🖼️ Nanny Avatar desde localStorage:', userAvatar);
        }
      } catch (e) {
        console.error('Error parseando usuario de localStorage:', e);
      }
    }
    
    // Si no hay en localStorage, usar del currentUser
    if (userAvatar === '/assets/logo.png' && currentUser?.profile_image) {
      userAvatar = currentUser.profile_image;
      console.log('🖼️ Nanny Avatar desde currentUser:', userAvatar);
    }
    
    console.log('👤 Nanny Usuario actual completo:', currentUser);
    console.log('📸 Nanny Avatar final seleccionado:', userAvatar);
    
    this.headerConfig = {
      userType: 'nanny',
      userName: userName || 'Niñera',
      userRole: 'Niñera',
      userAvatar: userAvatar,
      showProfileOption: true,
      showLogoutOption: true
    };
    
    console.log('✅ Nanny headerConfig final:', this.headerConfig);
  }

  ngOnInit() {
    // Actualizar contadores en el sidebar si es necesario
    this.updateSidebarCounts();
  }

  private updateSidebarCounts() {
    // Actualizar contadores para servicios usando tema admin para nanny
    this.userConfigService.updateSidebarItemCount('admin', 'services', 
      this.services.upcoming.length + this.services.past.length);
  }

  // Métodos de navegación
  setCurrentView(view: string) {
    this.currentView = view;
  }

  onViewChange(view: string) {
    this.setCurrentView(view);
  }

  onSidebarLogout() {
    this.openLogoutModal();
  }

  // Métodos para manejar eventos del header
  onHeaderLogout() {
    this.openLogoutModal();
  }

  onHeaderProfileClick() {
    console.log('Navegando a perfil...');
  }

  // Métodos para el modal de logout
  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.router.navigate(['/']);
    console.log('Nanny cerró sesión');
  }

  // Métodos para manejar servicios
  getUpcomingServices(): Service[] {
    return this.services.upcoming;
  }

  getPastServices(): Service[] {
    return this.services.past;
  }

  // Métodos para manejar filtros de servicios
  setServiceFilter(filter: string) {
    this.currentServiceFilter = filter;
  }

  getFilteredServices(): Service[] {
    if (this.currentServiceFilter === 'upcoming') {
      return this.services.upcoming;
    } else {
      return this.services.past;
    }
  }

  isServiceFilterActive(filter: string): boolean {
    return this.currentServiceFilter === filter;
  }

  viewClientProfile(clientName: string) {
    console.log('Ver perfil del cliente:', clientName);
    // Aquí se puede implementar la navegación al perfil del cliente
  }

  getMoreInfo(serviceId: number) {
    console.log('Más información del servicio:', serviceId);
    // Aquí se puede implementar la vista detallada del servicio
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getRatingText(rating: number): string {
    switch (rating) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return 'Excelente';
      default: return 'Sin calificar';
    }
  }
}