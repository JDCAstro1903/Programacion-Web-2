import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  showTestUsers: boolean = false;
  testUsers: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Cargar usuarios de prueba para desarrollo
    this.loadTestUsers();
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        
        // Redirigir según el tipo de usuario
        this.authService.redirectToDashboard();
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.message;
      }
    });
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

  // Métodos para desarrollo - mostrar usuarios de prueba
  loadTestUsers() {
    this.authService.getTestUsers().subscribe({
      next: (users) => {
        this.testUsers = users;
      },
      error: (error) => {
        console.error('Error loading test users:', error);
      }
    });
  }

  toggleTestUsers() {
    this.showTestUsers = !this.showTestUsers;
  }

  loginAsTestUser(user: any) {
    this.email = user.email;
    // Para pruebas, usar una contraseña por defecto
    this.password = 'password123';
    this.onSubmit();
  }

  clearError() {
    this.errorMessage = '';
  }
}