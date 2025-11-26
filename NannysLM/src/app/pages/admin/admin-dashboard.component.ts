import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { NotificationsPanelComponent } from '../../shared/components/notifications-panel/notifications-panel.component';
import { WhatsappButtonComponent } from '../../shared/components/whatsapp-button/whatsapp-button.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardStats, Nanny, Client } from '../../services/dashboard.service';
import { BankDetailsService } from '../../services/bank-details.service';
import { NannyService } from '../../services/nanny.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent, LogoutModalComponent, NotificationsPanelComponent, WhatsappButtonComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Vista actual del dashboard
  currentView: string = 'dashboard';

  // Configuración del sidebar
  sidebarConfig: any;

  // Configuración del header
  headerConfig: any;

  // Datos dinámicos desde la base de datos
  dashboardStats: DashboardStats = {
    nannys: { total: 0, active: 0, inactive: 0, verified: 0 },
    clients: { total: 0, verified: 0, unverified: 0 },
    payments: { total: 0, pending: 0, completed: 0 },
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
    private bankDetailsService: BankDetailsService,
    private nannyService: NannyService,
    private paymentService: PaymentService
  ) {
    this.sidebarConfig = this.userConfigService.getSidebarConfig('admin');
    
    // Configurar header genérico
    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Administrador';
    
    // Obtener la imagen de perfil con prioridad:
    // 1. Del localStorage (más reciente)
    // 2. Del objeto currentUser en memoria
    // 3. Logo por defecto
    let userAvatar = '/assets/logo.png';
    
    // Verificar localStorage primero
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        if (parsedUser.profile_image) {
          userAvatar = parsedUser.profile_image;
        }
      } catch (e) {
      }
    }
    
    // Si no hay en localStorage, usar del currentUser
    if (userAvatar === '/assets/logo.png' && currentUser?.profile_image) {
      userAvatar = currentUser.profile_image;
    }
    
    this.headerConfig = {
      userType: 'admin',
      userName: userName || 'Administrador',
      userRole: 'Administrador',
      userAvatar: userAvatar,
      showProfileOption: true,
      showLogoutOption: true
    };
  }

  ngOnInit() {
    this.initializeCurrentUser();
    this.loadDashboardData();
  }

  private initializeCurrentUser() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser.name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Administrador';
    }
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
          // Merge server data with existing dashboardStats to preserve payments
          this.dashboardStats = {
            ...this.dashboardStats,
            ...response.data,
            payments: this.dashboardStats.payments // Preserve payments object
          };
          this.updateSidebarCounts();
        }
        this.isLoadingStats = false;
      },
      error: (error) => {
        this.isLoadingStats = false;
      }
    });
  }

  private loadNannys() {
    this.isLoadingNannys = true;
    // Usar el nuevo servicio de nanny que hace llamada a /api/v1/nannys
    this.nannyService.getAllNannys().subscribe({
      next: (response) => {
        if (response.success) {
          // Convertir campos numéricos que vienen como string desde MySQL
          this.nannysData = response.data.map((nanny: any) => ({
            ...nanny,
            experience_years: Number(nanny.experience_years),
            hourly_rate: Number(nanny.hourly_rate),
            rating_average: Number(nanny.rating_average),
            total_ratings: Number(nanny.total_ratings),
            services_completed: Number(nanny.services_completed)
          }));
          if (this.nannysData && this.nannysData.length > 0) {
          }
        } else {
        }
        this.isLoadingNannys = false;
      },
      error: (error) => {
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
        this.isLoadingClients = false;
      }
    });
  }

  private loadPayments() {
    this.isLoadingPayments = true;
    this.dashboardService.getPayments().subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentsData = response.data;
          // Ensure payments object exists
          if (!this.dashboardStats.payments) {
            this.dashboardStats.payments = { total: 0, pending: 0, completed: 0 };
          }
          this.dashboardStats.payments.total = this.paymentsData.length;
          this.dashboardStats.payments.pending = this.paymentsData.filter((p: any) => p.payment_status === 'pending').length;
          this.dashboardStats.payments.completed = this.paymentsData.filter((p: any) => p.payment_status === 'completed').length;
          this.updateSidebarCounts();
        }
        this.isLoadingPayments = false;
      },
      error: (error) => {
        this.isLoadingPayments = false;
      }
    });
  }

  private loadBankDetails() {
    this.isLoadingBankDetails = true;
    this.bankDetailsService.getBankDetails().subscribe({
      next: (response) => {
        if (response.success) {
          this.datosBancarios = response.data;
          this.updateSidebarCounts();
        }
        this.isLoadingBankDetails = false;
      },
      error: (error) => {
        this.isLoadingBankDetails = false;
      }
    });
  }

  private updateSidebarCounts() {
    this.userConfigService.updateSidebarItemCount('admin', 'nannys', this.dashboardStats.nannys?.total || 0);
    this.userConfigService.updateSidebarItemCount('admin', 'clients', this.dashboardStats.clients?.total || 0);
    this.userConfigService.updateSidebarItemCount('admin', 'payments', this.dashboardStats.payments?.total || 0);
    this.userConfigService.updateSidebarItemCount('admin', 'datos-bancarios', this.datosBancarios.length);
  }

  // Estados de filtro para las nannys
  nannyFilter: string = 'active';
  
  // Estado para menú mobile
  showMobileViewSelector: boolean = false;
  
  // Vistas disponibles para el selector mobile
  availableViews = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'nannys', label: 'Nannys', icon: '👩‍💼' },
    { id: 'clients', label: 'Clientes', icon: '👥' },
    { id: 'payments', label: 'Pagos', icon: '💰' },
    { id: 'datos-bancarios', label: 'Datos Bancarios', icon: '🏦' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' }
  ];
  clientFilter: string = 'all'; // Cambiado de 'verified' a 'all' para mostrar todos los clientes por defecto
  paymentFilter: string = 'all'; // Mostrar todos los pagos por defecto
  paymentDateFilter: string = 'all';
  
  // Términos de búsqueda
  nannySearchTerm: string = '';
  clientSearchTerm: string = '';
  paymentSearchTerm: string = '';
  
  // Estado del modal de logout
  showLogoutModal: boolean = false;
  
  // Estado de envío del formulario
  isSubmitting: boolean = false;
  
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
    // Datos de tabla users
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    user_type: 'nanny',
    
    // Datos de tabla nannys
    description: '',
    experience_years: 0,
    hourly_rate: 15.00,
    status: 'active' as 'active' | 'inactive',
    
    // Datos de tabla nanny_availability
    is_available: true,
    reason: ''
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

  // Estados para verificación de documentos
  showVerifyDocumentModal: boolean = false;
  selectedClientForVerification: any = null;
  isVerifyingDocument: boolean = false;

  // Estados para perfil del cliente
  showClientProfileModal: boolean = false;
  selectedClientProfile: any = null;

  // Estados para detalles de pago
  showPaymentDetailsModal: boolean = false;
  selectedPaymentDetails: any = null;

  // Estados para modal de recibo
  showReceiptModal: boolean = false;
  selectedReceiptPayment: any = null;

  // Estados para perfil de nanny
  showNannyProfileModal: boolean = false;
  selectedNannyProfile: any = null;
  nannyRatings: any[] = [];
  isLoadingNannyRatings: boolean = false;

  // Estados para modal de cambio de estado de nanny
  showStatusConfirmationModal: boolean = false;
  statusConfirmationData: {
    nanny: any;
    newStatus: 'active' | 'inactive' | 'suspended';
    title: string;
    message: string;
    color: string;
  } = {
    nanny: null,
    newStatus: 'active',
    title: '',
    message: '',
    color: ''
  };

  // Estados para modal de resultado de verificación
  showVerificationResultModal: boolean = false;
  verificationResultData: {
    type: 'success' | 'error'; // 'success', 'error', 'rejected'
    title: string;
    message: string;
    action?: string; // 'approved', 'rejected'
  } = {
    type: 'success',
    title: '',
    message: '',
    action: ''
  };

  // Usuario actual (temporal)
  currentUser = {
    name: 'Administrador',
    role: 'administrador',
    avatar: '/assets/logo.png'
  };

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
  }

  onNotificationClick(notification: any) {
    // Aquí puedes manejar el clic en la notificación si es necesario
    // Por ejemplo, navegar a una sección específica o abrir un modal
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

  // Métodos para búsqueda
  onNannySearchChange() {
    // El filtro se aplica automáticamente en getCurrentNannys()
    // debido al [(ngModel)] binding
  }

  onClientSearchChange() {
    // El filtro se aplica automáticamente en getCurrentClients()
    // debido al [(ngModel)] binding
  }

  onPaymentSearchChange() {
    // El filtro se aplica automáticamente en getCurrentPayments()
    // debido al [(ngModel)] binding
  }

  // Obtener nannys según el filtro actual
  getCurrentNannys() {
      
      if (!this.nannysData || this.nannysData.length === 0) {
        return [];
      }    let filtered = [];
    switch(this.nannyFilter) {
      case 'active': 
        filtered = this.nannysData.filter(nanny => nanny.status === 'active');
        break;
      case 'inactive': 
        filtered = this.nannysData.filter(nanny => nanny.status === 'inactive');
        break;
      case 'suspended': 
        filtered = this.nannysData.filter(nanny => nanny.status === 'suspended');
        break;
      default: 
        filtered = this.nannysData.filter(nanny => nanny.status === 'active');
    }
    
    // Aplicar búsqueda
    if (this.nannySearchTerm.trim()) {
      const searchLower = this.nannySearchTerm.toLowerCase();
      filtered = filtered.filter(nanny => 
        (nanny.first_name?.toLowerCase().includes(searchLower) ||
         nanny.last_name?.toLowerCase().includes(searchLower) ||
         nanny.email?.toLowerCase().includes(searchLower) ||
         nanny.phone_number?.includes(searchLower))
      );
    }
    
    
    return filtered;
  }

  // Obtener clientes según el filtro actual
  getCurrentClients() {
    let filtered;
    switch(this.clientFilter) {
      case 'verified': 
        filtered = this.clientsData.filter(client => client.verificationStatus === 'verified');
        break;
      case 'unverified': 
        filtered = this.clientsData.filter(client => 
          client.verificationStatus === 'pending' || client.verificationStatus === 'rejected');
        break;
      case 'all':
        filtered = this.clientsData;
        break;
      default: 
        filtered = this.clientsData;
    }
    
    // Aplicar búsqueda
    if (this.clientSearchTerm.trim()) {
      const searchLower = this.clientSearchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        (client.name?.toLowerCase().includes(searchLower) ||
         client.email?.toLowerCase().includes(searchLower) ||
         client.phone?.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }

  // Obtener pagos según el filtro actual
  getCurrentPayments() {
    let payments = this.paymentsData || [];
    
    // Filtrar por estado de verificación
    if (this.paymentFilter === 'verified') {
      payments = payments.filter((payment: any) => payment.payment_status === 'completed');
    } else if (this.paymentFilter === 'unverified') {
      payments = payments.filter((payment: any) => payment.payment_status === 'pending');
    } else if (this.paymentFilter === 'processing') {
      payments = payments.filter((payment: any) => payment.payment_status === 'processing');
    }
    
    // Aplicar filtro de fecha
    if (this.paymentDateFilter !== 'all') {
      payments = payments.filter((payment: any) => {
        if (!payment.payment_date && !payment.created_at) return false;
        const paymentDate = new Date(payment.payment_date || payment.created_at);
        
        return this.isPaymentInDateRange(paymentDate, this.paymentDateFilter);
      });
    }
    
    // Aplicar búsqueda
    if (this.paymentSearchTerm.trim()) {
      const searchLower = this.paymentSearchTerm.toLowerCase();
      payments = payments.filter(payment => 
        (payment.client_first_name?.toLowerCase().includes(searchLower) ||
         payment.client_last_name?.toLowerCase().includes(searchLower) ||
         payment.nanny_first_name?.toLowerCase().includes(searchLower) ||
         payment.nanny_last_name?.toLowerCase().includes(searchLower) ||
         payment.amount?.toString().includes(searchLower) ||
         payment.id?.toString().includes(searchLower))
      );
    }
    
    return payments;
  }

  // Método auxiliar para verificar si un pago está en el rango de fechas
  private isPaymentInDateRange(paymentDate: Date, filter: string): boolean {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    switch(filter) {
      case 'today':
        return paymentDate >= todayStart && paymentDate <= todayEnd;
      
      case 'week':
        // Calcular inicio de semana (domingo)
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Calcular fin de semana (sábado)
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
  }

  // Métodos auxiliares para el template
  getActiveNannysSlice() {
    return this.nannysData.filter(nanny => nanny.status === 'active').slice(0, 3);
  }

  getRecentPayments() {
    // Retornar los últimos 3 pagos ordenados por fecha (más recientes primero)
    if (!this.paymentsData || this.paymentsData.length === 0) {
      return [];
    }
    return [...this.paymentsData]
      .sort((a, b) => new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime())
      .slice(0, 3);
  }

  getUnverifiedClientsSlice() {
    // Filtrar clientes no verificados
    return this.clientsData
      .filter(client => !client.isVerified)
      .slice(0, 3);
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
          // Usar verificationStatus del cliente (no isVerified del usuario)
          return client.verificationStatus === 'verified';
        }).length;
      case 'unverified': 
        return this.clientsData.filter(client => {
          // Contar pendientes y rechazados
          return client.verificationStatus === 'pending' || client.verificationStatus === 'rejected';
        }).length;
      default: return this.clientsData.length;
    }
  }

  getPaymentCount(type: string): number {
    switch(type) {
      case 'verified': 
        return this.paymentsData.filter((payment: any) => payment.payment_status === 'completed').length;
      case 'unverified': 
        return this.paymentsData.filter((payment: any) => payment.payment_status === 'pending').length;
      case 'processing':
        return this.paymentsData.filter((payment: any) => payment.payment_status === 'processing').length;
      default: 
        return this.paymentsData.length;
    }
  }

  getPaymentCountByDate(dateFilter: string): number {
    const allPayments = this.paymentsData || [];
    
    if (dateFilter === 'all') {
      return allPayments.length;
    }

    return allPayments.filter((payment: any) => {
      if (!payment.payment_date && !payment.created_at) return false;
      const paymentDate = new Date(payment.payment_date || payment.created_at);
      
      return this.isPaymentInDateRange(paymentDate, dateFilter);
    }).length;
  }

  // Métodos auxiliares para estadísticas de datos bancarios
  getActiveBankAccountsCount(): number {
    return this.datosBancarios.filter(datos => datos.isActive).length;
  }

  getVerifiedNannysWithBankCount(): number {
    return this.datosBancarios.filter(datos => datos.isPrimary).length;
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
      // Convertir propiedades a camelCase si vienen en snake_case
      this.selectedBankData = {
        id: bankData.id,
        accountHolderName: bankData.accountHolderName || bankData.account_holder_name || '',
        bankName: bankData.bankName || bankData.bank_name || '',
        accountNumber: bankData.accountNumber || bankData.account_number || '',
        clabe: bankData.clabe || '',
        accountType: bankData.accountType || bankData.account_type || 'checking',
        isPrimary: bankData.isPrimary !== undefined ? bankData.isPrimary : (bankData.is_primary || false),
        isActive: bankData.isActive !== undefined ? bankData.isActive : (bankData.is_active !== undefined ? bankData.is_active : true)
      };
      this.editingBankData = true;
    } else {
      this.selectedBankData = {
        id: null,
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        clabe: '',
        accountType: 'checking',
        isPrimary: false,
        isActive: true
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
        accountHolderName: this.selectedBankData.accountHolderName,
        bankName: this.selectedBankData.bankName,
        accountNumber: this.selectedBankData.accountNumber,
        clabe: this.selectedBankData.clabe,
        accountType: this.selectedBankData.accountType,
        isPrimary: this.selectedBankData.isPrimary,
        isActive: this.selectedBankData.isActive
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadBankDetails();
            this.closeBankDetailsModal();
          }
        },
        error: (error) => {
        }
      });
    } else {
      // Crear nuevos datos
      this.bankDetailsService.createBankDetails({
        accountHolderName: this.selectedBankData.accountHolderName,
        bankName: this.selectedBankData.bankName,
        accountNumber: this.selectedBankData.accountNumber,
        clabe: this.selectedBankData.clabe,
        accountType: this.selectedBankData.accountType,
        isPrimary: this.selectedBankData.isPrimary,
        isActive: this.selectedBankData.isActive
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadBankDetails();
            this.closeBankDetailsModal();
          }
        },
        error: (error) => {
        }
      });
    }
  }

  deleteBankData(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar estos datos bancarios?')) {
      this.bankDetailsService.deleteBankDetails(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadBankDetails();
          }
        },
        error: (error) => {
        }
      });
    }
  }

  toggleBankDataStatus(id: number) {
    this.bankDetailsService.toggleActiveStatus(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadBankDetails();
        }
      },
      error: (error) => {
      }
    });
  }

  // Obtener información de datos bancarios disponibles
  getAvailableBankDataCount() {
    return this.datosBancarios.length;
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
      // Datos de tabla users
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      address: '',
      user_type: 'nanny',
      
      // Datos de tabla nannys
      description: '',
      experience_years: 0,
      hourly_rate: 15.00,
      status: 'active' as 'active' | 'inactive',
      
      // Datos de tabla nanny_availability
      is_available: true,
      reason: ''
    };
  }

  onSubmitAddNanny(form: any) {
    if (form.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Generar una contraseña aleatoria segura
      const password = this.generateRandomPassword(12);
      
      // Preparar datos para enviar al backend
      const createNannyPayload = {
        ...this.newNannyData,
        password: password  // El backend hasheará esto
      };
      
      // Llamar al servicio para crear la nanny
      this.nannyService.createNanny(createNannyPayload).subscribe({
        next: (response) => {
          if (response.success) {
            
            // Cerrar modal
            this.closeAddNannyModal();
            
            // Mostrar mensaje de éxito
            alert(`✅ Nanny ${this.newNannyData.first_name} ${this.newNannyData.last_name} creada exitosamente.\n\n📧 Se envió un correo a ${this.newNannyData.email} con sus credenciales de acceso.\n\n⏰ La nanny podrá iniciar sesión inmediatamente con las credenciales enviadas.`);
            
            // Recargar datos desde la base de datos
            this.loadNannys();
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          alert(`Error al crear la nanny:\n${error.error?.message || error.message}`);
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Generar contraseña aleatoria segura
   */
  private generateRandomPassword(length: number): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Métodos auxiliares para el manejo de nannys
  getTotalNannys(): number {
    return this.nannysData.length;
  }

  getTotalClients(): number {
    return this.clientsData.length;
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
      case 'suspended': return 'Suspendida';
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
    // Contar servicios del cliente desde los datos cargados
    if (!this.paymentsData || this.paymentsData.length === 0) {
      return '0';
    }
    
    // Buscar pagos asociados a este cliente
    const clientBookings = this.paymentsData.filter((payment: any) => {
      return payment.client?.id === clientId;
    });
    
    return clientBookings.length.toString();
  }

  getLastActivity(clientId: number): string {
    // Buscar el cliente en los datos cargados
    const client = this.clientsData.find(c => c.id === clientId);
    
    if (!client || !client.lastLogin) {
      return 'Sin actividad';
    }
    
    // Calcular diferencia en días
    const lastLogin = new Date(client.lastLogin);
    const today = new Date();
    const diffMs = today.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} días`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
    return `${Math.floor(diffDays / 30)} meses`;
  }

  // Generar color de fondo para el avatar basado en el nombre
  getAvatarColor(name: string): string {
    // Paleta de colores predefinida
    const colors = [
      '#FF6B6B', // Rojo
      '#4ECDC4', // Turquesa
      '#45B7D1', // Azul
      '#FFA07A', // Naranja
      '#98D8C8', // Menta
      '#F7DC6F', // Amarillo
      '#BB8FCE', // Púrpura
      '#85C1E2', // Azul claro
      '#F8B739', // Oro
      '#52B788'  // Verde
    ];
    
    // Generar índice basado en el primer carácter del nombre
    const charCode = name.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    
    return colors[colorIndex];
  }

  // Construir URL completa de la imagen de perfil
  getProfileImageUrl(profileImage: string): string {
    if (!profileImage) return '';
    
    // Si ya tiene el protocolo, devolverlo tal cual
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    
    // Si ya comienza con /uploads, simplemente agregar el servidor
    if (profileImage.startsWith('/uploads/')) {
      return `http://localhost:8000${profileImage}`;
    }
    
    // Si solo tiene el nombre del archivo, agregar /uploads/
    if (!profileImage.startsWith('/')) {
      return `http://localhost:8000/uploads/${profileImage}`;
    }
    
    // Si tiene barra al inicio pero no /uploads
    return `http://localhost:8000/uploads${profileImage}`;
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
    // Determinar el estado basado en payment_status
    if (payment.payment_status === 'completed') {
      return 'verified';
    } else if (payment.payment_status === 'pending') {
      return 'unverified';
    } else if (payment.payment_status === 'processing') {
      return 'processing';
    } else if (payment.payment_status === 'failed' || payment.payment_status === 'refunded') {
      return 'cancelled';
    }
    return 'unverified'; // default
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'verified': return 'Completado';
      case 'unverified': return 'Pendiente';
      case 'processing': return 'En Revisión';
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
    const completedPayments = this.paymentsData.filter((payment: any) => payment.payment_status === 'completed');
    return completedPayments.reduce((total: number, payment: any) => total + (payment.amount || 0), 0);
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyPayments = this.paymentsData.filter((payment: any) => {
      if (payment.payment_status !== 'completed' || !payment.payment_date) return false;
      
      const paymentDate = new Date(payment.payment_date);
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
    
    // Buscar la nanny en el array de nannys
    const nanny = this.nannysData.find(n => n.id === nannyId);
    
    if (nanny) {
      this.selectedNannyProfile = nanny;
      this.showNannyProfileModal = true;
      
      // Cargar las calificaciones de la nanny
      this.loadNannyRatings(nannyId);
    } else {
      alert('No se encontró la información de esta nanny');
    }
  }

  closeNannyProfileModal() {
    this.showNannyProfileModal = false;
    this.selectedNannyProfile = null;
    this.nannyRatings = [];
  }

  loadNannyRatings(nannyId: number) {
    this.isLoadingNannyRatings = true;
    this.nannyService.getNannyRatings(nannyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.nannyRatings = response.data || [];
        } else {
          this.nannyRatings = [];
        }
        this.isLoadingNannyRatings = false;
      },
      error: (error) => {
        this.nannyRatings = [];
        this.isLoadingNannyRatings = false;
      }
    });
  }

  contactNanny(nannyId: number) {
    // Aquí podrías implementar la funcionalidad de contacto
  }

  /**
   * Cambiar estado de la nanny (active/inactive/suspended)
   */
  changeNannyStatus(nanny: any, newStatus: 'active' | 'inactive' | 'suspended') {
    if (!nanny || !nanny.id) {
      return;
    }

    const currentStatus = nanny.status;
    if (currentStatus === newStatus) {
      return;
    }

    // Preparar datos para el modal de confirmación
    let title = '';
    let message = '';
    let color = '';

    switch (newStatus) {
      case 'active':
        title = '✓ Activar Nanny';
        message = `¿Estás seguro de que deseas activar a ${nanny.first_name} ${nanny.last_name}? Podrá recibir nuevos servicios.`;
        color = 'green';
        break;
      case 'inactive':
        title = '✗ Desactivar Nanny';
        message = `¿Estás seguro de que deseas desactivar a ${nanny.first_name} ${nanny.last_name}? No podrá recibir nuevos servicios.`;
        color = 'red';
        break;
      case 'suspended':
        title = '⚠ Suspender Nanny';
        message = `¿Estás seguro de que deseas suspender a ${nanny.first_name} ${nanny.last_name}? Esta acción requiere revisión.`;
        color = 'yellow';
        break;
    }

    // Mostrar modal de confirmación
    this.statusConfirmationData = {
      nanny,
      newStatus,
      title,
      message,
      color
    };
    this.showStatusConfirmationModal = true;
  }

  /**
   * Confirmar el cambio de estado de la nanny
   */
  confirmStatusChange() {
    const { nanny, newStatus } = this.statusConfirmationData;

    // Llamar a servicio para actualizar el status
    this.nannyService.updateNannyStatus(nanny.id, newStatus).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar localmente
          nanny.status = newStatus;
          if (this.selectedNannyProfile) {
            this.selectedNannyProfile.status = newStatus;
          }

          // Cerrar modal de confirmación
          this.closeStatusConfirmationModal();

          // Recargar datos
          this.loadNannys();

          this.openVerificationResultModal(
            'success',
            'Estado Actualizado',
            `El estado de la nanny ha sido cambiado a: ${this.getStatusText(newStatus)}`
          );
        }
      },
      error: (error: any) => {
        this.closeStatusConfirmationModal();
        this.openVerificationResultModal(
          'error',
          'Error',
          'No se pudo actualizar el estado de la nanny'
        );
      }
    });
  }

  /**
   * Cerrar modal de confirmación de estado
   */
  closeStatusConfirmationModal() {
    this.showStatusConfirmationModal = false;
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

  // Métodos para verificación de documentos
  openVerifyDocumentModal(client: any) {
    this.selectedClientForVerification = client;
    this.showVerifyDocumentModal = true;
  }

  viewClientProfile(client: any) {
    this.selectedClientProfile = client;
    this.showClientProfileModal = true;
  }

  closeClientProfileModal() {
    this.showClientProfileModal = false;
    this.selectedClientProfile = null;
  }

  closeVerifyDocumentModal() {
    this.showVerifyDocumentModal = false;
    this.selectedClientForVerification = null;
    this.isVerifyingDocument = false;
  }

  // Métodos para el modal de resultado de verificación
  openVerificationResultModal(type: 'success' | 'error', title: string, message: string, action?: string) {
    this.verificationResultData = {
      type,
      title,
      message,
      action
    };
    this.showVerificationResultModal = true;
  }

  closeVerificationResultModal() {
    this.showVerificationResultModal = false;
    // Si fue exitoso, recargar clientes
    if (this.verificationResultData.type === 'success') {
      this.loadClients();
    }
  }

  // Obtener URL completa del documento de identificación del cliente
  getClientDocumentUrl(client: any): string {
    if (!client?.identification_document) {
      return '';
    }

    const document = client.identification_document;

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

  // Verificar si el documento es una imagen
  isClientDocumentImage(client: any): boolean {
    if (!client?.identification_document) {
      return false;
    }

    const doc = client.identification_document.toLowerCase();
    return doc.endsWith('.jpg') || doc.endsWith('.jpeg') || 
           doc.endsWith('.png') || doc.endsWith('.gif');
  }

  // Verificar si el documento es un PDF
  isClientDocumentPDF(client: any): boolean {
    if (!client?.identification_document) {
      return false;
    }

    return client.identification_document.toLowerCase().endsWith('.pdf');
  }

  // Aprobar verificación del cliente
  async approveClientVerification(client: any) {
    this.isVerifyingDocument = true;
    try {
      
      const token = this.authService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await fetch(`http://localhost:8000/api/v1/client/${client.id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'verified'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Actualizar estado local del cliente
        const clientIndex = this.clientsData.findIndex(c => c.id === client.id);
        if (clientIndex !== -1) {
          this.clientsData[clientIndex].verificationStatus = 'verified';
          this.clientsData[clientIndex].verificationDate = new Date().toISOString();
        }
        
        this.closeVerifyDocumentModal();
        
        // Mostrar modal de éxito en lugar de alert
        this.openVerificationResultModal(
          'success',
          'Cliente Verificado',
          'El documento de identificación ha sido aprobado correctamente. El cliente ya puede acceder a todos los servicios de la plataforma. ✓ Se ha enviado un correo de confirmación.',
          'approved'
        );
      } else {
        throw new Error(data.message || 'Error al verificar cliente');
      }
      
    } catch (error) {
      this.openVerificationResultModal(
        'error',
        'Error en la Verificación',
        'No fue posible verificar el documento. Por favor, intenta de nuevo o contacta al administrador.',
        'error'
      );
    } finally {
      this.isVerifyingDocument = false;
    }
  }

  // Rechazar verificación del cliente
  async rejectClientVerification(client: any) {
    this.isVerifyingDocument = true;
    try {
      
      const token = this.authService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await fetch(`http://localhost:8000/api/v1/client/${client.id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Actualizar estado local del cliente
        const clientIndex = this.clientsData.findIndex(c => c.id === client.id);
        if (clientIndex !== -1) {
          this.clientsData[clientIndex].verificationStatus = 'rejected';
        }
        
        this.closeVerifyDocumentModal();
        
        // Mostrar modal de rechazo en lugar de alert
        this.openVerificationResultModal(
          'error',
          'Verificación Rechazada',
          'El documento de identificación ha sido rechazado. El cliente ha sido notificado por correo y puede reenviar una nueva solicitud.',
          'rejected'
        );
      } else {
        throw new Error(data.message || 'Error al rechazar verificación');
      }
      
    } catch (error) {
      this.openVerificationResultModal(
        'error',
        'Error en el Rechazo',
        'No fue posible rechazar la verificación. Por favor, intenta de nuevo o contacta al administrador.',
        'error'
      );
    } finally {
      this.isVerifyingDocument = false;
    }
  }

  // Métodos para detalles de pago
  viewPaymentDetails(payment: any) {
    this.selectedPaymentDetails = payment;
    this.showPaymentDetailsModal = true;
  }

  closePaymentDetailsModal() {
    this.showPaymentDetailsModal = false;
    this.selectedPaymentDetails = null;
  }

  // Métodos para recibo
  viewReceipt(payment: any) {
    this.selectedReceiptPayment = payment;
    this.showReceiptModal = true;
  }

  closeReceiptModal() {
    this.showReceiptModal = false;
    this.selectedReceiptPayment = null;
  }

  // Obtener URL completa del recibo de transferencia
  getReceiptUrl(payment: any): string {
    // Intentar con receipt_url primero (nuevo sistema de pagos)
    if (payment?.receipt_url) {
      const receiptUrl = payment.receipt_url;
      
      // Si ya es una URL completa, devolverla
      if (receiptUrl.startsWith('http')) {
        return receiptUrl;
      }
      
      // Si es una ruta relativa, construir la URL completa
      if (receiptUrl.startsWith('/uploads/')) {
        return `http://localhost:8000${receiptUrl}`;
      }
      
      // Si es solo el nombre del archivo
      const baseUrl = 'http://localhost:8000/uploads/receipts';
      return `${baseUrl}/${receiptUrl}`;
    }
    
    // Fallback a receiptProof para compatibilidad
    if (!payment?.receiptProof) {
      return '';
    }
    
    const receiptProof = payment.receiptProof;
    
    // Si ya es una URL completa, devolverla
    if (receiptProof.startsWith('http')) {
      return receiptProof;
    }
    
    // Si es una ruta relativa, construir URL completa
    const baseUrl = 'http://localhost:3000/uploads/receipts'; // TODO: Cambiar según configuración del backend
    return `${baseUrl}/${receiptProof}`;
  }

  // Verificar si el recibo es una imagen
  isReceiptImage(payment: any): boolean {
    const url = payment?.receipt_url || payment?.receiptProof;
    
    if (!url) {
      return false;
    }
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension);
  }

  // Verificar si el recibo es un PDF
  isReceiptPDF(payment: any): boolean {
    const url = payment?.receipt_url || payment?.receiptProof;
    
    if (!url) {
      return false;
    }
    
    return url.toLowerCase().endsWith('.pdf');
  }

  /**
   * Ver comprobante de pago (imagen o PDF)
   */
  viewPaymentReceipt(payment: any) {
    if (!payment.receipt_url) {
      return;
    }
    
    this.selectedReceiptPayment = payment;
    this.showReceiptModal = true;
  }

  /**
   * Aprobar un pago después de verificar el comprobante
   */
  approvePayment(payment: any) {
    if (!this.paymentService) {
      return;
    }

    
    // Llamar al servicio para verificar el pago
    this.paymentService.verifyPayment(payment.id, 'approve', 'Comprobante verificado correctamente').subscribe({
      next: (response: any) => {
        
        // Mostrar modal de éxito
        alert('✅ Pago aprobado exitosamente. La niñera recibirá el monto correspondiente.');
        
        // Recargar los pagos
        this.loadPayments();
      },
      error: (error: any) => {
      }
    });
  }

  /**
   * Rechazar un pago
   */
  rejectPayment(payment: any) {
    const reason = prompt('Por favor, proporciona una razón para rechazar este pago:');
    
    if (!reason) {
      return;
    }

    if (!this.paymentService) {
      return;
    }

    
    // Llamar al servicio para rechazar el pago
    this.paymentService.verifyPayment(payment.id, 'reject', reason).subscribe({
      next: (response: any) => {
        
        // Recargar los pagos
        this.loadPayments();
      },
      error: (error: any) => {
      }
    });
  }

 
}