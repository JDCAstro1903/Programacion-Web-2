import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';
import { AuthService } from '../../services/auth.service';

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

    constructor(
    private router: Router,
    private userConfigService: UserConfigService,
    private authService: AuthService
  ) {
    this.sidebarConfig = this.userConfigService.getSidebarConfig('admin');
  }

  ngOnInit() {
    // Actualizar contadores en el sidebar
    this.updateSidebarCounts();
  }

  private updateSidebarCounts() {
    this.userConfigService.updateSidebarItemCount('admin', 'nannys', 
      this.nannysData.active.length + this.nannysData.inactive.length + this.nannysData.busy.length);
    this.userConfigService.updateSidebarItemCount('admin', 'clients', 
      this.clientsData.verified.length + this.clientsData.unverified.length);
    this.userConfigService.updateSidebarItemCount('admin', 'payments', 
      this.paymentsData.verified.length + this.paymentsData.unverified.length);
    this.userConfigService.updateSidebarItemCount('admin', 'datos-bancarios', 
      this.datosBancarios.length);
  }

  // Datos del dashboard
  stats = {
    nanniesAvailable: 24,
    verifiedClients: 16,
    unverifiedClients: 5,
    monthlyRevenue: 12450
  };

  // Datos de las nannys (datos de ejemplo)
  nannysData = {
    active: [
      { id: 1, name: 'María García', rating: 4.9, experience: 5, location: 'Madrid Centro', hourlyRate: 15 },
      { id: 2, name: 'Ana López', rating: 4.8, experience: 3, location: 'Barcelona', hourlyRate: 18 },
      { id: 3, name: 'Carmen Ruiz', rating: 4.7, experience: 7, location: 'Valencia', hourlyRate: 20 }
    ],
    inactive: [
      { id: 4, name: 'Laura Martín', rating: 4.6, experience: 2, location: 'Sevilla', hourlyRate: 16 },
      { id: 5, name: 'Isabel Torres', rating: 4.5, experience: 4, location: 'Bilbao', hourlyRate: 17 }
    ],
    busy: [
      { id: 6, name: 'Rosa Fernández', rating: 4.9, experience: 6, location: 'Madrid Norte', hourlyRate: 22 },
      { id: 7, name: 'Elena Jiménez', rating: 4.8, experience: 4, location: 'Barcelona', hourlyRate: 19 }
    ]
  };

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

  // Datos de ejemplo para clientes
  clientsData = {
    verified: [
      { 
        id: 1, 
        name: 'Carlos Mendoza', 
        email: 'carlos.mendoza@email.com', 
        phone: '+34 600 123 456', 
        location: 'Madrid Centro', 
        children: 2, 
        memberSince: '2024-01-15' 
      },
      { 
        id: 2, 
        name: 'Laura Vázquez', 
        email: 'laura.vazquez@email.com', 
        phone: '+34 610 234 567', 
        location: 'Salamanca', 
        children: 1, 
        memberSince: '2024-02-10' 
      },
      { 
        id: 3, 
        name: 'Patricia Silva', 
        email: 'patricia.silva@email.com', 
        phone: '+34 630 456 789', 
        location: 'Chamberí', 
        children: 1, 
        memberSince: '2024-03-05' 
      },
      { 
        id: 4, 
        name: 'Cristina Torres', 
        email: 'cristina.torres@email.com', 
        phone: '+34 650 678 901', 
        location: 'La Latina', 
        children: 4, 
        memberSince: '2024-01-30' 
      },
      { 
        id: 5, 
        name: 'Carmen Guerrero', 
        email: 'carmen.guerrero@email.com', 
        phone: '+34 670 890 123', 
        location: 'Argüelles', 
        children: 2, 
        memberSince: '2024-04-12' 
      }
    ],
    unverified: [
      { 
        id: 6, 
        name: 'Javier Ramos', 
        email: 'javier.ramos@email.com', 
        phone: '+34 620 345 678', 
        location: 'Retiro', 
        children: 3, 
        memberSince: '2024-09-20' 
      },
      { 
        id: 7, 
        name: 'Roberto Navarro', 
        email: 'roberto.navarro@email.com', 
        phone: '+34 640 567 890', 
        location: 'Malasaña', 
        children: 2, 
        memberSince: '2024-09-28' 
      },
      { 
        id: 8, 
        name: 'Miguel Ortega', 
        email: 'miguel.ortega@email.com', 
        phone: '+34 660 789 012', 
        location: 'Chueca', 
        children: 1, 
        memberSince: '2024-10-01' 
      }
    ]
  };

  // Datos de ejemplo para pagos
  paymentsData = {
    verified: [
      {
        id: 1,
        clientName: 'Carlos Mendoza',
        nannyName: 'María García',
        amount: 120,
        date: '2024-10-05',
        hours: 8,
        type: 'completed'
      },
      {
        id: 2,
        clientName: 'Laura Vázquez',
        nannyName: 'Ana López',
        amount: 90,
        date: '2024-10-04',
        hours: 5,
        type: 'completed'
      },
      {
        id: 3,
        clientName: 'Patricia Silva',
        nannyName: 'Isabel Torres',
        amount: 64,
        date: '2024-10-03',
        hours: 4,
        type: 'completed'
      },
      {
        id: 4,
        clientName: 'Cristina Torres',
        nannyName: 'Rosa Fernández',
        amount: 102,
        date: '2024-09-28',
        hours: 6,
        type: 'completed'
      },
      {
        id: 5,
        clientName: 'Carmen Guerrero',
        nannyName: 'Elena Jiménez',
        amount: 190,
        date: '2024-09-26',
        hours: 10,
        type: 'completed'
      },
      {
        id: 6,
        clientName: 'Antonio Ruiz',
        nannyName: 'Carmen Ruiz',
        amount: 85,
        date: '2024-09-15',
        hours: 5,
        type: 'completed'
      },
      {
        id: 7,
        clientName: 'Sofia Morales',
        nannyName: 'Patricia Moreno',
        amount: 140,
        date: '2024-08-22',
        hours: 8,
        type: 'completed'
      },
      {
        id: 8,
        clientName: 'Diego Herrera',
        nannyName: 'Gloria Santos',
        amount: 96,
        date: '2024-08-10',
        hours: 6,
        type: 'completed'
      }
    ],
    unverified: [
      {
        id: 9,
        clientName: 'Javier Ramos',
        nannyName: 'Carmen Ruiz',
        amount: 168,
        date: '2024-10-02',
        hours: 12,
        type: 'pending'
      },
      {
        id: 10,
        clientName: 'Roberto Navarro',
        nannyName: 'Laura Martín',
        amount: 156,
        date: '2024-10-01',
        hours: 12,
        type: 'pending'
      },
      {
        id: 11,
        clientName: 'Miguel Ortega',
        nannyName: 'Elena Ruiz',
        amount: 75,
        date: '2024-09-27',
        hours: 5,
        type: 'pending'
      },
      {
        id: 12,
        clientName: 'Ana Delgado',
        nannyName: 'Pilar Herrera',
        amount: 112,
        date: '2024-09-20',
        hours: 7,
        type: 'pending'
      },
      {
        id: 13,
        clientName: 'Fernando Castro',
        nannyName: 'Consuelo Vega',
        amount: 88,
        date: '2024-08-25',
        hours: 6,
        type: 'pending'
      }
    ]
  };

  // Datos bancarios de las nannys
  datosBancarios = [
    {
      id: 1,
      nanny_id: 5,
      nombre_titular: 'Leslie Ruiz',
      banco: 'BBVA Bancomer',
      numero_cuenta_oculto: '****7890',
      numero_cuenta_completo: '1234567890',
      clabe: '012180001234567890',
      tipo_cuenta: 'ahorro',
      es_activa: true,
      fecha_creacion: '2024-01-15',
      nanny_nombre: 'Leslie Ruiz',
      nanny_email: 'leslie.ruiz@nannyslm.com',
      nanny_verificada: true
    },
    {
      id: 2,
      nanny_id: 6,
      nombre_titular: 'Ana Martínez',
      banco: 'Santander',
      numero_cuenta_oculto: '****4321',
      numero_cuenta_completo: '0987654321',
      clabe: '014320000987654321',
      tipo_cuenta: 'corriente',
      es_activa: true,
      fecha_creacion: '2024-02-10',
      nanny_nombre: 'Ana Martínez',
      nanny_email: 'ana.martinez@nannyslm.com',
      nanny_verificada: true
    },
    {
      id: 3,
      nanny_id: 7,
      nombre_titular: 'Sofia López',
      banco: 'Banorte',
      numero_cuenta_oculto: '****9876',
      numero_cuenta_completo: '5678909876',
      clabe: '072580005678909876',
      tipo_cuenta: 'ahorro',
      es_activa: false,
      fecha_creacion: '2024-03-05',
      nanny_nombre: 'Sofia López',
      nanny_email: 'sofia.lopez@nannyslm.com',
      nanny_verificada: false
    }
  ];

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
      case 'active': return this.nannysData.active;
      case 'inactive': return this.nannysData.inactive;
      case 'busy': return this.nannysData.busy;
      default: return this.nannysData.active;
    }
  }

  // Obtener clientes según el filtro actual
  getCurrentClients() {
    switch(this.clientFilter) {
      case 'verified': return this.clientsData.verified;
      case 'unverified': return this.clientsData.unverified;
      default: return this.clientsData.verified;
    }
  }

  // Obtener pagos según el filtro actual
  getCurrentPayments() {
    let payments = this.paymentFilter === 'verified' ? this.paymentsData.verified : this.paymentsData.unverified;
    
    // Aplicar filtro de fecha
    if (this.paymentDateFilter !== 'all') {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      payments = payments.filter(payment => {
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

  // Obtener contadores para los filtros
  getNannyCount(type: string): number {
    switch(type) {
      case 'active': return this.nannysData.active.length;
      case 'inactive': return this.nannysData.inactive.length;
      case 'busy': return this.nannysData.busy.length;
      default: return 0;
    }
  }

  getClientCount(type: string): number {
    switch(type) {
      case 'verified': return this.clientsData.verified.length;
      case 'unverified': return this.clientsData.unverified.length;
      default: return 0;
    }
  }

  getPaymentCount(type: string): number {
    switch(type) {
      case 'verified': return this.paymentsData.verified.length;
      case 'unverified': return this.paymentsData.unverified.length;
      default: return 0;
    }
  }

  getPaymentCountByDate(dateFilter: string): number {
    const allPayments = [...this.paymentsData.verified, ...this.paymentsData.unverified];
    
    if (dateFilter === 'all') {
      return allPayments.length;
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return allPayments.filter(payment => {
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
      const nannyData = this.nannysData.active.find(n => n.id === this.selectedBankData.nanny_id) ||
                       this.nannysData.inactive.find(n => n.id === this.selectedBankData.nanny_id) ||
                       this.nannysData.busy.find(n => n.id === this.selectedBankData.nanny_id);
      
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
    const allNannys = [...this.nannysData.active, ...this.nannysData.inactive, ...this.nannysData.busy];
    const nannysWithBankData = this.datosBancarios.filter(d => d.es_activa).map(d => d.nanny_id);
    
    return allNannys.filter(nanny => !nannysWithBankData.includes(nanny.id));
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
      // Crear nuevo objeto nanny
      const newNanny = {
        id: this.getTotalNannys() + 1,
        name: this.newNannyData.name,
        rating: 5.0, // Rating inicial
        experience: parseInt(this.newNannyData.experience),
        location: this.newNannyData.location,
        hourlyRate: this.newNannyData.hourlyRate
      };

      // Agregar a la categoría correspondiente
      if (this.newNannyData.status === 'active') {
        this.nannysData.active.push(newNanny);
      } else {
        this.nannysData.inactive.push(newNanny);
      }

      // Actualizar stats
      this.stats.nanniesAvailable = this.nannysData.active.length;
      
      // Actualizar contadores del sidebar
      this.updateSidebarCounts();

      // Cerrar modal
      this.closeAddNannyModal();

      // Mostrar mensaje de éxito (aquí podrías agregar un toast o notificación)
      console.log('Nanny agregada exitosamente:', newNanny);
    }
  }

  // Métodos auxiliares para el manejo de nannys
  getTotalNannys(): number {
    return this.nannysData.active.length + this.nannysData.inactive.length + this.nannysData.busy.length;
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
    // Determinar el estado basado en qué array contiene esta nanny
    if (this.nannysData.active.some(n => n.id === nanny.id)) {
      return 'active';
    } else if (this.nannysData.busy.some(n => n.id === nanny.id)) {
      return 'busy';
    } else if (this.nannysData.inactive.some(n => n.id === nanny.id)) {
      return 'inactive';
    }
    return 'active'; // default
  }

  // Métodos para clientes
  getClientStatusFromData(client: any): string {
    // Determinar el estado basado en qué array contiene este cliente
    if (this.clientsData.verified.some(c => c.id === client.id)) {
      return 'verified';
    } else if (this.clientsData.unverified.some(c => c.id === client.id)) {
      return 'unverified';
    }
    return 'verified'; // default
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
    // Determinar el estado basado en qué array contiene este pago
    if (this.paymentsData.verified.some(p => p.id === payment.id)) {
      return 'verified';
    } else if (this.paymentsData.unverified.some(p => p.id === payment.id)) {
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
    const allPayments = [...this.paymentsData.verified, ...this.paymentsData.unverified];
    return allPayments.reduce((total, payment) => total + payment.amount, 0);
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const allPayments = [...this.paymentsData.verified, ...this.paymentsData.unverified];
    
    return allPayments
      .filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((total, payment) => total + payment.amount, 0);
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
    const allPayments = [...this.paymentsData.verified, ...this.paymentsData.unverified];
    return allPayments.some(payment => this.isSameDay(new Date(payment.date), date));
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