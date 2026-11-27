import React, { useEffect, useRef, useState } from 'react';
import { Check, Layers, Loader2, X } from 'lucide-react';
import {
  Company,
  DieOrder,
  OrderUpsertPayload,
  PaymentModality,
  ProductionStage,
} from '../types/order';
import { PAYMENT_MODALITY_META, PRODUCTION_STAGES } from '../utils/financeEngine';

interface FastEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  nextOrderId: string;
  editingOrder?: DieOrder | null;
  onSaveOrder: (payload: OrderUpsertPayload) => Promise<boolean> | boolean;
  onUpdateOrder?: (
    orderId: string,
    payload: OrderUpsertPayload
  ) => Promise<boolean> | boolean;
}

export const FastEntryModal: React.FC<FastEntryModalProps> = ({
  isOpen,
  onClose,
  companies,
  nextOrderId,
  editingOrder = null,
  onSaveOrder,
  onUpdateOrder,
}) => {
  const isEditing = Boolean(editingOrder);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || 'nova');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [bladeMeters, setBladeMeters] = useState('');
  const [woodMm, setWoodMm] = useState<'' | 15 | 18 | 22>('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentModality, setPaymentModality] = useState<PaymentModality>('boleto');
  const [stage, setStage] = useState<ProductionStage>('arquivo_recebido');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wasOpenRef = useRef(false);
  const prevEditingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const editingKey = editingOrder ? `${editingOrder.id}:${editingOrder.updatedAt || ''}` : null;
    const justOpened = isOpen && !wasOpenRef.current;
    const editingChanged = isOpen && prevEditingKeyRef.current !== editingKey;

    if (justOpened || editingChanged) {
      if (editingOrder) {
        const matchedCompany = companies.find(
          (c) =>
            (editingOrder.companyUuid && c.dbUuid === editingOrder.companyUuid) ||
            (editingOrder.companyId && c.id === editingOrder.companyId) ||
            c.corporateName.trim().toLowerCase() ===
              (editingOrder.companyName || '').trim().toLowerCase()
        );
        if (matchedCompany) {
          setSelectedCompanyId(matchedCompany.id);
          setCustomCompanyName('');
        } else {
          setSelectedCompanyId('nova');
          setCustomCompanyName(editingOrder.companyName || '');
        }
        setToolDescription(editingOrder.toolDescription || '');
        setBladeMeters(
          editingOrder.bladeMeters !== undefined && editingOrder.bladeMeters !== null
            ? String(editingOrder.bladeMeters)
            : ''
        );
        setWoodMm(
          editingOrder.woodMm === 15 ||
            editingOrder.woodMm === 18 ||
            editingOrder.woodMm === 22
            ? editingOrder.woodMm
            : ''
        );
        setDueDate(editingOrder.dueDate ? editingOrder.dueDate.slice(0, 10) : '');
        setAmount(
          editingOrder.amount !== undefined && editingOrder.amount !== null
            ? String(editingOrder.amount)
            : ''
        );
        setPaymentModality(editingOrder.paymentModality || 'boleto');
        setStage(editingOrder.stage || 'arquivo_recebido');
      } else {
        setSelectedCompanyId(companies[0]?.id || 'nova');
        setCustomCompanyName('');
        setToolDescription('');
        setBladeMeters('');
        setWoodMm('');
        setDueDate('');
        setAmount('');
        setPaymentModality('boleto');
        setStage('arquivo_recebido');
      }
      setIsSubmitting(false);
    }

    wasOpenRef.current = isOpen;
    prevEditingKeyRef.current = isOpen ? editingKey : null;
  }, [isOpen, editingOrder, companies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !toolDescription.trim()) return;

    const existingComp = companies.find((c) => c.id === selectedCompanyId);
    const sameAdHocName =
      Boolean(editingOrder) &&
      customCompanyName.trim().toLowerCase() ===
        (editingOrder?.companyName || '').trim().toLowerCase();

    const companyName =
      selectedCompanyId === 'nova'
        ? customCompanyName.trim() || editingOrder?.companyName || 'Cliente Avulso'
        : existingComp?.corporateName || editingOrder?.companyName || 'Cliente';

    const companyId =
      existingComp?.id ||
      (sameAdHocName && editingOrder?.companyId ? editingOrder.companyId : '__new__');

    const companyPhone =
      existingComp?.phone ||
      (sameAdHocName && editingOrder?.companyPhone
        ? editingOrder.companyPhone
        : '(11) 99999-0000');

    const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
    const parsedBladeMeters = bladeMeters.trim()
      ? parseFloat(bladeMeters.replace(',', '.'))
      : null;

    const payload: OrderUpsertPayload = {
      companyId,
      companyName,
      companyPhone,
      toolDescription: toolDescription.trim(),
      bladeMeters:
        parsedBladeMeters !== null &&
        Number.isFinite(parsedBladeMeters) &&
        parsedBladeMeters >= 0
          ? parsedBladeMeters
          : null,
      woodMm: woodMm === 15 || woodMm === 18 || woodMm === 22 ? woodMm : null,
      dueDate: dueDate.trim() || undefined,
      amount: numericAmount,
      paymentModality,
      stage,
    };

    setIsSubmitting(true);
    try {
      const ok =
        editingOrder && onUpdateOrder
          ? await onUpdateOrder(editingOrder.id, payload)
          : await onSaveOrder(payload);
      if (ok !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  const modalTitle = editingOrder
    ? `Editar Faca ${editingOrder.id}`
    : 'Nova Ordem de Serviço';

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/35 backdrop-blur-md p-0 md:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
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
                  {modalTitle}
                </h2>
                {!editingOrder && (
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800">
                    {nextOrderId}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-600 truncate">
                {isEditing
                  ? 'Edição completa • Atualiza Esteira, Especificações e Financeiro'
                  : 'Lançamento rápido • Entra direto na Esteira e no Financeiro'}
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

            {/* 2b. Especificações & Prazo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lam. (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bladeMeters}
                  onChange={(e) => setBladeMeters(e.target.value)}
                  placeholder="Ex: 12.5"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Madeira (mm)
                </label>
                <select
                  value={woodMm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWoodMm(
                      val === '15' || val === '18' || val === '22'
                        ? (Number(val) as 15 | 18 | 22)
                        : ''
                    );
                  }}
                  className={inputClass}
                >
                  <option value="">Não informar</option>
                  <option value="15">15 mm</option>
                  <option value="18">18 mm</option>
                  <option value="22">22 mm</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Prazo / Vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
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
                  4. Status na Esteira
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
              {!isEditing && (
                <p className="text-[11px] font-medium text-slate-600 mt-1.5">
                  Toda OS entra automaticamente com status <strong>Não Pago</strong> até confirmação manual em &quot;Marcar como pago&quot;.
                </p>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-white/60 bg-white/45 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-3 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isEditing ? 'Salvando Alterações...' : 'Criando na Esteira...'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isEditing
                      ? 'Salvar Alterações'
                      : `Criar ${nextOrderId} na Esteira`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
