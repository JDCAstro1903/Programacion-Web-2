import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  // Estados
  step: 'form' | 'loading' | 'success' | 'error' = 'form';
  token: string = '';
  
  // Datos del formulario
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  // Estados de envío
  isLoading: boolean = false;
  message: string = '';
  passwordStrength: number = 0;
  passwordRequirements = {
    length: false,      // 6+ caracteres
    uppercase: false,   // Una mayúscula
    lowercase: false,   // Una minúscula
    number: false       // Un número
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Obtener el token de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.step = 'error';
        this.message = 'Token inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.';
      }
    });
  }

  /**
   * Validar y evaluar fuerza de contraseña
   */
  validatePasswordStrength() {
    this.passwordRequirements = {
      length: this.password.length >= 6,
      uppercase: /[A-Z]/.test(this.password),
      lowercase: /[a-z]/.test(this.password),
      number: /[0-9]/.test(this.password)
    };

    // Calcular fuerza
    const metReqs = Object.values(this.passwordRequirements).filter(v => v).length;
    this.passwordStrength = (metReqs / 4) * 100;
  }

  /**
   * Obtener color de la barra de fuerza
   */
  getStrengthColor(): string {
    if (this.passwordStrength <= 25) return '#ef4444'; // Rojo
    if (this.passwordStrength <= 50) return '#f97316'; // Naranja
    if (this.passwordStrength <= 75) return '#eab308'; // Amarillo
    return '#10b981'; // Verde
  }

  /**
   * Obtener texto de fuerza
   */
  getStrengthText(): string {
    if (this.passwordStrength <= 25) return 'Muy débil';
    if (this.passwordStrength <= 50) return 'Débil';
    if (this.passwordStrength <= 75) return 'Media';
    return 'Fuerte';
  }

  /**
   * Validar formulario
   */
  validateForm(): boolean {
    // Validar que ambas contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.message = 'Las contraseñas no coinciden';
      return false;
    }

    // Validar todos los requisitos
    if (!Object.values(this.passwordRequirements).every(v => v)) {
      this.message = 'La contraseña no cumple con los requisitos';
      return false;
    }

    return true;
  }

  /**
   * Enviar nueva contraseña
   */
  submitResetPassword() {
    this.message = '';

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.step = 'loading';

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.step = 'success';
          this.message = response.message || 'Contraseña restablecida correctamente';
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.step = 'error';
          this.message = response.message || 'Error restableciendo contraseña';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.step = 'error';
        console.error('Error:', error);
        
        if (error.status === 400 && error.error?.message) {
          this.message = error.error.message;
        } else if (error.status === 401) {
          this.message = 'Token inválido o expirado. Por favor, solicita un nuevo enlace.';
        } else {
          this.message = error.error?.message || 'Error restableciendo contraseña. Intenta de nuevo.';
        }
      }
    });
  }

  /**
   * Volver a solicitar recuperación
   */
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Volver a login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Alternar visibilidad de contraseña
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Alternar visibilidad de confirmación
   */
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Validar si todos los requisitos de contraseña se cumplen
   */
  isPasswordValid(): boolean {
    return Object.values(this.passwordRequirements).every(v => v) && 
           this.password === this.confirmPassword &&
           this.password.length > 0 &&
           this.confirmPassword.length > 0;
  }
}
