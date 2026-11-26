import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  Check,
  Copy,
  FileWarning,
  Loader2,
  MessageCircle,
  PieChart,
  Receipt,
  RotateCcw,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  DieOrder,
  ExpenseRecord,
  InvestmentRecord,
  PaymentStatus,
  PayrollEmployeeRecord,
  ServiceProviderRecord,
} from '../types/order';
import { ExpenseDraftPayload } from '../services/supabaseDataService';
import {
  buildPixClipboardSnippet,
  buildWhatsAppBillingUrl,
  FinancialBreakdown,
  formatBRL,
  formatDateBR,
  getDaysDiff,
  PAYMENT_MODALITY_META,
} from '../utils/financeEngine';
import { CollaboratorsSubsection } from './CollaboratorsSubsection';
import { ExpensesSection } from './ExpensesSection';
import { InvestmentsSubsection } from './InvestmentsSubsection';
import { MonthlyReportSubsection } from './MonthlyReportSubsection';

type FinanceTab =
  | 'visao'
  | 'despesas'
  | 'colaboradores'
  | 'investimentos'
  | 'relatorio_mensal';

interface FinanceAnalyticsSectionProps {
  orders: DieOrder[];
  financials: FinancialBreakdown;
  despesas: ExpenseRecord[];
  canEditDespesas: boolean;
  serviceProviders: ServiceProviderRecord[];
  payrollEmployees: PayrollEmployeeRecord[];
  investments: InvestmentRecord[];
  onTogglePaid: (orderId: string) => Promise<void> | void;
  onEmitBilling30d: (orderId: string) => Promise<void> | void;
  onDeleteOrder: (orderId: string) => Promise<void> | void;
  onCreateExpense: (payload: ExpenseDraftPayload) => Promise<ExpenseRecord>;
  onUpdateExpense: (id: string, payload: ExpenseDraftPayload) => Promise<ExpenseRecord>;
  onDeleteExpense: (id: string) => Promise<void>;
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
  onAddInvestment: (
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => Promise<boolean | void> | void;
  onUpdateInvestment: (
    id: string,
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => Promise<boolean | void> | void;
  onDeleteInvestment: (id: string) => Promise<void> | void;
}

export const FinanceAnalyticsSection: React.FC<FinanceAnalyticsSectionProps> = ({
  orders,
  financials,
  despesas,
  canEditDespesas,
  serviceProviders,
  payrollEmployees,
  investments,
  onTogglePaid,
  onEmitBilling30d,
  onDeleteOrder,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  onAddPayrollEmployee,
  onUpdatePayrollEmployee,
  onDeletePayrollEmployee,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('visao');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'todos'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredModality, setHoveredModality] = useState<string | null>(null);
  const [busyOrderAction, setBusyOrderAction] = useState<string | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'todos') return orders;
    return orders.filter((o) => o.paymentStatus === statusFilter);
  }, [orders, statusFilter]);

  const handleCopyPix = async (order: DieOrder) => {
    const text = buildPixClipboardSnippet(order);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(order.id);
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      setCopiedId((prev) => (prev === order.id ? null : prev));
    }, 2200);
  };

  const runOrderAction = async (key: string, fn: () => Promise<void> | void) => {
    if (busyOrderAction) return;
    setBusyOrderAction(key);
    try {
      await fn();
    } finally {
      setBusyOrderAction(null);
    }
  };

  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  const donutSegments = useMemo(() => {
    let cumulativePercent = 0;
    return financials.byModality
      .filter((m) => m.totalAmount > 0)
      .map((m) => {
        const frac = financials.totalVolume > 0 ? m.totalAmount / financials.totalVolume : 0;
        const strokeDasharray = `${frac * circumference} ${circumference}`;
        const strokeDashoffset = -cumulativePercent * circumference;
        cumulativePercent += frac;
        return {
          ...m,
          strokeDasharray,
          strokeDashoffset,
        };
      });
  }, [financials, circumference]);

  return (
    <div className="space-y-5 min-w-0">
      {/* Header & Finance Module Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
            Finanças e Formas de Pagamento
          </h2>
          <p className="text-xs font-medium text-slate-700">
            Controle do ciclo financeiro, despesas operacionais, colaboradores e investimentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'visao', label: 'Recebimentos e OS', icon: PieChart },
              { id: 'despesas', label: 'Despesas', icon: Receipt },
              { id: 'colaboradores', label: 'Colaboradores', icon: Users },
              { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
              { id: 'relatorio_mensal', label: 'Relatório Mensal', icon: BarChart3 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                    : 'liquid-glass-pill text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'relatorio_mensal' && (
        <MonthlyReportSubsection
          orders={orders}
          despesas={despesas}
          serviceProviders={serviceProviders}
          payrollEmployees={payrollEmployees}
          investments={investments}
        />
      )}

      {activeTab === 'despesas' && (
        <ExpensesSection
          expenses={despesas}
          canEdit={canEditDespesas}
          onCreateExpense={onCreateExpense}
          onUpdateExpense={onUpdateExpense}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {activeTab === 'colaboradores' && (
        <CollaboratorsSubsection
          providers={serviceProviders}
          payrollEmployees={payrollEmployees}
          onAddProvider={onAddProvider}
          onUpdateProvider={onUpdateProvider}
          onDeleteProvider={onDeleteProvider}
          onAddPayrollEmployee={onAddPayrollEmployee}
          onUpdatePayrollEmployee={onUpdatePayrollEmployee}
          onDeletePayrollEmployee={onDeletePayrollEmployee}
        />
      )}

      {activeTab === 'investimentos' && (
        <InvestmentsSubsection
          investments={investments}
          onAddInvestment={onAddInvestment}
          onUpdateInvestment={onUpdateInvestment}
          onDeleteInvestment={onDeleteInvestment}
        />
      )}

      {activeTab === 'visao' && (
        <>
          {/* 1. MÉTRICAS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'a_receber' ? 'todos' : 'a_receber')
              }
              className={`liquid-glass rounded-[28px] p-6 text-left transition cursor-pointer ${
                statusFilter === 'a_receber' ? 'ring-2 ring-emerald-500/70' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  1. Total a Receber
                </span>
                <span className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-300/60">
                  <CalendarClock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-black text-emerald-700 tracking-tight mt-3">
                {formatBRL(financials.receivable30d)}
              </p>
              <span className="text-xs font-medium text-slate-600 mt-1 block">
                {financials.receivableCount} faturas programadas • Caixa quitado{' '}
                <strong className="text-slate-900">{formatBRL(financials.paidTotal)}</strong>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'vencido' ? 'todos' : 'vencido')
              }
              className={`liquid-glass rounded-[28px] p-6 text-left transition cursor-pointer ${
                statusFilter === 'vencido' ? 'ring-2 ring-indigo-500/70' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  2. Faturamentos Vencidos
                </span>
                <span className="p-2 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-300/60">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight mt-3">
                {formatBRL(financials.overdueTotal)}
              </p>
              <span className="text-xs font-medium text-slate-600 mt-1 block">
                {financials.overdueCount} títulos aguardando cobrança
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === 'sem_nota' ? 'todos' : 'sem_nota')
              }
              className={`liquid-glass rounded-[28px] p-6 text-left transition cursor-pointer ${
                statusFilter === 'sem_nota' ? 'ring-2 ring-amber-500/70' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  3. Entregues sem Nota
                </span>
                <span className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-700 border border-indigo-300/60">
                  <FileWarning className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-black text-indigo-700 tracking-tight mt-3">
                {formatBRL(financials.unbilledTotal)}
              </p>
              <span className="text-xs font-medium text-slate-600 mt-1 block">
                {financials.unbilledCount} facas entregues sem cobrança
              </span>
            </button>
          </div>

          {/* 2. GRÁFICO DE FORMAS DE PAGAMENTO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
            <div className="lg:col-span-5 liquid-glass rounded-[28px] p-6 flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Distribuição por Modalidade
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Gráfico de Rosca
                  </h3>
                </div>
                <PieChart className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-6 my-4">
                <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                  <svg className="w-44 h-44 -rotate-90" viewBox="0 0 180 180">
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255,255,255,0.55)"
                      strokeWidth="20"
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.modality}
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="transparent"
                        stroke={seg.colorHex}
                        strokeWidth={hoveredModality === seg.modality ? '24' : '20'}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredModality(seg.modality)}
                        onMouseLeave={() => setHoveredModality(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Volume Total
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono mt-0.5">
                      {formatBRL(financials.totalVolume)}
                    </span>
                    <span className="text-[10px] text-indigo-700 font-bold mt-0.5">
                      {orders.length} OS
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 w-full sm:w-auto">
                  {financials.byModality.map((item) => (
                    <div
                      key={item.modality}
                      onMouseEnter={() => setHoveredModality(item.modality)}
                      onMouseLeave={() => setHoveredModality(null)}
                      className="flex items-center justify-between gap-4 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-md shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="text-slate-700 font-semibold">{item.label}</span>
                      </div>
                      <span className="font-mono font-extrabold text-slate-900">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Comparativo Financeiro e Quantidade de Pedidos
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Volume por Forma de Pagamento
                </h3>
              </div>

              <div className="space-y-3.5 mt-4">
                {financials.byModality.map((item) => (
                  <div key={item.modality} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="font-bold text-slate-900">{item.label}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-slate-700 text-[10px] font-bold">
                          {item.count} {item.count === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </div>
                      <div className="font-mono">
                        <span className="font-extrabold text-slate-900">
                          {formatBRL(item.totalAmount)}
                        </span>
                        <span className="text-slate-600 ml-2 text-[11px] font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-white/50 overflow-hidden p-0.5 border border-white/75 shadow-inner">
                      <div
                        style={{
                          width: `${Math.max(item.count > 0 ? 6 : 0, item.percentage)}%`,
                          backgroundColor: item.colorHex,
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. TABELA DE RECEBIMENTO */}
          <div className="liquid-glass rounded-[28px] overflow-hidden">
            <div className="p-5 border-b border-white/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'a_receber', label: 'A Receber' },
                    { id: 'vencido', label: 'Vencidos' },
                    { id: 'sem_nota', label: 'Entregues sem Nota' },
                    { id: 'pago', label: 'Pagos' },
                    { id: 'nao_pago', label: 'Não Pago' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                      statusFilter === pill.id
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-700 font-mono font-bold">
                {filteredOrders.length} registros
              </span>
            </div>

            {/* Mobile Labeled Cards (< 768px) */}
            <div className="md:hidden divide-y divide-white/55">
              {filteredOrders.length === 0 ? (
                <div className="py-10 px-4 text-center font-medium text-xs text-slate-600">
                  Nenhum lançamento financeiro registrado ainda.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const modMeta = PAYMENT_MODALITY_META[order.paymentModality];
                  const daysDiff = getDaysDiff(order.dueDate);
                  const isCopied = copiedId === order.id;

                  return (
                    <div key={order.id} className="p-4 space-y-2.5 text-xs min-w-0">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="font-mono font-extrabold text-indigo-700 block">
                            {order.id}
                          </span>
                          <span className="font-bold text-slate-900 break-words">
                            {order.companyName}
                          </span>
                        </div>
                        <span className="font-mono text-base font-black text-slate-900 shrink-0">
                          {formatBRL(order.amount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 font-semibold block">Ferramenta</span>
                        <span className="text-slate-800 font-semibold break-words">
                          {order.toolDescription}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${modMeta?.badgeClass}`}
                        >
                          {modMeta?.label}
                        </span>

                        {order.paymentStatus === 'pago' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Liquidado • {formatDateBR(order.paidAt || order.dueDate)}
                          </span>
                        ) : order.paymentStatus === 'nao_pago' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/60 text-slate-700 border border-white/80">
                            Não Pago
                          </span>
                        ) : order.paymentStatus === 'sem_nota' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-300/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Entregue sem Nota
                          </span>
                        ) : order.paymentStatus === 'vencido' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-900 border border-amber-400/70">
                            Vencido há {Math.abs(daysDiff)}d • {formatDateBR(order.dueDate)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                            Vence em {daysDiff}d • {formatDateBR(order.dueDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyPix(order)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-800'
                              : 'liquid-glass-pill text-slate-800'
                          }`}
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{isCopied ? 'Copiado' : 'Copiar Pix'}</span>
                        </button>

                        <a
                          href={buildWhatsAppBillingUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="liquid-glass-pill min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        {order.paymentStatus === 'sem_nota' && (
                          <button
                            type="button"
                            disabled={Boolean(busyOrderAction)}
                            onClick={() =>
                              void runOrderAction(`bill:${order.id}`, () =>
                                onEmitBilling30d(order.id)
                              )
                            }
                            className="min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold bg-amber-500 disabled:opacity-60 text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            {busyOrderAction === `bill:${order.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span>Gerar 30d</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={Boolean(busyOrderAction)}
                          onClick={() =>
                            void runOrderAction(`paid:${order.id}`, () =>
                              onTogglePaid(order.id)
                            )
                          }
                          className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1 disabled:opacity-60 cursor-pointer ${
                            order.paymentStatus === 'pago'
                              ? 'liquid-glass-pill text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          }`}
                        >
                          {busyOrderAction === `paid:${order.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : order.paymentStatus === 'pago' ? (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              <span>Reabrir</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Marcar como pago</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(busyOrderAction)}
                          onClick={() =>
                            void runOrderAction(`del:${order.id}`, () =>
                              onDeleteOrder(order.id)
                            )
                          }
                          aria-label="Excluir esta OS"
                          className="btn-compact w-9 h-9 rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-50 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        >
                          {busyOrderAction === `del:${order.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30">
                    <th className="py-3.5 px-5 font-extrabold">OS / Empresa</th>
                    <th className="py-3.5 px-4 font-extrabold">Ferramenta</th>
                    <th className="py-3.5 px-4 font-extrabold">Modalidade</th>
                    <th className="py-3.5 px-4 font-extrabold">Vencimento / Status</th>
                    <th className="py-3.5 px-4 text-right font-extrabold">Valor</th>
                    <th className="py-3.5 px-5 text-right font-extrabold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/45 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center font-medium text-slate-600">
                        Nenhum lançamento financeiro registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const modMeta = PAYMENT_MODALITY_META[order.paymentModality];
                      const daysDiff = getDaysDiff(order.dueDate);
                      const isCopied = copiedId === order.id;

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-white/35 transition-colors"
                        >
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="font-mono font-extrabold text-indigo-700 block">
                              {order.id}
                            </span>
                            <span className="font-bold text-slate-900">
                              {order.companyName}
                            </span>
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            <span className="text-slate-800 font-semibold block truncate">
                              {order.toolDescription}
                            </span>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${modMeta?.badgeClass}`}
                            >
                              {modMeta?.label}
                            </span>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            {order.paymentStatus === 'pago' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Liquidado • {formatDateBR(order.paidAt || order.dueDate)}
                              </span>
                            ) : order.paymentStatus === 'nao_pago' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/60 text-slate-700 border border-white/80">
                                Não Pago
                              </span>
                            ) : order.paymentStatus === 'sem_nota' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-300/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Entregue sem Nota
                              </span>
                            ) : order.paymentStatus === 'vencido' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-900 border border-amber-400/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                Vencido há {Math.abs(daysDiff)}d • {formatDateBR(order.dueDate)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                Vence em {daysDiff}d • {formatDateBR(order.dueDate)}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-sm font-black text-slate-900">
                            {formatBRL(order.amount)}
                          </td>

                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyPix(order)}
                                className={`px-2.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-800'
                                    : 'liquid-glass-pill text-slate-800'
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Pix</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={buildWhatsAppBillingUrl(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 hover:text-emerald-700 flex items-center gap-1.5 transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Cobrar no WhatsApp</span>
                              </a>

                              {order.paymentStatus === 'sem_nota' && (
                                <button
                                  type="button"
                                  disabled={Boolean(busyOrderAction)}
                                  onClick={() =>
                                    void runOrderAction(`bill:${order.id}`, () =>
                                      onEmitBilling30d(order.id)
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white shadow-sm flex items-center gap-1 transition cursor-pointer"
                                >
                                  {busyOrderAction === `bill:${order.id}` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                  )}
                                  <span>Gerar 30d</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={Boolean(busyOrderAction)}
                                onClick={() =>
                                  void runOrderAction(`paid:${order.id}`, () =>
                                    onTogglePaid(order.id)
                                  )
                                }
                                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 disabled:opacity-60 transition cursor-pointer ${
                                  order.paymentStatus === 'pago'
                                    ? 'liquid-glass-pill text-slate-700'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                }`}
                              >
                                {busyOrderAction === `paid:${order.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : order.paymentStatus === 'pago' ? (
                                  <>
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reabrir</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Marcar como pago</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={Boolean(busyOrderAction)}
                                onClick={() =>
                                  void runOrderAction(`del:${order.id}`, () =>
                                    onDeleteOrder(order.id)
                                  )
                                }
                                className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-50 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                                title="Excluir esta OS"
                                aria-label="Excluir esta OS"
                              >
                                {busyOrderAction === `del:${order.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
