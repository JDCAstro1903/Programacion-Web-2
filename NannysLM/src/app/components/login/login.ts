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
    console.log('Login attempt:', {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    });
    
    // Por ahora, simplemente redirigir a la selección de usuario
    // Más adelante aquí validarás las credenciales
    this.router.navigate(['/user-selection']);
  }

  onForgotPassword() {
    console.log('Forgot password clicked');
    // Implementar lógica para recuperar contraseña
  }

  onRegister() {
    console.log('Register clicked');
    // Navegar a registro
  }
}