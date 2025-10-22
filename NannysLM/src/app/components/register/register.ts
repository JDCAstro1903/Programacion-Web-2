import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, RegisterData } from '../../services/auth.service';

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
  userType: 'client' | 'nanny' | 'admin' = 'client'; // Por defecto cliente

  // Estados del formulario
  isLoading: boolean = false;
  errors: any = {};
  showSuccessModal: boolean = false;
  
  // Estados para mostrar/ocultar contraseñas
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    console.log('🚀 Iniciando proceso de registro...');
    
    // Limpiar errores previos
    this.errors = {};

    // Validaciones básicas
    if (!this.validateForm()) {
      console.log('❌ Validación de formulario falló');
      this.scrollToFirstError();
      return;
    }

    console.log('✅ Validación de formulario exitosa');
    this.isLoading = true;

    // Preparar datos para enviar
    const registerData: RegisterData = {
      first_name: this.firstName.trim(),
      last_name: this.lastName.trim(),
      email: this.email.toLowerCase().trim(),
      password: this.password,
      phone_number: this.phoneNumber.trim(),
      address: this.address.trim(),
      user_type: this.userType
    };

    console.log('📋 Datos de registro preparados:', {
      first_name: registerData.first_name,
      last_name: registerData.last_name,
      email: registerData.email,
      phone_number: registerData.phone_number,
      address: registerData.address,
      user_type: registerData.user_type,
      password: '***hidden***'
    });

    // Registrar usuario
    console.log('📤 Enviando solicitud de registro al servidor...');
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa del servidor:', response);
        this.isLoading = false;
        if (response.success) {
          // Mostrar modal de éxito
          this.showSuccessModal = true;
        } else {
          console.log('⚠️ Respuesta del servidor indica fallo:', response);
          this.errors.general = response.message || 'Error en el registro';
        }
      },
      error: (error) => {
        console.log('❌ Error completo:', error);
        console.log('❌ Status:', error.status);
        console.log('❌ Error object:', error.error);
        
        this.isLoading = false;
        
        if (error.error && error.error.errors) {
          // Errores de validación del backend
          console.log('📝 Procesando errores de validación:', error.error.errors);
          this.errors = this.processValidationErrors(error.error.errors);
          this.scrollToFirstError();
        } else if (error.error && error.error.message) {
          // Error general del backend
          console.log('📝 Error general del backend:', error.error.message);
          this.errors.general = error.error.message;
        } else {
          // Error de red u otro
          console.log('📝 Error de conexión o desconocido');
          this.errors.general = 'Error de conexión. Intenta nuevamente.';
        }
      }
    });
  }

  validateForm(): boolean {
    let isValid = true;

    // Validar nombres
    if (!this.firstName.trim()) {
      this.errors.firstName = 'El nombre es requerido';
      isValid = false;
    }

    if (!this.lastName.trim()) {
      this.errors.lastName = 'El apellido es requerido';
      isValid = false;
    }

    // Validar email
    if (!this.email.trim()) {
      this.errors.email = 'El email es requerido';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.errors.email = 'El email no es válido';
      isValid = false;
    }

    // Validar contraseñas
    if (!this.password) {
      this.errors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (this.password.length < 6) {
      this.errors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    } else if (!this.isStrongPassword(this.password)) {
      this.errors.password = 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
      isValid = false;
    }

    if (this.password !== this.confirmPassword) {
      this.errors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    // Validar teléfono (opcional pero si se proporciona debe ser válido)
    if (this.phoneNumber && !this.isValidPhone(this.phoneNumber)) {
      this.errors.phoneNumber = 'El formato del teléfono no es válido';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isStrongPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers;
  }

  isValidPhone(phone: string): boolean {
    // Regex flexible para números de teléfono mexicanos
    const phoneRegex = /^(\+52\s?)?(\d{2}\s?)?\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  processValidationErrors(errors: any[]): any {
    const processedErrors: any = {};
    errors.forEach(error => {
      processedErrors[error.field] = error.message;
    });
    return processedErrors;
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

  // Método para verificar disponibilidad de email en tiempo real
  checkEmailAvailability() {
    if (this.email && this.isValidEmail(this.email)) {
      this.authService.checkEmailAvailability(this.email).subscribe({
        next: (response) => {
          console.log('✅ Respuesta verificación email:', response);
          if (response.success && !response.data.available) {
            this.errors.email = 'Este email ya está registrado';
            this.scrollToError('email');
          } else if (this.errors.email === 'Este email ya está registrado') {
            delete this.errors.email;
          }
        },
        error: (error) => {
          console.error('❌ Error checking email:', error);
          // No mostrar error al usuario por este proceso
        }
      });
    }
  }

  // Validación de teléfono en tiempo real
  validatePhoneNumber() {
    if (this.phoneNumber && !this.isValidPhone(this.phoneNumber)) {
      this.errors.phoneNumber = 'El formato del teléfono no es válido';
      this.scrollToError('phoneNumber');
    } else if (this.errors.phoneNumber) {
      delete this.errors.phoneNumber;
    }
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

  // Alternar visibilidad de contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Alternar visibilidad de confirmar contraseña
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Método para hacer scroll al primer error
  private scrollToFirstError() {
    // Esperar un tick para que Angular actualice el DOM
    setTimeout(() => {
      const errorFields = ['general', 'firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phoneNumber', 'address'];
      
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

  // Métodos para el modal de éxito
  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  redirectToLogin() {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }
}