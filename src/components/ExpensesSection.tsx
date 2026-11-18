import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  BarChart3,
  CalendarRange,
  Download,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  ExpenseCategoryKey,
  ExpenseDisplayStatus,
  ExpensePaymentMethod,
  ExpenseRecord,
  ExpenseStatus,
} from '../types/order';
import {
  buildExpensesCsvContent,
  computeExpenseEffectiveStatus,
  computeExpensesSummary,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_MAP,
  EXPENSE_PAYMENT_META,
  EXPENSE_STATUS_META,
  ExpensePeriodPreset,
  formatBRL,
  formatCurrencyMask,
  formatDateBR,
  getExpensePeriodRange,
  getTodayGoiasISO,
  parseCurrencyMask,
  roundCurrencyBRL,
  validateExpenseInput,
} from '../utils/financeEngine';
import { ExpenseDraftPayload } from '../services/supabaseDataService';
import { ResponsiveCategoryChart } from './ResponsiveCategoryChart';

interface ExpensesSectionProps {
  expenses: ExpenseRecord[];
  canEdit: boolean;
  onCreateExpense: (payload: ExpenseDraftPayload) => Promise<ExpenseRecord>;
  onUpdateExpense: (id: string, payload: ExpenseDraftPayload) => Promise<ExpenseRecord>;
  onDeleteExpense: (id: string) => Promise<void>;
}

type SortField =
  | 'data_competencia'
  | 'categoria'
  | 'descricao'
  | 'fornecedor'
  | 'valor'
  | 'forma_pagamento'
  | 'status';

interface FormState {
  categoria: ExpenseCategoryKey;
  descricao: string;
  valorDisplay: string;
  valorNum: number;
  data_competencia: string;
  data_vencimento: string;
  data_pagamento: string;
  status: ExpenseStatus;
  forma_pagamento: ExpensePaymentMethod;
  fornecedor: string;
  observacao: string;
}

const makeInitialFormState = (todayIso: string): FormState => ({
  categoria: 'laminas',
  descricao: '',
  valorDisplay: '0,00',
  valorNum: 0,
  data_competencia: todayIso,
  data_vencimento: todayIso,
  data_pagamento: '',
  status: 'pendente',
  forma_pagamento: 'pix',
  fornecedor: '',
  observacao: '',
});

export const ExpensesSection: React.FC<ExpensesSectionProps> = ({
  expenses,
  canEdit,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const todayGoiasIso = getTodayGoiasISO();

  const [periodPreset, setPeriodPreset] = useState<ExpensePeriodPreset>('mes_atual');
  const [customStart, setCustomStart] = useState<string>(
    `${todayGoiasIso.slice(0, 7)}-01`
  );
  const [customEnd, setCustomEnd] = useState<string>(todayGoiasIso);

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategoryKey | 'todas'>('todas');
  const [statusFilter, setStatusFilter] = useState<ExpenseDisplayStatus | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('data_competencia');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Form modal / bottom-sheet state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(() =>
    makeInitialFormState(todayGoiasIso)
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formSuccessNote, setFormSuccessNote] = useState<string | null>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const periodRange = useMemo(
    () => getExpensePeriodRange(periodPreset, customStart, customEnd, todayGoiasIso),
    [periodPreset, customStart, customEnd, todayGoiasIso]
  );

  // Filter by selected period first (for summary & chart per Seção 3.4)
  const periodExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (exp.deleted_at) return false;
      const comp = (exp.data_competencia || '').slice(0, 10);
      return comp >= periodRange.start && comp <= periodRange.end;
    });
  }, [expenses, periodRange]);

  const summary = useMemo(
    () => computeExpensesSummary(periodExpenses, todayGoiasIso),
    [periodExpenses, todayGoiasIso]
  );

  // Apply category, status & search filters for table & CSV export
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = periodExpenses.filter((exp) => {
      if (categoryFilter !== 'todas' && exp.categoria !== categoryFilter) {
        return false;
      }
      const eff = computeExpenseEffectiveStatus(exp, todayGoiasIso);
      if (statusFilter !== 'todos' && eff !== statusFilter) {
        return false;
      }
      if (q) {
        const desc = (exp.descricao || '').toLowerCase();
        const forn = (exp.fornecedor || '').toLowerCase();
        const obs = (exp.observacao || '').toLowerCase();
        const cat = (EXPENSE_CATEGORY_MAP[exp.categoria]?.label || '').toLowerCase();
        if (
          !desc.includes(q) &&
          !forn.includes(q) &&
          !obs.includes(q) &&
          !cat.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'valor') {
        cmp = roundCurrencyBRL(a.valor) - roundCurrencyBRL(b.valor);
      } else if (sortField === 'status') {
        const sa = computeExpenseEffectiveStatus(a, todayGoiasIso);
        const sb = computeExpenseEffectiveStatus(b, todayGoiasIso);
        cmp = sa.localeCompare(sb, 'pt-BR');
      } else {
        const va = String((a as any)[sortField] || '');
        const vb = String((b as any)[sortField] || '');
        cmp = va.localeCompare(vb, 'pt-BR');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [
    periodExpenses,
    categoryFilter,
    statusFilter,
    searchQuery,
    sortField,
    sortDir,
    todayGoiasIso,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'valor' || field === 'data_competencia' ? 'desc' : 'asc');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormState(makeInitialFormState(todayGoiasIso));
    setFormErrors({});
    setNetworkError(null);
    setFormSuccessNote(null);
    setFormOpen(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingId(exp.id);
    const val = roundCurrencyBRL(exp.valor);
    setFormState({
      categoria: exp.categoria,
      descricao: exp.descricao || '',
      valorDisplay: formatCurrencyMask(val),
      valorNum: val,
      data_competencia: (exp.data_competencia || todayGoiasIso).slice(0, 10),
      data_vencimento: (exp.data_vencimento || '').slice(0, 10),
      data_pagamento: (exp.data_pagamento || '').slice(0, 10),
      status: exp.status,
      forma_pagamento: exp.forma_pagamento || 'pix',
      fornecedor: exp.fornecedor || '',
      observacao: exp.observacao || '',
    });
    setFormErrors({});
    setNetworkError(null);
    setFormSuccessNote(null);
    setFormOpen(true);
  };

  const handleSave = async (keepOpenAfterCreate: boolean) => {
    setNetworkError(null);
    setFormSuccessNote(null);

    const roundedValor = roundCurrencyBRL(formState.valorNum);
    const validation = validateExpenseInput({
      categoria: formState.categoria,
      descricao: formState.descricao,
      valor: roundedValor,
      data_competencia: formState.data_competencia,
    });

    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      return;
    }

    const payload: ExpenseDraftPayload = {
      categoria: formState.categoria,
      descricao: formState.descricao.trim(),
      valor: roundedValor,
      data_competencia: formState.data_competencia.slice(0, 10),
      data_vencimento: formState.data_vencimento
        ? formState.data_vencimento.slice(0, 10)
        : undefined,
      data_pagamento:
        formState.status === 'pago'
          ? (formState.data_pagamento || todayGoiasIso).slice(0, 10)
          : formState.data_pagamento
            ? formState.data_pagamento.slice(0, 10)
            : undefined,
      status: formState.status,
      forma_pagamento: formState.forma_pagamento,
      fornecedor: formState.fornecedor.trim() || undefined,
      observacao: formState.observacao.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateExpense(editingId, payload);
        setFormOpen(false);
      } else {
        await onCreateExpense(payload);
        if (keepOpenAfterCreate) {
          setFormState((prev) => ({
            ...makeInitialFormState(prev.data_competencia || todayGoiasIso),
            categoria: prev.categoria,
          }));
          setFormErrors({});
          setFormSuccessNote('Despesa salva! Você pode lançar a próxima abaixo.');
        } else {
          setFormOpen(false);
        }
      }
    } catch (err: any) {
      setNetworkError(
        err?.message ||
          'Não foi possível salvar a despesa por falha de conexão. Seus dados no formulário foram mantidos.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDeleteExpense(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(
        err?.message || 'Erro de rede ao excluir despesa. Tente novamente.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const csv = buildExpensesCsvContent(filteredExpenses, todayGoiasIso);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `despesas_${periodRange.start}_a_${periodRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 min-w-0">
      {/* Top Action & Period Bar */}
      <div className="liquid-glass rounded-[28px] p-4 sm:p-6 space-y-4 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <Receipt className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Monitoramento de Gastos
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Despesas Operacionais e Insumos
            </h3>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Período: {formatDateBR(periodRange.start)} a {formatDateBR(periodRange.end)} (Horário de Goiás)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-800 inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Exportar CSV</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={openCreateModal}
                className="min-h-[44px] px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md inline-flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Nova Despesa</span>
              </button>
            )}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/50">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span>Período:</span>
          </div>
          {(
            [
              { id: 'mes_atual', label: 'Mês Atual' },
              { id: 'mes_anterior', label: 'Mês Anterior' },
              { id: 'trimestre', label: 'Trimestre' },
              { id: 'ano', label: 'Ano' },
              { id: 'personalizado', label: 'Personalizado' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodPreset(p.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                periodPreset === p.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'liquid-glass-pill text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}

          {periodPreset === 'personalizado' && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                aria-label="Data inicial"
                className="liquid-glass-input min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
              />
              <span className="text-xs font-bold text-slate-600">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                aria-label="Data final"
                className="liquid-glass-input min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <div className="liquid-glass rounded-[24px] p-5 min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
            Total do Período
          </span>
          <p className="text-2xl font-mono font-black text-slate-900 mt-1.5">
            {formatBRL(summary.totalPeriodo)}
          </p>
          <span className="text-xs font-semibold text-slate-600 mt-1 block">
            {summary.countAtivos} lançamento(s) ativo(s)
          </span>
        </div>

        <div className="liquid-glass rounded-[24px] p-5 min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
            Pago vs Pendente
          </span>
          <p className="text-lg font-mono font-black text-emerald-700 mt-1.5">
            Pago: {formatBRL(summary.totalPago)}
          </p>
          <p className="text-sm font-mono font-bold text-amber-800 mt-0.5">
            Pendente: {formatBRL(summary.totalPendente)}
          </p>
        </div>

        <div
          className={`rounded-[24px] p-5 min-w-0 border transition ${
            summary.totalAtrasado > 0
              ? 'bg-rose-500/15 border-rose-500/70 shadow-md'
              : 'liquid-glass'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                summary.totalAtrasado > 0 ? 'text-rose-800' : 'text-slate-600'
              }`}
            >
              Total Atrasado
            </span>
            {summary.totalAtrasado > 0 && (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
          </div>
          <p
            className={`text-2xl font-mono font-black mt-1.5 ${
              summary.totalAtrasado > 0 ? 'text-rose-800' : 'text-slate-900'
            }`}
          >
            {formatBRL(summary.totalAtrasado)}
          </p>
          <span
            className={`text-xs font-semibold mt-1 block ${
              summary.totalAtrasado > 0 ? 'text-rose-800' : 'text-slate-600'
            }`}
          >
            {summary.countAtrasado} despesa(s) vencida(s)
          </span>
        </div>

        <div className="liquid-glass rounded-[24px] p-5 min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
            Maior Gasto
          </span>
          {summary.topCategory ? (
            <>
              <p className="text-lg font-extrabold text-slate-900 mt-1.5 truncate">
                {summary.topCategory.label}
              </p>
              <p className="text-sm font-mono font-bold text-indigo-700 mt-0.5">
                {formatBRL(summary.topCategory.amount)} ({summary.topCategory.percentage.toFixed(1)}%)
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500 mt-2">
              Sem lançamentos ativos
            </p>
          )}
        </div>
      </div>

      {/* Category Chart */}
      <div className="liquid-glass rounded-[28px] p-4 sm:p-6 space-y-4 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0" />
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Distribuição por Categoria (Exclui Cancelados)
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-600">
            {summary.byCategory.length} categoria(s) com gasto no período
          </span>
        </div>
        <ResponsiveCategoryChart
          items={summary.byCategory}
          total={summary.totalPeriodo}
        />
      </div>

      {/* Filter Bar + Launches List */}
      <div className="liquid-glass rounded-[28px] overflow-hidden min-w-0">
        <div className="p-4 sm:p-5 border-b border-white/60 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por descrição ou fornecedor..."
                className="liquid-glass-input w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl text-base text-slate-900"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as ExpenseCategoryKey | 'todas')
                  }
                  aria-label="Filtrar por categoria"
                  className="liquid-glass-input min-h-[44px] px-3 py-2 rounded-xl text-base font-semibold text-slate-900 w-full sm:w-auto"
                >
                  <option value="todas">Todas as categorias</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ExpenseDisplayStatus | 'todos')
                }
                aria-label="Filtrar por status"
                className="liquid-glass-input min-h-[44px] px-3 py-2 rounded-xl text-base font-semibold text-slate-900 w-full sm:w-auto"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Lançamentos filtrados</span>
            <span className="font-mono text-slate-900">
              {filteredExpenses.length} registro(s)
            </span>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">
              Nenhuma despesa encontrada para os filtros selecionados.
            </p>
            <p className="text-xs text-slate-600">
              Ajuste o período/filtros acima ou cadastre um novo lançamento para monitorar os custos.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={openCreateModal}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeira Despesa</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Cards (< 768px) — zero horizontal overflow */}
            <div className="md:hidden divide-y divide-white/55">
              {filteredExpenses.map((exp) => {
                const eff = computeExpenseEffectiveStatus(exp, todayGoiasIso);
                const statusMeta = EXPENSE_STATUS_META[eff];
                const catMeta = EXPENSE_CATEGORY_MAP[exp.categoria];
                const payMeta = EXPENSE_PAYMENT_META[exp.forma_pagamento];

                return (
                  <div key={exp.id} className="p-4 space-y-2.5 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${catMeta?.badgeClass}`}
                        >
                          {catMeta?.label || exp.categoria}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusMeta?.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta?.dotClass}`} />
                          {statusMeta?.label}
                        </span>
                      </div>
                      <span className="font-mono text-base font-black text-slate-900 shrink-0">
                        {formatBRL(exp.valor)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs min-w-0">
                      <div className="min-w-0">
                        <span className="text-slate-500 font-semibold block">Competência</span>
                        <span className="font-bold text-slate-800">
                          {formatDateBR(exp.data_competencia)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-500 font-semibold block">Pagamento</span>
                        <span className="font-bold text-slate-800">
                          {payMeta?.label || exp.forma_pagamento}
                        </span>
                      </div>
                      {exp.descricao && (
                        <div className="col-span-2 min-w-0">
                          <span className="text-slate-500 font-semibold block">Descrição</span>
                          <span className="font-semibold text-slate-900 break-words">
                            {exp.descricao}
                          </span>
                        </div>
                      )}
                      {exp.fornecedor && (
                        <div className="col-span-2 min-w-0">
                          <span className="text-slate-500 font-semibold block">Fornecedor</span>
                          <span className="font-semibold text-slate-800 break-words">
                            {exp.fornecedor}
                          </span>
                        </div>
                      )}
                      {exp.data_vencimento && (
                        <div className="min-w-0">
                          <span className="text-slate-500 font-semibold block">Vencimento</span>
                          <span className="font-semibold text-slate-800">
                            {formatDateBR(exp.data_vencimento)}
                          </span>
                        </div>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          className="liquid-glass-pill min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-600" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(exp);
                          }}
                          className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-300/70 text-xs font-bold text-rose-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30">
                    {(
                      [
                        ['data_competencia', 'Competência'],
                        ['categoria', 'Categoria'],
                        ['descricao', 'Descrição'],
                        ['fornecedor', 'Fornecedor'],
                        ['valor', 'Valor'],
                        ['forma_pagamento', 'Pagamento'],
                        ['status', 'Status'],
                      ] as const
                    ).map(([field, label]) => (
                      <th key={field} className="py-3 px-3.5 font-extrabold">
                        <button
                          type="button"
                          onClick={() => toggleSort(field)}
                          className="inline-flex items-center gap-1 hover:text-indigo-700 cursor-pointer min-h-[32px]"
                        >
                          <span>{label}</span>
                          <ArrowDownUp className="w-3 h-3 opacity-60" />
                        </button>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-extrabold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/45 text-xs">
                  {filteredExpenses.map((exp) => {
                    const eff = computeExpenseEffectiveStatus(exp, todayGoiasIso);
                    const statusMeta = EXPENSE_STATUS_META[eff];
                    const catMeta = EXPENSE_CATEGORY_MAP[exp.categoria];
                    const payMeta = EXPENSE_PAYMENT_META[exp.forma_pagamento];

                    return (
                      <tr key={exp.id} className="hover:bg-white/35 transition-colors">
                        <td className="py-3.5 px-3.5 whitespace-nowrap font-mono font-bold text-slate-800">
                          {formatDateBR(exp.data_competencia)}
                          {exp.data_vencimento && (
                            <span className="block text-[10px] font-normal text-slate-500">
                              Venc: {formatDateBR(exp.data_vencimento)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${catMeta?.badgeClass}`}
                          >
                            {catMeta?.label || exp.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 max-w-[240px]">
                          <span
                            title={exp.descricao || '—'}
                            className="font-semibold text-slate-900 block truncate"
                          >
                            {exp.descricao || '—'}
                          </span>
                          {exp.observacao && (
                            <span
                              title={exp.observacao}
                              className="text-[10px] text-slate-500 block truncate"
                            >
                              {exp.observacao}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 max-w-[160px]">
                          <span
                            title={exp.fornecedor || '—'}
                            className="font-medium text-slate-700 block truncate"
                          >
                            {exp.fornecedor || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap font-mono font-black text-slate-900">
                          {formatBRL(exp.valor)}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap font-semibold text-slate-700">
                          {payMeta?.short || exp.forma_pagamento}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusMeta?.badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusMeta?.dotClass}`}
                            />
                            {statusMeta?.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {canEdit ? (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(exp)}
                                aria-label="Editar despesa"
                                title="Editar despesa"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-white/70 hover:bg-indigo-500/15 text-slate-700 hover:text-indigo-700 border border-white/80 cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget(exp);
                                }}
                                aria-label="Excluir despesa"
                                title="Excluir despesa"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-white/70 hover:bg-rose-500/20 text-slate-600 hover:text-rose-700 border border-white/80 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Somente leitura</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal — bottom-sheet on <768px, centered dialog on >=768px */}
      {formOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? 'Editar despesa' : 'Nova despesa'}
            className="liquid-glass w-full md:max-w-2xl max-h-[92dvh] rounded-t-[28px] md:rounded-[28px] flex flex-col overflow-hidden shadow-2xl border border-white/80"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/60 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingId ? 'Editar Despesa' : 'Lançar Nova Despesa'}
                </h4>
                <p className="text-xs text-slate-600">
                  Campos marcados com * são obrigatórios.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Fechar modal"
                className="min-h-[44px] min-w-[44px] rounded-full liquid-glass-pill inline-flex items-center justify-center text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {networkError && (
                <div className="rounded-2xl bg-rose-500/15 border border-rose-500/60 p-3.5 text-xs font-bold text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>{networkError}</span>
                </div>
              )}

              {formSuccessNote && (
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/60 p-3.5 text-xs font-bold text-emerald-900">
                  {formSuccessNote}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formState.categoria}
                    onChange={(e) => {
                      const nextCat = e.target.value as ExpenseCategoryKey;
                      setFormState((prev) => ({ ...prev, categoria: nextCat }));
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        if (nextCat !== 'outros') delete copy.descricao;
                        return copy;
                      });
                    }}
                    className="liquid-glass-input w-full min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formState.valorDisplay}
                      onChange={(e) => {
                        const parsed = parseCurrencyMask(e.target.value);
                        setFormState((prev) => ({
                          ...prev,
                          valorNum: parsed,
                          valorDisplay: formatCurrencyMask(parsed),
                        }));
                        setFormErrors((prev) => ({ ...prev, valor: '' }));
                      }}
                      aria-label="Valor em reais"
                      className="liquid-glass-input w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl text-base font-mono font-bold text-slate-900"
                    />
                  </div>
                  {formErrors.valor && (
                    <p className="text-xs font-bold text-rose-700 mt-1">
                      {formErrors.valor}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Descrição{' '}
                    {formState.categoria === 'outros' ? (
                      <span className="text-rose-700">* (obrigatória para Outros)</span>
                    ) : (
                      <span className="text-slate-500 font-semibold">(opcional)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formState.descricao}
                    onChange={(e) => {
                      setFormState((prev) => ({ ...prev, descricao: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, descricao: '' }));
                    }}
                    placeholder={
                      formState.categoria === 'outros'
                        ? 'Descreva o gasto (mínimo 3 caracteres)...'
                        : 'Ex.: Reposição de lâminas 2pt, conta mensal...'
                    }
                    className={`liquid-glass-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-base text-slate-900 ${
                      formErrors.descricao ? 'ring-2 ring-rose-500' : ''
                    }`}
                  />
                  {formErrors.descricao && (
                    <p className="text-xs font-bold text-rose-700 mt-1">
                      {formErrors.descricao}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Data de Competência *
                  </label>
                  <input
                    type="date"
                    value={formState.data_competencia}
                    onChange={(e) => {
                      setFormState((prev) => ({
                        ...prev,
                        data_competencia: e.target.value,
                      }));
                      setFormErrors((prev) => ({ ...prev, data_competencia: '' }));
                    }}
                    className="liquid-glass-input w-full min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
                  />
                  {formErrors.data_competencia && (
                    <p className="text-xs font-bold text-rose-700 mt-1">
                      {formErrors.data_competencia}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={formState.data_vencimento}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        data_vencimento: e.target.value,
                      }))
                    }
                    className="liquid-glass-input w-full min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Status *
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as ExpenseStatus;
                      setFormState((prev) => ({
                        ...prev,
                        status: nextStatus,
                        data_pagamento:
                          nextStatus === 'pago' && !prev.data_pagamento
                            ? todayGoiasIso
                            : prev.data_pagamento,
                      }));
                    }}
                    className="liquid-glass-input w-full min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={formState.forma_pagamento}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        forma_pagamento: e.target.value as ExpensePaymentMethod,
                      }))
                    }
                    className="liquid-glass-input w-full min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
                  >
                    {(Object.keys(EXPENSE_PAYMENT_META) as ExpensePaymentMethod[]).map(
                      (pm) => (
                        <option key={pm} value={pm}>
                          {EXPENSE_PAYMENT_META[pm].label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Data de Pagamento
                  </label>
                  <input
                    type="date"
                    value={formState.data_pagamento}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        data_pagamento: e.target.value,
                      }))
                    }
                    className="liquid-glass-input w-full min-h-[44px] px-3 py-2 rounded-xl text-base text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formState.fornecedor}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, fornecedor: e.target.value }))
                    }
                    placeholder="Nome do fornecedor..."
                    className="liquid-glass-input w-full min-h-[44px] px-3.5 py-2 rounded-xl text-base text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                    Observação
                  </label>
                  <textarea
                    rows={2}
                    value={formState.observacao}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, observacao: e.target.value }))
                    }
                    placeholder="Notas adicionais (opcional)..."
                    className="liquid-glass-input w-full px-3.5 py-2.5 rounded-xl text-base text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Fixed Action Bar */}
            <div className="px-5 py-4 border-t border-white/60 bg-white/50 flex flex-wrap items-center justify-end gap-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                disabled={saving}
                onClick={() => setFormOpen(false)}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-sm font-bold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>

              {!editingId && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-sm font-bold text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar e adicionar outro</span>
                </button>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="min-h-[44px] px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar exclusão de despesa"
            className="liquid-glass w-full md:max-w-md rounded-t-[28px] md:rounded-[28px] p-6 space-y-4 shadow-2xl border border-white/80 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-extrabold text-slate-900">
                  Excluir Despesa
                </h4>
                <p className="text-xs text-slate-700 mt-1">
                  Tem certeza que deseja excluir o lançamento{' '}
                  <strong>
                    {EXPENSE_CATEGORY_MAP[deleteTarget.categoria]?.label}
                  </strong>{' '}
                  no valor de <strong>{formatBRL(deleteTarget.valor)}</strong>?
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/60 p-3 text-xs font-bold text-rose-900">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-sm font-bold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="min-h-[44px] px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
