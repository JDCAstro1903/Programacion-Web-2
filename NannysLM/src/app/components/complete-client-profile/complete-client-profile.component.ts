import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-complete-client-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-client-profile.component.html',
  styleUrl: './complete-client-profile.component.css'
})
export class CompleteClientProfileComponent implements OnInit {
  profileForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  user: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.formBuilder.group({
      emergency_contact_name: ['', [Validators.required, Validators.minLength(2)]],
      emergency_contact_phone: ['', [Validators.required, Validators.pattern(/^(\+52\s?)?(\d{2}\s?)?\d{8}$/)]],
      number_of_children: [1, [Validators.min(0), Validators.max(10)]],
      special_requirements: ['']
    });
  }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    
    // Verificar que el usuario sea cliente
    if (!this.user || this.user.user_type !== 'client') {
      this.router.navigate(['/login']);
      return;
    }

    // Verificar si ya completó el perfil
    this.checkProfileStatus();
  }

  private checkProfileStatus() {
    this.profileService.checkProfileStatus().subscribe({
      next: (response) => {
        if (response.success && response.data.profile_completed) {
          // Ya completó el perfil, redirigir al dashboard
          this.router.navigate(['/client/dashboard']);
        }
      },
      error: (error) => {
        console.error('Error al verificar perfil:', error);
      }
    });
  }

  onSubmit() {
    if (this.profileForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      this.profileService.completeClientProfile(this.profileForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            // Perfil completado exitosamente
            this.router.navigate(['/client/dashboard']);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al completar el perfil';
          this.isSubmitting = false;
        }
      });
    }
  }

  // Helpers para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `Este campo es requerido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['pattern']) return `Formato de teléfono inválido`;
      if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
      if (field.errors['max']) return `El valor máximo es ${field.errors['max'].max}`;
    }
    return '';
  }
}