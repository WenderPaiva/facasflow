// FacasFlow Enterprise (Dark Crimson Bento Edition) - Compiled ESM Bundle
import * as ReactNamespace from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import * as LucideIcons from 'https://esm.sh/lucide-react@0.468.0?deps=react@19.0.0';

const React = ReactNamespace.default || ReactNamespace;
const __externalModules = {
  'react': Object.assign({ default: React }, ReactNamespace),
  'react-dom/client': { createRoot, default: { createRoot } },
  'lucide-react': LucideIcons
};

const __moduleFactories = {};
const __moduleCache = {};

function __resolvePath(baseDir, request) {
  if (!request.startsWith('.')) return request;
  const parts = (baseDir + '/' + request).split('/');
  const resolved = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  return './' + resolved.join('/').replace(/\.(tsx|ts|js)$/, '');
}

function __require(baseDir, request) {
  if (__externalModules[request]) {
    return __externalModules[request];
  }
  const resolvedId = __resolvePath(baseDir, request);
  if (__moduleCache[resolvedId]) {
    return __moduleCache[resolvedId].exports;
  }
  const factory = __moduleFactories[resolvedId];
  if (!factory) {
    throw new Error('Module not found in FacasFlow bundle: ' + request + ' (resolved: ' + resolvedId + ')');
  }
  const moduleObj = { exports: {} };
  __moduleCache[resolvedId] = moduleObj;
  factory(moduleObj, moduleObj.exports, (req) => __require(factory.dir, req));
  return moduleObj.exports;
}


__moduleFactories["./types/order"] = Object.assign(
  function(module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

  },
  { dir: "./types" }
);

__moduleFactories["./utils/financeEngine"] = Object.assign(
  function(module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETURN_STATUS_META = exports.DELIVERY_METHOD_META = exports.INVESTMENT_TYPE_META = exports.EXPENSE_CATEGORIES = exports.PAYMENT_MODALITY_META = exports.PRODUCTION_STAGES = void 0;
exports.createEmptyExpensesMap = createEmptyExpensesMap;
exports.formatCurrencyMask = formatCurrencyMask;
exports.parseCurrencyMask = parseCurrencyMask;
exports.formatBRL = formatBRL;
exports.toISODate = toISODate;
exports.nowTimestampBR = nowTimestampBR;
exports.addDays = addDays;
exports.formatDateBR = formatDateBR;
exports.getDaysDiff = getDaysDiff;
exports.getNextStage = getNextStage;
exports.getPrevStage = getPrevStage;
exports.migratePaymentModality = migratePaymentModality;
exports.normalizeOrderPaymentStatus = normalizeOrderPaymentStatus;
exports.computeFinancialBreakdown = computeFinancialBreakdown;
exports.buildPixClipboardSnippet = buildPixClipboardSnippet;
exports.buildWhatsAppBillingUrl = buildWhatsAppBillingUrl;
exports.formatCnpjMask = formatCnpjMask;
exports.isValidCNPJ = isValidCNPJ;
exports.formatPhoneMask = formatPhoneMask;
exports.PRODUCTION_STAGES = [
    {
        id: 'arquivo_recebido',
        step: 1,
        label: 'Arquivo Recebido',
        shortLabel: '1. Arquivo',
        subtitle: 'CAD / PDF / Amostra na triagem',
        accentColor: 'border-white/70',
        dotClass: 'bg-slate-400',
    },
    {
        id: 'desenho_produzido',
        step: 2,
        label: 'Desenho Produzido',
        shortLabel: '2. Desenho CAD',
        subtitle: 'EngView / Projeto técnico pronto',
        accentColor: 'border-indigo-300/70',
        dotClass: 'bg-indigo-500',
    },
    {
        id: 'faca_serrada',
        step: 3,
        label: 'Faca Serrada',
        shortLabel: '3. Serrada / Laser',
        subtitle: 'Madeira cortada e calada',
        accentColor: 'border-sky-300/70',
        dotClass: 'bg-sky-500',
    },
    {
        id: 'faca_dobrada',
        step: 4,
        label: 'Faca Dobrada',
        shortLabel: '4. Lâmina Dobrada',
        subtitle: 'Lâminas de corte e vinco conformadas',
        accentColor: 'border-purple-300/70',
        dotClass: 'bg-purple-500',
    },
    {
        id: 'faca_ajustada',
        step: 5,
        label: 'Faca Ajustada',
        shortLabel: '5. Ajustada / Borracha',
        subtitle: 'Cravação, esquadro e emborrachamento',
        accentColor: 'border-amber-300/70',
        dotClass: 'bg-amber-500',
    },
    {
        id: 'faca_pronta',
        step: 6,
        label: 'Faca Pronta',
        shortLabel: '6. Faca Pronta',
        subtitle: 'Liberada para expedição / entrega',
        accentColor: 'border-emerald-300/70',
        dotClass: 'bg-emerald-500',
    },
];
exports.PAYMENT_MODALITY_META = {
    pix: {
        label: 'Pix',
        short: 'Pix',
        colorHex: '#10b981', // verde-água
        badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/50',
        defaultDays: 0,
    },
    boleto: {
        label: 'Boleto (15/30)',
        short: 'Boleto (15/30)',
        colorHex: '#4f46e5', // azul
        badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-400/50',
        defaultDays: 30,
    },
    dinheiro: {
        label: 'Dinheiro',
        short: 'Dinheiro',
        colorHex: '#22c55e', // verde
        badgeClass: 'bg-green-500/15 text-green-800 border-green-400/50',
        defaultDays: 0,
    },
    cartao: {
        label: 'Cartão',
        short: 'Cartão',
        colorHex: '#f59e0b', // laranja
        badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-400/50',
        defaultDays: 2,
    },
    nao_pago: {
        label: 'Não Pago',
        short: 'Não Pago',
        colorHex: '#64748b', // cinza
        badgeClass: 'bg-white/60 text-slate-700 border-white/80',
        defaultDays: 0,
    },
};
exports.EXPENSE_CATEGORIES = [
    { key: 'aluguel', label: 'Aluguel' },
    { key: 'agua', label: 'Água' },
    { key: 'energia', label: 'Energia' },
    { key: 'internet', label: 'Internet' },
    { key: 'alimentacao', label: 'Alimentação' },
    { key: 'combustivel', label: 'Combustível' },
    { key: 'manutencao', label: 'Manutenção' },
    { key: 'contador', label: 'Contador' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'financiamento', label: 'Financiamento' },
];
exports.INVESTMENT_TYPE_META = {
    renda_fixa: { label: 'Renda Fixa' },
    acoes: { label: 'Ações' },
    fii: { label: 'Fundos Imobiliários' },
    outro: { label: 'Outro' },
};
function createEmptyExpensesMap() {
    return {
        aluguel: 0,
        agua: 0,
        energia: 0,
        internet: 0,
        alimentacao: 0,
        combustivel: 0,
        manutencao: 0,
        contador: 0,
        marketing: 0,
        financiamento: 0,
    };
}
function formatCurrencyMask(value) {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(safe);
}
function parseCurrencyMask(rawInput) {
    const digits = rawInput.replace(/\D/g, '');
    if (!digits)
        return 0;
    return Number(digits) / 100;
}
exports.DELIVERY_METHOD_META = {
    cliente_buscou: {
        label: 'Cliente Veio Buscar',
        badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/50',
    },
    uber_flash: {
        label: 'Enviado por Uber Flash',
        badgeClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-400/50',
    },
    entregador_proprio: {
        label: 'Entregador Próprio',
        badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-400/50',
    },
    portador: {
        label: 'Retirado por Portador',
        badgeClass: 'bg-white/60 text-slate-700 border-white/80',
    },
};
exports.RETURN_STATUS_META = {
    em_analise: {
        label: 'Em Análise',
        badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-400/50',
        dotClass: 'bg-amber-500',
        next: 'em_ajuste',
    },
    em_ajuste: {
        label: 'Em Ajuste de Bancada',
        badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-400/50',
        dotClass: 'bg-rose-500',
        next: 'liberado',
    },
    liberado: {
        label: 'Liberado Novamente',
        badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/50',
        dotClass: 'bg-emerald-500',
    },
};
function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
}
function toISODate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function nowTimestampBR(date = new Date()) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m} às ${h}:${min}`;
}
function addDays(baseIso, days) {
    const clean = (baseIso || toISODate()).slice(0, 10);
    const [y, m, d] = clean.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
    dt.setDate(dt.getDate() + days);
    return toISODate(dt);
}
function formatDateBR(isoDate) {
    if (!isoDate)
        return '—';
    const clean = isoDate.slice(0, 10);
    const parts = clean.split('-');
    if (parts.length !== 3)
        return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function getDaysDiff(dueDate, refIso) {
    const today = (refIso || toISODate()).slice(0, 10);
    const due = (dueDate || today).slice(0, 10);
    const [ty, tm, td] = today.split('-').map(Number);
    const [dy, dm, dd] = due.split('-').map(Number);
    const tDate = new Date(ty, tm - 1, td, 12, 0, 0);
    const dDate = new Date(dy, dm - 1, dd, 12, 0, 0);
    return Math.round((dDate.getTime() - tDate.getTime()) / 86400000);
}
function getNextStage(current) {
    const idx = exports.PRODUCTION_STAGES.findIndex((s) => s.id === current);
    if (idx === -1 || idx >= exports.PRODUCTION_STAGES.length - 1)
        return null;
    return exports.PRODUCTION_STAGES[idx + 1].id;
}
function getPrevStage(current) {
    const idx = exports.PRODUCTION_STAGES.findIndex((s) => s.id === current);
    if (idx <= 0)
        return null;
    return exports.PRODUCTION_STAGES[idx - 1].id;
}
function migratePaymentModality(raw) {
    const normalized = String(raw || '').trim().toLowerCase();
    if (normalized === 'pix')
        return 'pix';
    if (normalized === 'a_prazo' || normalized === 'a prazo' || normalized === 'boleto') {
        return 'boleto';
    }
    if (normalized === 'dinheiro')
        return 'dinheiro';
    if (normalized === 'cartao' || normalized === 'cartão')
        return 'cartao';
    if (normalized === 'cortesia' ||
        normalized === 'nao_pago' ||
        normalized === 'não pago') {
        return 'nao_pago';
    }
    return 'boleto';
}
function normalizeOrderPaymentStatus(order) {
    const rawMod = String(order.paymentModality || '');
    const isLegacyCortesiaWithValue = rawMod.trim().toLowerCase() === 'cortesia' && (Number(order.amount) || 0) > 0;
    if (isLegacyCortesiaWithValue) {
        console.warn(`[FacasFlow Migration] Registro de cortesia com valor detectado (${order.id}: ${order.amount}); migração automática ignorada para revisão manual.`);
        return order;
    }
    const migratedModality = migratePaymentModality(rawMod);
    const migratedStatus = String(order.paymentStatus || '').toLowerCase() === 'cortesia'
        ? 'nao_pago'
        : order.paymentStatus;
    if (migratedModality === 'nao_pago') {
        return { ...order, paymentModality: migratedModality, paymentStatus: 'nao_pago' };
    }
    if (migratedStatus === 'pago' || migratedStatus === 'sem_nota') {
        return { ...order, paymentModality: migratedModality, paymentStatus: migratedStatus };
    }
    const diff = getDaysDiff(order.dueDate);
    const nextStatus = diff < 0 ? 'vencido' : 'a_receber';
    return {
        ...order,
        paymentModality: migratedModality,
        paymentStatus: nextStatus,
    };
}
function computeFinancialBreakdown(orders) {
    let receivable30d = 0;
    let receivableCount = 0;
    let overdueTotal = 0;
    let overdueCount = 0;
    let unbilledTotal = 0;
    let unbilledCount = 0;
    let paidTotal = 0;
    let paidCount = 0;
    let totalVolume = 0;
    const modalityTotals = {
        pix: { amount: 0, count: 0 },
        boleto: { amount: 0, count: 0 },
        dinheiro: { amount: 0, count: 0 },
        cartao: { amount: 0, count: 0 },
        nao_pago: { amount: 0, count: 0 },
    };
    for (const raw of orders) {
        const o = normalizeOrderPaymentStatus(raw);
        const val = o.amount || 0;
        totalVolume += val;
        if (modalityTotals[o.paymentModality]) {
            modalityTotals[o.paymentModality].amount += val;
            modalityTotals[o.paymentModality].count += 1;
        }
        switch (o.paymentStatus) {
            case 'pago':
                paidTotal += val;
                paidCount += 1;
                break;
            case 'vencido':
                overdueTotal += val;
                overdueCount += 1;
                break;
            case 'sem_nota':
                unbilledTotal += val;
                unbilledCount += 1;
                break;
            case 'a_receber':
                receivable30d += val;
                receivableCount += 1;
                break;
        }
    }
    const safeTotal = totalVolume > 0 ? totalVolume : 1;
    const byModality = Object.keys(exports.PAYMENT_MODALITY_META).map((mod) => {
        const meta = exports.PAYMENT_MODALITY_META[mod];
        const stats = modalityTotals[mod];
        return {
            modality: mod,
            label: meta.label,
            colorHex: meta.colorHex,
            totalAmount: stats.amount,
            count: stats.count,
            percentage: Math.round((stats.amount / safeTotal) * 100),
        };
    });
    return {
        receivable30d,
        receivableCount,
        overdueTotal,
        overdueCount,
        unbilledTotal,
        unbilledCount,
        paidTotal,
        paidCount,
        totalVolume,
        byModality,
    };
}
function buildPixClipboardSnippet(order) {
    return (`QUALIFACAS CORTE E VINCO - ${order.id}\n` +
        `Empresa: ${order.companyName}\n` +
        `Ferramenta: ${order.toolDescription}\n` +
        `Valor: ${formatBRL(order.amount)} - ${exports.PAYMENT_MODALITY_META[order.paymentModality]?.short}\n` +
        `Vencimento: ${formatDateBR(order.dueDate)}\n` +
        `Chave Pix CNPJ: 14.528.910/0001-42`);
}
function buildWhatsAppBillingUrl(order) {
    const digits = (order.companyPhone || '11999990000').replace(/\D/g, '');
    const phone = digits.startsWith('55') ? digits : `55${digits}`;
    const valor = formatBRL(order.amount);
    const venc = formatDateBR(order.dueDate);
    const mod = exports.PAYMENT_MODALITY_META[order.paymentModality]?.label || '';
    let msg = '';
    if (order.paymentStatus === 'vencido') {
        msg =
            `Olá, pessoal da *${order.companyName}*, tudo bem?\n\n` +
                `Consta em aberto no nosso sistema a *${order.id} (${order.toolDescription})*, no valor de *${valor}* (vencimento em ${venc}).\n\n` +
                `Para pagamento via PIX, nossa chave CNPJ é: *14.528.910/0001-42*.\n` +
                `Caso já tenham efetuado a baixa, por gentileza desconsiderem. Obrigado!`;
    }
    else if (order.paymentStatus === 'sem_nota') {
        msg =
            `Olá, pessoal da *${order.companyName}*!\n\n` +
                `Referente à faca entregue *${order.id} - ${order.toolDescription}* (*${valor}*), estamos gerando o fechamento financeiro.\n\n` +
                `Confirmam o faturamento na modalidade *${mod}* ou preferem PIX (*14.528.910/0001-42*)? Obrigado!`;
    }
    else {
        msg =
            `Olá, pessoal da *${order.companyName}*!\n\n` +
                `Segue o resumo da *${order.id} - ${order.toolDescription}*:\n` +
                `• *Valor:* ${valor}\n` +
                `• *Modalidade:* ${mod}\n` +
                `• *Vencimento:* ${venc}\n` +
                `• *Chave PIX (CNPJ):* 14.528.910/0001-42\n\n` +
                `Qualquer dúvida estamos à disposição!`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
function formatCnpjMask(raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2)
        return digits;
    if (digits.length <= 5)
        return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }
    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}
function isValidCNPJ(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length !== 14)
        return false;
    if (/^(\d)\1{13}$/.test(digits))
        return false;
    const calcDigit = (slice, weights) => {
        let sum = 0;
        for (let i = 0; i < weights.length; i += 1) {
            sum += Number(slice[i]) * weights[i];
        }
        const rem = sum % 11;
        return rem < 2 ? 0 : 11 - rem;
    };
    const d1 = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (d1 !== Number(digits[12]))
        return false;
    const d2 = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return d2 === Number(digits[13]);
}
function formatPhoneMask(raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0)
        return '';
    if (digits.length <= 2)
        return `(${digits}`;
    if (digits.length <= 6)
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

  },
  { dir: "./utils" }
);

__moduleFactories["./data/seedOrders"] = Object.assign(
  function(module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TENANT_ACCOUNTS = void 0;
exports.createEnterpriseSeedDatabase = createEnterpriseSeedDatabase;
exports.DEFAULT_TENANT_ACCOUNTS = [
    {
        id: 'USR-001',
        company_id: 'tenant_qualifacas',
        companyName: 'Qualifacas',
        ownerName: 'Wender Paiva',
        email: 'contato@qualifacas.com',
        password: '123456',
        role: 'admin',
        jobTitle: 'Administrador / Proprietário',
        createdAt: '2026-11-10',
    },
    {
        id: 'USR-002',
        company_id: 'tenant_francisco',
        companyName: 'Facaria do Francisco',
        ownerName: 'Francisco',
        email: 'francisco@facaria.com',
        password: '123456',
        role: 'admin',
        jobTitle: 'Administrador / Proprietário',
        createdAt: '2026-11-10',
    },
];
function createEnterpriseSeedDatabase(company_id = 'tenant_qualifacas') {
    return {
        version: 6,
        company_id,
        companies: [],
        orders: [],
        deliveries: [],
        returns: [],
        stock: [],
        notas: [],
        noteSequence: 0,
        expenses: [],
        serviceProviders: [],
        payrollEmployees: [],
        investments: [],
        employees: [],
    };
}

  },
  { dir: "./data" }
);

__moduleFactories["./services/storageAdapter"] = Object.assign(
  function(module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndImportInviteFromUrl = checkAndImportInviteFromUrl;
exports.getTenantAccounts = getTenantAccounts;
exports.saveTenantAccounts = saveTenantAccounts;
exports.getCompanyEmployees = getCompanyEmployees;
exports.registerEmployeeForCompany = registerEmployeeForCompany;
exports.updateEmployeeRoleInCompany = updateEmployeeRoleInCompany;
exports.deleteEmployeeFromCompany = deleteEmployeeFromCompany;
exports.getActiveSession = getActiveSession;
exports.saveActiveSession = saveActiveSession;
exports.clearActiveSession = clearActiveSession;
exports.authenticateTenant = authenticateTenant;
exports.registerNewTenant = registerNewTenant;
exports.loadEnterpriseDatabase = loadEnterpriseDatabase;
exports.saveEnterpriseDatabaseLocalOnly = saveEnterpriseDatabaseLocalOnly;
exports.saveEnterpriseDatabase = saveEnterpriseDatabase;
exports.moveOrderStageOnServer = moveOrderStageOnServer;
exports.getNextOrderId = getNextOrderId;
exports.getNextDeliveryId = getNextDeliveryId;
exports.getNextReturnId = getNextReturnId;
exports.getNextStockId = getNextStockId;
exports.getNextProviderId = getNextProviderId;
exports.getNextPayrollEmployeeId = getNextPayrollEmployeeId;
exports.getNextInvestmentId = getNextInvestmentId;
exports.getNextNoteNumber = getNextNoteNumber;
const seedOrders_1 = require("../data/seedOrders");
const financeEngine_1 = require("../utils/financeEngine");
const realtimeEngine_1 = require("./realtimeEngine");
const TENANTS_REGISTRY_KEY = 'facasflow_saas_tenants_v1';
const ACTIVE_SESSION_KEY = 'facasflow_active_session_v1';
const LEGACY_SINGLE_PROD_KEY = 'facasflow_production_v1';
const LEGACY_DEMO_KEYS = [
    'facasflow_orders_v1',
    'facasflow_lean_v2',
    'facasflow_enterprise_bento_v3',
];
function getTenantDbStorageKey(company_id) {
    return `facasflow_tenant_db_${company_id}`;
}
function normalizeAccount(acc) {
    return {
        ...acc,
        id: acc.id || `USR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        email: acc.email.trim().toLowerCase(),
        role: acc.role === 'operador' ? 'operador' : 'admin',
        jobTitle: acc.jobTitle ||
            (acc.role === 'operador'
                ? 'Operador de Produção'
                : 'Administrador / Proprietário'),
    };
}
/**
 * Check URL for employee invite sync token (?emp_sync=...) so mobile devices can import employee credentials & RBAC role
 */
function checkAndImportInviteFromUrl() {
    if (typeof window === 'undefined')
        return;
    try {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('emp_sync');
        if (!encoded)
            return;
        const jsonStr = decodeURIComponent(escape(window.atob(encoded)));
        const imported = JSON.parse(jsonStr);
        if (imported && imported.email && imported.company_id && imported.role) {
            const accounts = getTenantAccounts();
            const cleanEmail = imported.email.trim().toLowerCase();
            const filtered = accounts.filter((a) => a.email.trim().toLowerCase() !== cleanEmail);
            const updated = [...filtered, normalizeAccount(imported)];
            window.localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(updated));
            // Clean URL parameter without reloading
            const url = new URL(window.location.href);
            url.searchParams.delete('emp_sync');
            window.history.replaceState({}, '', url.toString());
        }
    }
    catch {
        // ignore invalid token
    }
}
/**
 * Load all registered SaaS tenant & employee accounts
 */
function getTenantAccounts() {
    try {
        const raw = window.localStorage.getItem(TENANTS_REGISTRY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const existingEmails = new Set(parsed.map((t) => t.email.trim().toLowerCase()));
                const merged = parsed.map(normalizeAccount);
                for (const def of seedOrders_1.DEFAULT_TENANT_ACCOUNTS) {
                    if (!existingEmails.has(def.email.trim().toLowerCase())) {
                        merged.push(normalizeAccount(def));
                    }
                }
                return merged;
            }
        }
    }
    catch {
        // fallback
    }
    const defaults = seedOrders_1.DEFAULT_TENANT_ACCOUNTS.map(normalizeAccount);
    try {
        window.localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(defaults));
    }
    catch {
        // ignore
    }
    return defaults;
}
function saveTenantAccounts(accounts) {
    const normalized = accounts.map(normalizeAccount);
    try {
        window.localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(normalized));
    }
    catch {
        // ignore
    }
    return normalized;
}
/**
 * Get all users/employees belonging strictly to a specific `company_id`
 */
function getCompanyEmployees(company_id) {
    const all = getTenantAccounts();
    return all.filter((acc) => acc.company_id === company_id);
}
/**
 * Register a new employee under the current Admin's `company_id`
 */
function registerEmployeeForCompany(payload) {
    const email = payload.email.trim().toLowerCase();
    const ownerName = payload.ownerName.trim();
    const password = payload.password.trim();
    const jobTitle = payload.jobTitle.trim() ||
        (payload.role === 'operador' ? 'Operador de Produção' : 'Administrador');
    if (!ownerName || !email || !password) {
        return { error: 'Preencha nome, e-mail e senha do funcionário.' };
    }
    const accounts = getTenantAccounts();
    if (accounts.some((a) => a.email.trim().toLowerCase() === email)) {
        return { error: 'Já existe um usuário cadastrado com este e-mail.' };
    }
    const companyUsers = accounts.filter((a) => a.company_id === payload.company_id);
    const nextId = `USR-${String(companyUsers.length + 1).padStart(3, '0')}`;
    const newEmployee = {
        id: nextId,
        company_id: payload.company_id,
        companyName: payload.companyName,
        ownerName,
        email,
        password,
        role: payload.role,
        jobTitle,
        createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...accounts, newEmployee];
    saveTenantAccounts(updated);
    return { employee: newEmployee };
}
/**
 * Update an employee's role ('admin' | 'operador') within the same company
 */
function updateEmployeeRoleInCompany(email, company_id, nextRole) {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = getTenantAccounts();
    const updated = accounts.map((acc) => {
        if (acc.company_id === company_id &&
            acc.email.trim().toLowerCase() === cleanEmail) {
            return {
                ...acc,
                role: nextRole,
                jobTitle: nextRole === 'operador'
                    ? acc.jobTitle === 'Administrador / Proprietário'
                        ? 'Operador de Produção'
                        : acc.jobTitle
                    : acc.jobTitle,
            };
        }
        return acc;
    });
    saveTenantAccounts(updated);
    return updated.filter((a) => a.company_id === company_id);
}
/**
 * Delete an employee account from a company
 */
function deleteEmployeeFromCompany(email, company_id) {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = getTenantAccounts();
    const updated = accounts.filter((acc) => !(acc.company_id === company_id &&
        acc.email.trim().toLowerCase() === cleanEmail));
    saveTenantAccounts(updated);
    return updated.filter((a) => a.company_id === company_id);
}
/**
 * Get current persisted session so page refresh stays logged in
 */
function getActiveSession() {
    try {
        checkAndImportInviteFromUrl();
        const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.company_id && parsed.companyName && parsed.email) {
            return {
                ...parsed,
                role: parsed.role === 'operador' ? 'operador' : 'admin',
            };
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Save active session on login
 */
function saveActiveSession(session) {
    try {
        window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
    catch {
        // ignore
    }
}
/**
 * Logout and clear active session
 */
function clearActiveSession() {
    try {
        window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
    catch {
        // ignore
    }
}
function buildDeterministicCompanyId(email) {
    const clean = email
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    return `tenant_${clean}`;
}
/**
 * Authenticate a user (Admin or Operador) by email & password
 */
function authenticateTenant(emailInput, passwordInput) {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    if (!email || !password) {
        return {
            error: 'Preencha seu e-mail e senha para entrar.',
        };
    }
    const accounts = getTenantAccounts();
    // Also check if any tenant database on this device has this employee inside its `employees` list
    let existingByEmail = accounts.find((acc) => acc.email.trim().toLowerCase() === email);
    if (!existingByEmail) {
        try {
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && key.startsWith('facasflow_tenant_db_')) {
                    const rawDb = window.localStorage.getItem(key);
                    if (rawDb) {
                        const parsedDb = JSON.parse(rawDb);
                        if (Array.isArray(parsedDb.employees)) {
                            const foundEmp = parsedDb.employees.find((e) => e.email.trim().toLowerCase() === email);
                            if (foundEmp) {
                                existingByEmail = normalizeAccount(foundEmp);
                                saveTenantAccounts([...accounts, existingByEmail]);
                                break;
                            }
                        }
                    }
                }
            }
        }
        catch {
            // ignore
        }
    }
    if (existingByEmail) {
        const storedPass = existingByEmail.password.trim();
        const isPasswordMatch = storedPass === password ||
            storedPass.toLowerCase() === password.toLowerCase();
        if (!isPasswordMatch) {
            return {
                error: 'E-mail ou senha inválidos. Verifique suas credenciais.',
            };
        }
        const session = {
            userId: existingByEmail.id,
            company_id: existingByEmail.company_id,
            companyName: existingByEmail.companyName,
            ownerName: existingByEmail.ownerName,
            email: existingByEmail.email.trim().toLowerCase(),
            role: existingByEmail.role === 'operador' ? 'operador' : 'admin',
            jobTitle: existingByEmail.jobTitle,
            loggedInAt: new Date().toISOString(),
        };
        saveActiveSession(session);
        return { session };
    }
    // Cross-device fallback for newly registered company owners
    if (email.includes('@') && password.length >= 1) {
        const company_id = buildDeterministicCompanyId(email);
        const localPrefix = email.split('@')[0] || 'Facaria';
        const formattedName = localPrefix.charAt(0).toUpperCase() + localPrefix.slice(1);
        const syncedAccount = {
            id: 'USR-001',
            company_id,
            companyName: formattedName,
            ownerName: formattedName,
            email,
            password,
            role: 'admin',
            jobTitle: 'Administrador / Proprietário',
            createdAt: new Date().toISOString().slice(0, 10),
        };
        saveTenantAccounts([...accounts, syncedAccount]);
        const session = {
            userId: syncedAccount.id,
            company_id: syncedAccount.company_id,
            companyName: syncedAccount.companyName,
            ownerName: syncedAccount.ownerName,
            email: syncedAccount.email,
            role: 'admin',
            jobTitle: syncedAccount.jobTitle,
            loggedInAt: new Date().toISOString(),
        };
        saveActiveSession(session);
        return { session };
    }
    return {
        error: 'E-mail ou senha inválidos. Verifique suas credenciais.',
    };
}
/**
 * Register a new tenant (Facaria) as Admin/Owner and automatically sign in
 */
function registerNewTenant(payload) {
    const email = payload.email.trim().toLowerCase();
    const companyName = payload.companyName.trim();
    const ownerName = payload.ownerName.trim() || companyName;
    const password = payload.password.trim();
    if (!companyName || !email || !password) {
        return { error: 'Preencha todos os campos obrigatórios.' };
    }
    const accounts = getTenantAccounts();
    if (accounts.some((a) => a.email.trim().toLowerCase() === email)) {
        return { error: 'Já existe uma conta cadastrada com este e-mail.' };
    }
    const company_id = buildDeterministicCompanyId(email);
    const newAccount = {
        id: 'USR-001',
        company_id,
        companyName,
        ownerName,
        email,
        password,
        role: 'admin',
        jobTitle: 'Administrador / Proprietário',
        createdAt: new Date().toISOString().slice(0, 10),
    };
    saveTenantAccounts([...accounts, newAccount]);
    // Initialize isolated database for this new tenant including the owner in employees
    const initialDb = (0, seedOrders_1.createEnterpriseSeedDatabase)(company_id);
    initialDb.employees = [newAccount];
    saveEnterpriseDatabase(initialDb);
    const session = {
        userId: newAccount.id,
        company_id: newAccount.company_id,
        companyName: newAccount.companyName,
        ownerName: newAccount.ownerName,
        email: newAccount.email,
        role: 'admin',
        jobTitle: newAccount.jobTitle,
        loggedInAt: new Date().toISOString(),
    };
    saveActiveSession(session);
    return { session };
}
function normalizeDb(db, company_id) {
    const registryEmployees = getCompanyEmployees(company_id);
    const dbEmployees = Array.isArray(db.employees) ? db.employees : [];
    // Merge employees from registry and db so Realtime sync propagates employee list too
    const mergedEmpMap = new Map();
    for (const emp of [...registryEmployees, ...dbEmployees]) {
        if (emp && emp.email && emp.company_id === company_id) {
            mergedEmpMap.set(emp.email.trim().toLowerCase(), normalizeAccount(emp));
        }
    }
    const mergedEmployees = Array.from(mergedEmpMap.values());
    // Sync merged employees back into global tenant registry on this client
    if (mergedEmployees.length > 0) {
        try {
            const allAccounts = getTenantAccounts();
            const others = allAccounts.filter((a) => a.company_id !== company_id);
            window.localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify([...others, ...mergedEmployees]));
        }
        catch {
            // ignore
        }
    }
    return {
        version: 6,
        company_id,
        companies: (Array.isArray(db.companies) ? db.companies : [])
            .filter((c) => !c.company_id || c.company_id === company_id)
            .map((c) => ({ ...c, company_id })),
        orders: (Array.isArray(db.orders) ? db.orders : [])
            .filter((o) => !o.company_id || o.company_id === company_id)
            .map((o) => {
            const normalizedOrder = (0, financeEngine_1.normalizeOrderPaymentStatus)({ ...o, company_id });
            return {
                ...normalizedOrder,
                version: Number(normalizedOrder.version) || 1,
                updatedAt: normalizedOrder.updatedAt ||
                    normalizedOrder.createdAt ||
                    new Date().toISOString(),
            };
        })
            .sort((a, b) => {
            const nA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
            const nB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
            return nB - nA;
        }),
        deliveries: (Array.isArray(db.deliveries) ? db.deliveries : [])
            .filter((d) => !d.company_id || d.company_id === company_id)
            .map((d) => ({ ...d, company_id })),
        returns: (Array.isArray(db.returns) ? db.returns : [])
            .filter((r) => !r.company_id || r.company_id === company_id)
            .map((r) => ({ ...r, company_id })),
        stock: (Array.isArray(db.stock) ? db.stock : [])
            .filter((s) => !s.company_id || s.company_id === company_id)
            .map((s) => ({
            ...s,
            company_id,
            category: s.category === 'laminas' ? 'laminas' : 'madeiras',
            quantity: Number(s.quantity) || 0,
            minStock: Number(s.minStock) || 0,
            unitCost: Number(s.unitCost) || 0,
        })),
        notas: (Array.isArray(db.notas) ? db.notas : [])
            .filter((n) => !n.company_id || n.company_id === company_id)
            .map((n) => {
            const items = (Array.isArray(n.items) ? n.items : []).map((it) => {
                const quantidade = Math.max(0, Number(it.quantidade) || 0);
                const precoUnitario = Math.max(0, Number(it.precoUnitario) || 0);
                return {
                    ...it,
                    quantidade,
                    precoUnitario,
                    total: Math.round(quantidade * precoUnitario * 100) / 100,
                };
            });
            const recomputedTotal = Math.round(items.reduce((sum, it) => sum + it.total, 0) * 100) / 100;
            return {
                ...n,
                company_id,
                numero: Number(n.numero) || 1,
                items,
                total: recomputedTotal,
            };
        })
            .sort((a, b) => b.numero - a.numero),
        noteSequence: Math.max(Number(db.noteSequence) || 0, ...(Array.isArray(db.notas) ? db.notas.map((n) => Number(n.numero) || 0) : [0])),
        expenses: (Array.isArray(db.expenses) ? db.expenses : []).map((exp) => ({
            ...exp,
            month: String(exp.month || ''),
            values: exp.values || {},
        })),
        serviceProviders: (Array.isArray(db.serviceProviders) ? db.serviceProviders : [])
            .filter((p) => !p.company_id || p.company_id === company_id)
            .map((p) => ({
            ...p,
            company_id,
            amount: Number(p.amount) || 0,
            paymentModality: (0, financeEngine_1.migratePaymentModality)(String(p.paymentModality || 'pix')),
        })),
        payrollEmployees: (Array.isArray(db.payrollEmployees) ? db.payrollEmployees : [])
            .filter((e) => !e.company_id || e.company_id === company_id)
            .map((e) => ({
            ...e,
            company_id,
            salary: Number(e.salary) || 0,
        })),
        investments: (Array.isArray(db.investments) ? db.investments : [])
            .filter((inv) => !inv.company_id || inv.company_id === company_id)
            .map((inv) => ({
            ...inv,
            company_id,
            investedAmount: Number(inv.investedAmount) || 0,
            currentAmount: Number(inv.currentAmount) || 0,
        })),
        employees: mergedEmployees,
    };
}
/**
 * Load database strictly isolated for the given tenant `company_id`
 */
function loadEnterpriseDatabase(company_id = 'tenant_qualifacas') {
    try {
        for (const oldKey of LEGACY_DEMO_KEYS) {
            window.localStorage.removeItem(oldKey);
        }
        const tenantKey = getTenantDbStorageKey(company_id);
        const raw = window.localStorage.getItem(tenantKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.orders)) {
                return normalizeDb(parsed, company_id);
            }
        }
        // One-time migration for Qualifacas if legacy production key exists
        if (company_id === 'tenant_qualifacas') {
            const legacyRaw = window.localStorage.getItem(LEGACY_SINGLE_PROD_KEY);
            if (legacyRaw) {
                const legacyParsed = JSON.parse(legacyRaw);
                if (legacyParsed && Array.isArray(legacyParsed.orders)) {
                    const migrated = normalizeDb(legacyParsed, company_id);
                    saveEnterpriseDatabase(migrated);
                    return migrated;
                }
            }
        }
    }
    catch {
        // Fallback to empty isolated tenant database
    }
    const emptyDb = normalizeDb((0, seedOrders_1.createEnterpriseSeedDatabase)(company_id), company_id);
    saveEnterpriseDatabase(emptyDb);
    return emptyDb;
}
/**
 * Update ONLY the local browser cache (never triggers HTTP PUT or SSE broadcast).
 */
function saveEnterpriseDatabaseLocalOnly(db) {
    const company_id = db.company_id || 'tenant_qualifacas';
    const normalized = normalizeDb(db, company_id);
    const tenantKey = getTenantDbStorageKey(company_id);
    try {
        window.localStorage.setItem(tenantKey, JSON.stringify(normalized));
    }
    catch {
        // ignore quota issues
    }
    return normalized;
}
/**
 * Save database strictly isolated under `facasflow_tenant_db_${db.company_id}`
 */
function saveEnterpriseDatabase(db) {
    const company_id = db.company_id || 'tenant_qualifacas';
    const normalized = saveEnterpriseDatabaseLocalOnly(db);
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
        const active = getActiveSession();
        fetch(`/api/orders?company_id=${encodeURIComponent(company_id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-FacasFlow-Role': active?.role || 'admin',
                'X-FacasFlow-Email': active?.email || '',
                'X-FacasFlow-Client-Id': realtimeEngine_1.CLIENT_INSTANCE_ID,
            },
            body: JSON.stringify(normalized),
        }).catch(() => { });
    }
    return normalized;
}
/**
 * Atomic single-card stage move endpoint (mirrors Postgres RPC mover_faca).
 */
async function moveOrderStageOnServer(params) {
    if (typeof window === 'undefined' || !window.location.protocol.startsWith('http')) {
        return null;
    }
    const active = getActiveSession();
    const res = await fetch(`/api/orders/move?company_id=${encodeURIComponent(params.company_id)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-FacasFlow-Role': active?.role || 'admin',
            'X-FacasFlow-Email': active?.email || '',
            'X-FacasFlow-Client-Id': realtimeEngine_1.CLIENT_INSTANCE_ID,
        },
        body: JSON.stringify({
            company_id: params.company_id,
            orderId: params.orderId,
            stage: params.targetStage,
            stageUpdatedAt: params.stageUpdatedAt,
        }),
    });
    if (!res.ok) {
        throw new Error(`Move stage failed with HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.order || null;
}
function getNextOrderId(db) {
    let max = 0;
    for (const o of db.orders) {
        const num = parseInt(o.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `OS-${String(max + 1).padStart(3, '0')}`;
}
function getNextDeliveryId(db) {
    let max = 0;
    for (const d of db.deliveries) {
        const num = parseInt(d.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `ENT-${String(max + 1).padStart(3, '0')}`;
}
function getNextReturnId(db) {
    let max = 0;
    for (const r of db.returns) {
        const num = parseInt(r.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `RET-${String(max + 1).padStart(3, '0')}`;
}
function getNextStockId(db) {
    let max = 0;
    for (const s of db.stock || []) {
        const num = parseInt(s.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `EST-${String(max + 1).padStart(3, '0')}`;
}
function getNextProviderId(db) {
    let max = 0;
    for (const p of db.serviceProviders || []) {
        const num = parseInt(p.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `PST-${String(max + 1).padStart(3, '0')}`;
}
function getNextPayrollEmployeeId(db) {
    let max = 0;
    for (const e of db.payrollEmployees || []) {
        const num = parseInt(e.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `FUN-${String(max + 1).padStart(3, '0')}`;
}
function getNextInvestmentId(db) {
    let max = 0;
    for (const i of db.investments || []) {
        const num = parseInt(i.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num > max)
            max = num;
    }
    return `INV-${String(max + 1).padStart(3, '0')}`;
}
function getNextNoteNumber(db) {
    let max = Number(db.noteSequence) || 0;
    for (const n of db.notas || []) {
        if (Number(n.numero) > max)
            max = Number(n.numero);
    }
    return max + 1;
}

  },
  { dir: "./services" }
);

__moduleFactories["./services/realtimeEngine"] = Object.assign(
  function(module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_INSTANCE_ID = void 0;
exports.getSupabaseConfig = getSupabaseConfig;
exports.saveSupabaseConfig = saveSupabaseConfig;
exports.getActiveRealtimeChannelCount = getActiveRealtimeChannelCount;
exports.isSupabaseCloudActive = isSupabaseCloudActive;
exports.moveOrderStageViaRpc = moveOrderStageViaRpc;
exports.publishRealtimeUpdate = publishRealtimeUpdate;
exports.subscribeToCompanyRealtime = subscribeToCompanyRealtime;
exports.broadcastEmployeeRegistryUpdate = broadcastEmployeeRegistryUpdate;
const SUPABASE_CONFIG_KEY = 'facasflow_supabase_config_v1';
exports.CLIENT_INSTANCE_ID = `client_${Math.random().toString(36).slice(2, 10)}`;
function getSupabaseConfig() {
    try {
        const raw = window.localStorage.getItem(SUPABASE_CONFIG_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.url === 'string' && typeof parsed.anonKey === 'string') {
                return parsed;
            }
        }
    }
    catch {
        // ignore
    }
    return { url: '', anonKey: '', enabled: false };
}
function saveSupabaseConfig(config) {
    try {
        window.localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    }
    catch {
        // ignore
    }
}
let activeSupabaseChannel = null;
let activeSupabaseClient = null;
let activeBroadcastChannel = null;
let activeSubscriptionCount = 0;
function getActiveRealtimeChannelCount() {
    return activeSubscriptionCount;
}
function isSupabaseCloudActive() {
    return Boolean(activeSupabaseClient && activeSupabaseChannel);
}
/**
 * Call Postgres RPC mover_faca(p_id, p_etapa, p_stage_updated_at) when Supabase is connected.
 */
async function moveOrderStageViaRpc(orderId, targetStage, stageUpdatedAt) {
    if (!activeSupabaseClient)
        return null;
    const { data, error } = await activeSupabaseClient.rpc('mover_faca', {
        p_id: orderId,
        p_etapa: targetStage,
        p_stage_updated_at: stageUpdatedAt,
    });
    if (error) {
        throw error;
    }
    return data || null;
}
/**
 * Publish a real-time update across BroadcastChannel, localStorage event, and Supabase Broadcast.
 * Does NOT write to REST API.
 */
function publishRealtimeUpdate(params) {
    const event = {
        eventId: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        senderInstanceId: exports.CLIENT_INSTANCE_ID,
        company_id: params.company_id,
        section: params.section,
        actionLabel: params.actionLabel,
        actorName: params.actorName,
        actorRole: params.actorRole,
        timestamp: new Date().toISOString(),
        order: params.order,
        db: params.db,
    };
    // 1. Native BroadcastChannel (Instant cross-tab sync)
    try {
        if (activeBroadcastChannel) {
            activeBroadcastChannel.postMessage(event);
        }
        else if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel(`facasflow_rt_${params.company_id}`);
            ch.postMessage(event);
            ch.close();
        }
    }
    catch {
        // ignore
    }
    // 2. LocalStorage Realtime Event key (triggers 'storage' event in other tabs only)
    try {
        window.localStorage.setItem(`facasflow_rt_event_${params.company_id}`, JSON.stringify(event));
    }
    catch {
        // ignore
    }
    // 3. Supabase Broadcast (skip full-blob upsert for single-card moves)
    try {
        if (activeSupabaseChannel) {
            activeSupabaseChannel.send({
                type: 'broadcast',
                event: 'facasflow_sync',
                payload: event,
            });
        }
        if (activeSupabaseClient && params.db && !params.order) {
            activeSupabaseClient
                .from('facasflow_tenant_state')
                .upsert({
                company_id: params.company_id,
                db_payload: params.db,
                updated_at: event.timestamp,
                last_action: params.actionLabel,
                last_actor: params.actorName,
            }, { onConflict: 'company_id' })
                .then(() => { })
                .catch(() => { });
        }
    }
    catch {
        // ignore
    }
}
/**
 * Subscribe to real-time updates for a specific `company_id`.
 * Strictly read-only listener: updates local UI state only, never writes back to DB.
 */
function subscribeToCompanyRealtime(company_id, onRemoteUpdate, onConnectionStatusChange) {
    let isDisposed = false;
    const seenEvents = new Set();
    let localBroadcast = null;
    let localSupabaseClient = null;
    let localSupabaseChannel = null;
    activeSubscriptionCount += 1;
    const handleIncoming = (rawEvent) => {
        if (isDisposed || !rawEvent)
            return;
        if (rawEvent.senderInstanceId && rawEvent.senderInstanceId === exports.CLIENT_INSTANCE_ID) {
            return;
        }
        if (rawEvent.company_id !== company_id)
            return;
        if (rawEvent.eventId) {
            if (seenEvents.has(rawEvent.eventId))
                return;
            seenEvents.add(rawEvent.eventId);
            if (seenEvents.size > 200) {
                const first = seenEvents.values().next().value;
                if (first)
                    seenEvents.delete(first);
            }
        }
        if (!rawEvent.order && (!rawEvent.db || !Array.isArray(rawEvent.db.orders))) {
            return;
        }
        onRemoteUpdate(rawEvent);
    };
    // 1. BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            if (activeBroadcastChannel) {
                activeBroadcastChannel.close();
            }
            localBroadcast = new BroadcastChannel(`facasflow_rt_${company_id}`);
            localBroadcast.onmessage = (msg) => {
                handleIncoming(msg.data);
            };
            activeBroadcastChannel = localBroadcast;
            onConnectionStatusChange?.('connected');
        }
        catch {
            // ignore
        }
    }
    // 2. StorageEvent (fires only in OTHER tabs)
    const storageHandler = (e) => {
        if (!e.newValue)
            return;
        if (e.key === `facasflow_rt_event_${company_id}`) {
            try {
                handleIncoming(JSON.parse(e.newValue));
            }
            catch {
                // ignore
            }
        }
    };
    window.addEventListener('storage', storageHandler);
    // 3. Server-Sent Events (SSE) for localhost server.cjs
    let sseSource = null;
    if (typeof EventSource !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1')) {
        try {
            sseSource = new EventSource(`/api/realtime?company_id=${encodeURIComponent(company_id)}`);
            sseSource.onmessage = (evt) => {
                try {
                    handleIncoming(JSON.parse(evt.data));
                }
                catch {
                    // ignore
                }
            };
        }
        catch {
            // ignore
        }
    }
    // 4. Supabase Realtime Channel (normalized orders changes + broadcast)
    const supaCfg = getSupabaseConfig();
    if (supaCfg.enabled && supaCfg.url.trim() && supaCfg.anonKey.trim()) {
        const dynamicImport = new Function('url', 'return import(url)');
        dynamicImport('https://esm.sh/@supabase/supabase-js@2.47.10')
            .then((mod) => {
            if (isDisposed)
                return;
            const createClient = mod.createClient;
            const client = createClient(supaCfg.url.trim(), supaCfg.anonKey.trim(), {
                realtime: { params: { eventsPerSecond: 20 } },
            });
            localSupabaseClient = client;
            activeSupabaseClient = client;
            if (activeSupabaseChannel) {
                try {
                    client.removeChannel(activeSupabaseChannel);
                }
                catch {
                    // ignore
                }
                activeSupabaseChannel = null;
            }
            const channel = client
                .channel(`facasflow_company_${company_id}`, {
                config: { broadcast: { self: false } },
            })
                .on('broadcast', { event: 'facasflow_sync' }, (payload) => {
                if (payload?.payload) {
                    handleIncoming(payload.payload);
                }
            })
                .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `company_id=eq.${company_id}`,
            }, (change) => {
                const row = change?.new;
                if (row && row.id && row.stage) {
                    handleIncoming({
                        eventId: `pg_order_${row.id}_v${row.version || row.updated_at || Date.now()}`,
                        company_id,
                        section: 'esteira',
                        actionLabel: '',
                        actorName: '',
                        actorRole: 'operador',
                        timestamp: row.updated_at || new Date().toISOString(),
                        order: {
                            id: row.id,
                            company_id: row.company_id,
                            companyId: row.client_company_id || '',
                            companyName: row.company_name || '',
                            companyPhone: row.company_phone || '',
                            toolDescription: row.tool_description || '',
                            amount: Number(row.amount) || 0,
                            paymentModality: row.payment_modality,
                            paymentStatus: row.payment_status,
                            stage: row.stage,
                            stageUpdatedAt: row.stage_updated_at || '',
                            stageHistory: [],
                            version: Number(row.version) || 1,
                            updatedAt: row.updated_at || new Date().toISOString(),
                            createdAt: row.created_at || '',
                            dueDate: row.due_date || '',
                            paidAt: row.paid_at || undefined,
                        },
                    });
                }
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED' && !isDisposed) {
                    onConnectionStatusChange?.('supabase_live');
                }
            });
            if (isDisposed) {
                try {
                    client.removeChannel(channel);
                }
                catch {
                    // ignore
                }
                return;
            }
            localSupabaseChannel = channel;
            activeSupabaseChannel = channel;
        })
            .catch(() => {
            // Fallback to local channels
        });
    }
    return () => {
        isDisposed = true;
        activeSubscriptionCount = Math.max(0, activeSubscriptionCount - 1);
        window.removeEventListener('storage', storageHandler);
        if (sseSource) {
            sseSource.close();
            sseSource = null;
        }
        if (localBroadcast) {
            localBroadcast.close();
            if (activeBroadcastChannel === localBroadcast) {
                activeBroadcastChannel = null;
            }
            localBroadcast = null;
        }
        if (localSupabaseClient && localSupabaseChannel) {
            try {
                localSupabaseClient.removeChannel(localSupabaseChannel);
            }
            catch {
                // ignore
            }
            if (activeSupabaseChannel === localSupabaseChannel) {
                activeSupabaseChannel = null;
            }
            localSupabaseChannel = null;
        }
    };
}
function broadcastEmployeeRegistryUpdate(accounts) {
    try {
        window.localStorage.setItem('facasflow_saas_tenants_v1', JSON.stringify(accounts));
    }
    catch {
        // ignore
    }
}

  },
  { dir: "./services" }
);

__moduleFactories["./components/AuthLoginScreen"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLoginScreen = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const storageAdapter_1 = require("../services/storageAdapter");
const AuthLoginScreen = ({ onAuthenticated, }) => {
    const [mode, setMode] = (0, react_1.useState)('login');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    // Register fields
    const [companyName, setCompanyName] = (0, react_1.useState)('');
    const [ownerName, setOwnerName] = (0, react_1.useState)('');
    const [regEmail, setRegEmail] = (0, react_1.useState)('');
    const [regPassword, setRegPassword] = (0, react_1.useState)('');
    const [errorMsg, setErrorMsg] = (0, react_1.useState)(null);
    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setErrorMsg(null);
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();
        const res = (0, storageAdapter_1.authenticateTenant)(normalizedEmail, normalizedPassword);
        if (res.error || !res.session) {
            setErrorMsg(res.error || 'Falha na autenticação.');
            return;
        }
        onAuthenticated(res.session);
    };
    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        setErrorMsg(null);
        const normalizedRegEmail = regEmail.trim().toLowerCase();
        const normalizedRegPassword = regPassword.trim();
        const res = (0, storageAdapter_1.registerNewTenant)({
            companyName,
            ownerName,
            email: normalizedRegEmail,
            password: normalizedRegPassword,
        });
        if (res.error || !res.session) {
            setErrorMsg(res.error || 'Não foi possível criar a conta.');
            return;
        }
        onAuthenticated(res.session);
    };
    return (react_1.default.createElement("div", { className: "min-h-screen text-slate-900 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden selection:bg-indigo-500 selection:text-white" },
        react_1.default.createElement("div", { className: "w-full max-w-md rounded-[32px] liquid-glass p-7 sm:p-9 shadow-2xl relative z-10" },
            react_1.default.createElement("div", { className: "flex items-center justify-center gap-3 mb-7" },
                react_1.default.createElement("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md shadow-indigo-500/25 flex items-center justify-center" },
                    react_1.default.createElement("div", { className: "w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center" },
                        react_1.default.createElement(lucide_react_1.Layers, { className: "w-5 h-5 text-indigo-600 stroke-[2.2]" }))),
                react_1.default.createElement("h1", { className: "text-2xl font-extrabold tracking-tight text-slate-900 leading-none frosted-text-depth" },
                    "Facas",
                    react_1.default.createElement("span", { className: "text-indigo-600" }, "Flow"))),
            react_1.default.createElement("div", { className: "grid grid-cols-2 gap-2 p-1.5 rounded-full liquid-glass-subtle mb-6" },
                react_1.default.createElement("button", { type: "button", onClick: () => {
                        setMode('login');
                        setErrorMsg(null);
                    }, className: `flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${mode === 'login'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'text-slate-700 hover:text-indigo-700'}` },
                    react_1.default.createElement(lucide_react_1.KeyRound, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null, "Entrar")),
                react_1.default.createElement("button", { type: "button", onClick: () => {
                        setMode('register');
                        setErrorMsg(null);
                    }, className: `flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${mode === 'register'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'text-slate-700 hover:text-indigo-700'}` },
                    react_1.default.createElement(lucide_react_1.UserPlus, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null, "Criar Conta"))),
            errorMsg && (react_1.default.createElement("div", { className: "mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300/70 text-rose-800 text-xs font-semibold flex items-center gap-2.5" },
                react_1.default.createElement(lucide_react_1.AlertCircle, { className: "w-4 h-4 text-rose-600 shrink-0" }),
                react_1.default.createElement("span", null, errorMsg))),
            mode === 'login' ? (react_1.default.createElement("form", { onSubmit: handleLoginSubmit, className: "space-y-4" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1.5" }, "E-mail"),
                    react_1.default.createElement("div", { className: "relative" },
                        react_1.default.createElement(lucide_react_1.Mail, { className: "w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" }),
                        react_1.default.createElement("input", { type: "email", inputMode: "email", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Digite seu e-mail", className: "liquid-glass-pill w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" }))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1.5" }, "Senha"),
                    react_1.default.createElement("div", { className: "relative" },
                        react_1.default.createElement(lucide_react_1.Lock, { className: "w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" }),
                        react_1.default.createElement("input", { type: "password", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022", className: "liquid-glass-pill w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" }))),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3.5 px-5 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2 active:scale-95" },
                    react_1.default.createElement("span", null, "Entrar no Painel"),
                    react_1.default.createElement(lucide_react_1.ArrowRight, { className: "w-4 h-4" })))) : (react_1.default.createElement("form", { onSubmit: handleRegisterSubmit, className: "space-y-3.5" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Nome da Empresa *"),
                    react_1.default.createElement("input", { type: "text", required: true, value: companyName, onChange: (e) => setCompanyName(e.target.value), placeholder: "Nome da sua facaria", className: "liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Respons\u00E1vel"),
                    react_1.default.createElement("input", { type: "text", value: ownerName, onChange: (e) => setOwnerName(e.target.value), placeholder: "Seu nome", className: "liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "E-mail *"),
                    react_1.default.createElement("input", { type: "email", inputMode: "email", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "email", required: true, value: regEmail, onChange: (e) => setRegEmail(e.target.value), placeholder: "Digite seu e-mail", className: "liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Senha *"),
                    react_1.default.createElement("input", { type: "password", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "new-password", required: true, value: regPassword, onChange: (e) => setRegPassword(e.target.value), placeholder: "Crie uma senha", className: "liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" })),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3.5 px-5 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2 active:scale-95" },
                    react_1.default.createElement(lucide_react_1.UserPlus, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null, "Criar Conta & Entrar")))))));
};
exports.AuthLoginScreen = AuthLoginScreen;

  },
  { dir: "./components" }
);

__moduleFactories["./components/HeaderBar"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderBar = exports.LiquidSidebar = exports.NAV_SECTIONS = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
exports.NAV_SECTIONS = [
    {
        id: 'bento_home',
        label: 'Visão Geral',
        shortLabel: 'Visão Geral',
        group: 'primary',
        roles: ['admin'],
        icon: lucide_react_1.LayoutGrid,
    },
    {
        id: 'esteira',
        label: 'Esteira de Produção',
        shortLabel: 'Esteira',
        group: 'operacao',
        roles: ['admin', 'operador'],
        icon: lucide_react_1.Kanban,
    },
    {
        id: 'empresas',
        label: 'Cadastro de Empresas',
        shortLabel: 'Empresas',
        group: 'operacao',
        roles: ['admin'],
        icon: lucide_react_1.Building2,
    },
    {
        id: 'entregas',
        label: 'Entregas & Logística',
        shortLabel: 'Entregas',
        group: 'operacao',
        roles: ['admin', 'operador'],
        icon: lucide_react_1.Truck,
    },
    {
        id: 'retornos',
        label: 'Retornos & Ajustes',
        shortLabel: 'Retornos',
        group: 'operacao',
        roles: ['admin', 'operador'],
        icon: lucide_react_1.Wrench,
    },
    {
        id: 'estoque',
        label: 'Estoque',
        shortLabel: 'Estoque',
        group: 'operacao',
        roles: ['admin', 'operador'],
        icon: lucide_react_1.Package,
    },
    {
        id: 'notas',
        label: 'Notas',
        shortLabel: 'Notas',
        group: 'operacao',
        roles: ['admin', 'operador'],
        icon: lucide_react_1.FileText,
    },
    {
        id: 'financeiro',
        label: 'Finanças 30/60d',
        shortLabel: 'Finanças',
        group: 'gestao',
        roles: ['admin'],
        icon: lucide_react_1.PieChart,
    },
    {
        id: 'equipe',
        label: 'Gestão de Equipe',
        shortLabel: 'Equipe',
        group: 'gestao',
        roles: ['admin'],
        icon: lucide_react_1.Users,
    },
];
function getBadgeCount(id, counts) {
    if (id === 'empresas')
        return counts.companies;
    if (id === 'esteira')
        return counts.inProduction;
    if (id === 'financeiro' && counts.overdue > 0)
        return counts.overdue;
    if (id === 'entregas')
        return counts.deliveries;
    if (id === 'retornos' && counts.openReturns > 0)
        return counts.openReturns;
    if (id === 'estoque')
        return counts.stock;
    if (id === 'notas')
        return counts.notas;
    if (id === 'equipe')
        return counts.employees;
    return undefined;
}
const LiquidSidebar = ({ activeSection, onSelectSection, tenantName, userRole, userName, onLogout, counts, }) => {
    const visibleSections = exports.NAV_SECTIONS.filter((item) => item.roles.includes(userRole));
    const primaryItem = visibleSections.find((s) => s.group === 'primary');
    const operacaoItems = visibleSections.filter((s) => s.group === 'operacao');
    const gestaoItems = visibleSections.filter((s) => s.group === 'gestao');
    const renderNavItem = (item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const badge = getBadgeCount(item.id, counts);
        return (react_1.default.createElement("button", { key: item.id, type: "button", onClick: () => onSelectSection(item.id), className: `w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${isActive
                ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-white/40'
                : 'text-slate-800 hover:text-indigo-700 hover:bg-white/45'}` },
            react_1.default.createElement("span", { className: "flex items-center gap-3 min-w-0" },
                react_1.default.createElement(Icon, { className: `w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}` }),
                react_1.default.createElement("span", { className: "truncate" }, item.shortLabel)),
            badge !== undefined && (react_1.default.createElement("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${isActive
                    ? 'bg-white/25 text-white'
                    : item.id === 'financeiro'
                        ? 'bg-rose-500/20 text-rose-700 border border-rose-300/60'
                        : 'bg-white/60 text-slate-700 border border-white/70'}` }, badge))));
    };
    return (react_1.default.createElement("aside", { className: "w-[248px] shrink-0 liquid-glass rounded-[28px] p-5 flex-col justify-between hidden lg:flex sticky top-6 self-start min-h-[calc(100vh-3.5rem)]", "data-purpose": "sidebar" },
        react_1.default.createElement("div", { className: "space-y-6" },
            react_1.default.createElement("button", { type: "button", onClick: () => onSelectSection(userRole === 'operador' ? 'esteira' : 'bento_home'), className: "flex items-center gap-3 px-2 py-1.5 cursor-pointer group text-left", "data-purpose": "brand-header" },
                react_1.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md shadow-indigo-500/25 flex items-center justify-center group-hover:scale-105 transition" },
                    react_1.default.createElement("div", { className: "w-full h-full bg-white/90 backdrop-blur-md rounded-[10px] flex items-center justify-center" },
                        react_1.default.createElement(lucide_react_1.Layers, { className: "w-5 h-5 text-indigo-600 stroke-[2.2]" }))),
                react_1.default.createElement("div", { className: "min-w-0" },
                    react_1.default.createElement("div", { className: "flex items-center" },
                        react_1.default.createElement("span", { className: "font-extrabold text-lg tracking-tight text-slate-900 frosted-text-depth" }, "Facas"),
                        react_1.default.createElement("span", { className: "font-black text-lg text-indigo-600 ml-0.5 drop-shadow-[0_1px_8px_rgba(99,102,241,0.35)]" }, "Flow")),
                    react_1.default.createElement("p", { className: "text-[10px] font-bold text-slate-600 truncate" }, tenantName))),
            primaryItem && react_1.default.createElement("div", null, renderNavItem(primaryItem)),
            operacaoItems.length > 0 && (react_1.default.createElement("div", { className: "space-y-1.5" },
                react_1.default.createElement("div", { className: "px-3 text-[11px] font-bold tracking-wider text-slate-600/90 uppercase frosted-text-depth" }, "Opera\u00E7\u00E3o"),
                react_1.default.createElement("nav", { className: "space-y-0.5" }, operacaoItems.map(renderNavItem)))),
            gestaoItems.length > 0 && (react_1.default.createElement("div", { className: "space-y-1.5" },
                react_1.default.createElement("div", { className: "px-3 text-[11px] font-bold tracking-wider text-slate-600/90 uppercase frosted-text-depth" }, "Gest\u00E3o & Finan\u00E7as"),
                react_1.default.createElement("nav", { className: "space-y-0.5" }, gestaoItems.map(renderNavItem))))),
        react_1.default.createElement("div", { className: "pt-4 border-t border-white/60 flex items-center justify-between gap-2", "data-purpose": "user-profile" },
            react_1.default.createElement("div", { className: "flex items-center gap-2.5 min-w-0" },
                react_1.default.createElement("div", { className: "relative shrink-0" },
                    react_1.default.createElement("div", { className: "w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-white/90 shadow-md" }, userName
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()),
                    react_1.default.createElement("span", { className: "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" })),
                react_1.default.createElement("div", { className: "text-left leading-tight min-w-0" },
                    react_1.default.createElement("p", { className: "text-xs font-bold text-slate-900 frosted-text-depth truncate" }, userName),
                    react_1.default.createElement("p", { className: "text-[11px] text-slate-600 font-semibold truncate" }, userRole === 'operador' ? 'Produção' : 'Administrador'))),
            react_1.default.createElement("button", { type: "button", onClick: onLogout, className: "text-slate-600 hover:text-rose-600 p-2 rounded-full hover:bg-white/50 transition cursor-pointer shrink-0", title: "Encerrar sess\u00E3o" },
                react_1.default.createElement(lucide_react_1.LogOut, { className: "w-4 h-4 stroke-[2.2]" })))));
};
exports.LiquidSidebar = LiquidSidebar;
const HeaderBar = ({ activeSection, onSelectSection, searchQuery, onSearchChange, onOpenNewOrder, userRole, userName, realtimeStatus, onLogout, counts, }) => {
    const visibleSections = exports.NAV_SECTIONS.filter((item) => item.roles.includes(userRole));
    return (react_1.default.createElement("header", { className: "flex flex-col gap-3", "data-purpose": "top-navigation-bar" },
        react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
            react_1.default.createElement("div", { className: "flex items-center gap-3 flex-1 min-w-[220px] max-w-xl" },
                react_1.default.createElement("div", { className: "lg:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md flex items-center justify-center shrink-0" },
                    react_1.default.createElement("div", { className: "w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center" },
                        react_1.default.createElement(lucide_react_1.Layers, { className: "w-4 h-4 text-indigo-600" }))),
                react_1.default.createElement("div", { className: "relative flex-1" },
                    react_1.default.createElement("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500" },
                        react_1.default.createElement(lucide_react_1.Search, { className: "w-4 h-4 stroke-[2.2]" })),
                    react_1.default.createElement("input", { type: "text", value: searchQuery, onChange: (e) => onSearchChange(e.target.value), placeholder: "Buscar OS, empresa, CNPJ ou faca...", className: "liquid-glass-pill w-full pl-11 pr-10 py-2.5 rounded-full text-xs md:text-sm text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" }),
                    searchQuery && (react_1.default.createElement("button", { type: "button", onClick: () => onSearchChange(''), className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer" }, "\u2715")))),
            react_1.default.createElement("div", { className: "flex items-center gap-2.5 shrink-0" },
                userRole === 'admin' && (react_1.default.createElement("button", { type: "button", onClick: onOpenNewOrder, className: "bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/40 transition-all duration-200 active:scale-95 cursor-pointer" },
                    react_1.default.createElement("span", null, "Nova OS"))),
                react_1.default.createElement("button", { type: "button", onClick: onLogout, className: "lg:hidden liquid-glass-pill rounded-full px-3.5 py-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-rose-600 cursor-pointer", title: "Sair" },
                    react_1.default.createElement(lucide_react_1.LogOut, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null, "Sair")))),
        react_1.default.createElement("div", { className: "flex lg:hidden flex-wrap items-center gap-2" }, visibleSections.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const badge = getBadgeCount(item.id, counts);
            return (react_1.default.createElement("button", { key: item.id, type: "button", onClick: () => onSelectSection(item.id), className: `flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                    : 'liquid-glass-pill text-slate-800'}` },
                react_1.default.createElement(Icon, { className: "w-3.5 h-3.5 shrink-0" }),
                react_1.default.createElement("span", null, item.shortLabel),
                badge !== undefined && (react_1.default.createElement("span", { className: `px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-white/70 text-slate-700'}` }, badge))));
        }))));
};
exports.HeaderBar = HeaderBar;

  },
  { dir: "./components" }
);

__moduleFactories["./components/BentoOverviewSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BentoOverviewSection = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const BentoOverviewSection = ({ companies, orders, deliveries, returns, stock, financials, onNavigate, onOpenNewOrder, onSelectCompany, }) => {
    const readyCount = orders.filter((o) => o.stage === 'faca_pronta').length;
    const activeProductionCount = orders.length - readyCount;
    const openReturnsCount = returns.filter((r) => r.status !== 'liberado').length;
    const madeirasStock = stock.filter((s) => s.category === 'madeiras');
    const laminasStock = stock.filter((s) => s.category === 'laminas');
    const lowMadeiras = madeirasStock.filter((s) => s.quantity <= s.minStock);
    const lowLaminas = laminasStock.filter((s) => s.quantity <= s.minStock);
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("section", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4", "data-purpose": "kpi-metrics-row" },
            react_1.default.createElement("div", { onClick: () => onNavigate('financeiro'), className: "liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex items-center justify-between gap-1" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 frosted-text-depth" }, "Volume Total"),
                        react_1.default.createElement("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 border border-emerald-300/60 backdrop-blur-md" },
                            react_1.default.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
                            "Live")),
                    react_1.default.createElement("div", { className: "text-xl font-black text-slate-900 mt-2 tracking-tight" }, (0, financeEngine_1.formatBRL)(financials.totalVolume)),
                    react_1.default.createElement("div", { className: "text-[11px] font-bold text-emerald-700 mt-1" },
                        orders.length,
                        " OS registradas")),
                react_1.default.createElement("div", { className: "mt-3 h-12 w-full relative" },
                    react_1.default.createElement("svg", { className: "w-full h-full overflow-visible drop-shadow-md", preserveAspectRatio: "none", viewBox: "0 0 180 50" },
                        react_1.default.createElement("defs", null,
                            react_1.default.createElement("linearGradient", { id: "revGrad", x1: "0%", x2: "100%", y1: "0%", y2: "0%" },
                                react_1.default.createElement("stop", { offset: "0%", stopColor: "#818cf8" }),
                                react_1.default.createElement("stop", { offset: "50%", stopColor: "#38bdf8" }),
                                react_1.default.createElement("stop", { offset: "100%", stopColor: "#06b6d4" }))),
                        react_1.default.createElement("path", { d: "M 0,35 Q 25,10 50,28 T 100,20 T 140,32 T 180,15", fill: "none", stroke: "url(#revGrad)", strokeDasharray: "3,3", strokeWidth: "2.5" }),
                        react_1.default.createElement("path", { d: "M 0,42 Q 30,25 60,35 T 115,15 T 150,28 T 180,22", fill: "none", opacity: "0.6", stroke: "url(#revGrad)", strokeDasharray: "2,3", strokeWidth: "1.8" })))),
            react_1.default.createElement("div", { onClick: () => onNavigate('financeiro'), className: "liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 frosted-text-depth" }, "A Receber 30/60d"),
                    react_1.default.createElement("div", { className: "text-xl font-black text-slate-900 mt-2 tracking-tight" }, (0, financeEngine_1.formatBRL)(financials.receivable30d)),
                    react_1.default.createElement("div", { className: "text-[11px] font-bold text-emerald-700 mt-1" },
                        financials.receivableCount,
                        " t\u00EDtulo(s) ativos")),
                react_1.default.createElement("div", { className: "mt-3 h-12 -mx-4 -mb-4 overflow-hidden" },
                    react_1.default.createElement("svg", { className: "w-full h-full", preserveAspectRatio: "none", viewBox: "0 0 160 50" },
                        react_1.default.createElement("defs", null,
                            react_1.default.createElement("linearGradient", { id: "mrrGrad", x1: "0%", x2: "0%", y1: "0%", y2: "100%" },
                                react_1.default.createElement("stop", { offset: "0%", stopColor: "#10b981", stopOpacity: "0.55" }),
                                react_1.default.createElement("stop", { offset: "100%", stopColor: "#34d399", stopOpacity: "0.05" }))),
                        react_1.default.createElement("path", { d: "M 0,45 Q 40,40 70,22 T 120,28 T 160,10 L 160,50 L 0,50 Z", fill: "url(#mrrGrad)" }),
                        react_1.default.createElement("path", { d: "M 0,45 Q 40,40 70,22 T 120,28 T 160,10", fill: "none", stroke: "#059669", strokeLinecap: "round", strokeWidth: "2.5" })))),
            react_1.default.createElement("div", { onClick: () => onNavigate('esteira'), className: "liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 frosted-text-depth" }, "Facas na Bancada"),
                    react_1.default.createElement("div", { className: "text-2xl font-black text-slate-900 mt-2 tracking-tight" }, activeProductionCount),
                    react_1.default.createElement("div", { className: "text-[11px] font-bold text-indigo-700 mt-1" }, "Em produ\u00E7\u00E3o ativa")),
                react_1.default.createElement("div", { className: "mt-3 h-12 flex items-center justify-center" },
                    react_1.default.createElement("svg", { className: "w-full h-10 drop-shadow-sm", viewBox: "0 0 160 40" },
                        react_1.default.createElement("g", { fill: "#6366f1", opacity: "0.8" }, [10, 28, 46, 64, 82, 100, 118, 136, 150].map((cx) => [8, 19, 30].map((cy) => (react_1.default.createElement("circle", { key: `${cx}-${cy}`, cx: cx, cy: cy, r: "2.2" })))))))),
            react_1.default.createElement("div", { onClick: () => onNavigate('entregas'), className: "liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 frosted-text-depth" }, "Prontas / Exped."),
                    react_1.default.createElement("div", { className: "text-2xl font-black text-emerald-700 mt-2 tracking-tight" }, readyCount),
                    react_1.default.createElement("div", { className: "text-[11px] font-bold text-slate-600 mt-1" },
                        deliveries.length,
                        " sa\u00EDda(s) log\u00EDsticas")),
                react_1.default.createElement("div", { className: "mt-3 h-12 -mx-4 -mb-4 overflow-hidden" },
                    react_1.default.createElement("svg", { className: "w-full h-full", preserveAspectRatio: "none", viewBox: "0 0 160 50" },
                        react_1.default.createElement("defs", null,
                            react_1.default.createElement("linearGradient", { id: "readyGrad", x1: "0%", x2: "0%", y1: "0%", y2: "100%" },
                                react_1.default.createElement("stop", { offset: "0%", stopColor: "#6366f1", stopOpacity: "0.45" }),
                                react_1.default.createElement("stop", { offset: "100%", stopColor: "#818cf8", stopOpacity: "0.05" }))),
                        react_1.default.createElement("path", { d: "M 0,42 Q 35,34 68,26 T 118,16 T 160,12 L 160,50 L 0,50 Z", fill: "url(#readyGrad)" }),
                        react_1.default.createElement("path", { d: "M 0,42 Q 35,34 68,26 T 118,16 T 160,12", fill: "none", stroke: "#4f46e5", strokeLinecap: "round", strokeWidth: "2.5" })))),
            react_1.default.createElement("div", { onClick: () => onNavigate('empresas'), className: "liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 frosted-text-depth" }, "Empresas Ativas"),
                    react_1.default.createElement("div", { className: "text-2xl font-black text-slate-900 mt-2 tracking-tight" }, companies.length),
                    react_1.default.createElement("div", { className: "text-[11px] font-bold text-indigo-700 mt-1" }, "Base CRM cadastrada")),
                react_1.default.createElement("div", { className: "mt-3 flex items-center gap-1.5" },
                    react_1.default.createElement("span", { className: "h-2 flex-1 rounded-full bg-indigo-500/75" }),
                    react_1.default.createElement("span", { className: "h-2 w-8 rounded-full bg-sky-400/75" }),
                    react_1.default.createElement("span", { className: "h-2 w-5 rounded-full bg-purple-400/75" }))),
            react_1.default.createElement("div", { onClick: () => onNavigate('financeiro'), className: "liquid-glass rounded-[26px] p-4 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 cursor-pointer" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 frosted-text-depth" }, "Alertas & Retornos"),
                    react_1.default.createElement("div", { className: "text-2xl font-black text-indigo-700 mt-2 tracking-tight" }, financials.overdueCount + openReturnsCount),
                    react_1.default.createElement("div", { className: "text-[11px] font-bold text-slate-600 mt-1" },
                        financials.overdueCount,
                        " vencido(s) \u2022 ",
                        openReturnsCount,
                        " ajuste(s)")),
                react_1.default.createElement("div", { className: "mt-3 flex items-center gap-1.5" },
                    react_1.default.createElement("span", { className: "px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60" }, (0, financeEngine_1.formatBRL)(financials.overdueTotal))))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-5" },
            react_1.default.createElement("div", { className: "md:col-span-5 liquid-glass rounded-[28px] p-6 flex flex-col justify-between relative overflow-hidden" },
                react_1.default.createElement("div", { className: "flex items-start justify-between gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60 backdrop-blur-md" },
                            react_1.default.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" }),
                            "Opera\u00E7\u00E3o em Tempo Real"),
                        react_1.default.createElement("h2", { className: "text-2xl font-extrabold tracking-tight text-slate-900 mt-3 leading-snug frosted-text-depth" }, "Controle Industrial"),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700 mt-1.5 max-w-sm leading-relaxed" }, "Rastreamento completo desde o arquivo CAD recebido at\u00E9 a sa\u00EDda log\u00EDstica e faturamento."))),
                react_1.default.createElement("div", { className: "grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/60" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-[11px] font-semibold text-slate-600 block" }, "Facas Ativas"),
                        react_1.default.createElement("span", { className: "text-3xl font-black text-slate-900 tracking-tight" }, activeProductionCount),
                        react_1.default.createElement("span", { className: "text-[10px] font-bold text-indigo-700 block mt-0.5" }, "Na bancada")),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-[11px] font-semibold text-slate-600 block" }, "Prontas"),
                        react_1.default.createElement("span", { className: "text-3xl font-black text-emerald-700 tracking-tight" }, readyCount),
                        react_1.default.createElement("span", { className: "text-[10px] font-bold text-slate-600 block mt-0.5" }, "Finalizadas")),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-[11px] font-semibold text-slate-600 block" }, "Empresas"),
                        react_1.default.createElement("span", { className: "text-3xl font-black text-indigo-700 tracking-tight" }, companies.length),
                        react_1.default.createElement("span", { className: "text-[10px] font-bold text-slate-600 block mt-0.5" }, "Cadastradas")))),
            react_1.default.createElement("div", { onClick: () => onNavigate('financeiro'), className: "md:col-span-4 liquid-glass rounded-[28px] p-6 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-xs font-bold text-slate-600 uppercase tracking-wider" }, "Pulso Financeiro"),
                        react_1.default.createElement("p", { className: "text-3xl font-black text-emerald-700 tracking-tight mt-1" }, (0, financeEngine_1.formatBRL)(financials.receivable30d)),
                        react_1.default.createElement("span", { className: "text-[11px] font-semibold text-slate-600" },
                            "A receber programado \u2022 ",
                            financials.receivableCount,
                            " t\u00EDtulos")),
                    react_1.default.createElement("div", { className: "w-10 h-10 rounded-full liquid-glass-pill group-hover:bg-indigo-600 text-slate-700 group-hover:text-indigo-700 flex items-center justify-center transition" },
                        react_1.default.createElement(lucide_react_1.ArrowUpRight, { className: "w-5 h-5" }))),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/60" },
                    react_1.default.createElement("div", { className: "p-3 rounded-2xl bg-indigo-500/10 border border-indigo-300/60 backdrop-blur-md" },
                        react_1.default.createElement("div", { className: "flex items-center gap-1.5 text-[11px] font-bold text-indigo-700" },
                            react_1.default.createElement(lucide_react_1.AlertCircle, { className: "w-3.5 h-3.5" }),
                            react_1.default.createElement("span", null, "Vencidos")),
                        react_1.default.createElement("p", { className: "text-lg font-black text-slate-900 mt-1" }, (0, financeEngine_1.formatBRL)(financials.overdueTotal)),
                        react_1.default.createElement("span", { className: "text-[10px] font-semibold text-slate-600" },
                            financials.overdueCount,
                            " t\u00EDtulo(s)")),
                    react_1.default.createElement("div", { className: "p-3 rounded-2xl bg-amber-500/10 border border-amber-300/60 backdrop-blur-md" },
                        react_1.default.createElement("div", { className: "flex items-center gap-1.5 text-[11px] font-bold text-amber-800" },
                            react_1.default.createElement(lucide_react_1.FileWarning, { className: "w-3.5 h-3.5" }),
                            react_1.default.createElement("span", null, "Entregues s/ Nota")),
                        react_1.default.createElement("p", { className: "text-lg font-black text-amber-800 mt-1" }, (0, financeEngine_1.formatBRL)(financials.unbilledTotal)),
                        react_1.default.createElement("span", { className: "text-[10px] font-semibold text-slate-600" },
                            financials.unbilledCount,
                            " s/ cobran\u00E7a")))),
            react_1.default.createElement("div", { onClick: () => onNavigate('financeiro'), className: "md:col-span-3 liquid-glass rounded-[28px] p-6 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Modalidades"),
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 mt-0.5" }, (0, financeEngine_1.formatBRL)(financials.totalVolume))),
                    react_1.default.createElement(lucide_react_1.CalendarClock, { className: "w-4 h-4 text-indigo-600" })),
                react_1.default.createElement("div", { className: "flex items-end justify-between gap-2 h-28 pt-4" }, financials.byModality.map((item) => {
                    const heightPct = Math.max(14, item.percentage);
                    return (react_1.default.createElement("div", { key: item.modality, className: "flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end" },
                        react_1.default.createElement("span", { className: "text-[10px] font-extrabold text-slate-800" },
                            item.percentage,
                            "%"),
                        react_1.default.createElement("div", { className: "w-full bg-white/45 border border-white/70 rounded-2xl h-full flex items-end p-0.5 shadow-inner" },
                            react_1.default.createElement("div", { style: {
                                    height: `${heightPct}%`,
                                    backgroundColor: item.colorHex,
                                }, className: "w-full rounded-xl transition-all duration-500 shadow-sm" })),
                        react_1.default.createElement("span", { className: "text-[9px] font-bold text-slate-700 truncate max-w-full" }, financeEngine_1.PAYMENT_MODALITY_META[item.modality]?.short.split(' ')[0])));
                })))),
        react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6" },
            react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-4" },
                react_1.default.createElement("div", { className: "flex items-center gap-2.5" },
                    react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700" },
                        react_1.default.createElement(lucide_react_1.Kanban, { className: "w-4 h-4" })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 frosted-text-depth" }, "Esteira F\u00EDsica da Oficina"),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-600" }, "Vis\u00E3o instant\u00E2nea de onde est\u00E1 cada faca neste momento"))),
                react_1.default.createElement("button", { type: "button", onClick: () => onNavigate('esteira'), className: "liquid-glass-pill inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-800 hover:text-indigo-700 cursor-pointer" },
                    react_1.default.createElement("span", null, "Abrir Esteira Completa"),
                    react_1.default.createElement(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" }))),
            react_1.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" }, financeEngine_1.PRODUCTION_STAGES.map((st) => {
                const count = orders.filter((o) => o.stage === st.id).length;
                return (react_1.default.createElement("div", { key: st.id, onClick: () => onNavigate('esteira'), className: "p-4 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer flex flex-col justify-between" },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-wider text-slate-600" },
                            "Etapa ",
                            st.step),
                        react_1.default.createElement("span", { className: `w-2.5 h-2.5 rounded-full ${st.dotClass}` })),
                    react_1.default.createElement("p", { className: "text-2xl font-black text-slate-900 mt-2" }, count),
                    react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 mt-1 block truncate" }, st.label)));
            }))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5" },
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex items-center justify-between mb-4" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement(lucide_react_1.Building2, { className: "w-4 h-4 text-indigo-600" }),
                            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Empresas & Ferramental")),
                        react_1.default.createElement("button", { type: "button", onClick: () => onNavigate('empresas'), className: "text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer" },
                            "Ver CRM ",
                            react_1.default.createElement(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" }))),
                    react_1.default.createElement("div", { className: "space-y-2.5" }, companies.length === 0 ? (react_1.default.createElement("div", { className: "p-6 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhuma empresa cadastrada.")) : (companies.slice(0, 4).map((comp) => {
                        const compOrders = orders.filter((o) => o.companyId === comp.id);
                        return (react_1.default.createElement("div", { key: comp.id, onClick: () => {
                                onSelectCompany(comp.id);
                                onNavigate('empresas');
                            }, className: "p-3 rounded-2xl liquid-glass-subtle hover:bg-white/45 flex items-center justify-between transition cursor-pointer" },
                            react_1.default.createElement("div", { className: "truncate pr-2" },
                                react_1.default.createElement("p", { className: "text-xs font-bold text-slate-900 truncate" }, comp.corporateName),
                                react_1.default.createElement("span", { className: "text-[11px] text-slate-600 font-mono" }, comp.cnpj)),
                            react_1.default.createElement("span", { className: "px-2.5 py-1 rounded-full bg-white/65 border border-white/80 text-slate-800 text-xs font-extrabold shrink-0" },
                                compOrders.length,
                                " facas")));
                    }))))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex items-center justify-between mb-4" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement(lucide_react_1.Truck, { className: "w-4 h-4 text-emerald-600" }),
                            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Log\u00EDstica de Sa\u00EDda")),
                        react_1.default.createElement("button", { type: "button", onClick: () => onNavigate('entregas'), className: "text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer" },
                            "Ver Sa\u00EDdas ",
                            react_1.default.createElement(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" }))),
                    react_1.default.createElement("div", { className: "space-y-2.5" }, deliveries.length === 0 ? (react_1.default.createElement("div", { className: "p-6 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhuma sa\u00EDda registrada.")) : (deliveries.slice(0, 3).map((del) => (react_1.default.createElement("div", { key: del.id, onClick: () => onNavigate('entregas'), className: "p-3 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer" },
                        react_1.default.createElement("div", { className: "flex items-center justify-between gap-2" },
                            react_1.default.createElement("span", { className: "text-xs font-bold text-slate-900 truncate" },
                                del.orderId,
                                " \u2022 ",
                                del.companyName),
                            react_1.default.createElement("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${financeEngine_1.DELIVERY_METHOD_META[del.method]?.badgeClass}` }, financeEngine_1.DELIVERY_METHOD_META[del.method]?.label)),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600 mt-1 truncate" },
                            del.carrierOrPersonName,
                            " \u2022 ",
                            del.dispatchedAt)))))))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex items-center justify-between mb-4" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement(lucide_react_1.Wrench, { className: "w-4 h-4 text-amber-600" }),
                            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Retornos & Garantia")),
                        react_1.default.createElement("button", { type: "button", onClick: () => onNavigate('retornos'), className: "text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer" },
                            "Ver Bancada ",
                            react_1.default.createElement(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" }))),
                    react_1.default.createElement("div", { className: "space-y-2.5" }, returns.length === 0 ? (react_1.default.createElement("div", { className: "p-6 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhum retorno registrado.")) : (returns.slice(0, 3).map((ret) => {
                        const stMeta = financeEngine_1.RETURN_STATUS_META[ret.status];
                        return (react_1.default.createElement("div", { key: ret.id, onClick: () => onNavigate('retornos'), className: "p-3 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer" },
                            react_1.default.createElement("div", { className: "flex items-center justify-between gap-2" },
                                react_1.default.createElement("span", { className: "text-xs font-bold text-slate-900 truncate" },
                                    ret.orderId,
                                    " \u2022 ",
                                    ret.companyName),
                                react_1.default.createElement("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${stMeta.badgeClass}` }, stMeta.label)),
                            react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600 mt-1 truncate" },
                                "Motivo: ",
                                ret.reason)));
                    }))))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex items-center justify-between mb-4" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement(lucide_react_1.Package, { className: "w-4 h-4 text-indigo-600" }),
                            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Estoque em Falta")),
                        react_1.default.createElement("button", { type: "button", onClick: () => onNavigate('estoque'), className: "text-xs font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer" },
                            "Ver Estoque ",
                            react_1.default.createElement(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" }))),
                    react_1.default.createElement("div", { className: "space-y-2.5" },
                        react_1.default.createElement("div", { onClick: () => onNavigate('estoque'), className: `p-3.5 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer ${lowMadeiras.length > 0 ? 'ring-1 ring-amber-400/70' : ''}` },
                            react_1.default.createElement("div", { className: "flex items-center justify-between gap-2" },
                                react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900" }, "1. Madeiras"),
                                lowMadeiras.length > 0 ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70" },
                                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-3 h-3 text-amber-700" }),
                                    lowMadeiras.length,
                                    " em falta")) : (react_1.default.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60" }, "0 em falta"))),
                            react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600 mt-1 truncate" }, lowMadeiras.length > 0
                                ? `Repor: ${lowMadeiras.map((i) => i.name).join(', ')}`
                                : `${madeirasStock.length} item(ns) cadastrado(s)`)),
                        react_1.default.createElement("div", { onClick: () => onNavigate('estoque'), className: `p-3.5 rounded-2xl liquid-glass-subtle hover:bg-white/45 transition cursor-pointer ${lowLaminas.length > 0 ? 'ring-1 ring-amber-400/70' : ''}` },
                            react_1.default.createElement("div", { className: "flex items-center justify-between gap-2" },
                                react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900" }, "2. L\u00E2minas"),
                                lowLaminas.length > 0 ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70" },
                                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-3 h-3 text-amber-700" }),
                                    lowLaminas.length,
                                    " em falta")) : (react_1.default.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60" }, "0 em falta"))),
                            react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600 mt-1 truncate" }, lowLaminas.length > 0
                                ? `Repor: ${lowLaminas.map((i) => i.name).join(', ')}`
                                : `${laminasStock.length} item(ns) cadastrado(s)`))))))));
};
exports.BentoOverviewSection = BentoOverviewSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/CompaniesCrmSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesCrmSection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const CompaniesCrmSection = ({ companies, orders, selectedCompanyId, onSelectCompany, onAddCompany, onDeleteCompany, onDeleteOrder, onAddDieForCompany, }) => {
    const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
    const [showNewCompanyForm, setShowNewCompanyForm] = (0, react_1.useState)(companies.length === 0);
    const [newCorpName, setNewCorpName] = (0, react_1.useState)('');
    const [newCnpj, setNewCnpj] = (0, react_1.useState)('');
    const [newPhone, setNewPhone] = (0, react_1.useState)('');
    const [newContact, setNewContact] = (0, react_1.useState)('');
    const [toolDesc, setToolDesc] = (0, react_1.useState)('');
    const [toolAmount, setToolAmount] = (0, react_1.useState)('');
    const [toolModality, setToolModality] = (0, react_1.useState)('boleto');
    const handleCreateCompany = (e) => {
        e.preventDefault();
        if (!newCorpName.trim())
            return;
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
    const handleCreateDieInCompany = (e) => {
        e.preventDefault();
        if (!activeCompany || !toolDesc.trim())
            return;
        const val = parseFloat(toolAmount.replace(',', '.')) || 0;
        onAddDieForCompany(activeCompany, toolDesc.trim(), val, toolModality);
        setToolDesc('');
        setToolAmount('');
    };
    const companyOrders = activeCompany
        ? orders.filter((o) => o.companyId === activeCompany.id)
        : [];
    const companyTotalValue = companyOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Cadastro de Empresas"),
                react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Selecione uma empresa para consultar todo o hist\u00F3rico de facas ou cadastrar uma nova ferramenta vinculada.")),
            react_1.default.createElement("button", { type: "button", onClick: () => setShowNewCompanyForm((prev) => !prev), className: "liquid-glass-pill inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-slate-900 hover:text-indigo-700 transition cursor-pointer" },
                react_1.default.createElement(lucide_react_1.Plus, { className: "w-4 h-4 text-indigo-600" }),
                react_1.default.createElement("span", null, showNewCompanyForm ? 'Fechar Cadastro' : 'Nova Empresa Cliente'))),
        showNewCompanyForm && (react_1.default.createElement("form", { onSubmit: handleCreateCompany, className: "liquid-glass rounded-[28px] p-6 space-y-4 ring-2 ring-indigo-400/40" },
            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-indigo-700" }, "Cadastrar Nova Empresa / Gr\u00E1fica Cliente"),
            react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3" },
                react_1.default.createElement("input", { type: "text", required: true, value: newCorpName, onChange: (e) => setNewCorpName(e.target.value), placeholder: "Raz\u00E3o Social / Nome Fantasia *", className: inputClass }),
                react_1.default.createElement("input", { type: "text", value: newCnpj, onChange: (e) => setNewCnpj(e.target.value), placeholder: "CNPJ (ex: 14.528.910/0001-42)", className: inputClass }),
                react_1.default.createElement("input", { type: "text", value: newPhone, onChange: (e) => setNewPhone(e.target.value), placeholder: "Telefone / WhatsApp", className: inputClass }),
                react_1.default.createElement("input", { type: "text", value: newContact, onChange: (e) => setNewContact(e.target.value), placeholder: "Respons\u00E1vel (Compras / PCP)", className: inputClass })),
            react_1.default.createElement("div", { className: "flex justify-end" },
                react_1.default.createElement("button", { type: "submit", className: "px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-md transition cursor-pointer" }, "Salvar Empresa")))),
        companies.length === 0 ? (react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-10 border-dashed text-center space-y-2" },
            react_1.default.createElement(lucide_react_1.Building2, { className: "w-8 h-8 text-indigo-600 mx-auto" }),
            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Nenhuma empresa cadastrada ainda"),
            react_1.default.createElement("p", { className: "text-xs font-medium text-slate-600 max-w-md mx-auto" }, "Utilize o formul\u00E1rio acima ou o bot\u00E3o \"Nova OS\" para cadastrar seu primeiro cliente e iniciar o controle de ferramental."))) : (react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("div", { className: "lg:col-span-5 space-y-3" }, companies.map((comp) => {
                const linked = orders.filter((o) => o.companyId === comp.id);
                const sumVal = linked.reduce((acc, o) => acc + (o.amount || 0), 0);
                const isSelected = activeCompany?.id === comp.id;
                return (react_1.default.createElement("div", { key: comp.id, onClick: () => onSelectCompany(comp.id), className: `liquid-glass rounded-[26px] p-5 transition-all cursor-pointer ${isSelected
                        ? 'ring-2 ring-indigo-500/70 bg-white/45'
                        : 'hover:bg-white/35'}` },
                    react_1.default.createElement("div", { className: "flex items-start justify-between gap-3" },
                        react_1.default.createElement("div", { className: "flex items-start gap-3" },
                            react_1.default.createElement("div", { className: `w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isSelected
                                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                                    : 'bg-white/65 text-indigo-600 border-white/80'}` },
                                react_1.default.createElement(lucide_react_1.Building2, { className: "w-5 h-5" })),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 leading-snug" }, comp.corporateName),
                                react_1.default.createElement("p", { className: "text-xs font-mono text-slate-600 mt-0.5" },
                                    "CNPJ: ",
                                    comp.cnpj))),
                        react_1.default.createElement("div", { className: "flex items-center gap-1.5 shrink-0" },
                            react_1.default.createElement("span", { className: "px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-300/60 text-xs font-bold text-indigo-800" },
                                linked.length,
                                " ",
                                linked.length === 1 ? 'faca' : 'facas'),
                            react_1.default.createElement("button", { type: "button", onClick: (e) => {
                                    e.stopPropagation();
                                    onDeleteCompany(comp.id);
                                }, className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Apagar empresa e facas vinculadas" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" })))),
                    react_1.default.createElement("div", { className: "mt-4 pt-3 border-t border-white/55 flex items-center justify-between text-xs text-slate-700" },
                        react_1.default.createElement("div", { className: "flex items-center gap-3" },
                            react_1.default.createElement("span", { className: "flex items-center gap-1 font-medium" },
                                react_1.default.createElement(lucide_react_1.Phone, { className: "w-3.5 h-3.5 text-emerald-600" }),
                                comp.phone),
                            react_1.default.createElement("span", { className: "hidden sm:flex items-center gap-1 font-medium" },
                                react_1.default.createElement(lucide_react_1.UserCheck, { className: "w-3.5 h-3.5 text-indigo-600" }),
                                comp.contactName)),
                        react_1.default.createElement("span", { className: "font-mono font-extrabold text-slate-900" }, (0, financeEngine_1.formatBRL)(sumVal)))));
            })),
            activeCompany && (react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-6" },
                react_1.default.createElement("div", { className: "flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/60" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-indigo-700" }, "Ficha de Ferramental do Cliente"),
                        react_1.default.createElement("h3", { className: "text-xl font-extrabold text-slate-900 mt-0.5 frosted-text-depth" }, activeCompany.corporateName),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-600 mt-1" },
                            "CNPJ: ",
                            react_1.default.createElement("span", { className: "font-mono text-slate-800" }, activeCompany.cnpj),
                            " \u2022 WhatsApp: ",
                            react_1.default.createElement("span", { className: "text-slate-800" }, activeCompany.phone),
                            " \u2022 Contato: ",
                            react_1.default.createElement("span", { className: "text-slate-800" }, activeCompany.contactName))),
                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                        react_1.default.createElement("div", { className: "p-3.5 rounded-2xl liquid-glass-subtle text-right" },
                            react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase text-slate-600 block" }, "Volume Total Cadastrado"),
                            react_1.default.createElement("span", { className: "text-xl font-black text-emerald-700 font-mono" }, (0, financeEngine_1.formatBRL)(companyTotalValue))),
                        react_1.default.createElement("button", { type: "button", onClick: () => onDeleteCompany(activeCompany.id), className: "p-3.5 rounded-2xl liquid-glass-pill text-slate-600 hover:text-rose-700 transition cursor-pointer", title: "Apagar esta empresa" },
                            react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4" })))),
                react_1.default.createElement("form", { onSubmit: handleCreateDieInCompany, className: "p-4 rounded-2xl liquid-glass-subtle space-y-3" },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900 flex items-center gap-1.5" },
                            react_1.default.createElement(lucide_react_1.Wrench, { className: "w-3.5 h-3.5 text-indigo-600" }),
                            "Vincular Nova Faca para ",
                            activeCompany.corporateName),
                        react_1.default.createElement("span", { className: "text-[11px] font-medium text-slate-600" }, "Entra em \"Arquivo Recebido\"")),
                    react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2.5" },
                        react_1.default.createElement("input", { type: "text", required: true, value: toolDesc, onChange: (e) => setToolDesc(e.target.value), placeholder: "Descri\u00E7\u00E3o da Faca (ex: Faca Caixa Duplex)", className: `${inputClass} sm:col-span-2` }),
                        react_1.default.createElement("input", { type: "number", step: "0.01", required: true, value: toolAmount, onChange: (e) => setToolAmount(e.target.value), placeholder: "Valor R$ (ex: 680)", className: `${inputClass} font-mono font-bold` })),
                    react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 pt-1" },
                        react_1.default.createElement("div", { className: "flex flex-wrap gap-1.5" }, Object.keys(financeEngine_1.PAYMENT_MODALITY_META).map((mod) => {
                            const meta = financeEngine_1.PAYMENT_MODALITY_META[mod];
                            const active = toolModality === mod;
                            return (react_1.default.createElement("button", { type: "button", key: mod, onClick: () => setToolModality(mod), className: `px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${active
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-sm'
                                    : 'liquid-glass-pill text-slate-700'}` }, meta.label));
                        })),
                        react_1.default.createElement("button", { type: "submit", className: "px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0" },
                            react_1.default.createElement(lucide_react_1.Check, { className: "w-3.5 h-3.5 stroke-[2.5]" }),
                            react_1.default.createElement("span", null, "Cadastrar Faca")))),
                react_1.default.createElement("div", { className: "space-y-2.5" },
                    react_1.default.createElement("h4", { className: "text-xs font-bold uppercase tracking-wider text-slate-600" },
                        "Hist\u00F3rico de Facas Associadas \u2022 ",
                        companyOrders.length),
                    companyOrders.length === 0 ? (react_1.default.createElement("div", { className: "p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhuma faca cadastrada para esta empresa ainda.")) : (companyOrders.map((order) => {
                        const modMeta = financeEngine_1.PAYMENT_MODALITY_META[order.paymentModality];
                        const stageMeta = financeEngine_1.PRODUCTION_STAGES.find((s) => s.id === order.stage);
                        return (react_1.default.createElement("div", { key: order.id, className: "p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3" },
                            react_1.default.createElement("div", { className: "space-y-1" },
                                react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                                    react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800" }, order.id),
                                    react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${modMeta?.badgeClass}` }, modMeta?.label),
                                    react_1.default.createElement("span", { className: "text-[11px] font-semibold text-slate-700 flex items-center gap-1" },
                                        react_1.default.createElement(lucide_react_1.Layers, { className: "w-3 h-3 text-indigo-600" }),
                                        stageMeta?.label)),
                                react_1.default.createElement("p", { className: "text-sm font-extrabold text-slate-900" }, order.toolDescription),
                                react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" },
                                    "Cadastrada em ",
                                    (0, financeEngine_1.formatDateBR)(order.createdAt),
                                    " \u2022 Vencimento:",
                                    ' ',
                                    (0, financeEngine_1.formatDateBR)(order.dueDate))),
                            react_1.default.createElement("div", { className: "flex items-center justify-between sm:justify-end gap-3 shrink-0" },
                                react_1.default.createElement("div", { className: "text-right font-mono" },
                                    react_1.default.createElement("span", { className: "text-base font-black text-emerald-700 block" }, (0, financeEngine_1.formatBRL)(order.amount)),
                                    react_1.default.createElement("span", { className: "text-[10px] font-medium text-slate-600" },
                                        "Atualizado: ",
                                        order.stageUpdatedAt)),
                                react_1.default.createElement("button", { type: "button", onClick: () => onDeleteOrder(order.id), className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Apagar esta OS / Faca" },
                                    react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4" })))));
                    })))))))));
};
exports.CompaniesCrmSection = CompaniesCrmSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/ProductionKanban"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionKanban = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const OrderKanbanCard = react_1.default.memo(({ order, isPending, isExpanded, onToggleExpand, onDragStart, onDragEnd, onMoveStage, onQuickRegisterDelivery, onDeleteOrder, }) => {
    const prevStage = (0, financeEngine_1.getPrevStage)(order.stage);
    const nextStage = (0, financeEngine_1.getNextStage)(order.stage);
    const modMeta = financeEngine_1.PAYMENT_MODALITY_META[order.paymentModality];
    return (react_1.default.createElement("div", { draggable: !isPending, onDragStart: () => onDragStart(order.id), onDragEnd: onDragEnd, className: `rounded-2xl p-3.5 liquid-glass-subtle hover:bg-white/45 transition-colors cursor-grab active:cursor-grabbing flex flex-col gap-2.5 ${isPending ? 'opacity-75 ring-1 ring-indigo-400/70' : ''}` },
        react_1.default.createElement("div", { className: "flex items-center justify-between gap-1.5" },
            react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-[11px] font-bold text-indigo-800" }, order.id),
            react_1.default.createElement("div", { className: "flex items-center gap-1" },
                react_1.default.createElement("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-bold border ${modMeta?.badgeClass}` }, modMeta?.short),
                react_1.default.createElement("button", { type: "button", onClick: () => onToggleExpand(order.id), className: "p-1 rounded-lg bg-white/60 hover:bg-white/90 text-slate-600 border border-white/70 transition-colors cursor-pointer", title: "Detalhes da OS" }, isExpanded ? (react_1.default.createElement(lucide_react_1.ChevronUp, { className: "w-3 h-3" })) : (react_1.default.createElement(lucide_react_1.ChevronDown, { className: "w-3 h-3" }))),
                react_1.default.createElement("button", { type: "button", onClick: () => onDeleteOrder(order.id), className: "p-1 rounded-lg bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/70 transition-colors cursor-pointer", title: "Apagar esta OS" },
                    react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3 h-3" })))),
        react_1.default.createElement("div", null,
            react_1.default.createElement("span", { className: "text-[11px] font-bold text-slate-600 block truncate" }, order.companyName),
            react_1.default.createElement("h4", { className: "text-xs font-extrabold text-slate-900 leading-snug mt-0.5" }, order.toolDescription)),
        isExpanded && (react_1.default.createElement("div", { className: "p-2.5 rounded-xl bg-white/55 border border-white/75 text-[11px] space-y-1 text-slate-700" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("strong", null, "Vencimento:"),
                " ",
                (0, financeEngine_1.formatDateBR)(order.dueDate)),
            react_1.default.createElement("div", null,
                react_1.default.createElement("strong", null, "Telefone:"),
                " ",
                order.companyPhone || 'Não informado'),
            react_1.default.createElement("div", null,
                react_1.default.createElement("strong", null, "Vers\u00E3o:"),
                " v",
                order.version || 1))),
        react_1.default.createElement("div", { className: "flex items-center justify-between text-[10px] text-slate-700 bg-white/55 px-2.5 py-1.5 rounded-xl border border-white/70" },
            react_1.default.createElement("span", { className: "flex items-center gap-1 font-semibold" },
                react_1.default.createElement(lucide_react_1.Clock, { className: "w-3 h-3 text-indigo-600 shrink-0" }),
                react_1.default.createElement("span", null, isPending ? 'Salvando...' : order.stageUpdatedAt)),
            react_1.default.createElement("span", { className: "font-mono font-extrabold text-emerald-700" }, (0, financeEngine_1.formatBRL)(order.amount))),
        react_1.default.createElement("div", { className: "flex items-center gap-1.5 pt-1" },
            prevStage && (react_1.default.createElement("button", { type: "button", disabled: isPending, onClick: () => onMoveStage(order.id, prevStage), className: "p-1.5 rounded-xl bg-white/65 hover:bg-white/90 disabled:opacity-50 text-slate-700 border border-white/80 transition-colors cursor-pointer", title: "Voltar etapa anterior" },
                react_1.default.createElement(lucide_react_1.ArrowLeft, { className: "w-3.5 h-3.5" }))),
            nextStage ? (react_1.default.createElement("button", { type: "button", disabled: isPending, onClick: () => onMoveStage(order.id, nextStage), className: "flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white border border-white/40 shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer" },
                react_1.default.createElement("span", null, "Avan\u00E7ar Etapa"),
                react_1.default.createElement(lucide_react_1.ArrowRight, { className: "w-3 h-3 stroke-[2.2]" }))) : (react_1.default.createElement("button", { type: "button", disabled: isPending, onClick: () => onQuickRegisterDelivery(order), className: "flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white border border-white/40 shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer" },
                react_1.default.createElement(lucide_react_1.Truck, { className: "w-3.5 h-3.5" }),
                react_1.default.createElement("span", null, "Despachar / Sa\u00EDda"))))));
});
const ProductionKanban = ({ orders, pendingOrderIds = [], moveError, onMoveStage, onQuickRegisterDelivery, onDeleteOrder, }) => {
    const [draggedId, setDraggedId] = (0, react_1.useState)(null);
    const [dragOverStage, setDragOverStage] = (0, react_1.useState)(null);
    const [expandedOrderIds, setExpandedOrderIds] = (0, react_1.useState)(() => new Set());
    const pendingSet = new Set(pendingOrderIds);
    const handleToggleExpand = (orderId) => {
        setExpandedOrderIds((prev) => {
            const next = new Set(prev);
            if (next.has(orderId))
                next.delete(orderId);
            else
                next.add(orderId);
            return next;
        });
    };
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Esteira F\u00EDsica de Produ\u00E7\u00E3o"),
                react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Arraste os cart\u00F5es ou clique em avan\u00E7ar. Cada mudan\u00E7a grava a data e hora da etapa.")),
            moveError && (react_1.default.createElement("div", { className: "px-3.5 py-2 rounded-full bg-rose-500/15 border border-rose-300/70 text-xs font-bold text-rose-800" }, moveError))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 items-start" }, financeEngine_1.PRODUCTION_STAGES.map((stage) => {
            const colOrders = orders.filter((o) => o.stage === stage.id);
            const colTotal = colOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
            const isOver = dragOverStage === stage.id;
            return (react_1.default.createElement("div", { key: stage.id, onDragOver: (e) => {
                    e.preventDefault();
                    if (dragOverStage !== stage.id) {
                        setDragOverStage(stage.id);
                    }
                }, onDragLeave: () => setDragOverStage(null), onDrop: (e) => {
                    e.preventDefault();
                    setDragOverStage(null);
                    if (draggedId) {
                        const draggedOrder = orders.find((o) => o.id === draggedId);
                        if (draggedOrder && draggedOrder.stage !== stage.id) {
                            onMoveStage(draggedId, stage.id);
                        }
                        setDraggedId(null);
                    }
                }, className: `liquid-glass rounded-[26px] p-4 transition-colors min-h-[480px] flex flex-col gap-3 ${isOver ? 'ring-2 ring-indigo-500/70' : ''}` },
                react_1.default.createElement("div", { className: "pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", { className: "flex items-center justify-between gap-2" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement("span", { className: `w-2.5 h-2.5 rounded-full ${stage.dotClass}` }),
                            react_1.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-600" },
                                "Etapa ",
                                stage.step)),
                        react_1.default.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white/70 text-slate-900 border border-white/80 shadow-xs" }, colOrders.length)),
                    react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 mt-1.5 frosted-text-depth" }, stage.label),
                    react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600 mt-0.5" }, stage.subtitle),
                    react_1.default.createElement("div", { className: "mt-2 pt-2 border-t border-white/45 flex items-center justify-between text-[11px] font-mono" },
                        react_1.default.createElement("span", { className: "text-slate-600 font-semibold" }, "Volume:"),
                        react_1.default.createElement("span", { className: "font-extrabold text-emerald-700" }, (0, financeEngine_1.formatBRL)(colTotal)))),
                react_1.default.createElement("div", { className: "space-y-3 flex-1" }, colOrders.length === 0 ? (react_1.default.createElement("div", { className: "h-32 rounded-2xl border border-dashed border-white/75 bg-white/20 flex items-center justify-center text-xs font-medium text-slate-600 text-center px-2" },
                    "Sem facas em ",
                    stage.label)) : (colOrders.map((order) => (react_1.default.createElement(OrderKanbanCard, { key: order.id, order: order, isPending: pendingSet.has(order.id), isExpanded: expandedOrderIds.has(order.id), onToggleExpand: handleToggleExpand, onDragStart: setDraggedId, onDragEnd: () => {
                        setDraggedId(null);
                        setDragOverStage(null);
                    }, onMoveStage: onMoveStage, onQuickRegisterDelivery: onQuickRegisterDelivery, onDeleteOrder: onDeleteOrder })))))));
        }))));
};
exports.ProductionKanban = ProductionKanban;

  },
  { dir: "./components" }
);

__moduleFactories["./components/ExpensesSubsection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesSubsection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const ExpensesSubsection = ({ expenses, onUpsertMonthExpenses, }) => {
    const [selectedMonth, setSelectedMonth] = (0, react_1.useState)(() => new Date().toISOString().slice(0, 7));
    const [draftValues, setDraftValues] = (0, react_1.useState)(() => (0, financeEngine_1.createEmptyExpensesMap)());
    (0, react_1.useEffect)(() => {
        const existing = expenses.find((e) => e.month === selectedMonth);
        setDraftValues({
            ...(0, financeEngine_1.createEmptyExpensesMap)(),
            ...(existing?.values || {}),
        });
    }, [selectedMonth, expenses]);
    const monthTotal = financeEngine_1.EXPENSE_CATEGORIES.reduce((sum, cat) => sum + (draftValues[cat.key] || 0), 0);
    const handleAmountChange = (key, rawInput) => {
        const parsed = (0, financeEngine_1.parseCurrencyMask)(rawInput);
        const next = {
            ...draftValues,
            [key]: parsed,
        };
        setDraftValues(next);
        onUpsertMonthExpenses(selectedMonth, next);
    };
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 flex flex-wrap items-center justify-between gap-4" },
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement("div", { className: "w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700" },
                    react_1.default.createElement(lucide_react_1.Receipt, { className: "w-5 h-5" })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-600 block" }, "Total de Despesas do M\u00EAs"),
                    react_1.default.createElement("p", { className: "text-3xl font-black text-slate-900 font-mono tracking-tight" }, (0, financeEngine_1.formatBRL)(monthTotal)))),
            react_1.default.createElement("div", { className: "flex items-center gap-2.5" },
                react_1.default.createElement("label", { htmlFor: "expense-ref-month", className: "text-xs font-bold text-slate-700 flex items-center gap-1.5" },
                    react_1.default.createElement(lucide_react_1.Calendar, { className: "w-4 h-4 text-indigo-600" }),
                    react_1.default.createElement("span", null, "M\u00EAs de Refer\u00EAncia")),
                react_1.default.createElement("input", { id: "expense-ref-month", type: "month", value: selectedMonth, onChange: (e) => setSelectedMonth(e.target.value), className: "liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none" }))),
        react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 space-y-3" },
            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60" }, "Despesas Fixas e Operacionais"),
            react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" }, financeEngine_1.EXPENSE_CATEGORIES.map((cat) => {
                const val = draftValues[cat.key] || 0;
                return (react_1.default.createElement("div", { key: cat.key, className: "p-3.5 rounded-2xl liquid-glass-subtle flex items-center justify-between gap-3" },
                    react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900" }, cat.label),
                    react_1.default.createElement("div", { className: "relative w-44" },
                        react_1.default.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none" }, "R$"),
                        react_1.default.createElement("input", { type: "text", inputMode: "numeric", "aria-label": cat.label, value: (0, financeEngine_1.formatCurrencyMask)(val), onChange: (e) => handleAmountChange(cat.key, e.target.value), className: "liquid-glass-pill w-full pl-9 pr-3.5 py-2 rounded-2xl text-right text-xs font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none" }))));
            })))));
};
exports.ExpensesSubsection = ExpensesSubsection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/CollaboratorsSubsection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaboratorsSubsection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const PROVIDER_STATUS_META = {
    pendente: {
        label: 'Pendente',
        badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300/60',
    },
    pago: {
        label: 'Pago',
        badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60',
    },
    atrasado: {
        label: 'Atrasado',
        badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-300/60',
    },
};
const CollaboratorsSubsection = ({ providers, payrollEmployees, onAddProvider, onUpdateProvider, onDeleteProvider, onAddPayrollEmployee, onUpdatePayrollEmployee, onDeletePayrollEmployee, }) => {
    const [activeTab, setActiveTab] = (0, react_1.useState)('prestadores');
    // Providers Form State
    const [editProvId, setEditProvId] = (0, react_1.useState)(null);
    const [provName, setProvName] = (0, react_1.useState)('');
    const [provService, setProvService] = (0, react_1.useState)('');
    const [provAmount, setProvAmount] = (0, react_1.useState)(0);
    const [provModality, setProvModality] = (0, react_1.useState)('pix');
    const [provDueDate, setProvDueDate] = (0, react_1.useState)(() => (0, financeEngine_1.toISODate)());
    const [provStatus, setProvStatus] = (0, react_1.useState)('pendente');
    // Payroll Employees Form State
    const [editEmpId, setEditEmpId] = (0, react_1.useState)(null);
    const [empName, setEmpName] = (0, react_1.useState)('');
    const [empRoleTitle, setEmpRoleTitle] = (0, react_1.useState)('');
    const [empSalary, setEmpSalary] = (0, react_1.useState)(0);
    const [empAdmissionDate, setEmpAdmissionDate] = (0, react_1.useState)(() => (0, financeEngine_1.toISODate)());
    const totalProviders = providers.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPayroll = payrollEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const resetProviderForm = () => {
        setEditProvId(null);
        setProvName('');
        setProvService('');
        setProvAmount(0);
        setProvModality('pix');
        setProvDueDate((0, financeEngine_1.toISODate)());
        setProvStatus('pendente');
    };
    const resetEmployeeForm = () => {
        setEditEmpId(null);
        setEmpName('');
        setEmpRoleTitle('');
        setEmpSalary(0);
        setEmpAdmissionDate((0, financeEngine_1.toISODate)());
    };
    const handleProviderSubmit = (e) => {
        e.preventDefault();
        if (!provName.trim() || !provService.trim())
            return;
        const payload = {
            name: provName.trim(),
            service: provService.trim(),
            amount: provAmount,
            paymentModality: provModality,
            dueDate: provDueDate || (0, financeEngine_1.toISODate)(),
            status: provStatus,
        };
        if (editProvId) {
            onUpdateProvider(editProvId, payload);
        }
        else {
            onAddProvider(payload);
        }
        resetProviderForm();
    };
    const handleEmployeeSubmit = (e) => {
        e.preventDefault();
        if (!empName.trim() || !empRoleTitle.trim())
            return;
        const payload = {
            name: empName.trim(),
            roleTitle: empRoleTitle.trim(),
            salary: empSalary,
            admissionDate: empAdmissionDate || (0, financeEngine_1.toISODate)(),
        };
        if (editEmpId) {
            onUpdatePayrollEmployee(editEmpId, payload);
        }
        else {
            onAddPayrollEmployee(payload);
        }
        resetEmployeeForm();
    };
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-5 flex flex-wrap items-center justify-between gap-4" },
            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                react_1.default.createElement("button", { type: "button", onClick: () => setActiveTab('prestadores'), className: `px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${activeTab === 'prestadores'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'}` },
                    react_1.default.createElement(lucide_react_1.Briefcase, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null, "Prestadores de Servi\u00E7o"),
                    react_1.default.createElement("span", { className: "px-1.5 py-0.5 rounded-full bg-white/25 text-[10px]" }, providers.length)),
                react_1.default.createElement("button", { type: "button", onClick: () => setActiveTab('funcionarios'), className: `px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${activeTab === 'funcionarios'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'}` },
                    react_1.default.createElement(lucide_react_1.Users, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null, "Funcion\u00E1rios"),
                    react_1.default.createElement("span", { className: "px-1.5 py-0.5 rounded-full bg-white/25 text-[10px]" }, payrollEmployees.length))),
            react_1.default.createElement("div", { className: "text-right" },
                react_1.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-600 block" }, activeTab === 'prestadores'
                    ? 'Total Prestadores de Serviço'
                    : 'Total Folha de Funcionários'),
                react_1.default.createElement("span", { className: "text-2xl font-black text-emerald-700 font-mono" }, (0, financeEngine_1.formatBRL)(activeTab === 'prestadores' ? totalProviders : totalPayroll)))),
        activeTab === 'prestadores' ? (react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("form", { onSubmit: handleProviderSubmit, className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-3.5" },
                react_1.default.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-white/60" },
                    react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, editProvId
                        ? `Editar Prestador ${editProvId}`
                        : 'Cadastrar Prestador de Serviço'),
                    editProvId && (react_1.default.createElement("button", { type: "button", onClick: resetProviderForm, className: "p-1.5 rounded-full liquid-glass-pill text-slate-600 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Nome"),
                    react_1.default.createElement("input", { type: "text", required: true, value: provName, onChange: (e) => setProvName(e.target.value), placeholder: "Nome do prestador", className: inputClass })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Servi\u00E7o"),
                    react_1.default.createElement("input", { type: "text", required: true, value: provService, onChange: (e) => setProvService(e.target.value), placeholder: "Ex: Afia\u00E7\u00E3o, Frete, Manuten\u00E7\u00E3o Laser", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Valor em R$"),
                        react_1.default.createElement("div", { className: "relative" },
                            react_1.default.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600" }, "R$"),
                            react_1.default.createElement("input", { type: "text", inputMode: "numeric", required: true, value: (0, financeEngine_1.formatCurrencyMask)(provAmount), onChange: (e) => setProvAmount((0, financeEngine_1.parseCurrencyMask)(e.target.value)), className: `${inputClass} pl-9 text-right font-mono font-bold` }))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Vencimento"),
                        react_1.default.createElement("input", { type: "date", required: true, value: provDueDate, onChange: (e) => setProvDueDate(e.target.value), className: `${inputClass} font-mono` }))),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Forma de Pagamento"),
                        react_1.default.createElement("select", { value: provModality, onChange: (e) => setProvModality(e.target.value), className: inputClass }, Object.keys(financeEngine_1.PAYMENT_MODALITY_META).map((mod) => (react_1.default.createElement("option", { key: mod, value: mod }, financeEngine_1.PAYMENT_MODALITY_META[mod].label))))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Status"),
                        react_1.default.createElement("select", { value: provStatus, onChange: (e) => setProvStatus(e.target.value), className: inputClass }, Object.entries(PROVIDER_STATUS_META).map(([k, v]) => (react_1.default.createElement("option", { key: k, value: k }, v.label)))))),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer" },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null, editProvId ? 'Salvar Prestador' : 'Adicionar Prestador'))),
            react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3" },
                react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60" }, "Prestadores Cadastrados"),
                providers.length === 0 ? (react_1.default.createElement("div", { className: "p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhum prestador de servi\u00E7o cadastrado.")) : (providers.map((p) => {
                    const st = PROVIDER_STATUS_META[p.status];
                    const mod = financeEngine_1.PAYMENT_MODALITY_META[p.paymentModality];
                    return (react_1.default.createElement("div", { key: p.id, className: "p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3" },
                        react_1.default.createElement("div", { className: "space-y-1" },
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                                react_1.default.createElement("span", { className: "text-sm font-extrabold text-slate-900" }, p.name),
                                react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.badgeClass}` }, st.label),
                                react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${mod?.badgeClass}` }, mod?.label)),
                            react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" },
                                p.service,
                                " \u2022 Vencimento ",
                                (0, financeEngine_1.formatDateBR)(p.dueDate))),
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement("span", { className: "text-sm font-black font-mono text-slate-900 mr-1" }, (0, financeEngine_1.formatBRL)(p.amount)),
                            react_1.default.createElement("button", { type: "button", onClick: () => {
                                    setEditProvId(p.id);
                                    setProvName(p.name);
                                    setProvService(p.service);
                                    setProvAmount(p.amount);
                                    setProvModality(p.paymentModality);
                                    setProvDueDate(p.dueDate);
                                    setProvStatus(p.status);
                                }, className: "p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 cursor-pointer", title: "Editar prestador" },
                                react_1.default.createElement(lucide_react_1.Edit3, { className: "w-3.5 h-3.5" })),
                            react_1.default.createElement("button", { type: "button", onClick: () => {
                                    if (editProvId === p.id)
                                        resetProviderForm();
                                    onDeleteProvider(p.id);
                                }, className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer", title: "Remover prestador" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" })))));
                }))))) : (react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("form", { onSubmit: handleEmployeeSubmit, className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-3.5" },
                react_1.default.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-white/60" },
                    react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, editEmpId
                        ? `Editar Funcionário ${editEmpId}`
                        : 'Cadastrar Funcionário'),
                    editEmpId && (react_1.default.createElement("button", { type: "button", onClick: resetEmployeeForm, className: "p-1.5 rounded-full liquid-glass-pill text-slate-600 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Nome"),
                    react_1.default.createElement("input", { type: "text", required: true, value: empName, onChange: (e) => setEmpName(e.target.value), placeholder: "Nome completo", className: inputClass })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Cargo"),
                    react_1.default.createElement("input", { type: "text", required: true, value: empRoleTitle, onChange: (e) => setEmpRoleTitle(e.target.value), placeholder: "Ex: Serrador, Dobrador, Emborrachador", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Sal\u00E1rio em R$"),
                        react_1.default.createElement("div", { className: "relative" },
                            react_1.default.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600" }, "R$"),
                            react_1.default.createElement("input", { type: "text", inputMode: "numeric", required: true, value: (0, financeEngine_1.formatCurrencyMask)(empSalary), onChange: (e) => setEmpSalary((0, financeEngine_1.parseCurrencyMask)(e.target.value)), className: `${inputClass} pl-9 text-right font-mono font-bold` }))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Data de Admiss\u00E3o"),
                        react_1.default.createElement("input", { type: "date", required: true, value: empAdmissionDate, onChange: (e) => setEmpAdmissionDate(e.target.value), className: `${inputClass} font-mono` }))),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer" },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null, editEmpId ? 'Salvar Funcionário' : 'Adicionar Funcionário'))),
            react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3" },
                react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60" }, "Quadro de Funcion\u00E1rios"),
                payrollEmployees.length === 0 ? (react_1.default.createElement("div", { className: "p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhum funcion\u00E1rio cadastrado.")) : (payrollEmployees.map((emp) => (react_1.default.createElement("div", { key: emp.id, className: "p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3" },
                    react_1.default.createElement("div", { className: "space-y-1" },
                        react_1.default.createElement("span", { className: "text-sm font-extrabold text-slate-900 block" }, emp.name),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" },
                            emp.roleTitle,
                            " \u2022 Admiss\u00E3o ",
                            (0, financeEngine_1.formatDateBR)(emp.admissionDate))),
                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                        react_1.default.createElement("span", { className: "text-sm font-black font-mono text-slate-900 mr-1" }, (0, financeEngine_1.formatBRL)(emp.salary)),
                        react_1.default.createElement("button", { type: "button", onClick: () => {
                                setEditEmpId(emp.id);
                                setEmpName(emp.name);
                                setEmpRoleTitle(emp.roleTitle);
                                setEmpSalary(emp.salary);
                                setEmpAdmissionDate(emp.admissionDate);
                            }, className: "p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 cursor-pointer", title: "Editar funcion\u00E1rio" },
                            react_1.default.createElement(lucide_react_1.Edit3, { className: "w-3.5 h-3.5" })),
                        react_1.default.createElement("button", { type: "button", onClick: () => {
                                if (editEmpId === emp.id)
                                    resetEmployeeForm();
                                onDeletePayrollEmployee(emp.id);
                            }, className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer", title: "Remover funcion\u00E1rio" },
                            react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }))))))))))));
};
exports.CollaboratorsSubsection = CollaboratorsSubsection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/InvestmentsSubsection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsSubsection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const InvestmentsSubsection = ({ investments, onAddInvestment, onUpdateInvestment, onDeleteInvestment, }) => {
    const [editId, setEditId] = (0, react_1.useState)(null);
    const [assetName, setAssetName] = (0, react_1.useState)('');
    const [assetType, setAssetType] = (0, react_1.useState)('renda_fixa');
    const [appliedDate, setAppliedDate] = (0, react_1.useState)(() => (0, financeEngine_1.toISODate)());
    const [investedAmount, setInvestedAmount] = (0, react_1.useState)(0);
    const [currentAmount, setCurrentAmount] = (0, react_1.useState)(0);
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
    const totalCurrent = investments.reduce((sum, inv) => sum + (inv.currentAmount || 0), 0);
    const totalYieldBRL = totalCurrent - totalInvested;
    const totalYieldPct = totalInvested > 0 ? (totalYieldBRL / totalInvested) * 100 : 0;
    const resetForm = () => {
        setEditId(null);
        setAssetName('');
        setAssetType('renda_fixa');
        setAppliedDate((0, financeEngine_1.toISODate)());
        setInvestedAmount(0);
        setCurrentAmount(0);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!assetName.trim())
            return;
        const payload = {
            assetName: assetName.trim(),
            assetType,
            appliedDate: appliedDate || (0, financeEngine_1.toISODate)(),
            investedAmount,
            currentAmount,
        };
        if (editId) {
            onUpdateInvestment(editId, payload);
        }
        else {
            onAddInvestment(payload);
        }
        resetForm();
    };
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5" },
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6" },
                react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-600 block" }, "Total Investido"),
                react_1.default.createElement("p", { className: "text-3xl font-black text-slate-900 font-mono mt-2" }, (0, financeEngine_1.formatBRL)(totalInvested))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6" },
                react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-600 block" }, "Saldo Atual"),
                react_1.default.createElement("p", { className: "text-3xl font-black text-indigo-700 font-mono mt-2" }, (0, financeEngine_1.formatBRL)(totalCurrent))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6" },
                react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-600 block" }, "Rendimento Total"),
                react_1.default.createElement("p", { className: `text-3xl font-black font-mono mt-2 ${totalYieldBRL >= 0 ? 'text-emerald-700' : 'text-rose-700'}` },
                    totalYieldBRL >= 0 ? '+' : '',
                    (0, financeEngine_1.formatBRL)(totalYieldBRL)),
                react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700 font-mono" },
                    totalYieldPct >= 0 ? '+' : '',
                    totalYieldPct.toFixed(2),
                    "%"))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("form", { onSubmit: handleSubmit, className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-3.5" },
                react_1.default.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                        react_1.default.createElement(lucide_react_1.TrendingUp, { className: "w-4 h-4 text-indigo-600" }),
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, editId ? `Editar Ativo ${editId}` : 'Cadastrar Investimento')),
                    editId && (react_1.default.createElement("button", { type: "button", onClick: resetForm, className: "p-1.5 rounded-full liquid-glass-pill text-slate-600 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Nome do Ativo"),
                    react_1.default.createElement("input", { type: "text", required: true, value: assetName, onChange: (e) => setAssetName(e.target.value), placeholder: "Ex: CDB Liquidez Di\u00E1ria, Tesouro Selic, HGLG11", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Tipo"),
                        react_1.default.createElement("select", { value: assetType, onChange: (e) => setAssetType(e.target.value), className: inputClass }, Object.entries(financeEngine_1.INVESTMENT_TYPE_META).map(([k, v]) => (react_1.default.createElement("option", { key: k, value: k }, v.label))))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Data de Aplica\u00E7\u00E3o"),
                        react_1.default.createElement("input", { type: "date", required: true, value: appliedDate, onChange: (e) => setAppliedDate(e.target.value), className: `${inputClass} font-mono` }))),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Valor Aplicado em R$"),
                        react_1.default.createElement("div", { className: "relative" },
                            react_1.default.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600" }, "R$"),
                            react_1.default.createElement("input", { type: "text", inputMode: "numeric", required: true, value: (0, financeEngine_1.formatCurrencyMask)(investedAmount), onChange: (e) => setInvestedAmount((0, financeEngine_1.parseCurrencyMask)(e.target.value)), className: `${inputClass} pl-9 text-right font-mono font-bold` }))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Valor Atual em R$"),
                        react_1.default.createElement("div", { className: "relative" },
                            react_1.default.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600" }, "R$"),
                            react_1.default.createElement("input", { type: "text", inputMode: "numeric", required: true, value: (0, financeEngine_1.formatCurrencyMask)(currentAmount), onChange: (e) => setCurrentAmount((0, financeEngine_1.parseCurrencyMask)(e.target.value)), className: `${inputClass} pl-9 text-right font-mono font-bold` })))),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-md flex items-center justify-center gap-2 cursor-pointer" },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null, editId ? 'Salvar Investimento' : 'Adicionar Investimento'))),
            react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-3" },
                react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 pb-2 border-b border-white/60" }, "Carteira de Investimentos"),
                investments.length === 0 ? (react_1.default.createElement("div", { className: "p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhum investimento registrado ainda.")) : (investments.map((inv) => {
                    const yieldBRL = inv.currentAmount - inv.investedAmount;
                    const yieldPct = inv.investedAmount > 0
                        ? (yieldBRL / inv.investedAmount) * 100
                        : 0;
                    return (react_1.default.createElement("div", { key: inv.id, className: "p-4 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-3" },
                        react_1.default.createElement("div", { className: "space-y-1" },
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                                react_1.default.createElement("span", { className: "text-sm font-extrabold text-slate-900" }, inv.assetName),
                                react_1.default.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60" }, financeEngine_1.INVESTMENT_TYPE_META[inv.assetType]?.label)),
                            react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" },
                                "Aplicado em ",
                                (0, financeEngine_1.formatDateBR)(inv.appliedDate),
                                " \u2022 Base",
                                ' ',
                                react_1.default.createElement("span", { className: "font-mono font-bold" }, (0, financeEngine_1.formatBRL)(inv.investedAmount)))),
                        react_1.default.createElement("div", { className: "flex items-center gap-3" },
                            react_1.default.createElement("div", { className: "text-right font-mono" },
                                react_1.default.createElement("span", { className: "text-sm font-black text-slate-900 block" }, (0, financeEngine_1.formatBRL)(inv.currentAmount)),
                                react_1.default.createElement("span", { className: `text-[11px] font-extrabold ${yieldBRL >= 0 ? 'text-emerald-700' : 'text-rose-700'}` },
                                    yieldBRL >= 0 ? '+' : '',
                                    (0, financeEngine_1.formatBRL)(yieldBRL),
                                    " \u2022 ",
                                    yieldPct >= 0 ? '+' : '',
                                    yieldPct.toFixed(2),
                                    "%")),
                            react_1.default.createElement("button", { type: "button", onClick: () => {
                                    setEditId(inv.id);
                                    setAssetName(inv.assetName);
                                    setAssetType(inv.assetType);
                                    setAppliedDate(inv.appliedDate);
                                    setInvestedAmount(inv.investedAmount);
                                    setCurrentAmount(inv.currentAmount);
                                }, className: "p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 cursor-pointer", title: "Editar investimento" },
                                react_1.default.createElement(lucide_react_1.Edit3, { className: "w-3.5 h-3.5" })),
                            react_1.default.createElement("button", { type: "button", onClick: () => {
                                    if (editId === inv.id)
                                        resetForm();
                                    onDeleteInvestment(inv.id);
                                }, className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer", title: "Remover investimento" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" })))));
                }))))));
};
exports.InvestmentsSubsection = InvestmentsSubsection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/FinanceAnalyticsSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceAnalyticsSection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const CollaboratorsSubsection_1 = require("./CollaboratorsSubsection");
const ExpensesSubsection_1 = require("./ExpensesSubsection");
const InvestmentsSubsection_1 = require("./InvestmentsSubsection");
const FinanceAnalyticsSection = ({ orders, financials, expenses, serviceProviders, payrollEmployees, investments, onTogglePaid, onEmitBilling30d, onDeleteOrder, onUpsertMonthExpenses, onAddProvider, onUpdateProvider, onDeleteProvider, onAddPayrollEmployee, onUpdatePayrollEmployee, onDeletePayrollEmployee, onAddInvestment, onUpdateInvestment, onDeleteInvestment, }) => {
    const [activeTab, setActiveTab] = (0, react_1.useState)('visao');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('todos');
    const [copiedId, setCopiedId] = (0, react_1.useState)(null);
    const [hoveredModality, setHoveredModality] = (0, react_1.useState)(null);
    const filteredOrders = orders.filter((o) => {
        if (statusFilter === 'todos')
            return true;
        return o.paymentStatus === statusFilter;
    });
    const handleCopyPix = async (order) => {
        const text = (0, financeEngine_1.buildPixClipboardSnippet)(order);
        try {
            await navigator.clipboard.writeText(text);
        }
        catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopiedId(order.id);
        setTimeout(() => {
            setCopiedId((prev) => (prev === order.id ? null : prev));
        }, 2200);
    };
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;
    const donutSegments = financials.byModality
        .filter((m) => m.totalAmount > 0)
        .map((m) => {
        const frac = financials.totalVolume > 0 ? m.totalAmount / financials.totalVolume : 0;
        const strokeDasharray = `${frac * circumference} ${circumference}`;
        const strokeDashoffset = -cumulativePercent * circumference;
        cumulativePercent += frac;
        return {
            ...m,
            strokeDasharray,
            strokeDashoffset,
        };
    });
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Finan\u00E7as e Formas de Pagamento"),
                react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Controle do ciclo financeiro, despesas mensais, colaboradores e investimentos.")),
            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" }, [
                { id: 'visao', label: 'Recebimentos e OS', icon: lucide_react_1.PieChart },
                { id: 'despesas', label: 'Despesas', icon: lucide_react_1.Receipt },
                { id: 'colaboradores', label: 'Colaboradores', icon: lucide_react_1.Users },
                { id: 'investimentos', label: 'Investimentos', icon: lucide_react_1.TrendingUp },
            ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (react_1.default.createElement("button", { key: tab.id, type: "button", onClick: () => setActiveTab(tab.id), className: `px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'}` },
                    react_1.default.createElement(Icon, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null, tab.label)));
            }))),
        activeTab === 'despesas' && (react_1.default.createElement(ExpensesSubsection_1.ExpensesSubsection, { expenses: expenses, onUpsertMonthExpenses: onUpsertMonthExpenses })),
        activeTab === 'colaboradores' && (react_1.default.createElement(CollaboratorsSubsection_1.CollaboratorsSubsection, { providers: serviceProviders, payrollEmployees: payrollEmployees, onAddProvider: onAddProvider, onUpdateProvider: onUpdateProvider, onDeleteProvider: onDeleteProvider, onAddPayrollEmployee: onAddPayrollEmployee, onUpdatePayrollEmployee: onUpdatePayrollEmployee, onDeletePayrollEmployee: onDeletePayrollEmployee })),
        activeTab === 'investimentos' && (react_1.default.createElement(InvestmentsSubsection_1.InvestmentsSubsection, { investments: investments, onAddInvestment: onAddInvestment, onUpdateInvestment: onUpdateInvestment, onDeleteInvestment: onDeleteInvestment })),
        activeTab === 'visao' && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5" },
                react_1.default.createElement("button", { type: "button", onClick: () => setStatusFilter(statusFilter === 'a_receber' ? 'todos' : 'a_receber'), className: `liquid-glass rounded-[28px] p-6 text-left transition cursor-pointer ${statusFilter === 'a_receber' ? 'ring-2 ring-emerald-500/70' : ''}` },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700" }, "1. Total a Receber"),
                        react_1.default.createElement("span", { className: "p-2 rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-300/60" },
                            react_1.default.createElement(lucide_react_1.CalendarClock, { className: "w-4 h-4" }))),
                    react_1.default.createElement("p", { className: "text-3xl font-black text-emerald-700 tracking-tight mt-3" }, (0, financeEngine_1.formatBRL)(financials.receivable30d)),
                    react_1.default.createElement("span", { className: "text-xs font-medium text-slate-600 mt-1 block" },
                        financials.receivableCount,
                        " faturas programadas \u2022 Caixa quitado",
                        ' ',
                        react_1.default.createElement("strong", { className: "text-slate-900" }, (0, financeEngine_1.formatBRL)(financials.paidTotal)))),
                react_1.default.createElement("button", { type: "button", onClick: () => setStatusFilter(statusFilter === 'vencido' ? 'todos' : 'vencido'), className: `liquid-glass rounded-[28px] p-6 text-left transition cursor-pointer ${statusFilter === 'vencido' ? 'ring-2 ring-indigo-500/70' : ''}` },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-slate-800 flex items-center gap-1.5" },
                            react_1.default.createElement("span", { className: "w-2 h-2 rounded-full bg-amber-500 animate-ping" }),
                            "2. Faturamentos Vencidos"),
                        react_1.default.createElement("span", { className: "p-2 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-300/60" },
                            react_1.default.createElement(lucide_react_1.AlertCircle, { className: "w-4 h-4" }))),
                    react_1.default.createElement("p", { className: "text-3xl font-black text-slate-900 tracking-tight mt-3" }, (0, financeEngine_1.formatBRL)(financials.overdueTotal)),
                    react_1.default.createElement("span", { className: "text-xs font-medium text-slate-600 mt-1 block" },
                        financials.overdueCount,
                        " t\u00EDtulos aguardando cobran\u00E7a")),
                react_1.default.createElement("button", { type: "button", onClick: () => setStatusFilter(statusFilter === 'sem_nota' ? 'todos' : 'sem_nota'), className: `liquid-glass rounded-[28px] p-6 text-left transition cursor-pointer ${statusFilter === 'sem_nota' ? 'ring-2 ring-amber-500/70' : ''}` },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("span", { className: "text-xs font-bold text-slate-700" }, "3. Entregues sem Nota"),
                        react_1.default.createElement("span", { className: "p-2 rounded-2xl bg-indigo-500/15 text-indigo-700 border border-indigo-300/60" },
                            react_1.default.createElement(lucide_react_1.FileWarning, { className: "w-4 h-4" }))),
                    react_1.default.createElement("p", { className: "text-3xl font-black text-indigo-700 tracking-tight mt-3" }, (0, financeEngine_1.formatBRL)(financials.unbilledTotal)),
                    react_1.default.createElement("span", { className: "text-xs font-medium text-slate-600 mt-1 block" },
                        financials.unbilledCount,
                        " facas entregues sem cobran\u00E7a"))),
            react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5" },
                react_1.default.createElement("div", { className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-indigo-700" }, "Distribui\u00E7\u00E3o por Modalidade"),
                            react_1.default.createElement("h3", { className: "text-base font-extrabold text-slate-900 mt-0.5" }, "Gr\u00E1fico de Rosca")),
                        react_1.default.createElement(lucide_react_1.PieChart, { className: "w-5 h-5 text-indigo-600" })),
                    react_1.default.createElement("div", { className: "flex flex-col sm:flex-row items-center justify-around gap-6 my-4" },
                        react_1.default.createElement("div", { className: "relative w-44 h-44 flex items-center justify-center shrink-0" },
                            react_1.default.createElement("svg", { className: "w-44 h-44 -rotate-90", viewBox: "0 0 180 180" },
                                react_1.default.createElement("circle", { cx: "90", cy: "90", r: radius, fill: "transparent", stroke: "rgba(255,255,255,0.55)", strokeWidth: "20" }),
                                donutSegments.map((seg) => (react_1.default.createElement("circle", { key: seg.modality, cx: "90", cy: "90", r: radius, fill: "transparent", stroke: seg.colorHex, strokeWidth: hoveredModality === seg.modality ? '24' : '20', strokeDasharray: seg.strokeDasharray, strokeDashoffset: seg.strokeDashoffset, strokeLinecap: "butt", className: "transition-all duration-300 cursor-pointer", onMouseEnter: () => setHoveredModality(seg.modality), onMouseLeave: () => setHoveredModality(null) })))),
                            react_1.default.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center px-4" },
                                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-wider text-slate-600" }, "Volume Total"),
                                react_1.default.createElement("span", { className: "text-sm font-black text-slate-900 font-mono mt-0.5" }, (0, financeEngine_1.formatBRL)(financials.totalVolume)),
                                react_1.default.createElement("span", { className: "text-[10px] text-indigo-700 font-bold mt-0.5" },
                                    orders.length,
                                    " OS"))),
                        react_1.default.createElement("div", { className: "space-y-2.5 w-full sm:w-auto" }, financials.byModality.map((item) => (react_1.default.createElement("div", { key: item.modality, onMouseEnter: () => setHoveredModality(item.modality), onMouseLeave: () => setHoveredModality(null), className: "flex items-center justify-between gap-4 text-xs cursor-pointer" },
                            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                react_1.default.createElement("span", { className: "w-3 h-3 rounded-md shrink-0", style: { backgroundColor: item.colorHex } }),
                                react_1.default.createElement("span", { className: "text-slate-700 font-semibold" }, item.label)),
                            react_1.default.createElement("span", { className: "font-mono font-extrabold text-slate-900" },
                                item.percentage,
                                "%"))))))),
                react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-indigo-700" }, "Comparativo Financeiro e Quantidade de Pedidos"),
                        react_1.default.createElement("h3", { className: "text-base font-extrabold text-slate-900 mt-0.5" }, "Volume por Forma de Pagamento")),
                    react_1.default.createElement("div", { className: "space-y-3.5 mt-4" }, financials.byModality.map((item) => (react_1.default.createElement("div", { key: item.modality, className: "space-y-1.5" },
                        react_1.default.createElement("div", { className: "flex items-center justify-between text-xs" },
                            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                react_1.default.createElement("span", { className: "w-2.5 h-2.5 rounded-full", style: { backgroundColor: item.colorHex } }),
                                react_1.default.createElement("span", { className: "font-bold text-slate-900" }, item.label),
                                react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-slate-700 text-[10px] font-bold" },
                                    item.count,
                                    " ",
                                    item.count === 1 ? 'pedido' : 'pedidos')),
                            react_1.default.createElement("div", { className: "font-mono" },
                                react_1.default.createElement("span", { className: "font-extrabold text-slate-900" }, (0, financeEngine_1.formatBRL)(item.totalAmount)),
                                react_1.default.createElement("span", { className: "text-slate-600 ml-2 text-[11px] font-semibold" },
                                    item.percentage,
                                    "%"))),
                        react_1.default.createElement("div", { className: "w-full h-3 rounded-full bg-white/50 overflow-hidden p-0.5 border border-white/75 shadow-inner" },
                            react_1.default.createElement("div", { style: {
                                    width: `${Math.max(item.count > 0 ? 6 : 0, item.percentage)}%`,
                                    backgroundColor: item.colorHex,
                                }, className: "h-full rounded-full transition-all duration-500" })))))))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] overflow-hidden" },
                react_1.default.createElement("div", { className: "p-5 border-b border-white/60 flex flex-wrap items-center justify-between gap-3" },
                    react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-1.5" }, [
                        { id: 'todos', label: 'Todos' },
                        { id: 'a_receber', label: 'A Receber' },
                        { id: 'vencido', label: 'Vencidos' },
                        { id: 'sem_nota', label: 'Entregues sem Nota' },
                        { id: 'pago', label: 'Pagos' },
                        { id: 'nao_pago', label: 'Não Pago' },
                    ].map((pill) => (react_1.default.createElement("button", { key: pill.id, type: "button", onClick: () => setStatusFilter(pill.id), className: `px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${statusFilter === pill.id
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                            : 'liquid-glass-pill text-slate-700'}` }, pill.label)))),
                    react_1.default.createElement("span", { className: "text-xs text-slate-700 font-mono font-bold" },
                        filteredOrders.length,
                        " registros")),
                react_1.default.createElement("div", { className: "overflow-x-auto" },
                    react_1.default.createElement("table", { className: "w-full text-left border-collapse" },
                        react_1.default.createElement("thead", null,
                            react_1.default.createElement("tr", { className: "text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30" },
                                react_1.default.createElement("th", { className: "py-3.5 px-5 font-extrabold" }, "OS / Empresa"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 font-extrabold" }, "Ferramenta"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 font-extrabold" }, "Modalidade"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 font-extrabold" }, "Vencimento / Status"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 text-right font-extrabold" }, "Valor"),
                                react_1.default.createElement("th", { className: "py-3.5 px-5 text-right font-extrabold" }, "A\u00E7\u00F5es"))),
                        react_1.default.createElement("tbody", { className: "divide-y divide-white/45 text-xs" }, filteredOrders.length === 0 ? (react_1.default.createElement("tr", null,
                            react_1.default.createElement("td", { colSpan: 6, className: "py-12 text-center font-medium text-slate-600" }, "Nenhum lan\u00E7amento financeiro registrado ainda."))) : (filteredOrders.map((order) => {
                            const modMeta = financeEngine_1.PAYMENT_MODALITY_META[order.paymentModality];
                            const daysDiff = (0, financeEngine_1.getDaysDiff)(order.dueDate);
                            const isCopied = copiedId === order.id;
                            return (react_1.default.createElement("tr", { key: order.id, className: "hover:bg-white/35 transition-colors" },
                                react_1.default.createElement("td", { className: "py-4 px-5 whitespace-nowrap" },
                                    react_1.default.createElement("span", { className: "font-mono font-extrabold text-indigo-700 block" }, order.id),
                                    react_1.default.createElement("span", { className: "font-bold text-slate-900" }, order.companyName)),
                                react_1.default.createElement("td", { className: "py-4 px-4 max-w-xs" },
                                    react_1.default.createElement("span", { className: "text-slate-800 font-semibold block truncate" }, order.toolDescription)),
                                react_1.default.createElement("td", { className: "py-4 px-4 whitespace-nowrap" },
                                    react_1.default.createElement("span", { className: `px-2.5 py-1 rounded-full text-[11px] font-bold border ${modMeta?.badgeClass}` }, modMeta?.label)),
                                react_1.default.createElement("td", { className: "py-4 px-4 whitespace-nowrap" }, order.paymentStatus === 'pago' ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60" },
                                    react_1.default.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-600" }),
                                    "Liquidado \u2022 ",
                                    (0, financeEngine_1.formatDateBR)(order.paidAt || order.dueDate))) : order.paymentStatus === 'nao_pago' ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/60 text-slate-700 border border-white/80" }, "N\u00E3o Pago")) : order.paymentStatus === 'sem_nota' ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-300/60" },
                                    react_1.default.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-500" }),
                                    "Entregue sem Nota")) : order.paymentStatus === 'vencido' ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-900 border border-amber-400/70" },
                                    react_1.default.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" }),
                                    "Vencido h\u00E1 ",
                                    Math.abs(daysDiff),
                                    "d \u2022 ",
                                    (0, financeEngine_1.formatDateBR)(order.dueDate))) : (react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60" },
                                    react_1.default.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-indigo-600" }),
                                    "Vence em ",
                                    daysDiff,
                                    "d \u2022 ",
                                    (0, financeEngine_1.formatDateBR)(order.dueDate)))),
                                react_1.default.createElement("td", { className: "py-4 px-4 text-right whitespace-nowrap font-mono text-sm font-black text-slate-900" }, (0, financeEngine_1.formatBRL)(order.amount)),
                                react_1.default.createElement("td", { className: "py-4 px-5 text-right whitespace-nowrap" },
                                    react_1.default.createElement("div", { className: "inline-flex items-center justify-end gap-1.5" },
                                        react_1.default.createElement("button", { type: "button", onClick: () => handleCopyPix(order), className: `px-2.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${isCopied
                                                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-800'
                                                : 'liquid-glass-pill text-slate-800'}` }, isCopied ? (react_1.default.createElement(react_1.default.Fragment, null,
                                            react_1.default.createElement(lucide_react_1.Check, { className: "w-3.5 h-3.5 text-emerald-600" }),
                                            react_1.default.createElement("span", null, "Copiado"))) : (react_1.default.createElement(react_1.default.Fragment, null,
                                            react_1.default.createElement(lucide_react_1.Copy, { className: "w-3.5 h-3.5" }),
                                            react_1.default.createElement("span", null, "Copiar Pix")))),
                                        react_1.default.createElement("a", { href: (0, financeEngine_1.buildWhatsAppBillingUrl)(order), target: "_blank", rel: "noopener noreferrer", className: "liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 hover:text-emerald-700 flex items-center gap-1.5 transition" },
                                            react_1.default.createElement(lucide_react_1.MessageCircle, { className: "w-3.5 h-3.5 text-emerald-600" }),
                                            react_1.default.createElement("span", null, "Cobrar no WhatsApp")),
                                        order.paymentStatus === 'sem_nota' ? (react_1.default.createElement("button", { type: "button", onClick: () => onEmitBilling30d(order.id), className: "px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-sm flex items-center gap-1 transition cursor-pointer" },
                                            react_1.default.createElement(lucide_react_1.Sparkles, { className: "w-3.5 h-3.5" }),
                                            react_1.default.createElement("span", null, "Gerar 30d"))) : order.paymentStatus !== 'nao_pago' ? (react_1.default.createElement("button", { type: "button", onClick: () => onTogglePaid(order.id), className: `px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer ${order.paymentStatus === 'pago'
                                                ? 'liquid-glass-pill text-slate-700'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'}` }, order.paymentStatus === 'pago' ? (react_1.default.createElement(react_1.default.Fragment, null,
                                            react_1.default.createElement(lucide_react_1.RotateCcw, { className: "w-3 h-3" }),
                                            react_1.default.createElement("span", null, "Reabrir"))) : (react_1.default.createElement(react_1.default.Fragment, null,
                                            react_1.default.createElement(lucide_react_1.Check, { className: "w-3.5 h-3.5 stroke-[2.5]" }),
                                            react_1.default.createElement("span", null, "Marcar Pago"))))) : null,
                                        react_1.default.createElement("button", { type: "button", onClick: () => onDeleteOrder(order.id), className: "p-1.5 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Apagar esta OS" },
                                            react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }))))));
                        }))))))))));
};
exports.FinanceAnalyticsSection = FinanceAnalyticsSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/DeliveriesLogisticsSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveriesLogisticsSection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const DeliveriesLogisticsSection = ({ orders, deliveries, prefillOrder, onAddDelivery, onDeleteDelivery, }) => {
    const [selectedOrderId, setSelectedOrderId] = (0, react_1.useState)(prefillOrder?.id || orders[0]?.id || '');
    const [method, setMethod] = (0, react_1.useState)('uber_flash');
    const [carrierName, setCarrierName] = (0, react_1.useState)('');
    const [dispatchedDate, setDispatchedDate] = (0, react_1.useState)(() => (0, financeEngine_1.toISODate)());
    const [dispatchedTime, setDispatchedTime] = (0, react_1.useState)(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });
    const [notes, setNotes] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (prefillOrder) {
            setSelectedOrderId(prefillOrder.id);
        }
    }, [prefillOrder]);
    const selectedOrder = orders.find((o) => o.id === selectedOrderId);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedOrder || !carrierName.trim())
            return;
        onAddDelivery({
            orderId: selectedOrder.id,
            toolDescription: selectedOrder.toolDescription,
            companyName: selectedOrder.companyName,
            method,
            carrierOrPersonName: carrierName.trim(),
            dispatchedAt: `${dispatchedDate} ${dispatchedTime}`,
            notes: notes.trim() || undefined,
        });
        setCarrierName('');
        setNotes('');
    };
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", null,
            react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Entregas e Log\u00EDstica de Sa\u00EDda"),
            react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Protocolo digital de sa\u00EDda para rastrear quem retirou ou despachou cada ferramenta com data e hora.")),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("form", { onSubmit: handleSubmit, className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "flex items-center gap-2.5 pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700" },
                        react_1.default.createElement(lucide_react_1.Truck, { className: "w-4 h-4" })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Registrar Sa\u00EDda / Retirada de Faca"),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Marca automaticamente a OS como \"Faca Pronta\""))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "1. Ordem de Servi\u00E7o"),
                    react_1.default.createElement("select", { value: selectedOrderId, onChange: (e) => setSelectedOrderId(e.target.value), className: inputClass }, orders.map((o) => (react_1.default.createElement("option", { key: o.id, value: o.id },
                        o.id,
                        " - ",
                        o.companyName,
                        " - ",
                        o.toolDescription))))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "2. Modalidade e Respons\u00E1vel pela Retirada"),
                    react_1.default.createElement("div", { className: "grid grid-cols-2 gap-2" }, Object.keys(financeEngine_1.DELIVERY_METHOD_META).map((m) => {
                        const meta = financeEngine_1.DELIVERY_METHOD_META[m];
                        const active = method === m;
                        return (react_1.default.createElement("button", { type: "button", key: m, onClick: () => setMethod(m), className: `py-2.5 px-3 rounded-2xl text-xs font-bold border text-left transition cursor-pointer ${active
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                                : 'liquid-glass-pill text-slate-700'}` }, meta.label));
                    }))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "3. Nome do Motorista, Portador ou Placa"),
                    react_1.default.createElement("input", { type: "text", required: true, value: carrierName, onChange: (e) => setCarrierName(e.target.value), placeholder: "Ex: Motoboy Carlos, Placa FKR-4A89 ou Retirado por Marcos", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "Data da Sa\u00EDda"),
                        react_1.default.createElement("input", { type: "date", required: true, value: dispatchedDate, onChange: (e) => setDispatchedDate(e.target.value), className: `${inputClass} font-mono` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "Hora Exata"),
                        react_1.default.createElement("input", { type: "time", required: true, value: dispatchedTime, onChange: (e) => setDispatchedTime(e.target.value), className: `${inputClass} font-mono` }))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "Observa\u00E7\u00E3o de Expedi\u00E7\u00E3o"),
                    react_1.default.createElement("input", { type: "text", value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Ex: Canhoto assinado, entregue com prote\u00E7\u00E3o de borracha", className: inputClass })),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95" },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4 stroke-[2.5]" }),
                    react_1.default.createElement("span", null, "Confirmar Registro de Sa\u00EDda"))),
            react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Hist\u00F3rico de Entregas e Retiradas"),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-600" }, "Rastreabilidade completa contra extravio de ferramentas")),
                    react_1.default.createElement("span", { className: "px-2.5 py-1 rounded-full bg-white/65 border border-white/80 text-xs font-extrabold text-slate-800" }, deliveries.length)),
                react_1.default.createElement("div", { className: "space-y-3" }, deliveries.length === 0 ? (react_1.default.createElement("div", { className: "p-10 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhuma entrega ou retirada registrada ainda.")) : (deliveries.map((del) => {
                    const meta = financeEngine_1.DELIVERY_METHOD_META[del.method];
                    return (react_1.default.createElement("div", { key: del.id, className: "p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3" },
                        react_1.default.createElement("div", { className: "space-y-1" },
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                                react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800" }, del.orderId),
                                react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900" }, del.companyName),
                                react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta?.badgeClass}` }, meta?.label)),
                            react_1.default.createElement("p", { className: "text-xs text-slate-800 font-semibold" }, del.toolDescription),
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5" },
                                react_1.default.createElement("span", { className: "flex items-center gap-1 text-slate-900 font-bold" },
                                    react_1.default.createElement(lucide_react_1.UserCheck, { className: "w-3.5 h-3.5 text-indigo-600" }),
                                    del.carrierOrPersonName),
                                del.notes && (react_1.default.createElement("span", { className: "flex items-center gap-1 text-slate-600" },
                                    react_1.default.createElement(lucide_react_1.MapPin, { className: "w-3 h-3" }),
                                    del.notes)))),
                        react_1.default.createElement("div", { className: "flex items-center justify-between sm:justify-end gap-2 shrink-0" },
                            react_1.default.createElement("div", { className: "sm:text-right font-mono bg-white/55 px-3 py-2 rounded-2xl border border-white/75" },
                                react_1.default.createElement("span", { className: "text-[10px] uppercase font-bold text-slate-600 block" }, "Sa\u00EDda Registrada"),
                                react_1.default.createElement("span", { className: "text-xs font-extrabold text-emerald-700 flex items-center sm:justify-end gap-1 mt-0.5" },
                                    react_1.default.createElement(lucide_react_1.Clock, { className: "w-3 h-3" }),
                                    del.dispatchedAt)),
                            react_1.default.createElement("button", { type: "button", onClick: () => onDeleteDelivery(del.id), className: "p-2.5 rounded-2xl bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Apagar registro de entrega" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4" })))));
                })))))));
};
exports.DeliveriesLogisticsSection = DeliveriesLogisticsSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/WarrantyReturnsSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantyReturnsSection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const WarrantyReturnsSection = ({ orders, returns, onAddReturn, onUpdateReturnStatus, onDeleteReturn, }) => {
    const [selectedOrderId, setSelectedOrderId] = (0, react_1.useState)(orders[0]?.id || '');
    const [reason, setReason] = (0, react_1.useState)('');
    const [technicalAction, setTechnicalAction] = (0, react_1.useState)('');
    const [adjustmentAmount, setAdjustmentAmount] = (0, react_1.useState)('0');
    const [status, setStatus] = (0, react_1.useState)('em_analise');
    const selectedOrder = orders.find((o) => o.id === selectedOrderId);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedOrder || !reason.trim() || !technicalAction.trim())
            return;
        const val = parseFloat(adjustmentAmount.replace(',', '.')) || 0;
        onAddReturn({
            orderId: selectedOrder.id,
            companyName: selectedOrder.companyName,
            toolDescription: selectedOrder.toolDescription,
            reason: reason.trim(),
            technicalAction: technicalAction.trim(),
            adjustmentAmount: val,
            status,
            createdAt: `${(0, financeEngine_1.toISODate)()}`,
            updatedAt: (0, financeEngine_1.nowTimestampBR)(),
        });
        setReason('');
        setTechnicalAction('');
        setAdjustmentAmount('0');
        setStatus('em_analise');
    };
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", null,
            react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Retornos e Ajustes"),
            react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Controle t\u00E9cnico de facas que retornaram para ajuste de vinco, reparo de l\u00E2mina ou modifica\u00E7\u00E3o solicitada pelo cliente.")),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("form", { onSubmit: handleSubmit, className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "flex items-center gap-2.5 pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-300/60 flex items-center justify-center text-amber-700" },
                        react_1.default.createElement(lucide_react_1.Wrench, { className: "w-4 h-4" })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Registrar Retorno / Ajuste de Faca"),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Documente o motivo, o servi\u00E7o executado e eventual custo adicional"))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "1. OS Original e Empresa Cliente"),
                    react_1.default.createElement("select", { value: selectedOrderId, onChange: (e) => setSelectedOrderId(e.target.value), className: inputClass }, orders.map((o) => (react_1.default.createElement("option", { key: o.id, value: o.id },
                        o.id,
                        " - ",
                        o.companyName,
                        " - ",
                        o.toolDescription))))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "2. Motivo do Retorno"),
                    react_1.default.createElement("input", { type: "text", required: true, value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Ex: Ajuste de vinco, L\u00E2mina fora de esquadro, Erro de medida", className: inputClass })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "3. Descri\u00E7\u00E3o T\u00E9cnica do Reparo"),
                    react_1.default.createElement("textarea", { rows: 3, required: true, value: technicalAction, onChange: (e) => setTechnicalAction(e.target.value), placeholder: "Descreva a troca de l\u00E2mina, calibragem de altura, borracha ejetora ou abertura de rasgo", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "4. Valor do Ajuste em R$"),
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0", value: adjustmentAmount, onChange: (e) => setAdjustmentAmount(e.target.value), placeholder: "0,00", className: `${inputClass} font-mono font-bold` }),
                        react_1.default.createElement("span", { className: "text-[10px] font-medium text-slate-600 mt-0.5 block" }, "Use R$ 0,00 para ajuste em garantia sem custo")),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "5. Status do Retorno"),
                        react_1.default.createElement("select", { value: status, onChange: (e) => setStatus(e.target.value), className: inputClass }, Object.entries(financeEngine_1.RETURN_STATUS_META).map(([k, v]) => (react_1.default.createElement("option", { key: k, value: k }, v.label)))))),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95" },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4 stroke-[2.5]" }),
                    react_1.default.createElement("span", null, "Registrar Ocorr\u00EAncia de Retorno"))),
            react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" },
                            "Facas em Retorno / Hist\u00F3rico de Ajustes (",
                            returns.length,
                            ")"),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-600" }, "Acompanhe o diagn\u00F3stico t\u00E9cnico e libere novamente para o cliente")),
                    react_1.default.createElement(lucide_react_1.ShieldAlert, { className: "w-5 h-5 text-amber-600" })),
                react_1.default.createElement("div", { className: "space-y-3.5" }, returns.length === 0 ? (react_1.default.createElement("div", { className: "p-10 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" }, "Nenhum retorno ou ajuste registrado ainda.")) : (returns.map((ret) => {
                    const stMeta = financeEngine_1.RETURN_STATUS_META[ret.status];
                    return (react_1.default.createElement("div", { key: ret.id, className: "p-5 rounded-3xl liquid-glass-subtle space-y-3" },
                        react_1.default.createElement("div", { className: "flex flex-wrap items-start justify-between gap-2" },
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                    react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800" }, ret.orderId),
                                    react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900" }, ret.companyName),
                                    react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${stMeta.badgeClass}` },
                                        react_1.default.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${stMeta.dotClass}` }),
                                        stMeta.label)),
                                react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700 mt-1" }, ret.toolDescription)),
                            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                react_1.default.createElement("div", { className: "text-right font-mono" },
                                    react_1.default.createElement("span", { className: `text-sm font-black block ${ret.adjustmentAmount === 0
                                            ? 'text-emerald-700'
                                            : 'text-amber-700'}` }, ret.adjustmentAmount === 0
                                        ? 'R$ 0,00 Garantia'
                                        : `Ajuste: ${(0, financeEngine_1.formatBRL)(ret.adjustmentAmount)}`),
                                    react_1.default.createElement("span", { className: "text-[10px] font-medium text-slate-600" },
                                        "Atualizado: ",
                                        ret.updatedAt)),
                                react_1.default.createElement("button", { type: "button", onClick: () => onDeleteReturn(ret.id), className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Apagar registro de retorno" },
                                    react_1.default.createElement(lucide_react_1.Trash2, { className: "w-4 h-4" })))),
                        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-xs" },
                            react_1.default.createElement("div", { className: "p-3 rounded-2xl bg-white/55 border border-white/75" },
                                react_1.default.createElement("span", { className: "text-[10px] font-extrabold uppercase text-indigo-700 block mb-0.5" }, "Motivo do Retorno:"),
                                react_1.default.createElement("p", { className: "text-slate-800 font-medium" }, ret.reason)),
                            react_1.default.createElement("div", { className: "p-3 rounded-2xl bg-white/55 border border-white/75" },
                                react_1.default.createElement("span", { className: "text-[10px] font-extrabold uppercase text-emerald-700 block mb-0.5" }, "O que foi feito e ajustado:"),
                                react_1.default.createElement("p", { className: "text-slate-800 font-medium" }, ret.technicalAction))),
                        react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 pt-1" },
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-1.5" }, ['em_analise', 'em_ajuste', 'liberado'].map((st) => (react_1.default.createElement("button", { key: st, type: "button", onClick: () => onUpdateReturnStatus(ret.id, st), className: `px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${ret.status === st
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-sm'
                                    : 'liquid-glass-pill text-slate-700'}` }, financeEngine_1.RETURN_STATUS_META[st].label)))),
                            stMeta.next && (react_1.default.createElement("button", { type: "button", onClick: () => onUpdateReturnStatus(ret.id, stMeta.next), className: "px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-white/40 shadow-sm flex items-center gap-1 transition cursor-pointer" },
                                react_1.default.createElement("span", null,
                                    "Avan\u00E7ar p/ ",
                                    financeEngine_1.RETURN_STATUS_META[stMeta.next].label),
                                react_1.default.createElement(lucide_react_1.ArrowRight, { className: "w-3.5 h-3.5" }))))));
                })))))));
};
exports.WarrantyReturnsSection = WarrantyReturnsSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/StockSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockSection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const CATEGORY_META = {
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
const StockSection = ({ items, globalSearchQuery, onAddItem, onUpdateItem, onDeleteItem, }) => {
    const [categoryFilter, setCategoryFilter] = (0, react_1.useState)('todos');
    const [onlyLowStock, setOnlyLowStock] = (0, react_1.useState)(false);
    const [localSearch, setLocalSearch] = (0, react_1.useState)('');
    // Form state (Create / Edit)
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const [category, setCategory] = (0, react_1.useState)('madeiras');
    const [name, setName] = (0, react_1.useState)('');
    const [quantity, setQuantity] = (0, react_1.useState)('');
    const [unit, setUnit] = (0, react_1.useState)('chapa');
    const [minStock, setMinStock] = (0, react_1.useState)('5');
    const [supplier, setSupplier] = (0, react_1.useState)('');
    const [unitCost, setUnitCost] = (0, react_1.useState)('');
    const [entryDate, setEntryDate] = (0, react_1.useState)(() => (0, financeEngine_1.toISODate)());
    const resetForm = (nextCat = 'madeiras') => {
        setEditingId(null);
        setCategory(nextCat);
        setName('');
        setQuantity('');
        setUnit(CATEGORY_META[nextCat].defaultUnit);
        setMinStock('5');
        setSupplier('');
        setUnitCost('');
        setEntryDate((0, financeEngine_1.toISODate)());
    };
    const handleSelectFormCategory = (cat) => {
        setCategory(cat);
        if (!editingId) {
            setUnit(CATEGORY_META[cat].defaultUnit);
        }
    };
    const handleStartEdit = (item) => {
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
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim())
            return;
        const payload = {
            category,
            name: name.trim(),
            quantity: Math.max(0, parseFloat(quantity.replace(',', '.')) || 0),
            unit: unit.trim() || CATEGORY_META[category].defaultUnit,
            minStock: Math.max(0, parseFloat(minStock.replace(',', '.')) || 0),
            supplier: supplier.trim() || 'Não informado',
            unitCost: Math.max(0, parseFloat(unitCost.replace(',', '.')) || 0),
            entryDate: entryDate || (0, financeEngine_1.toISODate)(),
        };
        if (editingId) {
            onUpdateItem(editingId, payload);
        }
        else {
            onAddItem(payload);
        }
        resetForm(category);
    };
    const handleQuickAdjustQuantity = (item, delta) => {
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
    const filteredItems = (0, react_1.useMemo)(() => {
        return items.filter((item) => {
            if (categoryFilter !== 'todos' && item.category !== categoryFilter) {
                return false;
            }
            if (onlyLowStock && item.quantity > item.minStock) {
                return false;
            }
            if (!combinedQuery)
                return true;
            return (item.id.toLowerCase().includes(combinedQuery) ||
                item.name.toLowerCase().includes(combinedQuery) ||
                item.supplier.toLowerCase().includes(combinedQuery) ||
                item.unit.toLowerCase().includes(combinedQuery) ||
                CATEGORY_META[item.category].shortLabel
                    .toLowerCase()
                    .includes(combinedQuery));
        });
    }, [items, categoryFilter, onlyLowStock, combinedQuery]);
    const madeirasItems = filteredItems.filter((i) => i.category === 'madeiras');
    const laminasItems = filteredItems.filter((i) => i.category === 'laminas');
    const totalMadeirasCount = items.filter((i) => i.category === 'madeiras').length;
    const totalLaminasCount = items.filter((i) => i.category === 'laminas').length;
    const lowMadeirasCount = items.filter((i) => i.category === 'madeiras' && i.quantity <= i.minStock).length;
    const lowLaminasCount = items.filter((i) => i.category === 'laminas' && i.quantity <= i.minStock).length;
    const totalStockValue = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    const renderCategoryBlock = (catKey, catItems) => {
        const meta = CATEGORY_META[catKey];
        const catLowCount = catItems.filter((i) => i.quantity <= i.minStock).length;
        return (react_1.default.createElement("div", { key: catKey, className: "liquid-glass rounded-[28px] p-6 space-y-4" },
            react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/60" },
                react_1.default.createElement("div", { className: "flex items-center gap-2.5" },
                    react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700" }, catKey === 'madeiras' ? (react_1.default.createElement(lucide_react_1.Layers, { className: "w-4 h-4" })) : (react_1.default.createElement(lucide_react_1.Boxes, { className: "w-4 h-4" }))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" },
                            meta.label,
                            " (",
                            catItems.length,
                            ")"),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, meta.description))),
                catLowCount > 0 && (react_1.default.createElement("span", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70" },
                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-3.5 h-3.5 text-amber-700" }),
                    catLowCount,
                    " em falta / m\u00EDnimo"))),
            catItems.length === 0 ? (react_1.default.createElement("div", { className: "p-8 rounded-2xl border border-dashed border-white/70 text-center text-xs font-medium text-slate-600" },
                "Nenhum item encontrado em ",
                meta.shortLabel,
                ".")) : (react_1.default.createElement("div", { className: "space-y-3" }, catItems.map((item) => {
                const isLow = item.quantity <= item.minStock;
                const isBeingEdited = editingId === item.id;
                const totalValue = item.quantity * item.unitCost;
                return (react_1.default.createElement("div", { key: item.id, className: `p-4 rounded-2xl liquid-glass-subtle transition flex flex-col gap-3 ${isLow
                        ? 'ring-2 ring-amber-400/80 bg-amber-500/10'
                        : ''} ${isBeingEdited ? 'ring-2 ring-indigo-500/80' : ''}` },
                    react_1.default.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" },
                        react_1.default.createElement("div", { className: "space-y-1 min-w-0" },
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                                react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-[11px] font-bold text-indigo-800" }, item.id),
                                react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}` }, meta.shortLabel),
                                isLow ? (react_1.default.createElement("span", { className: "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/25 text-amber-900 border border-amber-400/70" },
                                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-3 h-3 text-amber-700" }),
                                    "Estoque Baixo (\u2264 ",
                                    item.minStock,
                                    " ",
                                    item.unit,
                                    ")")) : (react_1.default.createElement("span", { className: "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60" }, "OK"))),
                            react_1.default.createElement("h4", { className: "text-sm font-extrabold text-slate-900 leading-snug" }, item.name),
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-700" },
                                react_1.default.createElement("span", null,
                                    "Fornecedor:",
                                    ' ',
                                    react_1.default.createElement("strong", { className: "text-slate-900" }, item.supplier)),
                                react_1.default.createElement("span", null, "\u2022"),
                                react_1.default.createElement("span", null,
                                    "Entrada:",
                                    ' ',
                                    react_1.default.createElement("strong", { className: "font-mono text-slate-900" }, (0, financeEngine_1.formatDateBR)(item.entryDate))),
                                react_1.default.createElement("span", null, "\u2022"),
                                react_1.default.createElement("span", null,
                                    "Custo unit.:",
                                    ' ',
                                    react_1.default.createElement("strong", { className: "font-mono text-emerald-700" },
                                        (0, financeEngine_1.formatBRL)(item.unitCost),
                                        "/",
                                        item.unit)))),
                        react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2 shrink-0" },
                            react_1.default.createElement("div", { className: "flex items-center gap-1.5 bg-white/60 border border-white/80 rounded-2xl px-2.5 py-1.5" },
                                react_1.default.createElement("button", { type: "button", onClick: () => handleQuickAdjustQuantity(item, -1), className: "w-6 h-6 rounded-full bg-white/80 hover:bg-indigo-600 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer", title: "Baixar 1 unidade" },
                                    react_1.default.createElement(lucide_react_1.Minus, { className: "w-3 h-3" })),
                                react_1.default.createElement("div", { className: "px-2 text-center min-w-[68px]" },
                                    react_1.default.createElement("span", { className: `text-sm font-black font-mono block leading-none ${isLow ? 'text-amber-800' : 'text-slate-900'}` },
                                        item.quantity,
                                        " ",
                                        item.unit),
                                    react_1.default.createElement("span", { className: "text-[10px] font-semibold text-slate-600" },
                                        "M\u00EDn: ",
                                        item.minStock)),
                                react_1.default.createElement("button", { type: "button", onClick: () => handleQuickAdjustQuantity(item, 1), className: "w-6 h-6 rounded-full bg-white/80 hover:bg-indigo-600 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer", title: "Adicionar 1 unidade" },
                                    react_1.default.createElement(lucide_react_1.Plus, { className: "w-3 h-3" }))),
                            react_1.default.createElement("div", { className: "text-right font-mono px-2" },
                                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase text-slate-600 block" }, "Subtotal"),
                                react_1.default.createElement("span", { className: "text-xs font-extrabold text-slate-900" }, (0, financeEngine_1.formatBRL)(totalValue))),
                            react_1.default.createElement("button", { type: "button", onClick: () => handleStartEdit(item), className: "p-2 rounded-full bg-white/60 hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-700 border border-white/75 transition cursor-pointer", title: "Editar item" },
                                react_1.default.createElement(lucide_react_1.Edit3, { className: "w-3.5 h-3.5" })),
                            react_1.default.createElement("button", { type: "button", onClick: () => {
                                    if (editingId === item.id)
                                        resetForm(category);
                                    onDeleteItem(item.id);
                                }, className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Excluir item" },
                                react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }))))));
            })))));
    };
    return (react_1.default.createElement("div", { className: "space-y-5" },
        react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Estoque de Madeiras e L\u00E2minas"),
                react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Controle de insumos da oficina com alertas de estoque m\u00EDnimo, fornecedores e custo unit\u00E1rio.")),
            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                react_1.default.createElement("span", { className: "liquid-glass-pill px-3.5 py-2 rounded-full text-xs font-bold text-slate-800" },
                    "Itens: ",
                    react_1.default.createElement("strong", { className: "text-indigo-700" }, items.length)),
                react_1.default.createElement("span", { className: "liquid-glass-pill px-3.5 py-2 rounded-full text-xs font-bold text-slate-800" },
                    "Valor em Estoque:",
                    ' ',
                    react_1.default.createElement("strong", { className: "text-emerald-700 font-mono" }, (0, financeEngine_1.formatBRL)(totalStockValue))),
                (lowMadeirasCount + lowLaminasCount > 0) && (react_1.default.createElement("span", { className: "px-3.5 py-2 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-900 border border-amber-400/70 inline-flex items-center gap-1.5" },
                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-3.5 h-3.5 text-amber-700" }),
                    lowMadeirasCount + lowLaminasCount,
                    " em alerta")))),
        react_1.default.createElement("div", { className: "liquid-glass rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3" },
            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                react_1.default.createElement("button", { type: "button", onClick: () => setCategoryFilter('todos'), className: `px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${categoryFilter === 'todos'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'}` },
                    "Todas (",
                    items.length,
                    ")"),
                react_1.default.createElement("button", { type: "button", onClick: () => setCategoryFilter('madeiras'), className: `px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${categoryFilter === 'madeiras'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'}` },
                    "1. Madeiras (",
                    totalMadeirasCount,
                    ")"),
                react_1.default.createElement("button", { type: "button", onClick: () => setCategoryFilter('laminas'), className: `px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${categoryFilter === 'laminas'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                        : 'liquid-glass-pill text-slate-700'}` },
                    "2. L\u00E2minas (",
                    totalLaminasCount,
                    ")"),
                react_1.default.createElement("button", { type: "button", onClick: () => setOnlyLowStock((prev) => !prev), className: `px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${onlyLowStock
                        ? 'bg-amber-500 text-white border-white/40 shadow-md'
                        : 'liquid-glass-pill text-amber-800'}` },
                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "w-3.5 h-3.5" }),
                    react_1.default.createElement("span", null,
                        "Em falta (",
                        lowMadeirasCount + lowLaminasCount,
                        ")"))),
            react_1.default.createElement("div", { className: "relative w-full sm:w-72" },
                react_1.default.createElement(lucide_react_1.Search, { className: "w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" }),
                react_1.default.createElement("input", { type: "text", value: localSearch, onChange: (e) => setLocalSearch(e.target.value), placeholder: "Filtrar insumo, fornecedor...", className: "liquid-glass-pill w-full pl-10 pr-8 py-2 rounded-full text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none" }),
                localSearch && (react_1.default.createElement("button", { type: "button", onClick: () => setLocalSearch(''), className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer" }, "\u2715")))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" },
            react_1.default.createElement("form", { onSubmit: handleSubmit, className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "flex items-center justify-between gap-2 pb-3 border-b border-white/60" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2.5" },
                        react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700" },
                            react_1.default.createElement(lucide_react_1.Package, { className: "w-4 h-4" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, editingId
                                ? `Editar Item (${editingId})`
                                : 'Cadastrar Item no Estoque'),
                            react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Madeiras e L\u00E2minas com controle de m\u00EDnimo"))),
                    editingId && (react_1.default.createElement("button", { type: "button", onClick: () => resetForm(category), className: "p-2 rounded-full liquid-glass-pill text-slate-600 hover:text-slate-900 cursor-pointer", title: "Cancelar edi\u00E7\u00E3o" },
                        react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" })))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "1. Categoria *"),
                    react_1.default.createElement("div", { className: "grid grid-cols-2 gap-2" }, ['madeiras', 'laminas'].map((cat) => {
                        const active = category === cat;
                        return (react_1.default.createElement("button", { type: "button", key: cat, onClick: () => handleSelectFormCategory(cat), className: `py-2.5 px-3 rounded-2xl text-xs font-bold border transition cursor-pointer ${active
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                                : 'liquid-glass-pill text-slate-700'}` }, CATEGORY_META[cat].label));
                    }))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "2. Nome / Tipo do Material *"),
                    react_1.default.createElement("input", { type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: category === 'madeiras'
                            ? 'Ex: Compensado Naval 18mm (1,20x2,40m)'
                            : 'Ex: Lâmina Corte 2pt 23.8mm Bohler', className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-3 gap-2.5" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "Quantidade *"),
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0", required: true, value: quantity, onChange: (e) => setQuantity(e.target.value), placeholder: "Ex: 12", className: `${inputClass} font-mono font-bold` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "Unidade *"),
                        react_1.default.createElement("input", { type: "text", required: true, value: unit, onChange: (e) => setUnit(e.target.value), placeholder: "chapa / m", className: inputClass })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "M\u00EDnimo *"),
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0", required: true, value: minStock, onChange: (e) => setMinStock(e.target.value), placeholder: "Ex: 5", className: `${inputClass} font-mono font-bold` }))),
                react_1.default.createElement("div", { className: "flex flex-wrap gap-1.5" }, CATEGORY_META[category].unitPresets.map((preset) => (react_1.default.createElement("button", { type: "button", key: preset, onClick: () => setUnit(preset), className: `px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${unit === preset
                        ? 'bg-indigo-600 text-white'
                        : 'liquid-glass-pill text-slate-700'}` }, preset)))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "4. Fornecedor *"),
                    react_1.default.createElement("input", { type: "text", required: true, value: supplier, onChange: (e) => setSupplier(e.target.value), placeholder: "Ex: Madeireira Brasil / A\u00E7oCut", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "5. Custo Unit\u00E1rio (R$) *"),
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0", required: true, value: unitCost, onChange: (e) => setUnitCost(e.target.value), placeholder: "Ex: 145,00", className: `${inputClass} font-mono font-bold` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "6. Data de Entrada *"),
                        react_1.default.createElement("input", { type: "date", required: true, value: entryDate, onChange: (e) => setEntryDate(e.target.value), className: `${inputClass} font-mono` }))),
                react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95" },
                    react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4 stroke-[2.5]" }),
                    react_1.default.createElement("span", null, editingId ? `Salvar Alterações (${editingId})` : 'Adicionar ao Estoque'))),
            react_1.default.createElement("div", { className: "lg:col-span-7 space-y-5" },
                (categoryFilter === 'todos' || categoryFilter === 'madeiras') &&
                    renderCategoryBlock('madeiras', madeirasItems),
                (categoryFilter === 'todos' || categoryFilter === 'laminas') &&
                    renderCategoryBlock('laminas', laminasItems)))));
};
exports.StockSection = StockSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/NotesSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesSection = exports.CanhotoSlipCard = void 0;
exports.chunkNoteItems = chunkNoteItems;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const NOTE_STATUS_META = {
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
function chunkNoteItems(items, size = 6) {
    if (!items || items.length === 0)
        return [[]];
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}
const CanhotoSlipCard = ({ note, itemsChunk, slipIndex, totalSlips, tenantName, isPrintMode = false, }) => {
    const slipTotal = itemsChunk.reduce((sum, it) => sum + (it.total || 0), 0);
    const formattedNum = String(note.numero).padStart(4, '0');
    return (react_1.default.createElement("div", { className: isPrintMode
            ? 'canhoto-slip flex flex-col justify-between bg-white text-black'
            : 'canhoto-slip-screen rounded-md shadow-md border border-slate-300 flex flex-col justify-between bg-white text-black', style: { fontSize: '9pt', color: '#000000', backgroundColor: '#ffffff' } },
        react_1.default.createElement("div", { className: "flex-1 flex flex-col justify-between p-2", style: { border: '1px solid #000000' } },
            react_1.default.createElement("div", { className: "flex items-start justify-between gap-2 pb-1.5", style: { borderBottom: '1px solid #000000' } },
                react_1.default.createElement("div", { className: "min-w-0" },
                    react_1.default.createElement("div", { className: "font-bold uppercase tracking-wide", style: { fontSize: '11pt', lineHeight: 1.2 } },
                        tenantName || 'Qualifacas',
                        " \u2014 Canhoto de Entrega N\u00BA ",
                        formattedNum,
                        totalSlips > 1 ? ` (${slipIndex + 1}/${totalSlips})` : ''),
                    react_1.default.createElement("div", { className: "mt-0.5", style: { fontSize: '9pt' } },
                        react_1.default.createElement("strong", null, "Cliente:"),
                        " ",
                        note.clienteNome,
                        " \u2022",
                        ' ',
                        react_1.default.createElement("strong", null, "CNPJ:"),
                        " ",
                        note.cnpj),
                    react_1.default.createElement("div", { style: { fontSize: '9pt' } },
                        react_1.default.createElement("strong", null, "Contato:"),
                        " ",
                        note.contato,
                        note.endereco ? ` • Endereço: ${note.endereco}` : '')),
                react_1.default.createElement("div", { className: "text-right shrink-0", style: { fontSize: '9pt' } },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("strong", null, "Emiss\u00E3o:"),
                        " ",
                        (0, financeEngine_1.formatDateBR)(note.data)),
                    note.osId && (react_1.default.createElement("div", null,
                        react_1.default.createElement("strong", null, "OS:"),
                        " ",
                        note.osId)))),
            react_1.default.createElement("div", { className: "flex-1 py-1" },
                react_1.default.createElement("table", { className: "w-full border-collapse text-left", style: { fontSize: '9pt' } },
                    react_1.default.createElement("thead", null,
                        react_1.default.createElement("tr", { style: { borderBottom: '1px solid #000000' } },
                            react_1.default.createElement("th", { className: "py-0.5 pr-2 font-bold" }, "Descri\u00E7\u00E3o"),
                            react_1.default.createElement("th", { className: "py-0.5 px-2 font-bold text-right w-14" }, "Qtd."),
                            react_1.default.createElement("th", { className: "py-0.5 px-2 font-bold text-right w-24" }, "Unit\u00E1rio"),
                            react_1.default.createElement("th", { className: "py-0.5 pl-2 font-bold text-right w-24" }, "Total"))),
                    react_1.default.createElement("tbody", null, itemsChunk.map((item) => (react_1.default.createElement("tr", { key: item.id, style: { borderBottom: '1px solid #d4d4d8' } },
                        react_1.default.createElement("td", { className: "py-0.5 pr-2 truncate max-w-[95mm]" }, item.descricao),
                        react_1.default.createElement("td", { className: "py-0.5 px-2 text-right font-mono" }, item.quantidade),
                        react_1.default.createElement("td", { className: "py-0.5 px-2 text-right font-mono" }, (0, financeEngine_1.formatBRL)(item.precoUnitario)),
                        react_1.default.createElement("td", { className: "py-0.5 pl-2 text-right font-mono font-bold" }, (0, financeEngine_1.formatBRL)(item.total)))))),
                    react_1.default.createElement("tfoot", null,
                        react_1.default.createElement("tr", { style: { borderTop: '1px solid #000000' } },
                            react_1.default.createElement("td", { colSpan: 3, className: "pt-1 text-right font-bold" }, totalSlips > 1
                                ? `Subtotal folha (${slipIndex + 1}/${totalSlips}) / Total Geral (${(0, financeEngine_1.formatBRL)(note.total)}):`
                                : 'Total Geral:'),
                            react_1.default.createElement("td", { className: "pt-1 pl-2 text-right font-mono font-bold", style: { fontSize: '10pt' } }, (0, financeEngine_1.formatBRL)(totalSlips > 1 ? slipTotal : note.total)))))),
            react_1.default.createElement("div", { className: "pt-1.5 grid grid-cols-12 gap-2 items-end", style: { borderTop: '1px solid #000000', fontSize: '9pt' } },
                react_1.default.createElement("div", { className: "col-span-4" },
                    react_1.default.createElement("div", { className: "h-3.5", style: { borderBottom: '1px solid #000000' } }),
                    react_1.default.createElement("span", null, "Recebido por (nome leg\u00EDvel)")),
                react_1.default.createElement("div", { className: "col-span-4" },
                    react_1.default.createElement("div", { className: "h-3.5", style: { borderBottom: '1px solid #000000' } }),
                    react_1.default.createElement("span", null, "Assinatura do cliente")),
                react_1.default.createElement("div", { className: "col-span-2" },
                    react_1.default.createElement("div", { className: "h-3.5", style: { borderBottom: '1px solid #000000' } }),
                    react_1.default.createElement("span", null, "Data do recebimento")),
                react_1.default.createElement("div", { className: "col-span-2" },
                    react_1.default.createElement("div", { className: "h-3.5 truncate", style: { borderBottom: '1px solid #000000' } }, note.entreguePor || ''),
                    react_1.default.createElement("span", null, "Entregue por")))),
        react_1.default.createElement("div", { className: "pt-1 text-center", style: { fontSize: '9pt' } },
            react_1.default.createElement("div", { className: "w-full", style: { borderTop: '1px dashed #000000' } }),
            react_1.default.createElement("span", { className: "inline-block bg-white px-2 -mt-2.5 text-[8.5pt] font-semibold tracking-wider uppercase" }, "Corte aqui"))));
};
exports.CanhotoSlipCard = CanhotoSlipCard;
const NotesSection = ({ notas, companies, orders, nextNoteNumber, tenantName, globalSearchQuery, onSaveNote, onMarkNotePrinted, onDeleteNote, onTriggerPrint, }) => {
    const [viewMode, setViewMode] = (0, react_1.useState)('list');
    const [editingId, setEditingId] = (0, react_1.useState)(undefined);
    const [previewNoteId, setPreviewNoteId] = (0, react_1.useState)(null);
    // Form states
    const [numero, setNumero] = (0, react_1.useState)(nextNoteNumber);
    const [data, setData] = (0, react_1.useState)(() => (0, financeEngine_1.toISODate)());
    const [selectedCompanyId, setSelectedCompanyId] = (0, react_1.useState)('manual');
    const [selectedOrderId, setSelectedOrderId] = (0, react_1.useState)('');
    const [clienteNome, setClienteNome] = (0, react_1.useState)('');
    const [cnpj, setCnpj] = (0, react_1.useState)('');
    const [contatoNome, setContatoNome] = (0, react_1.useState)('');
    const [contatoTelefone, setContatoTelefone] = (0, react_1.useState)('');
    const [endereco, setEndereco] = (0, react_1.useState)('');
    const [entreguePor, setEntreguePor] = (0, react_1.useState)('');
    const [status, setStatus] = (0, react_1.useState)('emitida');
    const [items, setItems] = (0, react_1.useState)([
        { id: 'IT-1', descricao: '', quantidade: 1, precoUnitario: 0, total: 0 },
    ]);
    const [formError, setFormError] = (0, react_1.useState)(null);
    const openNewForm = () => {
        setEditingId(undefined);
        setNumero(nextNoteNumber);
        setData((0, financeEngine_1.toISODate)());
        setSelectedCompanyId(companies[0]?.id || 'manual');
        setSelectedOrderId('');
        if (companies[0]) {
            setClienteNome(companies[0].corporateName);
            setCnpj((0, financeEngine_1.formatCnpjMask)(companies[0].cnpj));
            setContatoNome(companies[0].contactName);
            setContatoTelefone((0, financeEngine_1.formatPhoneMask)(companies[0].phone));
        }
        else {
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
    const openEditForm = (note) => {
        setEditingId(note.id);
        setNumero(note.numero);
        setData(note.data);
        setSelectedCompanyId(note.empresaId || 'manual');
        setSelectedOrderId(note.osId || '');
        setClienteNome(note.clienteNome);
        setCnpj((0, financeEngine_1.formatCnpjMask)(note.cnpj));
        const parts = note.contato.split(' - ');
        setContatoNome(parts[0] || '');
        setContatoTelefone(parts[1] ? (0, financeEngine_1.formatPhoneMask)(parts[1]) : '');
        setEndereco(note.endereco || '');
        setEntreguePor(note.entreguePor || '');
        setStatus(note.status);
        setItems(note.items.length > 0
            ? note.items
            : [{ id: `IT-${Date.now()}`, descricao: '', quantidade: 1, precoUnitario: 0, total: 0 }]);
        setFormError(null);
        setViewMode('form');
    };
    const handleCompanySelect = (compId) => {
        setSelectedCompanyId(compId);
        if (compId === 'manual')
            return;
        const comp = companies.find((c) => c.id === compId);
        if (comp) {
            setClienteNome(comp.corporateName);
            setCnpj((0, financeEngine_1.formatCnpjMask)(comp.cnpj));
            setContatoNome(comp.contactName);
            setContatoTelefone((0, financeEngine_1.formatPhoneMask)(comp.phone));
        }
    };
    const handleImportFromOrder = (orderId) => {
        setSelectedOrderId(orderId);
        if (!orderId)
            return;
        const ord = orders.find((o) => o.id === orderId);
        if (!ord)
            return;
        const comp = companies.find((c) => c.id === ord.companyId);
        if (comp) {
            setSelectedCompanyId(comp.id);
            setClienteNome(comp.corporateName);
            setCnpj((0, financeEngine_1.formatCnpjMask)(comp.cnpj));
            setContatoNome(comp.contactName);
            setContatoTelefone((0, financeEngine_1.formatPhoneMask)(comp.phone));
        }
        else {
            setSelectedCompanyId('manual');
            setClienteNome(ord.companyName);
            setContatoNome('Compras / PCP');
            setContatoTelefone((0, financeEngine_1.formatPhoneMask)(ord.companyPhone));
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
    const updateRow = (idx, field, value) => {
        setItems((prev) => prev.map((row, i) => {
            if (i !== idx)
                return row;
            const nextQty = field === 'quantidade'
                ? Math.max(0, parseFloat(value.replace(',', '.')) || 0)
                : row.quantidade;
            const nextPrice = field === 'precoUnitario'
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
        }));
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
    const handleRemoveRow = (idx) => {
        setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    };
    const tableTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        if (!clienteNome.trim()) {
            setFormError('Informe o nome da empresa do cliente.');
            return;
        }
        if (!(0, financeEngine_1.isValidCNPJ)(cnpj)) {
            setFormError('CNPJ inválido. Verifique os 14 dígitos e os dígitos verificadores.');
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
        onSaveNote({
            numero,
            data: data || (0, financeEngine_1.toISODate)(),
            empresaId: selectedCompanyId !== 'manual' ? selectedCompanyId : undefined,
            clienteNome: clienteNome.trim(),
            cnpj: (0, financeEngine_1.formatCnpjMask)(cnpj),
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
        }, editingId);
        setViewMode('list');
    };
    const filteredNotas = (0, react_1.useMemo)(() => {
        const q = globalSearchQuery.trim().toLowerCase();
        if (!q)
            return notas;
        return notas.filter((n) => String(n.numero).includes(q) ||
            n.clienteNome.toLowerCase().includes(q) ||
            n.cnpj.toLowerCase().includes(q) ||
            (n.osId || '').toLowerCase().includes(q));
    }, [notas, globalSearchQuery]);
    const previewNote = notas.find((n) => n.id === previewNoteId) || null;
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-xs rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-5" },
        viewMode === 'list' && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 tracking-tight frosted-text-depth" }, "Notas e Canhotos Digitais"),
                    react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Emiss\u00E3o, visualiza\u00E7\u00E3o em tela e impress\u00E3o de canhotos em 1/3 de folha A4.")),
                react_1.default.createElement("button", { type: "button", onClick: openNewForm, className: "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-full px-5 py-2.5 inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/40 cursor-pointer" },
                    react_1.default.createElement(lucide_react_1.Plus, { className: "w-4 h-4" }),
                    react_1.default.createElement("span", null, "Nova Nota"))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] overflow-hidden" },
                react_1.default.createElement("div", { className: "overflow-x-auto" },
                    react_1.default.createElement("table", { className: "w-full text-left border-collapse" },
                        react_1.default.createElement("thead", null,
                            react_1.default.createElement("tr", { className: "text-[11px] uppercase tracking-wider text-slate-600 border-b border-white/60 bg-white/30" },
                                react_1.default.createElement("th", { className: "py-3.5 px-5 font-extrabold" }, "N\u00FAmero"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 font-extrabold" }, "Cliente"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 font-extrabold" }, "Data"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 text-right font-extrabold" }, "Total"),
                                react_1.default.createElement("th", { className: "py-3.5 px-4 font-extrabold" }, "Status"),
                                react_1.default.createElement("th", { className: "py-3.5 px-5 text-right font-extrabold" }, "A\u00E7\u00F5es"))),
                        react_1.default.createElement("tbody", { className: "divide-y divide-white/45 text-xs" }, filteredNotas.length === 0 ? (react_1.default.createElement("tr", null,
                            react_1.default.createElement("td", { colSpan: 6, className: "py-12 text-center font-medium text-slate-600" }, "Nenhuma nota emitida ainda. Clique em Nova Nota para criar o primeiro canhoto."))) : (filteredNotas.map((note) => {
                            const stMeta = NOTE_STATUS_META[note.status];
                            return (react_1.default.createElement("tr", { key: note.id, className: "hover:bg-white/35 transition-colors" },
                                react_1.default.createElement("td", { className: "py-4 px-5 font-mono font-extrabold text-indigo-700 whitespace-nowrap" },
                                    "N\u00BA ",
                                    String(note.numero).padStart(4, '0')),
                                react_1.default.createElement("td", { className: "py-4 px-4" },
                                    react_1.default.createElement("span", { className: "font-bold text-slate-900 block" }, note.clienteNome),
                                    react_1.default.createElement("span", { className: "text-[11px] font-mono text-slate-600" }, note.cnpj)),
                                react_1.default.createElement("td", { className: "py-4 px-4 font-mono text-slate-800 whitespace-nowrap" }, (0, financeEngine_1.formatDateBR)(note.data)),
                                react_1.default.createElement("td", { className: "py-4 px-4 text-right font-mono font-black text-slate-900 whitespace-nowrap" }, (0, financeEngine_1.formatBRL)(note.total)),
                                react_1.default.createElement("td", { className: "py-4 px-4 whitespace-nowrap" },
                                    react_1.default.createElement("span", { className: `px-2.5 py-1 rounded-full text-[11px] font-bold border ${stMeta.badgeClass}` }, stMeta.label)),
                                react_1.default.createElement("td", { className: "py-4 px-5 text-right whitespace-nowrap" },
                                    react_1.default.createElement("div", { className: "inline-flex items-center gap-1.5" },
                                        react_1.default.createElement("button", { type: "button", onClick: () => {
                                                setPreviewNoteId(note.id);
                                                setViewMode('preview');
                                            }, className: "liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer" },
                                            react_1.default.createElement(lucide_react_1.Eye, { className: "w-3.5 h-3.5 text-indigo-600" }),
                                            react_1.default.createElement("span", null, "Visualizar")),
                                        react_1.default.createElement("button", { type: "button", onClick: () => openEditForm(note), className: "liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer" },
                                            react_1.default.createElement(lucide_react_1.Edit3, { className: "w-3.5 h-3.5 text-indigo-600" }),
                                            react_1.default.createElement("span", null, "Editar")),
                                        react_1.default.createElement("button", { type: "button", onClick: () => {
                                                onMarkNotePrinted(note.id);
                                                onTriggerPrint(note, false);
                                            }, className: "px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1 cursor-pointer" },
                                            react_1.default.createElement(lucide_react_1.Printer, { className: "w-3.5 h-3.5" }),
                                            react_1.default.createElement("span", null, "Imprimir")),
                                        react_1.default.createElement("button", { type: "button", onClick: () => onDeleteNote(note.id), className: "p-1.5 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 cursor-pointer", title: "Excluir nota" },
                                            react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }))))));
                        })))))))),
        viewMode === 'form' && (react_1.default.createElement("form", { onSubmit: handleSubmit, className: "space-y-5" },
            react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
                react_1.default.createElement("div", { className: "flex items-center gap-3" },
                    react_1.default.createElement("button", { type: "button", onClick: () => setViewMode('list'), className: "liquid-glass-pill p-2.5 rounded-full text-slate-800 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.ArrowLeft, { className: "w-4 h-4" })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h2", { className: "text-lg font-extrabold text-slate-900 frosted-text-depth" }, editingId
                            ? `Editar Nota Nº ${String(numero).padStart(4, '0')}`
                            : `Nova Nota Nº ${String(numero).padStart(4, '0')}`),
                        react_1.default.createElement("p", { className: "text-xs font-medium text-slate-700" }, "Preencha manualmente ou importe direto de uma OS existente"))),
                react_1.default.createElement("div", { className: "w-full sm:w-80" },
                    react_1.default.createElement("select", { value: selectedOrderId, onChange: (e) => handleImportFromOrder(e.target.value), className: inputClass },
                        react_1.default.createElement("option", { value: "" }, "Importar de OS existente..."),
                        orders.map((o) => (react_1.default.createElement("option", { key: o.id, value: o.id },
                            o.id,
                            " - ",
                            o.companyName,
                            " - ",
                            o.toolDescription)))))),
            formError && (react_1.default.createElement("div", { className: "p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300/70 text-rose-800 text-xs font-bold flex items-center gap-2" },
                react_1.default.createElement(lucide_react_1.AlertCircle, { className: "w-4 h-4 shrink-0" }),
                react_1.default.createElement("span", null, formError))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "N\u00FAmero da Nota"),
                        react_1.default.createElement("input", { type: "text", readOnly: true, value: `Nº ${String(numero).padStart(4, '0')}`, className: `${inputClass} font-mono font-extrabold bg-white/60` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Data de Emiss\u00E3o"),
                        react_1.default.createElement("input", { type: "date", required: true, value: data, onChange: (e) => setData(e.target.value), className: `${inputClass} font-mono` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Empresa Cadastrada"),
                        react_1.default.createElement("select", { value: selectedCompanyId, onChange: (e) => handleCompanySelect(e.target.value), className: inputClass },
                            react_1.default.createElement("option", { value: "manual" }, "Digitar cliente manualmente"),
                            companies.map((c) => (react_1.default.createElement("option", { key: c.id, value: c.id }, c.corporateName))))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Status"),
                        react_1.default.createElement("select", { value: status, onChange: (e) => setStatus(e.target.value), className: inputClass }, Object.entries(NOTE_STATUS_META).map(([k, v]) => (react_1.default.createElement("option", { key: k, value: k }, v.label)))))),
                react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Raz\u00E3o Social / Cliente"),
                        react_1.default.createElement("input", { type: "text", required: true, value: clienteNome, onChange: (e) => setClienteNome(e.target.value), placeholder: "Nome da empresa cliente", className: inputClass })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "CNPJ"),
                        react_1.default.createElement("input", { type: "text", required: true, value: cnpj, onChange: (e) => setCnpj((0, financeEngine_1.formatCnpjMask)(e.target.value)), placeholder: "00.000.000/0000-00", className: `${inputClass} font-mono` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Entregue por"),
                        react_1.default.createElement("input", { type: "text", value: entreguePor, onChange: (e) => setEntreguePor(e.target.value), placeholder: "Nome do motorista ou portador", className: inputClass }))),
                react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Contato"),
                        react_1.default.createElement("input", { type: "text", value: contatoNome, onChange: (e) => setContatoNome(e.target.value), placeholder: "Nome do contato", className: inputClass })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Telefone"),
                        react_1.default.createElement("input", { type: "text", value: contatoTelefone, onChange: (e) => setContatoTelefone((0, financeEngine_1.formatPhoneMask)(e.target.value)), placeholder: "(00) 00000-0000", className: `${inputClass} font-mono` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Endere\u00E7o"),
                        react_1.default.createElement("input", { type: "text", value: endereco, onChange: (e) => setEndereco(e.target.value), placeholder: "Rua, n\u00FAmero e bairro", className: inputClass })))),
            react_1.default.createElement("div", { className: "liquid-glass rounded-[28px] p-6 space-y-4" },
                react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Itens da Nota"),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "At\u00E9 6 linhas por canhoto de 1/3 A4. Acima de 6 linhas gera canhotos adicionais automaticamente.")),
                    react_1.default.createElement("button", { type: "button", onClick: handleAddRow, className: "liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold text-indigo-700 inline-flex items-center gap-1.5 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.Plus, { className: "w-3.5 h-3.5" }),
                        react_1.default.createElement("span", null, "Adicionar linha"))),
                items.length > 6 && (react_1.default.createElement("div", { className: "p-3 rounded-2xl bg-indigo-500/10 border border-indigo-300/60 text-xs font-bold text-indigo-800" },
                    "Esta nota possui ",
                    items.length,
                    " linhas e ser\u00E1 dividida automaticamente em ",
                    Math.ceil(items.length / 6),
                    " canhotos na visualiza\u00E7\u00E3o e impress\u00E3o.")),
                react_1.default.createElement("div", { className: "space-y-2.5" }, items.map((row, idx) => (react_1.default.createElement("div", { key: row.id, className: "grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl liquid-glass-subtle" },
                    react_1.default.createElement("div", { className: "md:col-span-6" },
                        react_1.default.createElement("input", { type: "text", required: true, value: row.descricao, onChange: (e) => updateRow(idx, 'descricao', e.target.value), placeholder: "Descri\u00E7\u00E3o do item ou faca", className: inputClass })),
                    react_1.default.createElement("div", { className: "md:col-span-2" },
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0.01", required: true, value: row.quantidade, onChange: (e) => updateRow(idx, 'quantidade', e.target.value), placeholder: "Qtd.", className: `${inputClass} font-mono text-right` })),
                    react_1.default.createElement("div", { className: "md:col-span-2" },
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0", required: true, value: row.precoUnitario, onChange: (e) => updateRow(idx, 'precoUnitario', e.target.value), placeholder: "Unit\u00E1rio R$", className: `${inputClass} font-mono text-right` })),
                    react_1.default.createElement("div", { className: "md:col-span-2 flex items-center justify-between gap-2" },
                        react_1.default.createElement("span", { className: "font-mono text-xs font-extrabold text-slate-900" }, (0, financeEngine_1.formatBRL)(row.total)),
                        react_1.default.createElement("button", { type: "button", onClick: () => handleRemoveRow(idx), disabled: items.length <= 1, className: "p-1.5 rounded-full bg-white/60 hover:bg-rose-500/20 disabled:opacity-40 text-slate-500 hover:text-rose-700 cursor-pointer", title: "Remover linha" },
                            react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" }))))))),
                react_1.default.createElement("div", { className: "pt-3 border-t border-white/60 flex flex-wrap items-center justify-between gap-3" },
                    react_1.default.createElement("div", { className: "text-sm font-black text-slate-900 font-mono" },
                        "Total Geral: ",
                        (0, financeEngine_1.formatBRL)(tableTotal)),
                    react_1.default.createElement("button", { type: "submit", className: "px-6 py-3 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-white/40 shadow-lg inline-flex items-center gap-2 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4" }),
                        react_1.default.createElement("span", null, editingId ? 'Salvar Nota' : 'Emitir Nota')))))),
        viewMode === 'preview' && previewNote && (react_1.default.createElement("div", { className: "space-y-4" },
            react_1.default.createElement("div", { className: "liquid-glass rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3" },
                react_1.default.createElement("div", { className: "flex items-center gap-3" },
                    react_1.default.createElement("button", { type: "button", onClick: () => setViewMode('list'), className: "liquid-glass-pill p-2.5 rounded-full text-slate-800 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.ArrowLeft, { className: "w-4 h-4" })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900 flex items-center gap-2" },
                            react_1.default.createElement(lucide_react_1.FileText, { className: "w-4 h-4 text-indigo-600" }),
                            "Visualiza\u00E7\u00E3o do Canhoto N\u00BA ",
                            String(previewNote.numero).padStart(4, '0')),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Propor\u00E7\u00E3o 210:99 mm \u2022 1/3 de folha A4"))),
                react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                    react_1.default.createElement("button", { type: "button", onClick: () => openEditForm(previewNote), className: "liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.Edit3, { className: "w-3.5 h-3.5" }),
                        react_1.default.createElement("span", null, "Editar")),
                    react_1.default.createElement("button", { type: "button", onClick: () => {
                            onMarkNotePrinted(previewNote.id);
                            onTriggerPrint(previewNote, false);
                        }, className: "px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md inline-flex items-center gap-1.5 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.Printer, { className: "w-3.5 h-3.5" }),
                        react_1.default.createElement("span", null, "Imprimir")),
                    react_1.default.createElement("button", { type: "button", onClick: () => {
                            onMarkNotePrinted(previewNote.id);
                            onTriggerPrint(previewNote, true);
                        }, className: "px-4 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md inline-flex items-center gap-1.5 cursor-pointer" },
                        react_1.default.createElement(lucide_react_1.Printer, { className: "w-3.5 h-3.5" }),
                        react_1.default.createElement("span", null, "Imprimir 3 por folha")))),
            react_1.default.createElement("div", { className: "max-w-4xl mx-auto space-y-4" }, chunkNoteItems(previewNote.items, 6).map((chunk, idx, arr) => (react_1.default.createElement(exports.CanhotoSlipCard, { key: `${previewNote.id}-slip-${idx}`, note: previewNote, itemsChunk: chunk, slipIndex: idx, totalSlips: arr.length, tenantName: tenantName }))))))));
};
exports.NotesSection = NotesSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/TeamManagementSection"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamManagementSection = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const TeamManagementSection = ({ session, employees, onAddEmployee, onToggleEmployeeRole, onDeleteEmployee, onImpersonateEmployee, }) => {
    const [ownerName, setOwnerName] = (0, react_1.useState)('');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [jobTitle, setJobTitle] = (0, react_1.useState)('');
    const [role, setRole] = (0, react_1.useState)('operador');
    const [formError, setFormError] = (0, react_1.useState)(null);
    const [confirmDeleteEmail, setConfirmDeleteEmail] = (0, react_1.useState)(null);
    const [copiedEmail, setCopiedEmail] = (0, react_1.useState)(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        const res = onAddEmployee({
            ownerName: ownerName.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            role,
            jobTitle: jobTitle.trim() ||
                (role === 'operador' ? 'Operador de Produção' : 'Administrador'),
        });
        if (res.error) {
            setFormError(res.error);
            return;
        }
        setOwnerName('');
        setEmail('');
        setPassword('');
        setJobTitle('');
        setRole('operador');
    };
    const handleCopyMobileInviteLink = (emp) => {
        try {
            const token = window.btoa(unescape(encodeURIComponent(JSON.stringify(emp))));
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            const inviteUrl = `${baseUrl}?emp_sync=${encodeURIComponent(token)}`;
            navigator.clipboard.writeText(inviteUrl);
            setCopiedEmail(emp.email);
            setTimeout(() => setCopiedEmail(null), 2500);
        }
        catch {
            // ignore
        }
    };
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6" },
            react_1.default.createElement("div", { className: "lg:col-span-5 liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex items-center gap-2.5 mb-5" },
                        react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700" },
                            react_1.default.createElement(lucide_react_1.UserPlus, { className: "w-4 h-4" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" }, "Cadastrar Novo Funcion\u00E1rio"),
                            react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Vinculado automaticamente \u00E0 sua empresa"))),
                    formError && (react_1.default.createElement("div", { className: "mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-300/60 text-rose-800 text-xs font-semibold flex items-center gap-2" },
                        react_1.default.createElement(lucide_react_1.AlertCircle, { className: "w-4 h-4 text-rose-600 shrink-0" }),
                        react_1.default.createElement("span", null, formError))),
                    react_1.default.createElement("form", { onSubmit: handleSubmit, className: "space-y-3.5" },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Nome do Funcion\u00E1rio *"),
                            react_1.default.createElement("input", { type: "text", required: true, value: ownerName, onChange: (e) => setOwnerName(e.target.value), placeholder: "Ex: Carlos Montador", className: inputClass })),
                        react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "E-mail de Login *"),
                                react_1.default.createElement("div", { className: "relative" },
                                    react_1.default.createElement(lucide_react_1.Mail, { className: "w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" }),
                                    react_1.default.createElement("input", { type: "email", inputMode: "email", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "carlos@facaria.com", className: "liquid-glass-pill w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" }))),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Senha de Acesso *"),
                                react_1.default.createElement("div", { className: "relative" },
                                    react_1.default.createElement(lucide_react_1.Lock, { className: "w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" }),
                                    react_1.default.createElement("input", { type: "text", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Ex: 123456", className: "liquid-glass-pill w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition" })))),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1" }, "Cargo / Fun\u00E7\u00E3o na F\u00E1brica"),
                            react_1.default.createElement("input", { type: "text", value: jobTitle, onChange: (e) => setJobTitle(e.target.value), placeholder: "Ex: Serrador, Dobrador, Expedi\u00E7\u00E3o...", className: inputClass })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { className: "block text-xs font-bold text-slate-700 mb-1.5" }, "N\u00EDvel de Permiss\u00E3o (Perfil de Acesso) *"),
                            react_1.default.createElement("div", { className: "grid grid-cols-1 gap-2" },
                                react_1.default.createElement("button", { type: "button", onClick: () => setRole('operador'), className: `p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${role === 'operador'
                                        ? 'bg-indigo-500/15 border-indigo-400/70 ring-1 ring-indigo-400/50'
                                        : 'liquid-glass-subtle hover:bg-white/40'}` },
                                    react_1.default.createElement(lucide_react_1.Wrench, { className: `w-4 h-4 mt-0.5 shrink-0 ${role === 'operador' ? 'text-indigo-700' : 'text-slate-600'}` }),
                                    react_1.default.createElement("div", null,
                                        react_1.default.createElement("div", { className: "text-xs font-extrabold text-slate-900" }, "Operador / Produ\u00E7\u00E3o"),
                                        react_1.default.createElement("div", { className: "text-[11px] font-medium text-slate-700 mt-0.5 leading-relaxed" },
                                            "Libera acesso apenas para",
                                            ' ',
                                            react_1.default.createElement("span", { className: "text-indigo-700 font-bold" }, "Esteira, Entregas, Retornos e Estoque"),
                                            ". Oculta Finan\u00E7as, Empresas e Vis\u00E3o Geral."))),
                                react_1.default.createElement("button", { type: "button", onClick: () => setRole('admin'), className: `p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${role === 'admin'
                                        ? 'bg-indigo-500/15 border-indigo-400/70 ring-1 ring-indigo-400/50'
                                        : 'liquid-glass-subtle hover:bg-white/40'}` },
                                    react_1.default.createElement(lucide_react_1.Shield, { className: `w-4 h-4 mt-0.5 shrink-0 ${role === 'admin' ? 'text-indigo-700' : 'text-slate-600'}` }),
                                    react_1.default.createElement("div", null,
                                        react_1.default.createElement("div", { className: "text-xs font-extrabold text-slate-900" }, "Administrador"),
                                        react_1.default.createElement("div", { className: "text-[11px] font-medium text-slate-700 mt-0.5 leading-relaxed" }, "Acesso irrestrito a todas as se\u00E7\u00F5es, financeiro, cadastro de empresas e gest\u00E3o de equipe."))))),
                        react_1.default.createElement("button", { type: "submit", className: "w-full py-3 px-4 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2 active:scale-95" },
                            react_1.default.createElement(lucide_react_1.UserPlus, { className: "w-4 h-4" }),
                            react_1.default.createElement("span", null, "Cadastrar Funcion\u00E1rio na Empresa"))))),
            react_1.default.createElement("div", { className: "lg:col-span-7 liquid-glass rounded-[28px] p-6 flex flex-col justify-between" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-5" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2.5" },
                            react_1.default.createElement("div", { className: "w-9 h-9 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center text-indigo-700" },
                                react_1.default.createElement(lucide_react_1.Users, { className: "w-4 h-4" })),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("h3", { className: "text-sm font-extrabold text-slate-900" },
                                    "Usu\u00E1rios & Funcion\u00E1rios da Empresa (",
                                    employees.length,
                                    ")"),
                                react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Gerencie cargos, teste a vis\u00E3o de operador ou envie o link de acesso para o celular do funcion\u00E1rio")))),
                    react_1.default.createElement("div", { className: "space-y-3" }, employees.map((emp) => {
                        const isSelf = emp.email.trim().toLowerCase() ===
                            session.email.trim().toLowerCase();
                        const isOperador = emp.role === 'operador';
                        return (react_1.default.createElement("div", { key: emp.email, className: "p-4 rounded-2xl liquid-glass-subtle transition flex flex-col sm:flex-row sm:items-center justify-between gap-4" },
                            react_1.default.createElement("div", { className: "space-y-1 min-w-0" },
                                react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                                    react_1.default.createElement("span", { className: "text-sm font-extrabold text-slate-900" }, emp.ownerName),
                                    isSelf && (react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-full bg-white/70 border border-white/80 text-slate-700 text-[10px] font-bold" }, "Voc\u00EA")),
                                    react_1.default.createElement("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isOperador
                                            ? 'bg-amber-500/15 text-amber-800 border-amber-300/60'
                                            : 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60'}` }, isOperador
                                        ? 'Operador • Fábrica'
                                        : 'Administrador Total')),
                                react_1.default.createElement("div", { className: "text-xs font-medium text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1" },
                                    react_1.default.createElement("span", null,
                                        "Cargo:",
                                        ' ',
                                        react_1.default.createElement("strong", { className: "text-slate-900" }, emp.jobTitle ||
                                            (isOperador ? 'Operador de Produção' : 'Administrador'))),
                                    react_1.default.createElement("span", null, "\u2022"),
                                    react_1.default.createElement("span", null,
                                        "E-mail:",
                                        ' ',
                                        react_1.default.createElement("code", { className: "text-slate-900 font-mono font-bold" }, emp.email)),
                                    react_1.default.createElement("span", null, "\u2022"),
                                    react_1.default.createElement("span", { className: "inline-flex items-center gap-1" },
                                        react_1.default.createElement(lucide_react_1.KeyRound, { className: "w-3 h-3 text-slate-500" }),
                                        "Senha:",
                                        ' ',
                                        react_1.default.createElement("code", { className: "text-slate-800 font-mono font-bold" }, emp.password)))),
                            react_1.default.createElement("div", { className: "flex flex-wrap items-center gap-2 shrink-0" },
                                react_1.default.createElement("button", { type: "button", onClick: () => handleCopyMobileInviteLink(emp), className: "liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-800 text-[11px] font-bold transition cursor-pointer", title: "Copiar link de acesso configurado para o celular do funcion\u00E1rio" }, copiedEmail === emp.email ? (react_1.default.createElement(react_1.default.Fragment, null,
                                    react_1.default.createElement(lucide_react_1.Check, { className: "w-3.5 h-3.5 text-emerald-600" }),
                                    react_1.default.createElement("span", { className: "text-emerald-700" }, "Link Copiado!"))) : (react_1.default.createElement(react_1.default.Fragment, null,
                                    react_1.default.createElement(lucide_react_1.Copy, { className: "w-3.5 h-3.5 text-slate-600" }),
                                    react_1.default.createElement("span", null, "Link Celular")))),
                                !isSelf && (react_1.default.createElement("button", { type: "button", onClick: () => onImpersonateEmployee(emp), className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-600 text-indigo-800 hover:text-white border border-indigo-300/60 text-[11px] font-bold transition cursor-pointer", title: "Entrar imediatamente com o perfil deste funcion\u00E1rio para testar a vis\u00E3o dele" },
                                    react_1.default.createElement(lucide_react_1.Eye, { className: "w-3.5 h-3.5" }),
                                    react_1.default.createElement("span", null,
                                        "Entrar como ",
                                        emp.ownerName.split(' ')[0]))),
                                !isSelf && (react_1.default.createElement("button", { type: "button", onClick: () => onToggleEmployeeRole(emp.email, isOperador ? 'admin' : 'operador'), className: "liquid-glass-pill inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-slate-700 text-[11px] font-bold transition cursor-pointer", title: "Alternar entre Operador (Se\u00E7\u00F5es 2, 4, 5) e Administrador" },
                                    react_1.default.createElement(lucide_react_1.UserCheck, { className: "w-3.5 h-3.5 text-indigo-600" }),
                                    react_1.default.createElement("span", null, isOperador ? 'Tornar Admin' : 'Tornar Operador'))),
                                !isSelf &&
                                    (confirmDeleteEmail === emp.email ? (react_1.default.createElement("div", { className: "inline-flex items-center gap-1 bg-rose-500/15 border border-rose-300/70 rounded-full px-2.5 py-1" },
                                        react_1.default.createElement("button", { type: "button", onClick: () => {
                                                onDeleteEmployee(emp.email);
                                                setConfirmDeleteEmail(null);
                                            }, className: "text-[10px] font-bold text-rose-800 hover:text-rose-950 px-1.5 cursor-pointer" }, "Confirmar"),
                                        react_1.default.createElement("button", { type: "button", onClick: () => setConfirmDeleteEmail(null), className: "text-[10px] font-bold text-slate-600 hover:text-slate-900 px-1 cursor-pointer" }, "\u2715"))) : (react_1.default.createElement("button", { type: "button", onClick: () => setConfirmDeleteEmail(emp.email), className: "p-2 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 transition cursor-pointer", title: "Apagar funcion\u00E1rio" },
                                        react_1.default.createElement(lucide_react_1.Trash2, { className: "w-3.5 h-3.5" })))))));
                    }))),
                react_1.default.createElement("div", { className: "mt-6 pt-4 border-t border-white/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-600" },
                    react_1.default.createElement("span", { className: "flex items-center gap-1.5" },
                        react_1.default.createElement(lucide_react_1.ShieldAlert, { className: "w-3.5 h-3.5 text-indigo-600" }),
                        "Operadores enxergam apenas as Se\u00E7\u00F5es 2, 4 e 5."),
                    react_1.default.createElement("span", null, "Dica: Abra uma aba an\u00F4nima e fa\u00E7a login como operador para ver o Realtime funcionando ao vivo!"))))));
};
exports.TeamManagementSection = TeamManagementSection;

  },
  { dir: "./components" }
);

__moduleFactories["./components/FastEntryModal"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastEntryModal = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const financeEngine_1 = require("../utils/financeEngine");
const FastEntryModal = ({ isOpen, onClose, companies, nextOrderId, onSaveOrder, }) => {
    const [selectedCompanyId, setSelectedCompanyId] = (0, react_1.useState)(companies[0]?.id || '');
    const [customCompanyName, setCustomCompanyName] = (0, react_1.useState)('');
    const [toolDescription, setToolDescription] = (0, react_1.useState)('');
    const [amount, setAmount] = (0, react_1.useState)('');
    const [paymentModality, setPaymentModality] = (0, react_1.useState)('boleto');
    const [stage, setStage] = (0, react_1.useState)('arquivo_recebido');
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            setSelectedCompanyId(companies[0]?.id || 'nova');
            setCustomCompanyName('');
            setToolDescription('');
            setAmount('');
            setPaymentModality('boleto');
            setStage('arquivo_recebido');
        }
    }, [isOpen, companies]);
    if (!isOpen)
        return null;
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!toolDescription.trim())
            return;
        const existingComp = companies.find((c) => c.id === selectedCompanyId);
        const companyName = selectedCompanyId === 'nova'
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
    const inputClass = 'liquid-glass-pill w-full px-3.5 py-2.5 text-sm rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';
    return (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/35 backdrop-blur-md p-0 sm:p-4" },
        react_1.default.createElement("div", { className: "w-full sm:max-w-lg rounded-t-[30px] sm:rounded-[30px] liquid-glass bg-white/60 p-6 shadow-2xl space-y-4" },
            react_1.default.createElement("div", { className: "flex items-center justify-between" },
                react_1.default.createElement("div", { className: "flex items-center gap-2.5" },
                    react_1.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md flex items-center justify-center" },
                        react_1.default.createElement("div", { className: "w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center" },
                            react_1.default.createElement(lucide_react_1.Layers, { className: "w-4 h-4 text-indigo-600" }))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement("h2", { className: "text-base font-extrabold text-slate-900" }, "Nova Ordem de Servi\u00E7o"),
                            react_1.default.createElement("span", { className: "px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-300/60 font-mono text-xs font-bold text-indigo-800" }, nextOrderId)),
                        react_1.default.createElement("p", { className: "text-[11px] font-medium text-slate-600" }, "Lan\u00E7amento r\u00E1pido \u2022 Entra direto na Esteira e no Financeiro"))),
                react_1.default.createElement("button", { type: "button", onClick: onClose, className: "p-2 rounded-full liquid-glass-pill text-slate-700 hover:text-slate-950 transition cursor-pointer" },
                    react_1.default.createElement(lucide_react_1.X, { className: "w-4 h-4" }))),
            react_1.default.createElement("form", { onSubmit: handleSubmit, className: "space-y-3.5" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "1. Empresa / Cliente"),
                    react_1.default.createElement("select", { value: selectedCompanyId, onChange: (e) => setSelectedCompanyId(e.target.value), className: inputClass },
                        companies.map((c) => (react_1.default.createElement("option", { key: c.id, value: c.id },
                            c.corporateName,
                            " (",
                            c.cnpj,
                            ")"))),
                        react_1.default.createElement("option", { value: "nova" }, "+ Digitar Nova Empresa Rapidamente...")),
                    selectedCompanyId === 'nova' && (react_1.default.createElement("input", { type: "text", required: true, value: customCompanyName, onChange: (e) => setCustomCompanyName(e.target.value), placeholder: "Digite a Raz\u00E3o Social ou Nome da Gr\u00E1fica", className: `${inputClass} mt-2` }))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "2. Descri\u00E7\u00E3o Detalhada da Ferramenta"),
                    react_1.default.createElement("input", { type: "text", required: true, autoFocus: true, value: toolDescription, onChange: (e) => setToolDescription(e.target.value), placeholder: "Ex: Faca Caixa Duplex Tampa e Fundo", className: inputClass })),
                react_1.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "3. Valor em R$"),
                        react_1.default.createElement("input", { type: "number", step: "0.01", min: "0", required: true, value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "Ex: 680,00", className: `${inputClass} font-mono font-bold` })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "4. Status Inicial na Esteira"),
                        react_1.default.createElement("select", { value: stage, onChange: (e) => setStage(e.target.value), className: inputClass }, financeEngine_1.PRODUCTION_STAGES.map((st) => (react_1.default.createElement("option", { key: st.id, value: st.id },
                            st.step,
                            ". ",
                            st.label)))))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1.5" }, "5. Condi\u00E7\u00E3o de Pagamento"),
                    react_1.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2" }, Object.keys(financeEngine_1.PAYMENT_MODALITY_META).map((mod) => {
                        const meta = financeEngine_1.PAYMENT_MODALITY_META[mod];
                        const selected = paymentModality === mod;
                        return (react_1.default.createElement("button", { type: "button", key: mod, onClick: () => setPaymentModality(mod), className: `py-2 px-3 rounded-2xl text-xs font-bold border text-left flex items-center justify-between transition cursor-pointer ${selected
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-white/40 shadow-md'
                                : 'liquid-glass-pill text-slate-700'}` },
                            react_1.default.createElement("span", { className: "truncate" }, meta.short),
                            selected && react_1.default.createElement(lucide_react_1.Check, { className: "w-3.5 h-3.5 shrink-0 ml-1" })));
                    }))),
                react_1.default.createElement("div", { className: "pt-2" },
                    react_1.default.createElement("button", { type: "submit", className: "w-full py-3 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95" },
                        react_1.default.createElement(lucide_react_1.Check, { className: "w-4 h-4 stroke-[2.5]" }),
                        react_1.default.createElement("span", null,
                            "Registrar ",
                            nextOrderId,
                            " na Esteira")))))));
};
exports.FastEntryModal = FastEntryModal;

  },
  { dir: "./components" }
);

__moduleFactories["./App"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const AuthLoginScreen_1 = require("./components/AuthLoginScreen");
const BentoOverviewSection_1 = require("./components/BentoOverviewSection");
const CompaniesCrmSection_1 = require("./components/CompaniesCrmSection");
const DeliveriesLogisticsSection_1 = require("./components/DeliveriesLogisticsSection");
const FastEntryModal_1 = require("./components/FastEntryModal");
const FinanceAnalyticsSection_1 = require("./components/FinanceAnalyticsSection");
const HeaderBar_1 = require("./components/HeaderBar");
const NotesSection_1 = require("./components/NotesSection");
const ProductionKanban_1 = require("./components/ProductionKanban");
const StockSection_1 = require("./components/StockSection");
const TeamManagementSection_1 = require("./components/TeamManagementSection");
const WarrantyReturnsSection_1 = require("./components/WarrantyReturnsSection");
const realtimeEngine_1 = require("./services/realtimeEngine");
const storageAdapter_1 = require("./services/storageAdapter");
const financeEngine_1 = require("./utils/financeEngine");
const OPERATOR_ALLOWED_SECTIONS = [
    'esteira',
    'entregas',
    'retornos',
    'estoque',
    'notas',
];
const App = () => {
    const [session, setSession] = (0, react_1.useState)(() => (0, storageAdapter_1.getActiveSession)());
    const [db, setDb] = (0, react_1.useState)(() => {
        const active = (0, storageAdapter_1.getActiveSession)();
        return (0, storageAdapter_1.loadEnterpriseDatabase)(active?.company_id || 'tenant_qualifacas');
    });
    const [employees, setEmployees] = (0, react_1.useState)(() => {
        const active = (0, storageAdapter_1.getActiveSession)();
        return (0, storageAdapter_1.getCompanyEmployees)(active?.company_id || 'tenant_qualifacas');
    });
    const [activeSection, setActiveSection] = (0, react_1.useState)(() => {
        const active = (0, storageAdapter_1.getActiveSession)();
        return active?.role === 'operador' ? 'esteira' : 'bento_home';
    });
    const [realtimeStatus, setRealtimeStatus] = (0, react_1.useState)('connected');
    const [realtimeConfigTick, setRealtimeConfigTick] = (0, react_1.useState)(0);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedCompanyId, setSelectedCompanyId] = (0, react_1.useState)(db.companies[0]?.id || null);
    const [prefillDeliveryOrder, setPrefillDeliveryOrder] = (0, react_1.useState)(null);
    const [isNewModalOpen, setIsNewModalOpen] = (0, react_1.useState)(false);
    const [printJob, setPrintJob] = (0, react_1.useState)(null);
    const [pendingOrderIds, setPendingOrderIds] = (0, react_1.useState)([]);
    const pendingOrderIdsRef = (0, react_1.useRef)(new Set());
    const [moveError, setMoveError] = (0, react_1.useState)(null);
    const [toast, setToast] = (0, react_1.useState)(null);
    const showToast = (message) => {
        setToast({ message });
        setTimeout(() => {
            setToast((prev) => (prev?.message === message ? null : prev));
        }, 3800);
    };
    const isNewerOrder = (incoming, local) => {
        if (!local)
            return true;
        const incVer = Number(incoming.version) || 0;
        const locVer = Number(local.version) || 0;
        if (incVer > locVer)
            return true;
        if (incVer < locVer)
            return false;
        return (incoming.updatedAt || '') > (local.updatedAt || '');
    };
    // Subscribe to Realtime updates for the logged-in company_id (Read-only state merge; never writes back)
    (0, react_1.useEffect)(() => {
        window.__facasflowChannelCount = realtimeEngine_1.getActiveRealtimeChannelCount;
        if (!session?.company_id)
            return;
        const unsubscribe = (0, realtimeEngine_1.subscribeToCompanyRealtime)(session.company_id, (remoteEvent) => {
            setDb((prev) => {
                let nextDb = prev;
                if (remoteEvent.order) {
                    const incoming = remoteEvent.order;
                    if (pendingOrderIdsRef.current.has(incoming.id)) {
                        return prev;
                    }
                    const existing = prev.orders.find((o) => o.id === incoming.id);
                    if (existing && !isNewerOrder(incoming, existing)) {
                        return prev;
                    }
                    const nextOrders = existing
                        ? prev.orders.map((o) => o.id === incoming.id ? { ...o, ...incoming } : o)
                        : [incoming, ...prev.orders];
                    nextDb = (0, storageAdapter_1.saveEnterpriseDatabaseLocalOnly)({
                        ...prev,
                        orders: nextOrders,
                    });
                }
                else if (remoteEvent.db) {
                    const localOrderMap = new Map(prev.orders.map((o) => [o.id, o]));
                    const mergedOrders = (remoteEvent.db.orders || []).map((inc) => {
                        const loc = localOrderMap.get(inc.id);
                        if (loc && pendingOrderIdsRef.current.has(inc.id)) {
                            return loc;
                        }
                        if (loc && !isNewerOrder(inc, loc)) {
                            return loc;
                        }
                        return inc;
                    });
                    nextDb = (0, storageAdapter_1.saveEnterpriseDatabaseLocalOnly)({
                        ...remoteEvent.db,
                        company_id: session.company_id,
                        orders: mergedOrders,
                    });
                }
                return nextDb;
            });
            setEmployees((0, storageAdapter_1.getCompanyEmployees)(session.company_id));
        }, (status) => {
            setRealtimeStatus(status);
        });
        return () => {
            unsubscribe();
        };
    }, [session?.company_id, realtimeConfigTick]);
    const handleAuthenticated = (newSession) => {
        const tenantDb = (0, storageAdapter_1.loadEnterpriseDatabase)(newSession.company_id);
        const companyEmps = (0, storageAdapter_1.getCompanyEmployees)(newSession.company_id);
        setSession(newSession);
        setDb(tenantDb);
        setEmployees(companyEmps);
        setSelectedCompanyId(tenantDb.companies[0]?.id || null);
        setActiveSection(newSession.role === 'operador' ? 'esteira' : 'bento_home');
        setSearchQuery('');
        showToast(newSession.role === 'operador'
            ? `Acesso de Produção liberado (${newSession.ownerName})`
            : 'Sessão iniciada com sucesso!');
    };
    const handleLogout = () => {
        (0, storageAdapter_1.clearActiveSession)();
        setSession(null);
        setSearchQuery('');
        setIsNewModalOpen(false);
    };
    const handleSelectSection = (target) => {
        if (session?.role === 'operador' &&
            !OPERATOR_ALLOWED_SECTIONS.includes(target)) {
            setActiveSection('esteira');
            return;
        }
        setActiveSection(target);
    };
    const commitDb = (nextDb, realtimeMeta) => {
        const activeTenantId = session?.company_id || nextDb.company_id || 'tenant_qualifacas';
        const currentEmps = (0, storageAdapter_1.getCompanyEmployees)(activeTenantId);
        const saved = (0, storageAdapter_1.saveEnterpriseDatabase)({
            ...nextDb,
            company_id: activeTenantId,
            employees: currentEmps,
        });
        setDb(saved);
        setEmployees(currentEmps);
        if (realtimeMeta && session) {
            (0, realtimeEngine_1.publishRealtimeUpdate)({
                company_id: activeTenantId,
                section: realtimeMeta.section,
                actionLabel: realtimeMeta.actionLabel,
                actorName: session.ownerName,
                actorRole: session.role,
                db: saved,
            });
        }
    };
    // Search filtering
    const filteredOrders = (0, react_1.useMemo)(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q)
            return db.orders;
        return db.orders.filter((o) => o.id.toLowerCase().includes(q) ||
            o.companyName.toLowerCase().includes(q) ||
            o.toolDescription.toLowerCase().includes(q));
    }, [db.orders, searchQuery]);
    const filteredCompanies = (0, react_1.useMemo)(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q)
            return db.companies;
        return db.companies.filter((c) => c.corporateName.toLowerCase().includes(q) ||
            c.cnpj.toLowerCase().includes(q) ||
            c.contactName.toLowerCase().includes(q));
    }, [db.companies, searchQuery]);
    const financials = (0, react_1.useMemo)(() => (0, financeEngine_1.computeFinancialBreakdown)(filteredOrders), [filteredOrders]);
    const nextOrderId = (0, react_1.useMemo)(() => (0, storageAdapter_1.getNextOrderId)(db), [db]);
    // Handlers
    const handleAddCompany = (newCompData) => {
        let maxNum = 0;
        for (const c of db.companies) {
            const n = parseInt(c.id.replace(/\D/g, ''), 10);
            if (!Number.isNaN(n) && n > maxNum)
                maxNum = n;
        }
        const newId = `EMP-${String(maxNum + 1).padStart(2, '0')}`;
        const created = {
            id: newId,
            company_id: session?.company_id,
            ...newCompData,
        };
        commitDb({
            ...db,
            companies: [created, ...db.companies],
        }, {
            section: 'all',
            actionLabel: `Empresa "${created.corporateName}" cadastrada`,
        });
        setSelectedCompanyId(newId);
        showToast(`Empresa "${created.corporateName}" cadastrada!`);
    };
    const handleCreateOrderFull = (payload) => {
        const today = (0, financeEngine_1.toISODate)();
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const days = financeEngine_1.PAYMENT_MODALITY_META[payload.paymentModality]?.defaultDays ?? 30;
        let payStatus = 'a_receber';
        if (payload.paymentModality === 'nao_pago')
            payStatus = 'nao_pago';
        else if (payload.paymentModality === 'pix' ||
            payload.paymentModality === 'dinheiro') {
            payStatus = 'pago';
        }
        let updatedCompanies = db.companies;
        if (!db.companies.some((c) => c.id === payload.companyId)) {
            updatedCompanies = [
                {
                    id: payload.companyId,
                    company_id: session?.company_id,
                    corporateName: payload.companyName,
                    cnpj: 'Não informado',
                    phone: payload.companyPhone,
                    contactName: 'PCP / Compras',
                },
                ...db.companies,
            ];
        }
        const newOrder = {
            id: nextOrderId,
            company_id: session?.company_id,
            companyId: payload.companyId,
            companyName: payload.companyName,
            companyPhone: payload.companyPhone,
            toolDescription: payload.toolDescription,
            amount: payload.amount,
            paymentModality: payload.paymentModality,
            paymentStatus: payStatus,
            stage: payload.stage,
            stageUpdatedAt: stamp,
            stageHistory: [{ stage: payload.stage, timestamp: stamp }],
            createdAt: today,
            dueDate: (0, financeEngine_1.addDays)(today, days),
            paidAt: payStatus === 'pago' ? today : undefined,
            version: 1,
            updatedAt: new Date().toISOString(),
        };
        const stageLabel = financeEngine_1.PRODUCTION_STAGES.find((s) => s.id === payload.stage)?.label ||
            payload.stage;
        commitDb({
            ...db,
            companies: updatedCompanies,
            orders: [newOrder, ...db.orders],
        }, {
            section: 'esteira',
            actionLabel: `Nova ${newOrder.id} enviada para "${stageLabel}"`,
        });
        if (!selectedCompanyId) {
            setSelectedCompanyId(payload.companyId);
        }
        showToast(`${newOrder.id} criada em "${stageLabel}"!`);
    };
    // Seção 2 • Esteira Física de Produção (Única função responsável por mover o card)
    const handleMoveStage = (0, react_1.useCallback)(async (orderId, targetStage) => {
        if (!session)
            return;
        const currentOrder = db.orders.find((o) => o.id === orderId);
        if (!currentOrder || currentOrder.stage === targetStage)
            return;
        if (pendingOrderIdsRef.current.has(orderId))
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const nowIso = new Date().toISOString();
        const previousOrder = { ...currentOrder };
        const optimisticOrder = {
            ...currentOrder,
            stage: targetStage,
            stageUpdatedAt: stamp,
            stageHistory: [
                ...(currentOrder.stageHistory || []),
                { stage: targetStage, timestamp: stamp },
            ],
            version: (Number(currentOrder.version) || 1) + 1,
            updatedAt: nowIso,
        };
        // 1. Marcar pendente e aplicar atualização otimista apenas neste card
        pendingOrderIdsRef.current.add(orderId);
        setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
        setMoveError(null);
        setDb((prev) => (0, storageAdapter_1.saveEnterpriseDatabaseLocalOnly)({
            ...prev,
            orders: prev.orders.map((o) => (o.id === orderId ? optimisticOrder : o)),
        }));
        try {
            let authoritativeOrder = optimisticOrder;
            // 2. Escrita única via RPC (Supabase) ou endpoint atômico (server.cjs)
            if ((0, realtimeEngine_1.isSupabaseCloudActive)()) {
                const rpcRow = await (0, realtimeEngine_1.moveOrderStageViaRpc)(orderId, targetStage, stamp);
                if (rpcRow) {
                    authoritativeOrder = {
                        ...optimisticOrder,
                        version: rpcRow.version ?? optimisticOrder.version,
                        updatedAt: rpcRow.updated_at ?? optimisticOrder.updatedAt,
                    };
                }
            }
            else {
                const serverOrder = await (0, storageAdapter_1.moveOrderStageOnServer)({
                    company_id: session.company_id,
                    orderId,
                    targetStage,
                    stageUpdatedAt: stamp,
                });
                if (serverOrder) {
                    authoritativeOrder = serverOrder;
                }
            }
            // 3. Limpar estado pendente e confirmar registro final
            pendingOrderIdsRef.current.delete(orderId);
            setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
            setDb((prev) => (0, storageAdapter_1.saveEnterpriseDatabaseLocalOnly)({
                ...prev,
                orders: prev.orders.map((o) => o.id === orderId ? authoritativeOrder : o),
            }));
            // 4. Broadcast apenas do card movido (BroadcastChannel / Supabase Broadcast)
            (0, realtimeEngine_1.publishRealtimeUpdate)({
                company_id: session.company_id,
                section: 'esteira',
                actionLabel: '',
                actorName: session.ownerName,
                actorRole: session.role,
                order: authoritativeOrder,
            });
        }
        catch {
            // Reverter apenas este card e exibir erro discreto (sem toast de tempo real)
            pendingOrderIdsRef.current.delete(orderId);
            setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
            setDb((prev) => (0, storageAdapter_1.saveEnterpriseDatabaseLocalOnly)({
                ...prev,
                orders: prev.orders.map((o) => o.id === orderId ? previousOrder : o),
            }));
            setMoveError(`Não foi possível mover ${orderId}. Estado restaurado.`);
            setTimeout(() => setMoveError(null), 4000);
        }
    }, [db.orders, session]);
    const handleTogglePaid = (orderId) => {
        const today = (0, financeEngine_1.toISODate)();
        const nextOrders = db.orders.map((o) => {
            if (o.id !== orderId)
                return o;
            const isPaid = o.paymentStatus === 'pago';
            return {
                ...o,
                paymentStatus: (isPaid ? 'a_receber' : 'pago'),
                paidAt: isPaid ? undefined : today,
            };
        });
        commitDb({ ...db, orders: nextOrders }, {
            section: 'all',
            actionLabel: `Status financeiro de ${orderId} atualizado`,
        });
        showToast(`Status financeiro de ${orderId} atualizado!`);
    };
    const handleEmitBilling30d = (orderId) => {
        const today = (0, financeEngine_1.toISODate)();
        const nextOrders = db.orders.map((o) => {
            if (o.id !== orderId)
                return o;
            return {
                ...o,
                paymentStatus: 'a_receber',
                dueDate: (0, financeEngine_1.addDays)(today, 30),
            };
        });
        commitDb({ ...db, orders: nextOrders }, {
            section: 'all',
            actionLabel: `Faturamento 30 dias gerado para ${orderId}`,
        });
        showToast(`Faturamento 30 dias gerado para ${orderId}!`);
    };
    // Seção 4 • Entregas e Logísticas de Saída (Realtime Broadcast)
    const handleAddDelivery = (deliveryData) => {
        const newDel = {
            id: (0, storageAdapter_1.getNextDeliveryId)(db),
            company_id: session?.company_id,
            ...deliveryData,
        };
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const nextOrders = db.orders.map((o) => o.id === deliveryData.orderId
            ? { ...o, stage: 'faca_pronta', stageUpdatedAt: stamp }
            : o);
        commitDb({
            ...db,
            orders: nextOrders,
            deliveries: [newDel, ...db.deliveries],
        }, {
            section: 'entregas',
            actionLabel: `Saída logística da ${deliveryData.orderId} registrada na Seção 4`,
        });
        showToast(`Saída logística da ${deliveryData.orderId} registrada!`);
    };
    // Seção 5 • Retornos e Ajustes (Realtime Broadcast)
    const handleAddReturn = (retData) => {
        const newRet = {
            id: (0, storageAdapter_1.getNextReturnId)(db),
            company_id: session?.company_id,
            ...retData,
        };
        commitDb({
            ...db,
            returns: [newRet, ...db.returns],
        }, {
            section: 'retornos',
            actionLabel: `Retorno de garantia (${retData.orderId}) registrado na Seção 5`,
        });
        showToast(`Retorno de garantia (${retData.orderId}) registrado!`);
    };
    const handleUpdateReturnStatus = (id, nextStatus) => {
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const targetRet = db.returns.find((r) => r.id === id);
        const nextReturns = db.returns.map((r) => r.id === id ? { ...r, status: nextStatus, updatedAt: stamp } : r);
        commitDb({ ...db, returns: nextReturns }, {
            section: 'retornos',
            actionLabel: `Status do retorno ${targetRet?.orderId || id} alterado para "${nextStatus}" na Seção 5`,
        });
        showToast(`Status do retorno atualizado (${stamp})!`);
    };
    const handleDeleteCompany = (companyId) => {
        const comp = db.companies.find((c) => c.id === companyId);
        const removedOrderIds = new Set(db.orders.filter((o) => o.companyId === companyId).map((o) => o.id));
        const nextCompanies = db.companies.filter((c) => c.id !== companyId);
        const nextOrders = db.orders.filter((o) => o.companyId !== companyId);
        const nextDeliveries = db.deliveries.filter((d) => !removedOrderIds.has(d.orderId));
        const nextReturns = db.returns.filter((r) => !removedOrderIds.has(r.orderId));
        commitDb({
            ...db,
            companies: nextCompanies,
            orders: nextOrders,
            deliveries: nextDeliveries,
            returns: nextReturns,
        }, {
            section: 'all',
            actionLabel: `Empresa "${comp?.corporateName || companyId}" removida`,
        });
        if (selectedCompanyId === companyId) {
            setSelectedCompanyId(nextCompanies[0]?.id || null);
        }
        showToast(`Empresa "${comp?.corporateName || companyId}" apagada!`);
    };
    const handleDeleteOrder = (orderId) => {
        const nextOrders = db.orders.filter((o) => o.id !== orderId);
        const nextDeliveries = db.deliveries.filter((d) => d.orderId !== orderId);
        const nextReturns = db.returns.filter((r) => r.orderId !== orderId);
        commitDb({
            ...db,
            orders: nextOrders,
            deliveries: nextDeliveries,
            returns: nextReturns,
        }, {
            section: 'esteira',
            actionLabel: `Ordem ${orderId} apagada`,
        });
        showToast(`Ordem ${orderId} apagada com sucesso!`);
    };
    const handleDeleteDelivery = (deliveryId) => {
        const nextDeliveries = db.deliveries.filter((d) => d.id !== deliveryId);
        commitDb({ ...db, deliveries: nextDeliveries }, {
            section: 'entregas',
            actionLabel: `Registro de entrega ${deliveryId} apagado na Seção 4`,
        });
        showToast(`Registro de entrega ${deliveryId} apagado!`);
    };
    const handleDeleteReturn = (returnId) => {
        const nextReturns = db.returns.filter((r) => r.id !== returnId);
        commitDb({ ...db, returns: nextReturns }, {
            section: 'retornos',
            actionLabel: `Registro de retorno ${returnId} apagado na Seção 5`,
        });
        showToast(`Registro de retorno ${returnId} apagado!`);
    };
    // Seção 6 • Estoque (Realtime Broadcast)
    const handleAddStockItem = (payload) => {
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const newItem = {
            id: (0, storageAdapter_1.getNextStockId)(db),
            company_id: session?.company_id,
            ...payload,
            updatedAt: stamp,
        };
        commitDb({
            ...db,
            stock: [newItem, ...(db.stock || [])],
        }, {
            section: 'estoque',
            actionLabel: `Item "${newItem.name}" adicionado ao Estoque`,
        });
        showToast(`Item "${newItem.name}" (${newItem.id}) adicionado ao estoque!`);
    };
    const handleUpdateStockItem = (id, payload) => {
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const nextStock = (db.stock || []).map((item) => item.id === id
            ? {
                ...item,
                ...payload,
                updatedAt: stamp,
            }
            : item);
        commitDb({ ...db, stock: nextStock }, {
            section: 'estoque',
            actionLabel: `Item ${id} (${payload.name}) atualizado no Estoque`,
        });
        showToast(`Estoque atualizado (${payload.name})!`);
    };
    const handleDeleteStockItem = (id) => {
        const target = (db.stock || []).find((i) => i.id === id);
        const nextStock = (db.stock || []).filter((i) => i.id !== id);
        commitDb({ ...db, stock: nextStock }, {
            section: 'estoque',
            actionLabel: `Item "${target?.name || id}" removido do Estoque`,
        });
        showToast(`Item ${id} removido do estoque!`);
    };
    // Finanças: Despesas, Prestadores, Funcionários e Investimentos (Admin Only)
    const handleUpsertMonthExpenses = (month, values) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const current = db.expenses || [];
        const exists = current.some((e) => e.month === month);
        const nextExpenses = exists
            ? current.map((e) => e.month === month ? { month, values, updatedAt: stamp } : e)
            : [{ month, values, updatedAt: stamp }, ...current];
        commitDb({ ...db, expenses: nextExpenses }, { section: 'financeiro', actionLabel: `Despesas de ${month} atualizadas` });
    };
    const handleAddProvider = (payload) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const newProv = {
            id: (0, storageAdapter_1.getNextProviderId)(db),
            company_id: session.company_id,
            ...payload,
            updatedAt: stamp,
        };
        commitDb({ ...db, serviceProviders: [newProv, ...(db.serviceProviders || [])] }, { section: 'financeiro', actionLabel: `Prestador "${newProv.name}" adicionado` });
        showToast(`Prestador "${newProv.name}" cadastrado!`);
    };
    const handleUpdateProvider = (id, payload) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const next = (db.serviceProviders || []).map((p) => p.id === id ? { ...p, ...payload, updatedAt: stamp } : p);
        commitDb({ ...db, serviceProviders: next }, { section: 'financeiro', actionLabel: `Prestador "${payload.name}" atualizado` });
        showToast(`Prestador atualizado!`);
    };
    const handleDeleteProvider = (id) => {
        if (session?.role !== 'admin')
            return;
        const next = (db.serviceProviders || []).filter((p) => p.id !== id);
        commitDb({ ...db, serviceProviders: next }, { section: 'financeiro', actionLabel: `Prestador ${id} removido` });
        showToast(`Prestador removido!`);
    };
    const handleAddPayrollEmployee = (payload) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const newEmp = {
            id: (0, storageAdapter_1.getNextPayrollEmployeeId)(db),
            company_id: session.company_id,
            ...payload,
            updatedAt: stamp,
        };
        commitDb({ ...db, payrollEmployees: [newEmp, ...(db.payrollEmployees || [])] }, { section: 'financeiro', actionLabel: `Funcionário "${newEmp.name}" cadastrado` });
        showToast(`Funcionário "${newEmp.name}" cadastrado!`);
    };
    const handleUpdatePayrollEmployee = (id, payload) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const next = (db.payrollEmployees || []).map((e) => e.id === id ? { ...e, ...payload, updatedAt: stamp } : e);
        commitDb({ ...db, payrollEmployees: next }, { section: 'financeiro', actionLabel: `Funcionário "${payload.name}" atualizado` });
        showToast(`Funcionário atualizado!`);
    };
    const handleDeletePayrollEmployee = (id) => {
        if (session?.role !== 'admin')
            return;
        const next = (db.payrollEmployees || []).filter((e) => e.id !== id);
        commitDb({ ...db, payrollEmployees: next }, { section: 'financeiro', actionLabel: `Funcionário ${id} removido` });
        showToast(`Funcionário removido!`);
    };
    const handleAddInvestment = (payload) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const newInv = {
            id: (0, storageAdapter_1.getNextInvestmentId)(db),
            company_id: session.company_id,
            ...payload,
            updatedAt: stamp,
        };
        commitDb({ ...db, investments: [newInv, ...(db.investments || [])] }, { section: 'financeiro', actionLabel: `Investimento "${newInv.assetName}" cadastrado` });
        showToast(`Investimento "${newInv.assetName}" adicionado!`);
    };
    const handleUpdateInvestment = (id, payload) => {
        if (session?.role !== 'admin')
            return;
        const stamp = (0, financeEngine_1.nowTimestampBR)();
        const next = (db.investments || []).map((inv) => inv.id === id ? { ...inv, ...payload, updatedAt: stamp } : inv);
        commitDb({ ...db, investments: next }, { section: 'financeiro', actionLabel: `Investimento "${payload.assetName}" atualizado` });
        showToast(`Investimento atualizado!`);
    };
    const handleDeleteInvestment = (id) => {
        if (session?.role !== 'admin')
            return;
        const next = (db.investments || []).filter((inv) => inv.id !== id);
        commitDb({ ...db, investments: next }, { section: 'financeiro', actionLabel: `Investimento ${id} removido` });
        showToast(`Investimento removido!`);
    };
    // Seção Notas (Admin & Operador)
    const nextNoteNumber = (0, react_1.useMemo)(() => (0, storageAdapter_1.getNextNoteNumber)(db), [db]);
    const handleSaveNote = (payload, editingId) => {
        if (!session || session.role === 'cliente')
            return;
        const stamp = new Date().toISOString();
        const currentNotas = db.notas || [];
        if (editingId) {
            const nextNotas = currentNotas.map((n) => n.id === editingId
                ? {
                    ...n,
                    ...payload,
                    numero: n.numero,
                }
                : n);
            commitDb({ ...db, notas: nextNotas }, {
                section: 'notas',
                actionLabel: `Nota Nº ${String(payload.numero).padStart(4, '0')} atualizada`,
            });
            showToast(`Nota Nº ${String(payload.numero).padStart(4, '0')} atualizada!`);
            return;
        }
        const assignedNumber = (0, storageAdapter_1.getNextNoteNumber)(db);
        const newNote = {
            id: `NF-${Date.now().toString().slice(-6)}`,
            company_id: session.company_id,
            ...payload,
            numero: assignedNumber,
            criadoPor: session.ownerName,
            criadoEm: stamp,
        };
        commitDb({
            ...db,
            notas: [newNote, ...currentNotas],
            noteSequence: assignedNumber,
        }, {
            section: 'notas',
            actionLabel: `Nota Nº ${String(assignedNumber).padStart(4, '0')} emitida`,
        });
        showToast(`Nota Nº ${String(assignedNumber).padStart(4, '0')} emitida!`);
    };
    const handleMarkNotePrinted = (id) => {
        if (!session || session.role === 'cliente')
            return;
        const nextNotas = (db.notas || []).map((n) => n.id === id ? { ...n, status: 'impressa' } : n);
        commitDb({ ...db, notas: nextNotas }, { section: 'notas', actionLabel: `Nota impressa` });
    };
    const handleDeleteNote = (id) => {
        if (!session || session.role === 'cliente')
            return;
        const nextNotas = (db.notas || []).filter((n) => n.id !== id);
        commitDb({ ...db, notas: nextNotas }, { section: 'notas', actionLabel: `Nota removida` });
        showToast(`Nota removida!`);
    };
    const handleTriggerPrint = (note, threePerPage) => {
        setPrintJob({ note, threePerPage });
        setTimeout(() => {
            window.print();
        }, 120);
    };
    // Employee Management (Admin Only)
    const handleAddEmployee = (payload) => {
        if (!session)
            return { error: 'Sessão inválida.' };
        const res = (0, storageAdapter_1.registerEmployeeForCompany)({
            company_id: session.company_id,
            companyName: session.companyName,
            ...payload,
        });
        if (res.error || !res.employee) {
            return { error: res.error };
        }
        const updatedList = (0, storageAdapter_1.getCompanyEmployees)(session.company_id);
        setEmployees(updatedList);
        commitDb({ ...db, employees: updatedList }, {
            section: 'equipe',
            actionLabel: `Funcionário "${res.employee.ownerName}" (${res.employee.role === 'operador' ? 'Operador' : 'Admin'}) cadastrado`,
        });
        showToast(`Funcionário "${res.employee.ownerName}" cadastrado com sucesso!`);
        return {};
    };
    const handleToggleEmployeeRole = (email, nextRole) => {
        if (!session)
            return;
        const updatedList = (0, storageAdapter_1.updateEmployeeRoleInCompany)(email, session.company_id, nextRole);
        setEmployees(updatedList);
        commitDb({ ...db, employees: updatedList }, {
            section: 'equipe',
            actionLabel: `Permissão de ${email} alterada para ${nextRole === 'operador' ? 'Operador' : 'Administrador'}`,
        });
        showToast(`Perfil de ${email} alterado para ${nextRole === 'operador' ? 'Operador (Seções 2, 4 e 5)' : 'Administrador'}!`);
    };
    const handleDeleteEmployee = (email) => {
        if (!session)
            return;
        const updatedList = (0, storageAdapter_1.deleteEmployeeFromCompany)(email, session.company_id);
        setEmployees(updatedList);
        commitDb({ ...db, employees: updatedList }, {
            section: 'equipe',
            actionLabel: `Funcionário ${email} removido da equipe`,
        });
        showToast(`Funcionário ${email} removido!`);
    };
    const handleImpersonateEmployee = (emp) => {
        const newSession = {
            userId: emp.id,
            company_id: emp.company_id,
            companyName: emp.companyName,
            ownerName: emp.ownerName,
            email: emp.email,
            role: emp.role,
            jobTitle: emp.jobTitle,
            loggedInAt: new Date().toISOString(),
        };
        (0, storageAdapter_1.saveActiveSession)(newSession);
        handleAuthenticated(newSession);
    };
    const counts = {
        companies: db.companies.length,
        inProduction: db.orders.filter((o) => o.stage !== 'faca_pronta').length,
        overdue: financials.overdueCount,
        deliveries: db.deliveries.length,
        openReturns: db.returns.filter((r) => r.status !== 'liberado').length,
        stock: (db.stock || []).length,
        notas: (db.notas || []).length,
        employees: employees.length,
    };
    if (!session) {
        return (react_1.default.createElement("div", { className: "min-h-screen relative overflow-hidden" },
            react_1.default.createElement("div", { className: "blob blob-1" }),
            react_1.default.createElement("div", { className: "blob blob-2" }),
            react_1.default.createElement("div", { className: "blob blob-3" }),
            react_1.default.createElement("div", { className: "blob blob-4" }),
            react_1.default.createElement("div", { className: "blob blob-5" }),
            react_1.default.createElement("div", { className: "relative z-10" },
                react_1.default.createElement(AuthLoginScreen_1.AuthLoginScreen, { onAuthenticated: handleAuthenticated }))));
    }
    // Enforce RBAC section access
    const effectiveSection = session.role === 'operador' &&
        !OPERATOR_ALLOWED_SECTIONS.includes(activeSection)
        ? 'esteira'
        : activeSection;
    const printSlips = printJob
        ? (() => {
            const chunks = (0, NotesSection_1.chunkNoteItems)(printJob.note.items, 6);
            if (printJob.threePerPage && chunks.length === 1) {
                return [chunks[0], chunks[0], chunks[0]];
            }
            return chunks;
        })()
        : [];
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: "no-print min-h-screen text-slate-900 pb-20 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white" },
            react_1.default.createElement("div", { className: "blob blob-1" }),
            react_1.default.createElement("div", { className: "blob blob-2" }),
            react_1.default.createElement("div", { className: "blob blob-3" }),
            react_1.default.createElement("div", { className: "blob blob-4" }),
            react_1.default.createElement("div", { className: "blob blob-5" }),
            react_1.default.createElement("div", { className: "max-w-[1720px] mx-auto flex gap-5 relative z-10 p-3 md:p-6 lg:p-7" },
                react_1.default.createElement(HeaderBar_1.LiquidSidebar, { activeSection: effectiveSection, onSelectSection: handleSelectSection, tenantName: session.companyName, userRole: session.role, userName: session.ownerName, onLogout: handleLogout, counts: counts }),
                react_1.default.createElement("div", { className: "flex-1 flex flex-col gap-5 min-w-0" },
                    react_1.default.createElement(HeaderBar_1.HeaderBar, { activeSection: effectiveSection, onSelectSection: handleSelectSection, searchQuery: searchQuery, onSearchChange: setSearchQuery, onOpenNewOrder: () => setIsNewModalOpen(true), tenantName: session.companyName, userRole: session.role, userName: session.ownerName, realtimeStatus: realtimeStatus, onLogout: handleLogout, counts: counts }),
                    react_1.default.createElement("main", { className: "flex-1 flex flex-col gap-5" },
                        session.role === 'admin' && effectiveSection === 'bento_home' && (react_1.default.createElement(BentoOverviewSection_1.BentoOverviewSection, { companies: filteredCompanies, orders: filteredOrders, deliveries: db.deliveries, returns: db.returns, stock: db.stock || [], financials: financials, onNavigate: handleSelectSection, onOpenNewOrder: () => setIsNewModalOpen(true), onSelectCompany: (id) => setSelectedCompanyId(id) })),
                        session.role === 'admin' && effectiveSection === 'empresas' && (react_1.default.createElement(CompaniesCrmSection_1.CompaniesCrmSection, { companies: filteredCompanies, orders: filteredOrders, selectedCompanyId: selectedCompanyId, onSelectCompany: setSelectedCompanyId, onAddCompany: handleAddCompany, onDeleteCompany: handleDeleteCompany, onDeleteOrder: handleDeleteOrder, onAddDieForCompany: (comp, desc, val, mod) => handleCreateOrderFull({
                                companyId: comp.id,
                                companyName: comp.corporateName,
                                companyPhone: comp.phone,
                                toolDescription: desc,
                                amount: val,
                                paymentModality: mod,
                                stage: 'arquivo_recebido',
                            }) })),
                        effectiveSection === 'esteira' && (react_1.default.createElement(ProductionKanban_1.ProductionKanban, { orders: filteredOrders, pendingOrderIds: pendingOrderIds, moveError: moveError, onMoveStage: handleMoveStage, onDeleteOrder: handleDeleteOrder, onQuickRegisterDelivery: (order) => {
                                setPrefillDeliveryOrder(order);
                                handleSelectSection('entregas');
                            } })),
                        session.role === 'admin' && effectiveSection === 'financeiro' && (react_1.default.createElement(FinanceAnalyticsSection_1.FinanceAnalyticsSection, { orders: filteredOrders, financials: financials, expenses: db.expenses || [], serviceProviders: db.serviceProviders || [], payrollEmployees: db.payrollEmployees || [], investments: db.investments || [], onTogglePaid: handleTogglePaid, onEmitBilling30d: handleEmitBilling30d, onDeleteOrder: handleDeleteOrder, onUpsertMonthExpenses: handleUpsertMonthExpenses, onAddProvider: handleAddProvider, onUpdateProvider: handleUpdateProvider, onDeleteProvider: handleDeleteProvider, onAddPayrollEmployee: handleAddPayrollEmployee, onUpdatePayrollEmployee: handleUpdatePayrollEmployee, onDeletePayrollEmployee: handleDeletePayrollEmployee, onAddInvestment: handleAddInvestment, onUpdateInvestment: handleUpdateInvestment, onDeleteInvestment: handleDeleteInvestment })),
                        effectiveSection === 'entregas' && (react_1.default.createElement(DeliveriesLogisticsSection_1.DeliveriesLogisticsSection, { orders: db.orders, deliveries: db.deliveries, prefillOrder: prefillDeliveryOrder, onAddDelivery: handleAddDelivery, onDeleteDelivery: handleDeleteDelivery })),
                        effectiveSection === 'retornos' && (react_1.default.createElement(WarrantyReturnsSection_1.WarrantyReturnsSection, { orders: db.orders, returns: db.returns, onAddReturn: handleAddReturn, onUpdateReturnStatus: handleUpdateReturnStatus, onDeleteReturn: handleDeleteReturn })),
                        effectiveSection === 'estoque' && (react_1.default.createElement(StockSection_1.StockSection, { items: db.stock || [], globalSearchQuery: searchQuery, onAddItem: handleAddStockItem, onUpdateItem: handleUpdateStockItem, onDeleteItem: handleDeleteStockItem })),
                        effectiveSection === 'notas' && session.role !== 'cliente' && (react_1.default.createElement(NotesSection_1.NotesSection, { notas: db.notas || [], companies: db.companies, orders: db.orders, nextNoteNumber: nextNoteNumber, tenantName: session.companyName, currentUserName: session.ownerName, globalSearchQuery: searchQuery, onSaveNote: handleSaveNote, onMarkNotePrinted: handleMarkNotePrinted, onDeleteNote: handleDeleteNote, onTriggerPrint: handleTriggerPrint })),
                        session.role === 'admin' && effectiveSection === 'equipe' && (react_1.default.createElement(TeamManagementSection_1.TeamManagementSection, { session: session, employees: employees, onAddEmployee: handleAddEmployee, onToggleEmployeeRole: handleToggleEmployeeRole, onDeleteEmployee: handleDeleteEmployee, onImpersonateEmployee: handleImpersonateEmployee }))))),
            toast && (react_1.default.createElement("div", { className: "fixed bottom-20 right-6 z-50 px-4 py-3 rounded-2xl liquid-glass ring-2 ring-indigo-400/50 text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2" },
                react_1.default.createElement(lucide_react_1.CheckCircle2, { className: "w-4 h-4 text-emerald-600 shrink-0" }),
                react_1.default.createElement("span", null, toast.message))),
            session.role === 'admin' && (react_1.default.createElement("button", { type: "button", onClick: () => setIsNewModalOpen(true), className: "md:hidden fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white border border-white/40 shadow-2xl shadow-indigo-600/40 transition-all cursor-pointer" },
                react_1.default.createElement("span", null, "Nova OS"))),
            session.role === 'admin' && (react_1.default.createElement(FastEntryModal_1.FastEntryModal, { isOpen: isNewModalOpen, onClose: () => setIsNewModalOpen(false), companies: db.companies, nextOrderId: nextOrderId, onSaveOrder: handleCreateOrderFull }))),
        printJob && (react_1.default.createElement("div", { className: "print-only-container" }, printSlips.map((chunk, idx) => (react_1.default.createElement(NotesSection_1.CanhotoSlipCard, { key: `print-${printJob.note.id}-${idx}`, note: printJob.note, itemsChunk: chunk, slipIndex: printJob.threePerPage && (0, NotesSection_1.chunkNoteItems)(printJob.note.items, 6).length === 1 ? 0 : idx, totalSlips: (0, NotesSection_1.chunkNoteItems)(printJob.note.items, 6).length, tenantName: session.companyName, isPrintMode: true })))))));
};
exports.App = App;
exports.default = exports.App;

  },
  { dir: "." }
);

__moduleFactories["./main"] = Object.assign(
  function(module, exports, require) {
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const App_1 = require("./App");
const container = document.getElementById('root');
if (container) {
    const root = (0, client_1.createRoot)(container);
    root.render(react_1.default.createElement(react_1.default.StrictMode, null,
        react_1.default.createElement(App_1.App, null)));
}

  },
  { dir: "." }
);

// Bootstrap main entry
__require('.', './main');
