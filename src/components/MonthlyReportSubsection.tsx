import React, { useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Scale,
  TrendingUp,
} from 'lucide-react';
import {
  DieOrder,
  ExpenseRecord,
  InvestmentRecord,
  PayrollEmployeeRecord,
  ServiceProviderRecord,
} from '../types/order';
import {
  EXPENSE_CATEGORY_MAP,
  formatBRL,
  formatDateBR,
  formatDecimalBR,
  getTodayGoiasISO,
  INVESTMENT_TYPE_META,
  PAYMENT_MODALITY_META,
  roundCurrencyBRL,
} from '../utils/financeEngine';

interface MonthlyReportSubsectionProps {
  orders: DieOrder[];
  despesas: ExpenseRecord[];
  serviceProviders: ServiceProviderRecord[];
  payrollEmployees: PayrollEmployeeRecord[];
  investments: InvestmentRecord[];
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

function getMonthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
}

export const MonthlyReportSubsection: React.FC<MonthlyReportSubsectionProps> = ({
  orders,
  despesas,
  serviceProviders,
  payrollEmployees,
  investments,
}) => {
  const todayIso = getTodayGoiasISO();
  const initialYear = Number(todayIso.slice(0, 4)) || new Date().getFullYear();
  const initialMonth = Math.max(
    0,
    Math.min(11, (Number(todayIso.slice(5, 7)) || 1) - 1)
  );

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);

  const selectedMonthKey = getMonthKey(selectedYear, selectedMonth);
  const selectedMonthEnd = `${selectedMonthKey}-31`;

  const availableYears = useMemo(() => {
    const years = new Set<number>([initialYear - 1, initialYear, initialYear + 1]);
    orders.forEach((o) => {
      const y = Number((o.paidAt || o.createdAt || '').slice(0, 4));
      if (y > 2000) years.add(y);
    });
    despesas.forEach((d) => {
      const y = Number((d.data_competencia || '').slice(0, 4));
      if (y > 2000) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, despesas, initialYear]);

  const computeMonthTotals = (monthKey: string) => {
    const monthEnd = `${monthKey}-31`;

    // Entradas efetivamente pagas no mês
    const paidOrders = orders.filter((o) => {
      if (o.paymentStatus !== 'pago') return false;
      const refDate = (o.paidAt || o.createdAt || '').slice(0, 7);
      return refDate === monthKey;
    });
    const unpaidOrdersInMonth = orders.filter((o) => {
      if (o.paymentStatus === 'pago') return false;
      const refDate = (o.createdAt || '').slice(0, 7);
      return refDate === monthKey;
    });

    const totalEntradas = roundCurrencyBRL(
      paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
    );
    const totalNaoPagoMes = roundCurrencyBRL(
      unpaidOrdersInMonth.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
    );

    // Saídas: Despesas ativas (não canceladas) do mês
    const monthExpenses = despesas.filter(
      (d) =>
        !d.deleted_at &&
        d.status !== 'cancelado' &&
        (d.data_competencia || '').slice(0, 7) === monthKey
    );
    const totalDespesas = roundCurrencyBRL(
      monthExpenses.reduce((sum, d) => sum + (Number(d.valor) || 0), 0)
    );

    // Saídas: Prestadores de Serviço com vencimento no mês
    const monthProviders = serviceProviders.filter(
      (p) => (p.dueDate || '').slice(0, 7) === monthKey
    );
    const totalPrestadores = roundCurrencyBRL(
      monthProviders.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    // Saídas: Folha de funcionários admitidos até o mês selecionado
    const activePayroll = payrollEmployees.filter(
      (emp) => !emp.admissionDate || emp.admissionDate.slice(0, 10) <= monthEnd
    );
    const totalFolha = roundCurrencyBRL(
      activePayroll.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0)
    );

    // Investimentos lançados no mês (informativo + detalhamento)
    const monthInvestments = investments.filter(
      (inv) => (inv.appliedDate || '').slice(0, 7) === monthKey
    );
    const totalInvestimentos = roundCurrencyBRL(
      monthInvestments.reduce((sum, inv) => sum + (Number(inv.investedAmount) || 0), 0)
    );

    const totalSaidas = roundCurrencyBRL(
      totalDespesas + totalPrestadores + totalFolha
    );
    const saldoLiquido = Math.round((totalEntradas - totalSaidas) * 100) / 100;

    return {
      paidOrders,
      unpaidOrdersInMonth,
      totalEntradas,
      totalNaoPagoMes,
      monthExpenses,
      totalDespesas,
      monthProviders,
      totalPrestadores,
      activePayroll,
      totalFolha,
      monthInvestments,
      totalInvestimentos,
      totalSaidas,
      saldoLiquido,
    };
  };

  const report = useMemo(
    () => computeMonthTotals(selectedMonthKey),
    [
      selectedMonthKey,
      selectedMonthEnd,
      orders,
      despesas,
      serviceProviders,
      payrollEmployees,
      investments,
    ]
  );

  // Últimos 6 meses comparativos
  const last6Months = useMemo(() => {
    const list: {
      key: string;
      label: string;
      entradas: number;
      saidas: number;
      saldo: number;
    }[] = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const dt = new Date(selectedYear, selectedMonth - offset, 1);
      const key = getMonthKey(dt.getFullYear(), dt.getMonth());
      const calc = computeMonthTotals(key);
      list.push({
        key,
        label: `${MONTH_NAMES[dt.getMonth()].slice(0, 3)}/${String(
          dt.getFullYear()
        ).slice(-2)}`,
        entradas: calc.totalEntradas,
        saidas: calc.totalSaidas,
        saldo: calc.saldoLiquido,
      });
    }
    return list;
  }, [
    selectedYear,
    selectedMonth,
    orders,
    despesas,
    serviceProviders,
    payrollEmployees,
    investments,
  ]);

  const maxBarValue = useMemo(() => {
    const m = last6Months.reduce(
      (acc, row) => Math.max(acc, row.entradas, row.saidas),
      0
    );
    return m > 0 ? m : 1;
  }, [last6Months]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { label: string; colorHex: string; total: number; count: number }>();
    for (const exp of report.monthExpenses) {
      const meta = EXPENSE_CATEGORY_MAP[exp.categoria];
      const key = exp.categoria;
      const cur = map.get(key) || {
        label: meta?.label || key,
        colorHex: meta?.colorHex || '#6366f1',
        total: 0,
        count: 0,
      };
      cur.total = roundCurrencyBRL(cur.total + (Number(exp.valor) || 0));
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [report.monthExpenses]);

  const handleShiftMonth = (delta: number) => {
    const dt = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedYear(dt.getFullYear());
    setSelectedMonth(dt.getMonth());
  };

  const handleExportCsv = () => {
    const esc = (raw: string | number | undefined | null) =>
      `"${String(raw ?? '').replace(/"/g, '""')}"`;

    const lines: string[] = [
      `Fechamento Mensal de Caixa;${MONTH_NAMES[selectedMonth]}/${selectedYear}`,
      '',
      'RESUMO CONSOLIDADO;VALOR (R$)',
      `Total de Entradas (OS Pagas);${esc(formatDecimalBR(report.totalEntradas))}`,
      `Despesas Operacionais;${esc(formatDecimalBR(report.totalDespesas))}`,
      `Prestadores de Serviço;${esc(formatDecimalBR(report.totalPrestadores))}`,
      `Folha de Funcionários;${esc(formatDecimalBR(report.totalFolha))}`,
      `Total de Saídas;${esc(formatDecimalBR(report.totalSaidas))}`,
      `Saldo Líquido;${esc(formatDecimalBR(report.saldoLiquido))}`,
      `Aportes em Investimentos (Informativo);${esc(formatDecimalBR(report.totalInvestimentos))}`,
      `OS em Aberto no Mês (Não Pago);${esc(formatDecimalBR(report.totalNaoPagoMes))}`,
      '',
      'ENTRADAS REALIZADAS (OS PAGAS)',
      'OS;Cliente;Ferramenta;Forma Pagamento;Data Pagamento;Valor (R$)',
      ...report.paidOrders.map((o) =>
        [
          esc(o.id),
          esc(o.companyName),
          esc(o.toolDescription),
          esc(PAYMENT_MODALITY_META[o.paymentModality]?.label || o.paymentModality),
          esc(formatDateBR(o.paidAt || o.createdAt)),
          esc(formatDecimalBR(o.amount)),
        ].join(';')
      ),
      '',
      'SAÍDAS — DESPESAS DO MÊS',
      'Data;Categoria;Descrição;Fornecedor;Status;Valor (R$)',
      ...report.monthExpenses.map((d) =>
        [
          esc(formatDateBR(d.data_competencia)),
          esc(EXPENSE_CATEGORY_MAP[d.categoria]?.label || d.categoria),
          esc(d.descricao || ''),
          esc(d.fornecedor || ''),
          esc(d.status),
          esc(formatDecimalBR(d.valor)),
        ].join(';')
      ),
    ];

    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_mensal_${selectedMonthKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const marginPct =
    report.totalEntradas > 0
      ? (report.saldoLiquido / report.totalEntradas) * 100
      : 0;

  return (
    <div className="space-y-5 min-w-0">
      {/* Header + Seletor Mês/Ano + Exportar */}
      <div className="liquid-glass rounded-[28px] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 mb-1">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              Fechamento de Caixa Mensal
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Relatório Mensal — {MONTH_NAMES[selectedMonth]} de {selectedYear}
          </h3>
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            Consolidação automática de entradas liquidadas, saídas operacionais e saldo líquido do período.
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

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            aria-label="Selecionar mês"
            className="liquid-glass-pill min-h-[40px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-900 outline-none"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Selecionar ano"
            className="liquid-glass-pill min-h-[40px] px-3.5 py-2 rounded-full text-xs font-bold font-mono text-slate-900 outline-none"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            aria-label="Próximo mês"
            className="btn-compact w-10 h-10 rounded-full liquid-glass-pill text-slate-700 hover:text-indigo-700 flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3 KPIs Principais: Entradas, Saídas, Saldo Líquido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="liquid-glass rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Total de Entradas
            </span>
            <span className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-300/60 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-700 font-mono mt-3">
            {formatBRL(report.totalEntradas)}
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            {report.paidOrders.length} OS paga(s) no mês
            {report.totalNaoPagoMes > 0 && (
              <>
                {' '}
                •{' '}
                <span className="text-amber-800">
                  {formatBRL(report.totalNaoPagoMes)} em aberto
                </span>
              </>
            )}
          </p>
        </div>

        <div className="liquid-glass rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Total de Saídas
            </span>
            <span className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-700 border border-rose-300/60 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-rose-700 font-mono mt-3">
            {formatBRL(report.totalSaidas)}
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Despesas {formatBRL(report.totalDespesas)} • Equipe/Prest.{' '}
            {formatBRL(report.totalFolha + report.totalPrestadores)}
          </p>
        </div>

        <div
          className={`rounded-[28px] p-6 border ${
            report.saldoLiquido >= 0
              ? 'liquid-glass ring-1 ring-emerald-400/60'
              : 'bg-rose-500/15 border-rose-400/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Saldo Líquido
            </span>
            <span
              className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${
                report.saldoLiquido >= 0
                  ? 'bg-indigo-500/15 text-indigo-700 border-indigo-300/60'
                  : 'bg-rose-500/20 text-rose-700 border-rose-400/60'
              }`}
            >
              <Scale className="w-5 h-5" />
            </span>
          </div>
          <p
            className={`text-3xl font-black font-mono mt-3 ${
              report.saldoLiquido >= 0 ? 'text-slate-900' : 'text-rose-800'
            }`}
          >
            {report.saldoLiquido >= 0 ? '+' : ''}
            {formatBRL(report.saldoLiquido)}
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            {report.totalEntradas > 0
              ? `Margem líquida: ${marginPct.toFixed(1)}%`
              : 'Sem entradas realizadas no período'}
            {report.totalInvestimentos > 0 && (
              <>
                {' '}
                • Investido:{' '}
                <strong className="text-indigo-700">
                  {formatBRL(report.totalInvestimentos)}
                </strong>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Evolução dos Últimos 6 Meses */}
      <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Comparativo dos Últimos 6 Meses (Entradas × Saídas)
            </h4>
            <p className="text-xs font-medium text-slate-600">
              Clique em um mês para visualizar o detalhamento completo do fechamento.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Entradas
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              Saídas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {last6Months.map((item) => {
            const isSelected = item.key === selectedMonthKey;
            const inPct = Math.round((item.entradas / maxBarValue) * 100);
            const outPct = Math.round((item.saidas / maxBarValue) * 100);
            const [yrStr, moStr] = item.key.split('-');

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSelectedYear(Number(yrStr));
                  setSelectedMonth(Number(moStr) - 1);
                }}
                className={`p-3.5 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-white/75 ring-2 ring-indigo-500/80 shadow-md'
                    : 'liquid-glass-subtle hover:bg-white/55'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    {item.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      item.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {item.saldo >= 0 ? '+' : ''}
                    {formatBRL(item.saldo)}
                  </span>
                </div>

                <div className="h-20 flex items-end gap-2 pt-2">
                  <div className="flex-1 h-full bg-white/50 rounded-xl flex items-end p-0.5">
                    <div
                      style={{ height: `${Math.max(item.entradas > 0 ? 10 : 0, inPct)}%` }}
                      className="w-full rounded-lg bg-emerald-500 transition-all duration-300"
                      title={`Entradas: ${formatBRL(item.entradas)}`}
                    />
                  </div>
                  <div className="flex-1 h-full bg-white/50 rounded-xl flex items-end p-0.5">
                    <div
                      style={{ height: `${Math.max(item.saidas > 0 ? 10 : 0, outPct)}%` }}
                      className="w-full rounded-lg bg-rose-500 transition-all duration-300"
                      title={`Saídas: ${formatBRL(item.saidas)}`}
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-600 space-y-0.5">
                  <div className="truncate text-emerald-700 font-bold">
                    E: {formatBRL(item.entradas)}
                  </div>
                  <div className="truncate text-rose-700 font-bold">
                    S: {formatBRL(item.saidas)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhamento: Entradas vs Saídas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Lista de Entradas Realizadas */}
        <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <h4 className="text-sm font-extrabold text-slate-900">
              Entradas Realizadas ({report.paidOrders.length})
            </h4>
            <span className="font-mono text-sm font-black text-emerald-700">
              {formatBRL(report.totalEntradas)}
            </span>
          </div>

          {report.paidOrders.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-white/75 text-center text-xs font-medium text-slate-600">
              Nenhuma entrada marcada como paga neste mês.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {report.paidOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-700">
                        {order.id}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {order.companyName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {order.toolDescription} • Pago em{' '}
                      {formatDateBR(order.paidAt || order.createdAt)}
                    </p>
                  </div>
                  <span className="font-mono font-extrabold text-emerald-700 shrink-0">
                    +{formatBRL(order.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composição das Saídas */}
        <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <h4 className="text-sm font-extrabold text-slate-900">
              Composição das Saídas
            </h4>
            <span className="font-mono text-sm font-black text-rose-700">
              {formatBRL(report.totalSaidas)}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {expensesByCategory.map((cat) => (
              <div
                key={cat.label}
                className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.colorHex }}
                  />
                  <span className="font-bold text-slate-900 truncate">
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    ({cat.count} lanç.)
                  </span>
                </div>
                <span className="font-mono font-extrabold text-rose-700 shrink-0">
                  -{formatBRL(cat.total)}
                </span>
              </div>
            ))}

            {report.totalPrestadores > 0 && (
              <div className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  Prestadores de Serviço ({report.monthProviders.length})
                </span>
                <span className="font-mono font-extrabold text-rose-700 shrink-0">
                  -{formatBRL(report.totalPrestadores)}
                </span>
              </div>
            )}

            {report.totalFolha > 0 && (
              <div className="p-3 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  Folha de Funcionários ({report.activePayroll.length})
                </span>
                <span className="font-mono font-extrabold text-rose-700 shrink-0">
                  -{formatBRL(report.totalFolha)}
                </span>
              </div>
            )}

            {report.totalSaidas === 0 && (
              <div className="p-6 rounded-2xl border border-dashed border-white/75 text-center text-xs font-medium text-slate-600">
                Nenhuma saída registrada para este mês.
              </div>
            )}

            {report.monthInvestments.length > 0 && (
              <div className="pt-2 mt-2 border-t border-white/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Aportes em Investimentos no Mês
                  </span>
                  <span className="font-mono">
                    {formatBRL(report.totalInvestimentos)}
                  </span>
                </div>
                {report.monthInvestments.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-300/50 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="font-bold text-slate-800 truncate">
                      {inv.assetName} ({INVESTMENT_TYPE_META[inv.assetType]?.label})
                    </span>
                    <span className="font-mono font-extrabold text-indigo-800 shrink-0">
                      {formatBRL(inv.investedAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
