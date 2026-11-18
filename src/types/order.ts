export type ProductionStage =
  | 'arquivo_recebido'
  | 'desenho_produzido'
  | 'faca_serrada'
  | 'faca_dobrada'
  | 'faca_ajustada'
  | 'faca_pronta';

export type PaymentModality =
  | 'pix'
  | 'boleto'
  | 'dinheiro'
  | 'cartao'
  | 'nao_pago';

export type PaymentStatus = 'pago' | 'a_receber' | 'vencido' | 'sem_nota' | 'nao_pago';

export type DeliveryMethod =
  | 'cliente_buscou'
  | 'uber_flash'
  | 'entregador_proprio'
  | 'portador';

export type ReturnStatus = 'em_analise' | 'em_ajuste' | 'liberado';

export type UserRole = 'admin' | 'operador' | 'cliente';

export type ActiveSection =
  | 'bento_home'
  | 'empresas'
  | 'esteira'
  | 'financeiro'
  | 'entregas'
  | 'retornos'
  | 'estoque'
  | 'notas'
  | 'equipe'
  | 'configuracoes';

export type NoteStatus = 'rascunho' | 'emitida' | 'impressa' | 'cancelada';

export interface NoteItem {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

export interface NoteRecord {
  id: string;
  company_id?: string;
  numero: number;
  data: string; // YYYY-MM-DD
  empresaId?: string;
  clienteNome: string;
  cnpj: string;
  contato: string;
  endereco?: string;
  entreguePor?: string;
  osId?: string;
  status: NoteStatus;
  items: NoteItem[];
  total: number;
  criadoPor: string;
  criadoEm: string;
}

export type StockCategory = 'madeiras' | 'laminas';

export interface StockItem {
  id: string; // e.g., "EST-001"
  dbUuid?: string;
  company_id?: string;
  category: StockCategory;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  supplier: string;
  unitCost: number;
  entryDate: string; // YYYY-MM-DD
  updatedAt: string;
}

export interface TenantAccount {
  id?: string; // ID do usuário (ex: "USR-001")
  company_id: string; // Identificador único Multi-tenant da empresa
  companyName: string; // Nome da Facaria
  ownerName: string; // Nome do usuário / funcionário
  email: string;
  password: string;
  role: UserRole; // 'admin' (Patrão/Total) | 'operador' (Produção: Seções 2, 4 e 5)
  jobTitle?: string; // Cargo (ex: "Montador de Facas", "Serrador", "Logística", "Proprietário")
  createdAt: string;
}

export interface AuthSession {
  userId?: string;
  company_id: string;
  empresaId?: string; // UUID da tabela empresas no Supabase
  companyName: string;
  ownerName: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  loggedInAt: string;
}

export interface Company {
  id: string;
  dbUuid?: string;
  company_id?: string; // Tenant owner ID
  corporateName: string; // Razão Social / Nome Fantasia do cliente da facaria
  cnpj: string;
  phone: string; // WhatsApp
  contactName: string;
  city?: string;
}

export interface StageLog {
  stage: ProductionStage;
  timestamp: string; // ISO string or formatted "DD/MM às HH:mm"
}

export interface DieOrder {
  id: string; // e.g., "OS-001"
  dbUuid?: string;
  company_id?: string; // Tenant owner ID
  companyId: string;
  companyUuid?: string;
  companyName: string;
  companyPhone: string;
  toolDescription: string; // e.g., "Faca Caixa Duplex Tampa e Fundo"
  bladeMeters?: number;
  woodMm?: 15 | 18 | 22;
  amount: number; // Valor (R$)
  paymentModality: PaymentModality; // PIX, Dinheiro, Cartão, Boleto, Não Pago
  paymentStatus: PaymentStatus;
  stage: ProductionStage;
  stageUpdatedAt: string; // Data/hora da última movimentação na esteira
  stageHistory: StageLog[];
  version?: number;
  updatedAt?: string; // ISO timestamp monotônico para descarte de eventos antigos
  createdAt: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paidAt?: string;
}

export interface DeliveryRecord {
  id: string; // e.g., "ENT-001"
  dbUuid?: string;
  company_id?: string; // Tenant owner ID
  orderId: string;
  toolDescription: string;
  companyName: string;
  method: DeliveryMethod;
  carrierOrPersonName: string; // Nome do motorista / portador / quem retirou
  dispatchedAt: string; // Data e Hora exata da saída
  notes?: string;
}

export interface WarrantyReturnRecord {
  id: string; // e.g., "RET-001"
  dbUuid?: string;
  company_id?: string; // Tenant owner ID
  orderId: string; // OS original
  companyName: string;
  toolDescription: string;
  reason: string; // Motivo do Retorno
  technicalAction: string; // O que foi feito e ajustado
  adjustmentAmount: number; // R$ 0,00 se em garantia, ou novo valor
  status: ReturnStatus; // Em Análise | Em Ajuste de Bancada | Liberado Novamente
  createdAt: string; // Data/hora entrada retorno
  updatedAt: string;
}

export type ExpenseCategoryKey =
  | 'aluguel'
  | 'agua'
  | 'energia'
  | 'internet'
  | 'alimentacao'
  | 'combustivel'
  | 'manutencao'
  | 'contador'
  | 'marketing'
  | 'financiamento'
  | 'laminas'
  | 'madeira'
  | 'seguros'
  | 'impostos'
  | 'outros';

export type ExpenseStatus = 'pendente' | 'pago' | 'cancelado';
export type ExpenseDisplayStatus = ExpenseStatus | 'atrasado';
export type ExpensePaymentMethod =
  | 'pix'
  | 'boleto_15'
  | 'boleto_30'
  | 'dinheiro'
  | 'cartao'
  | 'nao_pago';

export interface ExpenseRecord {
  id: string;
  empresa_id?: string;
  categoria: ExpenseCategoryKey;
  descricao: string;
  valor: number;
  data_competencia: string; // YYYY-MM-DD
  data_vencimento?: string; // YYYY-MM-DD
  data_pagamento?: string; // YYYY-MM-DD
  status: ExpenseStatus;
  forma_pagamento: ExpensePaymentMethod;
  fornecedor?: string;
  observacao?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MonthlyExpenseRecord {
  month: string; // YYYY-MM
  values: Record<ExpenseCategoryKey, number>;
  updatedAt: string;
}

export type BackupType = 'automatico' | 'manual' | 'pre_restauracao';

export interface BackupRecord {
  id: string;
  empresa_id: string;
  tipo: BackupType;
  schema_version: number;
  storage_path?: string | null;
  resumo_tabelas: Record<string, number>;
  tamanho_bytes: number;
  sha256: string;
  criado_por?: string | null;
  created_at: string;
  expira_em: string;
}

export interface BackupLogRecord {
  id: string;
  empresa_id: string;
  backup_id?: string | null;
  tipo: BackupType;
  status: 'sucesso' | 'erro';
  mensagem: string;
  alerta_dispensado: boolean;
  executado_por?: string | null;
  created_at: string;
}

export interface CompanySettingsRecord {
  empresa_id: string;
  retencao_diaria: number;
  retencao_mensal: number;
  backup_automatico: boolean;
  updated_at?: string;
}

export type ServiceProviderStatus = 'pendente' | 'pago' | 'atrasado';

export interface ServiceProviderRecord {
  id: string; // e.g., "PST-001"
  dbUuid?: string;
  company_id?: string;
  name: string;
  service: string;
  amount: number;
  paymentModality: PaymentModality;
  dueDate: string; // YYYY-MM-DD
  status: ServiceProviderStatus;
  updatedAt: string;
}

export interface PayrollEmployeeRecord {
  id: string; // e.g., "FUN-001"
  dbUuid?: string;
  company_id?: string;
  name: string;
  roleTitle: string;
  salary: number;
  admissionDate: string; // YYYY-MM-DD
  updatedAt: string;
}

export type InvestmentType = 'renda_fixa' | 'acoes' | 'fii' | 'outro';

export interface InvestmentRecord {
  id: string; // e.g., "INV-001"
  dbUuid?: string;
  company_id?: string;
  assetName: string;
  assetType: InvestmentType;
  appliedDate: string; // YYYY-MM-DD
  investedAmount: number;
  currentAmount: number;
  updatedAt: string;
}

export interface EnterpriseDatabase {
  version: number;
  company_id: string; // Strict tenant isolation key
  companies: Company[];
  orders: DieOrder[];
  deliveries: DeliveryRecord[];
  returns: WarrantyReturnRecord[];
  stock?: StockItem[];
  notas?: NoteRecord[];
  noteSequence?: number;
  despesas?: ExpenseRecord[];
  expenses?: MonthlyExpenseRecord[];
  serviceProviders?: ServiceProviderRecord[];
  payrollEmployees?: PayrollEmployeeRecord[];
  investments?: InvestmentRecord[];
  employees?: TenantAccount[];
}

export interface RealtimeSyncEvent {
  eventId: string;
  senderInstanceId?: string;
  company_id: string;
  section: 'esteira' | 'entregas' | 'retornos' | 'estoque' | 'notas' | 'financeiro' | 'equipe' | 'all';
  actionLabel: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  order?: DieOrder;
  db?: EnterpriseDatabase;
}
