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
  PaymentStatus,
  PayrollEmployeeRecord,
  ProductionStage,
  ReturnStatus,
  ServiceProviderRecord,
  StageLog,
  StockCategory,
  StockItem,
  StockMovementRecord,
  StockMovementType,
  TenantAccount,
  UserRole,
  WarrantyReturnRecord,
} from '../types/order';
import {
  addDays,
  normalizeExpenseCategory,
  normalizeInvestmentType,
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

function toStockInt(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
}

function mapOrderRow(o: any): DieOrder {
  const createdDate = String(o.created_at || toISODate()).slice(0, 10);
  const woodNum = o.wood_mm != null ? Number(o.wood_mm) : undefined;
  return {
    id: o.numero_os,
    dbUuid: o.id,
    company_id: o.empresa_id,
    companyId: o.cliente_codigo_legado || o.cliente_empresa_id || '',
    companyUuid: o.cliente_empresa_id || undefined,
    companyName: o.cliente_nome,
    companyPhone: o.cliente_telefone || '',
    toolDescription: o.descricao_ferramenta,
    bladeMeters: o.blade_meters != null ? Number(o.blade_meters) : undefined,
    woodMm:
      woodNum === 15 || woodNum === 18 || woodNum === 22 ? woodNum : undefined,
    amount: Number(o.valor) || 0,
    paymentModality: o.forma_pagamento as PaymentModality,
    paymentStatus: o.status_pagamento as PaymentStatus,
    stage: o.etapa as ProductionStage,
    stageUpdatedAt: o.etapa_atualizada_em || '',
    stageHistory: Array.isArray(o.historico_etapas) ? o.historico_etapas : [],
    version: Number(o.version) || 1,
    updatedAt: o.updated_at || o.created_at,
    createdAt: createdDate,
    dueDate: String(o.data_vencimento || createdDate).slice(0, 10),
    paidAt: o.data_pagamento ? String(o.data_pagamento).slice(0, 10) : undefined,
    completedAt: o.concluida_em ? String(o.concluida_em) : undefined,
    financialNotes: o.observacao_financeira || undefined,
  };
}

function mapExpenseRow(d: any): ExpenseRecord {
  return {
    ...d,
    categoria: normalizeExpenseCategory(d.categoria),
    descricao: d.descricao || '',
    valor: roundCurrencyBRL(Number(d.valor) || 0),
    data_competencia: String(d.data_competencia || '').slice(0, 10),
    data_vencimento: d.data_vencimento ? String(d.data_vencimento).slice(0, 10) : undefined,
    data_pagamento: d.data_pagamento ? String(d.data_pagamento).slice(0, 10) : undefined,
    fornecedor: d.fornecedor || undefined,
    observacao: d.observacao || undefined,
    origem_tipo:
      d.origem_tipo === 'funcionario' || d.origem_tipo === 'prestador'
        ? d.origem_tipo
        : null,
    origem_id: d.origem_id || null,
    competencia_referencia: d.competencia_referencia || null,
  };
}

function mapProviderRow(p: any): ServiceProviderRecord {
  const dueDate = String(p.data_vencimento || toISODate()).slice(0, 10);
  const parsedDay = Number(p.dia_pagamento);
  const derivedDay =
    Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31
      ? parsedDay
      : Number(dueDate.slice(8, 10)) || 5;
  return {
    id: p.codigo_legado || p.id,
    dbUuid: p.id,
    company_id: p.empresa_id,
    name: p.nome,
    service: p.servico,
    amount: Number(p.valor) || 0,
    paymentModality: fromExpensePayment(p.forma_pagamento),
    dueDate,
    paymentDay: derivedDay,
    status: p.status,
    updatedAt: String(p.updated_at || ''),
  };
}

function mapPayrollEmployeeRow(e: any): PayrollEmployeeRecord {
  const rawDay = Number(e.dia_pagamento);
  const paymentDay =
    Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= 31 ? rawDay : 5;
  return {
    id: e.codigo_legado || e.id,
    dbUuid: e.id,
    company_id: e.empresa_id,
    name: e.nome,
    roleTitle: e.cargo,
    salary: Number(e.salario) || 0,
    admissionDate: String(e.data_admissao || toISODate()).slice(0, 10),
    paymentDay,
    paymentStatus: e.status_pagamento === 'pago' ? 'pago' : 'pendente',
    paymentModality: fromExpensePayment(e.forma_pagamento || 'pix'),
    paidAt: e.data_pagamento ? String(e.data_pagamento).slice(0, 10) : undefined,
    paidCompetence: e.competencia_paga || undefined,
    updatedAt: String(e.updated_at || ''),
  };
}

function mapStockItemRow(s: any): StockItem {
  return {
    id: s.codigo_legado || s.id,
    dbUuid: s.id,
    company_id: s.empresa_id,
    category: s.categoria === 'laminas' ? 'laminas' : 'madeiras',
    name: s.nome,
    quantity: toStockInt(s.quantidade),
    unit: s.unidade,
    minStock: toStockInt(s.estoque_minimo),
    supplier: s.fornecedor || 'Não informado',
    unitCost: Number(s.custo_unitario) || 0,
    entryDate: String(s.data_entrada || '').slice(0, 10),
    updatedAt: String(s.updated_at || ''),
  };
}

export function toFriendlySupabaseError(err: unknown, fallback: string): string {
  const code = String((err as any)?.code || '').trim().toUpperCase();
  const raw = String((err as any)?.message || err || '').trim();
  const lower = raw.toLowerCase();

  if (code === 'P0001' && raw && !lower.includes('constraint') && !lower.includes('relation')) {
    return raw;
  }
  if (lower.includes('ordens_servico_empresa_id_numero_os_key') || (code === '23505' && lower.includes('numero_os'))) {
    return 'Conflito na numeração automática da OS. Tente novamente em instantes.';
  }
  if (code === '23505' || lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'Já existe um registro com este identificador ou código.';
  }
  if (code === '23503' || lower.includes('foreign key')) {
    return 'O registro vinculado não foi encontrado ou já foi removido.';
  }
  if (code === '23514' || lower.includes('check constraint')) {
    return 'Um dos valores informados está fora das regras permitidas.';
  }
  if (
    code === '42501' ||
    lower.includes('row-level security') ||
    lower.includes('permission denied')
  ) {
    return 'Você não tem permissão para executar esta operação.';
  }
  if (code === 'PGRST116' || lower.includes('0 rows')) {
    return 'Registro não encontrado ou sem permissão de acesso.';
  }
  if (lower.includes('jwt expired') || lower.includes('not authenticated') || lower.includes('invalid jwt')) {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('fetch failed')) {
    return 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  return fallback;
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
    .select('id, empresa_id, nome, email, role, cargo, ativo, deleted_at, is_super_admin')
    .eq('id', userId)
    .is('deleted_at', null)
    .eq('ativo', true)
    .maybeSingle();

  if (pErr || !perfil) {
    throw new Error(
      toFriendlySupabaseError(
        pErr,
        'Perfil de empresa não localizado para este usuário.'
      )
    );
  }

  const { data: empresa } = await sb
    .from('empresas')
    .select('id, nome')
    .eq('id', perfil.empresa_id)
    .is('deleted_at', null)
    .maybeSingle();

  const resolvedEmail = String(perfil.email || email).trim().toLowerCase();
  const isSuperAdmin =
    Boolean(perfil.is_super_admin) &&
    resolvedEmail === 'wenderautomation@gmail.com';

  return {
    userId: perfil.id,
    company_id: perfil.empresa_id,
    empresaId: perfil.empresa_id,
    companyName: empresa?.nome || 'Facaria',
    ownerName: perfil.nome || email.split('@')[0],
    email: perfil.email || email,
    role:
      perfil.role === 'admin'
        ? 'admin'
        : perfil.role === 'operador'
        ? 'operador'
        : 'cliente',
    isSuperAdmin,
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
    return { error: toFriendlySupabaseError(error, 'Não foi possível autenticar.') };
  }

  try {
    const session = await resolveProfileSession(data.user.id, data.user.email || email);
    return { session };
  } catch (err: any) {
    return { error: toFriendlySupabaseError(err, 'Erro ao carregar perfil da empresa.') };
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
    return { error: toFriendlySupabaseError(error, 'Não foi possível criar a conta.') };
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
      return { error: toFriendlySupabaseError(err, 'Conta criada, mas perfil não carregou.') };
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
    stockMovRes,
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
          .from('estoque_movimentacoes')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(100)
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
    ['estoque_movimentacoes', stockMovRes.error],
    ['notas', notasRes.error],
    ['nota_itens', notaItensRes.error],
    ['despesas', despesasRes.error],
    ['prestadores_servico', providersRes.error],
    ['funcionarios_folha', payrollRes.error],
    ['investimentos', investmentsRes.error],
    ['perfis', perfisRes.error],
  ].filter(([, err]) => Boolean(err)) as Array<[string, { message?: string }]>;

  if (queryErrors.length > 0) {
    const firstMsg = toFriendlySupabaseError(
      queryErrors[0][1],
      'Verifique sua conexão e tente novamente.'
    );
    throw new Error(
      `Falha ao carregar dados (${queryErrors.length} consulta(s)): ${firstMsg}`
    );
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

  const orders: DieOrder[] = (ordersRes.data || []).map(mapOrderRow);

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

  const stock: StockItem[] = (stockRes.data || []).map(mapStockItemRow);

  const stockMovements: StockMovementRecord[] = (stockMovRes.data || []).map((m: any) => ({
    id: m.id,
    empresa_id: m.empresa_id,
    stockItemUuid: m.estoque_item_id,
    itemCode: m.item_codigo || '',
    itemName: m.item_nome,
    category: m.categoria === 'laminas' ? 'laminas' : 'madeiras',
    unit: m.unidade || 'un',
    type: m.tipo as StockMovementType,
    quantity: Math.max(1, toStockInt(m.quantidade)),
    previousBalance: toStockInt(m.saldo_anterior),
    newBalance: toStockInt(m.saldo_posterior),
    actorName: m.responsavel_nome || 'Equipe',
    note: m.observacao || undefined,
    revertedAt: m.estornado_em || null,
    createdAt: m.created_at || '',
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
    dataSaida: n.data_saida ? String(n.data_saida).slice(0, 10) : undefined,
    empresaId: n.cliente_empresa_id || undefined,
    clienteNome: n.cliente_nome,
    cnpj: n.cnpj || '',
    inscricao: n.inscricao || undefined,
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

  const despesas: ExpenseRecord[] = (despesasRes.data || []).map(mapExpenseRow);

  const serviceProviders: ServiceProviderRecord[] = (providersRes.data || []).map(
    mapProviderRow
  );

  const payrollEmployees: PayrollEmployeeRecord[] = (payrollRes.data || []).map(
    mapPayrollEmployeeRow
  );

  const investments: InvestmentRecord[] = (investmentsRes.data || []).map((i: any) => ({
    id: i.codigo_legado || i.id,
    dbUuid: i.id,
    company_id: i.empresa_id,
    assetName: i.nome_ativo,
    description: i.descricao || undefined,
    assetType: normalizeInvestmentType(i.categoria || i.tipo_ativo),
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
    stockMovements,
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao cadastrar empresa cliente.'));
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir empresa cliente.'));
}

export async function dbBulkSoftDeleteOrders(empresaId: string, dbUuids: string[]): Promise<void> {
  if (dbUuids.length === 0) return;
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('ordens_servico')
    .update({ deleted_at: new Date().toISOString() })
    .eq('empresa_id', empresaId)
    .in('id', dbUuids)
    .is('deleted_at', null);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir ordens vinculadas.'));
}

export async function dbBulkSoftDeleteDeliveries(
  empresaId: string,
  dbUuids: string[]
): Promise<void> {
  if (dbUuids.length === 0) return;
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('entregas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('empresa_id', empresaId)
    .in('id', dbUuids)
    .is('deleted_at', null);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir entregas vinculadas.'));
}

export async function dbBulkSoftDeleteReturns(
  empresaId: string,
  dbUuids: string[]
): Promise<void> {
  if (dbUuids.length === 0) return;
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('retornos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('empresa_id', empresaId)
    .in('id', dbUuids)
    .is('deleted_at', null);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir retornos vinculados.'));
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
    bladeMeters?: number | null;
    woodMm?: 15 | 18 | 22 | null;
    dueDate?: string;
    financialNotes?: string | null;
    amount: number;
    paymentModality: PaymentModality;
    stage: ProductionStage;
    stageUpdatedAt: string;
  }
): Promise<DieOrder> {
  const sb = getSupabaseClient();
  const today = toISODate();
  const days = PAYMENT_MODALITY_META[payload.paymentModality]?.defaultDays ?? 30;
  // Regra 5.1: Toda OS nasce obrigatoriamente como "Não Pago", independentemente
  // da forma de pagamento selecionada. Só muda para "Pago" ao clicar em "Marcar como pago".
  const payStatus = 'nao_pago' as const;
  const dueDate = payload.dueDate?.trim() ? payload.dueDate.slice(0, 10) : addDays(today, days);
  const paidAt = null;
  const hist = [{ stage: payload.stage, timestamp: payload.stageUpdatedAt }];

  const { data, error } = await sb
    .from('ordens_servico')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      numero_os: numeroOs || 'AUTO',
      cliente_empresa_id: payload.companyUuid || null,
      cliente_codigo_legado: payload.companyId,
      cliente_nome: payload.companyName,
      cliente_telefone: payload.companyPhone,
      descricao_ferramenta: payload.toolDescription,
      blade_meters:
        payload.bladeMeters != null && Number.isFinite(Number(payload.bladeMeters)) && Number(payload.bladeMeters) > 0
          ? Number(payload.bladeMeters)
          : null,
      wood_mm: payload.woodMm || null,
      valor: roundCurrencyBRL(payload.amount),
      forma_pagamento: payload.paymentModality,
      status_pagamento: payStatus,
      etapa: payload.stage,
      etapa_atualizada_em: payload.stageUpdatedAt,
      historico_etapas: hist,
      version: 1,
      data_vencimento: dueDate,
      data_pagamento: paidAt,
      ...(payload.stage === 'faca_pronta'
        ? { concluida_em: new Date().toISOString() }
        : {}),
      observacao_financeira: payload.financialNotes?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao registrar Ordem de Serviço.'));
  return mapOrderRow(data);
}

export async function dbUpdateOrderFull(
  empresaId: string,
  orderUuid: string,
  payload: {
    companyId: string;
    companyUuid?: string;
    companyName: string;
    companyPhone: string;
    toolDescription: string;
    bladeMeters?: number | null;
    woodMm?: 15 | 18 | 22 | null;
    dueDate?: string;
    amount: number;
    paymentModality: PaymentModality;
    stage: ProductionStage;
    stageChanged: boolean;
    stageUpdatedAt: string;
    stageHistory: StageLog[];
    currentVersion?: number;
  }
): Promise<DieOrder> {
  const sb = getSupabaseClient();
  const nextVersion = (Number(payload.currentVersion) || 1) + 1;
  const updateBody: Record<string, unknown> = {
    cliente_empresa_id: payload.companyUuid || null,
    cliente_codigo_legado: payload.companyId,
    cliente_nome: payload.companyName,
    cliente_telefone: payload.companyPhone,
    descricao_ferramenta: payload.toolDescription,
    blade_meters:
      payload.bladeMeters != null && Number.isFinite(Number(payload.bladeMeters)) && Number(payload.bladeMeters) > 0
        ? Number(payload.bladeMeters)
        : null,
    wood_mm: payload.woodMm || null,
    valor: roundCurrencyBRL(payload.amount),
    forma_pagamento: payload.paymentModality,
    etapa: payload.stage,
    version: nextVersion,
  };
  if (payload.dueDate?.trim()) {
    updateBody.data_vencimento = payload.dueDate.slice(0, 10);
  }
  if (payload.stageChanged) {
    updateBody.etapa_atualizada_em = payload.stageUpdatedAt;
    updateBody.historico_etapas = payload.stageHistory;
    updateBody.concluida_em =
      payload.stage === 'faca_pronta' ? new Date().toISOString() : null;
  }

  const { data, error } = await sb
    .from('ordens_servico')
    .update(updateBody)
    .eq('id', orderUuid)
    .eq('empresa_id', empresaId)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar Ordem de Serviço.'));
  return mapOrderRow(data);
}

export async function dbMoveOrderStage(
  ordemUuid: string,
  targetStage: ProductionStage,
  stamp: string
): Promise<{ version: number; updatedAt: string; completedAt: string | null }> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.rpc('mover_faca_v2', {
    p_ordem_id: ordemUuid,
    p_etapa: targetStage,
    p_etapa_atualizada_em: stamp,
  });
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao mover faca na esteira.'));
  return {
    version: Number(data?.version) || 1,
    updatedAt: data?.updated_at || new Date().toISOString(),
    completedAt: data?.concluida_em ? String(data.concluida_em) : null,
  };
}

export async function dbUpdateOrderPayment(
  empresaId: string,
  ordemUuid: string,
  updates: {
    status_pagamento: PaymentStatus;
    data_pagamento?: string | null;
    data_vencimento?: string;
    valor?: number;
    forma_pagamento?: PaymentModality;
    observacao_financeira?: string | null;
    version: number;
  }
): Promise<DieOrder> {
  const sb = getSupabaseClient();
  const body: Record<string, unknown> = {
    status_pagamento: updates.status_pagamento,
    version: updates.version,
  };
  if (updates.data_pagamento !== undefined) {
    body.data_pagamento = updates.data_pagamento;
  }
  if (updates.data_vencimento) {
    body.data_vencimento = updates.data_vencimento.slice(0, 10);
  }
  if (updates.valor !== undefined) {
    body.valor = roundCurrencyBRL(updates.valor);
  }
  if (updates.forma_pagamento) {
    body.forma_pagamento = updates.forma_pagamento;
  }
  if (updates.observacao_financeira !== undefined) {
    body.observacao_financeira = updates.observacao_financeira?.trim() || null;
  }

  const { data, error } = await sb
    .from('ordens_servico')
    .update(body)
    .eq('id', ordemUuid)
    .eq('empresa_id', empresaId)
    .is('deleted_at', null)
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar dados financeiros da OS.'));
  return mapOrderRow(data);
}

export async function dbSoftDeleteOrder(empresaId: string, ordemUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('ordens_servico')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', ordemUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir Ordem de Serviço.'));
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao registrar entrega.'));
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir entrega.'));
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao registrar retorno.'));
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar status do retorno.'));
}

export async function dbSoftDeleteReturn(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('retornos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir retorno.'));
}

// ESTOQUE (preserva todas as regras de negócio; persistência real + soft delete no Supabase + quantidades inteiras)
export async function dbCreateStockItem(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
): Promise<StockItem> {
  const sb = getSupabaseClient();
  const intQty = toStockInt(payload.quantity);
  const intMin = toStockInt(payload.minStock);
  const { data, error } = await sb
    .from('estoque_itens')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      categoria: payload.category,
      nome: payload.name,
      quantidade: intQty,
      unidade: payload.unit,
      estoque_minimo: intMin,
      fornecedor: payload.supplier,
      custo_unitario: payload.unitCost,
      data_entrada: payload.entryDate || toISODate(),
    })
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao cadastrar item de estoque.'));
  return mapStockItemRow(data);
}

export async function dbUpdateStockItem(
  empresaId: string,
  dbUuid: string,
  payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
): Promise<StockItem> {
  const sb = getSupabaseClient();
  const intQty = toStockInt(payload.quantity);
  const intMin = toStockInt(payload.minStock);
  const { data, error } = await sb
    .from('estoque_itens')
    .update({
      categoria: payload.category,
      nome: payload.name,
      quantidade: intQty,
      unidade: payload.unit,
      estoque_minimo: intMin,
      fornecedor: payload.supplier,
      custo_unitario: payload.unitCost,
      data_entrada: payload.entryDate || toISODate(),
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar item de estoque.'));
  return mapStockItemRow(data);
}

export async function dbSoftDeleteStockItem(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('estoque_itens')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir item de estoque.'));
}

export async function dbRegisterStockMovement(
  empresaId: string,
  item: StockItem,
  delta: number,
  actorName: string,
  note?: string
): Promise<{ updatedItem: StockItem; movement: StockMovementRecord }> {
  if (!item.dbUuid) {
    throw new Error('Item de estoque sem identificador no Supabase.');
  }
  const sb = getSupabaseClient();
  const previousBalance = toStockInt(item.quantity);
  const absDelta = Math.max(1, toStockInt(Math.abs(delta)));
  const intDelta = delta < 0 ? -absDelta : absDelta;
  const nextBalance = Math.max(0, previousBalance + intDelta);
  const movedQty = Math.abs(nextBalance - previousBalance);

  if (movedQty <= 0) {
    throw new Error('Saldo já está zerado para este insumo.');
  }

  const movementType: StockMovementType = delta < 0 ? 'consumo' : 'reposicao';

  const { data: stockRow, error: upErr } = await sb
    .from('estoque_itens')
    .update({ quantidade: nextBalance })
    .eq('id', item.dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (upErr) throw new Error(toFriendlySupabaseError(upErr, 'Erro ao atualizar saldo do estoque.'));

  const { data: movRow, error: movErr } = await sb
    .from('estoque_movimentacoes')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      estoque_item_id: item.dbUuid,
      item_codigo: item.id,
      item_nome: item.name,
      categoria: item.category,
      unidade: item.unit,
      tipo: movementType,
      quantidade: movedQty,
      saldo_anterior: previousBalance,
      saldo_posterior: nextBalance,
      responsavel_nome: actorName,
      observacao: note || null,
    })
    .select('*')
    .single();
  if (movErr) throw new Error(toFriendlySupabaseError(movErr, 'Erro ao registrar movimentação de estoque.'));

  return {
    updatedItem: mapStockItemRow(stockRow),
    movement: {
      id: movRow.id,
      empresa_id: movRow.empresa_id,
      stockItemUuid: movRow.estoque_item_id,
      itemCode: movRow.item_codigo || item.id,
      itemName: movRow.item_nome,
      category: (movRow.categoria === 'laminas' ? 'laminas' : 'madeiras') as StockCategory,
      unit: movRow.unidade,
      type: movRow.tipo as StockMovementType,
      quantity: Math.max(1, toStockInt(movRow.quantidade)),
      previousBalance: toStockInt(movRow.saldo_anterior),
      newBalance: toStockInt(movRow.saldo_posterior),
      actorName: movRow.responsavel_nome || actorName,
      note: movRow.observacao || undefined,
      revertedAt: movRow.estornado_em || null,
      createdAt: movRow.created_at,
    },
  };
}

export async function dbRevertStockMovement(
  empresaId: string,
  movement: StockMovementRecord,
  currentItem: StockItem,
  actorName: string
): Promise<{ updatedItem: StockItem; revertedAt: string; estornoMovement: StockMovementRecord }> {
  if (!currentItem.dbUuid) {
    throw new Error('Item de estoque não localizado para estorno.');
  }
  const sb = getSupabaseClient();
  const prevBalance = toStockInt(currentItem.quantity);
  const movQtyInt = Math.max(1, toStockInt(movement.quantity));
  const reverseDelta = movement.type === 'consumo' ? movQtyInt : -movQtyInt;
  const nextBalance = Math.max(0, prevBalance + reverseDelta);
  const nowIso = new Date().toISOString();

  const { data: stockRow, error: upErr } = await sb
    .from('estoque_itens')
    .update({ quantidade: nextBalance })
    .eq('id', currentItem.dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (upErr) throw new Error(toFriendlySupabaseError(upErr, 'Erro ao estornar saldo do estoque.'));

  const { error: markErr } = await sb
    .from('estoque_movimentacoes')
    .update({ estornado_em: nowIso })
    .eq('id', movement.id)
    .eq('empresa_id', empresaId);
  if (markErr) throw new Error(toFriendlySupabaseError(markErr, 'Erro ao marcar movimentação como estornada.'));

  const { data: estRow, error: estErr } = await sb
    .from('estoque_movimentacoes')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      estoque_item_id: currentItem.dbUuid,
      item_codigo: currentItem.id,
      item_nome: currentItem.name,
      categoria: currentItem.category,
      unidade: currentItem.unit,
      tipo: 'estorno',
      quantidade: movQtyInt,
      saldo_anterior: prevBalance,
      saldo_posterior: nextBalance,
      responsavel_nome: actorName,
      observacao: `Estorno de ${movement.type === 'consumo' ? 'baixa' : 'reposição'}`,
    })
    .select('*')
    .single();
  if (estErr) throw new Error(toFriendlySupabaseError(estErr, 'Erro ao registrar estorno de estoque.'));

  return {
    updatedItem: mapStockItemRow(stockRow),
    revertedAt: nowIso,
    estornoMovement: {
      id: estRow.id,
      empresa_id: estRow.empresa_id,
      stockItemUuid: estRow.estoque_item_id,
      itemCode: estRow.item_codigo || currentItem.id,
      itemName: estRow.item_nome,
      category: (estRow.categoria === 'laminas' ? 'laminas' : 'madeiras') as StockCategory,
      unit: estRow.unidade,
      type: 'estorno',
      quantity: Math.max(1, toStockInt(estRow.quantidade)),
      previousBalance: toStockInt(estRow.saldo_anterior),
      newBalance: toStockInt(estRow.saldo_posterior),
      actorName: estRow.responsavel_nome || actorName,
      note: estRow.observacao || undefined,
      revertedAt: null,
      createdAt: estRow.created_at,
    },
  };
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
        data_saida: payload.dataSaida || null,
        cliente_nome: payload.clienteNome,
        cnpj: payload.cnpj || '',
        inscricao: payload.inscricao || null,
        contato: payload.contato || '',
        endereco: payload.endereco || null,
        entregue_por: payload.entreguePor || null,
        os_numero: payload.osId || null,
        status: payload.status,
      })
      .eq('id', editingId)
      .eq('empresa_id', empresaId);
    if (upErr) throw new Error(toFriendlySupabaseError(upErr, 'Erro ao atualizar nota/pedido.'));

    // Soft-delete previous items cleanly
    const { error: delItemsErr } = await sb
      .from('nota_itens')
      .update({ deleted_at: new Date().toISOString() })
      .eq('nota_id', editingId)
      .eq('empresa_id', empresaId)
      .is('deleted_at', null);
    if (delItemsErr) {
      throw new Error(toFriendlySupabaseError(delItemsErr, 'Erro ao atualizar itens da nota.'));
    }
  } else {
    const { error: insErr } = await sb.from('notas').insert({
      id: noteId,
      empresa_id: empresaId,
      numero: 0, // assigned atomically per company by trg_notas_prepare
      data: payload.data,
      data_saida: payload.dataSaida || null,
      cliente_nome: payload.clienteNome,
      cnpj: payload.cnpj || '',
      inscricao: payload.inscricao || null,
      contato: payload.contato || '',
      endereco: payload.endereco || null,
      entregue_por: payload.entreguePor || null,
      os_numero: payload.osId || null,
      status: payload.status,
      criado_por: actorName,
    });
    if (insErr) throw new Error(toFriendlySupabaseError(insErr, 'Erro ao criar nota/pedido.'));
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
    if (itemErr) throw new Error(toFriendlySupabaseError(itemErr, 'Erro ao salvar itens da nota.'));
  }

  const { data: savedNote, error: fetchErr } = await sb
    .from('notas')
    .select('*')
    .eq('id', noteId)
    .eq('empresa_id', empresaId)
    .single();
  if (fetchErr || !savedNote) {
    throw new Error(toFriendlySupabaseError(fetchErr, 'Erro ao recarregar nota salva.'));
  }

  const { data: savedItems, error: savedItemsErr } = await sb
    .from('nota_itens')
    .select('*')
    .eq('nota_id', noteId)
    .eq('empresa_id', empresaId)
    .is('deleted_at', null);
  if (savedItemsErr) {
    throw new Error(toFriendlySupabaseError(savedItemsErr, 'Erro ao recarregar itens da nota.'));
  }

  return {
    id: savedNote.id,
    company_id: savedNote.empresa_id,
    numero: Number(savedNote.numero),
    data: String(savedNote.data).slice(0, 10),
    dataSaida: savedNote.data_saida ? String(savedNote.data_saida).slice(0, 10) : undefined,
    empresaId: savedNote.cliente_empresa_id || undefined,
    clienteNome: savedNote.cliente_nome,
    cnpj: savedNote.cnpj || '',
    inscricao: savedNote.inscricao || undefined,
    contato: savedNote.contato || '',
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar status da nota.'));
}

export async function dbSoftDeleteNote(empresaId: string, noteId: string): Promise<void> {
  const sb = getSupabaseClient();
  const stamp = new Date().toISOString();
  const { error: itemsErr } = await sb
    .from('nota_itens')
    .update({ deleted_at: stamp })
    .eq('nota_id', noteId)
    .eq('empresa_id', empresaId)
    .is('deleted_at', null);
  if (itemsErr) throw new Error(toFriendlySupabaseError(itemsErr, 'Erro ao excluir itens da nota.'));
  const { error } = await sb
    .from('notas')
    .update({ deleted_at: stamp })
    .eq('id', noteId)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir nota/pedido.'));
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
      categoria: normalizeExpenseCategory(payload.categoria),
      descricao: payload.descricao.trim() || null,
      valor: roundedVal,
      data_competencia: payload.data_competencia,
      data_vencimento: payload.data_vencimento || null,
      data_pagamento: payload.data_pagamento || null,
      status: payload.status,
      forma_pagamento: payload.forma_pagamento,
      fornecedor: payload.fornecedor?.trim() || null,
      observacao: payload.observacao?.trim() || null,
      ...(payload.origem_tipo ? { origem_tipo: payload.origem_tipo } : {}),
      ...(payload.origem_id ? { origem_id: payload.origem_id } : {}),
      ...(payload.competencia_referencia
        ? { competencia_referencia: payload.competencia_referencia }
        : {}),
    })
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao cadastrar despesa.'));
  return mapExpenseRow(data);
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
      categoria: normalizeExpenseCategory(payload.categoria),
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar despesa.'));
  return mapExpenseRow(data);
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir despesa.'));
}

export async function dbSyncCollaboratorExpense(
  empresaId: string,
  params: {
    origemTipo: 'funcionario' | 'prestador';
    origemId: string;
    competencia: string; // YYYY-MM
    isPaid: boolean;
    nome: string;
    subtitulo: string;
    valor: number;
    formaPagamento: PaymentModality;
    dataVencimento: string; // YYYY-MM-DD
    dataPagamento?: string; // YYYY-MM-DD
  }
): Promise<{ upserted?: ExpenseRecord; removedIds: string[] }> {
  const sb = getSupabaseClient();
  const cleanComp = params.competencia.slice(0, 7);

  const { data: existingRows, error: qErr } = await sb
    .from('despesas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('origem_tipo', params.origemTipo)
    .eq('origem_id', params.origemId)
    .eq('competencia_referencia', cleanComp)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (qErr) {
    throw new Error(
      toFriendlySupabaseError(qErr, 'Erro ao consultar vínculo financeiro do colaborador.')
    );
  }

  const rows = existingRows || [];
  if (!params.isPaid) {
    const removedIds = rows.map((r: any) => String(r.id));
    if (removedIds.length > 0) {
      const { error: delErr } = await sb
        .from('despesas')
        .update({ deleted_at: new Date().toISOString() })
        .eq('empresa_id', empresaId)
        .in('id', removedIds)
        .is('deleted_at', null);
      if (delErr) {
        throw new Error(
          toFriendlySupabaseError(delErr, 'Erro ao estornar despesa vinculada do colaborador.')
        );
      }
    }
    return { removedIds };
  }

  const valor = roundCurrencyBRL(params.valor);
  if (valor <= 0) {
    throw new Error('Informe um valor maior que R$ 0,00 antes de marcar como Pago.');
  }

  const categoria =
    params.origemTipo === 'funcionario' ? 'folha_colaboradores' : 'prestadores_servico';
  const cleanSub = params.subtitulo.trim();
  const descricao =
    params.origemTipo === 'funcionario'
      ? `Folha — ${params.nome}${cleanSub ? ` (${cleanSub})` : ''}`
      : `Prestador — ${params.nome}${cleanSub ? ` (${cleanSub})` : ''}`;
  const dataCompetencia = (params.dataVencimento || toISODate()).slice(0, 10);
  const dataPagamento = (params.dataPagamento || toISODate()).slice(0, 10);
  const formaPag = toExpensePayment(params.formaPagamento || 'pix');
  const obs = `Pagamento automático (${cleanComp})`;

  const removedIds: string[] = [];
  if (rows.length > 1) {
    const extraIds = rows.slice(1).map((r: any) => String(r.id));
    removedIds.push(...extraIds);
    await sb
      .from('despesas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('empresa_id', empresaId)
      .in('id', extraIds)
      .is('deleted_at', null);
  }

  if (rows.length > 0) {
    const targetId = rows[0].id;
    const { data: upRow, error: upErr } = await sb
      .from('despesas')
      .update({
        categoria,
        descricao,
        valor,
        data_competencia: dataCompetencia,
        data_vencimento: dataCompetencia,
        data_pagamento: dataPagamento,
        status: 'pago',
        forma_pagamento: formaPag,
        fornecedor: params.nome.trim() || null,
        observacao: obs,
      })
      .eq('id', targetId)
      .eq('empresa_id', empresaId)
      .select('*')
      .single();
    if (upErr) {
      throw new Error(
        toFriendlySupabaseError(upErr, 'Erro ao atualizar despesa vinculada ao colaborador.')
      );
    }
    return { upserted: mapExpenseRow(upRow), removedIds };
  }

  const { data: insRow, error: insErr } = await sb
    .from('despesas')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      categoria,
      descricao,
      valor,
      data_competencia: dataCompetencia,
      data_vencimento: dataCompetencia,
      data_pagamento: dataPagamento,
      status: 'pago',
      forma_pagamento: formaPag,
      fornecedor: params.nome.trim() || null,
      observacao: obs,
      origem_tipo: params.origemTipo,
      origem_id: params.origemId,
      competencia_referencia: cleanComp,
    })
    .select('*')
    .single();

  if (insErr) {
    if (String((insErr as any)?.code || '') === '23505') {
      const { data: conflictRow } = await sb
        .from('despesas')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('origem_tipo', params.origemTipo)
        .eq('origem_id', params.origemId)
        .eq('competencia_referencia', cleanComp)
        .is('deleted_at', null)
        .maybeSingle();
      if (conflictRow) {
        const { data: mergedRow, error: mergeErr } = await sb
          .from('despesas')
          .update({
            categoria,
            descricao,
            valor,
            data_competencia: dataCompetencia,
            data_vencimento: dataCompetencia,
            data_pagamento: dataPagamento,
            status: 'pago',
            forma_pagamento: formaPag,
            fornecedor: params.nome.trim() || null,
            observacao: obs,
          })
          .eq('id', conflictRow.id)
          .eq('empresa_id', empresaId)
          .select('*')
          .single();
        if (mergeErr) {
          throw new Error(
            toFriendlySupabaseError(mergeErr, 'Erro ao sincronizar pagamento do colaborador.')
          );
        }
        return { upserted: mapExpenseRow(mergedRow), removedIds };
      }
    }
    throw new Error(
      toFriendlySupabaseError(insErr, 'Erro ao registrar despesa automática do colaborador.')
    );
  }

  return { upserted: mapExpenseRow(insRow), removedIds };
}

export async function dbSoftDeleteCollaboratorLinkedExpenses(
  empresaId: string,
  origemTipo: 'funcionario' | 'prestador',
  origemId: string
): Promise<string[]> {
  const sb = getSupabaseClient();
  const { data: activeRows } = await sb
    .from('despesas')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('origem_tipo', origemTipo)
    .eq('origem_id', origemId)
    .is('deleted_at', null);

  const ids = (activeRows || []).map((r: any) => String(r.id));
  if (ids.length > 0) {
    const { error } = await sb
      .from('despesas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('empresa_id', empresaId)
      .in('id', ids)
      .is('deleted_at', null);
    if (error) {
      throw new Error(
        toFriendlySupabaseError(error, 'Erro ao remover despesas vinculadas ao colaborador.')
      );
    }
  }
  return ids;
}

// PRESTADORES, FUNCIONÁRIOS FOLHA, INVESTIMENTOS
export async function dbCreateProvider(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<ServiceProviderRecord> {
  const sb = getSupabaseClient();
  const dueDate = payload.dueDate || toISODate();
  const dayNum = Math.min(
    31,
    Math.max(
      1,
      Math.round(Number(payload.paymentDay) || Number(dueDate.slice(8, 10)) || 5)
    )
  );
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
      data_vencimento: dueDate,
      dia_pagamento: dayNum,
      status: payload.status,
    })
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao cadastrar prestador.'));
  return mapProviderRow(data);
}

export async function dbUpdateProvider(
  empresaId: string,
  dbUuid: string,
  payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<ServiceProviderRecord> {
  const sb = getSupabaseClient();
  const dueDate = payload.dueDate || toISODate();
  const dayNum = Math.min(
    31,
    Math.max(
      1,
      Math.round(Number(payload.paymentDay) || Number(dueDate.slice(8, 10)) || 5)
    )
  );
  const { data, error } = await sb
    .from('prestadores_servico')
    .update({
      nome: payload.name,
      servico: payload.service,
      valor: roundCurrencyBRL(payload.amount),
      forma_pagamento: toExpensePayment(payload.paymentModality),
      data_vencimento: dueDate,
      dia_pagamento: dayNum,
      status: payload.status,
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar prestador.'));
  return mapProviderRow(data);
}

export async function dbSoftDeleteProvider(empresaId: string, dbUuid: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('prestadores_servico')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir prestador.'));
}

export async function dbCreatePayrollEmployee(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<PayrollEmployeeRecord> {
  const sb = getSupabaseClient();
  const dayNum = Math.min(31, Math.max(1, Math.round(Number(payload.paymentDay) || 5)));
  const isPaid = payload.paymentStatus === 'pago';
  const paidCompetence = isPaid
    ? (payload.paidCompetence || toISODate().slice(0, 7)).slice(0, 7)
    : null;
  const paidAt = isPaid ? (payload.paidAt || toISODate()).slice(0, 10) : null;
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
      dia_pagamento: dayNum,
      status_pagamento: isPaid ? 'pago' : 'pendente',
      forma_pagamento: toExpensePayment(payload.paymentModality || 'pix'),
      data_pagamento: paidAt,
      competencia_paga: paidCompetence,
    })
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao cadastrar colaborador na folha.'));
  return mapPayrollEmployeeRow(data);
}

export async function dbUpdatePayrollEmployee(
  empresaId: string,
  dbUuid: string,
  payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<PayrollEmployeeRecord> {
  const sb = getSupabaseClient();
  const dayNum = Math.min(31, Math.max(1, Math.round(Number(payload.paymentDay) || 5)));
  const isPaid = payload.paymentStatus === 'pago';
  const paidCompetence = isPaid
    ? (payload.paidCompetence || toISODate().slice(0, 7)).slice(0, 7)
    : null;
  const paidAt = isPaid ? (payload.paidAt || toISODate()).slice(0, 10) : null;
  const { data, error } = await sb
    .from('funcionarios_folha')
    .update({
      nome: payload.name,
      cargo: payload.roleTitle,
      salario: roundCurrencyBRL(payload.salary),
      data_admissao: payload.admissionDate || toISODate(),
      dia_pagamento: dayNum,
      status_pagamento: isPaid ? 'pago' : 'pendente',
      forma_pagamento: toExpensePayment(payload.paymentModality || 'pix'),
      data_pagamento: paidAt,
      competencia_paga: paidCompetence,
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar colaborador na folha.'));
  return mapPayrollEmployeeRow(data);
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir colaborador da folha.'));
}

export async function dbCreateInvestment(
  empresaId: string,
  codigoLegado: string,
  payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
): Promise<InvestmentRecord> {
  const sb = getSupabaseClient();
  const normalizedCat = normalizeInvestmentType(payload.assetType);
  const appliedVal = roundCurrencyBRL(payload.investedAmount);
  const currentVal = roundCurrencyBRL(
    payload.currentAmount > 0 ? payload.currentAmount : payload.investedAmount
  );
  const { data, error } = await sb
    .from('investimentos')
    .insert({
      id: generateUuid(),
      empresa_id: empresaId,
      codigo_legado: codigoLegado,
      nome_ativo: payload.assetName,
      descricao: payload.description?.trim() || null,
      tipo_ativo: 'outro',
      categoria: normalizedCat,
      data_aplicacao: payload.appliedDate || toISODate(),
      valor_aplicado: appliedVal,
      valor_atual: currentVal,
    })
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao registrar investimento.'));
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    assetName: data.nome_ativo,
    description: data.descricao || undefined,
    assetType: normalizeInvestmentType(data.categoria || data.tipo_ativo),
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
  const normalizedCat = normalizeInvestmentType(payload.assetType);
  const appliedVal = roundCurrencyBRL(payload.investedAmount);
  const currentVal = roundCurrencyBRL(
    payload.currentAmount > 0 ? payload.currentAmount : payload.investedAmount
  );
  const { data, error } = await sb
    .from('investimentos')
    .update({
      nome_ativo: payload.assetName,
      descricao: payload.description?.trim() || null,
      tipo_ativo: 'outro',
      categoria: normalizedCat,
      data_aplicacao: payload.appliedDate || toISODate(),
      valor_aplicado: appliedVal,
      valor_atual: currentVal,
    })
    .eq('id', dbUuid)
    .eq('empresa_id', empresaId)
    .select('*')
    .single();
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao atualizar investimento.'));
  return {
    id: data.codigo_legado || data.id,
    dbUuid: data.id,
    company_id: data.empresa_id,
    assetName: data.nome_ativo,
    description: data.descricao || undefined,
    assetType: normalizeInvestmentType(data.categoria || data.tipo_ativo),
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
  if (error) throw new Error(toFriendlySupabaseError(error, 'Erro ao excluir investimento.'));
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
  if (error) {
    let errMsg = error.message || 'Erro ao gerenciar equipe.';
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
  if (error) {
    throw new Error(
      toFriendlySupabaseError(error, 'Erro ao atualizar configurações de backup.')
    );
  }
  return data as CompanySettingsRecord;
}

export async function dbDismissBackupAlert(empresaId: string, logId: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('backup_logs')
    .update({ alerta_dispensado: true })
    .eq('id', logId)
    .eq('empresa_id', empresaId);
  if (error) {
    throw new Error(
      toFriendlySupabaseError(error, 'Erro ao dispensar alerta de backup.')
    );
  }
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
