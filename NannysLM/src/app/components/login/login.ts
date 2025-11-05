import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;

  // Estados del formulario
  isLoading: boolean = false;
  errors: any = {};
  successMessage: string = '';
  showLoadingModal: boolean = false;
  showSuccessModal: boolean = false;
  userInfo: any = null;
  
  // Estado para mostrar/ocultar contraseña
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    // Limpiar errores previos
    this.errors = {};
    this.successMessage = '';

    // Validaciones básicas
    if (!this.validateForm()) {
      this.scrollToFirstError();
      return;
    }

    this.isLoading = true;
    this.showLoadingModal = true;

    // Iniciar sesión
    const loginData = {
      email: this.email.toLowerCase().trim(),
      password: this.password
    };
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showLoadingModal = false;
        
        if (response.success) {
          // Guardar información del usuario
          this.userInfo = response.data.user;
          
          // Mostrar modal de éxito
          this.showSuccessModal = true;
          
          // Guardar en localStorage si "recordarme" está marcado
          if (this.rememberMe) {
            localStorage.setItem('rememberUser', 'true');
          }
          
          // Redirigir después de 3 segundos
          setTimeout(() => {
            this.redirectToDashboard(response.data.user.user_type);
          }, 3000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showLoadingModal = false;
        console.error('Error en login:', error);
        console.error('Error status:', error.status);
        console.error('Error error:', error.error);
        console.error('Error message:', error.error?.message);
        console.error('Error errors:', error.error?.errors);
        
        // Limpiar errores previos
        this.errors = {};
        
        if (error.error && error.error.errors) {
          // Errores específicos del backend (email no existe, contraseña incorrecta, etc.)
          console.log('Procesando errores específicos:', error.error.errors);
          this.errors = this.processValidationErrors(error.error.errors);
          this.scrollToFirstError();
        } else if (error.error && error.error.message) {
          // Error general del backend
          console.log('Error general del backend:', error.error.message);
          this.errors.general = error.error.message;
        } else if (error.status === 401) {
          // Fallback para errores 401 sin estructura específica
          this.errors.general = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (error.status === 403) {
          // Usuario inactivo / no activado por email
          this.errors.general = 'Tu cuenta no está activa. Hemos enviado un correo con un enlace de activación. Revisa tu correo (y la carpeta de spam). Si no recibiste el correo, solicita reenvío o contacta al soporte.';
        } else if (error.status === 0) {
          // Error de conexión
          this.errors.general = 'No se puede conectar al servidor. Verifica tu conexión a internet.';
        } else if (error.status >= 500) {
          // Error del servidor
          this.errors.general = 'Error interno del servidor. Inténtalo más tarde.';
        } else {
          // Error genérico
          this.errors.general = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
        }
        
        console.log('Errores finales asignados:', this.errors);
      }
    });
  }

  validateForm(): boolean {
    let isValid = true;

    // Validar email
    if (!this.email.trim()) {
      this.errors.email = 'El email es requerido';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.errors.email = 'El email no es válido';
      isValid = false;
    }

    // Validar contraseña
    if (!this.password) {
      this.errors.password = 'La contraseña es requerida';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  processValidationErrors(errors: any[]): any {
    console.log('🔍 Procesando errores de validación:', errors);
    const processedErrors: any = {};
    errors.forEach(error => {
      console.log(`🔸 Procesando error - Campo: ${error.field}, Mensaje: ${error.message}`);
      processedErrors[error.field] = error.message;
    });
    console.log('✅ Errores procesados:', processedErrors);
    return processedErrors;
  }

  onRegister() {
    console.log('Register clicked');
    this.router.navigate(['/register']);
  }

  // Alternar visibilidad de contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Método para hacer scroll al primer error
  private scrollToFirstError() {
    // Esperar un tick para que Angular actualice el DOM
    setTimeout(() => {
      const errorFields = ['general', 'email', 'password'];
      
      for (let field of errorFields) {
        if (this.errors[field]) {
          let element: HTMLElement | null = null;
          
          if (field === 'general') {
            // Para errores generales, scroll al top del formulario
            element = document.querySelector('.alert-error') as HTMLElement;
          } else {
            // Para errores de campos específicos, buscar el input
            element = document.getElementById(field) as HTMLElement;
          }
          
          if (element) {
            // Calcular posición para scroll suave
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - 100; // 100px de margen superior
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            // Enfocar el input si no es un error general
            if (field !== 'general' && element.tagName === 'INPUT') {
              element.focus();
            }
            
            break; // Solo scroll al primer error encontrado
          }
        }
      }
    }, 100);
  }

  // Método para hacer scroll a un error específico
  private scrollToError(fieldId: string) {
    setTimeout(() => {
      const element = document.getElementById(fieldId) as HTMLElement;
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 100;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  // Métodos para los modales
  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  redirectToDashboard(userType: string) {
    this.showSuccessModal = false;
    
    if (userType === 'client') {
      this.router.navigate(['/dashboard/client']);
    } else if (userType === 'nanny') {
      this.router.navigate(['/dashboard/nanny']);
    } else {
      this.router.navigate(['/dashboard/admin']);
    }
  }

  getUserRoleText(userType: string): string {
    switch (userType) {
      case 'client':
        return 'Cliente';
      case 'nanny':
        return 'Niñera';
      case 'admin':
        return 'Administrador';
      default:
        return 'Usuario';
    }
  }
}