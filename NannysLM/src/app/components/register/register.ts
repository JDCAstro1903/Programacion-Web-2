import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phoneNumber: string = '';
  address: string = '';
  identificationFile: File | null = null;

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    console.log('Register attempt:', {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      address: this.address,
      identificationFile: this.identificationFile
    });
    // Aquí implementarás la lógica de registro
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.identificationFile = file;
      console.log('File selected:', file.name);
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('identificationFile') as HTMLInputElement;
    fileInput?.click();
  }
}