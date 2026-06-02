
export enum ShiftType {
  ACTIVE = 'Activa',
  PASSIVE = 'Pasiva',
  CONSULTATION = 'Consultorio',
  HOME_VISIT = 'Visita Domicilio'
}

export enum ActivityType {
  GUARDIA = 'guardia',
  PROCEDIMIENTO = 'procedimiento',
  INTERCONSULTA = 'interconsulta'
}

export enum PaymentStatus {
  PAID = 'pagado',
  PENDING = 'pendiente'
}

// ==================== API TYPES (Backend Integration) ====================

export interface UserProfile {
  name: string;
  specialty: string;
  institution: string;
  avatar: 'masculino' | 'femenino' | 'neutral';
}

// API User Profile (from backend)
export interface APIUserProfile {
  id: string;
  email: string;
  full_name: string;
  specialty?: string;
  institution?: string;
  created_at?: string;
}

// API Token Response
export interface APITokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserSettings {
  language: 'es' | 'en';
  darkMode: boolean;
  currency: string;
}

export interface BaseActividad {
  id: string;
  type: ActivityType;
  institution: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  synced?: boolean;
}

export interface ActividadGuardia extends BaseActividad {
  type: ActivityType.GUARDIA;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  hourlyRate: number;
}

export interface ActividadProcedimiento extends BaseActividad {
  type: ActivityType.PROCEDIMIENTO;
  procedureName: string;
  quantity: number;
  unitValue: number;
  patientInitials?: string;
}

export interface ActividadInterconsulta extends BaseActividad {
  type: ActivityType.INTERCONSULTA;
  specialty: string;
  patientLocation: 'intraservicio' | 'extraservicio';
  complexity: boolean;
  patientInitials?: string;
}

export type Actividad = ActividadGuardia | ActividadProcedimiento | ActividadInterconsulta;

export interface Transaction {
  id: string;
  institution: string;
  type: ShiftType;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  amount: number;
  status: PaymentStatus;
  notes?: string;
  duration?: number;
  location?: string;
  procedureName?: string;
  quantity?: number;
  unitValue?: number;
  specialty?: string;
}

export interface Institution {
  id: string;
  name: string;
  guardia_rate?: number | null;
  procedimiento_rate?: number | null;
  interconsulta_rate?: number | null;
  is_active: boolean;
}

export interface FinancialStats {
  totalMonthly: number;
  trendPercentage: number;
  projection: number;
  recentActivity: Transaction[];
}

export interface DashboardSummary {
  totalGuardias: number;
  totalProcedimientos: number;
  totalInterconsultas: number;
  grandTotal: number;
}

// Backend Stats API Response
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

// Added StitchType and StitchBlock to fix import errors in creative components
export enum StitchType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO'
}

export interface StitchBlock {
  id: string;
  name: string;
  type: StitchType;
  prompt: string;
  isGenerating: boolean;
  output: string;
  error?: string;
}
