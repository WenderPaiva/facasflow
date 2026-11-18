import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ShieldAlert,
  Trash2,
  Wrench,
} from 'lucide-react';
import { DieOrder, ReturnStatus, WarrantyReturnRecord } from '../types/order';
import {
  formatBRL,
  nowTimestampBR,
  RETURN_STATUS_META,
  toISODate,
} from '../utils/financeEngine';

interface WarrantyReturnsSectionProps {
  orders: DieOrder[];
  returns: WarrantyReturnRecord[];
  onAddReturn: (record: Omit<WarrantyReturnRecord, 'id'>) => void;
  onUpdateReturnStatus: (id: string, nextStatus: ReturnStatus) => void;
  onDeleteReturn: (returnId: string) => void;
}

export const WarrantyReturnsSection: React.FC<WarrantyReturnsSectionProps> = ({
  orders,
  returns,
  onAddReturn,
  onUpdateReturnStatus,
  onDeleteReturn,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [reason, setReason] = useState('');
  const [technicalAction, setTechnicalAction] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('0');
  const [status, setStatus] = useState<ReturnStatus>('em_analise');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !reason.trim() || !technicalAction.trim()) return;

    const val = parseFloat(adjustmentAmount.replace(',', '.')) || 0;
    onAddReturn({
      orderId: selectedOrder.id,
      companyName: selectedOrder.companyName,
      toolDescription: selectedOrder.toolDescription,
      reason: reason.trim(),
      technicalAction: technicalAction.trim(),
      adjustmentAmount: val,
      status,
      createdAt: `${toISODate()}`,
      updatedAt: nowTimestampBR(),
    });

    setReason('');
    setTechnicalAction('');
    setAdjustmentAmount('0');
    setStatus('em_analise');
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
          Retornos e Ajustes
        </h2>
        <p className="text-xs font-medium text-slate-700">
          Controle técnico de facas que retornaram para ajuste de vinco, reparo de lâmina ou modificação solicitada pelo cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Card: Register Return */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-300/60 flex items-center justify-center text-amber-700">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Registrar Retorno / Ajuste de Faca
              </h3>
              <p className="text-[11px] font-medium text-slate-600">
                Documente o motivo, o serviço executado e eventual custo adicional
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              1. OS Original e Empresa Cliente
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

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              2. Motivo do Retorno
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Ajuste de vinco, Lâmina fora de esquadro, Erro de medida"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              3. Descrição Técnica do Reparo
            </label>
            <textarea
              rows={3}
              required
              value={technicalAction}
              onChange={(e) => setTechnicalAction(e.target.value)}
              placeholder="Descreva a troca de lâmina, calibragem de altura, borracha ejetora ou abertura de rasgo"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                4. Valor do Ajuste em R$
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="0,00"
                className={`${inputClass} font-mono font-bold`}
              />
              <span className="text-[10px] font-medium text-slate-600 mt-0.5 block">
                Use R$ 0,00 para ajuste em garantia sem custo
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                5. Status do Retorno
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReturnStatus)}
                className={inputClass}
              >
                {Object.entries(RETURN_STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Ocorrência de Retorno</span>
          </button>
        </form>

        {/* Right Card: Returns History */}
        <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Facas em Retorno / Histórico de Ajustes ({returns.length})
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Acompanhe o diagnóstico técnico e libere novamente para o cliente
              </p>
            </div>
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>

          <div className="space-y-3.5">
            {returns.length === 0 ? (
              <div className="p-10 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                Nenhum retorno ou ajuste registrado ainda.
              </div>
            ) : (
              returns.map((ret) => {
                const stMeta = RETURN_STATUS_META[ret.status];
                return (
                  <div
                    key={ret.id}
                    className="p-5 rounded-3xl liquid-glass-subtle space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800">
                            {ret.orderId}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {ret.companyName}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${stMeta.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stMeta.dotClass}`} />
                            {stMeta.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-1">
                          {ret.toolDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right font-mono">
                          <span
                            className={`text-sm font-black block ${
                              ret.adjustmentAmount === 0
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {ret.adjustmentAmount === 0
                              ? 'R$ 0,00 Garantia'
                              : `Ajuste: ${formatBRL(ret.adjustmentAmount)}`}
                          </span>
                          <span className="text-[10px] font-medium text-slate-600">
                            Atualizado: {ret.updatedAt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteReturn(ret.id)}
                          className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer"
                          title="Apagar registro de retorno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-white/55 border border-white/75">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-700 block mb-0.5">
                          Motivo do Retorno:
                        </span>
                        <p className="text-slate-800 font-medium">{ret.reason}</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/55 border border-white/75">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-700 block mb-0.5">
                          O que foi feito e ajustado:
                        </span>
                        <p className="text-slate-800 font-medium">{ret.technicalAction}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['em_analise', 'em_ajuste', 'liberado'] as ReturnStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => onUpdateReturnStatus(ret.id, st)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                ret.status === st
                                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-sm'
                                  : 'liquid-glass-pill text-slate-700'
                              }`}
                            >
                              {RETURN_STATUS_META[st].label}
                            </button>
                          )
                        )}
                      </div>

                      {stMeta.next && (
                        <button
                          type="button"
                          onClick={() => onUpdateReturnStatus(ret.id, stMeta.next!)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-white/40 shadow-sm flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>Avançar p/ {RETURN_STATUS_META[stMeta.next].label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
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
