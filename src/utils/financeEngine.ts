import {
  DeliveryMethod,
  DieOrder,
  ExpenseCategoryKey,
  ExpenseDisplayStatus,
  ExpensePaymentMethod,
  ExpenseRecord,
  InvestmentType,
  PaymentModality,
  PaymentStatus,
  ProductionStage,
  ReturnStatus,
} from '../types/order';

export const PRODUCTION_STAGES: {
  id: ProductionStage;
  step: number;
  label: string;
  shortLabel: string;
  subtitle: string;
  accentColor: string;
  dotClass: string;
}[] = [
  {
    id: 'arquivo_recebido',
    step: 1,
    label: 'Arquivo Recebido',
    shortLabel: '1. Arquivo',
    subtitle: 'CAD / PDF / Amostra na triagem',
    accentColor: 'border-white/70',
    dotClass: 'bg-slate-400',
  },
  {
    id: 'desenho_produzido',
    step: 2,
    label: 'Desenho Produzido',
    shortLabel: '2. Desenho CAD',
    subtitle: 'EngView / Projeto técnico pronto',
    accentColor: 'border-indigo-300/70',
    dotClass: 'bg-indigo-500',
  },
  {
    id: 'faca_serrada',
    step: 3,
    label: 'Faca Serrada',
    shortLabel: '3. Serrada / Laser',
    subtitle: 'Madeira cortada e calada',
    accentColor: 'border-sky-300/70',
    dotClass: 'bg-sky-500',
  },
  {
    id: 'faca_dobrada',
    step: 4,
    label: 'Faca Dobrada',
    shortLabel: '4. Lâmina Dobrada',
    subtitle: 'Lâminas de corte e vinco conformadas',
    accentColor: 'border-purple-300/70',
    dotClass: 'bg-purple-500',
  },
  {
    id: 'faca_ajustada',
    step: 5,
    label: 'Faca Ajustada',
    shortLabel: '5. Ajustada / Borracha',
    subtitle: 'Cravação, esquadro e emborrachamento',
    accentColor: 'border-amber-300/70',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'faca_pronta',
    step: 6,
    label: 'Faca Pronta',
    shortLabel: '6. Faca Pronta',
    subtitle: 'Liberada para expedição / entrega',
    accentColor: 'border-emerald-300/70',
    dotClass: 'bg-emerald-500',
  },
];

export const PAYMENT_MODALITY_META: Record<
  PaymentModality,
  {
    label: string;
    short: string;
    colorHex: string;
    badgeClass: string;
    defaultDays: number;
  }
> = {
  pix: {
    label: 'Pix',
    short: 'Pix',
    colorHex: '#10b981', // verde-água
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/50',
    defaultDays: 0,
  },
  boleto: {
    label: 'Boleto (15/30)',
    short: 'Boleto (15/30)',
    colorHex: '#4f46e5', // azul
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-400/50',
    defaultDays: 30,
  },
  dinheiro: {
    label: 'Dinheiro',
    short: 'Dinheiro',
    colorHex: '#22c55e', // verde
    badgeClass: 'bg-green-500/15 text-green-800 border-green-400/50',
    defaultDays: 0,
  },
  cartao: {
    label: 'Cartão',
    short: 'Cartão',
    colorHex: '#f59e0b', // laranja
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-400/50',
    defaultDays: 2,
  },
  nao_pago: {
    label: 'Não Pago',
    short: 'Não Pago',
    colorHex: '#64748b', // cinza
    badgeClass: 'bg-white/60 text-slate-700 border-white/80',
    defaultDays: 0,
  },
};

export const EXPENSE_CATEGORIES: {
  key: ExpenseCategoryKey;
  label: string;
  colorHex: string;
  badgeClass: string;
}[] = [
  { key: 'aluguel', label: 'Aluguel', colorHex: '#4f46e5', badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60' },
  { key: 'agua', label: 'Água', colorHex: '#0ea5e9', badgeClass: 'bg-sky-500/15 text-sky-800 border-sky-300/60' },
  { key: 'energia', label: 'Energia', colorHex: '#eab308', badgeClass: 'bg-yellow-500/15 text-yellow-800 border-yellow-300/60' },
  { key: 'internet', label: 'Internet', colorHex: '#06b6d4', badgeClass: 'bg-cyan-500/15 text-cyan-800 border-cyan-300/60' },
  { key: 'alimentacao', label: 'Alimentação', colorHex: '#f97316', badgeClass: 'bg-orange-500/15 text-orange-800 border-orange-300/60' },
  { key: 'transportes', label: 'Transportes', colorHex: '#d97706', badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300/60' },
  { key: 'manutencao', label: 'Manutenção', colorHex: '#8b5cf6', badgeClass: 'bg-violet-500/15 text-violet-800 border-violet-300/60' },
  { key: 'custo_depreciacao', label: 'Custo de Depreciação', colorHex: '#7c3aed', badgeClass: 'bg-purple-500/15 text-purple-800 border-purple-300/60' },
  { key: 'contador', label: 'Contador', colorHex: '#6366f1', badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60' },
  { key: 'marketing', label: 'Marketing', colorHex: '#ec4899', badgeClass: 'bg-pink-500/15 text-pink-800 border-pink-300/60' },
  { key: 'financiamento', label: 'Financiamento', colorHex: '#64748b', badgeClass: 'bg-slate-500/15 text-slate-800 border-slate-300/60' },
  { key: 'laminas', label: 'Lâminas', colorHex: '#14b8a6', badgeClass: 'bg-teal-500/15 text-teal-800 border-teal-300/60' },
  { key: 'madeira', label: 'Madeira', colorHex: '#d97706', badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-300/60' },
  { key: 'seguros', label: 'Seguros', colorHex: '#2563eb', badgeClass: 'bg-blue-500/15 text-blue-800 border-blue-300/60' },
  { key: 'impostos', label: 'Impostos', colorHex: '#dc2626', badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-300/60' },
  { key: 'flow_dashboard', label: 'Flow Dashboard', colorHex: '#4338ca', badgeClass: 'bg-indigo-500/15 text-indigo-900 border-indigo-400/60' },
  { key: 'taxas_bancarias', label: 'Taxas Bancárias', colorHex: '#0f766e', badgeClass: 'bg-teal-500/15 text-teal-900 border-teal-400/60' },
  { key: 'folha_colaboradores', label: 'Folha / Colaboradores', colorHex: '#0284c7', badgeClass: 'bg-sky-500/15 text-sky-900 border-sky-400/60' },
  { key: 'prestadores_servico', label: 'Prestação de Serviços', colorHex: '#0ea5e9', badgeClass: 'bg-cyan-500/15 text-cyan-900 border-cyan-400/60' },
  { key: 'outros', label: 'Outros', colorHex: '#71717a', badgeClass: 'bg-zinc-500/15 text-zinc-800 border-zinc-300/60' },
];

export const EXPENSE_CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.key, c])
) as Record<ExpenseCategoryKey, (typeof EXPENSE_CATEGORIES)[number]>;

export function normalizeExpenseCategory(raw?: string | null): ExpenseCategoryKey {
  const clean = String(raw || '').trim();
  if (!clean) return 'outros';
  const lower = clean.toLowerCase();
  if (lower === 'combustivel' || lower === 'combustível') return 'transportes';
  if (lower in EXPENSE_CATEGORY_MAP) return lower as ExpenseCategoryKey;
  return 'outros';
}

export const EXPENSE_PAYMENT_META: Record<
  ExpensePaymentMethod,
  { label: string; short: string }
> = {
  pix: { label: 'Pix', short: 'Pix' },
  boleto_15: { label: 'Boleto 15 dias', short: 'Boleto 15d' },
  boleto_30: { label: 'Boleto 30 dias', short: 'Boleto 30d' },
  dinheiro: { label: 'Dinheiro', short: 'Dinheiro' },
  cartao: { label: 'Cartão', short: 'Cartão' },
  nao_pago: { label: 'Não Pago', short: 'Não Pago' },
};

export const EXPENSE_STATUS_META: Record<
  ExpenseDisplayStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pago: {
    label: 'Pago',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/60',
    dotClass: 'bg-emerald-600',
  },
  pendente: {
    label: 'Pendente',
    badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-400/60',
    dotClass: 'bg-amber-500',
  },
  atrasado: {
    label: 'Atrasado',
    badgeClass: 'bg-rose-500/20 text-rose-800 border-rose-500/70',
    dotClass: 'bg-rose-600',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-slate-500/15 text-slate-600 border-slate-300/70',
    dotClass: 'bg-slate-400',
  },
};

export const INVESTMENT_TYPE_META: Record<
  InvestmentType,
  { label: string; badgeClass: string }
> = {
  aplicacao: {
    label: 'Aplicação',
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60',
  },
  consorcio: {
    label: 'Consórcio',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60',
  },
  outros: {
    label: 'Outros',
    badgeClass: 'bg-slate-500/15 text-slate-800 border-slate-300/60',
  },
};

export function normalizeInvestmentType(raw?: string): InvestmentType {
  if (raw === 'consorcio') return 'consorcio';
  if (raw === 'outros' || raw === 'outro') return 'outros';
  return 'aplicacao';
}

export function createEmptyExpensesMap(): Record<ExpenseCategoryKey, number> {
  return {
    aluguel: 0,
    agua: 0,
    energia: 0,
    internet: 0,
    alimentacao: 0,
    transportes: 0,
    manutencao: 0,
    custo_depreciacao: 0,
    contador: 0,
    marketing: 0,
    financiamento: 0,
    laminas: 0,
    madeira: 0,
    seguros: 0,
    impostos: 0,
    flow_dashboard: 0,
    taxas_bancarias: 0,
    folha_colaboradores: 0,
    prestadores_servico: 0,
    outros: 0,
  };
}

export function formatCurrencyMask(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function parseCurrencyMask(rawInput: string): number {
  const digits = rawInput.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
}

export const DELIVERY_METHOD_META: Record<
  DeliveryMethod,
  { label: string; badgeClass: string }
> = {
  cliente_buscou: {
    label: 'Cliente Veio Buscar',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/50',
  },
  uber_flash: {
    label: 'Enviado por Uber Flash',
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-400/50',
  },
  entregador_proprio: {
    label: 'Entregador Próprio',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-400/50',
  },
  portador: {
    label: 'Retirado por Portador',
    badgeClass: 'bg-white/60 text-slate-700 border-white/80',
  },
};

export const RETURN_STATUS_META: Record<
  ReturnStatus,
  { label: string; badgeClass: string; dotClass: string; next?: ReturnStatus }
> = {
  em_analise: {
    label: 'Em Análise',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-400/50',
    dotClass: 'bg-amber-500',
    next: 'em_ajuste',
  },
  em_ajuste: {
    label: 'Em Ajuste de Bancada',
    badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-400/50',
    dotClass: 'bg-rose-500',
    next: 'liberado',
  },
  liberado: {
    label: 'Liberado Novamente',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/50',
    dotClass: 'bg-emerald-500',
  },
};

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function getTodayGoiasISO(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    const goiasMs = date.getTime() - 3 * 3600 * 1000;
    return new Date(goiasMs).toISOString().slice(0, 10);
  }
}

export function formatDateTimeGoiasBR(isoDateOrTs?: string): string {
  if (!isoDateOrTs) return '—';
  const dt = new Date(isoDateOrTs);
  if (Number.isNaN(dt.getTime())) return isoDateOrTs;
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dt);
  } catch {
    return isoDateOrTs;
  }
}

export function toISODate(date: Date = new Date()): string {
  return getTodayGoiasISO(date);
}

export function roundCurrencyBRL(value: number): number {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe <= 0) return 0;
  return Math.round(safe * 100) / 100;
}

export function formatDecimalBR(value: number): string {
  const safe = Number.isFinite(value) ? roundCurrencyBRL(value) : 0;
  return safe.toFixed(2).replace('.', ',');
}

export function computeExpenseEffectiveStatus(
  expense: Pick<ExpenseRecord, 'status' | 'data_vencimento'>,
  todayGoiasIso: string = getTodayGoiasISO()
): ExpenseDisplayStatus {
  if (
    expense.status === 'pendente' &&
    expense.data_vencimento &&
    expense.data_vencimento.slice(0, 10) < todayGoiasIso.slice(0, 10)
  ) {
    return 'atrasado';
  }
  return expense.status;
}

export type ExpensePeriodPreset =
  | 'mes_atual'
  | 'mes_anterior'
  | 'trimestre'
  | 'ano'
  | 'personalizado';

export function getExpensePeriodRange(
  preset: ExpensePeriodPreset,
  customStart?: string,
  customEnd?: string,
  todayGoiasIso: string = getTodayGoiasISO()
): { start: string; end: string } {
  const [y, m] = todayGoiasIso.slice(0, 10).split('-').map(Number);
  const lastDayOfMonth = (yr: number, mo: number) =>
    String(new Date(yr, mo, 0).getDate()).padStart(2, '0');
  const pad = (n: number) => String(n).padStart(2, '0');

  if (preset === 'mes_atual') {
    return {
      start: `${y}-${pad(m)}-01`,
      end: `${y}-${pad(m)}-${lastDayOfMonth(y, m)}`,
    };
  }
  if (preset === 'mes_anterior') {
    const prevY = m === 1 ? y - 1 : y;
    const prevM = m === 1 ? 12 : m - 1;
    return {
      start: `${prevY}-${pad(prevM)}-01`,
      end: `${prevY}-${pad(prevM)}-${lastDayOfMonth(prevY, prevM)}`,
    };
  }
  if (preset === 'trimestre') {
    const qStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
    const qEndMonth = qStartMonth + 2;
    return {
      start: `${y}-${pad(qStartMonth)}-01`,
      end: `${y}-${pad(qEndMonth)}-${lastDayOfMonth(y, qEndMonth)}`,
    };
  }
  if (preset === 'ano') {
    return {
      start: `${y}-01-01`,
      end: `${y}-12-31`,
    };
  }
  return {
    start: (customStart || `${y}-${pad(m)}-01`).slice(0, 10),
    end: (customEnd || todayGoiasIso).slice(0, 10),
  };
}

export function validateExpenseInput(input: {
  categoria: ExpenseCategoryKey;
  descricao: string;
  valor: number;
  data_competencia: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const val = roundCurrencyBRL(input.valor);
  if (!Number.isFinite(val) || val <= 0) {
    errors.valor = 'Informe um valor maior que R$ 0,00.';
  }
  if (!input.data_competencia || !/^\d{4}-\d{2}-\d{2}$/.test(input.data_competencia.slice(0, 10))) {
    errors.data_competencia = 'Informe a data de competência válida.';
  }
  if (input.categoria === 'outros' && input.descricao.trim().length < 3) {
    errors.descricao = 'Para a categoria "Outros", a descrição é obrigatória (mínimo 3 caracteres).';
  }
  return errors;
}

export interface ExpensesSummary {
  totalPeriodo: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  countAtrasado: number;
  countAtivos: number;
  topCategory: {
    key: ExpenseCategoryKey;
    label: string;
    colorHex: string;
    amount: number;
    percentage: number;
  } | null;
  byCategory: {
    key: ExpenseCategoryKey;
    label: string;
    colorHex: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

export function computeExpensesSummary(
  expenses: ExpenseRecord[],
  todayGoiasIso: string = getTodayGoiasISO()
): ExpensesSummary {
  let totalPeriodo = 0;
  let totalPago = 0;
  let totalPendente = 0;
  let totalAtrasado = 0;
  let countAtrasado = 0;
  let countAtivos = 0;

  const catTotals = new Map<ExpenseCategoryKey, { amount: number; count: number }>();

  for (const exp of expenses) {
    if (exp.deleted_at || exp.status === 'cancelado') continue;
    const val = roundCurrencyBRL(exp.valor);
    countAtivos += 1;
    totalPeriodo = roundCurrencyBRL(totalPeriodo + val);

    const eff = computeExpenseEffectiveStatus(exp, todayGoiasIso);
    if (eff === 'pago') {
      totalPago = roundCurrencyBRL(totalPago + val);
    } else if (eff === 'atrasado') {
      totalPendente = roundCurrencyBRL(totalPendente + val);
      totalAtrasado = roundCurrencyBRL(totalAtrasado + val);
      countAtrasado += 1;
    } else {
      totalPendente = roundCurrencyBRL(totalPendente + val);
    }

    const curCat = normalizeExpenseCategory(exp.categoria);
    const cur = catTotals.get(curCat) || { amount: 0, count: 0 };
    catTotals.set(curCat, {
      amount: roundCurrencyBRL(cur.amount + val),
      count: cur.count + 1,
    });
  }

  const byCategory = EXPENSE_CATEGORIES.map((cat) => {
    const stats = catTotals.get(cat.key) || { amount: 0, count: 0 };
    return {
      key: cat.key,
      label: cat.label,
      colorHex: cat.colorHex,
      amount: stats.amount,
      count: stats.count,
      percentage:
        totalPeriodo > 0 ? Math.round((stats.amount / totalPeriodo) * 1000) / 10 : 0,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    totalPeriodo,
    totalPago,
    totalPendente,
    totalAtrasado,
    countAtrasado,
    countAtivos,
    topCategory: byCategory[0]
      ? {
          key: byCategory[0].key,
          label: byCategory[0].label,
          colorHex: byCategory[0].colorHex,
          amount: byCategory[0].amount,
          percentage: byCategory[0].percentage,
        }
      : null,
    byCategory,
  };
}

export function buildExpensesCsvContent(
  expenses: ExpenseRecord[],
  todayGoiasIso: string = getTodayGoiasISO()
): string {
  const esc = (raw: string | undefined | null) => {
    const s = String(raw ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };
  const header = [
    'Data Competência',
    'Categoria',
    'Descrição',
    'Fornecedor',
    'Valor (R$)',
    'Forma de Pagamento',
    'Status',
    'Vencimento',
    'Pagamento',
    'Observação',
  ].join(';');

  const rows = expenses.map((exp) => {
    const eff = computeExpenseEffectiveStatus(exp, todayGoiasIso);
    const normCat = normalizeExpenseCategory(exp.categoria);
    const catLabel = EXPENSE_CATEGORY_MAP[normCat]?.label || exp.categoria;
    const payLabel = EXPENSE_PAYMENT_META[exp.forma_pagamento]?.label || exp.forma_pagamento;
    const statusLabel = EXPENSE_STATUS_META[eff]?.label || eff;
    return [
      esc(formatDateBR(exp.data_competencia)),
      esc(catLabel),
      esc(exp.descricao),
      esc(exp.fornecedor || ''),
      esc(formatDecimalBR(exp.valor)),
      esc(payLabel),
      esc(statusLabel),
      esc(exp.data_vencimento ? formatDateBR(exp.data_vencimento) : ''),
      esc(exp.data_pagamento ? formatDateBR(exp.data_pagamento) : ''),
      esc(exp.observacao || ''),
    ].join(';');
  });

  return '\uFEFF' + [header, ...rows].join('\r\n');
}

export function nowTimestampBR(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m} às ${h}:${min}`;
}

export function addDays(baseIso: string, days: number): string {
  const clean = (baseIso || toISODate()).slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '—';
  const clean = isoDate.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getDaysDiff(dueDate: string, refIso?: string): number {
  const today = (refIso || toISODate()).slice(0, 10);
  const due = (dueDate || today).slice(0, 10);
  const [ty, tm, td] = today.split('-').map(Number);
  const [dy, dm, dd] = due.split('-').map(Number);
  const tDate = new Date(ty, tm - 1, td, 12, 0, 0);
  const dDate = new Date(dy, dm - 1, dd, 12, 0, 0);
  return Math.round((dDate.getTime() - tDate.getTime()) / 86400000);
}

export function getNextStage(current: ProductionStage): ProductionStage | null {
  const idx = PRODUCTION_STAGES.findIndex((s) => s.id === current);
  if (idx === -1 || idx >= PRODUCTION_STAGES.length - 1) return null;
  return PRODUCTION_STAGES[idx + 1].id;
}

export function getPrevStage(current: ProductionStage): ProductionStage | null {
  const idx = PRODUCTION_STAGES.findIndex((s) => s.id === current);
  if (idx <= 0) return null;
  return PRODUCTION_STAGES[idx - 1].id;
}

export function migratePaymentModality(raw: string): PaymentModality {
  const normalized = String(raw || '').trim().toLowerCase();
  if (normalized === 'pix') return 'pix';
  if (normalized === 'a_prazo' || normalized === 'a prazo' || normalized === 'boleto') {
    return 'boleto';
  }
  if (normalized === 'dinheiro') return 'dinheiro';
  if (normalized === 'cartao' || normalized === 'cartão') return 'cartao';
  if (
    normalized === 'cortesia' ||
    normalized === 'nao_pago' ||
    normalized === 'não pago'
  ) {
    return 'nao_pago';
  }
  return 'boleto';
}

export function normalizeOrderPaymentStatus(order: DieOrder): DieOrder {
  const rawMod = String((order as any).paymentModality || '');
  const isLegacyCortesiaWithValue =
    rawMod.trim().toLowerCase() === 'cortesia' && (Number(order.amount) || 0) > 0;
  if (isLegacyCortesiaWithValue) {
    console.warn(
      `[FacasFlow Migration] Registro de cortesia com valor detectado (${order.id}: ${order.amount}); migração automática ignorada para revisão manual.`
    );
    return order;
  }

  const migratedModality = migratePaymentModality(rawMod);
  const migratedStatus =
    String((order as any).paymentStatus || '').toLowerCase() === 'cortesia'
      ? 'nao_pago'
      : order.paymentStatus;

  // Regra 5.1: pedidos pagos permanecem pagos; pedidos marcados como nao_pago permanecem nao_pago
  // independentemente da forma de pagamento escolhida até o usuário clicar em "Marcar como pago".
  if (
    migratedStatus === 'pago' ||
    migratedStatus === 'nao_pago' ||
    migratedStatus === 'sem_nota'
  ) {
    return {
      ...order,
      paymentModality: migratedModality,
      paymentStatus: migratedStatus,
    };
  }
  const diff = getDaysDiff(order.dueDate);
  const nextStatus: PaymentStatus = diff < 0 ? 'vencido' : 'a_receber';
  return {
    ...order,
    paymentModality: migratedModality,
    paymentStatus: nextStatus,
  };
}

export interface FinancialBreakdown {
  receivable30d: number;
  receivableCount: number;
  unpaidTotal: number;
  unpaidCount: number;
  overdueTotal: number;
  overdueCount: number;
  unbilledTotal: number;
  unbilledCount: number;
  paidTotal: number;
  paidCount: number;
  totalVolume: number;
  byModality: {
    modality: PaymentModality;
    label: string;
    colorHex: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }[];
}

export function computeFinancialBreakdown(orders: DieOrder[]): FinancialBreakdown {
  let receivable30d = 0;
  let receivableCount = 0;
  let unpaidTotal = 0;
  let unpaidCount = 0;
  let overdueTotal = 0;
  let overdueCount = 0;
  let unbilledTotal = 0;
  let unbilledCount = 0;
  let paidTotal = 0;
  let paidCount = 0;
  let totalVolume = 0;

  const modalityTotals: Record<PaymentModality, { amount: number; count: number }> = {
    pix: { amount: 0, count: 0 },
    boleto: { amount: 0, count: 0 },
    dinheiro: { amount: 0, count: 0 },
    cartao: { amount: 0, count: 0 },
    nao_pago: { amount: 0, count: 0 },
  };

  for (const raw of orders) {
    const o = normalizeOrderPaymentStatus(raw);
    const val = o.amount || 0;
    totalVolume += val;

    if (modalityTotals[o.paymentModality]) {
      modalityTotals[o.paymentModality].amount += val;
      modalityTotals[o.paymentModality].count += 1;
    }

    switch (o.paymentStatus) {
      case 'pago':
        paidTotal += val;
        paidCount += 1;
        break;
      case 'nao_pago':
        unpaidTotal += val;
        unpaidCount += 1;
        receivable30d += val;
        receivableCount += 1;
        break;
      case 'vencido':
        overdueTotal += val;
        overdueCount += 1;
        break;
      case 'sem_nota':
        unbilledTotal += val;
        unbilledCount += 1;
        break;
      case 'a_receber':
        receivable30d += val;
        receivableCount += 1;
        break;
    }
  }

  const safeTotal = totalVolume > 0 ? totalVolume : 1;
  const byModality = (Object.keys(PAYMENT_MODALITY_META) as PaymentModality[]).map((mod) => {
    const meta = PAYMENT_MODALITY_META[mod];
    const stats = modalityTotals[mod];
    return {
      modality: mod,
      label: meta.label,
      colorHex: meta.colorHex,
      totalAmount: stats.amount,
      count: stats.count,
      percentage: Math.round((stats.amount / safeTotal) * 100),
    };
  });

  return {
    receivable30d,
    receivableCount,
    unpaidTotal,
    unpaidCount,
    overdueTotal,
    overdueCount,
    unbilledTotal,
    unbilledCount,
    paidTotal,
    paidCount,
    totalVolume,
    byModality,
  };
}

export function buildPixClipboardSnippet(order: DieOrder): string {
  return (
    `QUALIFACAS CORTE E VINCO - ${order.id}\n` +
    `Empresa: ${order.companyName}\n` +
    `Ferramenta: ${order.toolDescription}\n` +
    `Valor: ${formatBRL(order.amount)} - ${PAYMENT_MODALITY_META[order.paymentModality]?.short}\n` +
    `Vencimento: ${formatDateBR(order.dueDate)}\n` +
    `Chave Pix CNPJ: 14.528.910/0001-42`
  );
}

export function buildWhatsAppBillingUrl(order: DieOrder): string {
  const digits = (order.companyPhone || '11999990000').replace(/\D/g, '');
  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  const valor = formatBRL(order.amount);
  const venc = formatDateBR(order.dueDate);
  const mod = PAYMENT_MODALITY_META[order.paymentModality]?.label || '';

  let msg = '';
  if (order.paymentStatus === 'vencido') {
    msg =
      `Olá, pessoal da *${order.companyName}*, tudo bem?\n\n` +
      `Consta em aberto no nosso sistema a *${order.id} (${order.toolDescription})*, no valor de *${valor}* (vencimento em ${venc}).\n\n` +
      `Para pagamento via PIX, nossa chave CNPJ é: *14.528.910/0001-42*.\n` +
      `Caso já tenham efetuado a baixa, por gentileza desconsiderem. Obrigado!`;
  } else if (order.paymentStatus === 'sem_nota') {
    msg =
      `Olá, pessoal da *${order.companyName}*!\n\n` +
      `Referente à faca entregue *${order.id} - ${order.toolDescription}* (*${valor}*), estamos gerando o fechamento financeiro.\n\n` +
      `Confirmam o faturamento na modalidade *${mod}* ou preferem PIX (*14.528.910/0001-42*)? Obrigado!`;
  } else {
    msg =
      `Olá, pessoal da *${order.companyName}*!\n\n` +
      `Segue o resumo da *${order.id} - ${order.toolDescription}*:\n` +
      `• *Valor:* ${valor}\n` +
      `• *Modalidade:* ${mod}\n` +
      `• *Vencimento:* ${venc}\n` +
      `• *Chave PIX (CNPJ):* 14.528.910/0001-42\n\n` +
      `Qualquer dúvida estamos à disposição!`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function formatCnpjMask(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function isValidCNPJ(raw: string): boolean {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (slice: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i += 1) {
      sum += Number(slice[i]) * weights[i];
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const d1 = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(digits[12])) return false;

  const d2 = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(digits[13]);
}

export function formatPhoneMask(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatCpfCnpjMask(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return formatCnpjMask(digits);
}

export function isValidCPF(raw: string): boolean {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) {
      sum += Number(digits[i]) * (len + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };

  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export function isValidCpfOrCnpj(raw: string): boolean {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11) return isValidCPF(digits);
  if (digits.length === 14) return isValidCNPJ(digits);
  return false;
}

export function formatQuantityBR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  if (Number.isInteger(safe)) return String(safe);
  return safe.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatStockInt(val?: number | string | null): string {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0';
  return String(Math.max(0, Math.round(num)));
}

export function sanitizeStockIntInput(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '');
}

export function resolveMonthPaymentDate(yearMonth: string, day: number): string {
  const cleanYm = /^\d{4}-\d{2}$/.test(String(yearMonth || '').trim())
    ? String(yearMonth).trim()
    : getTodayGoiasISO().slice(0, 7);
  const [yrStr, moStr] = cleanYm.split('-');
  const yr = Number(yrStr) || new Date().getFullYear();
  const mo = Math.min(12, Math.max(1, Number(moStr) || 1));
  const maxDay = new Date(yr, mo, 0).getDate();
  const safeDay = Math.min(maxDay, Math.max(1, Math.round(Number(day) || 1)));
  return `${yr}-${String(mo).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export const MAX_RECENT_FINISHED_ORDERS = 15;

const STAGE_STAMP_BR_REGEX = /^(\d{2})\/(\d{2})\s+às\s+(\d{2}):(\d{2})$/;

function extractYearMonth(raw?: string): { year: number; month: number } | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const isoMatch = /^(\d{4})-(\d{2})/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    if (Number.isFinite(year) && year > 1970 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed) && parsed > 0) {
    const dt = new Date(parsed);
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1 };
  }
  return null;
}

export function getOrderCompletionTimestampMs(order: DieOrder): number {
  if (order.completedAt) {
    const parsedCompleted = Date.parse(order.completedAt);
    if (Number.isFinite(parsedCompleted) && parsedCompleted > 0) {
      return parsedCompleted;
    }
  }

  const stampCandidates: string[] = [];
  if (Array.isArray(order.stageHistory)) {
    for (let i = order.stageHistory.length - 1; i >= 0; i -= 1) {
      const entry = order.stageHistory[i];
      if (entry?.stage === 'faca_pronta' && entry.timestamp) {
        stampCandidates.push(String(entry.timestamp).trim());
        break;
      }
    }
  }
  if (order.stageUpdatedAt) {
    stampCandidates.push(String(order.stageUpdatedAt).trim());
  }

  for (const candidate of stampCandidates) {
    const match = STAGE_STAMP_BR_REGEX.exec(candidate);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const hour = Number(match[3]);
      const minute = Number(match[4]);

      const createdYm = extractYearMonth(order.createdAt);
      const updatedYm = extractYearMonth(order.updatedAt);
      let year = createdYm?.year ?? updatedYm?.year ?? new Date().getUTCFullYear();

      if (createdYm && month < createdYm.month) {
        year += 1;
      }

      const utcMs = Date.UTC(year, month - 1, day, hour + 3, minute);
      if (Number.isFinite(utcMs) && utcMs > 0) {
        return utcMs;
      }
    } else if (/^\d{4}-\d{2}-\d{2}/.test(candidate)) {
      const isoCand = Date.parse(candidate);
      if (Number.isFinite(isoCand) && isoCand > 0) {
        return isoCand;
      }
    }
  }

  const updatedParsed = order.updatedAt ? Date.parse(order.updatedAt) : NaN;
  if (Number.isFinite(updatedParsed) && updatedParsed > 0) {
    return updatedParsed;
  }
  const createdParsed = order.createdAt ? Date.parse(order.createdAt) : NaN;
  if (Number.isFinite(createdParsed) && createdParsed > 0) {
    return createdParsed;
  }
  return 0;
}

export function partitionFinishedOrders(
  orders: DieOrder[],
  limit: number = MAX_RECENT_FINISHED_ORDERS
): {
  allFinished: DieOrder[];
  recentFinished: DieOrder[];
  storedFinished: DieOrder[];
} {
  const safeLimit = Math.max(
    0,
    Math.floor(Number.isFinite(limit) ? limit : MAX_RECENT_FINISHED_ORDERS)
  );
  const finished = orders.filter((o) => o.stage === 'faca_pronta');
  const completionTsMap = new Map<DieOrder, number>();
  for (const order of finished) {
    completionTsMap.set(order, getOrderCompletionTimestampMs(order));
  }

  const sorted = [...finished].sort((a, b) => {
    const completionDiff =
      (completionTsMap.get(b) ?? 0) - (completionTsMap.get(a) ?? 0);
    if (completionDiff !== 0) return completionDiff;

    const createdDiff =
      (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0);
    if (createdDiff !== 0) return createdDiff;

    const numB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
    const numA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  return {
    allFinished: sorted,
    recentFinished: sorted.slice(0, safeLimit),
    storedFinished: sorted.slice(safeLimit),
  };
}
