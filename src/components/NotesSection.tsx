import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Edit3,
  Eye,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Company,
  DieOrder,
  NoteItem,
  NoteRecord,
  NoteStatus,
  PedidoEmitterProfile,
} from '../types/order';
import {
  addDays,
  formatBRL,
  formatCpfCnpjMask,
  formatDateBR,
  formatPhoneMask,
  formatQuantityBR,
  isValidCpfOrCnpj,
  roundCurrencyBRL,
  toISODate,
} from '../utils/financeEngine';

export const PEDIDO_A5_ROWS = 15;

export const DEFAULT_FICTITIOUS_EMITTER: PedidoEmitterProfile = {
  monogram: 'FM',
  brandName: 'facaria modelo',
  subtitle: 'facas de corte e vinco',
  phone: '(00) 3000-0000 / 9.0000-0000',
  specialtiesLine1: 'FACAS P/ MEIO CORTE, ENVELOPES, TAGS',
  specialtiesLine2: 'E CARTONAGEM EM GERAL',
  email: 'contato@facariamodelo.example',
  website: 'www.facariamodelo.example',
  address: 'Av. Exemplo Industrial, Nº 100 - Setor Modelo - Cidade - UF',
};

const EMITTER_STORAGE_PREFIX = 'facasflow_pedido_a5_emitter_v1_';

export function loadPedidoEmitterProfile(
  tenantKey?: string
): PedidoEmitterProfile {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_FICTITIOUS_EMITTER;
    }
    const raw = window.localStorage.getItem(
      `${EMITTER_STORAGE_PREFIX}${tenantKey || 'default'}`
    );
    if (!raw) return DEFAULT_FICTITIOUS_EMITTER;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FICTITIOUS_EMITTER,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return DEFAULT_FICTITIOUS_EMITTER;
  }
}

export function savePedidoEmitterProfile(
  tenantKey: string | undefined,
  profile: PedidoEmitterProfile
): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(
      `${EMITTER_STORAGE_PREFIX}${tenantKey || 'default'}`,
      JSON.stringify(profile)
    );
  } catch {
    // non-blocking
  }
}

export function createFictitiousDemoNote(nextNumber: number): NoteRecord {
  const today = toISODate();
  const items: NoteItem[] = [
    {
      id: 'DEMO-IT-1',
      descricao: 'Faca Caixa Cartão 300g com Tampa Automática (18mm)',
      quantidade: 1,
      precoUnitario: 380,
      total: 380,
    },
    {
      id: 'DEMO-IT-2',
      descricao: 'Faca Tag Retangular 50×90 mm c/ Furo Central (Meio Corte)',
      quantidade: 2,
      precoUnitario: 165,
      total: 330,
    },
    {
      id: 'DEMO-IT-3',
      descricao: 'Emborrachamento Técnico e Ajuste Fino de Vinco',
      quantidade: 1,
      precoUnitario: 95.5,
      total: 95.5,
    },
  ];
  const total = roundCurrencyBRL(
    items.reduce((sum, item) => sum + item.total, 0)
  );

  return {
    id: '__demo_a5__',
    numero: Math.max(1, nextNumber),
    data: today,
    dataSaida: addDays(today, 2),
    clienteNome: 'Gráfica Horizonte Ltda (Exemplo)',
    cnpj: '11.222.333/0001-81',
    inscricao: 'ISENTO',
    contato: '(00) 99123-4567',
    endereco: 'Rua das Artes Gráficas, 250 - Centro - Cidade Exemplo - UF',
    status: 'rascunho',
    items,
    total,
    criadoPor: 'Protótipo',
    criadoEm: new Date().toISOString(),
  };
}

export function formatPedidoNumber(numero: number): string {
  return String(Math.max(1, Math.floor(Number(numero) || 1))).padStart(5, '0');
}

export function chunkNoteItems(
  items: NoteItem[],
  size = PEDIDO_A5_ROWS
): NoteItem[][] {
  if (!items || items.length === 0) return [[]];
  const safeSize = Math.max(1, size);
  const chunks: NoteItem[][] = [];
  for (let i = 0; i < items.length; i += safeSize) {
    chunks.push(items.slice(i, i + safeSize));
  }
  return chunks;
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

const PedidoBrandMark: React.FC<{ monogram: string }> = ({ monogram }) => {
  const letters = (monogram || 'FM').trim().slice(0, 3).toUpperCase();
  return (
    <svg
      viewBox="0 0 88 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: 'calc(21.5 * var(--u))',
        height: 'calc(13.2 * var(--u))',
        display: 'block',
      }}
      aria-hidden="true"
    >
      {/* Geometric die-cut frame emblem (original prototype icon) */}
      <rect
        x="4"
        y="4"
        width="80"
        height="46"
        rx="12"
        stroke="#b84a39"
        strokeWidth="3.2"
      />
      <path
        d="M18 11H70M18 43H70"
        stroke="#b84a39"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        opacity="0.7"
      />
      <circle cx="15" cy="27" r="3" fill="#b84a39" opacity="0.85" />
      <circle cx="73" cy="27" r="3" fill="#b84a39" opacity="0.85" />
      <text
        x="44"
        y="34.5"
        textAnchor="middle"
        fill="#b84a39"
        fontFamily="Inter, Plus Jakarta Sans, Arial, sans-serif"
        fontWeight="800"
        fontSize="24"
        letterSpacing="1.5"
      >
        {letters}
      </text>
    </svg>
  );
};

export interface PedidoA5SheetProps {
  note: NoteRecord;
  itemsChunk: NoteItem[];
  pageIndex: number;
  totalPages: number;
  emitter?: PedidoEmitterProfile;
  isPrintMode?: boolean;
}

export const PedidoA5Sheet: React.FC<PedidoA5SheetProps> = ({
  note,
  itemsChunk,
  pageIndex,
  totalPages,
  emitter = DEFAULT_FICTITIOUS_EMITTER,
  isPrintMode = false,
}) => {
  const formattedNum = formatPedidoNumber(note.numero);
  const pageTotal = roundCurrencyBRL(
    itemsChunk.reduce((sum, it) => sum + (Number(it.total) || 0), 0)
  );
  const grandTotal = roundCurrencyBRL(
    note.items.reduce((sum, it) => sum + (Number(it.total) || 0), 0)
  );
  const displayTotal =
    totalPages > 1 && pageIndex < totalPages - 1 ? pageTotal : grandTotal;
  const totalBoxLabel =
    totalPages > 1 && pageIndex < totalPages - 1 ? 'SUBTOTAL' : 'TOTAL';

  const rowSlots = Array.from({ length: PEDIDO_A5_ROWS }, (_, i) => {
    return itemsChunk[i] || null;
  });

  const thinBorder = 'calc(0.32 * var(--u)) solid #27272a';
  const innerRule = 'calc(0.22 * var(--u)) solid #52525b';
  const radius = 'calc(2.4 * var(--u))';

  const sheetBody = (
    <div
      className={`pedido-a5-doc${isPrintMode ? ' pedido-a5-print' : ''}`}
      data-pedido-sheet="a5"
      data-pedido-numero={formattedNum}
    >
      {/* BLOCK 1: Header — Left Emitter Info Box + Right PEDIDO Sequential Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 'calc(1.2 * var(--u))',
          height: 'calc(30.5 * var(--u))',
          flexShrink: 0,
        }}
      >
        {/* Left Emitter Box */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            border: thinBorder,
            borderRadius: radius,
            padding: 'calc(1.8 * var(--u)) calc(2.4 * var(--u))',
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(2 * var(--u))',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Logo + Brand Name */}
          <div
            style={{
              width: 'calc(28 * var(--u))',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'calc(0.6 * var(--u))',
            }}
          >
            <PedidoBrandMark monogram={emitter.monogram} />
            <div
              style={{
                fontSize: 'calc(3.05 * var(--u))',
                fontWeight: 800,
                color: '#b84a39',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {emitter.brandName}
            </div>
            <div
              style={{
                fontSize: 'calc(1.85 * var(--u))',
                fontWeight: 600,
                color: '#a14435',
                lineHeight: 1.05,
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {emitter.subtitle}
            </div>
          </div>

          {/* Emitter Contacts & Address */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
              paddingTop: 'calc(0.3 * var(--u))',
              paddingBottom: 'calc(0.3 * var(--u))',
            }}
          >
            <div
              style={{
                fontSize: 'calc(3.35 * var(--u))',
                fontWeight: 800,
                color: '#b84a39',
                lineHeight: 1.12,
                letterSpacing: '0.01em',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {emitter.phone}
            </div>

            <div
              style={{
                fontSize: 'calc(2.15 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                lineHeight: 1.25,
                textTransform: 'uppercase',
              }}
            >
              <div>{emitter.specialtiesLine1}</div>
              <div>{emitter.specialtiesLine2}</div>
            </div>

            <div
              style={{
                fontSize: 'calc(2.25 * var(--u))',
                fontWeight: 600,
                color: '#b84a39',
                lineHeight: 1.22,
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {emitter.email}
              </div>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {emitter.website}
              </div>
            </div>

            <div
              style={{
                fontSize: 'calc(1.95 * var(--u))',
                fontWeight: 600,
                color: '#27272a',
                lineHeight: 1.15,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {emitter.address}
            </div>
          </div>
        </div>

        {/* Right PEDIDO Number Box */}
        <div
          style={{
            width: 'calc(35.5 * var(--u))',
            flexShrink: 0,
            border: thinBorder,
            borderRadius: radius,
            padding: 'calc(2.4 * var(--u)) calc(2 * var(--u))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              fontSize: 'calc(5.1 * var(--u))',
              fontWeight: 800,
              color: '#27272a',
              letterSpacing: '0.06em',
              lineHeight: 1.05,
              textTransform: 'uppercase',
            }}
          >
            PEDIDO
          </div>

          <div
            style={{
              fontSize: 'calc(4.85 * var(--u))',
              fontWeight: 700,
              color: '#c2412d',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.08em',
              lineHeight: 1.05,
              marginBottom:
                totalPages > 1 ? 'calc(0.4 * var(--u))' : 'calc(2.8 * var(--u))',
            }}
          >
            {formattedNum}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                fontSize: 'calc(1.85 * var(--u))',
                fontWeight: 700,
                color: '#52525b',
                lineHeight: 1,
              }}
            >
              FOLHA {pageIndex + 1}/{totalPages}
            </div>
          )}
        </div>
      </div>

      {/* BLOCK 2: Client & Dates Compact Ruled Box (4 rows) */}
      <div
        style={{
          marginTop: 'calc(1.2 * var(--u))',
          border: thinBorder,
          borderRadius: radius,
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: '#ffffff',
        }}
      >
        {/* Row 1: CLIENTE + FONE */}
        <div
          style={{
            height: 'calc(6.4 * var(--u))',
            padding: '0 calc(2.2 * var(--u))',
            borderBottom: innerRule,
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(2 * var(--u))',
          }}
        >
          <div
            style={{
              width: '62%',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'calc(1.2 * var(--u))',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 'calc(2.2 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              CLIENTE:
            </span>
            <span
              style={{
                fontSize: 'calc(2.65 * var(--u))',
                fontWeight: 500,
                color: '#09090b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {note.clienteNome}
            </span>
          </div>
          <div
            style={{
              width: '38%',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'calc(1.2 * var(--u))',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 'calc(2.2 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              FONE:
            </span>
            <span
              style={{
                fontSize: 'calc(2.6 * var(--u))',
                fontWeight: 500,
                color: '#09090b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {note.contato}
            </span>
          </div>
        </div>

        {/* Row 2: ENDEREÇO */}
        <div
          style={{
            height: 'calc(6.4 * var(--u))',
            padding: '0 calc(2.2 * var(--u))',
            borderBottom: innerRule,
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(1.2 * var(--u))',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 'calc(2.2 * var(--u))',
              fontWeight: 700,
              color: '#27272a',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ENDEREÇO:
          </span>
          <span
            style={{
              fontSize: 'calc(2.6 * var(--u))',
              fontWeight: 500,
              color: '#09090b',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {note.endereco || ''}
          </span>
        </div>

        {/* Row 3: CNPJ/CPF + INSCRIÇÃO */}
        <div
          style={{
            height: 'calc(6.4 * var(--u))',
            padding: '0 calc(2.2 * var(--u))',
            borderBottom: innerRule,
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(2 * var(--u))',
          }}
        >
          <div
            style={{
              width: '62%',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'calc(1.2 * var(--u))',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 'calc(2.2 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              CNPJ/CPF:
            </span>
            <span
              style={{
                fontSize: 'calc(2.6 * var(--u))',
                fontWeight: 500,
                color: '#09090b',
                fontVariantNumeric: 'tabular-nums',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {note.cnpj}
            </span>
          </div>
          <div
            style={{
              width: '38%',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'calc(1.2 * var(--u))',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 'calc(2.2 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              INSCRIÇÃO:
            </span>
            <span
              style={{
                fontSize: 'calc(2.6 * var(--u))',
                fontWeight: 500,
                color: '#09090b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {note.inscricao || ''}
            </span>
          </div>
        </div>

        {/* Row 4: DATA ENTRADA + DATA SAÍDA */}
        <div
          style={{
            height: 'calc(6.4 * var(--u))',
            padding: '0 calc(2.2 * var(--u))',
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(2 * var(--u))',
          }}
        >
          <div
            style={{
              width: '62%',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'calc(1.2 * var(--u))',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 'calc(2.2 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              DATA ENTRADA:
            </span>
            <span
              style={{
                fontSize: 'calc(2.6 * var(--u))',
                fontWeight: 500,
                color: '#09090b',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {note.data ? formatDateBR(note.data) : ''}
            </span>
            {note.osId && (
              <span
                style={{
                  fontSize: 'calc(2.05 * var(--u))',
                  fontWeight: 700,
                  color: '#52525b',
                  marginLeft: 'calc(2 * var(--u))',
                  whiteSpace: 'nowrap',
                }}
              >
                ({note.osId})
              </span>
            )}
          </div>
          <div
            style={{
              width: '38%',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'calc(1.2 * var(--u))',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 'calc(2.2 * var(--u))',
                fontWeight: 700,
                color: '#27272a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              DATA SAÍDA:
            </span>
            <span
              style={{
                fontSize: 'calc(2.6 * var(--u))',
                fontWeight: 500,
                color: '#09090b',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {note.dataSaida ? formatDateBR(note.dataSaida) : ''}
            </span>
          </div>
        </div>
      </div>

      {/* BLOCK 3: Services Table (QUANT. | DESCRIÇÃO DOS SERVIÇOS | VALOR) — 15 fixed rows */}
      <div
        style={{
          marginTop: 'calc(1.2 * var(--u))',
          flex: 1,
          minHeight: 0,
          border: thinBorder,
          borderRadius: radius,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
        }}
      >
        <table className="pedido-a5-table">
          <colgroup>
            <col style={{ width: '10.5%' }} />
            <col style={{ width: '67.5%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr
              style={{
                height: 'calc(6.2 * var(--u))',
                borderBottom: thinBorder,
                backgroundColor: '#fafafa',
              }}
            >
              <th
                style={{
                  borderRight: thinBorder,
                  fontSize: 'calc(2.2 * var(--u))',
                  fontWeight: 700,
                  color: '#27272a',
                  textAlign: 'center',
                  padding: '0 calc(0.8 * var(--u))',
                  letterSpacing: '0.02em',
                }}
              >
                QUANT.
              </th>
              <th
                style={{
                  borderRight: thinBorder,
                  fontSize: 'calc(2.25 * var(--u))',
                  fontWeight: 700,
                  color: '#27272a',
                  textAlign: 'center',
                  padding: '0 calc(1.5 * var(--u))',
                  letterSpacing: '0.03em',
                }}
              >
                DESCRIÇÃO DOS SERVIÇOS
              </th>
              <th
                style={{
                  fontSize: 'calc(2.25 * var(--u))',
                  fontWeight: 700,
                  color: '#27272a',
                  textAlign: 'center',
                  padding: '0 calc(1.5 * var(--u))',
                  letterSpacing: '0.03em',
                }}
              >
                VALOR
              </th>
            </tr>
          </thead>
          <tbody>
            {rowSlots.map((item, idx) => (
              <tr
                key={item ? item.id : `empty-row-${idx}`}
                style={{
                  height: `${100 / PEDIDO_A5_ROWS}%`,
                  borderBottom: idx < PEDIDO_A5_ROWS - 1 ? innerRule : 'none',
                }}
              >
                <td
                  style={{
                    borderRight: thinBorder,
                    fontSize: 'calc(2.6 * var(--u))',
                    fontWeight: 500,
                    color: '#09090b',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                    padding: '0 calc(1 * var(--u))',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item ? formatQuantityBR(item.quantidade) : '\u00A0'}
                </td>
                <td
                  style={{
                    borderRight: thinBorder,
                    fontSize: 'calc(2.6 * var(--u))',
                    fontWeight: 500,
                    color: '#09090b',
                    textAlign: 'left',
                    padding: '0 calc(2 * var(--u))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item ? item.descricao : '\u00A0'}
                </td>
                <td
                  style={{
                    fontSize: 'calc(2.6 * var(--u))',
                    fontWeight: 600,
                    color: '#09090b',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    padding: '0 calc(2 * var(--u))',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item ? formatBRL(item.total) : '\u00A0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BLOCK 4: Footer — Signature Line (left/center) + Total Box (bottom-right) */}
      <div
        style={{
          marginTop: 'calc(1.8 * var(--u))',
          height: 'calc(10.4 * var(--u))',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Client Signature Line */}
        <div
          style={{
            width: '78%',
            paddingRight: 'calc(3 * var(--u))',
            paddingBottom: 'calc(0.4 * var(--u))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '82%',
              borderBottom: 'calc(0.28 * var(--u)) solid #27272a',
              marginBottom: 'calc(1 * var(--u))',
            }}
          />
          <span
            style={{
              fontSize: 'calc(2.15 * var(--u))',
              fontWeight: 700,
              color: '#27272a',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ASSINATURA DO CLIENTE
          </span>
        </div>

        {/* Bottom-Right Automatic Total Box (aligned directly below VALOR column) */}
        <div
          style={{
            width: '22%',
            height: 'calc(9.4 * var(--u))',
            border: thinBorder,
            borderRadius: 'calc(2 * var(--u))',
            padding: 'calc(0.9 * var(--u)) calc(1.8 * var(--u))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
          data-pedido-total-box="true"
        >
          <span
            style={{
              fontSize: 'calc(1.65 * var(--u))',
              fontWeight: 700,
              color: '#52525b',
              letterSpacing: '0.05em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {totalBoxLabel}
          </span>
          <span
            style={{
              fontSize: 'calc(3.05 * var(--u))',
              fontWeight: 800,
              color: '#09090b',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.05,
              whiteSpace: 'nowrap',
            }}
          >
            {formatBRL(displayTotal)}
          </span>
        </div>
      </div>
    </div>
  );

  if (isPrintMode) {
    return sheetBody;
  }

  return <div className="pedido-a5-screen-frame">{sheetBody}</div>;
};

interface NotesSectionProps {
  notas: NoteRecord[];
  companies: Company[];
  orders: DieOrder[];
  nextNoteNumber: number;
  tenantKey?: string;
  currentUserName: string;
  globalSearchQuery: string;
  onSaveNote: (
    payload: Omit<NoteRecord, 'id' | 'company_id' | 'criadoPor' | 'criadoEm'>,
    editingId?: string
  ) => Promise<NoteRecord | null>;
  onMarkNotePrinted: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onTriggerPrint: (note: NoteRecord, emitter: PedidoEmitterProfile) => void;
  onSyncPrintPreview?: (
    job: { note: NoteRecord; emitter: PedidoEmitterProfile } | null
  ) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notas,
  companies,
  orders,
  nextNoteNumber,
  tenantKey,
  globalSearchQuery,
  onSaveNote,
  onMarkNotePrinted,
  onDeleteNote,
  onTriggerPrint,
  onSyncPrintPreview,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'preview'>('list');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [previewNoteId, setPreviewNoteId] = useState<string | null>(null);
  const [demoPreviewNote, setDemoPreviewNote] = useState<NoteRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Emitter header profile (defaults to strictly fictitious prototype data)
  const [emitter, setEmitter] = useState<PedidoEmitterProfile>(() =>
    loadPedidoEmitterProfile(tenantKey)
  );
  const [showEmitterPanel, setShowEmitterPanel] = useState(false);

  // Form states
  const [numero, setNumero] = useState(nextNoteNumber);
  const [dataEntrada, setDataEntrada] = useState(() => toISODate());
  const [dataSaida, setDataSaida] = useState(() => toISODate());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('manual');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [clienteNome, setClienteNome] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [inscricao, setInscricao] = useState('');
  const [fone, setFone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [status, setStatus] = useState<NoteStatus>('emitida');
  const [items, setItems] = useState<NoteItem[]>([
    { id: 'IT-1', descricao: '', quantidade: 1, precoUnitario: 0, total: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const updateEmitterField = (
    field: keyof PedidoEmitterProfile,
    value: string
  ) => {
    setEmitter((prev) => {
      const next = { ...prev, [field]: value };
      savePedidoEmitterProfile(tenantKey, next);
      return next;
    });
  };

  const resetEmitterToFictitious = () => {
    setEmitter(DEFAULT_FICTITIOUS_EMITTER);
    savePedidoEmitterProfile(tenantKey, DEFAULT_FICTITIOUS_EMITTER);
  };

  const openNewForm = () => {
    setEditingId(undefined);
    setDemoPreviewNote(null);
    setNumero(nextNoteNumber);
    const today = toISODate();
    setDataEntrada(today);
    setDataSaida(today);
    setSelectedCompanyId('manual');
    setSelectedOrderId('');
    setClienteNome('');
    setCnpjCpf('');
    setInscricao('');
    setFone('');
    setEndereco('');
    setStatus('emitida');
    setItems([
      {
        id: `IT-${Date.now()}`,
        descricao: '',
        quantidade: 1,
        precoUnitario: 0,
        total: 0,
      },
    ]);
    setFormError(null);
    setViewMode('form');
  };

  const openEditForm = (note: NoteRecord) => {
    setEditingId(note.id === '__demo_a5__' ? undefined : note.id);
    setDemoPreviewNote(null);
    setNumero(note.id === '__demo_a5__' ? nextNoteNumber : note.numero);
    setDataEntrada(note.data || toISODate());
    setDataSaida(note.dataSaida || '');
    setSelectedCompanyId(note.empresaId || 'manual');
    setSelectedOrderId(note.osId || '');
    setClienteNome(note.clienteNome);
    setCnpjCpf(formatCpfCnpjMask(note.cnpj));
    setInscricao(note.inscricao || '');
    setFone(note.contato || '');
    setEndereco(note.endereco || '');
    setStatus(note.id === '__demo_a5__' ? 'emitida' : note.status);
    setItems(
      note.items.length > 0
        ? note.items.map((it) => ({ ...it }))
        : [
            {
              id: `IT-${Date.now()}`,
              descricao: '',
              quantidade: 1,
              precoUnitario: 0,
              total: 0,
            },
          ]
    );
    setFormError(null);
    setViewMode('form');
  };

  const openFictitiousDemoPreview = () => {
    const demo = createFictitiousDemoNote(nextNoteNumber);
    setDemoPreviewNote(demo);
    setPreviewNoteId(null);
    setViewMode('preview');
  };

  const handleFillFictitiousInForm = () => {
    const demo = createFictitiousDemoNote(numero);
    setSelectedCompanyId('manual');
    setSelectedOrderId('');
    setClienteNome(demo.clienteNome);
    setCnpjCpf(demo.cnpj);
    setInscricao(demo.inscricao || 'ISENTO');
    setFone(demo.contato);
    setEndereco(demo.endereco || '');
    setDataEntrada(demo.data);
    setDataSaida(demo.dataSaida || demo.data);
    setItems(
      demo.items.map((it, idx) => ({
        ...it,
        id: `IT-${Date.now()}-${idx + 1}`,
      }))
    );
    setFormError(null);
  };

  const handleCompanySelect = (compId: string) => {
    setSelectedCompanyId(compId);
    if (compId === 'manual') return;
    const comp = companies.find((c) => c.id === compId);
    if (comp) {
      setClienteNome(comp.corporateName);
      setCnpjCpf(formatCpfCnpjMask(comp.cnpj));
      setFone(formatPhoneMask(comp.phone));
      if (comp.city && !endereco.trim()) {
        setEndereco(comp.city);
      }
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
      setCnpjCpf(formatCpfCnpjMask(comp.cnpj));
      setFone(formatPhoneMask(comp.phone || ord.companyPhone));
      setEndereco(comp.city || '');
    } else {
      setSelectedCompanyId('manual');
      setClienteNome(ord.companyName);
      setFone(formatPhoneMask(ord.companyPhone));
    }

    const entryDate =
      ord.createdAt && /^\d{4}-\d{2}-\d{2}/.test(ord.createdAt)
        ? ord.createdAt.slice(0, 10)
        : toISODate();
    const exitDate =
      ord.dueDate && /^\d{4}-\d{2}-\d{2}/.test(ord.dueDate)
        ? ord.dueDate.slice(0, 10)
        : toISODate();
    setDataEntrada(entryDate);
    setDataSaida(exitDate);

    const amount = roundCurrencyBRL(ord.amount || 0);
    setItems([
      {
        id: `IT-${Date.now()}`,
        descricao: ord.toolDescription,
        quantidade: 1,
        precoUnitario: amount,
        total: amount,
      },
    ]);
    setFormError(null);
  };

  const handleAppendOrderAsItem = (orderId: string) => {
    if (!orderId) return;
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    const amount = roundCurrencyBRL(ord.amount || 0);
    setItems((prev) => {
      const cleaned = prev.filter(
        (r) => r.descricao.trim() !== '' || r.precoUnitario > 0
      );
      return [
        ...cleaned,
        {
          id: `IT-${Date.now()}-${cleaned.length + 1}`,
          descricao: `${ord.id} — ${ord.toolDescription}`,
          quantidade: 1,
          precoUnitario: amount,
          total: amount,
        },
      ];
    });
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
          total: roundCurrencyBRL(nextQty * nextPrice),
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
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  };

  const tableTotal = roundCurrencyBRL(
    items.reduce((sum, it) => sum + (it.total || 0), 0)
  );

  // Live draft note used for instant A5 preview while editing the form
  const liveDraftNote: NoteRecord = useMemo(
    () => ({
      id: editingId || '__draft__',
      numero,
      data: dataEntrada || toISODate(),
      dataSaida: dataSaida || undefined,
      empresaId: selectedCompanyId !== 'manual' ? selectedCompanyId : undefined,
      clienteNome: clienteNome.trim(),
      cnpj: cnpjCpf.trim(),
      inscricao: inscricao.trim() || undefined,
      contato: fone.trim(),
      endereco: endereco.trim() || undefined,
      osId: selectedOrderId || undefined,
      status,
      items: items.filter((it) => it.descricao.trim() !== '' || it.total > 0),
      total: tableTotal,
      criadoPor: '',
      criadoEm: '',
    }),
    [
      editingId,
      numero,
      dataEntrada,
      dataSaida,
      selectedCompanyId,
      clienteNome,
      cnpjCpf,
      inscricao,
      fone,
      endereco,
      selectedOrderId,
      status,
      items,
      tableTotal,
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clienteNome.trim()) {
      setFormError('Informe o nome do cliente.');
      return;
    }

    const docDigits = cnpjCpf.replace(/\D/g, '');
    if (docDigits.length > 0 && !isValidCpfOrCnpj(cnpjCpf)) {
      setFormError(
        'CNPJ/CPF inválido. Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ) válidos, ou deixe em branco.'
      );
      return;
    }

    const validItems = items.filter(
      (it) => it.descricao.trim() && it.quantidade > 0
    );
    if (validItems.length === 0) {
      setFormError(
        'Adicione pelo menos 1 serviço com descrição e quantidade maior que zero.'
      );
      return;
    }

    const normalizedItems = validItems.map((it) => ({
      ...it,
      descricao: it.descricao.trim(),
      total: roundCurrencyBRL(it.quantidade * it.precoUnitario),
    }));
    const computedTotal = roundCurrencyBRL(
      normalizedItems.reduce((s, it) => s + it.total, 0)
    );

    setIsSaving(true);
    try {
      const saved = await onSaveNote(
        {
          numero,
          data: dataEntrada || toISODate(),
          dataSaida: dataSaida || undefined,
          empresaId:
            selectedCompanyId !== 'manual' ? selectedCompanyId : undefined,
          clienteNome: clienteNome.trim(),
          cnpj: docDigits.length > 0 ? formatCpfCnpjMask(cnpjCpf) : '',
          inscricao: inscricao.trim() || undefined,
          contato: fone.trim(),
          endereco: endereco.trim() || undefined,
          osId: selectedOrderId || undefined,
          status,
          items: normalizedItems,
          total: computedTotal,
        },
        editingId
      );

      if (saved) {
        setDemoPreviewNote(null);
        setPreviewNoteId(saved.id);
        setViewMode('preview');
      } else {
        setViewMode('list');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredNotas = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter(
      (n) =>
        formatPedidoNumber(n.numero).includes(q) ||
        String(n.numero).includes(q) ||
        n.clienteNome.toLowerCase().includes(q) ||
        n.cnpj.toLowerCase().includes(q) ||
        (n.osId || '').toLowerCase().includes(q)
    );
  }, [notas, globalSearchQuery]);

  const previewNote =
    demoPreviewNote || notas.find((n) => n.id === previewNoteId) || null;
  const isDemoPreview = previewNote?.id === '__demo_a5__';

  useEffect(() => {
    if (!onSyncPrintPreview) return;
    if (viewMode === 'preview' && previewNote) {
      onSyncPrintPreview({ note: previewNote, emitter });
    } else if (viewMode === 'form') {
      onSyncPrintPreview({ note: liveDraftNote, emitter });
    }
  }, [viewMode, previewNote, liveDraftNote, emitter, onSyncPrintPreview]);

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
                Notas e Pedidos (A5)
              </h2>
              <p className="text-xs font-medium text-slate-700">
                Pedido imprimível em A5 retrato (148×210 mm), 15 linhas,
                preenchimento direto da OS e soma automática.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openFictitiousDemoPreview}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Ver Modelo A5</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmitterPanel((v) => !v)}
                className={`liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  showEmitterPanel
                    ? 'ring-2 ring-indigo-500/60 text-indigo-800'
                    : 'text-slate-800'
                }`}
              >
                <Settings2 className="w-4 h-4 text-indigo-600" />
                <span>Cabeçalho</span>
              </button>

              <button
                type="button"
                onClick={openNewForm}
                className="min-h-[44px] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm rounded-full px-5 py-2.5 inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Pedido</span>
              </button>
            </div>
          </div>

          {/* Collapsible Emitter Header Config (strictly fictitious defaults) */}
          {showEmitterPanel && (
            <div className="liquid-glass rounded-[28px] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Dados do Cabeçalho do Pedido (Protótipo Fictício)
                  </h3>
                  <p className="text-[11px] font-medium text-slate-600">
                    Por padrão utiliza marca e contatos fictícios. Edite aqui se
                    desejar personalizar a impressão A5 localmente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetEmitterToFictitious}
                  className="liquid-glass-pill min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Fictício</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sigla do Logo (até 3 letras)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={emitter.monogram}
                    onChange={(e) =>
                      updateEmitterField('monogram', e.target.value)
                    }
                    className={`${inputClass} uppercase font-bold`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={emitter.brandName}
                    onChange={(e) =>
                      updateEmitterField('brandName', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={emitter.subtitle}
                    onChange={(e) =>
                      updateEmitterField('subtitle', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Telefones
                  </label>
                  <input
                    type="text"
                    value={emitter.phone}
                    onChange={(e) =>
                      updateEmitterField('phone', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    E-mail
                  </label>
                  <input
                    type="text"
                    value={emitter.email}
                    onChange={(e) =>
                      updateEmitterField('email', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Site
                  </label>
                  <input
                    type="text"
                    value={emitter.website}
                    onChange={(e) =>
                      updateEmitterField('website', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Descrição (Linha 1)
                  </label>
                  <input
                    type="text"
                    value={emitter.specialtiesLine1}
                    onChange={(e) =>
                      updateEmitterField('specialtiesLine1', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Descrição (Linha 2)
                  </label>
                  <input
                    type="text"
                    value={emitter.specialtiesLine2}
                    onChange={(e) =>
                      updateEmitterField('specialtiesLine2', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={emitter.address}
                    onChange={(e) =>
                      updateEmitterField('address', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="liquid-glass rounded-[28px] overflow-hidden min-w-0">
            {/* Mobile Labeled Cards (< 768px) */}
            <div className="md:hidden divide-y divide-white/55">
              {filteredNotas.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-3">
                  <p className="font-medium text-xs text-slate-600">
                    Nenhum pedido emitido ainda. Crie um novo pedido a partir de
                    uma OS ou visualize o modelo A5 fictício.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={openFictitiousDemoPreview}
                      className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-indigo-700 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Ver Modelo A5</span>
                    </button>
                    <button
                      type="button"
                      onClick={openNewForm}
                      className="min-h-[44px] px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 text-white inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Pedido</span>
                    </button>
                  </div>
                </div>
              ) : (
                filteredNotas.map((note) => {
                  const stMeta = NOTE_STATUS_META[note.status];
                  return (
                    <div
                      key={note.id}
                      className="p-4 space-y-2.5 text-xs min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-rose-700">
                              PEDIDO {formatPedidoNumber(note.numero)}
                            </span>
                            {note.osId && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60">
                                {note.osId}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 break-words block mt-0.5">
                            {note.clienteNome}
                          </span>
                        </div>
                        <span className="font-mono font-black text-base text-slate-900 shrink-0">
                          {formatBRL(note.total)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 font-semibold block">
                            Entrada / Saída
                          </span>
                          <span className="font-mono text-slate-800">
                            {formatDateBR(note.data)}
                            {note.dataSaida
                              ? ` → ${formatDateBR(note.dataSaida)}`
                              : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block">
                            Status
                          </span>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stMeta.badgeClass}`}
                          >
                            {stMeta.label}
                          </span>
                        </div>
                        {note.cnpj && (
                          <div className="col-span-2">
                            <span className="text-slate-500 font-semibold block">
                              CNPJ/CPF
                            </span>
                            <span className="font-mono text-slate-700">
                              {note.cnpj}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDemoPreviewNote(null);
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
                            onTriggerPrint(note, emitter);
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Imprimir A5</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Excluir pedido"
                          className="min-h-[44px] min-w-[44px] rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 inline-flex items-center justify-center cursor-pointer"
                          title="Excluir pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30">
                    <th className="py-3.5 px-5 font-extrabold">Pedido</th>
                    <th className="py-3.5 px-4 font-extrabold">Cliente</th>
                    <th className="py-3.5 px-4 font-extrabold">
                      Entrada / Saída
                    </th>
                    <th className="py-3.5 px-4 text-right font-extrabold">
                      Total
                    </th>
                    <th className="py-3.5 px-4 font-extrabold">Status</th>
                    <th className="py-3.5 px-5 text-right font-extrabold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/45 text-xs">
                  {filteredNotas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 px-6 text-center space-y-3"
                      >
                        <p className="font-medium text-slate-600">
                          Nenhum pedido emitido ainda. Clique em{' '}
                          <strong>Novo Pedido</strong> para preencher com dados
                          da OS ou clique em <strong>Ver Modelo A5</strong> para
                          visualizar o protótipo imprimível.
                        </p>
                        <div className="inline-flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={openFictitiousDemoPreview}
                            className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-indigo-700 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Ver Modelo A5 (Fictício)</span>
                          </button>
                          <button
                            type="button"
                            onClick={openNewForm}
                            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Novo Pedido</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNotas.map((note) => {
                      const stMeta = NOTE_STATUS_META[note.status];
                      return (
                        <tr
                          key={note.id}
                          className="hover:bg-white/35 transition-colors"
                        >
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="font-mono font-extrabold text-rose-700 block">
                              Nº {formatPedidoNumber(note.numero)}
                            </span>
                            {note.osId && (
                              <span className="text-[10px] font-bold text-indigo-700">
                                {note.osId}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 block">
                              {note.clienteNome}
                            </span>
                            <span className="text-[11px] font-mono text-slate-600">
                              {note.cnpj || note.contato || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-800 whitespace-nowrap">
                            <div>{formatDateBR(note.data)}</div>
                            {note.dataSaida && (
                              <div className="text-[11px] text-slate-500">
                                Saída: {formatDateBR(note.dataSaida)}
                              </div>
                            )}
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
                                  setDemoPreviewNote(null);
                                  setPreviewNoteId(note.id);
                                  setViewMode('preview');
                                }}
                                className="liquid-glass-pill min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Visualizar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditForm(note)}
                                className="liquid-glass-pill min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onMarkNotePrinted(note.id);
                                  onTriggerPrint(note, emitter);
                                }}
                                className="min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimir A5</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteNote(note.id)}
                                className="p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer"
                                title="Excluir pedido"
                                aria-label="Excluir pedido"
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

      {/* FORM VIEW (with Live A5 Portrait Preview) */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="liquid-glass-pill min-h-[44px] min-w-[44px] rounded-full text-slate-800 inline-flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Voltar para lista"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-slate-900 frosted-text-depth truncate">
                  {editingId
                    ? `Editar Pedido Nº ${formatPedidoNumber(numero)}`
                    : `Novo Pedido Nº ${formatPedidoNumber(numero)}`}
                </h2>
                <p className="text-xs font-medium text-slate-700">
                  Importe os dados direto de uma OS ou preencha os campos do
                  pedido A5 (148×210 mm).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedOrderId}
                onChange={(e) => handleImportFromOrder(e.target.value)}
                aria-label="Importar de OS existente"
                className={`${inputClass} sm:w-72`}
              >
                <option value="">Importar de OS existente...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.companyName} — {formatBRL(o.amount)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleFillFictitiousInForm}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-indigo-700 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Dados Fictícios</span>
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300/70 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start min-w-0">
            {/* Left Column: Form Controls */}
            <div className="xl:col-span-6 space-y-5 min-w-0">
              {/* Client & Dates Block */}
              <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nº do Pedido (Auto)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatPedidoNumber(numero)}
                      className={`${inputClass} font-mono font-extrabold text-rose-700 bg-white/60`}
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
                      <option value="manual">Preenchimento manual</option>
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

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      placeholder="Nome ou razão social do cliente"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Fone
                    </label>
                    <input
                      type="text"
                      value={fone}
                      onChange={(e) => setFone(formatPhoneMask(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro, cidade - UF"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      CNPJ/CPF
                    </label>
                    <input
                      type="text"
                      value={cnpjCpf}
                      onChange={(e) =>
                        setCnpjCpf(formatCpfCnpjMask(e.target.value))
                      }
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Inscrição
                    </label>
                    <input
                      type="text"
                      value={inscricao}
                      onChange={(e) => setInscricao(e.target.value)}
                      placeholder="Inscrição Estadual ou ISENTO"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Data entrada *
                    </label>
                    <input
                      type="date"
                      required
                      value={dataEntrada}
                      onChange={(e) => setDataEntrada(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Data saída
                    </label>
                    <input
                      type="date"
                      value={dataSaida}
                      onChange={(e) => setDataSaida(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
              </div>

              {/* Services Items Block */}
              <div className="liquid-glass rounded-[28px] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Serviços do Pedido ({items.length}/{PEDIDO_A5_ROWS}{' '}
                      linhas)
                    </h3>
                    <p className="text-[11px] font-medium text-slate-600">
                      A folha A5 exibe 15 linhas fixas com soma automática no
                      canto inferior direito.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-indigo-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar linha</span>
                  </button>
                </div>

                {orders.length > 0 && (
                  <div>
                    <select
                      value=""
                      onChange={(e) => {
                        handleAppendOrderAsItem(e.target.value);
                      }}
                      className={inputClass}
                      aria-label="Adicionar outra OS como linha de serviço"
                    >
                      <option value="">
                        + Incluir serviço de outra OS na tabela...
                      </option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          + {o.id} — {o.toolDescription} ({formatBRL(o.amount)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {items.length > PEDIDO_A5_ROWS && (
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-300/60 text-xs font-bold text-indigo-800">
                    Este pedido possui {items.length} itens e será paginado
                    automaticamente em{' '}
                    {Math.ceil(items.length / PEDIDO_A5_ROWS)} folhas A5 na
                    impressão.
                  </div>
                )}

                <div className="space-y-2.5">
                  {items.map((row, idx) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl liquid-glass-subtle"
                    >
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5 sm:hidden">
                          Quant.
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={row.quantidade}
                          onChange={(e) =>
                            updateRow(idx, 'quantidade', e.target.value)
                          }
                          placeholder="Qtd."
                          title="Quantidade"
                          className={`${inputClass} font-mono text-right`}
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5 sm:hidden">
                          Descrição dos serviços
                        </label>
                        <input
                          type="text"
                          required
                          value={row.descricao}
                          onChange={(e) =>
                            updateRow(idx, 'descricao', e.target.value)
                          }
                          placeholder="Descrição do serviço / faca"
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5 sm:hidden">
                          Valor unit. (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={row.precoUnitario}
                          onChange={(e) =>
                            updateRow(idx, 'precoUnitario', e.target.value)
                          }
                          placeholder="Valor R$"
                          title="Valor unitário (R$)"
                          className={`${inputClass} font-mono text-right`}
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <span
                          className="font-mono text-xs font-extrabold text-slate-900 whitespace-nowrap"
                          title="Total da linha"
                        >
                          {formatBRL(row.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={items.length <= 1}
                          className="min-h-[40px] min-w-[40px] rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-40 text-slate-500 hover:text-rose-700 inline-flex items-center justify-center cursor-pointer shrink-0"
                          title="Remover linha"
                          aria-label="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">
                      Total Automático
                    </span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {formatBRL(tableTotal)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTriggerPrint(liveDraftNote, emitter)}
                      className="liquid-glass-pill min-h-[44px] px-4 py-2.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>Imprimir Prévia</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 text-white border border-white/40 shadow-lg inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {isSaving
                          ? 'Salvando...'
                          : editingId
                          ? 'Salvar Pedido'
                          : 'Emitir Pedido'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live A5 Portrait Preview */}
            <div className="xl:col-span-6 space-y-3 min-w-0 xl:sticky xl:top-5">
              <div className="liquid-glass rounded-[24px] px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    Prévia em Tempo Real — A5 Retrato (148×210 mm)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-rose-700 shrink-0">
                  Nº {formatPedidoNumber(numero)}
                </span>
              </div>

              <div className="space-y-4">
                {chunkNoteItems(liveDraftNote.items, PEDIDO_A5_ROWS).map(
                  (chunk, idx, arr) => (
                    <PedidoA5Sheet
                      key={`live-a5-${idx}`}
                      note={liveDraftNote}
                      itemsChunk={chunk}
                      pageIndex={idx}
                      totalPages={arr.length}
                      emitter={emitter}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* PREVIEW VIEW */}
      {viewMode === 'preview' && previewNote && (
        <div className="space-y-4 min-w-0">
          <div className="liquid-glass rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setDemoPreviewNote(null);
                  setViewMode('list');
                }}
                className="liquid-glass-pill min-h-[44px] min-w-[44px] rounded-full text-slate-800 inline-flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    {isDemoPreview
                      ? `Modelo Fictício — Pedido Nº ${formatPedidoNumber(previewNote.numero)}`
                      : `Pedido Nº ${formatPedidoNumber(previewNote.numero)}`}
                  </span>
                </h3>
                <p className="text-[11px] font-medium text-slate-600">
                  Formato A5 Retrato (148 × 210 mm) • 15 linhas • Total
                  automático ({formatBRL(previewNote.total)})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openEditForm(previewNote)}
                className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>{isDemoPreview ? 'Editar / Salvar' : 'Editar'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isDemoPreview) {
                    onMarkNotePrinted(previewNote.id);
                  }
                  onTriggerPrint(previewNote, emitter);
                }}
                className="min-h-[44px] px-5 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir A5</span>
              </button>
            </div>
          </div>

          <div className="space-y-5 pb-4">
            {chunkNoteItems(previewNote.items, PEDIDO_A5_ROWS).map(
              (chunk, idx, arr) => (
                <PedidoA5Sheet
                  key={`${previewNote.id}-a5-${idx}`}
                  note={previewNote}
                  itemsChunk={chunk}
                  pageIndex={idx}
                  totalPages={arr.length}
                  emitter={emitter}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
