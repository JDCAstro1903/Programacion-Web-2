import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-modal.component.html',
  styleUrl: './logout-modal.component.css'
})
export class LogoutModalComponent {
  @Input() isVisible: boolean = false;
  @Input() userName: string = '';
  @Input() userRole: string = '';
  @Input() redirectRoute: string = '/user-selection'; // Ruta por defecto
  
  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  constructor(private router: Router) {}

  cancel() {
    this.onCancel.emit();
  }

  confirm() {
    this.onConfirm.emit();
    // Navegar a la ruta especificada después de confirmar
    this.router.navigate([this.redirectRoute]);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}