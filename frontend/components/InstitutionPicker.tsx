import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit3, Trash2, X } from 'lucide-react';
import { Institution } from '../types';
import { api } from '../services/api';
import { Label } from './ui/Label';
import { Button } from './ui/Button';

interface InstitutionPickerProps {
  institutions: Institution[];
  selected: string;
  onSelect: (name: string) => void;
  onInstitutionChange: (inst: Institution) => void;
  onInstitutionDelete: (id: string) => void;
}

export function InstitutionPicker({
  institutions, selected, onSelect,
  onInstitutionChange, onInstitutionDelete,
}: InstitutionPickerProps) {
  const [instSearch, setInstSearch] = useState('');
  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const instRef = useRef<HTMLDivElement>(null);

  const [instEditMode, setInstEditMode] = useState(false);
  const [instEditName, setInstEditName] = useState('');
  const [instEditGuardiaRate, setInstEditGuardiaRate] = useState('');
  const [instEditProcedimientoRate, setInstEditProcedimientoRate] = useState('');
  const [instEditInterconsultaRate, setInstEditInterconsultaRate] = useState('');
  const [instEditId, setInstEditId] = useState<string | null>(null);
  const [instEditSaving, setInstEditSaving] = useState(false);

  const [confirmDeleteInst, setConfirmDeleteInst] = useState<string | null>(null);

  const filteredInstitutions = institutions.filter(i =>
    i.is_active && i.name.toLowerCase().includes(instSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (instRef.current && !instRef.current.contains(e.target as Node)) {
        setInstDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNewInst = () => {
    setInstEditMode(true);
    setInstEditName('');
    setInstEditGuardiaRate('');
    setInstEditProcedimientoRate('');
    setInstEditInterconsultaRate('');
    setInstEditId(null);
    setInstDropdownOpen(false);
  };

  const handleEditInst = (inst: Institution) => {
    setInstEditMode(true);
    setInstEditName(inst.name);
    setInstEditGuardiaRate(inst.guardia_rate?.toString() || '');
    setInstEditProcedimientoRate(inst.procedimiento_rate?.toString() || '');
    setInstEditInterconsultaRate(inst.interconsulta_rate?.toString() || '');
    setInstEditId(inst.id);
  };

  const handleSaveInst = async () => {
    if (!instEditName.trim()) return;
    setInstEditSaving(true);
    try {
      if (instEditId) {
        const updated = await api.updateInstitution(instEditId, {
          name: instEditName.trim(),
          guardia_rate: instEditGuardiaRate ? parseInt(instEditGuardiaRate.replace(/\D/g, '')) : null,
          procedimiento_rate: instEditProcedimientoRate ? parseInt(instEditProcedimientoRate.replace(/\D/g, '')) : null,
          interconsulta_rate: instEditInterconsultaRate ? parseInt(instEditInterconsultaRate.replace(/\D/g, '')) : null,
        });
        onInstitutionChange(updated);
      } else {
        const created = await api.createInstitution({
          name: instEditName.trim(),
          guardia_rate: instEditGuardiaRate ? parseInt(instEditGuardiaRate.replace(/\D/g, '')) : null,
          procedimiento_rate: instEditProcedimientoRate ? parseInt(instEditProcedimientoRate.replace(/\D/g, '')) : null,
          interconsulta_rate: instEditInterconsultaRate ? parseInt(instEditInterconsultaRate.replace(/\D/g, '')) : null,
        });
        onInstitutionChange(created);
        onSelect(created.name);
      }
      setInstEditMode(false);
    } catch (e) {
      console.error('Error saving institution', e);
    } finally {
      setInstEditSaving(false);
    }
  };

  const handleDeleteInst = async (id: string, name: string) => {
    try {
      await api.updateInstitution(id, { is_active: false });
      onInstitutionDelete(id);
      if (selected === name) {
        onSelect('');
      }
      setConfirmDeleteInst(null);
    } catch (e) {
      console.error('Error deleting institution', e);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Institución</Label>
      {instEditMode ? (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <input type="text" value={instEditName} onChange={e => setInstEditName(e.target.value)}
            placeholder="Nombre de la institución"
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 font-bold text-sm text-slate-900 dark:text-white" />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-500 block mb-1">Guardia ($/h)</label>
              <input type="text" inputMode="numeric" value={instEditGuardiaRate} onChange={e => setInstEditGuardiaRate(e.target.value)}
                placeholder="0" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-xl p-2 font-bold text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 block mb-1">Proced. (unit.)</label>
              <input type="text" inputMode="numeric" value={instEditProcedimientoRate} onChange={e => setInstEditProcedimientoRate(e.target.value)}
                placeholder="0" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-xl p-2 font-bold text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 block mb-1">Interc. (c/u)</label>
              <input type="text" inputMode="numeric" value={instEditInterconsultaRate} onChange={e => setInstEditInterconsultaRate(e.target.value)}
                placeholder="0" className="w-full bg-white dark:bg-slate-700 border border-slate-200 rounded-xl p-2 font-bold text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setInstEditMode(false); setInstEditId(null); }}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleSaveInst} disabled={!instEditName.trim() || instEditSaving}>
              {instEditSaving ? 'Guardando...' : instEditId ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      ) : (
        <div ref={instRef} className="relative">
          <div
            onClick={() => setInstDropdownOpen(!instDropdownOpen)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold flex items-center justify-between cursor-pointer"
            style={{ minHeight: '40px' }}
          >
            <span className={selected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
              {selected || 'Buscar o crear institución...'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          {instDropdownOpen && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 z-20 shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2 sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                <input type="text" value={instSearch} onChange={e => setInstSearch(e.target.value)}
                  placeholder="Buscar institución..." autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm font-bold text-slate-900 dark:text-white" />
              </div>
              {filteredInstitutions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-400 text-center">Sin resultados</p>
              ) : (
                filteredInstitutions.map(inst => (
                  <div key={inst.id} className="flex items-center px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <button type="button" onClick={() => { onSelect(inst.name); setInstDropdownOpen(false); }}
                      className="flex-1 text-left text-sm font-bold truncate text-slate-900 dark:text-white" style={{ minHeight: '36px' }}>
                      {inst.name}
                    </button>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleEditInst(inst)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-blue-600">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setConfirmDeleteInst(inst.id)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              <button type="button" onClick={handleOpenNewInst}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-blue-600 border-t border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" style={{ minHeight: '40px' }}>
                <Plus className="w-4 h-4" /> + Nueva Institución
              </button>
            </div>
          )}
        </div>
      )}
      {confirmDeleteInst && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
          <p className="text-xs font-bold text-red-600 flex-1">¿Eliminar esta institución? (actividades previas no se afectan)</p>
          <Button type="button" size="sm" onClick={() => {
            const inst = institutions.find(i => i.id === confirmDeleteInst);
            if (inst) handleDeleteInst(confirmDeleteInst, inst.name);
          }}>Eliminar</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmDeleteInst(null)}>
            Cancelar
          </Button>
        </div>
      )}
      {selected && !instEditMode && !institutions.find(i => i.name.toLowerCase().trim() === selected.toLowerCase().trim() && i.is_active) && (
        <p className="text-[10px] text-amber-500 font-bold">
          Atención: Esta institución no está en tu lista de instituciones activas.
        </p>
      )}
    </div>
  );
}
