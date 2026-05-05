const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class APIService {
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      throw new Error(error.detail || error.message || 'Error en la solicitud');
    }

    return response.json();
  }

  // ==================== AUTH ====================
  async login(email: string, password: string) {
    const data = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    password_confirm: string;
    full_name: string;
    specialty?: string;
    institution?: string;
  }) {
    const data = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: userData,
    });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  }

  async getProfile() {
    return this.request<any>('/api/auth/me');
  }

  async updateProfile(profileData: {
    full_name?: string;
    specialty?: string;
    institution?: string;
  }) {
    return this.request<any>('/api/auth/me', {
      method: 'PUT',
      body: profileData,
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<any>('/api/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // ==================== ACTIVIDADES ====================
  async getActividades() {
    return this.request<any[]>('/api/actividades/');
  }

  async getActividad(id: string) {
    return this.request<any>(`/api/actividades/${id}`);
  }

  async createActividad(actividad: {
    type: string;
    institution: string;
    date: string;
    amount: number;
    hours?: number;
    hourly_rate?: number;
    notes?: string;
  }) {
    return this.request<any>('/api/actividades/', {
      method: 'POST',
      body: actividad,
    });
  }

  async updateActividad(id: string, actividad: any) {
    return this.request<any>(`/api/actividades/${id}`, {
      method: 'PUT',
      body: actividad,
    });
  }

  async deleteActividad(id: string) {
    return this.request<any>(`/api/actividades/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats() {
    return this.request<any>('/api/actividades/stats');
  }
}

export const api = new APIService();