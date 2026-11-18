import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
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

    return (
      <div
        draggable={!isPending}
        onDragStart={() => onDragStart(order.id)}
        onDragEnd={onDragEnd}
        className={`rounded-2xl p-3.5 liquid-glass-subtle hover:bg-white/45 transition-colors cursor-grab active:cursor-grabbing flex flex-col gap-2.5 ${
          isPending ? 'opacity-75 ring-1 ring-indigo-400/70' : ''
        }`}
      >
        {/* Top OS + Payment Modality + Expand + Delete */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-[11px] font-bold text-indigo-800">
            {order.id}
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${modMeta?.badgeClass}`}
            >
              {modMeta?.short}
            </span>
            <button
              type="button"
              onClick={() => onToggleExpand(order.id)}
              className="p-1 rounded-lg bg-white/60 hover:bg-white/90 text-slate-600 border border-white/70 transition-colors cursor-pointer"
              title="Detalhes da OS"
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
              className="p-1 rounded-lg bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/70 transition-colors cursor-pointer"
              title="Apagar esta OS"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Company & Tool Description */}
        <div>
          <span className="text-[11px] font-bold text-slate-600 block truncate">
            {order.companyName}
          </span>
          <h4 className="text-xs font-extrabold text-slate-900 leading-snug mt-0.5">
            {order.toolDescription}
          </h4>
        </div>

        {/* Preserved Expanded Details (survives remote updates) */}
        {isExpanded && (
          <div className="p-2.5 rounded-xl bg-white/55 border border-white/75 text-[11px] space-y-1 text-slate-700">
            <div>
              <strong>Vencimento:</strong> {formatDateBR(order.dueDate)}
            </div>
            <div>
              <strong>Telefone:</strong> {order.companyPhone || 'Não informado'}
            </div>
            <div>
              <strong>Versão:</strong> v{order.version || 1}
            </div>
          </div>
        )}

        {/* Timestamp of Stage Alteration */}
        <div className="flex items-center justify-between text-[10px] text-slate-700 bg-white/55 px-2.5 py-1.5 rounded-xl border border-white/70">
          <span className="flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>{isPending ? 'Salvando...' : order.stageUpdatedAt}</span>
          </span>
          <span className="font-mono font-extrabold text-emerald-700">
            {formatBRL(order.amount)}
          </span>
        </div>

        {/* Stage Move Controls */}
        <div className="flex items-center gap-1.5 pt-1">
          {prevStage && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onMoveStage(order.id, prevStage)}
              className="p-1.5 rounded-xl bg-white/65 hover:bg-white/90 disabled:opacity-50 text-slate-700 border border-white/80 transition-colors cursor-pointer"
              title="Voltar etapa anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStage ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onMoveStage(order.id, nextStage)}
              className="flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white border border-white/40 shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Avançar Etapa</span>
              <ArrowRight className="w-3 h-3 stroke-[2.2]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onQuickRegisterDelivery(order)}
              className="flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white border border-white/40 shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Despachar / Saída</span>
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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProductionStage | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(
    () => new Set()
  );

  const pendingSet = new Set(pendingOrderIds);

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
            Esteira Física de Produção
          </h2>
          <p className="text-xs font-medium text-slate-700">
            Arraste os cartões ou clique em avançar. Cada mudança grava a data e hora da etapa.
          </p>
        </div>
        {moveError && (
          <div className="px-3.5 py-2 rounded-full bg-rose-500/15 border border-rose-300/70 text-xs font-bold text-rose-800">
            {moveError}
          </div>
        )}
      </div>

      {/* 6-Column Liquid Glass Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 items-start">
        {PRODUCTION_STAGES.map((stage) => {
          const colOrders = orders.filter((o) => o.stage === stage.id);
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
              className={`liquid-glass rounded-[26px] p-4 transition-colors min-h-[480px] flex flex-col gap-3 ${
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
              <div className="space-y-3 flex-1">
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
    </div>
  );
};
