import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent, HeaderConfig } from '../../shared/components/header/header.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../shared/components/header/header.component';
import { NannyService } from '../../services/nanny.service';
import { NotificationsPanelComponent } from '../../shared/components/notifications-panel/notifications-panel.component';
import { ClientService } from '../../services/client.service';

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
  client_user_id?: number; // ID del usuario cliente para obtener su perfil
}

@Component({
  selector: 'app-nanny-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, LogoutModalComponent, NotificationsPanelComponent],
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

  // Estado del modal de cliente
  showClientModal: boolean = false;
  selectedClient: any = null;
  isLoadingClientData: boolean = false;

  // Notificaciones
  notifications: Notification[] = [];
  unreadNotificationsCount: number = 0;

  // Datos del usuario nanny
  currentUser = {
    name: 'Usuario 1',
    role: 'nanny',
    avatar: '/assets/logo.png'
  };

  // Datos reales de la nanny
  nannyData: any = null;
  nannyId: number | null = null;

  // Estadísticas de la nanny
  stats = {
    rating: 0,
    totalServices: 0,
    upcomingServices: 0
  };

  // Próximo servicio
  nextService: any = null;

  // Estados de carga
  isLoadingNannyData = false;
  isLoadingServices = false;
  loadError: string | null = null;

  // Exponer Math para el template
  Math = Math;

  // Lista de servicios (se cargarán desde la BD)
  services: {
    upcoming: Service[];
    past: Service[];
  } = {
    upcoming: [],
    past: []
  };

  constructor(
    private userConfigService: UserConfigService, 
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private nannyService: NannyService,
    private clientService: ClientService
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
        },
        {
          id: 'notificaciones',
          label: 'Notificaciones',
          icon: 'bell'
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
    // Cargar datos de la nanny
    this.loadNannyData();
    
    // Cargar notificaciones
    this.loadNotifications();
    
    // Iniciar polling de notificaciones cada 30 segundos
    this.notificationService.startPolling();
    
    // Suscribirse a cambios en notificaciones
    this.notificationService.notifications$.subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
        console.log('📬 Notificaciones actualizadas:', this.notifications.length, 'No leídas:', this.unreadNotificationsCount);
      },
      error: (error) => {
        console.error('❌ Error en suscripción de notificaciones:', error);
      }
    });
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
    const service = this.services.upcoming.find(s => s.client === clientName) || 
                   this.services.past.find(s => s.client === clientName);
    
    if (service) {
      // Inicializar con datos del servicio
      this.selectedClient = { ...service };
      this.showClientModal = true;
      console.log('Abriendo modal del cliente:', clientName, service);
      
      // Cargar datos completos del cliente incluyendo la imagen de perfil
      this.loadClientProfileImage(clientName);
    }
  }

  private loadClientProfileImage(clientName: string) {
    // Buscar el servicio que contiene información del cliente
    const service = this.services.upcoming.find(s => s.client === clientName) || 
                   this.services.past.find(s => s.client === clientName);
    
    if (!service || !service.client_user_id) {
      console.warn('⚠️ No se encontró información del cliente');
      this.isLoadingClientData = false;
      return;
    }

    // Mostrar que estamos cargando
    this.isLoadingClientData = true;
    console.log('🔍 Cargando información del cliente, user_id:', service.client_user_id);

    // Cargar información completa del cliente incluyendo la imagen de perfil
    this.clientService.getClientInfo(service.client_user_id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ Información del cliente cargada:', response.data);
          
          // Actualizar el cliente seleccionado con los datos completos incluyendo la imagen
          this.selectedClient = {
            ...this.selectedClient,
            profileImage: this.getClientProfileImageUrl(response.data.profile_image),
            phone: response.data.phone_number,
            email: response.data.email,
            emergencyContact: response.data.emergency_contact_name,
            emergencyPhone: response.data.emergency_contact_phone
          };
          
          console.log('📸 Imagen de perfil del cliente:', this.selectedClient.profileImage);
        }
        this.isLoadingClientData = false;
      },
      error: (error) => {
        console.error('❌ Error cargando información del cliente:', error);
        this.isLoadingClientData = false;
      }
    });
  }

  private getClientProfileImageUrl(profileImage?: string): string {
    if (!profileImage) {
      return '/assets/logo.png';
    }

    // Si la imagen ya es una URL completa, usarla tal como está
    if (profileImage.startsWith('http')) {
      return profileImage;
    }

    // Si ya incluye /uploads/, solo agregar el host
    if (profileImage.startsWith('/uploads/')) {
      return `http://localhost:8000${profileImage}`;
    }

    // Si es solo el nombre del archivo, construir la URL completa
    return `http://localhost:8000/uploads/${profileImage}`;
  }

  closeClientModal() {
    this.showClientModal = false;
    this.selectedClient = null;
  }

  getMoreInfo(serviceId: number) {
    const service = this.services.upcoming.find(s => s.id === serviceId);
    
    if (service) {
      console.log('Navegando a detalles del servicio:', serviceId);
      this.router.navigate(['/nanny/service-details', serviceId]);
    }
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

  // Métodos para cargar datos reales
  loadNannyData() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('❌ No hay usuario logueado');
      // Aunque no haya datos, permitir que el componente se muestre
      return;
    }

    this.isLoadingNannyData = true;
    console.log('📥 Cargando datos de nanny para user_id:', currentUser.id);

    this.nannyService.getNannyByUserId(currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.nannyData = response.data;
          this.nannyId = response.data.id;
          
          console.log('✅ Respuesta completa de nanny:', response);
          console.log('✅ Nanny ID obtenido:', this.nannyId);
          
          // Actualizar estadísticas
          this.stats = {
            rating: parseFloat(response.data.rating_average) || 0,
            totalServices: response.data.services_completed || 0,
            upcomingServices: 0 // Se actualizará con los servicios
          };

          console.log('✅ Datos de nanny cargados:', this.nannyData);
          console.log('✅ Stats actualizadas:', this.stats);
          
          // Cargar servicios
          this.loadNannyServices();
        } else {
          console.warn('⚠️ No se encontraron datos de nanny');
          console.warn('Respuesta:', response);
        }
        this.isLoadingNannyData = false;
      },
      error: (error) => {
        console.error('❌ Error cargando datos de nanny:', error);
        console.error('Detalles del error:', error.message || error);
        console.error('Status:', error.status);
        
        // Establecer mensaje de error
        if (error.status === 0) {
          this.loadError = 'No se puede conectar al servidor. Asegúrate de que el backend esté corriendo.';
        } else if (error.status === 404) {
          this.loadError = 'No se encontró perfil de nanny para este usuario. Contacta al administrador.';
        } else {
          this.loadError = `Error cargando datos: ${error.message || 'Error desconocido'}`;
        }
        
        // El componente debe seguir funcionando aunque falle la carga
        this.isLoadingNannyData = false;
      }
    });
  }

  loadNannyServices() {
    if (!this.nannyId) {
      console.error('❌ No hay nannyId disponible');
      return;
    }

    this.isLoadingServices = true;
    console.log('📥 Cargando servicios de nanny:', this.nannyId);

    this.nannyService.getNannyServices(this.nannyId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ Servicios cargados desde BD:', response.data);
          console.log('📊 Total de servicios:', response.data.length);
          
          // Separar servicios en upcoming y past
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          this.services.upcoming = [];
          this.services.past = [];

          response.data.forEach((service: any) => {
            console.log(`🔍 Procesando servicio ID ${service.id}:`, {
              start_date: service.start_date,
              status: service.status,
              nanny_id: service.nanny_id,
              client_name: `${service.client_first_name || ''} ${service.client_last_name || ''}`
            });

            const serviceDate = new Date(service.start_date);
            const serviceStatus = service.status;

            // Formatear el servicio
            const formattedService: Service = {
              id: service.id,
              date: service.start_date,
              dateDisplay: this.formatDateDisplay(service.start_date),
              time: `${service.start_time.substring(0, 5)} - ${service.end_time.substring(0, 5)}`,
              client: `${service.client_first_name || ''} ${service.client_last_name || ''}`.trim() || 'Cliente',
              location: service.address || 'Sin dirección',
              instructions: service.special_instructions || 'Sin instrucciones especiales',
              status: (serviceStatus === 'completed' || serviceDate < today) ? 'completed' : 'upcoming',
              rating: service.rating || undefined,
              client_user_id: service.client_user_id || undefined
            };

            console.log(`📝 Servicio formateado:`, {
              id: formattedService.id,
              date: formattedService.dateDisplay,
              status: formattedService.status,
              isCompleted: serviceStatus === 'completed' || serviceDate < today,
              isConfirmedOrPending: serviceStatus === 'confirmed' || serviceStatus === 'pending' || serviceStatus === 'in_progress'
            });

            // Clasificar por fecha y estado
            if (serviceStatus === 'completed' || serviceDate < today) {
              console.log(`  ➡️ Añadiendo a PAST`);
              this.services.past.push(formattedService);
            } else if (serviceStatus === 'confirmed' || serviceStatus === 'pending' || serviceStatus === 'in_progress') {
              console.log(`  ➡️ Añadiendo a UPCOMING`);
              this.services.upcoming.push(formattedService);
            } else {
              console.log(`  ⚠️ Status no reconocido: ${serviceStatus}`);
            }
          });

          // Ordenar servicios
          this.services.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          this.services.past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Actualizar stats
          this.stats.upcomingServices = this.services.upcoming.length;

          // Establecer próximo servicio
          if (this.services.upcoming.length > 0) {
            const next = this.services.upcoming[0];
            this.nextService = {
              date: next.dateDisplay,
              time: next.time,
              client: next.client,
              location: next.location,
              instructions: next.instructions
            };
          }

          // Actualizar contadores del sidebar
          this.updateSidebarCounts();

          console.log('📊 Servicios procesados:', {
            upcoming: this.services.upcoming.length,
            past: this.services.past.length,
            nextService: this.nextService
          });
        } else {
          console.warn('⚠️ Respuesta vacía o sin éxito:', response);
        }
        this.isLoadingServices = false;
      },
      error: (error) => {
        console.error('❌ Error cargando servicios:', error);
        this.loadError = `Error al cargar servicios: ${error.status} ${error.statusText}`;
        this.isLoadingServices = false;
      }
    });
  }

  formatDateDisplay(dateString: string): string {
    const date = new Date(dateString);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return `${date.getDate()} de ${months[date.getMonth()]}`;
  }

  // Métodos para notificaciones
  loadNotifications() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('❌ No hay usuario logueado');
      return;
    }

    console.log('📥 Cargando notificaciones para user_id:', currentUser.id);
    // El servicio ya maneja la carga automática, solo necesitamos suscribirnos
    // La suscripción ya está en ngOnInit
  }

  handleNotificationClick(notification: Notification) {
    console.log('🔔 Click en notificación:', notification);
    
    // Marcar como leída
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (response) => {
          if (response.success) {
            notification.is_read = true;
            this.unreadNotificationsCount = Math.max(0, this.unreadNotificationsCount - 1);
          }
        },
        error: (error) => {
          console.error('❌ Error marcando notificación como leída:', error);
        }
      });
    }
    
    // Navegar según el tipo de notificación
    if (notification.action_url) {
      this.router.navigate([notification.action_url]);
    } else if (notification.type === 'service' && notification.related_id) {
      // Navegar a ver detalles del servicio
      this.currentView = 'services';
      this.setServiceFilter('upcoming');
    }
  }

  markAllNotificationsAsRead() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.forEach(n => n.is_read = true);
          this.unreadNotificationsCount = 0;
          console.log('✅ Todas las notificaciones marcadas como leídas');
        }
      },
      error: (error) => {
        console.error('❌ Error marcando todas como leídas:', error);
      }
    });
  }

  // Manejo de error en la imagen de perfil del cliente
  onProfileImageError(event: any) {
    console.warn('⚠️ Error cargando imagen de perfil del cliente');
    event.target.src = '/assets/logo.png';
  }
}