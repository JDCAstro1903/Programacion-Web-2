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
  identification_document?: string;
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
  
  // Para identificación
  selectedIdentificationName = '';
  identificationFile: File | null = null;
  identificationPreview: string | null = null;
  identificationTimestamp: number = Date.now();
  
  // Para cambio de contraseña
  isPasswordSectionExpanded = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isChangingPassword = false;


  // Para modal de resultados (contraseña)
  showPasswordModal = false;
  passwordModalType: 'loading' | 'success' | 'error' | 'validation' = 'loading';
  passwordModalMessage = '';
  passwordModalTitle = '';
  passwordModalErrors: string[] = [];

  // Para modal de resultados (perfil)
  showProfileModal = false;
  profileModalType: 'loading' | 'success' | 'error' | 'validation' | 'confirm' = 'loading';
  profileModalMessage = '';
  profileModalTitle = '';
  profileModalErrors: string[] = [];
  profileModalCallback: (() => void) | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    
    // Suscribirse al usuario actual del AuthService
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = { ...user, token: this.authService.getToken() };
      }
    });
    
    if (!this.currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadProfileData();
  }

  loadProfileData() {
    this.isLoadingProfile = true;
    
    this.profileService.checkProfileStatus().subscribe({
      next: (result) => {
        
        if (result.success && result.data) {
          const userData = result.data.user_data;
          this.profileData = {
            ...userData,
            user_type: result.data.user_type,
            phone_number: userData.phone_number || '',
            address: userData.address || '',
            profile_image: userData.profile_image || '',
            identification_document: userData.identification_document || '',
            is_active: (userData as any).is_active !== undefined ? (userData as any).is_active : true,
            is_verified: userData.is_verified || false,
            created_at: (userData as any).created_at || undefined,
            updated_at: (userData as any).updated_at || undefined,
            last_login: (userData as any).last_login || undefined
          } as UserProfile;
          
          // Actualizar timestamp para imágenes
          this.imageTimestamp = Date.now();
        }
        this.isLoadingProfile = false;
      },
      error: (error) => {
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
      this.showProfileModalWithErrors('Errores de Validación', errors);
      return;
    }

    this.isSavingProfile = true;

    // Mostrar modal de carga
    this.showProfileModal = true;
    this.profileModalType = 'loading';
    this.profileModalTitle = 'Guardando Cambios';
    this.profileModalMessage = 'Por favor espera...';

    // Crear FormData para enviar
    const formData = new FormData();
    formData.append('first_name', this.profileData.first_name.trim());
    formData.append('last_name', this.profileData.last_name.trim());
    formData.append('phone_number', this.profileData.phone_number?.trim() || '');
    formData.append('address', this.profileData.address?.trim() || '');

    if (this.profileImageFile) {
      formData.append('profile_image', this.profileImageFile);
    }

    this.profileService.updateUserProfile(formData).subscribe({
      next: (result) => {
        
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

          // Mostrar modal de éxito
          this.profileModalType = 'success';
          this.profileModalTitle = '¡Perfil Actualizado!';
          this.profileModalMessage = 'Tus cambios han sido guardados exitosamente.';
          
          // Cerrar modal y recargar después de 2 segundos
          setTimeout(() => {
            this.closeProfileModal();
            this.loadProfileData();
          }, 2000);
        } else {
          // Mostrar modal de error
          this.profileModalType = 'error';
          this.profileModalTitle = 'Error al Guardar';
          this.profileModalMessage = result.message || 'Error al guardar el perfil';
        }
        this.isSavingProfile = false;
      },
      error: (error) => {
        this.isSavingProfile = false;

        if (error.status === 400 && error.error.errors) {
          this.showProfileModalWithErrors('Errores de Validación', error.error.errors);
        } else if (error.status === 401) {
          this.profileModalType = 'error';
          this.profileModalTitle = 'Sesión Expirada';
          this.profileModalMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
          this.showProfileModal = true;
          
          setTimeout(() => {
            this.authService.forceLogout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.profileModalType = 'error';
          this.profileModalTitle = 'Error al Guardar';
          this.profileModalMessage = 'Error al guardar el perfil. Por favor intenta de nuevo.';
          this.showProfileModal = true;
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
      this.showPasswordModalWithErrors('Errores de Validación', errors);
      return;
    }

    this.showPasswordModal = true;
    this.passwordModalType = 'loading';
    this.passwordModalTitle = 'Cambiando Contraseña';
    this.passwordModalMessage = 'Por favor espera...';
    this.isChangingPassword = true;

    this.profileService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (result) => {
        this.isChangingPassword = false;

        if (result.success) {
          this.passwordModalType = 'success';
          this.passwordModalTitle = '¡Contraseña Actualizada!';
          this.passwordModalMessage = 'Tu contraseña ha sido cambiada exitosamente.';
          
          // Limpiar campos después de 2 segundos
          setTimeout(() => {
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.closePasswordModal();
          }, 2000);
        } else {
          this.passwordModalType = 'error';
          this.passwordModalTitle = 'Error';
          this.passwordModalMessage = result.message || 'Error al cambiar contraseña';
        }
      },
      error: (error) => {
        this.isChangingPassword = false;

        if (error.status === 400 && error.error.errors) {
          this.showPasswordModalWithErrors('Errores de Validación', error.error.errors);
        } else if (error.status === 401) {
          this.passwordModalType = 'error';
          this.passwordModalTitle = 'Sesión Expirada';
          this.passwordModalMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
          
          setTimeout(() => {
            this.authService.forceLogout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.passwordModalType = 'error';
          this.passwordModalTitle = 'Error';
          this.passwordModalMessage = error.error.message || 'Error al cambiar la contraseña';
        }
      }
    });
  }

  showPasswordModalWithErrors(title: string, errors: string[]) {
    this.showPasswordModal = true;
    this.passwordModalType = 'validation';
    this.passwordModalTitle = title;
    this.passwordModalErrors = errors;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.passwordModalErrors = [];
  }

  onNewPasswordChange() {
    // Este método se ejecuta cuando el usuario cambia la nueva contraseña
    // para mostrar feedback en tiempo real
  }

  onConfirmPasswordChange() {
    // Este método se ejecuta cuando el usuario cambia la confirmación
    // para mostrar feedback en tiempo real
  }

  showProfileModalWithErrors(title: string, errors: string[]) {
    this.showProfileModal = true;
    this.profileModalType = 'validation';
    this.profileModalTitle = title;
    this.profileModalErrors = errors;
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profileModalErrors = [];
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

  togglePasswordSection() {
    this.isPasswordSectionExpanded = !this.isPasswordSectionExpanded;
  }

  cancelChanges() {
    this.showProfileModal = true;
    this.profileModalType = 'confirm';
    this.profileModalTitle = 'Cancelar Cambios';
    this.profileModalMessage = '¿Estás seguro de que deseas cancelar los cambios sin guardar?';
    this.profileModalCallback = () => {
      this.profileImageFile = null;
      this.profileImagePreview = null;
      this.selectedProfileImageName = '';
      const fileInput = document.getElementById('profileImageUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      this.loadProfileData();
      this.closeProfileModal();
    };
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
      return '/assets/logo.png';
    }
    
    const imageValue = this.profileData.profile_image;
    
    // Si la imagen ya es una URL completa
    if (imageValue.startsWith('http')) {
      const url = `${imageValue}?t=${this.imageTimestamp}`;
      return url;
    }
    
    // Si la imagen es data:image (base64), usarla directamente
    if (imageValue.startsWith('data:image')) {
      return imageValue;
    }
    
    // Si la imagen empieza con /uploads/
    if (imageValue.startsWith('/uploads/')) {
      const url = `http://localhost:8000${imageValue}?t=${this.imageTimestamp}`;
      return url;
    }
    
    // Caso por defecto: agregar el prefijo completo con timestamp
    const url = `http://localhost:8000/uploads/${imageValue}?t=${this.imageTimestamp}`;
    return url;
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

  onIdentificationUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Verificar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (file.size > maxSize) {
        alert('⚠️ El archivo es demasiado grande. El tamaño máximo es 10MB');
        event.target.value = '';
        return;
      }

      this.selectedIdentificationName = file.name;
      this.identificationFile = file;
      
      // Crear preview del documento
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.identificationPreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.identificationPreview = null;
      }
      
    } else {
      alert('Por favor selecciona un archivo válido');
      event.target.value = '';
    }
  }

  triggerIdentificationInput() {
    const fileInput = document.getElementById('identificationUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  getIdentificationUrl(): string {
    // Si hay un preview (documento nuevo seleccionado), mostrar ese
    if (this.identificationPreview) {
      return this.identificationPreview;
    }
    
    // Si no hay identificación, retornar vacío
    if (!this.profileData?.identification_document) {
      return '';
    }
    
    const docValue = this.profileData.identification_document;
    
    // Si el documento ya es una URL completa
    if (docValue.startsWith('http')) {
      const url = `${docValue}?t=${this.identificationTimestamp}`;
      return url;
    }
    
    // Si es base64, usarlo directamente
    if (docValue.startsWith('data:')) {
      return docValue;
    }
    
    // Si empieza con /uploads/
    if (docValue.startsWith('/uploads/')) {
      const url = `http://localhost:8000${docValue}?t=${this.identificationTimestamp}`;
      return url;
    }
    
    // Caso por defecto: agregar el prefijo completo con timestamp
    const url = `http://localhost:8000/uploads/${docValue}?t=${this.identificationTimestamp}`;
    return url;
  }

  isIdentificationImage(): boolean {
    if (!this.profileData?.identification_document) return false;
    const doc = this.profileData.identification_document.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(doc);
  }

  isIdentificationPdf(): boolean {
    if (!this.profileData?.identification_document) return false;
    return this.profileData.identification_document.toLowerCase().endsWith('.pdf');
  }
}

