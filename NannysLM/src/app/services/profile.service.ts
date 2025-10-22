import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProfileStatusResponse {
  success: boolean;
  data: {
    user_type: 'admin' | 'client' | 'nanny';
    profile_completed: boolean;
    user_data: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      phone_number?: string;
      address?: string;
      is_verified: boolean;
      profile_image?: string;
    };
    specific_profile?: any;
  };
}

export interface ClientProfileData {
  emergency_contact_name: string;
  emergency_contact_phone: string;
  number_of_children?: number;
  special_requirements?: string;
  identification_document?: string;
}

export interface NannyProfileData {
  description: string;
  experience_years: number;
  hourly_rate: number;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    client_id?: number;
    nanny_id?: number;
    user_id: number;
    profile_completed: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  /**
   * Verificar estado del perfil del usuario
   */
  checkProfileStatus(): Observable<ProfileStatusResponse> {
    return this.http.get<ProfileStatusResponse>(`${this.apiUrl}/status`);
  }

  /**
   * Completar perfil de cliente
   */
  completeClientProfile(profileData: ClientProfileData): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.apiUrl}/complete-client`, profileData);
  }

  /**
   * Completar perfil de niñera
   */
  completeNannyProfile(profileData: NannyProfileData): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.apiUrl}/complete-nanny`, profileData);
  }
}