import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  // Estados del formulario
  step: 'email' | 'success' = 'email'; // email o success
  email: string = '';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'error' | 'success' | 'info' = 'info';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Validar formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Enviar solicitud de recuperación de contraseña
   */
  submitForgotPassword() {
    this.message = '';

    // Validar email
    if (!this.email.trim()) {
      this.message = 'Por favor ingresa tu correo';
      this.messageType = 'error';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.message = 'Por favor ingresa un correo válido';
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;
    this.messageType = 'info';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.messageType = 'success';
          this.message = response.message || 'Solicitud enviada correctamente';
          this.step = 'success';
        } else {
          this.messageType = 'error';
          this.message = response.message || 'Error enviando solicitud';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.messageType = 'error';
        console.error('Error:', error);
        this.message = error.error?.message || 'Error enviando solicitud. Intenta más tarde.';
      }
    });
  }

  /**
   * Volver a login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Intentar de nuevo
   */
  tryAgain() {
    this.step = 'email';
    this.email = '';
    this.message = '';
    this.isLoading = false;
  }
}
