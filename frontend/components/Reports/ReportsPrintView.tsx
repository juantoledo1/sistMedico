import { Transaction, PaymentStatus, ShiftType } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface ReportsPrintViewProps {
  periodLabel: string;
  institutionLabel: string;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalGuardias: number;
  totalProcedimientos: number;
  totalInterconsultas: number;
  actividades: Transaction[];
  onClose: () => void;
}

export function ReportsPrintView({
  periodLabel,
  institutionLabel,
  totalInvoiced,
  totalPaid,
  totalPending,
  totalGuardias,
  totalProcedimientos,
  totalInterconsultas,
  actividades,
  onClose,
}: ReportsPrintViewProps) {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-in fade-in duration-300 print:bg-white print:text-black">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Button variant="secondary" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200">
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          <h1 className="text-2xl font-black text-slate-900">MedFlow Pro</h1>
          <h2 className="text-lg font-bold text-slate-600">Reporte de Actividad Profesional</h2>
          <p className="text-sm text-slate-500 mt-1">
            {periodLabel} {institutionLabel ? `\u2022 ${institutionLabel}` : ''}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Generado: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
            <p className="text-xl font-black text-slate-900">{formatCurrency(totalInvoiced)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-xs font-bold text-green-600 uppercase">Cobrado</p>
            <p className="text-xl font-black text-green-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <p className="text-xs font-bold text-orange-600 uppercase">Pendiente</p>
            <p className="text-xl font-black text-orange-700">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-slate-700 mb-3">Resumen por Tipo</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex justify-between bg-blue-50 p-3 rounded-lg">
              <span className="font-medium">Guardias:</span>
              <span className="font-bold">{formatCurrency(totalGuardias)}</span>
            </div>
            <div className="flex justify-between bg-purple-50 p-3 rounded-lg">
              <span className="font-medium">Procedimientos:</span>
              <span className="font-bold">{formatCurrency(totalProcedimientos)}</span>
            </div>
            <div className="flex justify-between bg-green-50 p-3 rounded-lg">
              <span className="font-medium">Interconsultas:</span>
              <span className="font-bold">{formatCurrency(totalInterconsultas)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-700 mb-3">Detalle de Actividades</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-2 font-bold">Fecha</th>
                <th className="text-left p-2 font-bold">Tipo</th>
                <th className="text-left p-2 font-bold">Institución</th>
                <th className="text-left p-2 font-bold">Detalle</th>
                <th className="text-right p-2 font-bold">Monto</th>
                <th className="text-right p-2 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {actividades.sort((a, b) => b.date.localeCompare(a.date)).map((a, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-2">{a.date}</td>
                  <td className="p-2">
                    {a.type === ShiftType.ACTIVE && 'Guardia'}
                    {a.type === ShiftType.CONSULTATION && 'Proc.'}
                    {a.type === ShiftType.PASSIVE && 'Inter.'}
                  </td>
                  <td className="p-2">{a.institution}</td>
                  <td className="p-2 text-xs">
                    {a.type === ShiftType.CONSULTATION && a.procedureName}
                    {a.type === ShiftType.PASSIVE && `${a.specialty}${a.patientLocation === 'extraservicio' ? ' (Extra)' : ''}`}
                    {a.type === ShiftType.ACTIVE && `${a.hours}h`}
                    {a.notes && <span className="block text-slate-400 italic">{'\uD83D\uDCDD'} {a.notes}</span>}
                  </td>
                  <td className="p-2 text-right font-medium">{formatCurrency(a.amount)}</td>
                  <td className="p-2 text-right">
                    {a.status === PaymentStatus.PAID ? '\u2713' : '\u23F3'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
