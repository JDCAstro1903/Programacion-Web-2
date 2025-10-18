import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardStats, Nanny, Client } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, LogoutModalComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Vista actual del dashboard
  currentView: string = 'dashboard';
  
  // Configuración del sidebar
  sidebarConfig: SidebarConfig;

  // Datos dinámicos desde la base de datos
  dashboardStats: DashboardStats = {
    nannys: { total: 0, active: 0, inactive: 0, verified: 0 },
    clients: { total: 0, verified: 0, unverified: 0 },
    admin: { total: 0 }
  };

  // Arrays de datos reales
  nannysData: Nanny[] = [];
  clientsData: Client[] = [];
  paymentsData: any[] = []; // Agregar cuando tengamos el endpoint de pagos
  datosBancarios: any[] = []; // Datos bancarios de las nannys
  
  // Estados de carga
  isLoadingStats = false;
  isLoadingNannys = false;
  isLoadingClients = false;

    constructor(
    private router: Router,
    private userConfigService: UserConfigService,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {
    this.sidebarConfig = this.userConfigService.getSidebarConfig('admin');
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.loadStats();
    this.loadNannys();
    this.loadClients();
  }

  private loadStats() {
    this.isLoadingStats = true;
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardStats = response.data;
          this.updateSidebarCounts();
        }
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.isLoadingStats = false;
      }
    });
  }

  private loadNannys() {
    this.isLoadingNannys = true;
    this.dashboardService.getNannys().subscribe({
      next: (response) => {
        if (response.success) {
          this.nannysData = response.data;
        }
        this.isLoadingNannys = false;
      },
      error: (error) => {
        console.error('Error cargando nannys:', error);
        this.isLoadingNannys = false;
      }
    });
  }

  private loadClients() {
    this.isLoadingClients = true;
    this.dashboardService.getClients().subscribe({
      next: (response) => {
        if (response.success) {
          this.clientsData = response.data;
        }
        this.isLoadingClients = false;
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this.isLoadingClients = false;
      }
    });
  }

  private updateSidebarCounts() {
    this.userConfigService.updateSidebarItemCount('admin', 'nannys', this.dashboardStats.nannys.total);
    this.userConfigService.updateSidebarItemCount('admin', 'clients', this.dashboardStats.clients.total);
    this.userConfigService.updateSidebarItemCount('admin', 'payments', 0); // TODO: Implementar pagos
    this.userConfigService.updateSidebarItemCount('admin', 'datos-bancarios', 0); // TODO: Implementar datos bancarios
  }

  // Estados de filtro para las nannys
  nannyFilter: string = 'active';
  clientFilter: string = 'verified';
  paymentFilter: string = 'verified';
  paymentDateFilter: string = 'all';
  
  // Estado del modal de logout
  showLogoutModal: boolean = false;
  
  // Estado del desplegable de filtros de fecha
  showDateFilters: boolean = false;
  
  // Variables para el calendario
  showCalendar: boolean = false;
  selectedDate: Date | null = null;
  currentCalendarMonth: Date = new Date();
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth();
  
  // Estado del modal para agregar nanny
  showAddNannyModal: boolean = false;
  
  // Estado del modal para agregar cliente
  showAddClientModal: boolean = false;
  
  // Datos para nueva nanny
  newNannyData = {
    name: '',
    email: '',
    phone: '',
    age: 25,
    location: '',
    experience: '',
    hourlyRate: 15,
    description: '',
    status: 'active',
    skills: {
      childcare: false,
      firstAid: false,
      education: false,
      cooking: false,
      languages: false,
      specialNeeds: false
    },
    availability: {
      weekdays: false,
      weekends: false,
      nights: false,
      emergency: false
    }
  };

  // Datos para nuevo cliente
  newClient = {
    name: '',
    email: '',
    phone: '',
    location: '',
    children: 1
  };

  // Estados y filtros para datos bancarios
  showBankDetailsModal: boolean = false;
  selectedBankData: any = null;
  editingBankData: boolean = false;

  // Usuario actual (temporal)
  currentUser = {
    name: 'Usuario 1',
    role: 'administrador',
    avatar: '/assets/logo.png'
  };

  // Métodos de navegación
  setCurrentView(view: string) {
    console.log('Cambiando a vista:', view);
    this.currentView = view;
  }

  onViewChange(view: string) {
    this.setCurrentView(view);
  }

  onSidebarLogout() {
    this.openLogoutModal();
  }

  setNannyFilter(filter: string) {
    this.nannyFilter = filter;
  }

  setClientFilter(filter: string) {
    this.clientFilter = filter;
  }

  setPaymentFilter(filter: string) {
    this.paymentFilter = filter;
  }

  setPaymentDateFilter(filter: string) {
    this.paymentDateFilter = filter;
    if (filter !== 'custom') {
      this.selectedDate = null;
      this.showCalendar = false;
    }
  }

  // Método para alternar filtros de fecha
  toggleDateFilters() {
    this.showDateFilters = !this.showDateFilters;
  }

  // Obtener nannys según el filtro actual
  getCurrentNannys() {
    switch(this.nannyFilter) {
      case 'active': return this.nannysData.filter(nanny => nanny.status === 'active');
      case 'inactive': return this.nannysData.filter(nanny => nanny.status === 'inactive');
      case 'suspended': return this.nannysData.filter(nanny => nanny.status === 'suspended');
      default: return this.nannysData.filter(nanny => nanny.status === 'active');
    }
  }

  // Obtener clientes según el filtro actual
  getCurrentClients() {
    switch(this.clientFilter) {
      case 'verified': return this.clientsData.filter(client => client.isVerified === true);
      case 'unverified': return this.clientsData.filter(client => client.isVerified === false);
      default: return this.clientsData.filter(client => client.isVerified === true);
    }
  }

  // Obtener pagos según el filtro actual
  getCurrentPayments() {
    // Por ahora devolvemos un array vacío hasta que implementemos el endpoint de pagos
    let payments = this.paymentsData || [];
    
    // Filtrar por estado de verificación si tenemos la propiedad
    if (this.paymentFilter === 'verified') {
      payments = payments.filter((payment: any) => payment.type === 'completed');
    } else if (this.paymentFilter === 'unverified') {
      payments = payments.filter((payment: any) => payment.type === 'pending');
    }
    
    // Aplicar filtro de fecha
    if (this.paymentDateFilter !== 'all') {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      payments = payments.filter((payment: any) => {
        const paymentDate = new Date(payment.date);
        
        switch(this.paymentDateFilter) {
          case 'today':
            return this.isSameDay(paymentDate, startOfToday);
          
          case 'week':
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            return paymentDate >= startOfWeek && paymentDate <= endOfWeek;
          
          case 'month':
            return paymentDate.getMonth() === today.getMonth() && 
                   paymentDate.getFullYear() === today.getFullYear();
          
          case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            const quarterStart = quarter * 3;
            const quarterEnd = quarterStart + 2;
            return paymentDate.getFullYear() === today.getFullYear() &&
                   paymentDate.getMonth() >= quarterStart &&
                   paymentDate.getMonth() <= quarterEnd;
          
          case 'custom':
            return this.selectedDate ? this.isSameDay(paymentDate, this.selectedDate) : true;
          
          default:
            return true;
        }
      });
    }
    
    return payments;
  }

  // Métodos auxiliares para el template
  getActiveNannysSlice() {
    return this.nannysData.filter(nanny => nanny.status === 'active').slice(0, 3);
  }

  getRecentPayments() {
    return this.paymentsData.filter((payment: any) => payment.type === 'completed').slice(0, 3);
  }

  // Obtener contadores para los filtros
  getNannyCount(type: string): number {
    switch(type) {
      case 'active': return this.nannysData.filter(nanny => nanny.status === 'active').length;
      case 'inactive': return this.nannysData.filter(nanny => nanny.status === 'inactive').length;
      case 'suspended': return this.nannysData.filter(nanny => nanny.status === 'suspended').length;
      default: return this.nannysData.length;
    }
  }

  getClientCount(type: string): number {
    switch(type) {
      case 'verified': return this.clientsData.filter(client => client.isVerified === true).length;
      case 'unverified': return this.clientsData.filter(client => client.isVerified === false).length;
      default: return this.clientsData.length;
    }
  }

  getPaymentCount(type: string): number {
    switch(type) {
      case 'verified': return this.paymentsData.filter((payment: any) => payment.type === 'completed').length;
      case 'unverified': return this.paymentsData.filter((payment: any) => payment.type === 'pending').length;
      default: return this.paymentsData.length;
    }
  }

  getPaymentCountByDate(dateFilter: string): number {
    const allPayments = this.paymentsData || [];
    
    if (dateFilter === 'all') {
      return allPayments.length;
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return allPayments.filter((payment: any) => {
      const paymentDate = new Date(payment.date);
      
      switch (dateFilter) {
        case 'today':
          return this.isSameDay(paymentDate, startOfToday);
        
        case 'week':
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return paymentDate >= startOfWeek && paymentDate <= endOfWeek;
        
        case 'month':
          return paymentDate.getMonth() === today.getMonth() && 
                 paymentDate.getFullYear() === today.getFullYear();
        
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          const quarterStart = quarter * 3;
          const quarterEnd = quarterStart + 2;
          return paymentDate.getFullYear() === today.getFullYear() &&
                 paymentDate.getMonth() >= quarterStart &&
                 paymentDate.getMonth() <= quarterEnd;
        
        case 'custom':
          return this.selectedDate ? this.isSameDay(paymentDate, this.selectedDate) : true;
        
        default:
          return true;
      }
    }).length;
  }

  // Métodos para manejar datos bancarios
  openBankDetailsModal(bankData?: any) {
    if (bankData) {
      this.selectedBankData = { ...bankData };
      this.editingBankData = true;
    } else {
      this.selectedBankData = {
        id: null,
        nanny_id: null,
        nombre_titular: '',
        banco: '',
        numero_cuenta_completo: '',
        clabe: '',
        tipo_cuenta: 'ahorro',
        es_activa: true
      };
      this.editingBankData = false;
    }
    this.showBankDetailsModal = true;
  }

  closeBankDetailsModal() {
    this.showBankDetailsModal = false;
    this.selectedBankData = null;
    this.editingBankData = false;
  }

  saveBankDetails() {
    if (this.editingBankData) {
      // Actualizar datos existentes
      const index = this.datosBancarios.findIndex(d => d.id === this.selectedBankData.id);
      if (index !== -1) {
        // Mantener información de la nanny
        const nannyInfo = {
          nanny_nombre: this.datosBancarios[index].nanny_nombre,
          nanny_email: this.datosBancarios[index].nanny_email,
          nanny_verificada: this.datosBancarios[index].nanny_verificada
        };
        
        this.datosBancarios[index] = {
          ...this.selectedBankData,
          ...nannyInfo,
          numero_cuenta_oculto: `****${this.selectedBankData.numero_cuenta_completo.slice(-4)}`,
          fecha_actualizacion: new Date().toISOString().split('T')[0]
        };
      }
    } else {
      // Crear nuevos datos
      const newId = Math.max(...this.datosBancarios.map(d => d.id)) + 1;
      
      // Buscar información de la nanny seleccionada
      const nannyData = this.nannysData.find((n: Nanny) => n.id === this.selectedBankData.nanny_id);
      
      this.datosBancarios.push({
        ...this.selectedBankData,
        id: newId,
        numero_cuenta_oculto: `****${this.selectedBankData.numero_cuenta_completo.slice(-4)}`,
        fecha_creacion: new Date().toISOString().split('T')[0],
        nanny_nombre: nannyData ? nannyData.name : 'Nanny no encontrada',
        nanny_email: nannyData ? `${nannyData.name.toLowerCase().replace(' ', '.')}@nannyslm.com` : '',
        nanny_verificada: nannyData ? true : false
      });
    }
    
    this.closeBankDetailsModal();
    this.updateSidebarCounts();
  }

  deleteBankData(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar estos datos bancarios?')) {
      const index = this.datosBancarios.findIndex(d => d.id === id);
      if (index !== -1) {
        // Soft delete - marcar como inactiva
        this.datosBancarios[index].es_activa = false;
        this.updateSidebarCounts();
      }
    }
  }

  toggleBankDataStatus(id: number) {
    const index = this.datosBancarios.findIndex(d => d.id === id);
    if (index !== -1) {
      this.datosBancarios[index].es_activa = !this.datosBancarios[index].es_activa;
      this.updateSidebarCounts();
    }
  }

  // Obtener nannys disponibles para agregar datos bancarios
  getAvailableNannysForBankData() {
    const allNannys = this.nannysData || [];
    const nannysWithBankData = this.datosBancarios.filter((d: any) => d.es_activa).map((d: any) => d.nanny_id);
    
    return allNannys.filter((nanny: Nanny) => !nannysWithBankData.includes(nanny.id));
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
    // Navegar a la selección de usuario
    this.router.navigate(['/']);
    console.log('Usuario cerró sesión');
  }

  // Métodos para el modal de agregar nanny
  openAddNannyModal() {
    this.showAddNannyModal = true;
    // Resetear formulario
    this.resetNewNannyData();
  }

  closeAddNannyModal() {
    this.showAddNannyModal = false;
  }

  resetNewNannyData() {
    this.newNannyData = {
      name: '',
      email: '',
      phone: '',
      age: 25,
      location: '',
      experience: '',
      hourlyRate: 15,
      description: '',
      status: 'active',
      skills: {
        childcare: false,
        firstAid: false,
        education: false,
        cooking: false,
        languages: false,
        specialNeeds: false
      },
      availability: {
        weekdays: false,
        weekends: false,
        nights: false,
        emergency: false
      }
    };
  }

  onSubmitAddNanny(form: any) {
    if (form.valid) {
      // TODO: Implementar cuando tengamos endpoint para crear nannys
      console.log('Crear nueva nanny:', this.newNannyData);
      
      // Cerrar modal
      this.closeAddNannyModal();
      
      // TODO: Recargar datos desde la base de datos
      this.loadNannys();
    }
  }

  // Métodos auxiliares para el manejo de nannys
  getTotalNannys(): number {
    return this.nannysData.length;
  }

  getFilterLabel(): string {
    switch (this.nannyFilter) {
      case 'active': return 'activas';
      case 'busy': return 'ocupadas';
      case 'inactive': return 'inactivas';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Activa';
      case 'busy': return 'Ocupada';
      case 'inactive': return 'Inactiva';
      default: return '';
    }
  }

  getStatusFromData(nanny: any): string {
    // Usar el estado directamente de la base de datos
    return nanny.status || 'active';
  }

  // Métodos para clientes
  getClientStatusFromData(client: any): string {
    // Usar el estado directamente de la base de datos
    return client.isVerified ? 'verified' : 'unverified';
  }

  getClientStatusText(status: string): string {
    switch (status) {
      case 'verified': return 'Verificado';
      case 'unverified': return 'Pendiente';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getClientBookings(clientId: number): string {
    // Simulación de datos de reservas
    const bookings = Math.floor(Math.random() * 15) + 1;
    return bookings.toString();
  }

  getLastActivity(clientId: number): string {
    // Simulación de última actividad
    const activities = ['Hoy', 'Ayer', '2 días', '1 semana', '2 semanas'];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  openAddClientModal(): void {
    this.showAddClientModal = true;
  }

  closeAddClientModal(): void {
    this.showAddClientModal = false;
    this.resetClientForm();
  }

  resetClientForm(): void {
    this.newClient = {
      name: '',
      email: '',
      phone: '',
      location: '',
      children: 1
    };
  }

  // Métodos para pagos
  getPaymentStatusFromData(payment: any): string {
    // Determinar el estado basado en el tipo del pago
    if (payment.type === 'completed') {
      return 'verified';
    } else if (payment.type === 'pending') {
      return 'unverified';
    }
    return 'verified'; // default
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'verified': return 'Completado';
      case 'unverified': return 'Pendiente';
      default: return '';
    }
  }

  formatPaymentDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getTotalRevenue(): number {
    const allPayments = this.paymentsData || [];
    return allPayments.reduce((total: number, payment: any) => total + (payment.amount || 0), 0);
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const allPayments = this.paymentsData || [];
    
    return allPayments
      .filter((payment: any) => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((total: number, payment: any) => total + (payment.amount || 0), 0);
  }

  getHourlyRate(payment: any): number {
    return Math.round(payment.amount / payment.hours);
  }

  getCommission(payment: any): number {
    return Math.round(payment.amount * 0.15); // 15% de comisión
  }

  viewNannyProfile(nannyId: number) {
    console.log('Ver perfil de nanny:', nannyId);
    // Aquí podrías implementar la navegación al perfil completo
  }

  contactNanny(nannyId: number) {
    console.log('Contactar nanny:', nannyId);
    // Aquí podrías implementar la funcionalidad de contacto
  }

  // Funciones del calendario
  toggleCalendar() {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.paymentDateFilter = 'custom';
    }
  }

  getCurrentMonthYear(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[this.currentCalendarMonth.getMonth()]} ${this.currentCalendarMonth.getFullYear()}`;
  }

  previousMonth() {
    this.currentCalendarMonth = new Date(
      this.currentCalendarMonth.getFullYear(),
      this.currentCalendarMonth.getMonth() - 1,
      1
    );
  }

  nextMonth() {
    this.currentCalendarMonth = new Date(
      this.currentCalendarMonth.getFullYear(),
      this.currentCalendarMonth.getMonth() + 1,
      1
    );
  }

  getDayHeaders(): string[] {
    return ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  }

  getCalendarDays(): Date[] {
    const year = this.currentCalendarMonth.getFullYear();
    const month = this.currentCalendarMonth.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Días a mostrar
    const days: Date[] = [];
    
    // Agregar días del mes anterior para completar la primera semana
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Agregar todos los días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    // Agregar días del mes siguiente para completar la última semana
    const totalDays = days.length;
    const remainingDays = 42 - totalDays; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days.slice(0, 42); // Máximo 6 semanas
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  isSelectedDate(date: Date): boolean {
    return this.selectedDate ? this.isSameDay(date, this.selectedDate) : false;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentCalendarMonth.getMonth() &&
           date.getFullYear() === this.currentCalendarMonth.getFullYear();
  }

  hasPaymentsOnDate(date: Date): boolean {
    const allPayments = this.paymentsData || [];
    return allPayments.some((payment: any) => this.isSameDay(new Date(payment.date), date));
  }

  selectDate(date: Date) {
    if (this.isCurrentMonth(date)) {
      this.selectedDate = date;
      this.paymentDateFilter = 'custom';
      this.showCalendar = false;
    }
  }

  clearSelectedDate() {
    this.selectedDate = null;
    this.paymentDateFilter = 'all';
  }

  formatSelectedDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Métodos para selectores de año y mes
  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push(year);
    }
    return years;
  }

  getAvailableMonths(): string[] {
    return [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
  }

  onYearChange(): void {
    this.currentCalendarMonth = new Date(this.selectedYear, this.selectedMonth, 1);
  }

  onMonthChange(): void {
    this.currentCalendarMonth = new Date(this.selectedYear, this.selectedMonth, 1);
  }

  goToToday(): void {
    const today = new Date();
    this.selectedYear = today.getFullYear();
    this.selectedMonth = today.getMonth();
    this.currentCalendarMonth = new Date(this.selectedYear, this.selectedMonth, 1);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
}