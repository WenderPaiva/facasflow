import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Loader2,
  RotateCcw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  ExpenseRecord,
  PaymentModality,
  PayrollEmployeeRecord,
  ServiceProviderRecord,
  ServiceProviderStatus,
} from '../types/order';
import {
  formatBRL,
  formatCurrencyMask,
  formatDateBR,
  getTodayGoiasISO,
  parseCurrencyMask,
  PAYMENT_MODALITY_META,
  resolveMonthPaymentDate,
  roundCurrencyBRL,
  toISODate,
} from '../utils/financeEngine';

interface CollaboratorsSubsectionProps {
  providers: ServiceProviderRecord[];
  payrollEmployees: PayrollEmployeeRecord[];
  despesas?: ExpenseRecord[];
  onAddProvider: (
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => Promise<boolean | void> | void;
  onUpdateProvider: (
    id: string,
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => Promise<boolean | void> | void;
  onDeleteProvider: (id: string) => Promise<void> | void;
  onAddPayrollEmployee: (
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => Promise<boolean | void> | void;
  onUpdatePayrollEmployee: (
    id: string,
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => Promise<boolean | void> | void;
  onDeletePayrollEmployee: (id: string) => Promise<void> | void;
  onToggleProviderPayment?: (
    provider: ServiceProviderRecord,
    targetStatus: 'pago' | 'pendente',
    competenceMonth: string
  ) => Promise<void> | void;
  onTogglePayrollPayment?: (
    employee: PayrollEmployeeRecord,
    targetStatus: 'pago' | 'pendente',
    competenceMonth: string
  ) => Promise<void> | void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PAYROLL_PAYMENT_MODALITIES: PaymentModality[] = [
  'pix',
  'dinheiro',
  'boleto',
  'cartao',
];

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

interface ScheduledPaymentItem {
  key: string;
  kind: 'funcionario' | 'prestador';
  id: string;
  name: string;
  subtitle: string;
  day: number;
  scheduledDate: string;
  amount: number;
  paymentModality: PaymentModality;
  isPaid: boolean;
  isOverdue: boolean;
  provider?: ServiceProviderRecord;
  employee?: PayrollEmployeeRecord;
}

function clampDay(day: number): number {
  const num = Math.round(Number(day) || 1);
  return Math.min(31, Math.max(1, num));
}

function getMonthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
}

export const CollaboratorsSubsection: React.FC<CollaboratorsSubsectionProps> = ({
  providers,
  payrollEmployees,
  despesas = [],
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  onAddPayrollEmployee,
  onUpdatePayrollEmployee,
  onDeletePayrollEmployee,
  onToggleProviderPayment,
  onTogglePayrollPayment,
}) => {
  const todayIso = getTodayGoiasISO();
  const currentMonthKey = todayIso.slice(0, 7);
  const initialYear = Number(todayIso.slice(0, 4)) || new Date().getFullYear();
  const initialMonth = Math.max(
    0,
    Math.min(11, (Number(todayIso.slice(5, 7)) || 1) - 1)
  );
  const todayDayNum = clampDay(Number(todayIso.slice(8, 10)) || 5);

  // Calendar / Schedule state
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const selectedMonthKey = getMonthKey(selectedYear, selectedMonth);

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
  const [provPaymentDay, setProvPaymentDay] = useState<number>(todayDayNum);
  const [provStatus, setProvStatus] = useState<ServiceProviderStatus>('pendente');
  const [isSubmittingProv, setIsSubmittingProv] = useState(false);

  // Payroll Employees Form State
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empRoleTitle, setEmpRoleTitle] = useState('');
  const [empSalary, setEmpSalary] = useState(0);
  const [empAdmissionDate, setEmpAdmissionDate] = useState(() => toISODate());
  const [empPaymentDay, setEmpPaymentDay] = useState<number>(5);
  const [empModality, setEmpModality] = useState<PaymentModality>('pix');
  const [empPaymentStatus, setEmpPaymentStatus] = useState<'pendente' | 'pago'>(
    'pendente'
  );
  const [empEditPaidAt, setEmpEditPaidAt] = useState<string | undefined>(
    undefined
  );
  const [empEditPaidComp, setEmpEditPaidComp] = useState<string | undefined>(
    undefined
  );
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Index active paid expenses by (origem_tipo:origem_id:competencia) for O(1) lookup
  const paidExpenseByKey = useMemo(() => {
    const map = new Map<string, ExpenseRecord>();
    for (const d of despesas) {
      if (
        !d.deleted_at &&
        d.status === 'pago' &&
        d.origem_id &&
        d.competencia_referencia
      ) {
        const comp = d.competencia_referencia.slice(0, 7);
        if (d.origem_tipo) {
          map.set(`${d.origem_tipo}:${d.origem_id}:${comp}`, d);
        }
        map.set(`any:${d.origem_id}:${comp}`, d);
      }
    }
    return map;
  }, [despesas]);

  const getLinkedPaidExpense = (
    kind: 'prestador' | 'funcionario',
    dbUuid: string | undefined,
    monthKey: string
  ): ExpenseRecord | undefined => {
    if (!dbUuid) return undefined;
    return (
      paidExpenseByKey.get(`${kind}:${dbUuid}:${monthKey}`) ||
      paidExpenseByKey.get(`any:${dbUuid}:${monthKey}`)
    );
  };

  const isProviderPaidInMonth = (
    p: ServiceProviderRecord,
    monthKey: string
  ): boolean => {
    if (getLinkedPaidExpense('prestador', p.dbUuid, monthKey)) {
      return true;
    }
    return (p.dueDate || '').slice(0, 7) === monthKey && p.status === 'pago';
  };

  const isEmployeePaidInMonth = (
    emp: PayrollEmployeeRecord,
    monthKey: string
  ): boolean => {
    if (getLinkedPaidExpense('funcionario', emp.dbUuid, monthKey)) {
      return true;
    }
    return (
      emp.paymentStatus === 'pago' &&
      (emp.paidCompetence || '').slice(0, 7) === monthKey
    );
  };

  // Monthly payment schedule items (Employees + Providers)
  const scheduleItems = useMemo<ScheduledPaymentItem[]>(() => {
    const list: ScheduledPaymentItem[] = [];

    for (const emp of payrollEmployees) {
      if (emp.admissionDate && emp.admissionDate.slice(0, 7) > selectedMonthKey) {
        continue;
      }
      const rawDay = clampDay(emp.paymentDay || 5);
      const scheduledDate = resolveMonthPaymentDate(selectedMonthKey, rawDay);
      const dayInMonth = Number(scheduledDate.slice(8, 10)) || rawDay;
      const linkedExp = getLinkedPaidExpense(
        'funcionario',
        emp.dbUuid,
        selectedMonthKey
      );
      const isPaid = Boolean(linkedExp) || isEmployeePaidInMonth(emp, selectedMonthKey);
      const isOverdue = !isPaid && scheduledDate < todayIso;
      const effectiveAmount = linkedExp
        ? roundCurrencyBRL(linkedExp.valor)
        : Number(emp.salary) || 0;

      list.push({
        key: `emp:${emp.id}`,
        kind: 'funcionario',
        id: emp.id,
        name: emp.name,
        subtitle: emp.roleTitle,
        day: dayInMonth,
        scheduledDate,
        amount: effectiveAmount,
        paymentModality: emp.paymentModality || 'pix',
        isPaid,
        isOverdue,
        employee: emp,
      });
    }

    for (const p of providers) {
      const rawDay = clampDay(
        p.paymentDay || Number((p.dueDate || '').slice(8, 10)) || 5
      );
      const scheduledDate = resolveMonthPaymentDate(selectedMonthKey, rawDay);
      const dayInMonth = Number(scheduledDate.slice(8, 10)) || rawDay;
      const linkedExp = getLinkedPaidExpense(
        'prestador',
        p.dbUuid,
        selectedMonthKey
      );
      const isPaid = Boolean(linkedExp) || isProviderPaidInMonth(p, selectedMonthKey);
      const isOverdue = !isPaid && scheduledDate < todayIso;
      const effectiveAmount = linkedExp
        ? roundCurrencyBRL(linkedExp.valor)
        : Number(p.amount) || 0;

      list.push({
        key: `prov:${p.id}`,
        kind: 'prestador',
        id: p.id,
        name: p.name,
        subtitle: p.service,
        day: dayInMonth,
        scheduledDate,
        amount: effectiveAmount,
        paymentModality: p.paymentModality || 'pix',
        isPaid,
        isOverdue,
        provider: p,
      });
    }

    return list.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [payrollEmployees, providers, paidExpenseByKey, selectedMonthKey, todayIso]);

  const scheduleSummary = useMemo(() => {
    let previsto = 0;
    let pago = 0;
    let pendente = 0;
    let pagoCount = 0;
    let pendenteCount = 0;

    for (const item of scheduleItems) {
      previsto = roundCurrencyBRL(previsto + item.amount);
      if (item.isPaid) {
        pago = roundCurrencyBRL(pago + item.amount);
        pagoCount += 1;
      } else {
        pendente = roundCurrencyBRL(pendente + item.amount);
        pendenteCount += 1;
      }
    }

    return { previsto, pago, pendente, pagoCount, pendenteCount };
  }, [scheduleItems]);

  // Map day -> items for calendar grid
  const itemsByDay = useMemo(() => {
    const map = new Map<number, ScheduledPaymentItem[]>();
    for (const item of scheduleItems) {
      const arr = map.get(item.day);
      if (arr) arr.push(item);
      else map.set(item.day, [item]);
    }
    return map;
  }, [scheduleItems]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const cells: Array<number | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(d);
    }
    return cells;
  }, [selectedYear, selectedMonth]);

  const filteredScheduleItems = useMemo(() => {
    if (selectedDay == null) return scheduleItems;
    return scheduleItems.filter((item) => item.day === selectedDay);
  }, [scheduleItems, selectedDay]);

  const totalProviders = providers.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPayroll = payrollEmployees.reduce(
    (sum, e) => sum + (e.salary || 0),
    0
  );

  const handleShiftMonth = (delta: number) => {
    const dt = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedYear(dt.getFullYear());
    setSelectedMonth(dt.getMonth());
    setSelectedDay(null);
  };

  const handleGoCurrentMonth = () => {
    setSelectedYear(initialYear);
    setSelectedMonth(initialMonth);
    setSelectedDay(null);
  };

  const handleToggleProvider = async (
    provider: ServiceProviderRecord,
    targetStatus: 'pago' | 'pendente'
  ) => {
    if (!onToggleProviderPayment || togglingKey) return;
    const key = `prov:${provider.id}`;
    setTogglingKey(key);
    try {
      await onToggleProviderPayment(provider, targetStatus, selectedMonthKey);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleToggleEmployee = async (
    employee: PayrollEmployeeRecord,
    targetStatus: 'pago' | 'pendente'
  ) => {
    if (!onTogglePayrollPayment || togglingKey) return;
    const key = `emp:${employee.id}`;
    setTogglingKey(key);
    try {
      await onTogglePayrollPayment(employee, targetStatus, selectedMonthKey);
    } finally {
      setTogglingKey(null);
    }
  };

  const resetProviderForm = () => {
    const today = toISODate();
    setEditProvId(null);
    setProvName('');
    setProvService('');
    setProvAmount(0);
    setProvModality('pix');
    setProvDueDate(today);
    setProvPaymentDay(clampDay(Number(today.slice(8, 10)) || 5));
    setProvStatus('pendente');
  };

  const resetEmployeeForm = () => {
    setEditEmpId(null);
    setEmpName('');
    setEmpRoleTitle('');
    setEmpSalary(0);
    setEmpAdmissionDate(toISODate());
    setEmpPaymentDay(5);
    setEmpModality('pix');
    setEmpPaymentStatus('pendente');
    setEmpEditPaidAt(undefined);
    setEmpEditPaidComp(undefined);
  };

  const handleProviderDueDateChange = (nextDate: string) => {
    setProvDueDate(nextDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      const parsed = Number(nextDate.slice(8, 10));
      if (parsed >= 1 && parsed <= 31) {
        setProvPaymentDay(parsed);
      }
      if (editProvId) {
        const editingProv = providers.find((item) => item.id === editProvId);
        if (editingProv) {
          setProvStatus(
            isProviderPaidInMonth(editingProv, nextDate.slice(0, 7))
              ? 'pago'
              : 'pendente'
          );
        }
      }
    }
  };

  const handleProviderPaymentDayChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setProvPaymentDay(1);
      return;
    }
    const clamped = clampDay(Number(digits));
    setProvPaymentDay(clamped);
    const baseYm = (provDueDate || toISODate()).slice(0, 7);
    setProvDueDate(resolveMonthPaymentDate(baseYm, clamped));
  };

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingProv || !provName.trim() || !provService.trim()) return;
    const safeDay = clampDay(
      provPaymentDay || Number((provDueDate || '').slice(8, 10)) || 5
    );
    const safeDueDate = provDueDate || resolveMonthPaymentDate(selectedMonthKey, safeDay);
    const payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'> = {
      name: provName.trim(),
      service: provService.trim(),
      amount: provAmount,
      paymentModality: provModality,
      dueDate: safeDueDate,
      paymentDay: safeDay,
      status: provStatus,
    };
    setIsSubmittingProv(true);
    try {
      const ok = editProvId
        ? await onUpdateProvider(editProvId, payload)
        : await onAddProvider(payload);
      if (ok !== false) {
        resetProviderForm();
      }
    } finally {
      setIsSubmittingProv(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEmp || !empName.trim() || !empRoleTitle.trim()) return;
    const isPaid = empPaymentStatus === 'pago';
    const payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'> = {
      name: empName.trim(),
      roleTitle: empRoleTitle.trim(),
      salary: empSalary,
      admissionDate: empAdmissionDate || toISODate(),
      paymentDay: clampDay(empPaymentDay || 5),
      paymentModality: empModality,
      paymentStatus: empPaymentStatus,
      paidAt: isPaid ? empEditPaidAt || toISODate() : undefined,
      paidCompetence: empEditPaidComp || selectedMonthKey,
    };
    setIsSubmittingEmp(true);
    try {
      const ok = editEmpId
        ? await onUpdatePayrollEmployee(editEmpId, payload)
        : await onAddPayrollEmployee(payload);
      if (ok !== false) {
        resetEmployeeForm();
      }
    } finally {
      setIsSubmittingEmp(false);
    }
  };

  const handleDeleteProv = async (id: string) => {
    if (deletingKey) return;
    setDeletingKey(`prov:${id}`);
    try {
      await onDeleteProvider(id);
      if (editProvId === id) resetProviderForm();
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteEmp = async (id: string) => {
    if (deletingKey) return;
    setDeletingKey(`emp:${id}`);
    try {
      await onDeletePayrollEmployee(id);
      if (editEmpId === id) resetEmployeeForm();
    } finally {
      setDeletingKey(null);
    }
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      {/* Módulo Calendário e Cronograma Mensal de Pagamentos */}
      <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/60">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Sincronizado com Despesas e Fluxo de Caixa
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Calendário e Cronograma Mensal de Pagamentos
            </h3>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Acompanhe vencimentos de funcionários e prestadores e dê baixa com 1 clique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              aria-label="Mês anterior"
              className="btn-compact w-10 h-10 rounded-full liquid-glass-pill text-slate-700 hover:text-indigo-700 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="liquid-glass-pill min-h-[40px] px-4 py-2 rounded-full text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{MONTH_NAMES[selectedMonth]}</span>
              <span className="text-indigo-700 font-mono">{selectedYear}</span>
            </div>

            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              aria-label="Próximo mês"
              className="btn-compact w-10 h-10 rounded-full liquid-glass-pill text-slate-700 hover:text-indigo-700 flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedMonthKey !== currentMonthKey && (
              <button
                type="button"
                onClick={handleGoCurrentMonth}
                className="min-h-[40px] px-3.5 py-2 rounded-full liquid-glass-pill text-xs font-bold text-indigo-700 hover:bg-white/75 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mês Atual</span>
              </button>
            )}
          </div>
        </div>

        {/* KPIs do Calendário */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl liquid-glass-subtle p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Previsto no Mês
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              {formatBRL(scheduleSummary.previsto)}
            </p>
            <span className="text-[11px] font-semibold text-slate-600">
              {scheduleItems.length} lançamento(s) previsto(s)
            </span>
          </div>

          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-300/60 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Total Pago no Mês
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
              {formatBRL(scheduleSummary.pago)}
            </p>
            <span className="text-[11px] font-semibold text-emerald-800/80">
              {scheduleSummary.pagoCount} quitado(s)
            </span>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-300/60 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
              Total Pendente no Mês
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-800 font-mono mt-1">
              {formatBRL(scheduleSummary.pendente)}
            </p>
            <span className="text-[11px] font-semibold text-amber-900/80">
              {scheduleSummary.pendenteCount} a pagar
            </span>
          </div>
        </div>

        {/* Grade Mensal (7 colunas) + Lista Cronológica */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Calendário 7 colunas */}
          <div className="lg:col-span-5 rounded-2xl liquid-glass-subtle p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-900">
                Vencimentos por Dia
              </span>
              <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Pago
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pendente
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Atrasado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((wd) => (
                <div
                  key={wd}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 py-1"
                >
                  {wd}
                </div>
              ))}

              {calendarCells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="h-10" />;
                }
                const dayItems = itemsByDay.get(dayNum) || [];
                const hasItems = dayItems.length > 0;
                const allPaid = hasItems && dayItems.every((it) => it.isPaid);
                const hasOverdue = hasItems && dayItems.some((it) => it.isOverdue);
                const isSelected = selectedDay === dayNum;
                const cellIso = `${selectedMonthKey}-${String(dayNum).padStart(2, '0')}`;
                const isToday = cellIso === todayIso;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() =>
                      setSelectedDay((prev) => (prev === dayNum ? null : dayNum))
                    }
                    className={`btn-compact relative h-10 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                        : hasItems
                          ? 'bg-white/75 hover:bg-white text-slate-900 border border-white/80'
                          : 'bg-white/30 hover:bg-white/55 text-slate-600'
                    } ${isToday && !isSelected ? 'ring-2 ring-indigo-400/70' : ''}`}
                    title={
                      hasItems
                        ? `${dayItems.length} pagamento(s) no dia ${String(dayNum).padStart(2, '0')}`
                        : `Dia ${String(dayNum).padStart(2, '0')}`
                    }
                  >
                    <span className="font-mono leading-none">{dayNum}</span>
                    {hasItems && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          isSelected
                            ? 'bg-white'
                            : allPaid
                              ? 'bg-emerald-500'
                              : hasOverdue
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista Cronológica de Vencimentos */}
          <div className="lg:col-span-7 rounded-2xl liquid-glass-subtle p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/60">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-extrabold text-slate-900">
                  {selectedDay != null
                    ? `Vencimentos do Dia ${String(selectedDay).padStart(2, '0')}/${String(
                        selectedMonth + 1
                      ).padStart(2, '0')}`
                    : `Cronograma Completo (${MONTH_NAMES[selectedMonth]}/${selectedYear})`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className={`btn-compact px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  selectedDay == null
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'liquid-glass-pill text-slate-700 hover:text-indigo-700'
                }`}
              >
                Todos os dias
              </button>
            </div>

            {filteredScheduleItems.length === 0 ? (
              <div className="p-7 rounded-2xl border border-dashed border-white/75 text-center text-xs font-medium text-slate-600">
                {selectedDay != null
                  ? `Nenhum pagamento previsto para o dia ${String(selectedDay).padStart(2, '0')}.`
                  : 'Nenhum colaborador ou prestador previsto para este mês.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredScheduleItems.map((item) => {
                  const isBusy = togglingKey === item.key;
                  const mod = PAYMENT_MODALITY_META[item.paymentModality];
                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-2xl bg-white/55 border border-white/75 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                            Dia {String(item.day).padStart(2, '0')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.kind === 'funcionario'
                                ? 'bg-sky-500/15 text-sky-900 border-sky-300/60'
                                : 'bg-violet-500/15 text-violet-900 border-violet-300/60'
                            }`}
                          >
                            {item.kind === 'funcionario' ? 'Funcionário' : 'Prestador'}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600">
                          <span className="truncate">{item.subtitle}</span>
                          <span>•</span>
                          <span className="font-semibold">{mod?.short || item.paymentModality}</span>
                          {item.isOverdue && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 border border-rose-300/60">
                              Atrasado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 ml-auto">
                        <span className="text-xs sm:text-sm font-black font-mono text-slate-900">
                          {formatBRL(item.amount)}
                        </span>

                        {(item.kind === 'prestador' && onToggleProviderPayment) ||
                        (item.kind === 'funcionario' && onTogglePayrollPayment) ? (
                          <button
                            type="button"
                            disabled={Boolean(togglingKey)}
                            onClick={() => {
                              const nextStatus = item.isPaid ? 'pendente' : 'pago';
                              if (item.kind === 'prestador' && item.provider) {
                                void handleToggleProvider(item.provider, nextStatus);
                              } else if (item.kind === 'funcionario' && item.employee) {
                                void handleToggleEmployee(item.employee, nextStatus);
                              }
                            }}
                            title={
                              item.isPaid
                                ? 'Clique para estornar para Pendente'
                                : 'Clique para marcar como Pago e lançar nas Despesas'
                            }
                            className={`btn-compact min-h-[34px] px-3 py-1.5 rounded-full text-[11px] font-extrabold border inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                              item.isPaid
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 border-emerald-400/70'
                                : item.isOverdue
                                  ? 'bg-rose-500/20 hover:bg-emerald-500/20 text-rose-900 hover:text-emerald-900 border-rose-400/70'
                                  : 'bg-amber-500/20 hover:bg-emerald-500/20 text-amber-900 hover:text-emerald-900 border-amber-400/70'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : item.isPaid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span>{item.isPaid ? 'Pago' : 'Pendente'}</span>
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              item.isPaid
                                ? PROVIDER_STATUS_META.pago.badgeClass
                                : item.isOverdue
                                  ? PROVIDER_STATUS_META.atrasado.badgeClass
                                  : PROVIDER_STATUS_META.pendente.badgeClass
                            }`}
                          >
                            {item.isPaid
                              ? 'Pago'
                              : item.isOverdue
                                ? 'Atrasado'
                                : 'Pendente'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
          {/* Form Prestador */}
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
                  className="btn-compact w-8 h-8 rounded-full liquid-glass-pill text-slate-600 flex items-center justify-center cursor-pointer"
                  aria-label="Cancelar edição"
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
                  Dia de Recebimento (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  step={1}
                  required
                  value={provPaymentDay}
                  onChange={(e) => handleProviderPaymentDayChange(e.target.value)}
                  className={`${inputClass} font-mono text-center font-bold`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vencimento
                </label>
                <input
                  type="date"
                  required
                  value={provDueDate}
                  onChange={(e) => handleProviderDueDateChange(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

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
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status do Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvStatus('pendente')}
                  className={`min-h-[42px] px-3 py-2 rounded-2xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    provStatus !== 'pago'
                      ? 'bg-amber-500/20 text-amber-900 border-amber-400/80 shadow-sm'
                      : 'liquid-glass-pill text-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProvStatus('pago')}
                  className={`min-h-[42px] px-3 py-2 rounded-2xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    provStatus === 'pago'
                      ? 'bg-emerald-500/20 text-emerald-900 border-emerald-400/80 shadow-sm'
                      : 'liquid-glass-pill text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pago</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingProv}
              className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingProv ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{editProvId ? 'Salvando...' : 'Adicionando...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editProvId ? 'Salvar Prestador' : 'Adicionar Prestador'}</span>
                </>
              )}
            </button>
          </form>

          {/* List Prestadores */}
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
                const isPaid = isProviderPaidInMonth(p, selectedMonthKey);
                const dayNum = clampDay(
                  p.paymentDay || Number((p.dueDate || '').slice(8, 10)) || 5
                );
                const scheduledDate = resolveMonthPaymentDate(
                  selectedMonthKey,
                  dayNum
                );
                const effStatus: ServiceProviderStatus = isPaid
                  ? 'pago'
                  : scheduledDate < todayIso
                    ? 'atrasado'
                    : 'pendente';
                const st = PROVIDER_STATUS_META[effStatus];
                const mod = PAYMENT_MODALITY_META[p.paymentModality];
                const isBusyToggle = togglingKey === `prov:${p.id}`;

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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                          Dia {String(dayNum).padStart(2, '0')}
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

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black font-mono text-slate-900 mr-1">
                        {formatBRL(p.amount)}
                      </span>

                      {onToggleProviderPayment && (
                        <button
                          type="button"
                          disabled={Boolean(togglingKey)}
                          onClick={() =>
                            void handleToggleProvider(
                              p,
                              isPaid ? 'pendente' : 'pago'
                            )
                          }
                          title={
                            isPaid
                              ? 'Reabrir como Pendente neste mês'
                              : 'Marcar como Pago neste mês'
                          }
                          className={`btn-compact min-h-[32px] px-3 py-1 rounded-full text-[11px] font-extrabold border inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60 ${
                            isPaid
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 border-emerald-400/70'
                              : 'bg-amber-500/20 hover:bg-emerald-500/20 text-amber-900 hover:text-emerald-900 border-amber-400/70'
                          }`}
                        >
                          {isBusyToggle ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{isPaid ? 'Pago' : 'Pendente'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const provComp = (
                            p.dueDate || selectedMonthKey
                          ).slice(0, 7);
                          setEditProvId(p.id);
                          setProvName(p.name);
                          setProvService(p.service);
                          setProvAmount(p.amount);
                          setProvModality(p.paymentModality);
                          setProvDueDate(p.dueDate);
                          setProvPaymentDay(dayNum);
                          setProvStatus(
                            isProviderPaidInMonth(p, provComp)
                              ? 'pago'
                              : 'pendente'
                          );
                        }}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Editar prestador"
                        aria-label="Editar prestador"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(deletingKey)}
                        onClick={() => void handleDeleteProv(p.id)}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-50 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Excluir prestador"
                        aria-label="Excluir prestador"
                      >
                        {deletingKey === `prov:${p.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
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
          {/* Form Funcionário */}
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
                  className="btn-compact w-8 h-8 rounded-full liquid-glass-pill text-slate-600 flex items-center justify-center cursor-pointer"
                  aria-label="Cancelar edição"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dia de Recebimento (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  step={1}
                  required
                  value={empPaymentDay}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setEmpPaymentDay(digits ? clampDay(Number(digits)) : 1);
                  }}
                  className={`${inputClass} font-mono text-center font-bold`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={empModality}
                  onChange={(e) =>
                    setEmpModality(e.target.value as PaymentModality)
                  }
                  className={inputClass}
                >
                  {PAYROLL_PAYMENT_MODALITIES.map((mod) => (
                    <option key={mod} value={mod}>
                      {PAYMENT_MODALITY_META[mod].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status do Pagamento ({MONTH_NAMES[selectedMonth]}/{selectedYear})
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEmpPaymentStatus('pendente')}
                  className={`min-h-[42px] px-3 py-2 rounded-2xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    empPaymentStatus === 'pendente'
                      ? 'bg-amber-500/20 text-amber-900 border-amber-400/80 shadow-sm'
                      : 'liquid-glass-pill text-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmpPaymentStatus('pago')}
                  className={`min-h-[42px] px-3 py-2 rounded-2xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    empPaymentStatus === 'pago'
                      ? 'bg-emerald-500/20 text-emerald-900 border-emerald-400/80 shadow-sm'
                      : 'liquid-glass-pill text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pago</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingEmp}
              className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingEmp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{editEmpId ? 'Salvando...' : 'Adicionando...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {editEmpId ? 'Salvar Funcionário' : 'Adicionar Funcionário'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* List Funcionários */}
          <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60">
              Quadro de Funcionários
            </h3>
            {payrollEmployees.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                Nenhum funcionário cadastrado.
              </div>
            ) : (
              payrollEmployees.map((emp) => {
                const isPaid = isEmployeePaidInMonth(emp, selectedMonthKey);
                const dayNum = clampDay(emp.paymentDay || 5);
                const scheduledDate = resolveMonthPaymentDate(
                  selectedMonthKey,
                  dayNum
                );
                const effStatus: ServiceProviderStatus = isPaid
                  ? 'pago'
                  : scheduledDate < todayIso
                    ? 'atrasado'
                    : 'pendente';
                const st = PROVIDER_STATUS_META[effStatus];
                const mod = PAYMENT_MODALITY_META[emp.paymentModality || 'pix'];
                const isBusyToggle = togglingKey === `emp:${emp.id}`;

                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {emp.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                          Dia {String(dayNum).padStart(2, '0')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.badgeClass}`}
                        >
                          {st.label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${mod?.badgeClass}`}
                        >
                          {mod?.short || 'Pix'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        {emp.roleTitle} • Admissão {formatDateBR(emp.admissionDate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black font-mono text-slate-900 mr-1">
                        {formatBRL(emp.salary)}
                      </span>

                      {onTogglePayrollPayment && (
                        <button
                          type="button"
                          disabled={Boolean(togglingKey)}
                          onClick={() =>
                            void handleToggleEmployee(
                              emp,
                              isPaid ? 'pendente' : 'pago'
                            )
                          }
                          title={
                            isPaid
                              ? 'Reabrir salário como Pendente neste mês'
                              : 'Marcar salário como Pago neste mês'
                          }
                          className={`btn-compact min-h-[32px] px-3 py-1 rounded-full text-[11px] font-extrabold border inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60 ${
                            isPaid
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 border-emerald-400/70'
                              : 'bg-amber-500/20 hover:bg-emerald-500/20 text-amber-900 hover:text-emerald-900 border-amber-400/70'
                          }`}
                        >
                          {isBusyToggle ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{isPaid ? 'Pago' : 'Pendente'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditEmpId(emp.id);
                          setEmpName(emp.name);
                          setEmpRoleTitle(emp.roleTitle);
                          setEmpSalary(emp.salary);
                          setEmpAdmissionDate(emp.admissionDate);
                          setEmpPaymentDay(dayNum);
                          setEmpModality(emp.paymentModality || 'pix');
                          setEmpPaymentStatus(isPaid ? 'pago' : 'pendente');
                          setEmpEditPaidAt(emp.paidAt);
                          setEmpEditPaidComp(selectedMonthKey);
                        }}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Editar funcionário"
                        aria-label="Editar funcionário"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(deletingKey)}
                        onClick={() => void handleDeleteEmp(emp.id)}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-50 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Excluir funcionário"
                        aria-label="Excluir funcionário"
                      >
                        {deletingKey === `emp:${emp.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
