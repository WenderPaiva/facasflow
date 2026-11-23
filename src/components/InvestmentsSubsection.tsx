import React, { useMemo, useState } from 'react';
import { Check, Edit3, TrendingUp, Trash2, X } from 'lucide-react';
import { InvestmentRecord, InvestmentType } from '../types/order';
import {
  formatBRL,
  formatCurrencyMask,
  formatDateBR,
  INVESTMENT_TYPE_META,
  parseCurrencyMask,
  toISODate,
} from '../utils/financeEngine';

interface InvestmentsSubsectionProps {
  investments: InvestmentRecord[];
  onAddInvestment: (
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onUpdateInvestment: (
    id: string,
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onDeleteInvestment: (id: string) => void;
}

const INVESTMENT_CATEGORIES: InvestmentType[] = [
  'aplicacao',
  'consorcio',
  'outros',
];

export const InvestmentsSubsection: React.FC<InvestmentsSubsectionProps> = ({
  investments,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'todos' | InvestmentType>(
    'todos'
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [description, setDescription] = useState('');
  const [assetType, setAssetType] = useState<InvestmentType>('aplicacao');
  const [appliedDate, setAppliedDate] = useState(() => toISODate());
  const [investedAmount, setInvestedAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [customCurrentTouched, setCustomCurrentTouched] = useState(false);

  const filteredInvestments = useMemo(() => {
    if (categoryFilter === 'todos') return investments;
    return investments.filter((inv) => inv.assetType === categoryFilter);
  }, [investments, categoryFilter]);

  const totalInvested = investments.reduce(
    (sum, inv) => sum + (inv.investedAmount || 0),
    0
  );
  const totalsByCategory = useMemo(() => {
    return {
      aplicacao: investments
        .filter((i) => i.assetType === 'aplicacao')
        .reduce((s, i) => s + (i.investedAmount || 0), 0),
      consorcio: investments
        .filter((i) => i.assetType === 'consorcio')
        .reduce((s, i) => s + (i.investedAmount || 0), 0),
      outros: investments
        .filter((i) => i.assetType === 'outros')
        .reduce((s, i) => s + (i.investedAmount || 0), 0),
    };
  }, [investments]);

  const resetForm = () => {
    setEditId(null);
    setAssetName('');
    setDescription('');
    setAssetType('aplicacao');
    setAppliedDate(toISODate());
    setInvestedAmount(0);
    setCurrentAmount(0);
    setCustomCurrentTouched(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || investedAmount <= 0) return;
    const resolvedCurrent =
      customCurrentTouched && currentAmount > 0 ? currentAmount : investedAmount;

    const payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'> = {
      assetName: assetName.trim(),
      description: description.trim() || undefined,
      assetType,
      appliedDate: appliedDate || toISODate(),
      investedAmount,
      currentAmount: resolvedCurrent,
    };
    if (editId) {
      onUpdateInvestment(editId, payload);
    } else {
      onAddInvestment(payload);
    }
    resetForm();
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      {/* Top Category & Total Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass rounded-[28px] p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Total em Investimentos
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1.5">
            {formatBRL(totalInvested)}
          </p>
          <span className="text-xs font-semibold text-slate-600 mt-0.5 block">
            {investments.length} lançamento(s)
          </span>
        </div>

        <div className="liquid-glass rounded-[28px] p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
            Aplicação
          </span>
          <p className="text-2xl font-black text-indigo-700 font-mono mt-1.5">
            {formatBRL(totalsByCategory.aplicacao)}
          </p>
        </div>

        <div className="liquid-glass rounded-[28px] p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Consórcio
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1.5">
            {formatBRL(totalsByCategory.consorcio)}
          </p>
        </div>

        <div className="liquid-glass rounded-[28px] p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Outros
          </span>
          <p className="text-2xl font-black text-slate-800 font-mono mt-1.5">
            {formatBRL(totalsByCategory.outros)}
          </p>
        </div>
      </div>

      {/* Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                {editId ? `Editar Lançamento (${editId})` : 'Novo Lançamento de Investimento'}
              </h3>
            </div>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-compact w-8 h-8 rounded-full liquid-glass-pill text-slate-600 flex items-center justify-center cursor-pointer"
                title="Cancelar edição"
                aria-label="Cancelar edição"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categoria (3 opções livres) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Categoria *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INVESTMENT_CATEGORIES.map((cat) => {
                const active = assetType === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAssetType(cat)}
                    className={`min-h-[42px] px-3 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                        : 'liquid-glass-pill text-slate-700'
                    }`}
                  >
                    {INVESTMENT_TYPE_META[cat].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Ex: CDB Reserva de Caixa, Parcela Consórcio Laser, Aporte Extra"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatCurrencyMask(investedAmount)}
                  onChange={(e) => {
                    const parsed = parseCurrencyMask(e.target.value);
                    setInvestedAmount(parsed);
                    if (!customCurrentTouched) {
                      setCurrentAmount(parsed);
                    }
                  }}
                  className={`${inputClass} pl-9 text-right font-mono font-bold`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Saldo Atualizado (R$){' '}
              <span className="font-medium text-slate-500">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrencyMask(currentAmount)}
                onChange={(e) => {
                  setCustomCurrentTouched(true);
                  setCurrentAmount(parseCurrencyMask(e.target.value));
                }}
                className={`${inputClass} pl-9 text-right font-mono font-bold`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Observações{' '}
              <span className="font-medium text-slate-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais, banco, cota ou referência..."
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{editId ? 'Salvar Alterações' : 'Registrar Investimento'}</span>
          </button>
        </form>

        <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/60">
            <h3 className="text-sm font-extrabold text-slate-900">
              Lançamentos de Investimentos ({filteredInvestments.length})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['todos', ...INVESTMENT_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`btn-compact px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'liquid-glass-pill text-slate-700'
                  }`}
                >
                  {cat === 'todos' ? 'Todos' : INVESTMENT_TYPE_META[cat].label}
                </button>
              ))}
            </div>
          </div>

          {filteredInvestments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
              Nenhum lançamento de investimento nesta categoria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvestments.map((inv) => {
                const catMeta = INVESTMENT_TYPE_META[inv.assetType];
                const diffBRL = inv.currentAmount - inv.investedAmount;

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {inv.assetName}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catMeta?.badgeClass}`}
                        >
                          {catMeta?.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        Data: <span className="font-mono">{formatDateBR(inv.appliedDate)}</span>
                        {inv.description && <> • {inv.description}</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-sm font-black text-slate-900 block">
                          {formatBRL(inv.investedAmount)}
                        </span>
                        {Math.abs(diffBRL) > 0.01 && (
                          <span
                            className={`text-[10px] font-extrabold ${
                              diffBRL >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            Atual: {formatBRL(inv.currentAmount)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditId(inv.id);
                          setAssetName(inv.assetName);
                          setDescription(inv.description || '');
                          setAssetType(inv.assetType);
                          setAppliedDate(inv.appliedDate);
                          setInvestedAmount(inv.investedAmount);
                          setCurrentAmount(inv.currentAmount);
                          setCustomCurrentTouched(
                            Math.abs(inv.currentAmount - inv.investedAmount) > 0.01
                          );
                        }}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Editar investimento"
                        aria-label="Editar investimento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (editId === inv.id) resetForm();
                          onDeleteInvestment(inv.id);
                        }}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Excluir investimento"
                        aria-label="Excluir investimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
