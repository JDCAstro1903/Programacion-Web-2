import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { ClientService as ClientApiService, ClientInfo, ClientServiceData, ClientPayment, ClientStats } from '../../services/client.service';

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
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, LogoutModalComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit {
  // Vista actual del dashboard
  currentView: string = 'dashboard';
  
  // Vista de servicios específica
  servicesView: string = 'services-history'; // 'services-history' o 'new-service'
  
  // Configuración del sidebar
  sidebarConfig: SidebarConfig;
  
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
  
  // Estados de carga
  isLoadingClientInfo = false;
  isLoadingServices = false;
  isLoadingPayments = false;
  isLoadingStats = false;

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

  // Estado de guardado
  isSavingProfile = false;
  
  // Estado de carga del perfil
  isLoadingProfile = false;

  // ID del usuario actual (en producción vendría del JWT)
  currentUserId: number = 2; // Default, se actualiza en ngOnInit

  // Archivos seleccionados y nombres
  selectedProfileImageName: string = '';
  selectedIdentificationName: string = '';
  profileImageFile: File | null = null;
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
  selectedTime: string = '';
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
    private clientApiService: ClientApiService
  ) {
    // Configurar sidebar específico para cliente con tema rosa
    this.sidebarConfig = {
      userType: 'admin', // Usar tema admin (rosa) para consistencia
      showLogout: true,
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
          id: 'profile',
          label: 'Perfil',
          icon: 'user'
        },
        {
          id: 'payments',
          label: 'Pagos',
          icon: 'dollar-sign'
        }
      ]
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
    
    // Cargar datos dinámicos del cliente
    this.loadClientData();
    // Cargar datos del perfil
    this.loadProfileData();
    // Actualizar contadores en el sidebar si es necesario
    this.updateSidebarCounts();
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
    console.log(`📋 Cargando servicios del cliente...`);
    this.clientApiService.getClientServices().subscribe({
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
    console.log(`📋 Cargando pagos del cliente...`);
    this.clientApiService.getClientPayments().subscribe({
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
    console.log(`📋 Cargando estadísticas del cliente...`);
    this.clientApiService.getClientStats().subscribe({
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

  onSidebarLogout() {
    this.openLogoutModal();
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

  formatDate(date: Date): string {
    const day = date.getDate();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const month = monthNames[date.getMonth()];
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
    this.selectedDate = null;
    this.selectedEndDate = null;
    this.selectedTime = '';
    this.selectedServiceType = '';
    this.selectedChildren = 1;
    this.selectedNannys = 1;
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.selectedDate = null;
    this.selectedEndDate = null;
    this.selectedTime = '';
    this.selectedServiceType = '';
    this.selectedChildren = 1;
    this.selectedNannys = 1;
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
    if (this.selectedDate && this.selectedTime && this.selectedServiceType && this.selectedChildren && this.selectedNannys) {
      // Crear el servicio con los datos seleccionados
      const endDate = this.selectedEndDate || this.selectedDate;
      
      this.createdService = {
        id: Date.now(),
        title: `Sesion ${this.selectedDate.getDate()} de ${this.getMonthName()}`,
        status: 'Activa',
        startTime: this.selectedTime,
        endTime: this.selectedServiceType === 'night-care' ? '05:00' : '20:00',
        date: this.selectedDate,
        endDate: endDate,
        instructions: '',
        children: this.selectedChildren,
        nannys: this.selectedNannys,
        service: this.serviceTypes.find(s => s.id === this.selectedServiceType),
        nanny: {
          name: 'Leslie RuiZ',
          photo: 'assets/logo.png'
        }
      };

      // Mostrar vista de detalles del servicio
      this.showServiceDetails = true;
      this.currentView = 'service-details';
      
      // Simular que después de unos segundos el servicio pasa a "contratados"
      // En un caso real, esto se haría desde el backend cuando el servicio se complete
      setTimeout(() => {
        this.addToContractedServices(this.createdService);
      }, 10000); // 10 segundos para demo
      
      // Limpiar la selección del formulario
      this.selectedDate = null;
      this.selectedEndDate = null;
      this.selectedTime = '';
      this.selectedServiceType = '';
    }
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

  // Ver perfil de la nanny
  viewNannyProfile() {
    console.log('Ver perfil de la nanny');
    // Aquí se implementaría la navegación al perfil
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
    return !!(this.selectedDate && this.selectedTime && this.selectedServiceType && this.selectedChildren && this.selectedNannys);
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

  // Métodos para el perfil (eliminado método duplicado)

  editProfile() {
    console.log('Editar perfil');
    // Aquí se implementaría la lógica para editar el perfil
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

  getStatusText(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Confirmado';
      case 'Sin verificar':
        return 'En Verificación';
      default:
        return status;
    }
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
  openBankDetailsModal(nannyName?: string): void {
    if (nannyName && this.nannyBankData[nannyName]) {
      this.currentBankData = this.nannyBankData[nannyName];
    } else {
      // Datos por defecto si no se encuentra la nanny específica
      this.currentBankData = {
        nanny_nombre: 'NannysLM',
        banco: 'Banco Nacional de Desarrollo',
        numero_cuenta: '1234567890123456',
        numero_cuenta_oculto: '****3456',
        clabe: '014320123456789012',
        nombre_titular: 'NannysLM Servicios S.A.',
        tipo_cuenta: 'corriente',
        es_activa: true
      };
    }
    this.showBankDetailsModal = true;
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
    this.isLoadingProfile = true;
    
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
      this.isLoadingProfile = false;
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

  // Guardar cambios del perfil usando el servicio Angular
  saveProfileChanges() {
    this.isSavingProfile = true;
    const updateData = {
      emergency_contact_name: this.clientData.emergency_contact_name,
      emergency_contact_phone: this.clientData.emergency_contact_phone,
      number_of_children: this.clientData.number_of_children,
      special_requirements: this.clientData.special_requirements,
      verification_status: this.clientData.verification_status
    };
    this.clientApiService.updateClientProfile(updateData).subscribe({
      next: (result) => {
        if (result.success) {
          alert('✅ Perfil actualizado exitosamente');
          // Actualizar datos locales si es necesario
          Object.assign(this.clientData, updateData);
        } else {
          alert('❌ Error al guardar: ' + (result.message || 'Error desconocido'));
        }
        this.isSavingProfile = false;
      },
      error: (error) => {
        console.error('❌ Error al guardar perfil:', error);
        alert('❌ Error de red o del servidor.');
        this.isSavingProfile = false;
      }
    });
  }

  // Cancelar cambios y recargar datos originales
  async cancelChanges() {
    if (confirm('¿Estás seguro de que deseas cancelar los cambios?')) {
      await this.loadProfileData();
    }
  }



  // Métodos para manejar la subida de imagen de perfil
  onProfileImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (file.type.startsWith('image/')) {
        this.selectedProfileImageName = file.name;
        this.profileImageFile = file;
        
        // Crear un FileReader para preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.profileData.profile_image = e.target.result;
        };
        reader.readAsDataURL(file);
        
        console.log('✅ Imagen de perfil seleccionada:', file.name);
      } else {
        alert('Por favor selecciona un archivo de imagen válido');
        event.target.value = '';
      }
    }
  }

  // Métodos para manejar la subida de documento de identificación
  onIdentificationUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (file.type.startsWith('image/')) {
        this.selectedIdentificationName = file.name;
        this.identificationFile = file;
        
        // Crear un FileReader para preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.clientData.identification_document = e.target.result;
        };
        reader.readAsDataURL(file);
        
        console.log('✅ Documento de identificación seleccionado:', file.name);
      } else {
        alert('Por favor selecciona un archivo de imagen válido');
        event.target.value = '';
      }
    }
  }

  // Disparar selección de imagen de perfil
  triggerProfileImageInput() {
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
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
  getVerificationStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'verified': return 'Verificado';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  }
}