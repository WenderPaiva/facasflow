import {
  AuthSession,
  BackupLogRecord,
  BackupRecord,
  Company,
  CompanySettingsRecord,
  DeliveryRecord,
  DieOrder,
  EnterpriseDatabase,
  ExpensePaymentMethod,
  ExpenseRecord,
  InvestmentRecord,
  NoteItem,
  NoteRecord,
  PaymentModality,
  PayrollEmployeeRecord,
  ProductionStage,
  ReturnStatus,
  ServiceProviderRecord,
  StockItem,
  TenantAccount,
  UserRole,
  WarrantyReturnRecord,
} from '../types/order';
import {
  addDays,
  PAYMENT_MODALITY_META,
  roundCurrencyBRL,
  toISODate,
} from '../utils/financeEngine';
import { getSupabaseClient } from './supabaseClient';

function toExpensePayment(mod: PaymentModality): ExpensePaymentMethod {
  if (mod === 'boleto') return 'boleto_30';
  return mod;
}

function fromExpensePayment(pm: string): PaymentModality {
  if (pm === 'boleto_15' || pm === 'boleto_30') return 'boleto';
  if (pm === 'pix' || pm === 'dinheiro' || pm === 'cartao' || pm === 'nao_pago') {
    return pm;
  }
  return 'pix';
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function resolveProfileSession(userId: string, email: string): Promise<AuthSession> {
  const sb = getSupabaseClient();
  const { data: perfil, error: pErr } = await sb
    .from('perfis')
    .select('id, empresa_id, nome, email, role, cargo, ativo, deleted_at')
    .eq('id', userId)
    .is('deleted_at', null)
    .eq('ativo', true)
    .maybeSingle();

  if (pErr || !perfil) {
    throw new Error(
      pErr?.message || 'Perfil de empresa não localizado para este usuário.'
    );
  }

  const { data: empresa } = await sb
    .from('empresas')
    .select('id, nome')
    .eq('id', perfil.empresa_id)
    .is('deleted_at', null)
    .maybeSingle();

  return {
    userId: perfil.id,
    company_id: perfil.empresa_id,
    empresaId: perfil.empresa_id,
    companyName: empresa?.nome || 'Facaria',
    ownerName: perfil.nome || email.split('@')[0],
    email: perfil.email || email,
    role:
      perfil.role === 'operador'
        ? 'operador'
        : perfil.role === 'cliente'
        ? 'cliente'
        : 'admin',
    jobTitle: perfil.cargo || undefined,
    loggedInAt: new Date().toISOString(),
  };
}

export async function restoreSupabaseSession(): Promise<AuthSession | null> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.auth.getSession();
  if (error || !data?.session?.user) {
    return null;
  }
  try {
    return await resolveProfileSession(
      data.session.user.id,
      data.session.user.email || ''
    );
  } catch {
    return null;
  }
}

export async function signInWithSupabase(
  emailInput: string,
  passwordInput: string
): Promise<{ session?: AuthSession; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  if (!email || !password) {
    return { error: 'Preencha seu e-mail e senha para entrar.' };
  }

  const sb = getSupabaseClient();
  let { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error && String(error.message || '').toLowerCase().includes('email not confirmed')) {
    const retryConfirm = await sb.auth.signUp({ email, password });
    if (retryConfirm.data?.session && retryConfirm.data?.user) {
      data = { user: retryConfirm.data.user, session: retryConfirm.data.session };
      error = null;
    }
  }
  if (error || !data?.user) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('email not confirmed')) {
      return { error: 'Confirme seu e-mail antes de acessar o painel.' };
    }
    if (msg.includes('invalid login credentials')) {
      return { error: 'E-mail ou senha inválidos. Verifique suas credenciais.' };
    }
    return { error: error?.message || 'Não foi possível autenticar.' };
  }

  try {
    const session = await resolveProfileSession(data.user.id, data.user.email || email);
    return { session };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao carregar perfil da empresa.' };
  }
}

export async function signUpWithSupabase(payload: {
  companyName: string;
  ownerName: string;
  email: string;
  password: string;
}): Promise<{ session?: AuthSession; error?: string; needsEmailConfirmation?: boolean }> {
  const email = payload.email.trim().toLowerCase();
  const companyName = payload.companyName.trim();
  const ownerName = payload.ownerName.trim() || companyName;
  const password = payload.password.trim();

  if (!companyName || !email || password.length < 6) {
    return {
      error: 'Preencha empresa, e-mail válido e senha com no mínimo 6 caracteres.',
    };
  }

  const sb = getSupabaseClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        owner_name: ownerName,
      },
    },
  });

  if (error) {
    return { error: error.message || 'Não foi possível criar a conta.' };
  }

  if (!data.session && data.user) {
    // Attempt immediate sign-in in case auto-confirm completed asynchronously
    const retry = await sb.auth.signInWithPassword({ email, password });
    if (retry.data?.session && retry.data?.user) {
      const session = await resolveProfileSession(retry.data.user.id, email);
      return { session };
    }
    return {
      needsEmailConfirmation: true,
      error: 'Conta criada! Verifique sua caixa de entrada para confirmar o e-mail e fazer login.',
    };
  }

  if (data.user) {
    try {
      const session = await resolveProfileSession(data.user.id, email);
      return { session };
    } catch (err: any) {
      return { error: err?.message || 'Conta criada, mas perfil não carregou.' };
    }
  }

  return { error: 'Não foi possível concluir o cadastro.' };
}

export async function signOutSupabase(): Promise<void> {
  const sb = getSupabaseClient();
  await sb.auth.signOut();
}

export async function loadCompanyDatabaseFromSupabase(
  empresaId: string,
  role: UserRole
): Promise<EnterpriseDatabase> {
  const sb = getSupabaseClient();

  const [
    companiesRes,
    ordersRes,
    deliveriesRes,
    returnsRes,
    stockRes,
    notasRes,
    notaItensRes,
    despesasRes,
    providersRes,
    payrollRes,
    investmentsRes,
    perfisRes,
  ] = await Promise.all([
    sb
      .from('clientes_empresas')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    sb
      .from('ordens_servico')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    sb
      .from('entregas')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    sb
      .from('retornos')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    role !== 'cliente'
      ? sb
          .from('estoque_itens')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role !== 'cliente'
      ? sb
          .from('notas')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('numero', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role !== 'cliente'
      ? sb
          .from('nota_itens')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
    role === 'admin'
      ? sb
          .from('despesas')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('data_competencia', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === 'admin'
      ? sb
          .from('prestadores_servico')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === 'admin'
      ? sb
          .from('funcionarios_folha')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === 'admin'
      ? sb
          .from('investimentos')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === 'admin'
      ? sb
          .from('perfis')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .eq('ativo', true)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const queryErrors = [
    ['clientes_empresas', companiesRes.error],
    ['ordens_servico', ordersRes.error],
    ['entregas', deliveriesRes.error],
    ['retornos', returnsRes.error],
    ['estoque_itens', stockRes.error],
    ['notas', notasRes.error],
    ['nota_itens', notaItensRes.error],
    ['despesas', despesasRes.error],
    ['prestadores_servico', providersRes.error],
    ['funcionarios_folha', payrollRes.error],
    ['investimentos', investmentsRes.error],
    ['perfis', perfisRes.error],
  ].filter(([, err]) => Boolean(err)) as Array<[string, { message?: string }]>;

  if (queryErrors.length > 0) {
    const details = queryErrors
      .map(([tbl, err]) => `${tbl}: ${err?.message || 'erro desconhecido'}`)
      .join(' | ');
    throw new Error(`Falha ao carregar dados do Supabase (${details}).`);
  }

  const companies: Company[] = (companiesRes.data || []).map((c: any) => ({
    id: c.codigo_legado || c.id,
    dbUuid: c.id,
    company_id: c.empresa_id,
    corporateName: c.razao_social,
    cnpj: c.cnpj || '',
    phone: c.telefone || '',
    contactName: c.contato_nome || '',
    city: c.cidade || undefined,
  }));

  const orders: DieOrder[] = (ordersRes.data || []).map((o: any) => ({
    id: o.numero_os,
    dbUuid: o.id,
    company_id: o.empresa_id,
    companyId: o.cliente_codigo_legado || o.cliente_empresa_id || '',
    companyUuid: o.cliente_empresa_id || undefined,
    companyName: o.cliente_nome,
    companyPhone: o.cliente_telefone || '',
    toolDescription: o.descricao_ferramenta,
    bladeMeters: o.blade_meters != null ? Number(o.blade_meters) : undefined,
    woodMm: o.wood_mm || undefined,
    amount: Number(o.valor) || 0,
    paymentModality: o.forma_pagamento as PaymentModality,
    paymentStatus: o.status_pagamento,
    stage: o.etapa as ProductionStage,
    stageUpdatedAt: o.etapa_atualizada_em || '',
    stageHistory: Array.isArray(o.historico_etapas) ? o.historico_etapas : [],
    version: Number(o.version) || 1,
    updatedAt: o.updated_at || o.created_at,
    createdAt: String(o.created_at || '').slice(0, 10),
    dueDate: String(o.data_vencimento || '').slice(0, 10),
    paidAt: o.data_pagamento ? String(o.data_pagamento).slice(0, 10) : undefined,
  }));

  const deliveries: DeliveryRecord[] = (deliveriesRes.data || []).map((d: any) => ({
    id: d.codigo_legado || d.id,
    dbUuid: d.id,
    company_id: d.empresa_id,
    orderId: d.numero_os,
    toolDescription: d.descricao_ferramenta,
    companyName: d.cliente_nome,
    method: d.metodo,
    carrierOrPersonName: d.responsavel,
    dispatchedAt: d.despachado_em,
    notes: d.observacao || undefined,
  }));

  const returns: WarrantyReturnRecord[] = (returnsRes.data || []).map((r: any) => ({
    id: r.codigo_legado || r.id,
    dbUuid: r.id,
    company_id: r.empresa_id,
    orderId: r.numero_os,
    companyName: r.cliente_nome,
    toolDescription: r.descricao_ferramenta,
    reason: r.motivo,
    technicalAction: r.acao_tecnica,
    adjustmentAmount: Number(r.valor_ajuste) || 0,
    status: r.status as ReturnStatus,
    createdAt: r.data_retorno || String(r.created_at || '').slice(0, 10),
    updatedAt: String(r.updated_at || ''),
  }));

  const stock: StockItem[] = (stockRes.data || []).map((s: any) => ({
    id: s.codigo_legado || s.id,
    dbUuid: s.id,
    company_id: s.empresa_id,
    category: s.categoria === 'laminas' ? 'laminas' : 'madeiras',
    name: s.nome,
    quantity: Number(s.quantidade) || 0,
    unit: s.unidade,
    minStock: Number(s.estoque_minimo) || 0,
    supplier: s.fornecedor || 'Não informado',
    unitCost: Number(s.custo_unitario) || 0,
    entryDate: String(s.data_entrada || '').slice(0, 10),
    updatedAt: String(s.updated_at || ''),
  }));

  const itemsByNota = new Map<string, NoteItem[]>();
  for (const row of notaItensRes.data || []) {
    const arr = itemsByNota.get(row.nota_id) || [];
    arr.push({
      id: row.id,
      descricao: row.descricao,
      quantidade: Number(row.quantidade) || 1,
      precoUnitario: Number(row.preco_unitario) || 0,
      total: Number(row.total) || 0,
    });
    itemsByNota.set(row.nota_id, arr);
  }

  const notas: NoteRecord[] = (notasRes.data || []).map((n: any) => ({
    id: n.id,
    company_id: n.empresa_id,
    numero: Number(n.numero) || 1,
    data: String(n.data || '').slice(0, 10),
    empresaId: n.cliente_empresa_id || undefined,
    clienteNome: n.cliente_nome,
    cnpj: n.cnpj || '',
    contato: n.contato || '',
    endereco: n.endereco || undefined,
    entreguePor: n.entregue_por || undefined,
    osId: n.os_numero || undefined,
    status: n.status,
    items: itemsByNota.get(n.id) || [],
    total: Number(n.total) || 0,
    criadoPor: n.criado_por || '',
    criadoEm: n.created_at || '',
  }));

  const despesas: ExpenseRecord[] = (despesasRes.data || []).map((d: any) => ({
    id: d.id,
    empresa_id: d.empresa_id,
    categoria: d.categoria,
    descricao: d.descricao || '',
    valor: roundCurrencyBRL(Number(d.valor) || 0),
    data_competencia: String(d.data_competencia || '').slice(0, 10),
    data_vencimento: d.data_vencimento ? String(d.data_vencimento).slice(0, 10) : undefined,
    data_pagamento: d.data_pagamento ? String(d.data_pagamento).slice(0, 10) : undefined,
    status: d.status,
    forma_pagamento: d.forma_pagamento,
    fornecedor: d.fornecedor || undefined,
    observacao: d.observacao || undefined,
    created_by: d.created_by,
    updated_by: d.updated_by,
    created_at: d.created_at,
    updated_at: d.updated_at,
    deleted_at: d.deleted_at,
  }));

  const serviceProviders: ServiceProviderRecord[] = (providersRes.data || []).map(
    (p: any) => ({
      id: p.codigo_legado || p.id,
      dbUuid: p.id,
      company_id: p.empresa_id,
      name: p.nome,
      service: p.servico,
      amount: Number(p.valor) || 0,
      paymentModality: fromExpensePayment(p.forma_pagamento),
      dueDate: String(p.data_vencimento || '').slice(0, 10),
      status: p.status,
      updatedAt: String(p.updated_at || ''),
    })
  );

  const payrollEmployees: PayrollEmployeeRecord[] = (payrollRes.data || []).map(
    (e: any) => ({
      id: e.codigo_legado || e.id,
      dbUuid: e.id,
      company_id: e.empresa_id,
      name: e.nome,
      roleTitle: e.cargo,
      salary: Number(e.salario) || 0,
      admissionDate: String(e.data_admissao || '').slice(0, 10),
      updatedAt: String(e.updated_at || ''),
    })
  );

  const investments: InvestmentRecord[] = (investmentsRes.data || []).map((i: any) => ({
    id: i.codigo_legado || i.id,
    dbUuid: i.id,
    company_id: i.empresa_id,
    assetName: i.nome_ativo,
    assetType: i.tipo_ativo,
    appliedDate: String(i.data_aplicacao || '').slice(0, 10),
    investedAmount: Number(i.valor_aplicado) || 0,
    currentAmount: Number(i.valor_atual) || 0,
    updatedAt: String(i.updated_at || ''),
  }));

  const employees: TenantAccount[] = (perfisRes.data || []).map((pf: any) => ({
    id: pf.id,
    company_id: pf.empresa_id,
    companyName: '',
    ownerName: pf.nome,
    email: pf.email,
    password: '',
    role: pf.role,
    jobTitle: pf.cargo || '',
    createdAt: String(pf.created_at || '').slice(0, 10),
  }));

  const noteSequence = notas.reduce(
    (mx, n) => Math.max(mx, Number(n.numero) || 0),
    0
  );

  return {
    version: 6,
    company_id: empresaId,
    companies,
    orders,
    deliveries,
    returns,
    stock,
    notas,
    noteSequence,
    despesas,
    expenses: [],
    serviceProviders,
    payrollEmployees,
    investments,
    employees,
  };
}

// ============================================================================
// Direct CRUD Operations to Supabase (Soft Delete + Audit Triggers)
// ============================================================================

export async function dbCreateCompany(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<Company, 'id'>
): Promise<Company> {
  const sb = getSupabaseClient();
  const id = generateUuid();
  const { data, error } = await sb
    .from('clientes_empresas')
    .insert({
      id,
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      razao_social: payload.corporateName,
      cnpj: payload.cnpj,
      telefone: payload.phone,
      contato_nome: payload.contactName,
      cidade: payload.city || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    corporateName: data.razao_social,
    cnpj: data.cnpj,
    phone: data.telefone,
    contactName: data.contato_nome,
    city: data.cidade || undefined,
  };
}

export async function dbSoftDeleteCompany(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('clientes_empresas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbCreateOrder(
  empresaId: string,
  numeroOs: string,
  payload: {
    companyId: string;
    companyUuid?: string;
    companyName: string;
    companyPhone: string;
    toolDescription: string;
    amount: number;
    paymentModality: PaymentModality;
    stage: ProductionStage;
    stageUpdatedAt: string;
  }
): Promise<DieOrder> {
  const sb = getSupabaseClient();
  const today = toISODate();
  const days = PAYMENT_MODALITY_META[payload.paymentModality]?.defaultDays ?? 30;
  let payStatus: 'pago' | 'a_receber' | 'nao_pago' = 'a_receber';
  if (payload.paymentModality === 'nao_pago') payStatus = 'nao_pago';
  else if (payload.paymentModality === 'pix' || payload.paymentModality === 'dinheiro') {
    payStatus = 'pago';
  }
  const dueDate = addDays(today, days);
  const paidAt = payStatus === 'pago' ? today : null;
  const hist = [{ stage: payload.stage, timestamp: payload.stageUpdatedAt }];

  const { data, error } = await sb
    .from('ordens_servico')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      numero_os: numeroOs,
      cliente_empresa_id: payload.companyUuid || null,
      cliente_codigo_legado: payload.companyId,
      cliente_nome: payload.companyName,
      cliente_telefone: payload.companyPhone,
      descricao_ferramenta: payload.toolDescription,
      valor: roundCurrencyBRL(payload.amount),
      forma_pagamento: payload.paymentModality,
      status_pagamento: payStatus,
      etapa: payload.stage,
      etapa_atualizada_em: payload.stageUpdatedAt,
      historico_etapas: hist,
      version: 1,
      data_vencimento: dueDate,
      data_pagamento: paidAt,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.numero_os,
    dbUuid: data.id,
    company_id: data.empresa_id,
    companyId: data.cliente_codigo_legado || payload.companyId,
    companyUuid: data.cliente_empresa_id || undefined,
    companyName: data.cliente_nome,
    companyPhone: data.cliente_telefone,
    toolDescription: data.descricao_ferramenta,
    amount: Number(data.valor) || 0,
    paymentModality: data.forma_pagamento,
    paymentStatus: data.status_pagamento,
    stage: data.etapa,
    stageUpdatedAt: data.etapa_atualizada_em,
    stageHistory: data.historico_etapas || hist,
    version: Number(data.version) || 1,
    updatedAt: data.updated_at,
    createdAt: String(data.created_at || today).slice(0, 10),
    dueDate: String(data.data_vencimento || dueDate).slice(0, 10),
    paidAt: data.data_pagamento ? String(data.data_pagamento).slice(0, 10) : undefined,
  };
}

export async function dbMoveOrderStage(
  ordemUuid: string,
  targetStage: ProductionStage,
  stamp: string
): Promise<{ version: number; updatedAt: string }> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.rpc('mover_faca_v2', {
    p_ordem_id: ordemUuid,
    p_etapa: targetStage,
    p_etapa_atualizada_em: stamp,
  });
  if (error) throw new Error(error.message);
  return {
    version: Number(data?.version) || 1,
    updatedAt: data?.updated_at || new Date().toISOString(),
  };
}

export async function dbUpdateOrderPayment(
  empresaId: string,
  ordemUuid: string,
  updates: {
    status_pagamento: 'pago' | 'a_receber' | 'vencido' | 'sem_nota' | 'nao_pago';
    data_pagamento?: string | null;
    data_vencimento?: string;
    version: number;
  }
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('ordens_servico')
    .update({
      status_pagamento: updates.status_pagamento,
      data_pagamento: updates.data_pagamento ?? null,
      ...(updates.data_vencimento ? { data_vencimento: updates.data_vencimento } : {}),
      version: updates.version,
    })
    .eq('id', ordemUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbSoftDeleteOrder(empresaId: string, ordemUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('ordens_servico')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', ordemUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbCreateDelivery(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<DeliveryRecord, 'id'>,
  ordemUuid?: string
): Promise<DeliveryRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('entregas')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      ordem_id: ordemUuid || null,
      numero_os: payload.orderId,
      cliente_nome: payload.companyName,
      descricao_ferramenta: payload.toolDescription,
      metodo: payload.method,
      responsavel: payload.carrierOrPersonName,
      despachado_em: payload.dispatchedAt,
      observacao: payload.notes || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    orderId: data.numero_os,
    toolDescription: data.descricao_ferramenta,
    companyName: data.cliente_nome,
    method: data.metodo,
    carrierOrPersonName: data.responsavel,
    dispatchedAt: data.despachado_em,
    notes: data.observacao || undefined,
  };
}

export async function dbSoftDeleteDelivery(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('entregas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbCreateReturn(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<WarrantyReturnRecord, 'id'>,
  ordemUuid?: string
): Promise<WarrantyReturnRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('retornos')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      ordem_id: ordemUuid || null,
      numero_os: payload.orderId,
      cliente_nome: payload.companyName,
      descricao_ferramenta: payload.toolDescription,
      motivo: payload.reason,
      acao_tecnica: payload.technicalAction,
      valor_ajuste: roundCurrencyBRL(payload.adjustmentAmount),
      status: payload.status,
      data_retorno: payload.createdAt,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    orderId: data.numero_os,
    companyName: data.cliente_nome,
    toolDescription: data.descricao_ferramenta,
    reason: data.motivo,
    technicalAction: data.acao_tecnica,
    adjustmentAmount: Number(data.valor_ajuste) || 0,
    status: data.status,
    createdAt: data.data_retorno,
    updatedAt: data.updated_at,
  };
}

export async function dbUpdateReturnStatus(
  empresaId: string,
  dbUuid: string,
  status: ReturnStatus
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('retornos')
    .update({ status })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbSoftDeleteReturn(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('retornos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

// ESTOQUE (preserva todas as regras de negócio; persistência real + soft delete no Supabase)
export async function dbCreateStockItem(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
): Promise<StockItem> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('estoque_itens')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      categoria: payload.category,
      nome: payload.name,
      quantidade: payload.quantity,
      unidade: payload.unit,
      estoque_minimo: payload.minStock,
      fornecedor: payload.supplier,
      custo_unitario: payload.unitCost,
      data_entrada: payload.entryDate || toISODate(),
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    category: data.categoria,
    name: data.nome,
    quantity: Number(data.quantidade) || 0,
    unit: data.unidade,
    minStock: Number(data.estoque_minimo) || 0,
    supplier: data.fornecedor,
    unitCost: Number(data.custo_unitario) || 0,
    entryDate: String(data.data_entrada || '').slice(0, 10),
    updatedAt: data.updated_at,
  };
}

export async function dbUpdateStockItem(
  empresaId: string,
  dbUuid: string,
  payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
): Promise<StockItem> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('estoque_itens')
    .update({
      categoria: payload.category,
      nome: payload.name,
      quantidade: payload.quantity,
      unidade: payload.unit,
      estoque_minimo: payload.minStock,
      fornecedor: payload.supplier,
      custo_unitario: payload.unitCost,
      data_entrada: payload.entryDate || toISODate(),
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    category: data.categoria,
    name: data.nome,
    quantity: Number(data.quantidade) || 0,
    unit: data.unidade,
    minStock: Number(data.estoque_minimo) || 0,
    supplier: data.fornecedor,
    unitCost: Number(data.custo_unitario) || 0,
    entryDate: String(data.data_entrada || '').slice(0, 10),
    updatedAt: data.updated_at,
  };
}

export async function dbSoftDeleteStockItem(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('estoque_itens')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

// NOTAS (server-side total + soft delete)
export async function dbSaveNote(
  empresaId: string,
  actorName: string,
  payload: Omit<NoteRecord, 'id' | 'company_id' | 'criadoPor' | 'criadoEm'>,
  editingId?: string
): Promise<NoteRecord> {
  const sb = getSupabaseClient();
  const noteId = editingId || generateUuid();

  if (editingId) {
    const { error: upErr } = await sb
      .from('notas')
      .update({
        data: payload.data,
        cliente_nome: payload.clienteNome,
        cnpj: payload.cnpj,
        contato: payload.contato,
        endereco: payload.endereco || null,
        entregue_por: payload.entreguePor || null,
        os_numero: payload.osId || null,
        status: payload.status,
      })
      .eq('id', editingId)
      .eq('empresa_id', empresaId);
    if (upErr) throw new Error(upErr.message);

    // Soft-delete previous items cleanly
    await sb
      .from('nota_itens')
      .update({ deleted_at: new Date().toISOString() })
      .eq('nota_id', editingId)
      .eq('empresa_id', empresaId)
      .is('deleted_at', null);
  } else {
    const { error: insErr } = await sb.from('notas').insert({
      id: noteId,
      empresa_id: empresaId,
      numero: 0, // assigned atomically per company by trg_notas_prepare
      data: payload.data,
      cliente_nome: payload.clienteNome,
      cnpj: payload.cnpj,
      contato: payload.contato,
      endereco: payload.endereco || null,
      entregue_por: payload.entreguePor || null,
      os_numero: payload.osId || null,
      status: payload.status,
      criado_por: actorName,
    });
    if (insErr) throw new Error(insErr.message);
  }

  const itemRows = payload.items.map((it) => ({
    id: generateUuid(),
    empresa_id: empresaId,
    nota_id: noteId,
    descricao: it.descricao,
    quantidade: it.quantidade,
    preco_unitario: it.precoUnitario,
  }));

  if (itemRows.length > 0) {
    const { error: itemErr } = await sb.from('nota_itens').insert(itemRows);
    if (itemErr) throw new Error(itemErr.message);
  }

  const { data: savedNote, error: fetchErr } = await sb
    .from('notas')
    .select('*')
    .eq('id', noteId)
    .single();
  if (fetchErr || !savedNote) throw new Error(fetchErr?.message || 'Erro ao recarregar nota.');

  const { data: savedItems } = await sb
    .from('nota_itens')
    .select('*')
    .eq('nota_id', noteId)
    .is('deleted_at', null);

  return {
    id: savedNote.id,
    company_id: savedNote.empresa_id,
    numero: Number(savedNote.numero),
    data: String(savedNote.data).slice(0, 10),
    empresaId: savedNote.cliente_empresa_id || undefined,
    clienteNome: savedNote.cliente_nome,
    cnpj: savedNote.cnpj,
    contato: savedNote.contato,
    endereco: savedNote.endereco || undefined,
    entreguePor: savedNote.entregue_por || undefined,
    osId: savedNote.os_numero || undefined,
    status: savedNote.status,
    items: (savedItems || []).map((it: any) => ({
      id: it.id,
      descricao: it.descricao,
      quantidade: Number(it.quantidade),
      precoUnitario: Number(it.preco_unitario),
      total: Number(it.total),
    })),
    total: Number(savedNote.total) || 0,
    criadoPor: savedNote.criado_por || actorName,
    criadoEm: savedNote.created_at,
  };
}

export async function dbUpdateNoteStatus(
  empresaId: string,
  noteId: string,
  status: NoteRecord['status']
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('notas')
    .update({ status })
    .eq('id', noteId)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbSoftDeleteNote(empresaId: string, noteId: string): Promise<void> {
  const sb = getSupabaseClient();
  const stamp = new Date().toISOString();
  await sb
    .from('nota_itens')
    .update({ deleted_at: stamp })
    .eq('nota_id', noteId)
    .eq('empresa_id', empresaId)
    .is('deleted_at', null);
  const { error } = await sb
    .from('notas')
    .update({ deleted_at: stamp })
    .eq('id', noteId)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

// ============================================================================
// DESPESAS (Seção 3 - CRUD Direto no Supabase + Soft Delete)
// ============================================================================

export type ExpenseDraftPayload = Omit<
  ExpenseRecord,
  'id' | 'empresa_id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export async function dbCreateExpense(
  empresaId: string,
  payload: ExpenseDraftPayload
): Promise<ExpenseRecord> {
  const sb = getSupabaseClient();
  const roundedVal = roundCurrencyBRL(payload.valor);
  const { data, error } = await sb
    .from('despesas')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      categoria: payload.categoria,
      descricao: payload.descricao.trim() || null,
      valor: roundedVal,
      data_competencia: payload.data_competencia,
      data_vencimento: payload.data_vencimento || null,
      data_pagamento: payload.data_pagamento || null,
      status: payload.status,
      forma_pagamento: payload.forma_pagamento,
      fornecedor: payload.fornecedor?.trim() || null,
      observacao: payload.observacao?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    descricao: data.descricao || '',
    valor: roundCurrencyBRL(Number(data.valor)),
    data_competencia: String(data.data_competencia).slice(0, 10),
    data_vencimento: data.data_vencimento ? String(data.data_vencimento).slice(0, 10) : undefined,
    data_pagamento: data.data_pagamento ? String(data.data_pagamento).slice(0, 10) : undefined,
    fornecedor: data.fornecedor || undefined,
    observacao: data.observacao || undefined,
  };
}

export async function dbUpdateExpense(
  empresaId: string,
  expenseId: string,
  payload: ExpenseDraftPayload
): Promise<ExpenseRecord> {
  const sb = getSupabaseClient();
  const roundedVal = roundCurrencyBRL(payload.valor);
  const { data, error } = await sb
    .from('despesas')
    .update({
      categoria: payload.categoria,
      descricao: payload.descricao.trim() || null,
      valor: roundedVal,
      data_competencia: payload.data_competencia,
      data_vencimento: payload.data_vencimento || null,
      data_pagamento: payload.data_pagamento || null,
      status: payload.status,
      forma_pagamento: payload.forma_pagamento,
      fornecedor: payload.fornecedor?.trim() || null,
      observacao: payload.observacao?.trim() || null,
    })
    .eq('id', expenseId)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    descricao: data.descricao || '',
    valor: roundCurrencyBRL(Number(data.valor)),
    data_competencia: String(data.data_competencia).slice(0, 10),
    data_vencimento: data.data_vencimento ? String(data.data_vencimento).slice(0, 10) : undefined,
    data_pagamento: data.data_pagamento ? String(data.data_pagamento).slice(0, 10) : undefined,
    fornecedor: data.fornecedor || undefined,
    observacao: data.observacao || undefined,
  };
}

export async function dbSoftDeleteExpense(
  empresaId: string,
  expenseId: string
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('despesas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', expenseId)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

// PRESTADORES, FUNCIONÁRIOS FOLHA, INVESTIMENTOS
export async function dbCreateProvider(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<ServiceProviderRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('prestadores_servico')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      nome: payload.name,
      servico: payload.service,
      valor: roundCurrencyBRL(payload.amount),
      forma_pagamento: toExpensePayment(payload.paymentModality),
      data_vencimento: payload.dueDate || toISODate(),
      status: payload.status,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    name: data.nome,
    service: data.servico,
    amount: Number(data.valor),
    paymentModality: fromExpensePayment(data.forma_pagamento),
    dueDate: String(data.data_vencimento).slice(0, 10),
    status: data.status,
    updatedAt: data.updated_at,
  };
}

export async function dbUpdateProvider(
  empresaId: string,
  dbUuid: string,
  payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<ServiceProviderRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('prestadores_servico')
    .update({
      nome: payload.name,
      servico: payload.service,
      valor: roundCurrencyBRL(payload.amount),
      forma_pagamento: toExpensePayment(payload.paymentModality),
      data_vencimento: payload.dueDate || toISODate(),
      status: payload.status,
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    name: data.nome,
    service: data.servico,
    amount: Number(data.valor),
    paymentModality: fromExpensePayment(data.forma_pagamento),
    dueDate: String(data.data_vencimento).slice(0, 10),
    status: data.status,
    updatedAt: data.updated_at,
  };
}

export async function dbSoftDeleteProvider(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('prestadores_servico')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbCreatePayrollEmployee(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<PayrollEmployeeRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('funcionarios_folha')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      nome: payload.name,
      cargo: payload.roleTitle,
      salario: roundCurrencyBRL(payload.salary),
      data_admissao: payload.admissionDate || toISODate(),
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    name: data.nome,
    roleTitle: data.cargo,
    salary: Number(data.salario),
    admissionDate: String(data.data_admissao).slice(0, 10),
    updatedAt: data.updated_at,
  };
}

export async function dbUpdatePayrollEmployee(
  empresaId: string,
  dbUuid: string,
  payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<PayrollEmployeeRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('funcionarios_folha')
    .update({
      nome: payload.name,
      cargo: payload.roleTitle,
      salario: roundCurrencyBRL(payload.salary),
      data_admissao: payload.admissionDate || toISODate(),
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    name: data.nome,
    roleTitle: data.cargo,
    salary: Number(data.salario),
    admissionDate: String(data.data_admissao).slice(0, 10),
    updatedAt: data.updated_at,
  };
}

export async function dbSoftDeletePayrollEmployee(
  empresaId: string,
  dbUuid: string
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('funcionarios_folha')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

export async function dbCreateInvestment(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<InvestmentRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('investimentos')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      nome_ativo: payload.assetName,
      tipo_ativo: payload.assetType,
      data_aplicacao: payload.appliedDate || toISODate(),
      valor_aplicado: roundCurrencyBRL(payload.investedAmount),
      valor_atual: roundCurrencyBRL(payload.currentAmount),
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    assetName: data.nome_ativo,
    assetType: data.tipo_ativo,
    appliedDate: String(data.data_aplicacao).slice(0, 10),
    investedAmount: Number(data.valor_aplicado),
    currentAmount: Number(data.valor_atual),
    updatedAt: data.updated_at,
  };
}

export async function dbUpdateInvestment(
  empresaId: string,
  dbUuid: string,
  payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<InvestmentRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('investimentos')
    .update({
      nome_ativo: payload.assetName,
      tipo_ativo: payload.assetType,
      data_aplicacao: payload.appliedDate || toISODate(),
      valor_aplicado: roundCurrencyBRL(payload.investedAmount),
      valor_atual: roundCurrencyBRL(payload.currentAmount),
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    assetName: data.nome_ativo,
    assetType: data.tipo_ativo,
    appliedDate: String(data.data_aplicacao).slice(0, 10),
    investedAmount: Number(data.valor_aplicado),
    currentAmount: Number(data.valor_atual),
    updatedAt: data.updated_at,
  };
}

export async function dbSoftDeleteInvestment(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('investimentos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

// ============================================================================
// EQUIPE (Edge Function manage-team - sem service_role no frontend)
// ============================================================================

export async function invokeManageTeam(body: Record<string, unknown>): Promise<any> {
  const sb = getSupabaseClient();
  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Entre novamente.');

  const { data, error } = await sb.functions.invoke('manage-team', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new Error(error.message || 'Erro ao gerenciar equipe.');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ============================================================================
// CONFIGURAÇÕES & BACKUPS (Admin Only)
// ============================================================================

export async function dbLoadSettingsAndBackups(empresaId: string): Promise<{
  settings: CompanySettingsRecord;
  backups: BackupRecord[];
  logs: BackupLogRecord[];
}> {
  const sb = getSupabaseClient();
  const [cfgRes, bkpRes, logsRes] = await Promise.all([
    sb
      .from('configuracoes_empresa')
      .select('*')
      .eq('empresa_id', empresaId)
      .maybeSingle(),
    sb
      .from('backups')
      .select('id, empresa_id, tipo, schema_version, storage_path, resumo_tabelas, tamanho_bytes, sha256, criado_por, created_at, expira_em')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(100),
    sb
      .from('backup_logs')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    settings: {
      empresa_id: empresaId,
      retencao_diaria: cfgRes.data?.retencao_diaria ?? 30,
      retencao_mensal: cfgRes.data?.retencao_mensal ?? 12,
      backup_automatico: cfgRes.data?.backup_automatico ?? true,
      updated_at: cfgRes.data?.updated_at,
    },
    backups: (bkpRes.data || []) as BackupRecord[],
    logs: (logsRes.data || []) as BackupLogRecord[],
  };
}

export async function dbUpdateCompanySettings(
  empresaId: string,
  updates: Pick<
    CompanySettingsRecord,
    'retencao_diaria' | 'retencao_mensal' | 'backup_automatico'
  >
): Promise<CompanySettingsRecord> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('configuracoes_empresa')
    .upsert(
      {
        empresa_id: empresaId,
        retencao_diaria: updates.retencao_diaria,
        retencao_mensal: updates.retencao_mensal,
        backup_automatico: updates.backup_automatico,
      },
      { onConflict: 'empresa_id' }
    )
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as CompanySettingsRecord;
}

export async function dbDismissBackupAlert(empresaId: string, logId: string): Promise<void> {
  const sb = getSupabaseClient();
  await sb
    .from('backup_logs')
    .update({ alerta_dispensado: true })
    .eq('id', logId)
    .eq('empresa_id', empresaId);
}

export async function invokeBackupEngine(body: Record<string, unknown>): Promise<any> {
  const sb = getSupabaseClient();
  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const { data, error } = await sb.functions.invoke('backup-engine', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    let errMsg = error.message || 'Erro no serviço de backup.';
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json();
        if (parsed?.error) errMsg = parsed.error;
      }
    } catch {
      // ignore parse fallback
    }
    throw new Error(errMsg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
