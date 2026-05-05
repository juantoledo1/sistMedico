
import { Transaction, ShiftType, PaymentStatus, Actividad, ActivityType } from '../types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    institution: 'Hospital Italiano',
    type: ShiftType.ACTIVE,
    date: '2026-04-28',
    amount: 115000,
    status: PaymentStatus.PAID,
    duration: 24,
    location: 'Gascón 450, CABA'
  },
  {
    id: '2',
    institution: 'Clínica Bazterrica',
    type: ShiftType.CONSULTATION,
    date: '2026-04-25',
    amount: 52500,
    status: PaymentStatus.PENDING,
    duration: 6,
    location: 'Juncal 3002, CABA'
  },
  {
    id: '3',
    institution: 'Sanatorio Güemes',
    type: ShiftType.ACTIVE,
    date: '2026-04-20',
    amount: 85000,
    status: PaymentStatus.PAID,
    duration: 12,
    location: 'Francisco Acuña de Figueroa 1240, CABA'
  },
  {
    id: '4',
    institution: 'Hospital Italiano',
    type: ShiftType.ACTIVE,
    date: '2026-03-28',
    amount: 92000,
    status: PaymentStatus.PAID,
    duration: 24
  },
  {
    id: '5',
    institution: 'Swiss Medical',
    type: ShiftType.HOME_VISIT,
    date: '2026-03-25',
    amount: 28500,
    status: PaymentStatus.PAID,
    duration: 2
  },
  {
    id: '6',
    institution: 'H. Británico',
    type: ShiftType.ACTIVE,
    date: '2026-02-15',
    amount: 75000,
    status: PaymentStatus.PAID,
    duration: 12
  }
];

export const MOCK_ACTIVIDADES: Actividad[] = [
  {
    id: 'a1',
    type: ActivityType.GUARDIA,
    institution: 'Hospital Italiano',
    date: '2026-04-28',
    hours: 24,
    hourlyRate: 4800,
    amount: 115000,
    status: PaymentStatus.PAID,
    createdAt: '2026-04-28T10:00:00Z',
    synced: true,
    startTime: '08:00',
    endTime: '08:00',
    endDate: '2026-04-29'
  },
  {
    id: 'a2',
    type: ActivityType.GUARDIA,
    institution: 'Sanatorio Güemes',
    date: '2026-04-20',
    hours: 12,
    hourlyRate: 7100,
    amount: 85000,
    status: PaymentStatus.PAID,
    createdAt: '2026-04-20T08:00:00Z',
    synced: true,
    startTime: '20:00',
    endTime: '08:00',
    endDate: '2026-04-21'
  },
  {
    id: 'a3',
    type: ActivityType.PROCEDIMIENTO,
    institution: 'Hospital Italiano',
    date: '2026-04-28',
    procedureName: 'Vía Central',
    quantity: 2,
    unitValue: 25000,
    amount: 50000,
    status: PaymentStatus.PAID,
    createdAt: '2026-04-28T14:00:00Z',
    synced: true,
    patientInitials: 'MR'
  },
  {
    id: 'a4',
    type: ActivityType.PROCEDIMIENTO,
    institution: 'Sanatorio Güemes',
    date: '2026-04-20',
    procedureName: 'Intubación Orotraqueal',
    quantity: 1,
    unitValue: 35000,
    amount: 35000,
    status: PaymentStatus.PAID,
    createdAt: '2026-04-20T23:00:00Z',
    synced: true,
    patientInitials: 'PL'
  },
  {
    id: 'a5',
    type: ActivityType.PROCEDIMIENTO,
    institution: 'H. Británico',
    date: '2026-02-15',
    procedureName: 'Punción Lumbar',
    quantity: 1,
    unitValue: 28000,
    amount: 28000,
    status: PaymentStatus.PAID,
    createdAt: '2026-02-15T16:00:00Z',
    synced: true
  },
  {
    id: 'a6',
    type: ActivityType.INTERCONSULTA,
    institution: 'Hospital Italiano',
    date: '2026-04-28',
    specialty: 'Cardiología',
    patientLocation: 'intraservicio',
    complexity: false,
    amount: 15000,
    status: PaymentStatus.PAID,
    createdAt: '2026-04-28T18:00:00Z',
    synced: true,
    notes: 'Paciente en UTI con IAM anterior',
    patientInitials: 'GS'
  },
  {
    id: 'a7',
    type: ActivityType.INTERCONSULTA,
    institution: 'Clínica Bazterrica',
    date: '2026-04-25',
    specialty: 'Neurología',
    patientLocation: 'extraservicio',
    complexity: true,
    amount: 30000,
    status: PaymentStatus.PENDING,
    createdAt: '2026-04-25T12:00:00Z',
    synced: true,
    notes: 'Paciente de planta solicitado por servicio de clínica médica - alta complejidad',
    patientInitials: 'AB'
  },
  {
    id: 'a8',
    type: ActivityType.INTERCONSULTA,
    institution: 'Sanatorio Güemes',
    date: '2026-04-20',
    specialty: 'UTI',
    patientLocation: 'intraservicio',
    complexity: true,
    amount: 22500,
    status: PaymentStatus.PAID,
    createdAt: '2026-04-20T22:00:00Z',
    synced: true,
    notes: 'Interconsulta en terapia intensiva sepsis',
    patientInitials: 'CR'
  },
  {
    id: 'a9',
    type: ActivityType.GUARDIA,
    institution: 'Clínica Bazterrica',
    date: '2026-04-25',
    hours: 6,
    hourlyRate: 8750,
    amount: 52500,
    status: PaymentStatus.PENDING,
    createdAt: '2026-04-25T08:00:00Z',
    synced: true,
    startTime: '14:00',
    endTime: '20:00',
    endDate: '2026-04-25'
  },
  {
    id: 'a10',
    type: ActivityType.INTERCONSULTA,
    institution: 'Hospital Italiano',
    date: '2026-03-28',
    specialty: 'Cirugía Vascular',
    patientLocation: 'extraservicio',
    complexity: false,
    amount: 18000,
    status: PaymentStatus.PAID,
    createdAt: '2026-03-28T10:00:00Z',
    synced: true,
    notes: 'Evaluación prequirúrgica paciente de sala común',
    patientInitials: 'LM'
  }
];
