import React, { useEffect, useState } from 'react';
import { Check, Layers, X } from 'lucide-react';
import {
  Company,
  PaymentModality,
  ProductionStage,
} from '../types/order';
import { PAYMENT_MODALITY_META, PRODUCTION_STAGES } from '../utils/financeEngine';

interface FastEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  nextOrderId: string;
  onSaveOrder: (payload: {
    companyId: string;
    companyName: string;
    companyPhone: string;
    toolDescription: string;
    amount: number;
    paymentModality: PaymentModality;
    stage: ProductionStage;
  }) => void;
}

export const FastEntryModal: React.FC<FastEntryModalProps> = ({
  isOpen,
  onClose,
  companies,
  nextOrderId,
  onSaveOrder,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentModality, setPaymentModality] = useState<PaymentModality>('boleto');
  const [stage, setStage] = useState<ProductionStage>('arquivo_recebido');

  useEffect(() => {
    if (isOpen) {
      setSelectedCompanyId(companies[0]?.id || 'nova');
      setCustomCompanyName('');
      setToolDescription('');
      setAmount('');
      setPaymentModality('boleto');
      setStage('arquivo_recebido');
    }
  }, [isOpen, companies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolDescription.trim()) return;

    const existingComp = companies.find((c) => c.id === selectedCompanyId);
    const companyName =
      selectedCompanyId === 'nova'
        ? customCompanyName.trim() || 'Cliente Avulso'
        : existingComp?.corporateName || 'Cliente';
    const companyPhone = existingComp?.phone || '(11) 99999-0000';
    const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

    onSaveOrder({
      companyId: existingComp?.id || `EMP-${Date.now().toString().slice(-3)}`,
      companyName,
      companyPhone,
      toolDescription: toolDescription.trim(),
      amount: numericAmount,
      paymentModality,
      stage,
    });

    onClose();
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/35 backdrop-blur-md p-0 md:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nova Ordem de Serviço"
        className="w-full md:max-w-lg max-h-[92dvh] rounded-t-[28px] md:rounded-[30px] liquid-glass bg-white/70 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Nova Ordem de Serviço
                </h2>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800">
                  {nextOrderId}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Lançamento rápido • Entra direto na Esteira e no Financeiro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="min-h-[44px] min-w-[44px] rounded-full liquid-glass-pill text-slate-700 hover:text-slate-950 transition inline-flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
            {/* 1. Seleção da Empresa Cliente */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                1. Empresa / Cliente
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className={inputClass}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.corporateName} ({c.cnpj})
                  </option>
                ))}
                <option value="nova">+ Digitar Nova Empresa Rapidamente...</option>
              </select>

              {selectedCompanyId === 'nova' && (
                <input
                  type="text"
                  required
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  placeholder="Digite a Razão Social ou Nome da Gráfica"
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>

            {/* 2. Dados da Faca */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                2. Descrição Detalhada da Ferramenta
              </label>
              <input
                type="text"
                required
                autoFocus
                value={toolDescription}
                onChange={(e) => setToolDescription(e.target.value)}
                placeholder="Ex: Faca Caixa Duplex Tampa e Fundo"
                className={inputClass}
              />
            </div>

            {/* 3. Valor & Status Inicial de Produção */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  3. Valor em R$
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 680,00"
                  className={`${inputClass} font-mono font-bold`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  4. Status Inicial na Esteira
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProductionStage)}
                  className={inputClass}
                >
                  {PRODUCTION_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.step}. {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Condição de Pagamento (5 Modalidades) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                5. Condição de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PAYMENT_MODALITY_META) as PaymentModality[]).map((mod) => {
                  const meta = PAYMENT_MODALITY_META[mod];
                  const selected = paymentModality === mod;
                  return (
                    <button
                      type="button"
                      key={mod}
                      onClick={() => setPaymentModality(mod)}
                      className={`min-h-[44px] py-2 px-3 rounded-2xl text-xs font-bold border text-left flex items-center justify-between transition cursor-pointer ${
                        selected
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                          : 'liquid-glass-pill text-slate-700'
                      }`}
                    >
                      <span className="truncate">{meta.short}</span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-white/60 bg-white/45 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="submit"
              className="w-full min-h-[48px] py-3 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar {nextOrderId} na Esteira</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
