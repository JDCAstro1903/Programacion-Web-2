import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent, HeaderConfig, Notification } from '../../shared/components/header/header.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { NotificationsPanelComponent } from '../../shared/components/notifications-panel/notifications-panel.component';
import { WhatsappButtonComponent } from '../../shared/components/whatsapp-button/whatsapp-button.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { ClientService as ClientApiService, ClientInfo, ClientServiceData, ClientPayment, ClientStats } from '../../services/client.service';
import { NotificationService } from '../../services/notification.service';
import { ServiceService, ServiceData } from '../../services/service.service';
import { BankDetailsService, BankDetail } from '../../services/bank-details.service';
import { PaymentService, Payment } from '../../services/payment.service';

// Interfaz mejorada para servicios del cliente con información de nanny
interface ClientServiceComplete extends ServiceData {
  showRating?: boolean;
  tempRating?: number;
  isRated?: boolean;
  nanny_profile_image?: string;
  nanny_full_name?: string;
  service_type_name?: string; // Nombre legible del tipo de servicio
}

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
  service_type_name?: string; // Nombre legible del tipo de servicio
  nanny_id?: number;
  nanny_profile_image?: string;
  nanny_full_name?: string;
  nanny_phone?: string;
  nanny_email?: string;
  paymentInitiated?: boolean; // Indica si hay un pago en progreso
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
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    SidebarComponent, 
    HeaderComponent, 
    LogoutModalComponent, 
    NotificationsPanelComponent, 
    WhatsappButtonComponent
  ],
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

  // Estado del modal de creación de servicio
  showServiceModal: boolean = false;
  serviceModalType: 'loading' | 'success' | 'error' | 'warning' = 'loading';
  serviceModalTitle: string = '';
  serviceModalMessage: string = '';
  serviceModalErrors: string[] = [];

  // Estado del modal de cancelación de servicio
  showCancelModal: boolean = false;
  serviceToCancel: any = null;

  // Estado del modal de cambio de fecha
  showChangeDateModal: boolean = false;
  serviceToChangeDate: any = null;
  
  // Calendario para cambio de fecha
  changeDateCalendarMonth: number = new Date().getMonth();
  changeDateCalendarYear: number = new Date().getFullYear();
  selectedNewDate: Date | null = null;
  selectedNewStartTime: string = '';
  selectedNewEndTime: string = '';
  minSelectableDate: Date | null = null;

  // Estado del modal de perfil de niñera
  private nannyProfileSubject = new BehaviorSubject<any>(null);
  showNannyProfileModal$ = this.nannyProfileSubject.asObservable();

  // Datos bancarios activos para mostrar en el modal
  currentBankData: any = null;

  // Estado para mostrar servicio creado
  showServiceDetails: boolean = false;
  createdService: any = null;

  // Datos dinámicos del cliente
  clientInfo: ClientInfo | null = null;
  contractedServices: ExtendedClientService[] = [];
  clientPayments: Payment[] = [];
  clientStats: ClientStats | null = null;
  notifications: Notification[] = [];
  
  // Filtros de pagos
  selectedPaymentStatus: string = '';
  sortPaymentsBy: string = 'recent';
  showFiltersMenu: boolean = false;
  
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

  // Preview del documento de identificación
  identificationPreviewUrl: string | null = null;
  identificationPreviewType: 'image' | 'pdf' | null = null;

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
    private bankDetailsService: BankDetailsService,
    private paymentService: PaymentService
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
          label: 'Cliente',
          icon: 'user-check'
        },
        {
          id: 'notifications',
          label: 'Notificaciones',
          icon: 'bell'
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
    // Debug del localStorage
    
    // Obtener el usuario actual desde el AuthService
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
    } else {
      
      // Intentar obtener desde localStorage directamente
      try {
        const userStr = localStorage.getItem('current_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.id) {
            this.currentUserId = user.id;
          }
        }
      } catch (error) {
      }
    }
        
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
    
    // Limpiar Object URLs del preview
    this.clearIdentificationPreview();
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'currentUser') {
      this.loadClientInfo();
    }
  }

  private handleVisibilityChange() {
    if (!document.hidden) {
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
    this.clientApiService.getClientInfo(this.currentUserId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.clientInfo = response.data;
          if (this.clientInfo && this.clientInfo.profile_image) {
          } else {
          }
          
          // ⭐ SINCRONIZAR is_verified con profileData para que el overlay funcione
          if (this.clientInfo) {
            this.profileData.is_verified = this.clientInfo.is_verified || false;
            this.profileData.first_name = this.clientInfo.first_name;
            this.profileData.last_name = this.clientInfo.last_name;
            this.profileData.email = this.clientInfo.email;
            this.profileData.profile_image = this.clientInfo.profile_image || '';
          }
          
          // Actualizar headerConfig con la información del cliente
          if (this.clientInfo) {
            const userName = `${this.clientInfo.first_name} ${this.clientInfo.last_name}`.trim();
            let avatarUrl = '/assets/logo.png';
            
            
            if (this.clientInfo.profile_image) {
              if (this.clientInfo.profile_image.startsWith('http')) {
                avatarUrl = this.clientInfo.profile_image;
              } else if (this.clientInfo.profile_image.startsWith('/uploads/')) {
                avatarUrl = `http://localhost:8000${this.clientInfo.profile_image}`;
              } else {
                avatarUrl = `http://localhost:8000/uploads/${this.clientInfo.profile_image}`;
              }
            } else 
              {
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
        this.isLoadingClientInfo = false;
      },
      error: (error: any) => {
        this.isLoadingClientInfo = false;
      }
    });
  }

  private loadClientServices() {
    this.isLoadingServices = true;
    this.clientApiService.getClientServices(this.currentUserId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.contractedServices = response.data.map((service: any) => {
            // Construir nombre completo de la nanny
            const nanny_full_name = service.nanny ? 
              `${service.nanny.first_name || ''} ${service.nanny.last_name || ''}`.trim() : 
              '';
            
            // Construir URL de la imagen de la nanny
            let nanny_profile_image = 'assets/logo.png';
            if (service.nanny?.profile_image) {
              const img = service.nanny.profile_image;
              if (img.startsWith('http')) {
                nanny_profile_image = img;
              } else if (img.startsWith('/uploads/')) {
                nanny_profile_image = `http://localhost:8000${img}`;
              } else {
                nanny_profile_image = `http://localhost:8000/uploads/${img}`;
              }
            }
            
            // Obtener nombre legible del tipo de servicio
            const service_type_name = this.getServiceTypeName(service.service_type);
            
            // Procesar el servicio con fechas parseadas correctamente
            const processedService: any = {
              ...service,
              nanny_full_name,
              nanny_profile_image,
              nanny_phone: service.nanny?.phone_number,
              nanny_email: service.nanny?.email,
              service_type_name,
              showRating: false,
              tempRating: 0,
              isRated: (service.rating && service.rating.rating && service.rating.rating > 0) ? true : false,
              rating: service.rating || { rating: 0 }
            };
            
            // Convertir strings de fecha a Date objects para Angular date pipe
            if (service.start_date) {
              try {
                if (typeof service.start_date === 'string') {
                  // Puede venir como 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM:SS.sssZ'
                  const dateStr = service.start_date.split('T')[0]; // Tomar solo la parte de fecha
                  const parts = dateStr.split('-');
                  if (parts.length === 3) {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // Mes en JavaScript es 0-indexed
                    const day = parseInt(parts[2]);
                    processedService.start_date = new Date(year, month, day);
                  } else {
                    processedService.start_date = null;
                  }
                } else if (service.start_date instanceof Date) {
                  processedService.start_date = new Date(service.start_date);
                } else {
                  processedService.start_date = null;
                }
              } catch (e) {
                processedService.start_date = null;
              }
            } else {
              processedService.start_date = null;
            }
            
            if (service.end_date) {
              try {
                if (typeof service.end_date === 'string') {
                  // Puede venir como 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM:SS.sssZ'
                  const dateStr = service.end_date.split('T')[0]; // Tomar solo la parte de fecha
                  const parts = dateStr.split('-');
                  if (parts.length === 3) {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // Mes en JavaScript es 0-indexed
                    const day = parseInt(parts[2]);
                    processedService.end_date = new Date(year, month, day);
                  } else {
                    processedService.end_date = null;
                  }
                } else if (service.end_date instanceof Date) {
                  processedService.end_date = new Date(service.end_date);
                } else {
                  processedService.end_date = null;
                }
              } catch (e) {
                processedService.end_date = null;
              }
            }
            
           
            // Agregar propiedad para control de pago
            processedService.paymentInitiated = false;
            
            return processedService as ClientServiceComplete;
          });
        }
        this.isLoadingServices = false;
      },
      error: (error: any) => {
        this.isLoadingServices = false;
      }
    });
  }

  private loadClientPayments() {
    this.isLoadingPayments = true;
    this.paymentService.getClientPayments().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.clientPayments = response.data;
        }
        this.isLoadingPayments = false;
      },
      error: (error: any) => {
        this.isLoadingPayments = false;
      }
    });
  }

  private loadClientStats() {
    this.isLoadingStats = true;
    this.clientApiService.getClientStats(this.currentUserId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.clientStats = response.data;
        }
        this.isLoadingStats = false;
      },
      error: (error: any) => {
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
  }

  // Transformar datos del servicio para la vista
  private transformServiceData(serviceData: any): any {

    // Construir URL de la imagen correctamente
    let nanny_profile_image = 'assets/logo.png';
    if (serviceData.nanny_profile_image) {
      const img = serviceData.nanny_profile_image;
      if (img.startsWith('http')) {
        nanny_profile_image = img;
      } else if (img.startsWith('/uploads/')) {
        nanny_profile_image = `http://localhost:8000${img}`;
      } else {
        nanny_profile_image = `http://localhost:8000/uploads/${img}`;
      }
    }

    // Intentar obtener email del nanny - puede venir en diferentes formatos
    const nannyEmail = serviceData.nanny_email || 
                       serviceData.nanny?.email || 
                       serviceData.user?.email ||
                       serviceData.user_email ||
                       '';

    // Intentar obtener phone del nanny - el backend retorna como 'nanny_phone'
    const nannyPhoneNumber = serviceData.nanny_phone || 
                            serviceData.nanny_phone_number || 
                            serviceData.nanny?.phone_number ||
                            serviceData.nanny?.phone ||
                            serviceData.user?.phone_number ||
                            serviceData.user_phone ||
                            serviceData.user_phone_number ||
                            '';

    const result = {
      ...serviceData,
      nanny: serviceData.nanny_id ? {
        id: serviceData.nanny_id,
        name: `${serviceData.nanny_first_name || ''} ${serviceData.nanny_last_name || ''}`.trim(),
        first_name: serviceData.nanny_first_name,
        last_name: serviceData.nanny_last_name,
        profile_image: nanny_profile_image,
        phone_number: nannyPhoneNumber,
        email: nannyEmail,
        rating: parseFloat(serviceData.nanny_rating) || 0
      } : null
    };
  
    return result;
  }

  // Ver detalles de un servicio existente
  viewServiceDetails(serviceId: number) {
    
    // Hacer llamada al API para obtener los detalles completos del servicio
    this.serviceService.getServiceById(serviceId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Transformar datos para que coincidan con el formato esperado por el HTML
          this.selectedService = this.transformServiceData(response.data);
          this.serviceInstructions = response.data.special_instructions || '';
          this.currentView = 'service-details';
        } 
        else {
        }
      },
      error: (error: any) => {
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

    
    // Actualizar en el backend
    this.serviceService.updateService(this.selectedService.id, {
      special_instructions: this.serviceInstructions
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.selectedService.special_instructions = this.serviceInstructions;
          this.isEditingInstructions = false;
          alert('Indicaciones actualizadas correctamente');
          
          // Recargar servicios para reflejar los cambios
          this.loadClientServices();
        }
      },
      error: (error: any) => {
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
    alert('Función de cambio de fecha/hora próximamente disponible');
  }

  // Abrir modal de calificación
  openRatingModal() {
    if (!this.selectedService) return;
    // Usar la funcionalidad existente de calificación
    this.rateService(this.selectedService.id);
  }

  // Confirmar cancelación de servicio
  confirmCancelService() {
    if (!this.selectedService) {
      return;
    }
    
    this.serviceToCancel = this.selectedService;
    this.showCancelModal = true;
  }

  // Abrir modal de cancelación (Legacy - mantener por compatibilidad)
  openCancelModal() {
    this.confirmCancelService();
  }

  // Cancelar servicio por ID
  cancelServiceById(serviceId: number) {
    this.serviceService.deleteService(serviceId).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Cerrar modal de cancelación
          this.closeCancelModal();
          
          // Mostrar mensaje de éxito
          this.serviceModalType = 'success';
          this.serviceModalTitle = '✓ Servicio Cancelado';
          this.serviceModalMessage = 'El servicio ha sido cancelado correctamente';
          this.showServiceModal = true;
          
          // Volver a la lista y recargar servicios
          setTimeout(() => {
            this.closeServiceModal();
            this.backToServices();
            this.loadClientServices();
          }, 2000);
        }
      },
      error: (error: any) => {
        this.closeCancelModal();
        this.serviceModalType = 'error';
        this.serviceModalTitle = 'Error al Cancelar';
        this.serviceModalMessage = error.error?.message || 'Error al cancelar el servicio. Por favor intenta nuevamente.';
        this.showServiceModal = true;
      }
    });
  }

  // Cerrar modal de cancelación
  closeCancelModal() {
    this.showCancelModal = false;
    this.serviceToCancel = null;
  }

  // Procesar cancelación desde modal
  processCancelService() {
    if (!this.serviceToCancel) return;
    this.cancelServiceById(this.serviceToCancel.id);
  }

  // Método helper para abrir perfil desde servicio
  openNannyProfile(service: any) {
    if (!service) {
      return;
    }

    const nannyData = {
      name: service.nanny_full_name || service.nanny?.first_name || 'Sin nombre',
      profile_image: service.nanny_profile_image || service.nanny?.profile_image || 'assets/logo.png',
      phone_number: service.nanny_phone || service.nanny?.phone_number || service.nanny?.phone || '',
      email: service.nanny_email || service.nanny?.email || '',
      rating: service.nanny?.rating || 0,
      reviews_count: service.nanny?.reviews_count || 0,
      bio: service.nanny?.bio || '',
      experience: service.nanny?.experience || '',
      specialties: service.nanny?.specialties || []
    };

    this.showNannyProfileModal(nannyData);
  }

  // Ver perfil de la niñera - Abre el modal
  showNannyProfileModal(nanny: any) {
    if (!nanny) {
      return;
    }
    
    // Normalizar el objeto nanny para asegurar que tiene todas las propiedades
    const normalizedNanny = {
      name: nanny.name || nanny.first_name || 'Sin nombre',
      profile_image: nanny.profile_image || nanny.nanny_profile_image || 'assets/logo.png',
      phone_number: nanny.phone_number || nanny.phone || nanny.nanny_phone || '',
      email: nanny.email || nanny.nanny_email || '',
      rating: nanny.rating || 0,
      reviews_count: nanny.reviews_count || 0,
      bio: nanny.bio || '',
      experience: nanny.experience || '',
      specialties: nanny.specialties || []
    };
    
    this.nannyProfileSubject.next(normalizedNanny);
  }

  // Cerrar modal de perfil de niñera
  closeNannyProfileModal() {
    this.nannyProfileSubject.next(null);
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
    this.openLogoutModal();
  }

  onHeaderProfileClick() {
    // Este método ya no es necesario porque el header navega directamente a /profile
  }

  /**
   * Manejar click en una notificación - Navega a la vista de notificaciones
   */
  handleNotificationClick(notification: Notification) {
    const timestamp = new Date().toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    // Marcar como leída si no está leída
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Actualizar en la lista local
          const notif = this.notifications.find(n => n.id === notification.id);
          if (notif) {
            notif.is_read = true;
          }
        },
        error: (error) => {
        }
      });
    }
    
    // Navegar a la vista de notificaciones en el dashboard
    this.currentView = 'notifications';
  }

  /**
   * Manejar click en notificación desde el panel en la vista de notificaciones
   */
  handleNotificationPanelClick(notification: Notification) {
    // Si es una notificación de servicio, navegar a la vista de servicios
    if (notification.type === 'success' && notification.related_type === 'service') {
      this.currentView = 'services';
      this.servicesView = 'services-history';
      // Cargar servicios para que se muestre el servicio confirmado
      this.loadClientServices();
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllNotificationsAsRead() {
    
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        // Las notificaciones se actualizan automáticamente en el BehaviorSubject
      },
      error: (error) => {
      }
    });
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
  }

  // Métodos para manejar servicios (para futuras implementaciones)
  requestService() {
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

  // Manejadores de eventos para los combobox de hora
  onStartTimeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const time = target.value;
    if (time) {
      this.selectStartTime(time);
    }
  }

  onEndTimeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const time = target.value;
    if (time) {
      this.selectEndTime(time);
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
    
    // Si no hay rango de fechas, es un solo día
    if (!this.selectedDate || !this.selectedEndDate) {
      let hoursPerDay = endHour - startHour;
      let minutesPerDay = endMin - startMin;
      
      if (hoursPerDay < 0) {
        hoursPerDay += 24;
      }
      
      if (minutesPerDay < 0) {
        hoursPerDay -= 1;
        minutesPerDay += 60;
      }
      
      if (minutesPerDay === 0) {
        return `${hoursPerDay} hora${hoursPerDay !== 1 ? 's' : ''}`;
      }
      
      return `${hoursPerDay}h ${minutesPerDay}min`;
    }
    
    // Calcular con rango de fechas
    const startDateObj = new Date(this.selectedDate);
    const endDateObj = new Date(this.selectedEndDate);
    const numberOfDays = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (numberOfDays === 0) {
      // Mismo día
      let hoursPerDay = endHour - startHour;
      let minutesPerDay = endMin - startMin;
      
      if (hoursPerDay < 0) {
        hoursPerDay += 24;
      }
      
      if (minutesPerDay < 0) {
        hoursPerDay -= 1;
        minutesPerDay += 60;
      }
      
      return `${hoursPerDay}h ${minutesPerDay}min`;
    }
    
    // Múltiples días
    const firstDayHours = 24 - startHour - (startMin / 60);
    const lastDayHours = endHour + (endMin / 60);
    const middleDays = numberOfDays - 1;
    
    const firstDayHoursInt = Math.floor(firstDayHours);
    const firstDayMins = Math.round((firstDayHours - firstDayHoursInt) * 60);
    
    const lastDayHoursInt = Math.floor(lastDayHours);
    const lastDayMins = Math.round((lastDayHours - lastDayHoursInt) * 60);
    
    let result = `Día 1: ${startHour}:${String(startMin).padStart(2, '0')} a 24:00 (${firstDayHoursInt}h${firstDayMins > 0 ? ` ${firstDayMins}min` : ''})`;
    
    if (middleDays > 0) {
      result += ` + ${middleDays} día${middleDays > 1 ? 's' : ''} completo${middleDays > 1 ? 's' : ''} (${middleDays * 24}h)`;
    }
    
    result += ` + Día ${numberOfDays + 1}: 00:00 a ${endHour}:${String(endMin).padStart(2, '0')} (${lastDayHoursInt}h${lastDayMins > 0 ? ` ${lastDayMins}min` : ''})`;
    
    return result;
  }

  /**
   * Calcula el total de horas en formato decimal para cálculos de cobro
   * Fórmula correcta: 
   * - Primer día: 24 - hora_inicio - minutos_inicio/60
   * - Días intermedios: (número de días - 1) × 24
   * - Último día: hora_fin + minutos_fin/60
   */
  calculateTotalHoursDecimal(): number {
    if (!this.selectedStartTime || !this.selectedEndTime) return 0;
    
    const [startHour, startMin] = this.selectedStartTime.split(':').map(Number);
    const [endHour, endMin] = this.selectedEndTime.split(':').map(Number);
    
    const startMinFraction = startMin / 60;
    const endMinFraction = endMin / 60;
    
    // Si no hay rango de fechas, calcular solo para un día
    if (!this.selectedDate || !this.selectedEndDate) {
      let hoursPerDay = endHour - startHour;
      let minutesPerDay = endMin - startMin;
      
      if (hoursPerDay < 0) {
        hoursPerDay += 24;
      }
      
      if (minutesPerDay < 0) {
        hoursPerDay -= 1;
        minutesPerDay += 60;
      }
      
      return Math.round((hoursPerDay + (minutesPerDay / 60)) * 100) / 100;
    }
    
    // Calcular con rango de fechas
    const startDateObj = new Date(this.selectedDate);
    const endDateObj = new Date(this.selectedEndDate);
    const numberOfDays = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (numberOfDays === 0) {
      // Mismo día
      let hoursPerDay = endHour - startHour;
      let minutesPerDay = endMin - startMin;
      
      if (hoursPerDay < 0) {
        hoursPerDay += 24;
      }
      
      if (minutesPerDay < 0) {
        hoursPerDay -= 1;
        minutesPerDay += 60;
      }
      
      return Math.round((hoursPerDay + (minutesPerDay / 60)) * 100) / 100;
    }
    
    // Múltiples días - Cálculo correcto
    // Primer día: desde hora_inicio hasta las 24:00
    const firstDayHours = 24 - startHour - startMinFraction;
    
    // Últmo día: desde las 00:00 hasta hora_fin
    const lastDayHours = endHour + endMinFraction;
    
    // Días completos en el medio (24 horas cada uno)
    const middleDaysCount = numberOfDays - 1;
    const middleDaysHours = middleDaysCount * 24;
    
    // Total
    const totalHours = firstDayHours + middleDaysHours + lastDayHours;
    
    return Math.round(totalHours * 100) / 100; // Redondear a 2 decimales
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

  /**
   * Formatear fecha completa con día de la semana en español
   */
  formatDateLong(date: Date | string | null | undefined): string {
    if (!date) return 'Fecha no disponible';

    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        const dateStr = date.split('T')[0];
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        } else {
          dateObj = new Date(date);
        }
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Tipo inválido';
      }

      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }

      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const dayName = dayNames[dateObj.getDay()];
      const day = dateObj.getDate();
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();

      return `${dayName}, ${day} de ${month} de ${year}`;
    } catch (error) {
      return 'Error al formatear';
    }
  }

  /**
   * Formatear fecha corta sin año
   */
  formatDate(date: Date | string | null | undefined): string {
    // Validar que la fecha exista
    if (!date) {
      return 'Fecha no disponible';
    }

    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        // Manejar formato 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM:SS'
        const dateStr = date.split('T')[0]; // Tomar solo la parte de fecha
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Mes 0-indexed
          const day = parseInt(parts[2]);
          dateObj = new Date(year, month, day);
        } else {
          return 'Formato inválido';
        }
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Tipo inválido';
      }

      // Validar que el Date object sea válido
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }

      const day = dateObj.getDate();
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const month = monthNames[dateObj.getMonth()];
      
      return `${day} de ${month}`;
    } catch (error) {
      return 'Error al formatear';
    }
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
  }

  // Generar opciones para los combobox
  getChildrenOptions(): number[] {
    return Array.from({length: 8}, (_, i) => i + 1); // 1-8 niños
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

  getMonthYearDisplay(): string {
    return `${this.getMonthName()} ${this.currentYear}`;
  }

  get currentMonthDays(): number[] {
    return this.getDaysInMonth();
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
    // Validar campos requeridos
    const validationErrors: string[] = [];
    
    if (!this.selectedDate) validationErrors.push('Debes seleccionar una fecha');
    if (!this.selectedStartTime) validationErrors.push('Debes seleccionar una hora de inicio');
    if (!this.selectedEndTime) validationErrors.push('Debes seleccionar una hora de fin');
    if (!this.selectedServiceType) validationErrors.push('Debes seleccionar un tipo de servicio');
    if (!this.selectedChildren || this.selectedChildren < 1) validationErrors.push('Debes indicar al menos 1 niño');
    
    if (validationErrors.length > 0) {
      this.showServiceModalWithErrors('warning', '⚠️ Campos incompletos', 'Por favor completa todos los campos requeridos', validationErrors);
      return;
    }

    // Obtener el client_id del cliente logueado
    let clientId: number | undefined;
    
    // Primero intentar obtener desde clientInfo (ya cargado)
    if (this.clientInfo?.id) {
      clientId = this.clientInfo.id;
    } else {
      // Si clientInfo no está disponible, intentar desde localStorage
      const userStr = localStorage.getItem('current_user');
      if (!userStr) {
        this.showServiceModalWithErrors('error', '❌ Error de usuario', 'No se encontró información del usuario', ['Inicia sesión nuevamente']);
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        // El userData solo tiene user_id, necesitamos esperar a que clientInfo se cargue
        this.showServiceModalWithErrors('error', '❌ Información incompleta', 'Todavía se está cargando tu información. Por favor, espera unos segundos e intenta de nuevo.', ['Intenta de nuevo']);
        return;
      } catch (error) {
        this.showServiceModalWithErrors('error', '❌ Error al procesar datos', 'Hubo un problema procesando tu información', ['Inicia sesión nuevamente']);
        return;
      }
    }

    // Mostrar modal de carga
    this.showServiceModal = true;
    this.serviceModalType = 'loading';
    this.serviceModalTitle = '⏳ Creando servicio...';
    this.serviceModalMessage = 'Por favor espera mientras procesamos tu solicitud';
    this.serviceModalErrors = [];

    // Obtener el nombre del servicio desde serviceTypes
    const selectedService = this.serviceTypes.find(s => s.id === this.selectedServiceType);
    const serviceTitle = selectedService ? selectedService.name : 'Servicio de cuidado';

    // Preparar datos del servicio (selectedDate ya fue validado arriba)
    const serviceData: ServiceData = {
      client_id: clientId!,
      title: `${serviceTitle} - ${this.selectedDate!.getDate()} de ${this.getMonthName()}`,
      service_type: this.getServiceTypeEnum(this.selectedServiceType),
      description: `Servicio de ${serviceTitle} para ${this.selectedChildren} niño(s)`,
      start_date: this.serviceService.formatDate(this.selectedDate!),
      end_date: this.selectedEndDate ? this.serviceService.formatDate(this.selectedEndDate) : undefined,
      start_time: this.selectedStartTime,
      end_time: this.selectedEndTime,
      number_of_children: this.selectedChildren,
      special_instructions: '',
      address: this.clientInfo?.address || 'Dirección no proporcionada'
    };


    // Llamar al servicio para crear el servicio
    this.serviceService.createService(serviceData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          
          // Mostrar modal de éxito
          this.serviceModalType = 'success';
          this.serviceModalTitle = ' ¡Servicio creado exitosamente!';
          this.serviceModalMessage = `Tu servicio ha sido confirmado para el ${this.formatSelectedDate()} de ${this.selectedStartTime} a ${this.selectedEndTime}.\n\nUna nanny ha sido asignada y recibirá una notificación sobre tu solicitud.`;
          this.serviceModalErrors = [];

          // Después de 3 segundos, cargar detalles del servicio
          setTimeout(() => {
            if (response.data?.serviceId) {
              this.serviceService.getServiceById(response.data.serviceId).subscribe({
                next: (detailResponse) => {
                  if (detailResponse.success && detailResponse.data) {
                    // Transformar datos para que coincidan con el formato esperado
                    this.selectedService = this.transformServiceData(detailResponse.data);
                    this.serviceInstructions = detailResponse.data.special_instructions || '';
                    this.currentView = 'service-details';
                    

                    // Cerrar modal
                    this.closeServiceModal();

                    // Recargar la lista de servicios en background
                    this.loadClientServices();
                  }
                },
                error: (error) => {
                  // Aunque haya error cargando detalles, el servicio se creó exitosamente
                  this.currentView = 'services';
                  this.servicesView = 'services-history';
                  this.closeServiceModal();
                  this.loadClientServices();
                }
              });
            }
          }, 2000);

          // Limpiar la selección del formulario
          this.selectedDate = null;
          this.selectedEndDate = null;
          this.selectedTime = '';
          this.selectedServiceType = '';
          this.selectedChildren = 1;
        }
      },
      error: (error) => {
        
        let errorTitle = ' Error al crear servicio';
        let errorMessage = 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.';
        const errorDetails: string[] = [];
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorTitle = '⚠️ No hay nannys disponibles';
          errorMessage = 'No hay nannys disponibles para las fechas y horarios solicitados.';
          errorDetails.push('Intenta con otro horario o fecha');
        } else if (error.status === 500) {
          errorTitle = '❌ Error del servidor';
          errorMessage = 'Hubo un error interno del servidor.';
          errorDetails.push('Por favor contacta al administrador');
        } else if (error.status === 0) {
          errorTitle = '❌ Error de conexión';
          errorMessage = 'No se pudo conectar con el servidor.';
          errorDetails.push('Verifica tu conexión a internet');
        }
        
        this.showServiceModalWithErrors('error', errorTitle, errorMessage, errorDetails);
      }
    });
  }

  /**
   * Muestra modal de servicio con mensajes de error
   */
  private showServiceModalWithErrors(type: 'loading' | 'success' | 'error' | 'warning', title: string, message: string, errors: string[] = []) {
    this.showServiceModal = true;
    this.serviceModalType = type;
    this.serviceModalTitle = title;
    this.serviceModalMessage = message;
    this.serviceModalErrors = errors;
  }

  /**
   * Cierra el modal de servicio
   */
  closeServiceModal() {
    this.showServiceModal = false;
    this.serviceModalType = 'loading';
    this.serviceModalTitle = '';
    this.serviceModalMessage = '';
    this.serviceModalErrors = [];
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
      return;
    }

    this.isLoadingServices = true;

    this.serviceService.getServices(this.clientInfo.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Aquí podrías mapear los servicios a tu formato local si es necesario
          this.isLoadingServices = false;
        }
      },
      error: (error) => {
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

  // Cambiar fecha del servicio (desde vista de detalles)
  changeServiceDate() {
    if (!this.selectedService) return;
    
    this.serviceToChangeDate = this.selectedService;
    
    // Calcular fecha mínima seleccionable (día siguiente al servicio actual)
    const currentServiceDate = new Date(this.selectedService.start_date);
    this.minSelectableDate = new Date(currentServiceDate);
    this.minSelectableDate.setDate(this.minSelectableDate.getDate() + 1);
    
    // Inicializar calendario en el mes de la fecha mínima
    this.changeDateCalendarMonth = this.minSelectableDate.getMonth();
    this.changeDateCalendarYear = this.minSelectableDate.getFullYear();
    
    // Limpiar selecciones previas
    this.selectedNewDate = null;
    this.selectedNewStartTime = '';
    this.selectedNewEndTime = '';
    
    this.showChangeDateModal = true;
  }

  // Cerrar modal de cambio de fecha
  closeChangeDateModal() {
    this.showChangeDateModal = false;
    this.serviceToChangeDate = null;
    this.selectedNewDate = null;
    this.selectedNewStartTime = '';
    this.selectedNewEndTime = '';
    this.minSelectableDate = null;
  }

  // Procesar cambio de fecha - cancela el servicio actual y abre el pool
  async processChangeDateService() {
    if (!this.serviceToChangeDate) return;
    
    // Validar que se haya seleccionado nueva fecha y horarios
    if (!this.selectedNewDate) {
      this.serviceModalType = 'warning';
      this.serviceModalTitle = '⚠️ Fecha requerida';
      this.serviceModalMessage = 'Por favor selecciona una nueva fecha para el servicio.';
      this.showServiceModal = true;
      return;
    }
    
    if (!this.selectedNewStartTime || !this.selectedNewEndTime) {
      this.serviceModalType = 'warning';
      this.serviceModalTitle = '⚠️ Horarios requeridos';
      this.serviceModalMessage = 'Por favor selecciona la hora de inicio y fin del servicio.';
      this.showServiceModal = true;
      return;
    }

    const serviceId = this.serviceToChangeDate.id;
    const serviceType = this.serviceToChangeDate.service_type;
    const numberOfChildren = this.serviceToChangeDate.number_of_children || 1;
    const specialInstructions = this.serviceToChangeDate.special_instructions || '';
    
    // Guardar las selecciones antes de cerrar el modal
    const newDate = this.selectedNewDate;
    const newStartTime = this.selectedNewStartTime;
    const newEndTime = this.selectedNewEndTime;
    
    try {
      // Paso 1: Cerrar modal de cambio de fecha y mostrar progreso
      this.closeChangeDateModal();
      this.serviceModalType = 'loading';
      this.serviceModalTitle = 'Procesando cambio de fecha...';
      this.serviceModalMessage = 'Cancelando servicio actual. La nanny será notificada de la cancelación.';
      this.showServiceModal = true;

      // Paso 2: Cancelar el servicio mediante el API
      await new Promise<void>((resolve, reject) => {
        this.serviceService.deleteService(serviceId).subscribe({
          next: (response: any) => {
            console.log('✅ Servicio cancelado:', response);
            if (response.success) {
              resolve();
            } else {
              reject(new Error(response.message || 'Error al cancelar el servicio'));
            }
          },
          error: (error) => {
            console.error('❌ Error al cancelar servicio:', error);
            reject(error);
          }
        });
      });

      // Paso 3: Actualizar mensaje - servicio cancelado exitosamente
      this.serviceModalMessage = 'Servicio cancelado. Preparando formulario para nueva fecha...';

      // Paso 4: Recargar servicios del cliente
      await new Promise<void>((resolve) => {
        this.clientApiService.getClientServices(this.currentUserId).subscribe({
          next: (response: any) => {
            if (response.success && response.data) {
              this.contractedServices = response.data
                .filter((service: any) => service.status !== 'cancelled')
                .map((service: any) => this.transformServiceData(service));
            }
            resolve();
          },
          error: () => resolve() // Continuar aunque falle la recarga
        });
      });

      // Paso 5: Mostrar mensaje de éxito
      this.serviceModalType = 'success';
      this.serviceModalTitle = '✓ Servicio Cancelado';
      this.serviceModalMessage = 'El servicio anterior ha sido cancelado exitosamente. Ahora puedes seleccionar una nueva fecha y horario. Las nannys disponibles recibirán una notificación con tu nueva solicitud.';

      // Paso 6: Preparar datos del nuevo servicio con la fecha y horarios seleccionados
      this.serviceModalMessage = 'Creando nuevo servicio con la fecha seleccionada...';
      
      // Obtener el nombre del servicio desde serviceTypes
      const serviceTypeMapping: { [key: string]: string } = {
        'hourly': 'home-care',
        'overnight': 'night-care',
        'weekly': 'weekly-care',
        'event': 'event-care',
        'travel': 'travel-care'
      };
      
      const mappedServiceType = serviceTypeMapping[serviceType] || 'home-care';
      const selectedServiceObj = this.serviceTypes.find(s => s.id === mappedServiceType);
      const serviceTitle = selectedServiceObj ? selectedServiceObj.name : 'Servicio de cuidado';
      
      // Formatear la fecha seleccionada
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const newServiceTitle = `${serviceTitle} - ${newDate.getDate()} de ${monthNames[newDate.getMonth()]}`;
      
      // Preparar datos del nuevo servicio
      const newServiceData: ServiceData = {
        client_id: this.clientInfo!.id,
        title: newServiceTitle,
        service_type: serviceType,
        description: `Servicio de ${serviceTitle} para ${numberOfChildren} niño(s)`,
        start_date: this.serviceService.formatDate(newDate),
        start_time: newStartTime,
        end_time: newEndTime,
        number_of_children: numberOfChildren,
        special_instructions: specialInstructions,
        address: this.clientInfo?.address || 'Dirección no proporcionada'
      };
      
      // Paso 7: Crear el nuevo servicio
      await new Promise<void>((resolve, reject) => {
        this.serviceService.createService(newServiceData).subscribe({
          next: (response) => {
            if (response.success) {
              resolve();
            } else {
              reject(new Error(response.message || 'Error al crear servicio'));
            }
          },
          error: (error) => reject(error)
        });
      });
      
      // Paso 8: Recargar servicios nuevamente
      await new Promise<void>((resolve) => {
        this.clientApiService.getClientServices(this.currentUserId).subscribe({
          next: (response: any) => {
            if (response.success && response.data) {
              this.services.upcoming = response.data.filter((s: any) => 
                s.status === 'pending' || s.status === 'confirmed' || s.status === 'in_progress'
              ).map((s: any) => this.transformServiceData(s));
              this.services.past = response.data.filter((s: any) => 
                s.status === 'completed' || s.status === 'cancelled'
              ).map((s: any) => this.transformServiceData(s));
            }
            resolve();
          },
          error: () => resolve()
        });
      });
      
      // Paso 9: Mostrar mensaje de éxito final
      this.serviceModalType = 'success';
      this.serviceModalTitle = '✓ Fecha Cambiada Exitosamente';
      this.serviceModalMessage = `¡Perfecto! Tu servicio ha sido reprogramado para el ${newDate.getDate()} de ${monthNames[newDate.getMonth()]} de ${newStartTime} a ${newEndTime}.\n\nUna nanny disponible ha sido notificada y confirmará tu servicio pronto.`;
      
      // Paso 10: Después de 3 segundos, cerrar modal y volver a la lista
      setTimeout(() => {
        this.closeServiceModal();
        this.closeChangeDateModal();
        
        // Salir de la vista de detalles
        this.selectedService = null;
        this.isEditingInstructions = false;
        
        // Volver a la lista de servicios
        this.currentView = 'services';
        this.servicesView = 'services-history';
      }, 3000);

    } catch (error: any) {
      console.error('❌ Error en processChangeDateService:', error);
      this.serviceModalType = 'error';
      this.serviceModalTitle = 'Error al Cambiar Fecha';
      this.serviceModalMessage = error.error?.message || error.message || 'No se pudo procesar el cambio de fecha. Por favor intenta nuevamente.';
      
      // Agregar detalles del error si están disponibles
      if (error.error?.error) {
        this.serviceModalErrors = [error.error.error];
      }
    }
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
  }

  hasValidReservation(): boolean {
    return !!(
      this.selectedDate && 
      this.selectedStartTime && 
      this.selectedEndTime && 
      this.selectedServiceType && 
      this.selectedChildren
    );
  }

  viewContractedServices() {
    this.currentView = 'contracted-services';
  }

  // Calificar servicio
  rateService(serviceId: number) {
    // Aquí se implementaría la lógica para calificar el servicio
    const service = this.contractedServices.find(s => s.id === serviceId);
    if (service) {
      service.showRating = true;
      service.tempRating = 0;
    }
  }

  // Establecer calificación con estrellas
  setRating(serviceId: number, rating: number) {
    if (rating === 0) return; // No permitir enviar sin seleccionar

    const service = this.contractedServices.find(s => s.id === serviceId);
    if (!service) return;

    // Enviar la calificación al backend
    const ratingData = {
      service_id: serviceId,
      rating: rating,
      review: '', // El usuario podría agregar una reseña más adelante
      punctuality_rating: rating,
      communication_rating: rating,
      care_quality_rating: rating,
      would_recommend: rating >= 4
    };

    this.clientApiService.rateService(ratingData).subscribe({
      next: (response) => {
        
        // Actualizar la interfaz
        service.rating = {
          given: true,
          rating: rating
        };
        service.isRated = true;
        service.showRating = false;
        service.tempRating = 0;
        
        // Mostrar mensaje de éxito
        this.showServiceModal = true;
        this.serviceModalType = 'success';
        this.serviceModalTitle = '✓ Calificación guardada';
        this.serviceModalMessage = `Gracias por calificar este servicio con ${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`;
      },
      error: (error) => {
        this.showServiceModal = true;
        this.serviceModalType = 'error';
        this.serviceModalTitle = 'Error al calificar';
        this.serviceModalMessage = 'No pudimos guardar tu calificación. Por favor intenta de nuevo.';
      }
    });
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

  // Método para obtener el nombre del tipo de servicio
  getServiceTypeName(serviceType: string): string {
    const typeNames: { [key: string]: string } = {
      'hourly': 'Niñeras a domicilio',
      'daily': 'Niñeras por día',
      'weekly': 'Niñeras por semana',
      'overnight': 'Niñeras nocturnas',
      'event': 'Acompañamiento a eventos',
      'travel': 'Acompañamiento en viajes',
      'home-care': 'Niñeras a domicilio',
      'night-care': 'Cuidado nocturno',
      'weekly-care': 'Niñeras por semana',
      'event-care': 'Acompañamiento a eventos',
      'travel-care': 'Acompañamiento en viajes'
    };
    return typeNames[serviceType] || serviceType;
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
   
    // Preferir clientInfo si está disponible, sino usar profileData
    const userData = this.clientInfo || this.profileData;
    
    if (userData && userData.first_name) {
      // Construir URL completa de la imagen de perfil para el header
      let avatarUrl = 'assets/logo.png';
      const profileImage = userData.profile_image || (this.profileData?.profile_image);
      
      if (profileImage) {
        if (profileImage.startsWith('http')) {
          avatarUrl = profileImage;
        } else if (profileImage.startsWith('/uploads/')) {
          // Si ya incluye /uploads/, solo agregar el host
          avatarUrl = `http://localhost:8000${profileImage}`;
        } else {
          // Si es solo el nombre del archivo
          avatarUrl = `http://localhost:8000/uploads/${profileImage}`;
        }
      } else {
      }
      
      return {
        name: `${userData.first_name} ${userData.last_name}`.trim(),
        role: 'Cliente',
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone_number,
        address: userData.address,
        avatar: avatarUrl,
        isVerified: userData.is_verified
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
            
      if (this.profileData.profile_image) {
        // Si la imagen ya es una URL completa, usarla tal como está
        if (this.profileData.profile_image.startsWith('http')) {
          avatarUrl = this.profileData.profile_image;
        } else if (this.profileData.profile_image.startsWith('/uploads/')) {
          // Si ya incluye /uploads/, solo agregar el host
          avatarUrl = `http://localhost:8000${this.profileData.profile_image}`;
        } else {
          // Si es solo el nombre del archivo
          avatarUrl = `http://localhost:8000/uploads/${this.profileData.profile_image}`;
        }
      } else {
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
      session: payment.title || 'Servicio',
      amount: payment.amount.toFixed(2),
      status: payment.payment_status === 'completed' ? 'pagado' : 
              payment.payment_status === 'pending' ? 'Sin verificar' : 
              payment.payment_status,
      date: new Date(payment.start_date || new Date()),
      nanny: payment.nanny_first_name ? `${payment.nanny_first_name} ${payment.nanny_last_name}` : 'No asignada',
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
      const paymentId = (target as any).dataset.paymentId;
      
      if (paymentId) {
        // Si viene de openUploadReceiptModal, hacer upload
        this.uploadPaymentReceipt(parseInt(paymentId), file);
      } else {
        // Mostrar error
        this.serviceModalType = 'error';
        this.serviceModalTitle = 'Error';
        this.serviceModalMessage = 'No se pudo asociar el comprobante al pago. Por favor intenta de nuevo.';
      }
      
      // Limpiar el input
      target.value = '';
      (target as any).dataset.paymentId = '';
    }
  }

  /**
   * Crear pago para un servicio completado
   */
  createPaymentForService(serviceId: number) {
    
    this.showServiceModal = true;
    this.serviceModalType = 'loading';
    this.serviceModalTitle = 'Inicializando Pago';
    this.serviceModalMessage = 'Preparando el pago para este servicio...';

    this.paymentService.initializePayment(serviceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.serviceModalType = 'success';
          this.serviceModalTitle = 'Pago Inicializado';
          this.serviceModalMessage = `Pago de $${response.data.amount} creado exitosamente. Realiza la transferencia bancaria y sube el comprobante en tu sección de pagos.`;
          
          // Esperar 2 segundos y luego ir a la sección de pagos
          setTimeout(() => {
            this.closeServiceModal();
            this.currentView = 'payments';
          }, 2000);
        }
      },
      error: (error) => {
        this.serviceModalType = 'error';
        this.serviceModalTitle = 'Error al Crear Pago';
        this.serviceModalMessage = error.error?.message || 'Hubo un error al crear el pago';
      }
    });
  }

  /**
   * Abrir modal para subir comprobante de pago
   */
  openUploadReceiptModal(paymentId: number) {
    
    // Aquí podrías mostrar un modal específico para subir el comprobante
    // Por ahora, simularemos haciendo clic en el input de archivo
    const fileInput = document.getElementById('receiptUpload') as HTMLInputElement;
    if (fileInput) {
      // Guardamos el paymentId para usarlo cuando se seleccione el archivo
      (fileInput as any).dataset.paymentId = paymentId;
      fileInput.click();
    }
  }

  /**
   * Subir comprobante de pago
   */
  uploadPaymentReceipt(paymentId: number, file: File) {
    
    this.showServiceModal = true;
    this.serviceModalType = 'loading';
    this.serviceModalTitle = 'Subiendo Comprobante';
    this.serviceModalMessage = `Subiendo ${file.name}...`;

    this.paymentService.uploadPaymentReceipt(paymentId, file).subscribe({
      next: (response) => {
        if (response.success) {
          this.serviceModalType = 'success';
          this.serviceModalTitle = 'Comprobante Subido';
          this.serviceModalMessage = 'Tu comprobante ha sido recibido. El administrador lo verificará pronto.';
          
          // Recargar pagos
          this.loadClientPayments();
        }
      },
      error: (error) => {
        this.serviceModalType = 'error';
        this.serviceModalTitle = 'Error al Subir Comprobante';
        this.serviceModalMessage = error.error?.message || 'Error al subir el comprobante';
      }
    });
  }

  /**
   * Cargar pagos del cliente
   */
  getPaymentStatusClass(status: string): string {
    return status === 'pagado' ? 'status-paid' : 'status-pending';
  }

  // Métodos para el apartado de pagos mejorado

  /**
   * Contar pagos completados
   */
  getCompletedPaymentsCount(): number {
    return this.clientPayments?.filter(p => p.payment_status === 'completed').length || 0;
  }

  /**
   * Contar pagos pendientes
   */
  getPendingPaymentsCount(): number {
    return this.clientPayments?.filter(p => p.payment_status === 'pending').length || 0;
  }

  /**
   * Contar pagos en procesamiento
   */
  getProcessingPaymentsCount(): number {
    return this.clientPayments?.filter(p => p.payment_status === 'processing').length || 0;
  }

  /**
   * Obtener cantidad de pagos completados (legacy)
   */
  getPaidPaymentsCount(): number {
    return this.paymentsList.filter(payment => payment.status === 'pagado').length;
  }

  /**
   * Formatear estado del pago
   */
  formatPaymentStatus(status: string): string {
    const statusMap: any = {
      'pending': 'Pendiente de Pago',
      'processing': 'En Verificación',
      'completed': 'Pago Completado',
      'failed': 'Pago Rechazado',
      'pagado': 'Pagado'
    };
    return statusMap[status] || status;
  }

  /**
   * Filtrar pagos según estado y ordenamiento
   */
  getFilteredPayments(): any[] {
    if (!this.clientPayments) return [];
    
    let filtered = [...this.clientPayments];
    
    // Filtrar por estado si se selecciona uno
    if (this.selectedPaymentStatus && this.selectedPaymentStatus !== '') {
      filtered = filtered.filter(p => p.payment_status === this.selectedPaymentStatus);
    }
    
    // Ordenar por fecha
    if (this.sortPaymentsBy === 'oldest') {
      filtered.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateB - dateA;
      });
    }
    
    return filtered;
  }

  /**
   * Expandir/contraer tarjeta de pago
   */
  expandedPayments: Set<number> = new Set();

  togglePaymentExpanded(paymentId: number) {
    if (this.expandedPayments.has(paymentId)) {
      this.expandedPayments.delete(paymentId);
    } else {
      this.expandedPayments.add(paymentId);
    }
  }

  isPaymentExpanded(paymentId: number): boolean {
    return this.expandedPayments.has(paymentId);
  }

  /**
   * Obtener URL correcta del comprobante con manejo de rutas
   */
  getProperReceiptUrl(receiptUrl: string): string {
    if (!receiptUrl) return '';
    
    // Si ya tiene protocolo, devolverlo como está
    if (receiptUrl.startsWith('http://') || receiptUrl.startsWith('https://')) {
      return receiptUrl;
    }
    
    // Si empieza con /uploads, agregar el localhost:8000
    if (receiptUrl.startsWith('/uploads/')) {
      return `http://localhost:8000${receiptUrl}`;
    }
    
    // Si no, asumir que va en /uploads/
    return `http://localhost:8000/uploads/${receiptUrl}`;
  }

  /**
   * Manejar error de carga de imagen del comprobante
   */
  onReceiptImageError(event: any, paymentId: number) {
    // Aquí puedes agregar lógica para mostrar un ícono de error
  }

  /**
   * Verificar si el archivo es imagen
   */
  isImageReceipt(url: string): boolean {
    if (!url) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = url.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext);
  }

  /**
   * Verificar si el archivo es PDF
   */
  isPdfReceipt(url: string): boolean {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf');
  }

  /**
   * Trackby para ngFor de pagos
   */
  trackByPayment(index: number, payment: any): number {
    return payment.id;
  }

  getTotalAmount(): string {
    const total = this.paymentsList
      .filter(payment => payment.status === 'pagado')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    return total.toFixed(2);
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
      alert('No se pudieron copiar los datos. Por favor, cópialos manualmente.');
    }
    
    document.body.removeChild(textArea);
  }

  // Función para abrir modal de datos bancarios con datos específicos de la nanny
  openBankDetailsModal(nannyId?: number): void {
    
    // Si no se proporciona nannyId, intentar obtener el primero disponible
    // (útil para vista general sin servicio específico)
    this.isLoadingBankData = true;
    this.showBankDetailsModal = true;
    
    this.bankDetailsService.getBankDetails().subscribe({
      next: (response) => {
        
        const allBankDetails = response.data;
        let nannyBankDetail;
        
        if (nannyId) {
          // Buscar datos de la nanny específica
          nannyBankDetail = allBankDetails.find((bd: any) => {
            return bd.nannyId === nannyId && bd.isActive;
          });
        } else {
          // Si no hay nannyId específico, tomar el primero activo
          nannyBankDetail = allBankDetails.find((bd: any) => bd.isActive);
        }
        
        if (nannyBankDetail) {
          
          this.currentBankData = {
            banco: nannyBankDetail.bankName,
            numero_cuenta: nannyBankDetail.accountNumber,
            numero_cuenta_oculto: this.maskAccountNumber(nannyBankDetail.accountNumber),
            clabe: nannyBankDetail.clabe || 'N/A',
            nombre_titular: nannyBankDetail.accountHolderName,
            tipo_cuenta: nannyBankDetail.accountType === 'checking' ? 'corriente' : 
                        nannyBankDetail.accountType,
            es_activa: nannyBankDetail.isActive
          };
        } else {
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
  // MÉTODOS PARA CALENDARIO DE CAMBIO DE FECHA
  // ===============================================
  
  /**
   * Obtener días del mes para el calendario de cambio de fecha
   */
  getChangeDateCalendarDays(): number[] {
    const daysInMonth = new Date(this.changeDateCalendarYear, this.changeDateCalendarMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(this.changeDateCalendarYear, this.changeDateCalendarMonth, 1).getDay();
    
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
  
  /**
   * Obtener nombre del mes del calendario de cambio de fecha
   */
  getChangeDateMonthName(): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[this.changeDateCalendarMonth];
  }
  
  /**
   * Navegar al mes anterior en el calendario de cambio de fecha
   */
  previousChangeDateMonth() {
    if (this.changeDateCalendarMonth === 0) {
      this.changeDateCalendarMonth = 11;
      this.changeDateCalendarYear--;
    } else {
      this.changeDateCalendarMonth--;
    }
  }
  
  /**
   * Navegar al mes siguiente en el calendario de cambio de fecha
   */
  nextChangeDateMonth() {
    if (this.changeDateCalendarMonth === 11) {
      this.changeDateCalendarMonth = 0;
      this.changeDateCalendarYear++;
    } else {
      this.changeDateCalendarMonth++;
    }
  }
  
  /**
   * Seleccionar fecha en el calendario de cambio de fecha
   */
  selectChangeDateDay(day: number) {
    if (day === 0) return;
    
    const selectedDate = new Date(this.changeDateCalendarYear, this.changeDateCalendarMonth, day);
    
    // Verificar si la fecha es seleccionable
    if (this.isChangeDateDayDisabled(day)) {
      return;
    }
    
    this.selectedNewDate = selectedDate;
  }
  
  /**
   * Verificar si un día está seleccionado
   */
  isChangeDateDaySelected(day: number): boolean {
    if (day === 0 || !this.selectedNewDate) return false;
    
    const checkDate = new Date(this.changeDateCalendarYear, this.changeDateCalendarMonth, day);
    return this.selectedNewDate.getFullYear() === checkDate.getFullYear() &&
           this.selectedNewDate.getMonth() === checkDate.getMonth() &&
           this.selectedNewDate.getDate() === checkDate.getDate();
  }
  
  /**
   * Verificar si un día está deshabilitado (antes de la fecha mínima)
   */
  isChangeDateDayDisabled(day: number): boolean {
    if (day === 0) return true;
    
    const checkDate = new Date(this.changeDateCalendarYear, this.changeDateCalendarMonth, day);
    
    // Deshabilitar si es antes de la fecha mínima seleccionable
    if (this.minSelectableDate) {
      const minDate = new Date(this.minSelectableDate.getFullYear(), this.minSelectableDate.getMonth(), this.minSelectableDate.getDate());
      const currentDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      return currentDate < minDate;
    }
    
    return false;
  }
  
  /**
   * Formatear la fecha seleccionada para mostrar
   */
  getSelectedNewDateText(): string {
    if (!this.selectedNewDate) return 'Selecciona una fecha';
    
    const day = this.selectedNewDate.getDate();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const month = monthNames[this.selectedNewDate.getMonth()];
    const year = this.selectedNewDate.getFullYear();
    
    return `${day} de ${month} de ${year}`;
  }
  
  /**
   * Verificar si se puede proceder con el cambio de fecha
   */
  canProceedWithDateChange(): boolean {
    return !!(this.selectedNewDate && this.selectedNewStartTime && this.selectedNewEndTime);
  }

  // ===============================================
  // MÉTODOS PARA PERFIL
  // ===============================================

  // Cargar datos del perfil desde el backend
  async loadProfileData() {
    this.isLoadingClientData = true;
    
    try {
      // Obtener datos del perfil desde el backend con el ID del usuario actual
      
      const response = await fetch(`http://localhost:8000/api/v1/profile/data?userId=${this.currentUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Aquí se incluiría el token de autorización cuando esté implementado
          // 'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });


      if (response.ok) {
        const result = await response.json();
        
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

          // Sincronizar clientInfo con profileData si clientInfo no está disponible
          // Esto asegura que el getter currentUser siempre tenga datos disponibles
          if (!this.clientInfo && this.profileData) {
            this.clientInfo = {
              id: this.profileData.id || 0,
              user_id: this.profileData.id || 0,
              first_name: this.profileData.first_name,
              last_name: this.profileData.last_name,
              email: this.profileData.email,
              phone_number: this.profileData.phone_number,
              address: this.profileData.address,
              profile_image: this.profileData.profile_image,
              is_verified: this.profileData.is_verified,
              emergency_contact_name: '',
              emergency_contact_phone: '',
              number_of_children: 0,
              verification_status: this.clientData?.verification_status || 'pending',
              identification_document: this.clientData?.identification_document || '',
              created_at: this.profileData.created_at || new Date().toISOString(),
              client_since: this.profileData.created_at || new Date().toISOString()
            } as ClientInfo;
          }
        }
      } else {
        this.loadFallbackData();
      }
    } catch (error) {
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
          
          // Generar preview
          this.generateIdentificationPreview(file);
        
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

  // Generar preview del documento de identificación
  generateIdentificationPreview(file: File) {
    // Limpiar preview anterior
    if (this.identificationPreviewUrl) {
      URL.revokeObjectURL(this.identificationPreviewUrl);
    }

    if (file.type.startsWith('image/')) {
      // Para imágenes, crear Object URL
      this.identificationPreviewUrl = URL.createObjectURL(file);
      this.identificationPreviewType = 'image';
    } else if (file.type === 'application/pdf') {
      // Para PDFs, también crear Object URL
      this.identificationPreviewUrl = URL.createObjectURL(file);
      this.identificationPreviewType = 'pdf';
    }
  }

  // Limpiar preview
  clearIdentificationPreview() {
    if (this.identificationPreviewUrl) {
      URL.revokeObjectURL(this.identificationPreviewUrl);
      this.identificationPreviewUrl = null;
      this.identificationPreviewType = null;
    }
  }

  // Cargar datos específicos del cliente (emergency contacts, etc.)
  async loadClientInfoData() {
    this.isLoadingClientData = true;
    this.clientInfoErrorMessage = '';

    try {
      const token = this.authService.getToken();
      
      if (!token) {
        this.clientInfoErrorMessage = 'Sesión no válida. Por favor inicia sesión nuevamente.';
        this.isLoadingClientData = false;
        return;
      }

      
      const response = await fetch('http://localhost:8000/api/v1/client/data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


      if (response.status === 404) {
        // Cliente no tiene datos todavía, inicializar con valores vacíos
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
        
        if (data.success && data.data) {
          this.clientData = {
            ...this.clientData,
            ...data.data
          };
        }
        // Limpiar el mensaje de error en caso de éxito
        this.clientInfoErrorMessage = '';
      } else if (response.status === 401) {
        this.authService.forceLogout();
        this.router.navigate(['/login']);
      } else {
        // Intentar leer el mensaje de error del servidor
        try {
          const errorData = await response.json();
          this.clientInfoErrorMessage = errorData.message || `Error del servidor: ${response.status}`;
        } catch (e) {
          this.clientInfoErrorMessage = `Error del servidor (${response.status}). Por favor intenta nuevamente.`;
        }
      }
    } catch (error: any) {
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
        this.clientInfoSuccessMessage = data.message || 'Información guardada correctamente';
        this.identificationDocumentFile = null;
        
        // Recargar datos del cliente
        await this.loadClientInfoData();
        
        setTimeout(() => this.clientInfoSuccessMessage = '', 5000);
      } else if (response.status === 401) {
        this.authService.forceLogout();
        this.router.navigate(['/login']);
      } else if (response.status === 400 && data.errors) {
        // Errores de validación del backend
        this.clientInfoErrorMessage = data.errors.map((err: any) => err.msg).join(', ');
      } else {
        this.clientInfoErrorMessage = data.message || 'Error al guardar la información';
      }
    } catch (error) {
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

  // Método para cargar notificaciones desde el backend
  private loadNotifications() {
    
    // Obtener notificaciones del servidor
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        
        // Actualizar el header config con las notificaciones
        this.headerConfig = {
          ...this.headerConfig,
          showNotifications: true
        };
      },
      error: (error) => {
        this.notifications = [];
      }
    });
    
    // Iniciar polling automático cada 30 segundos para actualizar notificaciones
    this.notificationService.startPolling(300000);
  }
}