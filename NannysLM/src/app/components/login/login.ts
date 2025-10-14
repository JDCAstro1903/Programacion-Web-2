import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onSubmit() {
    // Redirigir directamente a user-selection sin validaciones
    this.router.navigate(['/user-selection']);
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
}