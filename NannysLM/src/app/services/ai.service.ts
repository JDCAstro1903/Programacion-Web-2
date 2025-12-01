import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface AiTip {
  title: string;
  description: string;
  icon: string;
}

export interface AiTipsResponse {
  success: boolean;
  message: string;
  data: {
    tips: AiTip[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${ApiConfig.API_URL}/ai`;

  constructor(private http: HttpClient) { }

  getNannyTips(): Observable<AiTipsResponse> {
    return this.http.get<AiTipsResponse>(`${this.apiUrl}/nanny-tips`);
  }
}
