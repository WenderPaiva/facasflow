import React, { useState } from 'react';
import { Briefcase, Check, Edit3, Trash2, Users, X } from 'lucide-react';
import {
  PaymentModality,
  PayrollEmployeeRecord,
  ServiceProviderRecord,
  ServiceProviderStatus,
} from '../types/order';
import {
  formatBRL,
  formatCurrencyMask,
  formatDateBR,
  parseCurrencyMask,
  PAYMENT_MODALITY_META,
  toISODate,
} from '../utils/financeEngine';

interface CollaboratorsSubsectionProps {
  providers: ServiceProviderRecord[];
  payrollEmployees: PayrollEmployeeRecord[];
  onAddProvider: (
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onUpdateProvider: (
    id: string,
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onDeleteProvider: (id: string) => void;
  onAddPayrollEmployee: (
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onUpdatePayrollEmployee: (
    id: string,
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onDeletePayrollEmployee: (id: string) => void;
}

const PROVIDER_STATUS_META: Record<
  ServiceProviderStatus,
  { label: string; badgeClass: string }
> = {
  pendente: {
    label: 'Pendente',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300/60',
  },
  pago: {
    label: 'Pago',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60',
  },
  atrasado: {
    label: 'Atrasado',
    badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-300/60',
  },
};

export const CollaboratorsSubsection: React.FC<CollaboratorsSubsectionProps> = ({
  providers,
  payrollEmployees,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  onAddPayrollEmployee,
  onUpdatePayrollEmployee,
  onDeletePayrollEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'prestadores' | 'funcionarios'>(
    'prestadores'
  );

  // Providers Form State
  const [editProvId, setEditProvId] = useState<string | null>(null);
  const [provName, setProvName] = useState('');
  const [provService, setProvService] = useState('');
  const [provAmount, setProvAmount] = useState(0);
  const [provModality, setProvModality] = useState<PaymentModality>('pix');
  const [provDueDate, setProvDueDate] = useState(() => toISODate());
  const [provStatus, setProvStatus] = useState<ServiceProviderStatus>('pendente');

  // Payroll Employees Form State
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empRoleTitle, setEmpRoleTitle] = useState('');
  const [empSalary, setEmpSalary] = useState(0);
  const [empAdmissionDate, setEmpAdmissionDate] = useState(() => toISODate());

  const totalProviders = providers.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPayroll = payrollEmployees.reduce(
    (sum, e) => sum + (e.salary || 0),
    0
  );

  const resetProviderForm = () => {
    setEditProvId(null);
    setProvName('');
    setProvService('');
    setProvAmount(0);
    setProvModality('pix');
    setProvDueDate(toISODate());
    setProvStatus('pendente');
  };

  const resetEmployeeForm = () => {
    setEditEmpId(null);
    setEmpName('');
    setEmpRoleTitle('');
    setEmpSalary(0);
    setEmpAdmissionDate(toISODate());
  };

  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName.trim() || !provService.trim()) return;
    const payload = {
      name: provName.trim(),
      service: provService.trim(),
      amount: provAmount,
      paymentModality: provModality,
      dueDate: provDueDate || toISODate(),
      status: provStatus,
    };
    if (editProvId) {
      onUpdateProvider(editProvId, payload);
    } else {
      onAddProvider(payload);
    }
    resetProviderForm();
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empRoleTitle.trim()) return;
    const payload = {
      name: empName.trim(),
      roleTitle: empRoleTitle.trim(),
      salary: empSalary,
      admissionDate: empAdmissionDate || toISODate(),
    };
    if (editEmpId) {
      onUpdatePayrollEmployee(editEmpId, payload);
    } else {
      onAddPayrollEmployee(payload);
    }
    resetEmployeeForm();
  };

  const inputClass =
    'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      {/* Sub-tabs Header + Total of Active Tab */}
      <div className="liquid-glass rounded-[28px] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('prestadores')}
            className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'prestadores'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'liquid-glass-pill text-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Prestadores de Serviço</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-[10px]">
              {providers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('funcionarios')}
            className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'funcionarios'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'liquid-glass-pill text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Funcionários</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-[10px]">
              {payrollEmployees.length}
            </span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            {activeTab === 'prestadores'
              ? 'Total Prestadores de Serviço'
              : 'Total Folha de Funcionários'}
          </span>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            {formatBRL(
              activeTab === 'prestadores' ? totalProviders : totalPayroll
            )}
          </span>
        </div>
      </div>

      {activeTab === 'prestadores' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Form */}
          <form
            onSubmit={handleProviderSubmit}
            className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editProvId
                  ? `Editar Prestador ${editProvId}`
                  : 'Cadastrar Prestador de Serviço'}
              </h3>
              {editProvId && (
                <button
                  type="button"
                  onClick={resetProviderForm}
                  className="p-1.5 rounded-full liquid-glass-pill text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                value={provName}
                onChange={(e) => setProvName(e.target.value)}
                placeholder="Nome do prestador"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Serviço
              </label>
              <input
                type="text"
                required
                value={provService}
                onChange={(e) => setProvService(e.target.value)}
                placeholder="Ex: Afiação, Frete, Manutenção Laser"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Valor em R$
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatCurrencyMask(provAmount)}
                    onChange={(e) =>
                      setProvAmount(parseCurrencyMask(e.target.value))
                    }
                    className={`${inputClass} pl-9 text-right font-mono font-bold`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={provDueDate}
                  onChange={(e) => setProvDueDate(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={provModality}
                  onChange={(e) =>
                    setProvModality(e.target.value as PaymentModality)
                  }
                  className={inputClass}
                >
                  {(Object.keys(PAYMENT_MODALITY_META) as PaymentModality[]).map(
                    (mod) => (
                      <option key={mod} value={mod}>
                        {PAYMENT_MODALITY_META[mod].label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status
                </label>
                <select
                  value={provStatus}
                  onChange={(e) =>
                    setProvStatus(e.target.value as ServiceProviderStatus)
                  }
                  className={inputClass}
                >
                  {Object.entries(PROVIDER_STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editProvId ? 'Salvar Prestador' : 'Adicionar Prestador'}</span>
            </button>
          </form>

          {/* List */}
          <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60">
              Prestadores Cadastrados
            </h3>
            {providers.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                Nenhum prestador de serviço cadastrado.
              </div>
            ) : (
              providers.map((p) => {
                const st = PROVIDER_STATUS_META[p.status];
                const mod = PAYMENT_MODALITY_META[p.paymentModality];
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {p.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.badgeClass}`}
                        >
                          {st.label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${mod?.badgeClass}`}
                        >
                          {mod?.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        {p.service} • Vencimento {formatDateBR(p.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-slate-900 mr-1">
                        {formatBRL(p.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditProvId(p.id);
                          setProvName(p.name);
                          setProvService(p.service);
                          setProvAmount(p.amount);
                          setProvModality(p.paymentModality);
                          setProvDueDate(p.dueDate);
                          setProvStatus(p.status);
                        }}
                        className="p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 cursor-pointer"
                        title="Editar prestador"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editProvId === p.id) resetProviderForm();
                          onDeleteProvider(p.id);
                        }}
                        className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer"
                        title="Remover prestador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Form */}
          <form
            onSubmit={handleEmployeeSubmit}
            className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editEmpId
                  ? `Editar Funcionário ${editEmpId}`
                  : 'Cadastrar Funcionário'}
              </h3>
              {editEmpId && (
                <button
                  type="button"
                  onClick={resetEmployeeForm}
                  className="p-1.5 rounded-full liquid-glass-pill text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="Nome completo"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Cargo
              </label>
              <input
                type="text"
                required
                value={empRoleTitle}
                onChange={(e) => setEmpRoleTitle(e.target.value)}
                placeholder="Ex: Serrador, Dobrador, Emborrachador"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Salário em R$
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatCurrencyMask(empSalary)}
                    onChange={(e) =>
                      setEmpSalary(parseCurrencyMask(e.target.value))
                    }
                    className={`${inputClass} pl-9 text-right font-mono font-bold`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data de Admissão
                </label>
                <input
                  type="date"
                  required
                  value={empAdmissionDate}
                  onChange={(e) => setEmpAdmissionDate(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {editEmpId ? 'Salvar Funcionário' : 'Adicionar Funcionário'}
              </span>
            </button>
          </form>

          {/* List */}
          <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60">
              Quadro de Funcionários
            </h3>
            {payrollEmployees.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                Nenhum funcionário cadastrado.
              </div>
            ) : (
              payrollEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {emp.name}
                    </span>
                    <p className="text-xs font-medium text-slate-700">
                      {emp.roleTitle} • Admissão {formatDateBR(emp.admissionDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-slate-900 mr-1">
                      {formatBRL(emp.salary)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditEmpId(emp.id);
                        setEmpName(emp.name);
                        setEmpRoleTitle(emp.roleTitle);
                        setEmpSalary(emp.salary);
                        setEmpAdmissionDate(emp.admissionDate);
                      }}
                      className="p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 cursor-pointer"
                      title="Editar funcionário"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editEmpId === emp.id) resetEmployeeForm();
                        onDeletePayrollEmployee(emp.id);
                      }}
                      className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer"
                      title="Remover funcionário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
