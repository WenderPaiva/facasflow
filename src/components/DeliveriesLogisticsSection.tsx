import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  Trash2,
  Truck,
  UserCheck,
} from 'lucide-react';
import { DeliveryMethod, DeliveryRecord, DieOrder } from '../types/order';
import { DELIVERY_METHOD_META, toISODate } from '../utils/financeEngine';

interface DeliveriesLogisticsSectionProps {
  orders: DieOrder[];
  deliveries: DeliveryRecord[];
  prefillOrder?: DieOrder | null;
  onAddDelivery: (delivery: Omit<DeliveryRecord, 'id'>) => Promise<boolean> | boolean;
  onDeleteDelivery: (deliveryId: string) => Promise<void> | void;
}

export const DeliveriesLogisticsSection: React.FC<DeliveriesLogisticsSectionProps> = ({
  orders,
  deliveries,
  prefillOrder,
  onAddDelivery,
  onDeleteDelivery,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(
    prefillOrder?.id || orders[0]?.id || ''
  );
  const [method, setMethod] = useState<DeliveryMethod>('uber_flash');
  const [carrierName, setCarrierName] = useState('');
  const [dispatchedDate, setDispatchedDate] = useState(() => toISODate());
  const [dispatchedTime, setDispatchedTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (prefillOrder) {
      setSelectedOrderId(prefillOrder.id);
    }
  }, [prefillOrder]);

  useEffect(() => {
    if (orders.length > 0 && !orders.some((o) => o.id === selectedOrderId)) {
      const validPrefill =
        prefillOrder && orders.some((o) => o.id === prefillOrder.id)
          ? prefillOrder.id
          : orders[0].id;
      setSelectedOrderId(validPrefill);
    }
  }, [orders, selectedOrderId, prefillOrder]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedOrder || !carrierName.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await onAddDelivery({
        orderId: selectedOrder.id,
        toolDescription: selectedOrder.toolDescription,
        companyName: selectedOrder.companyName,
        method,
        carrierOrPersonName: carrierName.trim(),
        dispatchedAt: `${dispatchedDate} ${dispatchedTime}`,
        notes: notes.trim() || undefined,
      });
      if (ok !== false) {
        setCarrierName('');
        setNotes('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deliveryId: string) => {
    if (deletingId) return;
    setDeletingId(deliveryId);
    try {
      await onDeleteDelivery(deliveryId);
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
          Entregas e Logística de Saída
        </h2>
        <p className="text-xs font-medium text-slate-700">
          Protocolo digital de saída para rastrear quem retirou ou despachou cada ferramenta com data e hora.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Bento Card: Register New Dispatch (5 Cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Registrar Saída / Retirada de Faca
              </h3>
              <p className="text-[11px] font-medium text-slate-600">
                Marca automaticamente a OS como &quot;Faca Pronta&quot;
              </p>
            </div>
          </div>

          {/* 1. Selecionar OS / Cliente */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              1. Ordem de Serviço
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className={inputClass}
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} - {o.companyName} - {o.toolDescription}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Responsável pela Retirada */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              2. Modalidade e Responsável pela Retirada
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DELIVERY_METHOD_META) as DeliveryMethod[]).map((m) => {
                const meta = DELIVERY_METHOD_META[m];
                const active = method === m;
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border text-left transition cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                        : 'liquid-glass-pill text-slate-700'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Nome do Motorista / Portador */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              3. Nome do Motorista, Portador ou Placa
            </label>
            <input
              type="text"
              required
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              placeholder="Ex: Motoboy Carlos, Placa FKR-4A89 ou Retirado por Marcos"
              className={inputClass}
            />
          </div>

          {/* 4. Data e Hora Exata da Saída */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Data da Saída
              </label>
              <input
                type="date"
                required
                value={dispatchedDate}
                onChange={(e) => setDispatchedDate(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Hora Exata
              </label>
              <input
                type="time"
                required
                value={dispatchedTime}
                onChange={(e) => setDispatchedTime(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Observação de Expedição
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Canhoto assinado, entregue com proteção de borracha"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedOrder}
            className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando Saída...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar Registro de Saída</span>
              </>
            )}
          </button>
        </form>

        {/* Right Bento Card: Delivery History Log (7 Cols) */}
        <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Histórico de Entregas e Retiradas
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Rastreabilidade completa contra extravio de ferramentas
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/65 border border-white/80 text-xs font-extrabold text-slate-800">
              {deliveries.length}
            </span>
          </div>

          <div className="space-y-3">
            {deliveries.length === 0 ? (
              <div className="p-10 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                Nenhuma entrega ou retirada registrada ainda.
              </div>
            ) : (
              deliveries.map((del) => {
                const meta = DELIVERY_METHOD_META[del.method];
                const isDeleting = deletingId === del.id;
                return (
                  <div
                    key={del.id}
                    className="p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800">
                          {del.orderId}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {del.companyName}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta?.badgeClass}`}
                        >
                          {meta?.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-semibold">
                        {del.toolDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-900 font-bold">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          {del.carrierOrPersonName}
                        </span>
                        {del.notes && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3" />
                            {del.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <div className="sm:text-right font-mono bg-white/55 px-3 py-2 rounded-2xl border border-white/75">
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">
                          Saída Registrada
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700 flex items-center sm:justify-end gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {del.dispatchedAt}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(deletingId)}
                        onClick={() => void handleDelete(del.id)}
                        className="btn-compact w-9 h-9 rounded-2xl bg-white/60 hover:bg-rose-500/20 disabled:opacity-50 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Excluir registro de entrega"
                        aria-label="Excluir registro de entrega"
                      >
                        {isDeleting ? (
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
        </div>
      </div>
    </div>
  );
};
