import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, LoginData } from '../../services/auth.service';

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

    // Preparar datos para login
    const loginData: LoginData = {
      email: this.email.toLowerCase().trim(),
      password: this.password
    };

    // Iniciar sesión
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
        
        if (error.error && error.error.errors) {
          // Errores de validación del backend
          this.errors = this.processValidationErrors(error.error.errors);
          this.scrollToFirstError();
        } else if (error.error && error.error.message) {
          // Error general del backend
          this.errors.general = error.error.message;
        } else if (error.status === 401) {
          // Error de credenciales
          this.errors.general = 'Email o contraseña incorrectos';
        } else if (error.status === 403) {
          // Usuario desactivado
          this.errors.general = 'Tu cuenta ha sido desactivada. Contacta al soporte.';
        } else {
          // Error de red u otro
          this.errors.general = 'Error de conexión. Intenta nuevamente.';
        }
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
    const processedErrors: any = {};
    errors.forEach(error => {
      processedErrors[error.field] = error.message;
    });
    return processedErrors;
  }

  onForgotPassword() {
    console.log('Forgot password clicked');
    // Implementar lógica para recuperar contraseña
    alert('Funcionalidad de recuperación de contraseña aún no implementada');
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