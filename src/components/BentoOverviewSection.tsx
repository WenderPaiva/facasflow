import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  FileWarning,
  Kanban,
  Package,
  Truck,
  Wrench,
} from 'lucide-react';
import {
  ActiveSection,
  Company,
  DeliveryRecord,
  DieOrder,
  StockItem,
  WarrantyReturnRecord,
} from '../types/order';
import {
  DELIVERY_METHOD_META,
  FinancialBreakdown,
  formatBRL,
  PAYMENT_MODALITY_META,
  PRODUCTION_STAGES,
  RETURN_STATUS_META,
} from '../utils/financeEngine';

interface BentoOverviewSectionProps {
  companies: Company[];
  orders: DieOrder[];
  deliveries: DeliveryRecord[];
  returns: WarrantyReturnRecord[];
  stock: StockItem[];
  financials: FinancialBreakdown;
  onNavigate: (section: ActiveSection) => void;
  onOpenNewOrder: () => void;
  onSelectCompany: (companyId: string) => void;
}

export const BentoOverviewSection: React.FC<BentoOverviewSectionProps> = ({
  companies,
  orders,
  deliveries,
  returns,
  stock,
  financials,
  onNavigate,
  onOpenNewOrder,
  onSelectCompany,
}) => {
  const { readyCount, activeProductionCount, stageCounts, companyOrderCounts } = useMemo(() => {
    let ready = 0;
    const stages: Record<string, number> = {};
    const compCounts: Record<string, number> = {};
    for (const o of orders) {
      if (o.stage === 'faca_pronta') ready += 1;
      stages[o.stage] = (stages[o.stage] || 0) + 1;
      compCounts[o.companyId] = (compCounts[o.companyId] || 0) + 1;
    }
    return {
      readyCount: ready,
      activeProductionCount: orders.length - ready,
      stageCounts: stages,
      companyOrderCounts: compCounts,
    };
  }, [orders]);

  const openReturnsCount = useMemo(
    () => returns.filter((r) => r.status !== 'liberado').length,
    [returns]
  );

  const { madeirasStock, laminasStock, lowMadeiras, lowLaminas } = useMemo(() => {
    const madeiras: StockItem[] = [];
    const laminas: StockItem[] = [];
    const lowM: StockItem[] = [];
    const lowL: StockItem[] = [];
    for (const s of stock) {
      if (s.category === 'madeiras') {
        madeiras.push(s);
        if (s.quantity <= s.minStock) lowM.push(s);
      } else {
        laminas.push(s);
        if (s.quantity <= s.minStock) lowL.push(s);
      }
    }
    return {
      madeirasStock: madeiras,
      laminasStock: laminas,
      lowMadeiras: lowM,
      lowLaminas: lowL,
    };
  }, [stock]);

  return (
    <div className="space-y-5">
      {/* TOP KPI ROW: 6 LIQUID GLASS CARDS (iOS 26 Style) */}
      <section
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
        data-purpose="kpi-metrics-row"
      >
        {/* KPI 1: Volume Total */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-700 frosted-text-depth">
                Volume Total
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 border border-emerald-300/60 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-2 tracking-tight">
              {formatBRL(financials.totalVolume)}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1">
              {orders.length} OS registradas
            </div>
          </div>
          <div className="mt-3 h-12 w-full relative">
            <svg
              className="w-full h-full overflow-visible drop-shadow-md"
              preserveAspectRatio="none"
              viewBox="0 0 180 50"
            >
              <defs>
                <linearGradient id="revGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path
                d="M 0,35 Q 25,10 50,28 T 100,20 T 140,32 T 180,15"
                fill="none"
                stroke="url(#revGrad)"
                strokeDasharray="3,3"
                strokeWidth="2.5"
              />
              <path
                d="M 0,42 Q 30,25 60,35 T 115,15 T 150,28 T 180,22"
                fill="none"
                opacity="0.6"
                stroke="url(#revGrad)"
                strokeDasharray="2,3"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2: A Receber 30/60d */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-700 frosted-text-depth">
              A Receber 30/60d
            </span>
            <div className="text-xl font-black text-slate-900 mt-2 tracking-tight">
              {formatBRL(financials.receivable30d)}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1">
              {financials.receivableCount} título(s) ativos
            </div>
          </div>
          <div className="mt-3 h-12 -mx-4 -mb-4 overflow-hidden">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 160 50"
            >
              <defs>
                <linearGradient id="mrrGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 0,45 Q 40,40 70,22 T 120,28 T 160,10 L 160,50 L 0,50 Z"
                fill="url(#mrrGrad)"
              />
              <path
                d="M 0,45 Q 40,40 70,22 T 120,28 T 160,10"
                fill="none"
                stroke="#059669"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* KPI 3: Facas Ativas */}
        <div
          onClick={() => onNavigate('esteira')}
          className="liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-700 frosted-text-depth">
              Facas na Bancada
            </span>
            <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              {activeProductionCount}
            </div>
            <div className="text-[11px] font-bold text-indigo-700 mt-1">
              Em produção ativa
            </div>
          </div>
          <div className="mt-3 h-12 flex items-center justify-center">
            <svg className="w-full h-10 drop-shadow-sm" viewBox="0 0 160 40">
              <g fill="#6366f1" opacity="0.8">
                {[10, 28, 46, 64, 82, 100, 118, 136, 150].map((cx) =>
                  [8, 19, 30].map((cy) => (
                    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" />
                  ))
                )}
              </g>
            </svg>
          </div>
        </div>

        {/* KPI 4: Prontas / Expedição */}
        <div
          onClick={() => onNavigate('entregas')}
          className="liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-700 frosted-text-depth">
              Prontas / Exped.
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-2 tracking-tight">
              {readyCount}
            </div>
            <div className="text-[11px] font-bold text-slate-600 mt-1">
              {deliveries.length} saída(s) logísticas
            </div>
          </div>
          <div className="mt-3 h-12 -mx-4 -mb-4 overflow-hidden">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 160 50"
            >
              <defs>
                <linearGradient id="readyGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 0,42 Q 35,34 68,26 T 118,16 T 160,12 L 160,50 L 0,50 Z"
                fill="url(#readyGrad)"
              />
              <path
                d="M 0,42 Q 35,34 68,26 T 118,16 T 160,12"
                fill="none"
                stroke="#4f46e5"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* KPI 5: Empresas CRM */}
        <div
          onClick={() => onNavigate('empresas')}
          className="liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-700 frosted-text-depth">
              Empresas Ativas
            </span>
            <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              {companies.length}
            </div>
            <div className="text-[11px] font-bold text-indigo-700 mt-1">
              Base CRM cadastrada
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="h-2 flex-1 rounded-full bg-indigo-500/75" />
            <span className="h-2 w-8 rounded-full bg-sky-400/75" />
            <span className="h-2 w-5 rounded-full bg-purple-400/75" />
          </div>
        </div>

        {/* KPI 6: Atenção / Vencidos & Retornos */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-700 frosted-text-depth">
              Alertas &amp; Retornos
            </span>
            <div className="text-2xl font-black text-indigo-700 mt-2 tracking-tight">
              {financials.overdueCount + openReturnsCount}
            </div>
            <div className="text-[11px] font-bold text-slate-600 mt-1">
              {financials.overdueCount} vencido(s) • {openReturnsCount} ajuste(s)
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
              {formatBRL(financials.overdueTotal)}
            </span>
          </div>
        </div>
      </section>

      {/* MAIN BENTO ROW: HERO + FINANCIAL PULSE + MODALITY CHART */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* HERO LIQUID GLASS COMMAND CARD (5 Cols) */}
        <div className="md:col-span-5 liquid-glass rounded-[28px] p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Operação em Tempo Real
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-3 leading-snug frosted-text-depth">
                Controle Industrial
              </h2>
              <p className="text-xs font-medium text-slate-700 mt-1.5 max-w-sm leading-relaxed">
                Rastreamento completo desde o arquivo CAD recebido até a saída
                logística e faturamento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/60">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block">
                Facas Ativas
              </span>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {activeProductionCount}
              </span>
              <span className="text-[10px] font-bold text-indigo-700 block mt-0.5">
                Na bancada
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block">
                Prontas
              </span>
              <span className="text-3xl font-black text-emerald-700 tracking-tight">
                {readyCount}
              </span>
              <span className="text-[10px] font-bold text-slate-600 block mt-0.5">
                Finalizadas
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block">
                Empresas
              </span>
              <span className="text-3xl font-black text-indigo-700 tracking-tight">
                {companies.length}
              </span>
              <span className="text-[10px] font-bold text-slate-600 block mt-0.5">
                Cadastradas
              </span>
            </div>
          </div>
        </div>

        {/* FINANCIAL PULSE CARD (4 Cols) */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="md:col-span-4 liquid-glass rounded-[28px] p-6 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pulso Financeiro
              </span>
              <p className="text-3xl font-black text-emerald-700 tracking-tight mt-1">
                {formatBRL(financials.receivable30d)}
              </p>
              <span className="text-[11px] font-semibold text-slate-600">
                A receber programado • {financials.receivableCount} títulos
              </span>
            </div>
            <div className="w-10 h-10 rounded-full liquid-glass-pill group-hover:bg-indigo-600 text-slate-700 group-hover:text-indigo-700 flex items-center justify-center transition">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/60">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-300/60 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Vencidos</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-1">
                {formatBRL(financials.overdueTotal)}
              </p>
              <span className="text-[10px] font-semibold text-slate-600">
                {financials.overdueCount} título(s)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300/60 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <FileWarning className="w-3.5 h-3.5" />
                <span>Entregues s/ Nota</span>
              </div>
              <p className="text-lg font-black text-amber-800 mt-1">
                {formatBRL(financials.unbilledTotal)}
              </p>
              <span className="text-[10px] font-semibold text-slate-600">
                {financials.unbilledCount} s/ cobrança
              </span>
            </div>
          </div>
        </div>

        {/* PAYMENT MODALITY PILL CHART (3 Cols) */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="md:col-span-3 liquid-glass rounded-[28px] p-6 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600">
                Modalidades
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                {formatBRL(financials.totalVolume)}
              </h3>
            </div>
            <CalendarClock className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="flex items-end justify-between gap-2 h-28 pt-4">
            {financials.byModality.map((item) => {
              const heightPct = Math.max(14, item.percentage);
              return (
                <div
                  key={item.modality}
                  className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[10px] font-extrabold text-slate-800">
                    {item.percentage}%
                  </span>
                  <div className="w-full bg-white/45 border border-white/70 rounded-2xl h-full flex items-end p-0.5 shadow-inner">
                    <div
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: item.colorHex,
                      }}
                      className="w-full rounded-xl transition-all duration-500 shadow-sm"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 truncate max-w-full">
                    {PAYMENT_MODALITY_META[item.modality]?.short.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECOND ROW: 6-STAGE PRODUCTION PIPELINE */}
      <div className="liquid-glass rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 frosted-text-depth">
                Esteira Física da Oficina
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Visão instantânea de onde está cada faca neste momento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('esteira')}
            className="liquid-glass-pill inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-800 hover:text-indigo-700 cursor-pointer"
          >
            <span>Abrir Esteira Completa</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRODUCTION_STAGES.map((st) => {
            const count = stageCounts[st.id] || 0;
            return (
              <div
                key={st.id}
                onClick={() => onNavigate('esteira')}
                className="p-4 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Etapa {st.step}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${st.dotClass}`} />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">
                  {count}
                </p>
                <span className="text-xs font-bold text-slate-700 mt-1 block truncate">
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* THIRD ROW: 4 LIQUID GLASS WIDGETS (CRM, LOGÍSTICA, RETORNOS, ESTOQUE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Widget 1: Empresas & Ferramental */}
        <div className="liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Empresas &amp; Ferramental
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('empresas')}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver CRM <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {companies.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                  Nenhuma empresa cadastrada.
                </div>
              ) : (
                companies.slice(0, 4).map((comp) => {
                  const compCount = companyOrderCounts[comp.id] || 0;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => {
                        onSelectCompany(comp.id);
                        onNavigate('empresas');
                      }}
                      className="p-3 rounded-2xl liquid-glass-subtle hover:bg-white/45 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {comp.corporateName}
                        </p>
                        <span className="text-[11px] text-slate-600 font-mono">
                          {comp.cnpj}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/65 border border-white/80 text-slate-800 text-xs font-extrabold shrink-0">
                        {compCount} facas
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Widget 2: Logística de Saída */}
        <div className="liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Logística de Saída
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('entregas')}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver Saídas <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {deliveries.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                  Nenhuma saída registrada.
                </div>
              ) : (
                deliveries.slice(0, 3).map((del) => (
                  <div
                    key={del.id}
                    onClick={() => onNavigate('entregas')}
                    className="p-3 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {del.orderId} • {del.companyName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          DELIVERY_METHOD_META[del.method]?.badgeClass
                        }`}
                      >
                        {DELIVERY_METHOD_META[del.method]?.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 mt-1 truncate">
                      {del.carrierOrPersonName} • {del.dispatchedAt}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Widget 3: Retornos & Garantia */}
        <div className="liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Retornos &amp; Garantia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('retornos')}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver Bancada <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {returns.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                  Nenhum retorno registrado.
                </div>
              ) : (
                returns.slice(0, 3).map((ret) => {
                  const stMeta = RETURN_STATUS_META[ret.status];
                  return (
                    <div
                      key={ret.id}
                      onClick={() => onNavigate('retornos')}
                      className="p-3 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ret.orderId} • {ret.companyName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${stMeta.badgeClass}`}
                        >
                          {stMeta.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 mt-1 truncate">
                        Motivo: {ret.reason}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Widget 4: Estoque — Itens em Falta por Categoria */}
        <div className="liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Estoque em Falta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('estoque')}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver Estoque <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Madeiras Summary */}
              <div
                onClick={() => onNavigate('estoque')}
                className={`p-3.5 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer ${
                  lowMadeiras.length > 0 ? 'ring-1 ring-amber-400/70' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    1. Madeiras
                  </span>
                  {lowMadeiras.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                      {lowMadeiras.length} em falta
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60">
                      0 em falta
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-600 mt-1 truncate">
                  {lowMadeiras.length > 0
                    ? `Repor: ${lowMadeiras.map((i) => i.name).join(', ')}`
                    : `${madeirasStock.length} item(ns) cadastrado(s)`}
                </p>
              </div>

              {/* Lâminas Summary */}
              <div
                onClick={() => onNavigate('estoque')}
                className={`p-3.5 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer ${
                  lowLaminas.length > 0 ? 'ring-1 ring-amber-400/70' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    2. Lâminas
                  </span>
                  {lowLaminas.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                      {lowLaminas.length} em falta
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60">
                      0 em falta
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-600 mt-1 truncate">
                  {lowLaminas.length > 0
                    ? `Repor: ${lowLaminas.map((i) => i.name).join(', ')}`
                    : `${laminasStock.length} item(ns) cadastrado(s)`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
