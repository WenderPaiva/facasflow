import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Edit3,
  Eye,
  FileText,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import {
  Company,
  DieOrder,
  NoteItem,
  NoteRecord,
  NoteStatus,
} from '../types/order';
import {
  formatBRL,
  formatCnpjMask,
  formatDateBR,
  formatPhoneMask,
  isValidCNPJ,
  toISODate,
} from '../utils/financeEngine';

interface NotesSectionProps {
  notas: NoteRecord[];
  companies: Company[];
  orders: DieOrder[];
  nextNoteNumber: number;
  tenantName: string;
  currentUserName: string;
  globalSearchQuery: string;
  onSaveNote: (
    payload: Omit<NoteRecord, 'id' | 'company_id' | 'criadoPor' | 'criadoEm'>,
    editingId?: string
  ) => void;
  onMarkNotePrinted: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onTriggerPrint: (note: NoteRecord, threePerPage: boolean) => void;
}

const NOTE_STATUS_META: Record<
  NoteStatus,
  { label: string; badgeClass: string }
> = {
  rascunho: {
    label: 'Rascunho',
    badgeClass: 'bg-white/60 text-slate-700 border-white/80',
  },
  emitida: {
    label: 'Emitida',
    badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60',
  },
  impressa: {
    label: 'Impressa',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60',
  },
  cancelada: {
    label: 'Cancelada',
    badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-300/60',
  },
};

export function chunkNoteItems(items: NoteItem[], size = 6): NoteItem[][] {
  if (!items || items.length === 0) return [[]];
  const chunks: NoteItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const CanhotoSlipCard: React.FC<{
  note: NoteRecord;
  itemsChunk: NoteItem[];
  slipIndex: number;
  totalSlips: number;
  tenantName: string;
  isPrintMode?: boolean;
}> = ({
  note,
  itemsChunk,
  slipIndex,
  totalSlips,
  tenantName,
  isPrintMode = false,
}) => {
  const slipTotal = itemsChunk.reduce((sum, it) => sum + (it.total || 0), 0);
  const formattedNum = String(note.numero).padStart(4, '0');

  return (
    <div
      className={
        isPrintMode
          ? 'canhoto-slip flex flex-col justify-between bg-white text-black'
          : 'canhoto-slip-screen rounded-md shadow-md border border-slate-300 flex flex-col justify-between bg-white text-black'
      }
      style={{ fontSize: '9pt', color: '#000000', backgroundColor: '#ffffff' }}
    >
      {/* Thin Black Outer Border Container inside 5mm Safety Margin */}
      <div
        className="flex-1 flex flex-col justify-between p-2"
        style={{ border: '1px solid #000000' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-2 pb-1.5"
          style={{ borderBottom: '1px solid #000000' }}
        >
          <div className="min-w-0">
            <div
              className="font-bold uppercase tracking-wide"
              style={{ fontSize: '11pt', lineHeight: 1.2 }}
            >
              {tenantName || 'Qualifacas'} — Canhoto de Entrega Nº {formattedNum}
              {totalSlips > 1 ? ` (${slipIndex + 1}/${totalSlips})` : ''}
            </div>
            <div className="mt-0.5" style={{ fontSize: '9pt' }}>
              <strong>Cliente:</strong> {note.clienteNome} •{' '}
              <strong>CNPJ:</strong> {note.cnpj}
            </div>
            <div style={{ fontSize: '9pt' }}>
              <strong>Contato:</strong> {note.contato}
              {note.endereco ? ` • Endereço: ${note.endereco}` : ''}
            </div>
          </div>

          <div className="text-right shrink-0" style={{ fontSize: '9pt' }}>
            <div>
              <strong>Emissão:</strong> {formatDateBR(note.data)}
            </div>
            {note.osId && (
              <div>
                <strong>OS:</strong> {note.osId}
              </div>
            )}
          </div>
        </div>

        {/* Body Table (max 6 rows) */}
        <div className="flex-1 py-1">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: '9pt' }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <th className="py-0.5 pr-2 font-bold">Descrição</th>
                <th className="py-0.5 px-2 font-bold text-right w-14">Qtd.</th>
                <th className="py-0.5 px-2 font-bold text-right w-24">
                  Unitário
                </th>
                <th className="py-0.5 pl-2 font-bold text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {itemsChunk.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid #d4d4d8' }}
                >
                  <td className="py-0.5 pr-2 truncate max-w-[95mm]">
                    {item.descricao}
                  </td>
                  <td className="py-0.5 px-2 text-right font-mono">
                    {item.quantidade}
                  </td>
                  <td className="py-0.5 px-2 text-right font-mono">
                    {formatBRL(item.precoUnitario)}
                  </td>
                  <td className="py-0.5 pl-2 text-right font-mono font-bold">
                    {formatBRL(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid #000000' }}>
                <td colSpan={3} className="pt-1 text-right font-bold">
                  {totalSlips > 1
                    ? `Subtotal folha (${slipIndex + 1}/${totalSlips}) / Total Geral (${formatBRL(note.total)}):`
                    : 'Total Geral:'}
                </td>
                <td
                  className="pt-1 pl-2 text-right font-mono font-bold"
                  style={{ fontSize: '10pt' }}
                >
                  {formatBRL(totalSlips > 1 ? slipTotal : note.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Footer */}
        <div
          className="pt-1.5 grid grid-cols-12 gap-2 items-end"
          style={{ borderTop: '1px solid #000000', fontSize: '9pt' }}
        >
          <div className="col-span-4">
            <div className="h-3.5" style={{ borderBottom: '1px solid #000000' }} />
            <span>Recebido por (nome legível)</span>
          </div>
          <div className="col-span-4">
            <div className="h-3.5" style={{ borderBottom: '1px solid #000000' }} />
            <span>Assinatura do cliente</span>
          </div>
          <div className="col-span-2">
            <div className="h-3.5" style={{ borderBottom: '1px solid #000000' }} />
            <span>Data do recebimento</span>
          </div>
          <div className="col-span-2">
            <div
              className="h-3.5 truncate"
              style={{ borderBottom: '1px solid #000000' }}
            >
              {note.entreguePor || ''}
            </div>
            <span>Entregue por</span>
          </div>
        </div>
      </div>

      {/* Bottom Cut Line */}
      <div className="pt-1 text-center" style={{ fontSize: '9pt' }}>
        <div
          className="w-full"
          style={{ borderTop: '1px dashed #000000' }}
        />
        <span className="inline-block bg-white px-2 -mt-2.5 text-[8.5pt] font-semibold tracking-wider uppercase">
          Corte aqui
        </span>
      </div>
    </div>
  );
};

export const NotesSection: React.FC<NotesSectionProps> = ({
  notas,
  companies,
  orders,
  nextNoteNumber,
  tenantName,
  globalSearchQuery,
  onSaveNote,
  onMarkNotePrinted,
  onDeleteNote,
  onTriggerPrint,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'preview'>('list');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [previewNoteId, setPreviewNoteId] = useState<string | null>(null);

  // Form states
  const [numero, setNumero] = useState(nextNoteNumber);
  const [data, setData] = useState(() => toISODate());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('manual');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [clienteNome, setClienteNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [entreguePor, setEntreguePor] = useState('');
  const [status, setStatus] = useState<NoteStatus>('emitida');
  const [items, setItems] = useState<NoteItem[]>([
    { id: 'IT-1', descricao: '', quantidade: 1, precoUnitario: 0, total: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const openNewForm = () => {
    setEditingId(undefined);
    setNumero(nextNoteNumber);
    setData(toISODate());
    setSelectedCompanyId(companies[0]?.id || 'manual');
    setSelectedOrderId('');
    if (companies[0]) {
      setClienteNome(companies[0].corporateName);
      setCnpj(formatCnpjMask(companies[0].cnpj));
      setContatoNome(companies[0].contactName);
      setContatoTelefone(formatPhoneMask(companies[0].phone));
    } else {
      setClienteNome('');
      setCnpj('');
      setContatoNome('');
      setContatoTelefone('');
    }
    setEndereco('');
    setEntreguePor('');
    setStatus('emitida');
    setItems([
      { id: `IT-${Date.now()}`, descricao: '', quantidade: 1, precoUnitario: 0, total: 0 },
    ]);
    setFormError(null);
    setViewMode('form');
  };

  const openEditForm = (note: NoteRecord) => {
    setEditingId(note.id);
    setNumero(note.numero);
    setData(note.data);
    setSelectedCompanyId(note.empresaId || 'manual');
    setSelectedOrderId(note.osId || '');
    setClienteNome(note.clienteNome);
    setCnpj(formatCnpjMask(note.cnpj));
    const parts = note.contato.split(' - ');
    setContatoNome(parts[0] || '');
    setContatoTelefone(parts[1] ? formatPhoneMask(parts[1]) : '');
    setEndereco(note.endereco || '');
    setEntreguePor(note.entreguePor || '');
    setStatus(note.status);
    setItems(
      note.items.length > 0
        ? note.items
        : [{ id: `IT-${Date.now()}`, descricao: '', quantidade: 1, precoUnitario: 0, total: 0 }]
    );
    setFormError(null);
    setViewMode('form');
  };

  const handleCompanySelect = (compId: string) => {
    setSelectedCompanyId(compId);
    if (compId === 'manual') return;
    const comp = companies.find((c) => c.id === compId);
    if (comp) {
      setClienteNome(comp.corporateName);
      setCnpj(formatCnpjMask(comp.cnpj));
      setContatoNome(comp.contactName);
      setContatoTelefone(formatPhoneMask(comp.phone));
    }
  };

  const handleImportFromOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    const comp = companies.find((c) => c.id === ord.companyId);
    if (comp) {
      setSelectedCompanyId(comp.id);
      setClienteNome(comp.corporateName);
      setCnpj(formatCnpjMask(comp.cnpj));
      setContatoNome(comp.contactName);
      setContatoTelefone(formatPhoneMask(comp.phone));
    } else {
      setSelectedCompanyId('manual');
      setClienteNome(ord.companyName);
      setContatoNome('Compras / PCP');
      setContatoTelefone(formatPhoneMask(ord.companyPhone));
    }

    const rowTotal = Math.round((ord.amount || 0) * 100) / 100;
    setItems([
      {
        id: `IT-${Date.now()}`,
        descricao: ord.toolDescription,
        quantidade: 1,
        precoUnitario: ord.amount || 0,
        total: rowTotal,
      },
    ]);
  };

  const updateRow = (
    idx: number,
    field: 'descricao' | 'quantidade' | 'precoUnitario',
    value: string
  ) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const nextQty =
          field === 'quantidade'
            ? Math.max(0, parseFloat(value.replace(',', '.')) || 0)
            : row.quantidade;
        const nextPrice =
          field === 'precoUnitario'
            ? Math.max(0, parseFloat(value.replace(',', '.')) || 0)
            : row.precoUnitario;
        const nextDesc = field === 'descricao' ? value : row.descricao;
        return {
          ...row,
          descricao: nextDesc,
          quantidade: nextQty,
          precoUnitario: nextPrice,
          total: Math.round(nextQty * nextPrice * 100) / 100,
        };
      })
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `IT-${Date.now()}-${prev.length + 1}`,
        descricao: '',
        quantidade: 1,
        precoUnitario: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const tableTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clienteNome.trim()) {
      setFormError('Informe o nome da empresa do cliente.');
      return;
    }
    if (!isValidCNPJ(cnpj)) {
      setFormError(
        'CNPJ inválido. Verifique os 14 dígitos e os dígitos verificadores.'
      );
      return;
    }
    const validItems = items.filter((it) => it.descricao.trim() && it.quantidade > 0);
    if (validItems.length === 0) {
      setFormError('Adicione pelo menos 1 item válido com descrição e quantidade.');
      return;
    }

    const contatoCombined = [contatoNome.trim(), contatoTelefone.trim()]
      .filter(Boolean)
      .join(' - ');

    onSaveNote(
      {
        numero,
        data: data || toISODate(),
        empresaId: selectedCompanyId !== 'manual' ? selectedCompanyId : undefined,
        clienteNome: clienteNome.trim(),
        cnpj: formatCnpjMask(cnpj),
        contato: contatoCombined || 'Não informado',
        endereco: endereco.trim() || undefined,
        entreguePor: entreguePor.trim() || undefined,
        osId: selectedOrderId || undefined,
        status,
        items: validItems.map((it) => ({
          ...it,
          descricao: it.descricao.trim(),
          total: Math.round(it.quantidade * it.precoUnitario * 100) / 100,
        })),
        total: Math.round(validItems.reduce((s, it) => s + it.total, 0) * 100) / 100,
      },
      editingId
    );
    setViewMode('list');
  };

  const filteredNotas = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter(
      (n) =>
        String(n.numero).includes(q) ||
        n.clienteNome.toLowerCase().includes(q) ||
        n.cnpj.toLowerCase().includes(q) ||
        (n.osId || '').toLowerCase().includes(q)
    );
  }, [notas, globalSearchQuery]);

  const previewNote = notas.find((n) => n.id === previewNoteId) || null;
  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 text-base rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-5 min-w-0">
      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth">
                Notas e Canhotos Digitais
              </h2>
              <p className="text-xs font-medium text-slate-700">
                Emissão, visualização em tela e impressão de canhotos em 1/3 de folha A4.
              </p>
            </div>

            <button
              type="button"
              onClick={openNewForm}
              className="min-h-[44px] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm rounded-full px-5 py-2.5 inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Nota</span>
            </button>
          </div>

          <div className="liquid-glass rounded-[28px] overflow-hidden min-w-0">
            {/* Mobile Labeled Cards (< 768px) */}
            <div className="md:hidden divide-y divide-white/55">
              {filteredNotas.length === 0 ? (
                <div className="py-10 px-4 text-center font-medium text-xs text-slate-600">
                  Nenhuma nota emitida ainda. Clique em Nova Nota para criar o primeiro canhoto.
                </div>
              ) : (
                filteredNotas.map((note) => {
                  const stMeta = NOTE_STATUS_META[note.status];
                  return (
                    <div key={note.id} className="p-4 space-y-2.5 text-xs min-w-0">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="font-mono font-extrabold text-indigo-700 block">
                            Nº {String(note.numero).padStart(4, '0')}
                          </span>
                          <span className="font-bold text-slate-900 break-words">
                            {note.clienteNome}
                          </span>
                        </div>
                        <span className="font-mono font-black text-base text-slate-900 shrink-0">
                          {formatBRL(note.total)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 font-semibold block">Data</span>
                          <span className="font-mono text-slate-800">
                            {formatDateBR(note.data)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block">Status</span>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stMeta.badgeClass}`}
                          >
                            {stMeta.label}
                          </span>
                        </div>
                        {note.cnpj && (
                          <div className="col-span-2">
                            <span className="text-slate-500 font-semibold block">CNPJ</span>
                            <span className="font-mono text-slate-700">{note.cnpj}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewNoteId(note.id);
                            setViewMode('preview');
                          }}
                          className="liquid-glass-pill min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-indigo-600" />
                          <span>Visualizar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(note)}
                          className="liquid-glass-pill min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-600" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onMarkNotePrinted(note.id);
                            onTriggerPrint(note, false);
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Excluir nota"
                          className="min-h-[44px] min-w-[44px] rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 inline-flex items-center justify-center cursor-pointer"
                          title="Excluir nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30">
                    <th className="py-3.5 px-5 font-extrabold">Número</th>
                    <th className="py-3.5 px-4 font-extrabold">Cliente</th>
                    <th className="py-3.5 px-4 font-extrabold">Data</th>
                    <th className="py-3.5 px-4 text-right font-extrabold">Total</th>
                    <th className="py-3.5 px-4 font-extrabold">Status</th>
                    <th className="py-3.5 px-5 text-right font-extrabold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/45 text-xs">
                  {filteredNotas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center font-medium text-slate-600"
                      >
                        Nenhuma nota emitida ainda. Clique em Nova Nota para criar o primeiro canhoto.
                      </td>
                    </tr>
                  ) : (
                    filteredNotas.map((note) => {
                      const stMeta = NOTE_STATUS_META[note.status];
                      return (
                        <tr key={note.id} className="hover:bg-white/35 transition-colors">
                          <td className="py-4 px-5 font-mono font-extrabold text-indigo-700 whitespace-nowrap">
                            Nº {String(note.numero).padStart(4, '0')}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 block">
                              {note.clienteNome}
                            </span>
                            <span className="text-[11px] font-mono text-slate-600">
                              {note.cnpj}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-800 whitespace-nowrap">
                            {formatDateBR(note.data)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            {formatBRL(note.total)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${stMeta.badgeClass}`}
                            >
                              {stMeta.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewNoteId(note.id);
                                  setViewMode('preview');
                                }}
                                className="liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Visualizar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditForm(note)}
                                className="liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onMarkNotePrinted(note.id);
                                  onTriggerPrint(note, false);
                                }}
                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimir</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteNote(note.id)}
                                className="p-1.5 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer"
                                title="Excluir nota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FORM VIEW */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="liquid-glass-pill p-2.5 rounded-full text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 frosted-text-depth">
                  {editingId
                    ? `Editar Nota Nº ${String(numero).padStart(4, '0')}`
                    : `Nova Nota Nº ${String(numero).padStart(4, '0')}`}
                </h2>
                <p className="text-xs font-medium text-slate-700">
                  Preencha manualmente ou importe direto de uma OS existente
                </p>
              </div>
            </div>

            <div className="w-full sm:w-80">
              <select
                value={selectedOrderId}
                onChange={(e) => handleImportFromOrder(e.target.value)}
                className={inputClass}
              >
                <option value="">Importar de OS existente...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.companyName} - {o.toolDescription}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300/70 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Header Data */}
          <div className="liquid-glass rounded-[28px] p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Número da Nota
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Nº ${String(numero).padStart(4, '0')}`}
                  className={`${inputClass} font-mono font-extrabold bg-white/60`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Empresa Cadastrada
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                  className={inputClass}
                >
                  <option value="manual">Digitar cliente manualmente</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.corporateName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NoteStatus)}
                  className={inputClass}
                >
                  {Object.entries(NOTE_STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Razão Social / Cliente
                </label>
                <input
                  type="text"
                  required
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome da empresa cliente"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  required
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCnpjMask(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Entregue por
                </label>
                <input
                  type="text"
                  value={entreguePor}
                  onChange={(e) => setEntreguePor(e.target.value)}
                  placeholder="Nome do motorista ou portador"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contato
                </label>
                <input
                  type="text"
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  placeholder="Nome do contato"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={contatoTelefone}
                  onChange={(e) =>
                    setContatoTelefone(formatPhoneMask(e.target.value))
                  }
                  placeholder="(00) 00000-0000"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número e bairro"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="liquid-glass rounded-[28px] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Itens da Nota
                </h3>
                <p className="text-[11px] font-medium text-slate-600">
                  Até 6 linhas por canhoto de 1/3 A4. Acima de 6 linhas gera canhotos adicionais automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold text-indigo-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar linha</span>
              </button>
            </div>

            {items.length > 6 && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-300/60 text-xs font-bold text-indigo-800">
                Esta nota possui {items.length} linhas e será dividida automaticamente em {Math.ceil(items.length / 6)} canhotos na visualização e impressão.
              </div>
            )}

            <div className="space-y-2.5">
              {items.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl liquid-glass-subtle"
                >
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      required
                      value={row.descricao}
                      onChange={(e) => updateRow(idx, 'descricao', e.target.value)}
                      placeholder="Descrição do item ou faca"
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={row.quantidade}
                      onChange={(e) => updateRow(idx, 'quantidade', e.target.value)}
                      placeholder="Qtd."
                      className={`${inputClass} font-mono text-right`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={row.precoUnitario}
                      onChange={(e) =>
                        updateRow(idx, 'precoUnitario', e.target.value)
                      }
                      placeholder="Unitário R$"
                      className={`${inputClass} font-mono text-right`}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      {formatBRL(row.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={items.length <= 1}
                      className="p-1.5 rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-40 text-slate-500 hover:text-rose-700 cursor-pointer"
                      title="Remover linha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/60 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-900 font-mono">
                Total Geral: {formatBRL(tableTotal)}
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Salvar Nota' : 'Emitir Nota'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* PREVIEW VIEW */}
      {viewMode === 'preview' && previewNote && (
        <div className="space-y-4">
          <div className="liquid-glass rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="liquid-glass-pill p-2.5 rounded-full text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Visualização do Canhoto Nº {String(previewNote.numero).padStart(4, '0')}
                </h3>
                <p className="text-[11px] font-medium text-slate-600">
                  Proporção 210:99 mm • 1/3 de folha A4
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openEditForm(previewNote)}
                className="liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onMarkNotePrinted(previewNote.id);
                  onTriggerPrint(previewNote, false);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onMarkNotePrinted(previewNote.id);
                  onTriggerPrint(previewNote, true);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir 3 por folha</span>
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {chunkNoteItems(previewNote.items, 6).map((chunk, idx, arr) => (
              <CanhotoSlipCard
                key={`${previewNote.id}-slip-${idx}`}
                note={previewNote}
                itemsChunk={chunk}
                slipIndex={idx}
                totalSlips={arr.length}
                tenantName={tenantName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
