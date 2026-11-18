import React, { useState } from 'react';
import {
  Building2,
  Check,
  Layers,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { Company, DieOrder, PaymentModality } from '../types/order';
import {
  formatBRL,
  formatDateBR,
  PAYMENT_MODALITY_META,
  PRODUCTION_STAGES,
} from '../utils/financeEngine';

interface CompaniesCrmSectionProps {
  companies: Company[];
  orders: DieOrder[];
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;
  onAddCompany: (company: Omit<Company, 'id'>) => void;
  onDeleteCompany: (companyId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddDieForCompany: (
    company: Company,
    toolDescription: string,
    amount: number,
    modality: PaymentModality
  ) => void;
}

export const CompaniesCrmSection: React.FC<CompaniesCrmSectionProps> = ({
  companies,
  orders,
  selectedCompanyId,
  onSelectCompany,
  onAddCompany,
  onDeleteCompany,
  onDeleteOrder,
  onAddDieForCompany,
}) => {
  const activeCompany =
    companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;

  const [showNewCompanyForm, setShowNewCompanyForm] = useState(
    companies.length === 0
  );
  const [newCorpName, setNewCorpName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newContact, setNewContact] = useState('');

  const [toolDesc, setToolDesc] = useState('');
  const [toolAmount, setToolAmount] = useState('');
  const [toolModality, setToolModality] = useState<PaymentModality>('boleto');

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorpName.trim()) return;
    onAddCompany({
      corporateName: newCorpName.trim(),
      cnpj: newCnpj.trim() || '00.000.000/0001-00',
      phone: newPhone.trim() || '(11) 99999-0000',
      contactName: newContact.trim() || 'Compras / PCP',
    });
    setNewCorpName('');
    setNewCnpj('');
    setNewPhone('');
    setNewContact('');
    setShowNewCompanyForm(false);
  };

  const handleCreateDieInCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !toolDesc.trim()) return;
    const val = parseFloat(toolAmount.replace(',', '.')) || 0;
    onAddDieForCompany(activeCompany, toolDesc.trim(), val, toolModality);
    setToolDesc('');
    setToolAmount('');
  };

  const companyOrders = activeCompany
    ? orders.filter((o) => o.companyId === activeCompany.id)
    : [];
  const companyTotalValue = companyOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

  const inputClass =
    'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
            Cadastro de Empresas
          </h2>
          <p className="text-xs font-medium text-slate-700">
            Selecione uma empresa para consultar todo o histórico de facas ou cadastrar uma nova ferramenta vinculada.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewCompanyForm((prev) => !prev)}
          className="liquid-glass-pill inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-slate-900 hover:text-indigo-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>{showNewCompanyForm ? 'Fechar Cadastro' : 'Nova Empresa Cliente'}</span>
        </button>
      </div>

      {/* Collapsible New Company Liquid Glass Card */}
      {showNewCompanyForm && (
        <form
          onSubmit={handleCreateCompany}
          className="liquid-glass rounded-[28px] p-6 space-y-4 ring-2 ring-indigo-400/40"
        >
          <h3 className="text-sm font-extrabold text-indigo-700">
            Cadastrar Nova Empresa / Gráfica Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={newCorpName}
              onChange={(e) => setNewCorpName(e.target.value)}
              placeholder="Razão Social / Nome Fantasia *"
              className={inputClass}
            />
            <input
              type="text"
              value={newCnpj}
              onChange={(e) => setNewCnpj(e.target.value)}
              placeholder="CNPJ (ex: 14.528.910/0001-42)"
              className={inputClass}
            />
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Telefone / WhatsApp"
              className={inputClass}
            />
            <input
              type="text"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Responsável (Compras / PCP)"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-md transition cursor-pointer"
            >
              Salvar Empresa
            </button>
          </div>
        </form>
      )}

      {/* Main Split Bento Layout */}
      {companies.length === 0 ? (
        <div className="liquid-glass rounded-[28px] p-10 border-dashed text-center space-y-2">
          <Building2 className="w-8 h-8 text-indigo-600 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900">
            Nenhuma empresa cadastrada ainda
          </h3>
          <p className="text-xs font-medium text-slate-600 max-w-md mx-auto">
            Utilize o formulário acima ou o botão &quot;Nova OS&quot; para cadastrar seu primeiro cliente e iniciar o controle de ferramental.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: LISTA DE EMPRESAS (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {companies.map((comp) => {
              const linked = orders.filter((o) => o.companyId === comp.id);
              const sumVal = linked.reduce((acc, o) => acc + (o.amount || 0), 0);
              const isSelected = activeCompany?.id === comp.id;

              return (
                <div
                  key={comp.id}
                  onClick={() => onSelectCompany(comp.id)}
                  className={`liquid-glass rounded-[26px] p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-indigo-500/70 bg-white/45'
                      : 'hover:bg-white/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                            : 'bg-white/65 text-indigo-600 border-white/80'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {comp.corporateName}
                        </h3>
                        <p className="text-xs font-mono text-slate-600 mt-0.5">
                          CNPJ: {comp.cnpj}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-300/60 text-xs font-bold text-indigo-800">
                        {linked.length} {linked.length === 1 ? 'faca' : 'facas'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCompany(comp.id);
                        }}
                        className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer"
                        title="Apagar empresa e facas vinculadas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/55 flex items-center justify-between text-xs text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {comp.phone}
                      </span>
                      <span className="hidden sm:flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {comp.contactName}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900">
                      {formatBRL(sumVal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: DETALHES DA EMPRESA (7 Cols) */}
          {activeCompany && (
            <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-6">
              {/* Company Detail Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/60">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Ficha de Ferramental do Cliente
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 frosted-text-depth">
                    {activeCompany.corporateName}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 mt-1">
                    CNPJ: <span className="font-mono text-slate-800">{activeCompany.cnpj}</span> •
                    WhatsApp: <span className="text-slate-800">{activeCompany.phone}</span> •
                    Contato: <span className="text-slate-800">{activeCompany.contactName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-3.5 rounded-2xl liquid-glass-subtle text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">
                      Volume Total Cadastrado
                    </span>
                    <span className="text-xl font-black text-emerald-700 font-mono">
                      {formatBRL(companyTotalValue)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCompany(activeCompany.id)}
                    className="p-3.5 rounded-2xl liquid-glass-pill text-slate-600 hover:text-rose-700 transition cursor-pointer"
                    title="Apagar esta empresa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Register Die Linked to This Company */}
              <form
                onSubmit={handleCreateDieInCompany}
                className="p-4 rounded-2xl liquid-glass-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    Vincular Nova Faca para {activeCompany.corporateName}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600">
                    Entra em &quot;Arquivo Recebido&quot;
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    value={toolDesc}
                    onChange={(e) => setToolDesc(e.target.value)}
                    placeholder="Descrição da Faca (ex: Faca Caixa Duplex)"
                    className={`${inputClass} sm:col-span-2`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={toolAmount}
                    onChange={(e) => setToolAmount(e.target.value)}
                    placeholder="Valor R$ (ex: 680)"
                    className={`${inputClass} font-mono font-bold`}
                  />
                </div>

                {/* Payment Modality Selector Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(PAYMENT_MODALITY_META) as PaymentModality[]).map((mod) => {
                      const meta = PAYMENT_MODALITY_META[mod];
                      const active = toolModality === mod;
                      return (
                        <button
                          type="button"
                          key={mod}
                          onClick={() => setToolModality(mod)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                            active
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-sm'
                              : 'liquid-glass-pill text-slate-700'
                          }`}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Cadastrar Faca</span>
                  </button>
                </div>
              </form>

              {/* History List of Dies for this Company */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Histórico de Facas Associadas • {companyOrders.length}
                </h4>

                {companyOrders.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600">
                    Nenhuma faca cadastrada para esta empresa ainda.
                  </div>
                ) : (
                  companyOrders.map((order) => {
                    const modMeta = PAYMENT_MODALITY_META[order.paymentModality];
                    const stageMeta = PRODUCTION_STAGES.find((s) => s.id === order.stage);
                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800">
                              {order.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${modMeta?.badgeClass}`}
                            >
                              {modMeta?.label}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-indigo-600" />
                              {stageMeta?.label}
                            </span>
                          </div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {order.toolDescription}
                          </p>
                          <p className="text-[11px] font-medium text-slate-600">
                            Cadastrada em {formatDateBR(order.createdAt)} • Vencimento:{' '}
                            {formatDateBR(order.dueDate)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <span className="text-base font-black text-emerald-700 block">
                              {formatBRL(order.amount)}
                            </span>
                            <span className="text-[10px] font-medium text-slate-600">
                              Atualizado: {order.stageUpdatedAt}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer"
                            title="Apagar esta OS / Faca"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
