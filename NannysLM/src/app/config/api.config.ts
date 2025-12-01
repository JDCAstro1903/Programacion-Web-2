import { environment } from '../../environments/environment';

/**
 * Configuración centralizada de URLs de API
 */
export class ApiConfig {
  // URL base de la API (sin /api/v1)
  static readonly BASE_URL = environment.apiUrl.replace('/api/v1', '');
  
  // URL completa de la API
  static readonly API_URL = environment.apiUrl;
  
  // URLs específicas
  static readonly AUTH_URL = `${ApiConfig.API_URL}/auth`;
  static readonly BANK_DETAILS_URL = `${ApiConfig.API_URL}/bank-details`;
  static readonly CLIENT_URL = `${ApiConfig.API_URL}/client`;
  static readonly UPLOADS_URL = `${ApiConfig.BASE_URL}/uploads`;
  
  /**
   * Construye URL completa para archivos subidos
   */
  static getUploadUrl(path: string): string {
    if (!path) return '';
    
    // Si ya tiene el dominio completo, retornar tal cual
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Si comienza con /uploads, agregar solo el BASE_URL
    if (path.startsWith('/uploads')) {
      return `${ApiConfig.BASE_URL}${path}`;
    }
    
    // Si no tiene /uploads, agregarlo
    return `${ApiConfig.UPLOADS_URL}/${path}`;
  }
  
  /**
   * Construye URL para recibos
   */
  static getReceiptUrl(path: string): string {
    if (!path) return '';
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    if (path.startsWith('/uploads')) {
      return `${ApiConfig.BASE_URL}${path}`;
    }
    
    return `${ApiConfig.UPLOADS_URL}/receipts/${path}`;
  }
}
