import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServiceService, ServiceData } from '../../services/service.service';
import { NannyService } from '../../services/nanny.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-details.component.html',
  styleUrl: './service-details.component.css'
})
export class ServiceDetailsComponent implements OnInit {
  serviceId: number | null = null;
  service: ServiceData | null = null;
  nannyId: number | null = null;
  
  isLoading = true;
  loadError: string | null = null;
  isAccepting = false;
  acceptSuccess = false;
  acceptError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceService: ServiceService,
    private nannyService: NannyService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Obtener el serviceId de la ruta
    this.route.params.subscribe(params => {
      this.serviceId = +params['serviceId'];
      if (this.serviceId) {
        this.loadServiceDetails();
        this.loadNannyId();
      }
    });
  }

  loadServiceDetails() {
    if (!this.serviceId) return;

    this.isLoading = true;
    this.loadError = null;

    this.serviceService.getServiceById(this.serviceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.service = response.data;
          console.log('✅ Detalles del servicio cargados:', this.service);
        } else {
          this.loadError = 'No se encontró el servicio';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando servicio:', error);
        this.loadError = 'Error al cargar los detalles del servicio';
        this.isLoading = false;
      }
    });
  }

  loadNannyId() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    this.nannyService.getNannyByUserId(currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.nannyId = response.data.id;
          console.log('✅ Nanny ID obtenido:', this.nannyId);
        }
      },
      error: (error) => {
        console.error('❌ Error obteniendo nanny ID:', error);
      }
    });
  }

  acceptService() {
    if (!this.serviceId || !this.nannyId) {
      this.acceptError = 'No se puede aceptar el servicio en este momento';
      return;
    }

    if (!this.service) {
      this.acceptError = 'No se encontró el servicio';
      return;
    }

    // Verificar que el servicio esté pendiente
    if (this.service.status !== 'pending') {
      this.acceptError = 'Este servicio ya no está disponible';
      return;
    }

    // Verificar que no tenga nanny asignada
    if (this.service.nanny_id) {
      this.acceptError = 'Este servicio ya ha sido aceptado por otra nanny';
      return;
    }

    this.isAccepting = true;
    this.acceptError = null;

    this.serviceService.acceptService(this.serviceId, this.nannyId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Servicio aceptado exitosamente');
          this.acceptSuccess = true;
          
          // Redirigir al dashboard después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/nanny/dashboard']);
          }, 2000);
        } else {
          this.acceptError = response.message || 'No se pudo aceptar el servicio';
          this.isAccepting = false;
        }
      },
      error: (error) => {
        console.error('❌ Error aceptando servicio:', error);
        this.acceptError = error.error?.message || 'Error al aceptar el servicio. Es posible que otra nanny lo haya aceptado primero.';
        this.isAccepting = false;
      }
    });
  }

  declineService() {
    // Simplemente redirigir al dashboard sin aceptar
    this.router.navigate(['/nanny/dashboard']);
  }

  getServiceTypeName(type: string): string {
    const types: { [key: string]: string } = {
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
    return types[type] || type;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onBackClick() {
    this.declineService();
  }
}
