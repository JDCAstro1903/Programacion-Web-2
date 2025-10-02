import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

  onSubmit() {
    console.log('Login attempt:', {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    });
    // Aquí implementarás la lógica de autenticación
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