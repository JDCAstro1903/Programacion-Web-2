import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

interface UserProfile {
  id: number;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  user_type: 'admin' | 'client' | 'nanny';
  is_verified: boolean;
  is_active: boolean;
  profile_image: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.css'
})
export class ProfileViewComponent implements OnInit {
  currentUser: any = null;
  profileData: UserProfile | null = null;
  isLoadingProfile = false;
  isSavingProfile = false;
  selectedProfileImageName = '';
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null; // Para preview de la imagen
  imageTimestamp: number = Date.now(); // Timestamp para evitar caché de imagen
  
  // Para cambio de contraseña
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isChangingPassword = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    console.log('🔍 ProfileView - ngOnInit ejecutado');
    
    // Suscribirse al usuario actual del AuthService
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = { ...user, token: this.authService.getToken() };
        console.log('🔍 ProfileView - Usuario actual:', this.currentUser);
      }
    });
    
    if (!this.currentUser || !this.authService.isAuthenticated()) {
      console.warn('⚠️ ProfileView - No hay usuario logueado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadProfileData();
  }

  loadProfileData() {
    this.isLoadingProfile = true;
    console.log('🔍 ProfileView - Cargando datos del perfil...');
    
    this.profileService.checkProfileStatus().subscribe({
      next: (result) => {
        console.log('✅ ProfileView - Datos recibidos:', result);
        
        if (result.success && result.data) {
          const userData = result.data.user_data;
          this.profileData = {
            ...userData,
            user_type: result.data.user_type,
            phone_number: userData.phone_number || '',
            address: userData.address || '',
            profile_image: userData.profile_image || '',
            is_active: true,
            created_at: userData.created_at,
            updated_at: userData.updated_at,
            last_login: userData.last_login
          } as UserProfile;
          
          // Actualizar timestamp para imágenes
          this.imageTimestamp = Date.now();
        }
        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error('❌ ProfileView - Error:', error);
        this.isLoadingProfile = false;
        
        if (error.status === 401) {
          alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else {
          alert('Error al cargar el perfil. Por favor intenta de nuevo.');
        }
      }
    });
  }

  onProfileImageUpload(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Verificar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        alert('⚠️ La imagen es demasiado grande. El tamaño máximo es 5MB');
        event.target.value = '';
        return;
      }

      this.selectedProfileImageName = file.name;
      this.profileImageFile = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      console.log('📷 Imagen seleccionada:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2), 'KB');
    } else {
      alert('Por favor selecciona un archivo de imagen válido');
      event.target.value = '';
    }
  }

  triggerProfileImageInput() {
    const fileInput = document.getElementById('profileImageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  saveProfileChanges() {
    if (!this.profileData) return;

    // VALIDACIONES DEL FRONTEND
    const errors: string[] = [];

    // Validar nombre
    if (!this.profileData.first_name || this.profileData.first_name.trim().length === 0) {
      errors.push('El nombre es requerido');
    } else if (this.profileData.first_name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.profileData.first_name.trim())) {
      errors.push('El nombre solo puede contener letras');
    }

    // Validar apellido
    if (!this.profileData.last_name || this.profileData.last_name.trim().length === 0) {
      errors.push('El apellido es requerido');
    } else if (this.profileData.last_name.trim().length < 2) {
      errors.push('El apellido debe tener al menos 2 caracteres');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.profileData.last_name.trim())) {
      errors.push('El apellido solo puede contener letras');
    }

    // Validar teléfono (opcional)
    if (this.profileData.phone_number && this.profileData.phone_number.trim()) {
      const cleanPhone = this.profileData.phone_number.replace(/[\s\-\(\)]/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
        errors.push('El teléfono debe tener entre 10 y 15 dígitos');
      }
    }

    if (errors.length > 0) {
      alert('⚠️ Errores de validación:\n\n' + errors.join('\n'));
      return;
    }

    this.isSavingProfile = true;

    // Crear FormData para enviar
    const formData = new FormData();
    formData.append('first_name', this.profileData.first_name.trim());
    formData.append('last_name', this.profileData.last_name.trim());
    formData.append('phone_number', this.profileData.phone_number?.trim() || '');
    formData.append('address', this.profileData.address?.trim() || '');

    if (this.profileImageFile) {
      formData.append('profile_image', this.profileImageFile);
    }

    console.log('💾 Guardando cambios del perfil...');

    this.profileService.updateUserProfile(formData).subscribe({
      next: (result) => {
        console.log('✅ Perfil actualizado:', result);
        
        if (result.success) {
          // Actualizar datos locales
          this.profileData = {
            ...this.profileData,
            ...result.data
          } as UserProfile;

          // Actualizar timestamp de imagen
          this.imageTimestamp = Date.now();

          // Limpiar preview y archivo
          this.profileImageFile = null;
          this.profileImagePreview = null;
          this.selectedProfileImageName = '';

          const fileInput = document.getElementById('profileImageUpload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }

          alert('✅ Perfil actualizado exitosamente');
          
          // Recargar datos del perfil
          this.loadProfileData();
        } else {
          alert('❌ ' + (result.message || 'Error al guardar el perfil'));
        }
        this.isSavingProfile = false;
      },
      error: (error) => {
        console.error('❌ Error al guardar:', error);
        this.isSavingProfile = false;

        if (error.status === 400 && error.error.errors) {
          alert('⚠️ Errores de validación:\n\n' + error.error.errors.join('\n'));
        } else if (error.status === 401) {
          alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else {
          alert('❌ Error al guardar el perfil. Por favor intenta de nuevo.');
        }
      }
    });
  }

  changePassword() {
    // VALIDACIONES DEL FRONTEND
    const errors: string[] = [];

    if (!this.currentPassword) {
      errors.push('La contraseña actual es requerida');
    }

    if (!this.newPassword) {
      errors.push('La nueva contraseña es requerida');
    } else {
      if (this.newPassword.length < 6) {
        errors.push('La nueva contraseña debe tener al menos 6 caracteres');
      }
      if (!/[a-zA-Z]/.test(this.newPassword)) {
        errors.push('La contraseña debe contener al menos una letra');
      }
      if (!/[0-9]/.test(this.newPassword)) {
        errors.push('La contraseña debe contener al menos un número');
      }
    }

    if (!this.confirmPassword) {
      errors.push('Debes confirmar la nueva contraseña');
    }

    if (this.newPassword && this.confirmPassword && this.newPassword !== this.confirmPassword) {
      errors.push('Las contraseñas nuevas no coinciden');
    }

    if (this.currentPassword && this.newPassword && this.currentPassword === this.newPassword) {
      errors.push('La nueva contraseña debe ser diferente a la actual');
    }

    if (errors.length > 0) {
      alert('⚠️ Errores de validación:\n\n' + errors.join('\n'));
      return;
    }

    this.isChangingPassword = true;

    this.profileService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (result) => {
        console.log('✅ Contraseña cambiada:', result);
        this.isChangingPassword = false;

        if (result.success) {
          alert('✅ Contraseña cambiada exitosamente');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        } else {
          alert('❌ ' + (result.message || 'Error al cambiar contraseña'));
        }
      },
      error: (error) => {
        console.error('❌ Error:', error);
        this.isChangingPassword = false;

        if (error.status === 400 && error.error.errors) {
          alert('⚠️ Errores de validación:\n\n' + error.error.errors.join('\n'));
        } else if (error.status === 401) {
          alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else {
          alert('❌ ' + (error.error.message || 'Error al cambiar la contraseña'));
        }
      }
    });
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  cancelChanges() {
    if (confirm('¿Estás seguro de que deseas cancelar los cambios?')) {
      this.profileImageFile = null;
      this.profileImagePreview = null;
      this.selectedProfileImageName = '';
      this.loadProfileData();
    }
  }

  goBack() {
    this.router.navigate([this.getDashboardRoute()]);
  }

  getDashboardRoute(): string {
    if (!this.profileData) return '/';
    
    switch (this.profileData.user_type) {
      case 'admin':
        return '/dashboard/admin';
      case 'client':
        return '/dashboard/client';
      case 'nanny':
        return '/dashboard/nanny';
      default:
        return '/';
    }
  }

  getProfileImageUrl(): string {
    // Si hay un preview (imagen nueva seleccionada), mostrar ese
    if (this.profileImagePreview) {
      return this.profileImagePreview;
    }
    
    // Si no hay imagen de perfil, usar logo por defecto
    if (!this.profileData?.profile_image) {
      return 'assets/logo.png';
    }
    
    // Si la imagen ya es una URL completa
    if (this.profileData.profile_image.startsWith('http')) {
      // Agregar timestamp para evitar caché
      return `${this.profileData.profile_image}?t=${this.imageTimestamp}`;
    }
    
    // Si la imagen es data:image (base64), usarla directamente
    if (this.profileData.profile_image.startsWith('data:image')) {
      return this.profileData.profile_image;
    }
    
    // Si la imagen empieza con /uploads/
    if (this.profileData.profile_image.startsWith('/uploads/')) {
      // Agregar timestamp para evitar caché
      return `http://localhost:8000${this.profileData.profile_image}?t=${this.imageTimestamp}`;
    }
    
    // Caso por defecto: agregar el prefijo completo con timestamp
    return `http://localhost:8000/uploads/${this.profileData.profile_image}?t=${this.imageTimestamp}`;
  }

  getUserTypeLabel(): string {
    if (!this.profileData) return '';
    
    switch (this.profileData.user_type) {
      case 'admin':
        return 'Administrador';
      case 'client':
        return 'Cliente';
      case 'nanny':
        return 'Niñera';
      default:
        return '';
    }
  }

  getVerificationStatusText(): string {
    if (!this.profileData) return 'Desconocido';
    return this.profileData.is_verified ? 'Verificado' : 'No verificado';
  }

  getActiveStatusText(): string {
    if (!this.profileData) return 'Desconocido';
    return this.profileData.is_active ? 'Activo' : 'Inactivo';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
