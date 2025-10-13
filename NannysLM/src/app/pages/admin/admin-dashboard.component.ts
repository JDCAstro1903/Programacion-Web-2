import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent, SidebarConfig } from '../../shared/components/sidebar/sidebar.component';
import { LogoutModalComponent } from '../../shared/components/logout-modal/logout-modal.component';
import { UserConfigService } from '../../shared/services/user-config.service';

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

  constructor(private userConfigService: UserConfigService, private router: Router) {
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
      const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      payments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        const paymentDateOnly = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
        
        switch(this.paymentDateFilter) {
          case 'today':
            return paymentDateOnly.getTime() === currentDate.getTime();
          case 'week':
            const weekAgo = new Date(currentDate);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return paymentDateOnly >= weekAgo;
          case 'month':
            const monthAgo = new Date(currentDate);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return paymentDateOnly >= monthAgo;
          case 'quarter':
            const quarterAgo = new Date(currentDate);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return paymentDateOnly >= quarterAgo;
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
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return allPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      const paymentDateOnly = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
      
      switch(dateFilter) {
        case 'today':
          return paymentDateOnly.getTime() === currentDate.getTime();
        case 'week':
          const weekAgo = new Date(currentDate);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return paymentDateOnly >= weekAgo;
        case 'month':
          const monthAgo = new Date(currentDate);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return paymentDateOnly >= monthAgo;
        case 'quarter':
          const quarterAgo = new Date(currentDate);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          return paymentDateOnly >= quarterAgo;
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
    this.router.navigate(['/user-selection']);
    console.log('Usuario cerró sesión');
  }
}