import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  Edit3,
  Layers,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { StockCategory, StockItem } from '../types/order';
import { formatBRL, formatDateBR, toISODate } from '../utils/financeEngine';

interface StockSectionProps {
  items: StockItem[];
  globalSearchQuery: string;
  onAddItem: (
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onUpdateItem: (
    id: string,
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => void;
  onDeleteItem: (id: string) => void;
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
    defaultUnit: 'm',
    unitPresets: ['m', 'rolo', 'un', 'cx'],
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60',
  },
};

export const StockSection: React.FC<StockSectionProps> = ({
  items,
  globalSearchQuery,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'todos' | StockCategory>(
    'todos'
  );
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

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

  const handleQuickAdjustQuantity = (item: StockItem, delta: number) => {
    const nextQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    onUpdateItem(item.id, {
      category: item.category,
      name: item.name,
      quantity: nextQty,
      unit: item.unit,
      minStock: item.minStock,
      supplier: item.supplier,
      unitCost: item.unitCost,
      entryDate: item.entryDate,
    });
  };

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

                    {/* Quantity + Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-white/60 border border-white/80 rounded-2xl px-2.5 py-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustQuantity(item, -1)}
                          className="w-6 h-6 rounded-full bg-white/80 hover:bg-indigo-600 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="Baixar 1 unidade"
                        >
                          <Minus className="w-3 h-3" />
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
                          onClick={() => handleQuickAdjustQuantity(item, 1)}
                          className="w-6 h-6 rounded-full bg-white/80 hover:bg-indigo-600 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="Adicionar 1 unidade"
                        >
                          <Plus className="w-3 h-3" />
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
                        className="p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 transition cursor-pointer"
                        title="Editar item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingId === item.id) resetForm(category);
                          onDeleteItem(item.id);
                        }}
                        className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer"
                        title="Excluir item"
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
            Controle de insumos da oficina com alertas de estoque mínimo, fornecedores e custo unitário.
          </p>
        </div>

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
          {(lowMadeirasCount + lowLaminasCount > 0) && (
            <span className="px-3.5 py-2 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              {lowMadeirasCount + lowLaminasCount} em alerta
            </span>
          )}
        </div>
      </div>

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
            <span>
              Em falta ({lowMadeirasCount + lowLaminasCount})
            </span>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
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
                className="p-2 rounded-full liquid-glass-pill text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Cancelar edição"
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
                  ? 'Ex: Compensado Naval 18mm (1,20x2,40m)'
                  : 'Ex: Lâmina Corte 2pt 23.8mm Bohler'
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
                placeholder="chapa / m"
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
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
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
    </div>
  );
};
