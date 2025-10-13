import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';

// Interfaz para definir la estructura de un servicio del cliente
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

  // Lista de servicios contratados
  contractedServices: any[] = [
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
        name: 'Leslie RuiZ',
        photo: 'assets/logo.png'
      },
      isRated: false,
      rating: 0,
      showRating: false,
      tempRating: 0
    }
  ];

  // Datos del perfil del usuario
  userProfile = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+1 234 567 8900',
    address: 'Calle 123, Ciudad, País',
    avatar: 'assets/logo.png',
    isVerified: true
  };

  // Archivo seleccionado para identificación
  selectedFileName: string = '';

  // Lista de pagos
  paymentsList = [
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

  // Datos del usuario cliente
  currentUser = {
    name: 'Juan Pérez',
    role: 'Cliente',
    avatar: '/assets/logo.png'
  };

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
    }
  };

  constructor(private userConfigService: UserConfigService, private router: Router) {
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
    // Actualizar contadores en el sidebar si es necesario
    this.updateSidebarCounts();
  }

  private updateSidebarCounts() {
    // Actualizar contadores para servicios
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

  // Métodos para el modal de logout
  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.router.navigate(['/user-selection']);
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
    if (this.selectedDate && this.selectedTime && this.selectedServiceType) {
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
  }

  hasValidReservation(): boolean {
    return !!(this.selectedDate && this.selectedTime && this.selectedServiceType);
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
      service.rating = rating;
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

  // Método para verificar si no hay servicios
  hasNoServices(): boolean {
    return this.services.upcoming.length === 0 && this.services.past.length === 0;
  }

  // Método para verificar si no hay servicios contratados
  hasNoContractedServices(): boolean {
    return this.contractedServices.length === 0;
  }

  // Métodos para el perfil
  triggerFileInput() {
    const fileInput = document.getElementById('identification') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.selectedFileName = file.name;
      console.log('Archivo seleccionado:', file.name);
    }
  }

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
}