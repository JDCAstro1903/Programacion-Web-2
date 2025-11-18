import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="whatsapp-btn" 
      [class.disabled]="!phoneNumber || isLoading"
      (click)="openWhatsApp()"
      [disabled]="!phoneNumber || isLoading"
      [title]="buttonTitle">
      <span *ngIf="isLoading" class="spinner"></span>
      <svg *ngIf="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.947 1.347l-.355.187-.368-.06c-1.286-.263-2.514-.795-3.56-1.584l-.036-.032-.037.032c-.535.45-.862 1.075-.916 1.744-.054.67.137 1.332.54 1.87.405.54.96.912 1.593 1.065l.316.063-.016.317c-.015.316-.015.635 0 .954 0 .316-.003.632-.015.947l-.015.314.314.016c1.256.063 2.443.524 3.35 1.291.906.767 1.505 1.789 1.746 2.948l.063.316.317-.063c.633-.154 1.188-.525 1.593-1.065.403-.538.594-1.2.54-1.87-.054-.67-.38-1.294-.916-1.744l-.037-.032-.036.032a9.866 9.866 0 01-4.947-1.347m5.421 7.403c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
      </svg>
      <span>{{ buttonText }}</span>
    </button>
  `,
  styles: [`
    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      background: linear-gradient(135deg, #25d366 0%, #1fb55c 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
    }

    .whatsapp-btn:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4);
      background: linear-gradient(135deg, #1fb55c 0%, #1aa84b 100%);
    }

    .whatsapp-btn:active:not(.disabled) {
      transform: translateY(0);
    }

    .whatsapp-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .whatsapp-btn svg {
      width: 20px;
      height: 20px;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .whatsapp-btn {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .whatsapp-btn span:last-child {
        display: none;
      }
    }
  `]
})
export class WhatsappButtonComponent implements OnInit, OnChanges {
  @Input() userId: number | null = null;
  @Input() phoneNumber: string = '';
  @Input() message: string = 'Hola, me gustaría contactarte.';
  @Input() buttonText: string = 'WhatsApp';

  buttonTitle: string = '';
  isLoading: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    // Si se proporciona userId, obtener el teléfono
    if (this.userId && !this.phoneNumber) {
      this.fetchPhoneNumber();
    } else {
      this.updateButtonTitle();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && !changes['userId'].firstChange && !this.phoneNumber) {
      this.fetchPhoneNumber();
    } else {
      this.updateButtonTitle();
    }
  }

  private fetchPhoneNumber() {
    if (!this.userId) return;

    this.isLoading = true;
    this.userService.getUserPhoneNumber(this.userId).subscribe({
      next: (phone) => {
        this.phoneNumber = phone || '';
        this.updateButtonTitle();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error obteniendo teléfono:', error);
        this.isLoading = false;
        this.updateButtonTitle();
      }
    });
  }

  private updateButtonTitle() {
    if (this.phoneNumber) {
      this.buttonTitle = `Contactar por WhatsApp: ${this.phoneNumber}`;
    } else {
      this.buttonTitle = 'Número de teléfono no disponible';
    }
  }

  openWhatsApp() {
    if (!this.phoneNumber) {
      console.warn('⚠️ Número de teléfono no disponible');
      return;
    }

    // Limpiar el número: remover espacios, guiones, paréntesis
    const cleanPhone = this.phoneNumber.replace(/\D/g, '');
    
    // Asegurar que empiece con código de país
    let finalPhone = cleanPhone;
    if (!cleanPhone.startsWith('34') && !cleanPhone.startsWith('+34')) {
      // Si tiene 9 dígitos, es España
      if (cleanPhone.length === 9) {
        finalPhone = '34' + cleanPhone;
      }
      // Si tiene 10+ dígitos, dejar como está
    }

    // Remover '+' si existe
    finalPhone = finalPhone.replace(/\+/g, '');

    // Codificar el mensaje
    const encodedMessage = encodeURIComponent(this.message);

    // URL de WhatsApp Web
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;

    console.log(`📱 Abriendo WhatsApp para: ${finalPhone}`);
    window.open(whatsappUrl, '_blank');
  }
}
