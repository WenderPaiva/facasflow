import React, { useState } from 'react';
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

export const InvestmentsSubsection: React.FC<InvestmentsSubsectionProps> = ({
  investments,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
}) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<InvestmentType>('renda_fixa');
  const [appliedDate, setAppliedDate] = useState(() => toISODate());
  const [investedAmount, setInvestedAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);

  const totalInvested = investments.reduce(
    (sum, inv) => sum + (inv.investedAmount || 0),
    0
  );
  const totalCurrent = investments.reduce(
    (sum, inv) => sum + (inv.currentAmount || 0),
    0
  );
  const totalYieldBRL = totalCurrent - totalInvested;
  const totalYieldPct =
    totalInvested > 0 ? (totalYieldBRL / totalInvested) * 100 : 0;

  const resetForm = () => {
    setEditId(null);
    setAssetName('');
    setAssetType('renda_fixa');
    setAppliedDate(toISODate());
    setInvestedAmount(0);
    setCurrentAmount(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    const payload = {
      assetName: assetName.trim(),
      assetType,
      appliedDate: appliedDate || toISODate(),
      investedAmount,
      currentAmount,
    };
    if (editId) {
      onUpdateInvestment(editId, payload);
    } else {
      onAddInvestment(payload);
    }
    resetForm();
  };

  const inputClass =
    'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      {/* Top Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="liquid-glass rounded-[28px] p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Investido
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono mt-2">
            {formatBRL(totalInvested)}
          </p>
        </div>

        <div className="liquid-glass rounded-[28px] p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Saldo Atual
          </span>
          <p className="text-3xl font-black text-indigo-700 font-mono mt-2">
            {formatBRL(totalCurrent)}
          </p>
        </div>

        <div className="liquid-glass rounded-[28px] p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Rendimento Total
          </span>
          <p
            className={`text-3xl font-black font-mono mt-2 ${
              totalYieldBRL >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {totalYieldBRL >= 0 ? '+' : ''}
            {formatBRL(totalYieldBRL)}
          </p>
          <span className="text-xs font-bold text-slate-700 font-mono">
            {totalYieldPct >= 0 ? '+' : ''}
            {totalYieldPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-3.5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                {editId ? `Editar Ativo ${editId}` : 'Cadastrar Investimento'}
              </h3>
            </div>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-full liquid-glass-pill text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nome do Ativo
            </label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Ex: CDB Liquidez Diária, Tesouro Selic, HGLG11"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tipo
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as InvestmentType)}
                className={inputClass}
              >
                {Object.entries(INVESTMENT_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Data de Aplicação
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Valor Aplicado em R$
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
                  onChange={(e) =>
                    setInvestedAmount(parseCurrencyMask(e.target.value))
                  }
                  className={`${inputClass} pl-9 text-right font-mono font-bold`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Valor Atual em R$
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatCurrencyMask(currentAmount)}
                  onChange={(e) =>
                    setCurrentAmount(parseCurrencyMask(e.target.value))
                  }
                  className={`${inputClass} pl-9 text-right font-mono font-bold`}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{editId ? 'Salvar Investimento' : 'Adicionar Investimento'}</span>
          </button>
        </form>

        <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60">
            Carteira de Investimentos
          </h3>

          {investments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
              Nenhum investimento registrado ainda.
            </div>
          ) : (
            investments.map((inv) => {
              const yieldBRL = inv.currentAmount - inv.investedAmount;
              const yieldPct =
                inv.investedAmount > 0
                  ? (yieldBRL / inv.investedAmount) * 100
                  : 0;

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {inv.assetName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                        {INVESTMENT_TYPE_META[inv.assetType]?.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">
                      Aplicado em {formatDateBR(inv.appliedDate)} • Base{' '}
                      <span className="font-mono font-bold">
                        {formatBRL(inv.investedAmount)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-slate-900 block">
                        {formatBRL(inv.currentAmount)}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold ${
                          yieldBRL >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {yieldBRL >= 0 ? '+' : ''}
                        {formatBRL(yieldBRL)} • {yieldPct >= 0 ? '+' : ''}
                        {yieldPct.toFixed(2)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditId(inv.id);
                        setAssetName(inv.assetName);
                        setAssetType(inv.assetType);
                        setAppliedDate(inv.appliedDate);
                        setInvestedAmount(inv.investedAmount);
                        setCurrentAmount(inv.currentAmount);
                      }}
                      className="p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 cursor-pointer"
                      title="Editar investimento"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (editId === inv.id) resetForm();
                        onDeleteInvestment(inv.id);
                      }}
                      className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer"
                      title="Remover investimento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
