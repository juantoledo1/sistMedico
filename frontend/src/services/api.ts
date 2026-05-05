import axios, { AxiosInstance, AxiosError } from 'axios';

// ==================== CONFIGURACIÓN ====================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ==================== TIMEOUTS ====================
const TIMEOUT = 30000; // 30 segundos

// ==================== INSTANCIA AXIOS ====================
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== INTERCEPTOR DE REQUEST ====================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== INTERCEPTOR DE RESPUESTA ====================
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - hacer logout
      localStorage.removeItem('medflow_token');
      localStorage.removeItem('medflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== TIPOS ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  specialty?: string;
  institution?: string;
}

export interface Actividad {
  id: string;
  userId: string;
  type: 'guardia' | 'procedimiento' | 'interconsulta';
  institution: string;
  date: string;
  amount: number;
  status: 'pendiente' | 'pagado';
  notes?: string;
  
  // Guardia
  hours?: number;
  hourly_rate?: number;
  start_time?: string;
  end_time?: string;
  
  // Procedimiento
  procedure_name?: string;
  quantity?: number;
  unit_value?: number;
  
  // Interconsulta
  specialty_interconsulta?: string;
  patient_location?: 'intraservicio' | 'extraservicio';
  complexity?: boolean;
  patient_initials?: string;
  
  created_at: string;
}

export interface ActividadStats {
  total_ingresos: number;
  total_guardias: number;
  total_procedimientos: number;
  total_interconsultas: number;
  Cobrado: number;
  Pendiente: number;
  mes_actual: string;
  anio_actual: number;
}

// ==================== AUTH API ====================
export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    password_confirm: string;
    full_name: string;
    specialty?: string;
    institution?: string;
  }): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/register', data);
    return response.data;
  },
  
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', { email, password });
    return response.data;
  },
  
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('medflow_token');
    localStorage.removeItem('medflow_user');
  },
};

// ==================== ACTIVIDADES API ====================
export const actividadesAPI = {
  list: async (filters?: {
    tipo?: string;
    status?: string;
    year?: number;
    month?: number;
  }): Promise<Actividad[]> => {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.status) params.append('status_filter', filters.status);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());
    
    const response = await api.get<Actividad[]>(`/actividades?${params.toString()}`);
    return response.data;
  },
  
  create: async (actividad: Partial<Actividad>): Promise<Actividad> => {
    const response = await api.post<Actividad>('/actividades/', actividad);
    return response.data;
  },
  
  update: async (id: string, actividad: Partial<Actividad>): Promise<Actividad> => {
    const response = await api.put<Actividad>(`/actividades/${id}`, actividad);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/actividades/${id}`);
  },
  
  getStats: async (): Promise<ActividadStats> => {
    const response = await api.get<ActividadStats>('/actividades/stats');
    return response.data;
  },
};

// ==================== HELPER: GUARDAR TOKEN ====================
export const saveToken = (token: string, user: UserProfile) => {
  localStorage.setItem('medflow_token', token);
  localStorage.setItem('medflow_user', JSON.stringify(user));
};

export const getStoredUser = (): UserProfile | null => {
  const userStr = localStorage.getItem('medflow_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = (): string | null => {
  return localStorage.getItem('medflow_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export default api;