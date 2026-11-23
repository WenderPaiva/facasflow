import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  Clock,
  Edit3,
  History,
  Layers,
  Minus,
  Package,
  PackageMinus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  StockCategory,
  StockItem,
  StockMovementRecord,
  UserRole,
} from '../types/order';
import {
  formatBRL,
  formatDateBR,
  formatDateTimeGoiasBR,
  toISODate,
} from '../utils/financeEngine';

interface StockSectionProps {
  userRole: UserRole;
  items: StockItem[];
  movements: StockMovementRecord[];
  globalSearchQuery: string;
  onAddItem: (
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onUpdateItem: (
    id: string,
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onDeleteItem: (id: string) => void;
  onQuickConsume: (
    item: StockItem,
    quantity: number,
    note?: string
  ) => Promise<void>;
  onQuickReplenish: (
    item: StockItem,
    quantity: number,
    note?: string
  ) => Promise<void>;
  onRevertMovement: (movement: StockMovementRecord) => Promise<void>;
}

const CATEGORY_META: Record<
  StockCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    defaultUnit: string;
    unitPresets: string[];
    badgeClass: string;
  }
> = {
  madeiras: {
    label: '1. Madeiras',
    shortLabel: 'Madeiras',
    description: 'Compensados 15mm, 18mm, 22mm e bases estruturais',
    defaultUnit: 'chapa',
    unitPresets: ['chapa', 'un', 'm²', 'placa'],
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300/60',
  },
  laminas: {
    label: '2. Lâminas',
    shortLabel: 'Lâminas',
    description: 'Lâminas de corte, vinco, picote e serrilha',
    defaultUnit: 'cx',
    unitPresets: ['cx', 'm', 'rolo', 'un'],
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60',
  },
};

export const StockSection: React.FC<StockSectionProps> = ({
  userRole,
  items,
  movements,
  globalSearchQuery,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onQuickConsume,
  onQuickReplenish,
  onRevertMovement,
}) => {
  const isOperator = userRole === 'operador';
  const [categoryFilter, setCategoryFilter] = useState<'todos' | StockCategory>(
    'todos'
  );
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Quick Consumption State
  const [selectedConsumeId, setSelectedConsumeId] = useState<string>('');
  const [customConsumeQty, setCustomConsumeQty] = useState<string>('1');
  const [consumeNote, setConsumeNote] = useState<string>('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [busyMoveId, setBusyMoveId] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Form state (Create / Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<StockCategory>('madeiras');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('chapa');
  const [minStock, setMinStock] = useState('5');
  const [supplier, setSupplier] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [entryDate, setEntryDate] = useState(() => toISODate());

  const resetForm = (nextCat: StockCategory = 'madeiras') => {
    setEditingId(null);
    setCategory(nextCat);
    setName('');
    setQuantity('');
    setUnit(CATEGORY_META[nextCat].defaultUnit);
    setMinStock('5');
    setSupplier('');
    setUnitCost('');
    setEntryDate(toISODate());
  };

  const handleSelectFormCategory = (cat: StockCategory) => {
    setCategory(cat);
    if (!editingId) {
      setUnit(CATEGORY_META[cat].defaultUnit);
    }
  };

  const handleStartEdit = (item: StockItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setName(item.name);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setMinStock(String(item.minStock));
    setSupplier(item.supplier);
    setUnitCost(String(item.unitCost));
    setEntryDate(item.entryDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'> = {
      category,
      name: name.trim(),
      quantity: Math.max(0, parseFloat(quantity.replace(',', '.')) || 0),
      unit: unit.trim() || CATEGORY_META[category].defaultUnit,
      minStock: Math.max(0, parseFloat(minStock.replace(',', '.')) || 0),
      supplier: supplier.trim() || 'Não informado',
      unitCost: Math.max(0, parseFloat(unitCost.replace(',', '.')) || 0),
      entryDate: entryDate || toISODate(),
    };

    if (editingId) {
      onUpdateItem(editingId, payload);
    } else {
      onAddItem(payload);
    }
    resetForm(category);
  };

  const handleTriggerConsume = async (
    item: StockItem,
    qty: number,
    note?: string
  ) => {
    if (busyItemId || qty <= 0 || item.quantity <= 0) return;
    setBusyItemId(item.id);
    try {
      await onQuickConsume(item, qty, note);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleTriggerReplenish = async (item: StockItem, qty: number) => {
    if (busyItemId || qty <= 0) return;
    setBusyItemId(item.id);
    try {
      await onQuickReplenish(item, qty, 'Reposição rápida');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleCustomConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem =
      items.find((i) => i.id === selectedConsumeId) || items[0];
    if (!targetItem) return;
    const qty = Math.max(
      0.01,
      parseFloat(customConsumeQty.replace(',', '.')) || 1
    );
    await handleTriggerConsume(targetItem, qty, consumeNote.trim() || undefined);
    setCustomConsumeQty('1');
    setConsumeNote('');
  };

  const handleUndo = async (mov: StockMovementRecord) => {
    if (busyMoveId || mov.revertedAt || mov.type === 'estorno') return;
    setBusyMoveId(mov.id);
    try {
      await onRevertMovement(mov);
    } finally {
      setBusyMoveId(null);
    }
  };

  // Highlighted quick-action items: prioritize primary Madeira & primary Lâmina first, then up to 6 total
  const quickActionItems = useMemo(() => {
    const madeiras = items.filter((i) => i.category === 'madeiras');
    const laminas = items.filter((i) => i.category === 'laminas');
    const ordered: StockItem[] = [];
    if (madeiras[0]) ordered.push(madeiras[0]);
    if (laminas[0]) ordered.push(laminas[0]);
    for (const item of [...madeiras.slice(1), ...laminas.slice(1)]) {
      if (ordered.length >= 6) break;
      ordered.push(item);
    }
    return ordered;
  }, [items]);

  const combinedQuery = (localSearch || globalSearchQuery).trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'todos' && item.category !== categoryFilter) {
        return false;
      }
      if (onlyLowStock && item.quantity > item.minStock) {
        return false;
      }
      if (!combinedQuery) return true;
      return (
        item.id.toLowerCase().includes(combinedQuery) ||
        item.name.toLowerCase().includes(combinedQuery) ||
        item.supplier.toLowerCase().includes(combinedQuery) ||
        item.unit.toLowerCase().includes(combinedQuery) ||
        CATEGORY_META[item.category].shortLabel
          .toLowerCase()
          .includes(combinedQuery)
      );
    });
  }, [items, categoryFilter, onlyLowStock, combinedQuery]);

  const madeirasItems = filteredItems.filter((i) => i.category === 'madeiras');
  const laminasItems = filteredItems.filter((i) => i.category === 'laminas');

  const totalMadeirasCount = items.filter((i) => i.category === 'madeiras').length;
  const totalLaminasCount = items.filter((i) => i.category === 'laminas').length;
  const lowMadeirasCount = items.filter(
    (i) => i.category === 'madeiras' && i.quantity <= i.minStock
  ).length;
  const lowLaminasCount = items.filter(
    (i) => i.category === 'laminas' && i.quantity <= i.minStock
  ).length;
  const totalStockValue = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0),
    0
  );

  const visibleMovements = showFullHistory ? movements : movements.slice(0, 6);

  const inputClass =
    'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  const renderCategoryBlock = (
    catKey: StockCategory,
    catItems: StockItem[]
  ) => {
    const meta = CATEGORY_META[catKey];
    const catLowCount = catItems.filter((i) => i.quantity <= i.minStock).length;

    return (
      <div
        key={catKey}
        className="liquid-glass rounded-[28px] p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700">
              {catKey === 'madeiras' ? (
                <Layers className="w-4 h-4" />
              ) : (
                <Boxes className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {meta.label} ({catItems.length})
              </h3>
              <p className="text-[11px] font-medium text-slate-600">
                {meta.description}
              </p>
            </div>
          </div>

          {catLowCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              {catLowCount} em falta / mínimo
            </span>
          )}
        </div>

        {catItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
            Nenhum item encontrado em {meta.shortLabel}.
          </div>
        ) : (
          <div className="space-y-3">
            {catItems.map((item) => {
              const isLow = item.quantity <= item.minStock;
              const isBeingEdited = editingId === item.id;
              const totalValue = item.quantity * item.unitCost;
              const isBusy = busyItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl liquid-glass-subtle transition flex flex-col gap-3 ${
                    isLow
                      ? 'ring-2 ring-amber-400/80 bg-amber-500/10'
                      : ''
                  } ${isBeingEdited ? 'ring-2 ring-indigo-500/80' : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-[11px] font-bold text-indigo-800">
                          {item.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}
                        >
                          {meta.shortLabel}
                        </span>
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/25 text-amber-900 border border-amber-400/70">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            Estoque Baixo (≤ {item.minStock} {item.unit})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60">
                            OK
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {item.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-700">
                        <span>
                          Fornecedor:{' '}
                          <strong className="text-slate-900">{item.supplier}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Entrada:{' '}
                          <strong className="font-mono text-slate-900">
                            {formatDateBR(item.entryDate)}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Custo unit.:{' '}
                          <strong className="font-mono text-emerald-700">
                            {formatBRL(item.unitCost)}/{item.unit}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Quantity + Centered Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-white/60 border border-white/80 rounded-2xl px-2.5 py-1.5">
                        <button
                          type="button"
                          disabled={isBusy || item.quantity <= 0}
                          onClick={() => handleTriggerConsume(item, 1, 'Baixa rápida na lista')}
                          className="btn-compact w-7 h-7 rounded-full bg-white/85 hover:bg-rose-600 disabled:opacity-40 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="Dar baixa de 1 unidade"
                          aria-label="Dar baixa de 1 unidade"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="px-2 text-center min-w-[68px]">
                          <span
                            className={`text-sm font-black font-mono block leading-none ${
                              isLow ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            Mín: {item.minStock}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTriggerReplenish(item, 1)}
                          className="btn-compact w-7 h-7 rounded-full bg-white/85 hover:bg-emerald-600 disabled:opacity-40 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="Adicionar 1 unidade"
                          aria-label="Adicionar 1 unidade"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right font-mono px-2">
                        <span className="text-[10px] font-bold uppercase text-slate-600 block">
                          Subtotal
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatBRL(totalValue)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Editar item"
                        aria-label="Editar item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingId === item.id) resetForm(category);
                          onDeleteItem(item.id);
                        }}
                        className="btn-compact w-8 h-8 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                        title="Excluir item"
                        aria-label="Excluir item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Quick Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
            Estoque de Madeiras e Lâminas
          </h2>
          <p className="text-xs font-medium text-slate-700">
            {isOperator
              ? 'Registre rapidamente o consumo de insumos na produção e acompanhe o histórico recente.'
              : 'Controle de insumos com baixa rápida de consumo, histórico auditável e alertas de estoque mínimo.'}
          </p>
        </div>

        {!isOperator && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="liquid-glass-pill px-3.5 py-2 rounded-full text-xs font-bold text-slate-800">
              Itens: <strong className="text-indigo-700">{items.length}</strong>
            </span>
            <span className="liquid-glass-pill px-3.5 py-2 rounded-full text-xs font-bold text-slate-800">
              Valor em Estoque:{' '}
              <strong className="text-emerald-700 font-mono">
                {formatBRL(totalStockValue)}
              </strong>
            </span>
            {lowMadeirasCount + lowLaminasCount > 0 && (
              <span className="px-3.5 py-2 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70 inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                {lowMadeirasCount + lowLaminasCount} em alerta
              </span>
            )}
          </div>
        )}
      </div>

      {/* DESTAQUE: Subseção de Registro Rápido de Consumo (Baixa de Insumos) */}
      <section className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-4 ring-1 ring-indigo-400/40">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-300/60 flex items-center justify-center text-rose-700 shrink-0">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Registro Rápido de Consumo
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Dê baixa direta no saldo com 1 clique. Toda movimentação registra data, hora e colaborador com opção de desfazer.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/65 border border-white/80 text-slate-700 inline-flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            {movements.length} movimentação(ões)
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-white/75 bg-white/25 text-center text-xs font-medium text-slate-600">
            {isOperator
              ? 'Nenhum insumo cadastrado ainda. Solicite ao administrador o cadastro dos materiais no estoque.'
              : 'Cadastre seus primeiros insumos abaixo (ex.: Chapa de Madeira, Caixa de Lâmina) para liberar os botões de baixa rápida.'}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Botões de Ação Direta (-1 unidade) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {quickActionItems.map((item) => {
                const isLow = item.quantity <= item.minStock;
                const isBusy = busyItemId === item.id;
                const unitLabel =
                  item.category === 'madeiras' && item.unit.toLowerCase() === 'chapa'
                    ? 'Chapa'
                    : item.category === 'laminas' &&
                        (item.unit.toLowerCase() === 'cx' ||
                          item.unit.toLowerCase() === 'caixa')
                      ? 'Caixa'
                      : item.unit;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isBusy || item.quantity <= 0}
                    onClick={() => handleTriggerConsume(item, 1, 'Consumo rápido de produção')}
                    className={`group p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                      isLow
                        ? 'bg-amber-500/15 border-amber-400/70 hover:bg-amber-500/25'
                        : 'bg-white/55 border-white/80 hover:bg-white/80 hover:border-rose-300/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-xs shrink-0">
                          - 1 {unitLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            CATEGORY_META[item.category].badgeClass
                          }`}
                        >
                          {CATEGORY_META[item.category].shortLabel}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-1.5 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 mt-0.5 font-mono">
                        Saldo atual:{' '}
                        <strong className={isLow ? 'text-amber-900' : 'text-slate-900'}>
                          {item.quantity} {item.unit}
                        </strong>
                      </p>
                    </div>

                    <span className="btn-compact w-9 h-9 rounded-xl bg-rose-500/15 group-hover:bg-rose-600 text-rose-700 group-hover:text-white border border-rose-300/60 flex items-center justify-center transition shrink-0">
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Baixa personalizada para qualquer outro insumo cadastrado */}
            <form
              onSubmit={handleCustomConsumeSubmit}
              className="p-3.5 rounded-2xl bg-white/45 border border-white/75 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end"
            >
              <div className="md:col-span-5">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Outro Insumo Cadastrado
                </label>
                <select
                  value={selectedConsumeId || items[0]?.id || ''}
                  onChange={(e) => setSelectedConsumeId(e.target.value)}
                  className={inputClass}
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Saldo: {it.quantity} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={customConsumeQty}
                  onChange={(e) => setCustomConsumeQty(e.target.value)}
                  className={`${inputClass} font-mono font-bold`}
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={consumeNote}
                  onChange={(e) => setConsumeNote(e.target.value)}
                  placeholder="Ex.: OS-042 / Bancada"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={Boolean(busyItemId)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white shadow-md inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PackageMinus className="w-4 h-4 shrink-0" />
                  <span>Dar Baixa</span>
                </button>
              </div>
            </form>

            {/* Histórico de Movimentações */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Histórico Recente de Consumo e Movimentações</span>
                </h4>
                {movements.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowFullHistory((p) => !p)}
                    className="btn-compact text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    {showFullHistory
                      ? 'Mostrar menos'
                      : `Ver todas (${movements.length})`}
                  </button>
                )}
              </div>

              {visibleMovements.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-white/75 text-center text-xs font-medium text-slate-600">
                  Nenhuma movimentação registrada ainda. Clique em um botão acima para dar baixa.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {visibleMovements.map((mov) => {
                    const isConsumo = mov.type === 'consumo';
                    const isEstorno = mov.type === 'estorno';
                    const isReverted = Boolean(mov.revertedAt);

                    return (
                      <div
                        key={mov.id}
                        className={`p-3 rounded-2xl bg-white/55 border border-white/80 flex items-center justify-between gap-2.5 text-xs ${
                          isReverted ? 'opacity-65' : ''
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                isEstorno
                                  ? 'bg-slate-500/15 text-slate-700 border-slate-300/70'
                                  : isConsumo
                                    ? 'bg-rose-500/15 text-rose-800 border-rose-300/60'
                                    : 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60'
                              }`}
                            >
                              {isEstorno
                                ? 'Estorno'
                                : isConsumo
                                  ? `- ${mov.quantity} ${mov.unit}`
                                  : `+ ${mov.quantity} ${mov.unit}`}
                            </span>
                            <span className="font-extrabold text-slate-900 truncate">
                              {mov.itemName}
                            </span>
                            {isReverted && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-600">
                                Desfeito
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-medium text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3 text-indigo-600" />
                              {mov.actorName}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formatDateTimeGoiasBR(mov.createdAt)}
                            </span>
                            <span className="font-mono">
                              Saldo: {mov.previousBalance} → <strong>{mov.newBalance}</strong>
                            </span>
                          </div>
                        </div>

                        {!isEstorno && !isReverted && (
                          <button
                            type="button"
                            disabled={busyMoveId === mov.id}
                            onClick={() => handleUndo(mov)}
                            className="btn-compact px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white/80 hover:bg-indigo-600 text-slate-700 hover:text-white border border-white/90 inline-flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                            title="Desfazer esta movimentação"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Desfazer</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Área Administrativa de Controle de Estoque (oculta para Operador) */}
      {!isOperator && (
        <>
          {/* Category Filter Tabs + Local Search */}
          <div className="liquid-glass rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('todos')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              categoryFilter === 'todos'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'liquid-glass-pill text-slate-700'
            }`}
          >
            Todas ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('madeiras')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              categoryFilter === 'madeiras'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'liquid-glass-pill text-slate-700'
            }`}
          >
            1. Madeiras ({totalMadeirasCount})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('laminas')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              categoryFilter === 'laminas'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'liquid-glass-pill text-slate-700'
            }`}
          >
            2. Lâminas ({totalLaminasCount})
          </button>
          <button
            type="button"
            onClick={() => setOnlyLowStock((prev) => !prev)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${
              onlyLowStock
                ? 'bg-amber-500 text-white border-white/40 shadow-md'
                : 'liquid-glass-pill text-amber-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Em falta ({lowMadeirasCount + lowLaminasCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filtrar insumo, fornecedor..."
            className="liquid-glass-pill w-full pl-10 pr-8 py-2 rounded-full text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="btn-compact absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Split Grid: Left Add/Edit Form (5 Cols) + Right Categories (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingId
                    ? `Editar Item (${editingId})`
                    : 'Cadastrar Item no Estoque'}
                </h3>
                <p className="text-[11px] font-medium text-slate-600">
                  Madeiras e Lâminas com controle de mínimo
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={() => resetForm(category)}
                className="btn-compact w-8 h-8 rounded-full liquid-glass-pill text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer"
                title="Cancelar edição"
                aria-label="Cancelar edição"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 1. Categoria */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              1. Categoria *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['madeiras', 'laminas'] as StockCategory[]).map((cat) => {
                const active = category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleSelectFormCategory(cat)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                        : 'liquid-glass-pill text-slate-700'
                    }`}
                  >
                    {CATEGORY_META[cat].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Nome / Tipo */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              2. Nome / Tipo do Material *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                category === 'madeiras'
                  ? 'Ex: Chapa de Madeira Naval 18mm'
                  : 'Ex: Caixa de Lâmina Corte 2pt 23.8mm'
              }
              className={inputClass}
            />
          </div>

          {/* 3. Quantidade, Unidade e Estoque Mínimo */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Quantidade *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 12"
                className={`${inputClass} font-mono font-bold`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Unidade *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="chapa / cx"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Mínimo *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="Ex: 5"
                className={`${inputClass} font-mono font-bold`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_META[category].unitPresets.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setUnit(preset)}
                className={`btn-compact px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  unit === preset
                    ? 'bg-indigo-600 text-white'
                    : 'liquid-glass-pill text-slate-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* 4. Fornecedor */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              4. Fornecedor *
            </label>
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ex: Madeireira Brasil / AçoCut"
              className={inputClass}
            />
          </div>

          {/* 5. Custo Unitário e Data de Entrada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                5. Custo Unitário (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="Ex: 145,00"
                className={`${inputClass} font-mono font-bold`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                6. Data de Entrada *
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {editingId ? `Salvar Alterações (${editingId})` : 'Adicionar ao Estoque'}
            </span>
          </button>
        </form>

        {/* Right Column: Separated Category Blocks */}
        <div className="lg:col-span-7 space-y-5">
          {(categoryFilter === 'todos' || categoryFilter === 'madeiras') &&
            renderCategoryBlock('madeiras', madeirasItems)}

          {(categoryFilter === 'todos' || categoryFilter === 'laminas') &&
            renderCategoryBlock('laminas', laminasItems)}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
