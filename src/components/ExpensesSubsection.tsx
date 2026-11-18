import React, { useEffect, useState } from 'react';
import { Calendar, Receipt } from 'lucide-react';
import { ExpenseCategoryKey, MonthlyExpenseRecord } from '../types/order';
import {
  createEmptyExpensesMap,
  EXPENSE_CATEGORIES,
  formatBRL,
  formatCurrencyMask,
  parseCurrencyMask,
} from '../utils/financeEngine';

interface ExpensesSubsectionProps {
  expenses: MonthlyExpenseRecord[];
  onUpsertMonthExpenses: (
    month: string,
    values: Record<ExpenseCategoryKey, number>
  ) => void;
}

export const ExpensesSubsection: React.FC<ExpensesSubsectionProps> = ({
  expenses,
  onUpsertMonthExpenses,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [draftValues, setDraftValues] = useState<Record<ExpenseCategoryKey, number>>(
    () => createEmptyExpensesMap()
  );

  useEffect(() => {
    const existing = expenses.find((e) => e.month === selectedMonth);
    setDraftValues({
      ...createEmptyExpensesMap(),
      ...(existing?.values || {}),
    });
  }, [selectedMonth, expenses]);

  const monthTotal = EXPENSE_CATEGORIES.reduce(
    (sum, cat) => sum + (draftValues[cat.key] || 0),
    0
  );

  const handleAmountChange = (key: ExpenseCategoryKey, rawInput: string) => {
    const parsed = parseCurrencyMask(rawInput);
    const next = {
      ...draftValues,
      [key]: parsed,
    };
    setDraftValues(next);
    onUpsertMonthExpenses(selectedMonth, next);
  };

  return (
    <div className="space-y-5">
      {/* Top Summary & Month Reference Selector */}
      <div className="liquid-glass rounded-[28px] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Total de Despesas do Mês
            </span>
            <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatBRL(monthTotal)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label
            htmlFor="expense-ref-month"
            className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Mês de Referência</span>
          </label>
          <input
            id="expense-ref-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
          />
        </div>
      </div>

      {/* Fixed Expense Categories Grid */}
      <div className="liquid-glass rounded-[28px] p-6 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60">
          Despesas Fixas e Operacionais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXPENSE_CATEGORIES.map((cat) => {
            const val = draftValues[cat.key] || 0;
            return (
              <div
                key={cat.key}
                className="p-3.5 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-3"
              >
                <span className="text-xs font-extrabold text-slate-900">
                  {cat.label}
                </span>

                <div className="relative w-44">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={cat.label}
                    value={formatCurrencyMask(val)}
                    onChange={(e) => handleAmountChange(cat.key, e.target.value)}
                    className="liquid-glass-pill w-full pl-9 pr-3.5 py-2 rounded-2xl text-right text-xs font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
