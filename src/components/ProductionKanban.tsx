import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Kanban,
  RotateCcw,
  Trash2,
  Truck,
} from 'lucide-react';
import { DieOrder, ProductionStage } from '../types/order';
import {
  formatBRL,
  formatDateBR,
  getNextStage,
  getPrevStage,
  PAYMENT_MODALITY_META,
  PRODUCTION_STAGES,
} from '../utils/financeEngine';

interface ProductionKanbanProps {
  orders: DieOrder[];
  pendingOrderIds?: string[];
  moveError?: string | null;
  onMoveStage: (orderId: string, targetStage: ProductionStage) => void;
  onQuickRegisterDelivery: (order: DieOrder) => void;
  onDeleteOrder: (orderId: string) => void;
}

interface OrderKanbanCardProps {
  order: DieOrder;
  isPending: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onMoveStage: (orderId: string, targetStage: ProductionStage) => void;
  onQuickRegisterDelivery: (order: DieOrder) => void;
  onDeleteOrder: (orderId: string) => void;
}

const ACTIVE_PRODUCTION_STAGES = PRODUCTION_STAGES.filter(
  (s) => s.id !== 'faca_pronta'
);

const OrderKanbanCard = React.memo<OrderKanbanCardProps>(
  ({
    order,
    isPending,
    isExpanded,
    onToggleExpand,
    onDragStart,
    onDragEnd,
    onMoveStage,
    onQuickRegisterDelivery,
    onDeleteOrder,
  }) => {
    const prevStage = getPrevStage(order.stage);
    const nextStage = getNextStage(order.stage);
    const modMeta = PAYMENT_MODALITY_META[order.paymentModality];
    const isFinalizingStep = nextStage === 'faca_pronta';

    return (
      <div
        draggable={!isPending}
        onDragStart={() => onDragStart(order.id)}
        onDragEnd={onDragEnd}
        className={`rounded-2xl p-3 liquid-glass-subtle hover:bg-white/45 transition-colors cursor-grab active:cursor-grabbing flex flex-col gap-2 overflow-hidden min-w-0 ${
          isPending ? 'opacity-75 ring-1 ring-indigo-400/70' : ''
        }`}
      >
        {/* Top OS + Payment Modality + Compact Centered Actions */}
        <div className="flex flex-wrap items-center justify-between gap-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0 flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-300/60 font-mono text-[10px] font-bold text-indigo-800 shrink-0">
              {order.id}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border truncate max-w-[92px] ${modMeta?.badgeClass}`}
              title={modMeta?.label}
            >
              {modMeta?.short}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleExpand(order.id)}
              className="btn-compact w-6 h-6 rounded-lg bg-white/65 hover:bg-white/95 text-slate-600 hover:text-indigo-700 border border-white/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={isExpanded ? 'Recolher detalhes' : 'Exibir mais detalhes'}
              aria-label={isExpanded ? 'Recolher detalhes' : 'Exibir mais detalhes'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDeleteOrder(order.id)}
              className="btn-compact w-6 h-6 rounded-lg bg-white/65 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Excluir esta OS"
              aria-label="Excluir esta OS"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Company & Tool Description */}
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-600 block truncate">
            {order.companyName}
          </span>
          <h4 className="text-xs font-extrabold text-slate-900 leading-snug mt-0.5 break-words">
            {order.toolDescription}
          </h4>
        </div>

        {/* Preserved Expanded Details (survives remote updates) */}
        {isExpanded && (
          <div className="p-2 rounded-xl bg-white/60 border border-white/80 text-[10px] space-y-1 text-slate-700">
            <div>
              <strong>Vencimento:</strong> {formatDateBR(order.dueDate)}
            </div>
            <div>
              <strong>Telefone:</strong> {order.companyPhone || 'Não informado'}
            </div>
            <div>
              <strong>Pagamento:</strong>{' '}
              {order.paymentStatus === 'pago' ? 'Pago' : 'Não Pago'}
            </div>
          </div>
        )}

        {/* Timestamp & Value */}
        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-700 bg-white/55 px-2 py-1.5 rounded-xl border border-white/70 min-w-0">
          <span className="flex items-center gap-1 font-semibold truncate min-w-0">
            <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
            <span className="truncate">
              {isPending ? 'Salvando...' : order.stageUpdatedAt}
            </span>
          </span>
          <span className="font-mono font-extrabold text-emerald-700 shrink-0">
            {formatBRL(order.amount)}
          </span>
        </div>

        {/* Stage Move Controls */}
        <div className="flex items-center gap-1 pt-0.5 min-w-0">
          {prevStage && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onMoveStage(order.id, prevStage)}
              className="btn-compact w-7 h-7 rounded-xl bg-white/65 hover:bg-white/95 disabled:opacity-50 text-slate-700 border border-white/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Voltar etapa anterior"
              aria-label="Voltar etapa anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStage ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onMoveStage(order.id, nextStage)}
              className={`btn-compact flex-1 min-w-0 py-1.5 px-2 rounded-xl text-[10px] font-bold disabled:opacity-50 text-white border border-white/40 shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                isFinalizingStep
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600'
              }`}
              title={
                isFinalizingStep
                  ? 'Concluir e mover para Facas Prontas'
                  : 'Avançar para a próxima etapa'
              }
            >
              <span className="truncate">
                {isFinalizingStep ? 'Concluir Faca' : 'Avançar'}
              </span>
              {isFinalizingStep ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              ) : (
                <ArrowRight className="w-3 h-3 stroke-[2.2] shrink-0" />
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onQuickRegisterDelivery(order)}
              className="btn-compact flex-1 min-w-0 py-1.5 px-2 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white border border-white/40 shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Truck className="w-3 h-3 shrink-0" />
              <span className="truncate">Despachar</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

export const ProductionKanban: React.FC<ProductionKanbanProps> = ({
  orders,
  pendingOrderIds = [],
  moveError,
  onMoveStage,
  onQuickRegisterDelivery,
  onDeleteOrder,
}) => {
  const [activeView, setActiveView] = useState<'producao' | 'prontas'>('producao');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProductionStage | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(
    () => new Set()
  );

  const pendingSet = new Set(pendingOrderIds);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.stage !== 'faca_pronta'),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => o.stage === 'faca_pronta'),
    [orders]
  );
  const readyTotalVolume = useMemo(
    () => readyOrders.reduce((acc, o) => acc + (o.amount || 0), 0),
    [readyOrders]
  );

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  return (
    <div className="space-y-5 min-w-0">
      {/* Header + Subseção Tabs (Em Produção vs Facas Prontas) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
            Esteira de Produção
          </h2>
          <p className="text-xs font-medium text-slate-700">
            Arraste os cartões ou avance etapas. Facas finalizadas vão automaticamente para a aba Facas Prontas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('producao')}
            className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
              activeView === 'producao'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'liquid-glass-pill text-slate-700'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Em Produção</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeView === 'producao'
                  ? 'bg-white/25 text-white'
                  : 'bg-white/65 text-slate-800'
              }`}
            >
              {activeOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('prontas')}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverStage !== 'faca_pronta') {
                setDragOverStage('faca_pronta');
              }
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              if (draggedId) {
                const draggedOrder = orders.find((o) => o.id === draggedId);
                if (draggedOrder && draggedOrder.stage !== 'faca_pronta') {
                  onMoveStage(draggedId, 'faca_pronta');
                }
                setDraggedId(null);
              }
            }}
            className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
              activeView === 'prontas'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md border border-white/40'
                : dragOverStage === 'faca_pronta'
                  ? 'bg-emerald-500/25 text-emerald-900 ring-2 ring-emerald-500 border border-emerald-400'
                  : 'liquid-glass-pill text-slate-700'
            }`}
            title="Clique para abrir ou arraste uma faca aqui para concluir"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Facas Prontas</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeView === 'prontas'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-500/15 text-emerald-800 border border-emerald-300/60'
              }`}
            >
              {readyOrders.length}
            </span>
          </button>
        </div>
      </div>

      {moveError && (
        <div className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-300/70 text-xs font-bold text-rose-800">
          {moveError}
        </div>
      )}

      {activeView === 'producao' ? (
        /* 5-Column Active Production Kanban (keeps active flow clean) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 items-start">
          {ACTIVE_PRODUCTION_STAGES.map((stage) => {
            const colOrders = activeOrders.filter((o) => o.stage === stage.id);
            const colTotal = colOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
            const isOver = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== stage.id) {
                    setDragOverStage(stage.id);
                  }
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  if (draggedId) {
                    const draggedOrder = orders.find((o) => o.id === draggedId);
                    if (draggedOrder && draggedOrder.stage !== stage.id) {
                      onMoveStage(draggedId, stage.id);
                    }
                    setDraggedId(null);
                  }
                }}
                className={`liquid-glass rounded-[26px] p-3.5 transition-colors min-h-[460px] flex flex-col gap-3 min-w-0 ${
                  isOver ? 'ring-2 ring-indigo-500/70' : ''
                }`}
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-white/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.dotClass}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Etapa {stage.step}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white/70 text-slate-900 border border-white/80 shadow-xs">
                      {colOrders.length}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1.5 frosted-text-depth">
                    {stage.label}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                    {stage.subtitle}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/45 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 font-semibold">Volume:</span>
                    <span className="font-extrabold text-emerald-700">
                      {formatBRL(colTotal)}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  {colOrders.length === 0 ? (
                    <div className="h-32 rounded-2xl border border-dashed border-white/75 bg-white/20 flex items-center justify-center text-xs font-medium text-slate-600 text-center px-2">
                      Sem facas em {stage.label}
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderKanbanCard
                        key={order.id}
                        order={order}
                        isPending={pendingSet.has(order.id)}
                        isExpanded={expandedOrderIds.has(order.id)}
                        onToggleExpand={handleToggleExpand}
                        onDragStart={setDraggedId}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverStage(null);
                        }}
                        onMoveStage={onMoveStage}
                        onQuickRegisterDelivery={onQuickRegisterDelivery}
                        onDeleteOrder={onDeleteOrder}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Subseção Dedicada: Facas Prontas / Concluídas */
        <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/60">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-300/60 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Facas Prontas / Concluídas ({readyOrders.length})
                </h3>
                <p className="text-xs font-medium text-slate-600">
                  Ferramentas finalizadas e liberadas para retirada ou despacho logístico.
                </p>
              </div>
            </div>

            <div className="liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold text-slate-800">
              Volume Concluído:{' '}
              <strong className="font-mono text-emerald-700">
                {formatBRL(readyTotalVolume)}
              </strong>
            </div>
          </div>

          {readyOrders.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-white/75 bg-white/20 text-center space-y-1">
              <p className="text-sm font-bold text-slate-700">
                Nenhuma faca concluída ainda.
              </p>
              <p className="text-xs text-slate-600">
                Ao clicar em &quot;Concluir Faca&quot; na etapa Faca Ajustada, o pedido aparecerá automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {readyOrders.map((order) => {
                const modMeta = PAYMENT_MODALITY_META[order.paymentModality];
                const isPending = pendingSet.has(order.id);
                const isExpanded = expandedOrderIds.has(order.id);

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl p-4 liquid-glass-subtle hover:bg-white/45 transition flex flex-col justify-between gap-3 overflow-hidden min-w-0 ${
                      isPending ? 'opacity-75 ring-1 ring-emerald-400/70' : ''
                    }`}
                  >
                    <div className="space-y-2.5 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-300/60 font-mono text-[11px] font-bold text-emerald-800 shrink-0">
                            {order.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${modMeta?.badgeClass}`}
                          >
                            {modMeta?.short}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              order.paymentStatus === 'pago'
                                ? 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60'
                                : 'bg-white/70 text-slate-700 border-white/80'
                            }`}
                          >
                            {order.paymentStatus === 'pago' ? 'Pago' : 'Não Pago'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(order.id)}
                            className="btn-compact w-7 h-7 rounded-lg bg-white/65 hover:bg-white/95 text-slate-600 hover:text-indigo-700 border border-white/80 flex items-center justify-center transition cursor-pointer shrink-0"
                            title={isExpanded ? 'Recolher detalhes' : 'Exibir mais detalhes'}
                            aria-label={isExpanded ? 'Recolher detalhes' : 'Exibir mais detalhes'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order.id)}
                            className="btn-compact w-7 h-7 rounded-lg bg-white/65 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/80 flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Excluir esta OS"
                            aria-label="Excluir esta OS"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-600 block truncate">
                          {order.companyName}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5 break-words">
                          {order.toolDescription}
                        </h4>
                      </div>

                      {isExpanded && (
                        <div className="p-2.5 rounded-xl bg-white/60 border border-white/80 text-[11px] space-y-1 text-slate-700">
                          <div>
                            <strong>Cadastro:</strong> {formatDateBR(order.createdAt)}
                          </div>
                          <div>
                            <strong>Vencimento:</strong> {formatDateBR(order.dueDate)}
                          </div>
                          <div>
                            <strong>Telefone:</strong> {order.companyPhone || 'Não informado'}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-700 bg-white/55 px-2.5 py-1.5 rounded-xl border border-white/70">
                        <span className="flex items-center gap-1 font-semibold truncate">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            Concluída: {order.stageUpdatedAt}
                          </span>
                        </span>
                        <span className="font-mono font-extrabold text-emerald-700 shrink-0">
                          {formatBRL(order.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onMoveStage(order.id, 'faca_ajustada')}
                        className="btn-compact px-3 py-2 rounded-xl text-[11px] font-bold bg-white/70 hover:bg-white text-slate-700 border border-white/80 inline-flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                        title="Retornar para Faca Ajustada"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onQuickRegisterDelivery(order)}
                        className="btn-compact flex-1 py-2 px-3 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white border border-white/40 shadow-sm inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>Despachar / Saída</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
