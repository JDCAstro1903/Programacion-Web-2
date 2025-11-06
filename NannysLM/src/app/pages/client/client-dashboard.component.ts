import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent, HeaderConfig, Notification } from '../../shared/components/header/header.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { ClientService as ClientApiService, ClientInfo, ClientServiceData, ClientPayment, ClientStats } from '../../services/client.service';
import { NotificationService } from '../../services/notification.service';
import { ServiceService, ServiceData } from '../../services/service.service';
import { BankDetailsService, BankDetail } from '../../services/bank-details.service';

// Interfaz para definir la estructura de un servicio del cliente (legacy)
interface ClientService {
  id: number;
  date: string;
  dateDisplay: string;
  time: string;
  nanny: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  rating?: number;
  cost?: number;
}

// Interfaz extendida para servicios con propiedades de UI
interface ExtendedClientService extends ClientServiceData {
  showRating?: boolean;
  tempRating?: number;
  isRated?: boolean;
  instructions?: string; // Para compatibilidad con template legacy
  service?: { name: string }; // Para compatibilidad con template legacy
}

// Interfaces para datos del perfil
interface UserProfileData {
  id?: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  user_type: string;
  is_verified: boolean;
  is_active: boolean;
  profile_image: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface ClientProfileData {
  id?: number;
  user_id?: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_date?: string;
  identification_document?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  number_of_children: number;
  special_requirements: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent, LogoutModalComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  // Vista actual del dashboard
  currentView: string = 'dashboard';
  
  // Vista de servicios específica
  servicesView: string = 'services-history'; // 'services-history' o 'new-service'
  
  // Configuración del sidebar
  sidebarConfig: SidebarConfig;
  
  // Configuración del header
  headerConfig: HeaderConfig;
  
  // Estado del modal de logout
  showLogoutModal: boolean = false;

  // Estado del modal de datos bancarios
  showBankDetailsModal: boolean = false;

  // Datos bancarios activos para mostrar en el modal
  currentBankData: any = null;

  // Estado para mostrar servicio creado
  showServiceDetails: boolean = false;
  createdService: any = null;

  // Datos dinámicos del cliente
  clientInfo: ClientInfo | null = null;
  contractedServices: ExtendedClientService[] = [];
  clientPayments: ClientPayment[] = [];
  clientStats: ClientStats | null = null;
  notifications: Notification[] = [];
  
  // Estado para ver detalles de servicio
  selectedService: any = null;
  serviceInstructions: string = '';
  isEditingInstructions: boolean = false;
  originalInstructions: string = '';
  
  // Estados de carga
  isLoadingClientInfo = false;
  isLoadingServices = false;
  isLoadingPayments = false;
  isLoadingStats = false;
  isLoadingBankData = false;

  // Datos del perfil
  profileData: UserProfileData = {
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    user_type: 'client',
    is_verified: false,
    is_active: true,
    profile_image: ''
  };

  clientData: ClientProfileData = {
    verification_status: 'pending',
    identification_document: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    number_of_children: 0,
    special_requirements: ''
  };

  // Estado de guardado para client-info view
  isSavingClientData = false;
  
  // Estado de carga para client-info view
  isLoadingClientData = false;

  // Mensajes para client-info view
  clientInfoErrorMessage: string = '';
  clientInfoSuccessMessage: string = '';

  // Archivo de identificación
  identificationDocumentFile: File | null = null;

  // ID del usuario actual (en producción vendría del JWT)
  currentUserId: number = 2; // Default, se actualiza en ngOnInit

  // Archivos seleccionados
  selectedIdentificationName: string = '';
  identificationFile: File | null = null;

  // Lista de servicios contratados (legacy - será reemplazada)
  contractedServicesLegacy: any[] = [
    {
      id: 1,
      title: 'Sesion 19 de Marzo',
      status: 'Finalizado',
      startTime: '05:00',
      endTime: '02:00',
      date: new Date(2025, 2, 19), // 19 de marzo 2025
      instructions: 'El niño tiene que comer temprano',
      service: { name: 'Cuidado Nocturno' },
      nanny: {
        name: 'Leslie Ruiz',
        photo: 'assets/logo.png'
      },
      isRated: true,
      rating: 5,
      showRating: false,
      tempRating: 0
    },
    {
      id: 2,
      title: 'Sesion 15 de Marzo',
      status: 'Finalizado',
      startTime: '08:00',
      endTime: '18:00',
      date: new Date(2025, 2, 15), // 15 de marzo 2025
      instructions: 'Llevar al parque después del almuerzo',
      service: { name: 'Niñeras a domicilio' },
      nanny: {
        name: 'Ana Martínez',
        photo: 'assets/logo.png'
      },
      isRated: true,
      rating: 4,
      showRating: false,
      tempRating: 0
    },
    {
      id: 3,
      title: 'Sesion 10 de Marzo',
      status: 'Finalizado',
      startTime: '14:00',
      endTime: '20:00',
      date: new Date(2025, 2, 10), // 10 de marzo 2025
      instructions: 'Ayuda con tareas escolares',
      service: { name: 'Niñeras a domicilio' },
      nanny: {
        name: 'Sofia López',
        photo: 'assets/logo.png'
      },
      isRated: false,
      rating: 0,
      showRating: false,
      tempRating: 0
    },
    {
      id: 4,
      title: 'Sesion 5 de Marzo',
      status: 'Finalizado',
      startTime: '19:00',
      endTime: '07:00',
      date: new Date(2025, 2, 5), // 5 de marzo 2025
      instructions: 'Cuidado nocturno para bebé de 6 meses',
      service: { name: 'Cuidado Nocturno' },
      nanny: {
        name: 'María González',
        photo: 'assets/logo.png'
      },
      isRated: true,
      rating: 5,
      showRating: false,
      tempRating: 0
    }
  ];

  // Lista de pagos (legacy - será reemplazada)
  paymentsListLegacy = [
    {
      id: 1,
      session: 'Sesion #1',
      amount: '500.00',
      status: 'pagado',
      date: new Date(2025, 2, 15) // 15 de marzo 2025
    },
    {
      id: 2,
      session: 'Sesion #2',
      amount: '500.00',
      status: 'Sin verificar',
      date: new Date(2025, 2, 22) // 22 de marzo 2025
    },
    {
      id: 3,
      session: 'Sesion #3',
      amount: '500.00',
      status: 'Sin verificar',
      date: new Date(2025, 2, 29) // 29 de marzo 2025
    }
  ];

  // Estado para la vista de servicios
  selectedDate: Date | null = null;
  selectedEndDate: Date | null = null;
  selectedTime: string = ''; // Mantener por compatibilidad
  selectedStartTime: string = '';
  selectedEndTime: string = '';
  selectedServiceType: string = '';
  selectedChildren: number = 1;
  selectedNannys: number = 1;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  availableTimes: string[] = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];
  nightTimes: string[] = [
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00'
  ];
  serviceTypes = [
    { 
      id: 'home-care', 
      name: 'Niñeras a domicilio', 
      description: 'Cuidado personalizado en la comodidad de tu hogar. Disponible por hora, día o noche.',
      allowsMultipleDays: false
    },
    { 
      id: 'night-care', 
      name: 'Niñeras nocturnas', 
      description: 'Cuidado especializado durante la noche (6:00 PM - 6:00 AM), permitiéndote descansar con tranquilidad.',
      allowsMultipleDays: false
    },
    { 
      id: 'weekly-care', 
      name: 'Niñeras por semana', 
      description: 'Servicio continuo y estable para familias que necesitan apoyo regular.',
      allowsMultipleDays: true
    },
    { 
      id: 'event-care', 
      name: 'Acompañamiento a eventos', 
      description: 'Apoyo profesional durante eventos especiales, bodas y celebraciones.',
      allowsMultipleDays: false
    },
    { 
      id: 'travel-care', 
      name: 'Acompañamiento en viajes', 
      description: 'Niñeras capacitadas para hacer de tus viajes una experiencia más relajada.',
      allowsMultipleDays: true
    }
  ];

  // Estado de la cuenta
  accountStatus = {
    isVerified: true,
    verificationIcon: '✓'
  };
  
  // Control del overlay/aviso de verificación
  verificationBlockerVisible: boolean = true;
  
  // Permite cerrar el overlay solo si el usuario está en la vista 'client-info'
  closeVerificationOverlay() {
    if (this.currentView === 'client-info') {
      this.verificationBlockerVisible = false;
    }
  }

  // Lista de servicios del cliente
  services: {
    upcoming: ClientService[];
    past: ClientService[];
  } = {
    upcoming: [],
    past: []
  };

  // Datos bancarios de las nannys (simulando datos desde backend)
  nannyBankData: { [nannyName: string]: any } = {
    'Leslie Ruiz': {
      id: 1,
      nanny_nombre: 'Leslie Ruiz',
      banco: 'BBVA Bancomer',
      numero_cuenta: '1234567890',
      numero_cuenta_oculto: '****7890',
      clabe: '012180001234567890',
      nombre_titular: 'Leslie Ruiz',
      tipo_cuenta: 'ahorro',
      es_activa: true
    },
    'Ana Martínez': {
      id: 2,
      nanny_nombre: 'Ana Martínez',
      banco: 'Santander',
      numero_cuenta: '0987654321',
      numero_cuenta_oculto: '****4321',
      clabe: '014320000987654321',
      nombre_titular: 'Ana Martínez',
      tipo_cuenta: 'corriente',
      es_activa: true
    },
    'Sofia López': {
      id: 3,
      nanny_nombre: 'Sofia López',
      banco: 'Banorte',
      numero_cuenta: '5678909876',
      numero_cuenta_oculto: '****9876',
      clabe: '072580005678909876',
      nombre_titular: 'Sofia López',
      tipo_cuenta: 'ahorro',
      es_activa: false
    },
    'María González': {
      id: 4,
      nanny_nombre: 'María González',
      banco: 'Banamex',
      numero_cuenta: '1122334455',
      numero_cuenta_oculto: '****4455',
      clabe: '002180001122334455',
      nombre_titular: 'María González',
      tipo_cuenta: 'ahorro',
      es_activa: true
    }
  };

  constructor(
    private userConfigService: UserConfigService, 
    private router: Router,
    private authService: AuthService,
    private clientApiService: ClientApiService,
    private notificationService: NotificationService,
    private serviceService: ServiceService,
    private bankDetailsService: BankDetailsService
  ) {
    // Configurar sidebar específico para cliente con tema rosa
    this.sidebarConfig = {
      userType: 'admin', // Usar tema admin (rosa) para consistencia
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
          id: 'payments',
          label: 'Pagos',
          icon: 'dollar-sign'
        },
        {
          id: 'client-info',
          label: 'Información del Cliente',
          icon: 'user-check'
        }
      ]
    };

    // Configurar header genérico
    this.headerConfig = {
      userType: 'client',
      userName: 'Usuario',
      userRole: 'Cliente',
      userAvatar: 'assets/logo.png',
      showProfileOption: true,
      showLogoutOption: true
    };
  }

  ngOnInit() {
    console.log('🎯 Iniciando ClientDashboardComponent...');
    
    // Debug del localStorage
    console.log('💾 LocalStorage user:', localStorage.getItem('user'));
    console.log('💾 LocalStorage token:', localStorage.getItem('token'));
    
    // Obtener el usuario actual desde el AuthService
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario desde AuthService:', currentUser);
    
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
      console.log('✅ Usuario actual detectado:', currentUser);
      console.log('🔑 ID del usuario establecido:', this.currentUserId);
    } else {
      console.warn('⚠️ No se pudo obtener el usuario actual desde AuthService');
      console.log('🔄 Intentando cargar desde localStorage directamente...');
      
      // Intentar obtener desde localStorage directamente
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('📋 Usuario desde localStorage:', user);
          if (user.id) {
            this.currentUserId = user.id;
            console.log('🆔 ID obtenido desde localStorage:', this.currentUserId);
          }
        }
      } catch (error) {
        console.error('❌ Error al parsear usuario desde localStorage:', error);
      }
    }
    
    console.log(`🎪 Cargando datos para usuario ID: ${this.currentUserId}`);
    
    // Actualizar headerConfig con datos del usuario
    this.updateHeaderConfigFromUser(currentUser);
    
    // Cargar datos dinámicos del cliente
    this.loadClientData();
    // Cargar datos específicos del cliente (emergency contacts, etc.)
    this.loadClientInfoData();
    // Cargar datos del perfil
    this.loadProfileData();
    // Cargar notificaciones
    this.loadNotifications();
    // Actualizar contadores en el sidebar si es necesario
    this.updateSidebarCounts();
    
    // Escuchar eventos de storage para detectar cambios en localStorage
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Escuchar el evento de visibilidad de la página
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  ngOnDestroy() {
    // Limpiar listeners
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'currentUser') {
      console.log('🔄 Detectado cambio en currentUser, actualizando header...');
      this.loadClientInfo();
    }
  }

  private handleVisibilityChange() {
    if (!document.hidden) {
      console.log('👁️ Página visible de nuevo, actualizando datos...');
      // Recargar la información del cliente cuando la página vuelva a ser visible
      this.loadClientInfo();
    }
  }

  private updateHeaderConfigFromUser(currentUser: any) {
    if (currentUser) {
      const userName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Usuario';
      let avatarUrl = 'assets/logo.png';
      
      // Intentar obtener la imagen de perfil actualizada
      if (currentUser.profile_image) {
        if (currentUser.profile_image.startsWith('http')) {
          avatarUrl = currentUser.profile_image;
        } else if (currentUser.profile_image.startsWith('/uploads/')) {
          avatarUrl = `http://localhost:8000${currentUser.profile_image}`;
        } else {
          avatarUrl = `http://localhost:8000/uploads/${currentUser.profile_image}`;
        }
      }
      
      this.headerConfig = {
        userType: 'client',
        userName: userName,
        userRole: 'Cliente',
        userAvatar: avatarUrl,
        showProfileOption: true,
        showLogoutOption: true
      };
    }
  }

  private updateSidebarCounts() {
    // Actualizar contadores para servicios (usar datos dinámicos cuando estén disponibles)
    if (this.clientStats) {
      this.userConfigService.updateSidebarItemCount('admin', 'services', 
        this.clientStats.services.total);
    }
  }

  // ===============================================
  // MÉTODOS DE CARGA DE DATOS DINÁMICOS
  // ===============================================

  private loadClientData() {
    this.loadClientInfo();
    this.loadClientServices();
    this.loadClientPayments();
    this.loadClientStats();
  }

  private loadClientInfo() {
    this.isLoadingClientInfo = true;
    console.log(`📋 Cargando información del cliente para ID: ${this.currentUserId}`);
    this.clientApiService.getClientInfo(this.currentUserId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta client info completa:', JSON.stringify(response, null, 2));
        if (response.success) {
          this.clientInfo = response.data;
          console.log('✅ clientInfo actualizado:', JSON.stringify(this.clientInfo, null, 2));
          if (this.clientInfo && this.clientInfo.profile_image) {
            console.log('✅ profile_image específico:', this.clientInfo.profile_image);
          } else {
            console.log('⚠️ profile_image no disponible');
          }
          
          // Actualizar headerConfig con la información del cliente
          if (this.clientInfo) {
            const userName = `${this.clientInfo.first_name} ${this.clientInfo.last_name}`.trim();
            let avatarUrl = '/assets/logo.png';
            
            console.log('🔍 Header - profile_image value:', this.clientInfo.profile_image);
            
            if (this.clientInfo.profile_image) {
              if (this.clientInfo.profile_image.startsWith('http')) {
                avatarUrl = this.clientInfo.profile_image;
                console.log('🌐 Header - URL completa:', avatarUrl);
              } else if (this.clientInfo.profile_image.startsWith('/uploads/')) {
                avatarUrl = `http://localhost:8000${this.clientInfo.profile_image}`;
                console.log('📁 Header - Ruta /uploads/:', avatarUrl);
              } else {
                avatarUrl = `http://localhost:8000/uploads/${this.clientInfo.profile_image}`;
                console.log('📦 Header - URL construida:', avatarUrl);
              }
            } else {
              console.log('⚠️ Header - No hay profile_image, usando logo por defecto');
            }
            
            this.headerConfig = {
              userType: 'client',
              userName: userName,
              userRole: 'Cliente',
              userAvatar: avatarUrl,
              showProfileOption: true,
              showLogoutOption: true
            };
            
            console.log('✅ Header config actualizado:', this.headerConfig);
          }
        }
        this.isLoadingClientInfo = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando información del cliente:', error);
        this.isLoadingClientInfo = false;
      }
    });
  }

  private loadClientServices() {
    this.isLoadingServices = true;
    console.log(`📋 Cargando servicios del cliente para userId: ${this.currentUserId}`);
    this.clientApiService.getClientServices(this.currentUserId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta client services:', response);
        if (response.success) {
          this.contractedServices = response.data.map((service: ClientServiceData) => ({
            ...service,
            showRating: false,
            tempRating: 0,
            isRated: service.rating.given
          }));
        }
        this.isLoadingServices = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando servicios:', error);
        this.isLoadingServices = false;
      }
    });
  }

  private loadClientPayments() {
    this.isLoadingPayments = true;
    console.log(`📋 Cargando pagos del cliente para userId: ${this.currentUserId}`);
    this.clientApiService.getClientPayments(this.currentUserId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta client payments:', response);
        if (response.success) {
          this.clientPayments = response.data;
        }
        this.isLoadingPayments = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando pagos:', error);
        this.isLoadingPayments = false;
      }
    });
  }

  private loadClientStats() {
    this.isLoadingStats = true;
    console.log(`📋 Cargando estadísticas del cliente para userId: ${this.currentUserId}`);
    this.clientApiService.getClientStats(this.currentUserId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta client stats:', response);
        if (response.success) {
          this.clientStats = response.data;
        }
        this.isLoadingStats = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando estadísticas:', error);
        this.isLoadingStats = false;
      }
    });
  }

  // ===============================================
  // MÉTODOS DE NAVEGACIÓN
  // ===============================================

  // Métodos de navegación
  setCurrentView(view: string) {
    // Si la cuenta NO está verificada, impedir cambiar la vista a otra distinta
    // de 'client-info'. En ese caso redirigimos al formulario de información
    // del cliente y mostramos el overlay.
    if (!this.profileData?.is_verified) {
      this.verificationBlockerVisible = true;
      if (view !== 'client-info') {
        // Forzar vista de información del cliente y no permitir navegación
        this.currentView = 'client-info';
        // También asegúrate de que el usuario vea la sección de cliente
        return;
      }
    }

    // Si está verificada (o la vista solicitada es 'client-info'), proceder normalmente
    this.currentView = view;
    // Si estamos cambiando a servicios, mostrar historial por defecto
    if (view === 'services') {
      this.servicesView = 'services-history';
    }
  }

  onViewChange(view: string) {
    this.setCurrentView(view);
  }

  // Métodos para manejar las vistas de servicios
  showServicesHistory() {
    this.servicesView = 'services-history';
  }

  showNewServiceForm() {
    this.servicesView = 'new-service';
    // Limpiar selecciones previas
    this.selectedDate = null;
    this.selectedEndDate = null;
    this.selectedTime = '';
    this.selectedServiceType = '';
    this.selectedChildren = 1;
    this.selectedNannys = 1;
  }

  // Transformar datos del servicio para la vista
  private transformServiceData(serviceData: any): any {
    return {
      ...serviceData,
      nanny: serviceData.nanny_id ? {
        id: serviceData.nanny_id,
        name: `${serviceData.nanny_first_name || ''} ${serviceData.nanny_last_name || ''}`.trim(),
        first_name: serviceData.nanny_first_name,
        last_name: serviceData.nanny_last_name,
        profile_image: serviceData.nanny_profile_image || null,
        rating: parseFloat(serviceData.nanny_rating) || 0
      } : null
    };
  }

  // Ver detalles de un servicio existente
  viewServiceDetails(serviceId: number) {
    console.log('Cargando detalles del servicio:', serviceId);
    
    // Hacer llamada al API para obtener los detalles completos del servicio
    this.serviceService.getServiceById(serviceId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Transformar datos para que coincidan con el formato esperado por el HTML
          this.selectedService = this.transformServiceData(response.data);
          this.serviceInstructions = response.data.special_instructions || '';
          this.currentView = 'service-details';
          console.log('✅ Servicio cargado y transformado:', this.selectedService);
        } else {
          console.error('No se encontró el servicio');
        }
      },
      error: (error: any) => {
        console.error('Error cargando detalles del servicio:', error);
      }
    });
  }

  // Volver a la lista de servicios
  backToServices() {
    this.currentView = 'services';
    this.servicesView = 'services-history';
    this.selectedService = null;
    this.isEditingInstructions = false;
  }

  // Iniciar edición de indicaciones
  startEditingInstructions() {
    this.isEditingInstructions = true;
    this.originalInstructions = this.serviceInstructions;
  }

  // Guardar indicaciones
  saveInstructions() {
    if (!this.selectedService) return;

    console.log('Guardando indicaciones:', this.serviceInstructions);
    
    // Actualizar en el backend
    this.serviceService.updateService(this.selectedService.id, {
      special_instructions: this.serviceInstructions
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.selectedService.special_instructions = this.serviceInstructions;
          this.isEditingInstructions = false;
          console.log('✅ Indicaciones guardadas correctamente');
          alert('Indicaciones actualizadas correctamente');
          
          // Recargar servicios para reflejar los cambios
          this.loadClientServices();
        }
      },
      error: (error: any) => {
        console.error('❌ Error guardando indicaciones:', error);
        alert('Error al guardar las indicaciones. Por favor intenta nuevamente.');
      }
    });
  }

  // Cancelar edición de indicaciones
  cancelEditingInstructions() {
    this.serviceInstructions = this.originalInstructions;
    this.isEditingInstructions = false;
  }

  // Abrir modal para cambiar fecha/hora
  openChangeDateTime() {
    // TODO: Implementar modal de cambio de fecha/hora
    console.log('Abrir modal de cambio de fecha/hora');
    alert('Función de cambio de fecha/hora próximamente disponible');
  }

  // Abrir modal de calificación
  openRatingModal() {
    if (!this.selectedService) return;
    // Usar la funcionalidad existente de calificación
    this.rateService(this.selectedService.id);
  }

  // Abrir modal de cancelación
  openCancelModal() {
    if (!this.selectedService) return;
    
    const confirmCancel = confirm(
      `¿Estás seguro de que deseas cancelar el servicio "${this.selectedService.title}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmCancel) {
      this.cancelServiceById(this.selectedService.id);
    }
  }

  // Cancelar servicio por ID
  cancelServiceById(serviceId: number) {
    this.serviceService.deleteService(serviceId).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('✅ Servicio cancelado correctamente');
          alert('El servicio ha sido cancelado correctamente');
          
          // Volver a la lista y recargar servicios
          this.backToServices();
          this.loadClientServices();
        }
      },
      error: (error: any) => {
        console.error('❌ Error cancelando servicio:', error);
        alert('Error al cancelar el servicio. Por favor intenta nuevamente.');
      }
    });
  }

  // Ver perfil de la niñera
  viewNannyProfile(nannyId?: number) {
    console.log('Ver perfil de niñera:', nannyId);
    // TODO: Implementar navegación al perfil de la niñera
    alert('Visualización de perfil de niñera próximamente disponible');
  }

  // Actualizar indicaciones del servicio (método legacy - mantener por compatibilidad)
  updateServiceInstructions() {
    this.saveInstructions();
  }

  onSidebarLogout() {
    this.openLogoutModal();
  }

  // Métodos para manejar eventos del header
  onHeaderLogout() {
    console.log('onHeaderLogout called - Opening logout modal');
    this.openLogoutModal();
  }

  onHeaderProfileClick() {
    // Este método ya no es necesario porque el header navega directamente a /profile
    console.log('onHeaderProfileClick called - Navegando a perfil...');
  }

  // Métodos para el modal de logout
  openLogoutModal() {
    console.log('openLogoutModal called - Setting showLogoutModal to true');
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.router.navigate(['/']);
    console.log('Cliente cerró sesión');
  }

  // Métodos para manejar servicios (para futuras implementaciones)
  requestService() {
    console.log('Solicitar nuevo servicio');
    // Aquí se implementaría la lógica para solicitar un servicio
  }

  // Métodos para el calendario y reservas
  selectDate(day: number) {
    if (day > 0 && !this.isPastDate(day)) {
      const clickedDate = new Date(this.currentYear, this.currentMonth, day);
      
      if (!this.allowsMultipleDays()) {
        // Servicio de un solo día
        this.selectedDate = clickedDate;
        this.selectedEndDate = null;
      } else {
        // Servicio de múltiples días
        if (!this.selectedDate) {
          // Primera fecha seleccionada
          this.selectedDate = clickedDate;
          this.selectedEndDate = null;
        } else if (!this.selectedEndDate) {
          // Segunda fecha seleccionada
          if (clickedDate >= this.selectedDate) {
            this.selectedEndDate = clickedDate;
          } else {
            // Si selecciona una fecha anterior, reinicia la selección
            this.selectedDate = clickedDate;
            this.selectedEndDate = null;
          }
        } else {
          // Ya hay un rango seleccionado, reinicia
          this.selectedDate = clickedDate;
          this.selectedEndDate = null;
        }
      }
    }
  }

  selectTime(time: string) {
    this.selectedTime = time;
  }

  selectStartTime(time: string) {
    this.selectedStartTime = time;
    this.selectedTime = time; // Mantener compatibilidad
    // No limpiar selectedEndTime para permitir cambiar la hora de llegada
  }

  selectEndTime(time: string) {
    if (this.isValidEndTime(time)) {
      this.selectedEndTime = time;
    }
  }

  getAvailableEndTimes(): string[] {
    return this.getAvailableTimesForService();
  }

  isValidEndTime(endTime: string): boolean {
    if (!this.selectedStartTime) return false;
    
    const [startHour, startMin] = this.selectedStartTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Convertir a minutos desde medianoche
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Si es servicio nocturno, permitir que la hora de fin sea "menor" (cruza medianoche)
    if (this.isNightService()) {
      // Para servicio nocturno, la hora de salida puede ser al día siguiente
      return endMinutes !== startMinutes;
    }
    
    // Para servicios normales, la hora de salida debe ser después de la hora de llegada
    // Si endMinutes es menor, significa que cruza medianoche (solo permitido para nocturno)
    if (endMinutes < startMinutes) {
      return this.isNightService(); // Solo permitir si es servicio nocturno
    }
    
    return endMinutes > startMinutes;
  }

  calculateDuration(): string {
    if (!this.selectedStartTime || !this.selectedEndTime) return '';
    
    const [startHour, startMin] = this.selectedStartTime.split(':').map(Number);
    const [endHour, endMin] = this.selectedEndTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    // Si la hora de fin es menor, significa que cruza medianoche
    if (hours < 0) {
      hours += 24;
    }
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    if (minutes === 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${minutes}min`;
  }

  selectServiceType(serviceType: string) {
    this.selectedServiceType = serviceType;
    // Limpiar horario seleccionado cuando cambie el tipo de servicio
    this.selectedTime = '';
  }

  onServiceTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectServiceType(target.value);
  }

  getSelectedServiceName(): string {
    const service = this.serviceTypes.find(s => s.id === this.selectedServiceType);
    return service ? service.name : '';
  }

  getSelectedServiceDescription(): string {
    const service = this.serviceTypes.find(s => s.id === this.selectedServiceType);
    return service ? service.description : '';
  }

  allowsMultipleDays(): boolean {
    const service = this.serviceTypes.find(s => s.id === this.selectedServiceType);
    return service ? service.allowsMultipleDays : false;
  }

  getDateRangeText(): string {
    if (!this.selectedDate) return '';
    
    if (!this.allowsMultipleDays() || !this.selectedEndDate) {
      return this.formatSelectedDate();
    }
    
    const startDate = this.formatDate(this.selectedDate);
    const endDate = this.formatDate(this.selectedEndDate);
    
    if (startDate === endDate) {
      return startDate;
    }
    
    const daysDiff = Math.ceil((this.selectedEndDate.getTime() - this.selectedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${startDate} - ${endDate} (${daysDiff} días)`;
  }

  formatDate(date: Date | string): string {
    // Convertir string a Date si es necesario
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    
    const day = dateObj.getDate();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const month = monthNames[dateObj.getMonth()];
    return `${day} de ${month}`;
  }

  getAvailableTimesForService(): string[] {
    if (this.selectedServiceType === 'night-care') {
      return this.nightTimes;
    }
    return this.availableTimes;
  }

  isNightService(): boolean {
    return this.selectedServiceType === 'night-care';
  }

  // Métodos para manejar número de niños y nannys
  onChildrenChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedChildren = parseInt(target.value, 10);
    
    // Auto-sugerir número de nannys basado en número de niños
    if (this.selectedChildren >= 3 && this.selectedNannys < 2) {
      this.selectedNannys = 2;
    }
  }

  onNannysChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedNannys = parseInt(target.value, 10);
  }

  // Verificar si mostrar la alerta de recomendación
  shouldShowNannyRecommendation(): boolean {
    return this.selectedChildren >= 3 && this.selectedNannys < 2;
  }

  // Generar opciones para los combobox
  getChildrenOptions(): number[] {
    return Array.from({length: 8}, (_, i) => i + 1); // 1-8 niños
  }

  getNannysOptions(): number[] {
    return Array.from({length: 5}, (_, i) => i + 1); // 1-5 nannys
  }

  getDaysInMonth(): number[] {
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();
    
    const days: number[] = [];
    
    // Agregar espacios vacíos para los días anteriores al primer día del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(0);
    }
    
    // Agregar los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }

  getMonthName(): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[this.currentMonth];
  }

  getDayNames(): string[] {
    return ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    // No reseteamos las selecciones al cambiar de mes
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    // No reseteamos las selecciones al cambiar de mes
  }

  isSelectedDate(day: number): boolean {
    if (day === 0) return false;
    
    const checkDate = new Date(this.currentYear, this.currentMonth, day);
    
    // Verificar si es la fecha de inicio
    if (this.selectedDate && this.isSameDate(checkDate, this.selectedDate)) {
      return true;
    }
    
    // Verificar si es la fecha de fin
    if (this.selectedEndDate && this.isSameDate(checkDate, this.selectedEndDate)) {
      return true;
    }
    
    return false;
  }

  isStartDate(day: number): boolean {
    if (day === 0 || !this.selectedDate) return false;
    const checkDate = new Date(this.currentYear, this.currentMonth, day);
    return this.isSameDate(checkDate, this.selectedDate);
  }

  isEndDate(day: number): boolean {
    if (day === 0 || !this.selectedEndDate) return false;
    const checkDate = new Date(this.currentYear, this.currentMonth, day);
    return this.isSameDate(checkDate, this.selectedEndDate);
  }

  getSelectionState(): string {
    if (!this.allowsMultipleDays()) {
      return '';
    }
    
    if (!this.selectedDate) {
      return 'Selecciona fecha de inicio';
    } else if (!this.selectedEndDate) {
      return 'Selecciona fecha de fin';
    } else {
      return 'Rango completo seleccionado';
    }
  }

  isInSelectedRange(day: number): boolean {
    if (day === 0 || !this.selectedDate || !this.selectedEndDate) return false;
    
    const checkDate = new Date(this.currentYear, this.currentMonth, day);
    return checkDate > this.selectedDate && checkDate < this.selectedEndDate;
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isPastDate(day: number): boolean {
    if (day === 0) return false;
    const today = new Date();
    const checkDate = new Date(this.currentYear, this.currentMonth, day);
    return checkDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    const day = this.selectedDate.getDate();
    const month = this.getMonthName();
    return `${day} de ${month}`;
  }

  confirmReservation() {
    if (!this.selectedDate || !this.selectedStartTime || !this.selectedEndTime || !this.selectedServiceType || !this.selectedChildren || !this.selectedNannys) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Obtener el client_id del cliente logueado
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Error: No se encontró información del usuario');
      return;
    }

    let clientId: number;
    try {
      const userData = JSON.parse(userStr);
      clientId = this.clientInfo?.id || userData.client_id;
      
      if (!clientId) {
        alert('Error: No se pudo obtener el ID del cliente');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      alert('Error al procesar los datos del usuario');
      return;
    }

    // Obtener el nombre del servicio desde serviceTypes
    const selectedService = this.serviceTypes.find(s => s.id === this.selectedServiceType);
    const serviceTitle = selectedService ? selectedService.name : 'Servicio de cuidado';

    // Preparar datos del servicio - usar los tiempos seleccionados por el usuario
    const serviceData: ServiceData = {
      client_id: clientId,
      title: `${serviceTitle} - ${this.selectedDate.getDate()} de ${this.getMonthName()}`,
      service_type: this.getServiceTypeEnum(this.selectedServiceType),
      description: `Servicio de ${serviceTitle} para ${this.selectedChildren} niño(s)`,
      start_date: this.serviceService.formatDate(this.selectedDate),
      end_date: this.selectedEndDate ? this.serviceService.formatDate(this.selectedEndDate) : undefined,
      start_time: this.selectedStartTime,
      end_time: this.selectedEndTime,
      number_of_children: this.selectedChildren,
      special_instructions: '',
      address: this.clientInfo?.address || ''
    };

    console.log('📤 Enviando servicio al backend:', serviceData);

    // Llamar al servicio para crear el servicio
    this.serviceService.createService(serviceData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ Servicio creado exitosamente:', response.data);
          
          // Mostrar mensaje de éxito
          alert(`¡Servicio creado exitosamente!\n\nNanny asignada: ${response.data.nannyAssigned.name}\nCalificación: ${response.data.nannyAssigned.rating}⭐\nHoras totales: ${response.data.totalHours}h\nCosto total: $${response.data.totalAmount}`);

          // Obtener detalles completos del servicio y mostrarlo
          this.serviceService.getServiceById(response.data.serviceId).subscribe({
            next: (detailResponse) => {
              if (detailResponse.success && detailResponse.data) {
                // Transformar datos para que coincidan con el formato esperado
                this.selectedService = this.transformServiceData(detailResponse.data);
                this.serviceInstructions = detailResponse.data.special_instructions || '';
                this.currentView = 'service-details';
                
                console.log('✅ Detalles del servicio cargados:', this.selectedService);

                // Recargar la lista de servicios en background
                this.loadClientServices();
              }
            },
            error: (error) => {
              console.error('Error cargando detalles del servicio:', error);
              // Aunque haya error cargando detalles, el servicio se creó exitosamente
              // Llevar al usuario a la lista de servicios
              this.currentView = 'services';
              this.servicesView = 'services-history';
              this.loadClientServices();
            }
          });

          // Limpiar la selección del formulario
          this.selectedDate = null;
          this.selectedEndDate = null;
          this.selectedTime = '';
          this.selectedServiceType = '';
          this.selectedChildren = 1;
          this.selectedNannys = 1;
        }
      },
      error: (error) => {
        console.error('❌ Error creando servicio:', error);
        
        let errorMessage = 'Error al crear el servicio. Por favor intenta de nuevo.';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'No hay nannys disponibles para las fechas y horarios solicitados. Por favor, intenta con otro horario o fecha.';
        } else if (error.status === 500) {
          errorMessage = 'Error del servidor. Por favor contacta al administrador.';
        }
        
        alert(`Error al crear el servicio:\n\n${errorMessage}\n\nDetalles técnicos:\nFecha: ${this.selectedDate ? this.serviceService.formatDate(this.selectedDate) : 'Sin fecha'}\nHora inicio: ${this.selectedStartTime}\nHora fin: ${this.selectedEndTime}\nNiños: ${this.selectedChildren}`);
      }
    });
  }

  /**
   * Convierte el ID del tipo de servicio a su valor enum en la BD
   */
  private getServiceTypeEnum(serviceId: string): 'hourly' | 'daily' | 'weekly' | 'overnight' | 'event' | 'travel' {
    const mapping: { [key: string]: 'hourly' | 'daily' | 'weekly' | 'overnight' | 'event' | 'travel' } = {
      'home-care': 'hourly',
      'night-care': 'overnight',
      'weekly-care': 'weekly',
      'event-care': 'event',
      'travel-care': 'travel'
    };
    return mapping[serviceId] || 'hourly';
  }

  /**
   * Convierte el status de la BD a texto en español
   */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'in_progress': 'En progreso',
      'completed': 'Finalizado',
      'cancelled': 'Cancelado',
      'pagado': 'Confirmado',
      'Sin verificar': 'En Verificación'
    };
    return statusMap[status] || status;
  }

  /**
   * Cargar servicios desde el backend
   */
  loadServices() {
    if (!this.clientInfo?.id) {
      console.warn('No se puede cargar servicios: clientInfo.id no disponible');
      return;
    }

    this.isLoadingServices = true;

    this.serviceService.getServices(this.clientInfo.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ Servicios cargados desde API:', response.data);
          // Aquí podrías mapear los servicios a tu formato local si es necesario
          this.isLoadingServices = false;
        }
      },
      error: (error) => {
        console.error('❌ Error cargando servicios:', error);
        this.isLoadingServices = false;
      }
    });
  }

  // Agregar servicio a la lista de contratados
  addToContractedServices(service: any) {
    const contractedService = {
      ...service,
      status: 'Finalizado',
      isRated: false,
      rating: 0,
      showRating: false,
      tempRating: 0
    };
    this.contractedServices.unshift(contractedService);
    
    // Después de agregar el servicio, volver al historial
    this.showServiceDetails = false;
    this.currentView = 'services';
    this.servicesView = 'services-history';
  }

  // Cancelar servicio
  cancelService() {
    this.showServiceDetails = false;
    this.createdService = null;
    this.currentView = 'booking';
  }

  // Cambiar fecha del servicio
  changeServiceDate() {
    this.showServiceDetails = false;
    this.currentView = 'booking';
    // Mantener el servicio para facilitar el cambio
    if (this.createdService?.service) {
      this.selectedServiceType = this.createdService.service.id;
    }
    this.createdService = null;
  }

  // Formatear fecha del servicio
  formatServiceDate(): string {
    if (!this.createdService?.date) return '';
    
    const date = this.createdService.date;
    const day = date.getDate();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const month = monthNames[date.getMonth()];
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    
    if (this.createdService.endDate && this.createdService.endDate !== this.createdService.date) {
      const endDay = this.createdService.endDate.getDate();
      const endMonth = monthNames[this.createdService.endDate.getMonth()];
      return `${dayName} ${day} de ${month} - ${endDay} de ${endMonth}`;
    }
    
    return `${dayName} ${day} de ${month}`;
  }

  // Agregar indicaciones
  addInstructions() {
    console.log('Indicaciones agregadas:', this.createdService?.instructions);
  }

  // Formatear fecha de servicio contratado
  formatContractedServiceDate(service: any): string {
    if (!service?.date) return '';
    
    const date = service.date;
    const day = date.getDate();
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const month = monthNames[date.getMonth()];
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    
    return `${dayName} ${day} de ${month}, ${service.startTime} pm - ${service.endTime} am`;
  }

  cancelReservation() {
    this.selectedDate = null;
    this.selectedEndDate = null;
    this.selectedTime = '';
    this.selectedServiceType = '';
    this.selectedChildren = 1;
    this.selectedNannys = 1;
  }

  hasValidReservation(): boolean {
    return !!(
      this.selectedDate && 
      this.selectedStartTime && 
      this.selectedEndTime && 
      this.selectedServiceType && 
      this.selectedChildren && 
      this.selectedNannys
    );
  }

  viewContractedServices() {
    console.log('Ver servicios contratados');
    this.currentView = 'contracted-services';
  }

  // Calificar servicio
  rateService(serviceId: number) {
    console.log('Calificar servicio:', serviceId);
    // Aquí se implementaría la lógica para calificar el servicio
    const service = this.contractedServices.find(s => s.id === serviceId);
    if (service) {
      service.showRating = true;
      service.tempRating = 0;
    }
  }

  // Establecer calificación con estrellas
  setRating(serviceId: number, rating: number) {
    const service = this.contractedServices.find(s => s.id === serviceId);
    if (service) {
      service.rating = {
        given: true,
        rating: rating,
        review: service.rating.review
      };
      service.isRated = true;
      service.showRating = false;
      service.tempRating = 0;
      console.log(`Servicio ${serviceId} calificado con ${rating} estrellas`);
    }
  }

  // Cancelar calificación
  cancelRating(serviceId: number) {
    const service = this.contractedServices.find(s => s.id === serviceId);
    if (service) {
      service.showRating = false;
      service.tempRating = 0;
    }
  }

  // Hover sobre estrella
  onStarHover(serviceId: number, rating: number) {
    const service = this.contractedServices.find(s => s.id === serviceId);
    if (service) {
      service.tempRating = rating;
    }
  }

  // Salir del hover
  onStarLeave(serviceId: number) {
    const service = this.contractedServices.find(s => s.id === serviceId);
    if (service) {
      service.tempRating = 0;
    }
  }

  // Generar array de estrellas para mostrar
  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  // Obtener texto de la calificación
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

  // Método para verificar si no hay servicios
  hasNoServices(): boolean {
    return this.services.upcoming.length === 0 && this.services.past.length === 0;
  }

  // Método para verificar si no hay servicios contratados
  hasNoContractedServices(): boolean {
    return this.contractedServices.length === 0;
  }

  // Métodos helper para datos dinámicos
  get currentUser() {
    console.log('🔍 Header - currentUser getter llamado');
    console.log('🔍 Header - clientInfo:', this.clientInfo);
    
    if (this.clientInfo) {
      // Construir URL completa de la imagen de perfil para el header
      let avatarUrl = 'assets/logo.png';
      console.log('🖼️ Header - Profile image desde clientInfo:', this.clientInfo.profile_image);
      console.log('🖼️ Header - Tipo de profile_image:', typeof this.clientInfo.profile_image);
      console.log('🖼️ Header - Valor completo de clientInfo:', JSON.stringify(this.clientInfo, null, 2));
      
      if (this.clientInfo.profile_image) {
        if (this.clientInfo.profile_image.startsWith('http')) {
          avatarUrl = this.clientInfo.profile_image;
          console.log('🌐 Header - Usando URL completa:', avatarUrl);
        } else if (this.clientInfo.profile_image.startsWith('/uploads/')) {
          // Si ya incluye /uploads/, solo agregar el host
          avatarUrl = `http://localhost:8000${this.clientInfo.profile_image}`;
          console.log('🔗 Header - URL con ruta completa:', avatarUrl);
        } else {
          // Si es solo el nombre del archivo
          avatarUrl = `http://localhost:8000/uploads/${this.clientInfo.profile_image}`;
          console.log('🔗 Header - URL construida:', avatarUrl);
        }
      } else {
        console.log('❌ Header - No hay profile_image en clientInfo');
        console.log('❌ Header - clientInfo.profile_image es:', this.clientInfo.profile_image);
      }
      
      return {
        name: `${this.clientInfo.first_name} ${this.clientInfo.last_name}`,
        role: 'Cliente',
        first_name: this.clientInfo.first_name,
        last_name: this.clientInfo.last_name,
        email: this.clientInfo.email,
        phone: this.clientInfo.phone_number,
        address: this.clientInfo.address,
        avatar: avatarUrl,
        isVerified: this.clientInfo.is_verified
      };
    }
    return {
      name: 'Usuario',
      role: 'Cliente',
      avatar: 'assets/logo.png'
    };
  }

  get userProfile() {
    // Usar profileData que contiene los datos actualizados desde la base de datos
    if (this.profileData && this.profileData.first_name) {
      // Construir URL completa de la imagen de perfil si existe
      let avatarUrl = 'assets/logo.png';
      
      console.log('🖼️ Profile image desde BD:', this.profileData.profile_image);
      
      if (this.profileData.profile_image) {
        // Si la imagen ya es una URL completa, usarla tal como está
        if (this.profileData.profile_image.startsWith('http')) {
          avatarUrl = this.profileData.profile_image;
          console.log('🌐 Usando URL completa:', avatarUrl);
        } else if (this.profileData.profile_image.startsWith('/uploads/')) {
          // Si ya incluye /uploads/, solo agregar el host
          avatarUrl = `http://localhost:8000${this.profileData.profile_image}`;
          console.log('🔗 URL con ruta completa:', avatarUrl);
        } else {
          // Si es solo el nombre del archivo
          avatarUrl = `http://localhost:8000/uploads/${this.profileData.profile_image}`;
          console.log('🔗 URL construida:', avatarUrl);
        }
      } else {
        console.log('❌ No hay profile_image en profileData, usando imagen por defecto');
      }

      return {
        firstName: this.profileData.first_name,
        lastName: this.profileData.last_name,
        email: this.profileData.email,
        phone: this.profileData.phone_number || '',
        address: this.profileData.address || '',
        avatar: avatarUrl,
        isVerified: this.profileData.is_verified,
        emergencyContactName: this.clientData.emergency_contact_name || '',
        emergencyContactPhone: this.clientData.emergency_contact_phone || '',
        numberOfChildren: this.clientData.number_of_children || 0,
        specialRequirements: this.clientData.special_requirements || ''
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      avatar: 'assets/logo.png',
      isVerified: false,
      emergencyContactName: '',
      emergencyContactPhone: '',
      numberOfChildren: 0,
      specialRequirements: ''
    };
  }

  get paymentsList() {
    return this.clientPayments.map(payment => ({
      id: payment.id,
      session: payment.service_title,
      amount: payment.amount.toFixed(2),
      status: payment.payment_status === 'completed' ? 'pagado' : 
              payment.payment_status === 'pending' ? 'Sin verificar' : 
              payment.payment_status,
      date: new Date(payment.service_date),
      nanny: payment.nanny?.name || 'No asignada',
      receiptUrl: payment.receipt_url
    }));
  }

  // Función para obtener la URL completa de la imagen de perfil
  getProfileImageUrl(): string {
    if (!this.profileData.profile_image) {
      return 'assets/logo.png';
    }
    
    // Si la imagen ya es una URL completa, usarla tal como está
    if (this.profileData.profile_image.startsWith('http')) {
      return this.profileData.profile_image;
    }
    
    // Si ya incluye /uploads/, solo agregar el host
    if (this.profileData.profile_image.startsWith('/uploads/')) {
      return `http://localhost:8000${this.profileData.profile_image}`;
    }
    
    // Si es solo el nombre del archivo, construir la URL completa
    return `http://localhost:8000/uploads/${this.profileData.profile_image}`;
  }

  // Estadísticas del dashboard
  getTotalServices(): number {
    return this.clientStats?.services.total || 0;
  }

  getCompletedServices(): number {
    return this.clientStats?.services.completed || 0;
  }

  getPendingServices(): number {
    return this.clientStats?.services.pending || 0;
  }

  getTotalSpent(): number {
    return this.clientStats?.financial.total_spent || 0;
  }

  getUniqueNannys(): number {
    return this.clientStats?.nannys.unique_nannys_hired || 0;
  }

  // Métodos para pagos
  triggerReceiptUpload() {
    const fileInput = document.getElementById('receiptUpload') as HTMLInputElement;
    fileInput?.click();
  }

  onReceiptSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      console.log('Comprobante seleccionado:', file.name);
      // Aquí se implementaría la lógica para subir el comprobante
      alert(`Comprobante "${file.name}" subido exitosamente. Será verificado en las próximas 24 horas.`);
    }
  }

  getPaymentStatusClass(status: string): string {
    return status === 'pagado' ? 'status-paid' : 'status-pending';
  }

  // Métodos para el apartado de pagos mejorado
  getPaidPaymentsCount(): number {
    return this.paymentsList.filter(payment => payment.status === 'pagado').length;
  }

  getPendingPaymentsCount(): number {
    return this.paymentsList.filter(payment => payment.status !== 'pagado').length;
  }

  // Nuevos métodos que usan clientPayments (datos reales del API)
  getCompletedPaymentsCount(): number {
    return this.clientPayments?.filter(payment => payment.payment_status === 'completed').length || 0;
  }

  getPendingPaymentsCountFromArray(): number {
    return this.clientPayments?.filter(payment => payment.payment_status !== 'completed').length || 0;
  }

  getTotalAmount(): string {
    const total = this.paymentsList
      .filter(payment => payment.status === 'pagado')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    return total.toFixed(2);
  }

  trackByPayment(index: number, payment: any): any {
    return payment.id;
  }

  getPaymentIconClass(status: string): string {
    return status === 'pagado' ? 'icon-paid' : 'icon-pending';
  }

  getPaymentDate(payment: any): string {
    if (!payment.date) return 'Sin fecha';
    
    const date = new Date(payment.date);
    const day = date.getDate();
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  uploadReceiptForPayment(payment: any): void {
    if (payment.status === 'pagado') return;
    
    console.log('Subir comprobante para:', payment.session);
    this.triggerReceiptUpload();
  }

  copyBankDetails(): void {
    const bankDetails = `
Banco: Banco Nacional de Desarrollo
Titular: NannysLM Servicios S.A.
Número de Cuenta: 1234-5678-9012-3456
CLABE: 014320123456789012
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails).then(() => {
        alert('Datos bancarios copiados al portapapeles');
      }).catch(() => {
        this.fallbackCopyTextToClipboard(bankDetails);
      });
    } else {
      this.fallbackCopyTextToClipboard(bankDetails);
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      alert('Datos bancarios copiados al portapapeles');
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudieron copiar los datos. Por favor, cópialos manualmente.');
    }
    
    document.body.removeChild(textArea);
  }

  // Función para abrir modal de datos bancarios con datos específicos de la nanny
  openBankDetailsModal(nannyId?: number): void {
    console.log('🏦 Abriendo modal de datos bancarios para nanny ID:', nannyId);
    console.log('🔍 Tipo de nannyId:', typeof nannyId, 'Valor:', nannyId);
    
    // Si no se proporciona nannyId, intentar obtener el primero disponible
    // (útil para vista general sin servicio específico)
    this.isLoadingBankData = true;
    this.showBankDetailsModal = true;
    
    this.bankDetailsService.getBankDetails().subscribe({
      next: (response) => {
        console.log('📊 Respuesta de API completa:', response);
        
        const allBankDetails = response.data;
        console.log('📊 Datos bancarios recibidos:', allBankDetails);
        console.log('📊 Total de registros:', allBankDetails.length);
        
        let nannyBankDetail;
        
        if (nannyId) {
          // Buscar datos de la nanny específica
          console.log('🔎 Buscando nanny con ID:', nannyId);
          nannyBankDetail = allBankDetails.find((bd: any) => {
            console.log('  Comparando:', bd.nannyId, '===', nannyId, '?', bd.nannyId === nannyId);
            return bd.nannyId === nannyId && bd.isActive;
          });
        } else {
          // Si no hay nannyId específico, tomar el primero activo
          console.log('⚠️ No se proporcionó nannyId, buscando primer registro activo');
          nannyBankDetail = allBankDetails.find((bd: any) => bd.isActive);
        }
        
        if (nannyBankDetail) {
          console.log('✅ Datos bancarios encontrados:', nannyBankDetail);
          
          // Mapear de camelCase (API) a snake_case (template)
          this.currentBankData = {
            nanny_nombre: nannyBankDetail.nanny.name || 'Nanny',
            banco: nannyBankDetail.bankName,
            numero_cuenta: nannyBankDetail.accountNumber,
            numero_cuenta_oculto: this.maskAccountNumber(nannyBankDetail.accountNumber),
            clabe: nannyBankDetail.clabe || 'N/A',
            nombre_titular: nannyBankDetail.accountHolderName,
            tipo_cuenta: nannyBankDetail.accountType === 'checking' ? 'corriente' : 
                        nannyBankDetail.accountType === 'savings' ? 'ahorro' : 
                        nannyBankDetail.accountType,
            es_activa: nannyBankDetail.isActive
          };
          console.log('💳 Datos mapeados para mostrar:', this.currentBankData);
        } else {
          console.warn('⚠️ No se encontraron datos bancarios' + (nannyId ? ` para nanny ID: ${nannyId}` : ' activos'));
          this.currentBankData = {
            nanny_nombre: nannyId ? 'Nanny' : 'NannysLM',
            banco: 'Información bancaria no disponible',
            numero_cuenta: 'Pendiente de registro',
            numero_cuenta_oculto: 'N/A',
            clabe: 'N/A',
            nombre_titular: 'Pendiente',
            tipo_cuenta: 'N/A',
            es_activa: false
          };
        }
        
        this.isLoadingBankData = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar datos bancarios:', error);
        console.error('❌ Detalles del error:', error.message);
        this.currentBankData = {
          nanny_nombre: 'Error',
          banco: 'Error al cargar información',
          numero_cuenta: 'Error',
          numero_cuenta_oculto: 'Error',
          clabe: 'Error',
          nombre_titular: 'Error',
          tipo_cuenta: 'Error',
          es_activa: false
        };
        this.isLoadingBankData = false;
      }
    });
  }

  // Método auxiliar para ocultar parte del número de cuenta
  private maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return accountNumber;
    }
    const visibleDigits = accountNumber.slice(-4);
    return '****' + visibleDigits;
  }

  // Función mejorada para copiar datos bancarios específicos
  copyBankDetailsImproved(): void {
    if (!this.currentBankData) return;

    const bankDetails = `
Banco: ${this.currentBankData.banco}
Titular: ${this.currentBankData.nombre_titular}
Número de Cuenta: ${this.currentBankData.numero_cuenta}
CLABE: ${this.currentBankData.clabe || 'No disponible'}
Tipo de Cuenta: ${this.currentBankData.tipo_cuenta === 'ahorro' ? 'Cuenta de Ahorro' : 'Cuenta Corriente'}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails).then(() => {
        alert('Datos bancarios copiados al portapapeles');
      }).catch(() => {
        this.fallbackCopyTextToClipboard(bankDetails);
      });
    } else {
      this.fallbackCopyTextToClipboard(bankDetails);
    }
  }

  // Función para obtener datos bancarios por servicio
  getBankDataForService(service: any): any {
    if (service.nanny && service.nanny.name) {
      return this.nannyBankData[service.nanny.name] || null;
    }
    return null;
  }

  // ===============================================
  // MÉTODOS PARA PERFIL
  // ===============================================

  // Cargar datos del perfil desde el backend
  async loadProfileData() {
    this.isLoadingClientData = true;
    
    try {
      // Obtener datos del perfil desde el backend con el ID del usuario actual
      console.log(`🔄 Cargando datos del perfil para usuario ID: ${this.currentUserId}`);
      
      const response = await fetch(`http://localhost:8000/api/v1/profile/data?userId=${this.currentUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Aquí se incluiría el token de autorización cuando esté implementado
          // 'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('📦 Datos recibidos del servidor:', result);
        
        if (result.success) {
          // Cargar datos del usuario
          this.profileData = {
            id: result.data.user_data.id,
            email: result.data.user_data.email,
            first_name: result.data.user_data.first_name,
            last_name: result.data.user_data.last_name,
            phone_number: result.data.user_data.phone_number || '',
            address: result.data.user_data.address || '',
            user_type: result.data.user_data.user_type,
            is_verified: result.data.user_data.is_verified,
            is_active: result.data.user_data.is_active,
            profile_image: result.data.user_data.profile_image || '',
            created_at: result.data.user_data.created_at,
            updated_at: result.data.user_data.updated_at
          };

          console.log('✅ Datos del perfil cargados:', this.profileData);
          console.log('🖼️ Profile image específica:', this.profileData.profile_image);

          // Cargar datos específicos del cliente
          this.clientData = {
            id: result.data.client_data.id,
            user_id: result.data.client_data.user_id,
            verification_status: result.data.client_data.verification_status,
            verification_date: result.data.client_data.verification_date,
            emergency_contact_name: result.data.client_data.emergency_contact_name || '',
            emergency_contact_phone: result.data.client_data.emergency_contact_phone || '',
            number_of_children: result.data.client_data.number_of_children || 0,
            special_requirements: result.data.client_data.special_requirements || '',
            created_at: result.data.client_data.created_at,
            updated_at: result.data.client_data.updated_at
          };

          console.log('👨‍👩‍👧‍👦 Datos del cliente cargados:', this.clientData);

          console.log('✅ Datos del perfil cargados exitosamente:', { 
            userData: this.profileData, 
            clientData: this.clientData 
          });
          console.log(`👤 Usuario: ${this.profileData.first_name} ${this.profileData.last_name}`);
        }
      } else {
        console.error('Error al cargar datos del perfil:', response.status);
        this.loadFallbackData();
      }
    } catch (error) {
      console.error('Error de conexión al cargar perfil:', error);
      this.loadFallbackData();
    } finally {
      this.isLoadingClientData = false;
    }
  }

  // Cargar datos de respaldo en caso de error
  private loadFallbackData() {
    // Datos básicos del usuario desde la sesión actual como fallback
    this.profileData = {
      email: this.currentUser.email || '',
      first_name: this.currentUser.name.split(' ')[0] || '',
      last_name: this.currentUser.name.split(' ').slice(1).join(' ') || '',
      phone_number: '',
      address: '',
      user_type: 'client',
      is_verified: false,
      is_active: true,
      profile_image: ''
    };

    // Datos específicos del cliente vacíos como fallback
    this.clientData = {
      verification_status: 'pending',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      number_of_children: 0,
      special_requirements: ''
    };
  }

  // Métodos para manejar la subida de documento de identificación
  onIdentificationUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea PDF o imagen
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        // Validar tamaño (10MB max)
        if (file.size <= 10 * 1024 * 1024) {
          this.identificationDocumentFile = file;
          console.log('✅ Documento de identificación seleccionado:', file.name);
        } else {
          this.clientInfoErrorMessage = 'El archivo no debe superar los 10MB';
          setTimeout(() => this.clientInfoErrorMessage = '', 5000);
          event.target.value = '';
        }
      } else {
        this.clientInfoErrorMessage = 'Por favor selecciona un archivo PDF o imagen válido (JPG, PNG, GIF)';
        setTimeout(() => this.clientInfoErrorMessage = '', 5000);
        event.target.value = '';
      }
    }
  }

  // Cargar datos específicos del cliente (emergency contacts, etc.)
  async loadClientInfoData() {
    this.isLoadingClientData = true;
    this.clientInfoErrorMessage = '';

    try {
      const token = this.authService.getToken();
      
      if (!token) {
        console.error('❌ No hay token disponible');
        this.clientInfoErrorMessage = 'Sesión no válida. Por favor inicia sesión nuevamente.';
        this.isLoadingClientData = false;
        return;
      }

      console.log('🔐 Token disponible, realizando petición a /api/v1/client/data');
      
      const response = await fetch('http://localhost:8000/api/v1/client/data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Respuesta recibida:', response.status, response.statusText);

      if (response.status === 404) {
        // Cliente no tiene datos todavía, inicializar con valores vacíos
        console.log('ℹ️ Cliente sin datos previos (404), inicializando formulario vacío');
        this.clientData = {
          verification_status: 'pending',
          identification_document: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          number_of_children: 0,
          special_requirements: ''
        };
        // Limpiar el mensaje de error porque 404 es esperado para clientes nuevos
        this.clientInfoErrorMessage = '';
      } else if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos específicos del cliente cargados:', data);
        
        if (data.success && data.data) {
          this.clientData = {
            ...this.clientData,
            ...data.data
          };
        }
        // Limpiar el mensaje de error en caso de éxito
        this.clientInfoErrorMessage = '';
      } else if (response.status === 401) {
        console.error('❌ Sesión expirada (401) al cargar datos del cliente');
        this.authService.forceLogout();
        this.router.navigate(['/login']);
      } else {
        // Intentar leer el mensaje de error del servidor
        try {
          const errorData = await response.json();
          console.error('❌ Error del servidor:', errorData);
          this.clientInfoErrorMessage = errorData.message || `Error del servidor: ${response.status}`;
        } catch (e) {
          console.error('❌ Error al cargar datos del cliente (status:', response.status, ')');
          this.clientInfoErrorMessage = `Error del servidor (${response.status}). Por favor intenta nuevamente.`;
        }
      }
    } catch (error: any) {
      console.error('❌ Error de red o excepción al cargar datos del cliente:', error);
      this.clientInfoErrorMessage = error.message || 'Error de conexión al cargar la información del cliente';
    } finally {
      this.isLoadingClientData = false;
    }
  }

  // Guardar datos específicos del cliente (emergency contacts, etc.)
  async saveClientInfoData() {
    this.isSavingClientData = true;
    this.clientInfoErrorMessage = '';
    this.clientInfoSuccessMessage = '';

    // Validación frontend
    if (!this.clientData.emergency_contact_name || this.clientData.emergency_contact_name.length < 2) {
      this.clientInfoErrorMessage = 'El nombre del contacto de emergencia debe tener al menos 2 caracteres';
      this.isSavingClientData = false;
      return;
    }

    if (!this.clientData.emergency_contact_name.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)) {
      this.clientInfoErrorMessage = 'El nombre del contacto de emergencia solo puede contener letras y espacios';
      this.isSavingClientData = false;
      return;
    }

    if (!this.clientData.emergency_contact_phone || !this.clientData.emergency_contact_phone.match(/^\d{10,15}$/)) {
      this.clientInfoErrorMessage = 'El teléfono del contacto de emergencia debe contener entre 10 y 15 dígitos';
      this.isSavingClientData = false;
      return;
    }

    if (this.clientData.number_of_children < 0 || this.clientData.number_of_children > 20) {
      this.clientInfoErrorMessage = 'El número de niños debe estar entre 0 y 20';
      this.isSavingClientData = false;
      return;
    }

    try {
      const token = this.authService.getToken();
      const formData = new FormData();
      
      formData.append('emergency_contact_name', this.clientData.emergency_contact_name);
      formData.append('emergency_contact_phone', this.clientData.emergency_contact_phone);
      formData.append('number_of_children', this.clientData.number_of_children.toString());
      formData.append('special_requirements', this.clientData.special_requirements || '');
      
      if (this.identificationDocumentFile) {
        formData.append('identification_document', this.identificationDocumentFile);
      }

      const response = await fetch('http://localhost:8000/api/v1/client/data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Datos del cliente guardados:', data);
        this.clientInfoSuccessMessage = data.message || 'Información guardada correctamente';
        this.identificationDocumentFile = null;
        
        // Recargar datos del cliente
        await this.loadClientInfoData();
        
        setTimeout(() => this.clientInfoSuccessMessage = '', 5000);
      } else if (response.status === 401) {
        console.error('❌ Sesión expirada al guardar datos del cliente');
        this.authService.forceLogout();
        this.router.navigate(['/login']);
      } else if (response.status === 400 && data.errors) {
        // Errores de validación del backend
        this.clientInfoErrorMessage = data.errors.map((err: any) => err.msg).join(', ');
      } else {
        this.clientInfoErrorMessage = data.message || 'Error al guardar la información';
      }
    } catch (error) {
      console.error('❌ Error al guardar datos del cliente:', error);
      this.clientInfoErrorMessage = 'Error de conexión al guardar la información';
    } finally {
      this.isSavingClientData = false;
    }
  }

  // Disparar selección de documento de identificación
  triggerIdentificationInput() {
    const fileInput = document.getElementById('identificationDocument') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Obtener texto del estado de verificación
  getVerificationStatusText(status?: string): string {
    // Si se llama sin parámetro, usar el estado actual del clientInfo
    if (status === undefined) {
      return this.clientInfo?.is_verified ? 'Verificación completada' : 'Verificación pendiente';
    }
    
    // Si se llama con parámetro, usar el status proporcionado
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'verified': return 'Verificado';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  // Obtener URL completa del documento de identificación
  getIdentificationDocumentUrl(): string {
    if (!this.clientData?.identification_document) {
      return '';
    }

    const document = this.clientData.identification_document;

    // Si ya es una URL completa
    if (document.startsWith('http')) {
      return document;
    }

    // Si empieza con /uploads/
    if (document.startsWith('/uploads/')) {
      return `http://localhost:8000${document}`;
    }

    // Si es solo el nombre del archivo
    return `http://localhost:8000/uploads/${document}`;
  }

  // Verificar si el documento de identificación es una imagen
  isIdentificationImage(): boolean {
    if (!this.clientData?.identification_document) {
      return false;
    }

    const doc = this.clientData.identification_document.toLowerCase();
    return doc.endsWith('.jpg') || doc.endsWith('.jpeg') || 
           doc.endsWith('.png') || doc.endsWith('.gif');
  }

  // Verificar si el documento de identificación es un PDF
  isIdentificationPDF(): boolean {
    if (!this.clientData?.identification_document) {
      return false;
    }

    return this.clientData.identification_document.toLowerCase().endsWith('.pdf');
  }

  // Métodos para manejar notificaciones
  handleNotificationClick(notification: Notification) {
    console.log('Notification clicked:', notification);
    
    // Marcar como leída en el backend
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar localmente
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index !== -1) {
              this.notifications[index].is_read = true;
              this.notifications[index].read_at = new Date().toISOString();
            }
            console.log('✅ Notificación marcada como leída');
          }
        },
        error: (error) => {
          console.error('❌ Error marcando notificación como leída:', error);
        }
      });
    }

    // Navegar a la URL de acción si existe
    if (notification.action_url) {
      // Extraer la vista del action_url (ej: 'services', 'payments')
      const view = notification.action_url.replace('/', '');
      if (view) {
        this.currentView = view;
      }
    }
  }

  markAllNotificationsAsRead() {
    console.log('Marking all notifications as read');
    this.notificationService.markAllAsRead(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = this.notifications.map(n => ({
            ...n,
            is_read: true,
            read_at: n.read_at || new Date().toISOString()
          }));
          console.log('✅ Todas las notificaciones marcadas como leídas');
        }
      },
      error: (error) => {
        console.error('❌ Error marcando notificaciones como leídas:', error);
      }
    });
  }

  // Método para cargar notificaciones desde el backend
  private loadNotifications() {
    console.log('📋 Cargando notificaciones...');
    this.notificationService.getNotifications(this.currentUserId, false, 50).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.data;
          console.log('✅ Notificaciones cargadas:', this.notifications.length);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando notificaciones:', error);
        // Si hay error, usar datos de ejemplo para desarrollo
        this.notifications = [
          {
            id: 1,
            title: 'Nuevo servicio confirmado',
            message: 'Tu servicio de cuidado para el 15 de noviembre ha sido confirmado.',
            type: 'service',
            is_read: false,
            action_url: 'contracted-services',
            related_id: 123,
            related_type: 'service',
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 2,
            title: 'Pago procesado exitosamente',
            message: 'Tu pago de $450.00 ha sido procesado correctamente.',
            type: 'payment',
            is_read: false,
            action_url: 'payments',
            related_id: 456,
            related_type: 'payment',
            created_at: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 3,
            title: 'Recuerda calificar tu servicio',
            message: 'Tu opinión es importante. Califica el servicio completado el 10 de noviembre.',
            type: 'info',
            is_read: true,
            action_url: 'contracted-services',
            related_id: 789,
            related_type: 'service',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            read_at: new Date(Date.now() - 43200000).toISOString()
          }
        ];
      }
    });
  }
}