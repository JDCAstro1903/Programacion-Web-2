import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent, HeaderConfig } from '../../shared/components/header/header.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardStats, Nanny, Client } from '../../services/dashboard.service';
import { BankDetailsService } from '../../services/bank-details.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent, LogoutModalComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Vista actual del dashboard
  currentView: string = 'dashboard';
  
  // Configuración del sidebar
  sidebarConfig: SidebarConfig;

  // Configuración del header
  headerConfig: HeaderConfig;

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
  isLoadingPayments = false;
  isLoadingBankDetails = false;

    constructor(
    private router: Router,
    private userConfigService: UserConfigService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private bankDetailsService: BankDetailsService
  ) {
    this.sidebarConfig = this.userConfigService.getSidebarConfig('admin');
    
    // Configurar header genérico
    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Administrador';
    
    console.log('🔍 Constructor - currentUser completo:', currentUser);
    console.log('🔍 Constructor - currentUser.profile_image:', currentUser?.profile_image);
    
    // Obtener la imagen de perfil con prioridad:
    // 1. Del localStorage (más reciente)
    // 2. Del objeto currentUser en memoria
    // 3. Logo por defecto
    let userAvatar = '/assets/logo.png';
    
    // Verificar localStorage primero
    const storedUser = localStorage.getItem('currentUser');
    console.log('🔍 Constructor - storedUser en localStorage:', storedUser ? 'existe' : 'no existe');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔍 Constructor - parsedUser:', parsedUser);
        console.log('🔍 Constructor - parsedUser.profile_image:', parsedUser.profile_image);
        
        if (parsedUser.profile_image) {
          userAvatar = parsedUser.profile_image;
          console.log('🖼️ Avatar desde localStorage:', userAvatar);
        }
      } catch (e) {
        console.error('Error parseando usuario de localStorage:', e);
      }
    }
    
    // Si no hay en localStorage, usar del currentUser
    if (userAvatar === '/assets/logo.png' && currentUser?.profile_image) {
      userAvatar = currentUser.profile_image;
      console.log('🖼️ Avatar desde currentUser:', userAvatar);
    }
    
    console.log('👤 Usuario actual completo:', currentUser);
    console.log('📸 Avatar final seleccionado:', userAvatar);
    
    this.headerConfig = {
      userType: 'admin',
      userName: userName || 'Administrador',
      userRole: 'Administrador',
      userAvatar: userAvatar,
      showProfileOption: true,
      showLogoutOption: true
    };
    
    console.log('✅ headerConfig final:', this.headerConfig);
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.loadStats();
    this.loadNannys();
    this.loadClients();
    this.loadPayments();
    this.loadBankDetails();
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
        console.log('📊 Respuesta del backend (clientes):', response);
        if (response.success) {
          this.clientsData = response.data;
          console.log('✅ Clientes cargados:', this.clientsData.length);
          console.log('👥 Datos de clientes:', this.clientsData);
        }
        this.isLoadingClients = false;
      },
      error: (error) => {
        console.error('❌ Error cargando clientes:', error);
        this.isLoadingClients = false;
      }
    });
  }

  private loadPayments() {
    this.isLoadingPayments = true;
    this.dashboardService.getPayments().subscribe({
      next: (response) => {
        console.log('📊 Respuesta del backend (pagos):', response);
        if (response.success) {
          this.paymentsData = response.data;
          console.log('✅ Pagos cargados:', this.paymentsData.length);
        }
        this.isLoadingPayments = false;
      },
      error: (error) => {
        console.error('❌ Error cargando pagos:', error);
        this.isLoadingPayments = false;
      }
    });
  }

  private loadBankDetails() {
    this.isLoadingBankDetails = true;
    this.bankDetailsService.getBankDetails().subscribe({
      next: (response) => {
        console.log('📊 Respuesta del backend (datos bancarios):', response);
        if (response.success) {
          this.datosBancarios = response.data;
          console.log('✅ Datos bancarios cargados:', this.datosBancarios.length);
          this.updateSidebarCounts();
        }
        this.isLoadingBankDetails = false;
      },
      error: (error) => {
        console.error('❌ Error cargando datos bancarios:', error);
        this.isLoadingBankDetails = false;
      }
    });
  }

  private updateSidebarCounts() {
    this.userConfigService.updateSidebarItemCount('admin', 'nannys', this.dashboardStats.nannys.total);
    this.userConfigService.updateSidebarItemCount('admin', 'clients', this.dashboardStats.clients.total);
    this.userConfigService.updateSidebarItemCount('admin', 'payments', 0); // TODO: Implementar pagos
    this.userConfigService.updateSidebarItemCount('admin', 'datos-bancarios', this.datosBancarios.length);
  }

  // Estados de filtro para las nannys
  nannyFilter: string = 'active';
  clientFilter: string = 'all'; // Cambiado de 'verified' a 'all' para mostrar todos los clientes por defecto
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

  // Métodos para manejar eventos del header
  onHeaderLogout() {
    this.openLogoutModal();
  }

  onHeaderProfileClick() {
    console.log('Navegando a perfil...');
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
    console.log('🔍 Filtro actual:', this.clientFilter);
    console.log('📋 Total de clientes:', this.clientsData.length);
    
    let filtered;
    switch(this.clientFilter) {
      case 'verified': 
        filtered = this.clientsData.filter(client => {
          console.log(`Cliente ${client.name}: isVerified=${client.isVerified}`);
          return client.isVerified === true;
        });
        console.log('✅ Clientes verificados:', filtered.length);
        break;
      case 'unverified': 
        filtered = this.clientsData.filter(client => {
          console.log(`Cliente ${client.name}: isVerified=${client.isVerified}`);
          return client.isVerified === false;
        });
        console.log('⏳ Clientes no verificados:', filtered.length);
        break;
      case 'all':
        filtered = this.clientsData;
        console.log('👥 Todos los clientes:', filtered.length);
        break;
      default: 
        filtered = this.clientsData;
        console.log('📊 Clientes (default):', filtered.length);
    }
    
    return filtered;
  }

  // Obtener pagos según el filtro actual
  getCurrentPayments() {
    let payments = this.paymentsData || [];
    
    // Filtrar por estado de verificación
    if (this.paymentFilter === 'verified') {
      payments = payments.filter((payment: any) => payment.paymentStatus === 'completed');
    } else if (this.paymentFilter === 'unverified') {
      payments = payments.filter((payment: any) => payment.paymentStatus === 'pending');
    }
    
    // Aplicar filtro de fecha
    if (this.paymentDateFilter !== 'all') {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      payments = payments.filter((payment: any) => {
        if (!payment.paymentDate && !payment.createdAt) return false;
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        
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

  getUnverifiedClientsSlice() {
    return this.clientsData.filter(client => !client.isVerified).slice(0, 3);
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
      case 'all':
        return this.clientsData.length;
      case 'verified': 
        return this.clientsData.filter(client => {
          // Soportar tanto snake_case como camelCase
          return (client as any).is_verified === true || client.isVerified === true;
        }).length;
      case 'unverified': 
        return this.clientsData.filter(client => {
          // Soportar tanto snake_case como camelCase
          return (client as any).is_verified === false || client.isVerified === false;
        }).length;
      default: return this.clientsData.length;
    }
  }

  getPaymentCount(type: string): number {
    switch(type) {
      case 'verified': 
        return this.paymentsData.filter((payment: any) => payment.paymentStatus === 'completed').length;
      case 'unverified': 
        return this.paymentsData.filter((payment: any) => payment.paymentStatus === 'pending').length;
      default: 
        return this.paymentsData.length;
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
      if (!payment.paymentDate && !payment.createdAt) return false;
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      
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

  // Métodos auxiliares para estadísticas de datos bancarios
  getActiveBankAccountsCount(): number {
    return this.datosBancarios.filter(datos => datos.isActive).length;
  }

  getVerifiedNannysWithBankCount(): number {
    return this.datosBancarios.filter(datos => datos.nanny.status === 'active').length;
  }

  // Método para ocultar número de cuenta (mostrar solo últimos 4 dígitos)
  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';
    const length = accountNumber.length;
    if (length <= 4) return accountNumber;
    return '**** **** ' + accountNumber.slice(-4);
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
      this.bankDetailsService.updateBankDetails(this.selectedBankData.id, {
        accountHolderName: this.selectedBankData.account_holder_name,
        bankName: this.selectedBankData.bank_name,
        accountNumber: this.selectedBankData.account_number,
        clabe: this.selectedBankData.clabe,
        accountType: this.selectedBankData.account_type,
        isPrimary: this.selectedBankData.is_primary,
        isActive: this.selectedBankData.is_active
      }).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Datos bancarios actualizados');
            this.loadBankDetails();
            this.closeBankDetailsModal();
          }
        },
        error: (error) => {
          console.error('❌ Error actualizando datos bancarios:', error);
        }
      });
    } else {
      // Crear nuevos datos
      this.bankDetailsService.createBankDetails({
        nannyId: this.selectedBankData.nanny_id,
        accountHolderName: this.selectedBankData.account_holder_name,
        bankName: this.selectedBankData.bank_name,
        accountNumber: this.selectedBankData.account_number,
        clabe: this.selectedBankData.clabe,
        accountType: this.selectedBankData.account_type,
        isPrimary: this.selectedBankData.is_primary,
        isActive: this.selectedBankData.is_active
      }).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Datos bancarios creados');
            this.loadBankDetails();
            this.closeBankDetailsModal();
          }
        },
        error: (error) => {
          console.error('❌ Error creando datos bancarios:', error);
        }
      });
    }
  }

  deleteBankData(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar estos datos bancarios?')) {
      this.bankDetailsService.deleteBankDetails(id).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('✅ Datos bancarios eliminados');
            this.loadBankDetails();
          }
        },
        error: (error) => {
          console.error('❌ Error eliminando datos bancarios:', error);
        }
      });
    }
  }

  toggleBankDataStatus(id: number) {
    this.bankDetailsService.toggleActiveStatus(id).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Estado actualizado');
          this.loadBankDetails();
        }
      },
      error: (error) => {
        console.error('❌ Error actualizando estado:', error);
      }
    });
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
    // Soportar tanto snake_case como camelCase del backend
    const isVerified = client.is_verified !== undefined ? client.is_verified : client.isVerified;
    return isVerified ? 'verified' : 'unverified';
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
    // Determinar el estado basado en paymentStatus
    if (payment.paymentStatus === 'completed') {
      return 'verified';
    } else if (payment.paymentStatus === 'pending' || payment.paymentStatus === 'processing') {
      return 'unverified';
    } else if (payment.paymentStatus === 'failed' || payment.paymentStatus === 'refunded') {
      return 'cancelled';
    }
    return 'unverified'; // default
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
    const completedPayments = this.paymentsData.filter((payment: any) => payment.paymentStatus === 'completed');
    return completedPayments.reduce((total: number, payment: any) => total + (payment.amount || 0), 0);
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyPayments = this.paymentsData.filter((payment: any) => {
      if (payment.paymentStatus !== 'completed' || !payment.paymentDate) return false;
      
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });
    
    return monthlyPayments.reduce((total: number, payment: any) => total + (payment.amount || 0), 0);
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