import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { AuthLoginScreen } from './components/AuthLoginScreen';
import { BentoOverviewSection } from './components/BentoOverviewSection';
import { CompaniesCrmSection } from './components/CompaniesCrmSection';
import { DeliveriesLogisticsSection } from './components/DeliveriesLogisticsSection';
import { FastEntryModal } from './components/FastEntryModal';
import { FinanceAnalyticsSection } from './components/FinanceAnalyticsSection';
import { HeaderBar, LiquidSidebar } from './components/HeaderBar';
import {
  chunkNoteItems,
  formatPedidoNumber,
  NotesSection,
  PEDIDO_A5_ROWS,
  PedidoA5Sheet,
} from './components/NotesSection';
import { ProductionKanban } from './components/ProductionKanban';
import { SettingsBackupsSection } from './components/SettingsBackupsSection';
import { StockSection } from './components/StockSection';
import { TeamManagementSection } from './components/TeamManagementSection';
import { WarrantyReturnsSection } from './components/WarrantyReturnsSection';
import {
  getActiveRealtimeChannelCount,
  publishRealtimeUpdate,
  subscribeToCompanyRealtime,
} from './services/realtimeEngine';
import { getSupabaseClient } from './services/supabaseClient';
import {
  dbCreateCompany,
  dbCreateDelivery,
  dbCreateExpense,
  dbCreateInvestment,
  dbCreateOrder,
  dbCreatePayrollEmployee,
  dbCreateProvider,
  dbCreateReturn,
  dbCreateStockItem,
  dbDismissBackupAlert,
  dbLoadSettingsAndBackups,
  dbMoveOrderStage,
  dbRegisterStockMovement,
  dbRevertStockMovement,
  dbSaveNote,
  dbSoftDeleteCompany,
  dbSoftDeleteDelivery,
  dbSoftDeleteExpense,
  dbSoftDeleteInvestment,
  dbSoftDeleteNote,
  dbSoftDeleteOrder,
  dbSoftDeletePayrollEmployee,
  dbSoftDeleteProvider,
  dbSoftDeleteReturn,
  dbSoftDeleteStockItem,
  dbUpdateCompanySettings,
  dbUpdateExpense,
  dbUpdateInvestment,
  dbUpdateNoteStatus,
  dbUpdateOrderPayment,
  dbUpdatePayrollEmployee,
  dbUpdateProvider,
  dbUpdateReturnStatus,
  dbUpdateStockItem,
  ExpenseDraftPayload,
  invokeBackupEngine,
  invokeManageTeam,
  loadCompanyDatabaseFromSupabase,
  restoreSupabaseSession,
  signOutSupabase,
} from './services/supabaseDataService';
import {
  getNextDeliveryId,
  getNextInvestmentId,
  getNextNoteNumber,
  getNextOrderId,
  getNextPayrollEmployeeId,
  getNextProviderId,
  getNextReturnId,
  getNextStockId,
} from './services/storageAdapter';
import {
  ActiveSection,
  AuthSession,
  BackupLogRecord,
  BackupRecord,
  Company,
  CompanySettingsRecord,
  DeliveryRecord,
  DieOrder,
  EnterpriseDatabase,
  ExpenseRecord,
  InvestmentRecord,
  NoteRecord,
  PaymentModality,
  PaymentStatus,
  PayrollEmployeeRecord,
  PedidoEmitterProfile,
  ProductionStage,
  ReturnStatus,
  ServiceProviderRecord,
  StockItem,
  StockMovementRecord,
  UserRole,
  WarrantyReturnRecord,
} from './types/order';
import {
  addDays,
  computeFinancialBreakdown,
  nowTimestampBR,
  PRODUCTION_STAGES,
  toISODate,
} from './utils/financeEngine';

const OPERATOR_ALLOWED_SECTIONS: ActiveSection[] = [
  'esteira',
  'entregas',
  'retornos',
  'estoque',
  'notas',
];

function createEmptyDb(companyId = ''): EnterpriseDatabase {
  return {
    version: 6,
    company_id: companyId,
    companies: [],
    orders: [],
    deliveries: [],
    returns: [],
    stock: [],
    stockMovements: [],
    notas: [],
    noteSequence: 0,
    despesas: [],
    expenses: [],
    serviceProviders: [],
    payrollEmployees: [],
    investments: [],
    employees: [],
  };
}

export const App: React.FC = () => {
  const [authChecking, setAuthChecking] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [db, setDb] = useState<EnterpriseDatabase>(() => createEmptyDb());
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<ActiveSection>('bento_home');
  const [realtimeStatus, setRealtimeStatus] = useState<
    'connected' | 'supabase_live' | 'reconnecting'
  >('connected');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [prefillDeliveryOrder, setPrefillDeliveryOrder] =
    useState<DieOrder | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [printJob, setPrintJob] = useState<{
    note: NoteRecord;
    emitter: PedidoEmitterProfile;
  } | null>(null);

  // Settings & Backups (Admin Only)
  const [settingsState, setSettingsState] = useState<{
    settings: CompanySettingsRecord;
    backups: BackupRecord[];
    logs: BackupLogRecord[];
    loading: boolean;
  }>({
    settings: {
      empresa_id: '',
      retencao_diaria: 30,
      retencao_mensal: 12,
      backup_automatico: true,
    },
    backups: [],
    logs: [],
    loading: false,
  });

  const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);
  const pendingOrderIdsRef = useRef<Set<string>>(new Set());
  const dbRef = useRef<EnterpriseDatabase>(db);
  dbRef.current = db;
  const sessionRef = useRef<AuthSession | null>(session);
  sessionRef.current = session;
  const autoBackupTimerRef = useRef<number | null>(null);

  const [moveError, setMoveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant?: 'ok' | 'err';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (
      message: string,
      variant: 'ok' | 'err' = 'ok',
      action?: { label: string; onClick: () => void }
    ) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({
        message,
        variant,
        actionLabel: action?.label,
        onAction: action?.onClick,
      });
      toastTimerRef.current = window.setTimeout(
        () => {
          setToast((prev) => (prev?.message === message ? null : prev));
        },
        action ? 7000 : 3800
      );
    },
    []
  );

  const refreshSettingsAndBackups = useCallback(
    async (empresaId: string, isSuperAdmin?: boolean) => {
      if (!isSuperAdmin || !empresaId) return;
      setSettingsState((prev) => ({ ...prev, loading: true }));
      try {
        const res = await dbLoadSettingsAndBackups(empresaId);
        setSettingsState({
          settings: res.settings,
          backups: res.backups,
          logs: res.logs,
          loading: false,
        });
      } catch {
        setSettingsState((prev) => ({ ...prev, loading: false }));
      }
    },
    []
  );

  const hydrateFromSupabase = useCallback(
    async (activeSession: AuthSession) => {
      const targetEmpresaId = activeSession.empresaId || activeSession.company_id;
      setDbLoading(true);
      setDbError(null);
      try {
        const loaded = await loadCompanyDatabaseFromSupabase(
          targetEmpresaId,
          activeSession.role
        );
        setDb(loaded);
        setSelectedCompanyId((prev) =>
          prev && loaded.companies.some((c) => c.id === prev)
            ? prev
            : loaded.companies[0]?.id || null
        );
        if (activeSession.isSuperAdmin) {
          await refreshSettingsAndBackups(targetEmpresaId, activeSession.isSuperAdmin);
        }
      } catch (err: any) {
        setDbError(
          err?.message ||
            'Não foi possível carregar os dados da empresa no Supabase.'
        );
      } finally {
        setDbLoading(false);
      }
    },
    [refreshSettingsAndBackups]
  );

  // Schedule debounced automatic snapshot after data changes (~15s idle, 1h server throttle)
  const scheduleAutoBackup = useCallback(() => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    if (settingsState.settings.backup_automatico === false) return;

    const empresaId = active.empresaId || active.company_id;
    if (autoBackupTimerRef.current) {
      window.clearTimeout(autoBackupTimerRef.current);
    }
    autoBackupTimerRef.current = window.setTimeout(async () => {
      try {
        await invokeBackupEngine({
          action: 'snapshot_company',
          tipo: 'automatico',
          debounced: true,
        });
        if (active.isSuperAdmin) {
          await refreshSettingsAndBackups(empresaId, true);
        }
      } catch {
        if (active.isSuperAdmin) {
          await refreshSettingsAndBackups(empresaId, true);
        }
      }
    }, 15000);
  }, [settingsState.settings.backup_automatico, refreshSettingsAndBackups]);

  // Restore active Supabase session on mount & listen for auth changes (never wipes data!)
  useEffect(() => {
    let mounted = true;
    const sb = getSupabaseClient();

    restoreSupabaseSession()
      .then(async (restored) => {
        if (!mounted) return;
        if (restored) {
          setSession(restored);
          setActiveSection(
            restored.role === 'operador' ? 'esteira' : 'bento_home'
          );
          await hydrateFromSupabase(restored);
        }
      })
      .finally(() => {
        if (mounted) setAuthChecking(false);
      });

    const { data: authListener } = sb.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        if (autoBackupTimerRef.current) {
          window.clearTimeout(autoBackupTimerRef.current);
        }
        setSession(null);
        setDb(createEmptyDb());
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      if (autoBackupTimerRef.current) {
        window.clearTimeout(autoBackupTimerRef.current);
      }
    };
  }, [hydrateFromSupabase]);

  const isNewerOrder = (incoming: DieOrder, local?: DieOrder): boolean => {
    if (!local) return true;
    const incVer = Number(incoming.version) || 0;
    const locVer = Number(local.version) || 0;
    if (incVer > locVer) return true;
    if (incVer < locVer) return false;
    return (incoming.updatedAt || '') > (local.updatedAt || '');
  };

  // Realtime listener (read-only UI sync per empresa_id; no ping-pong writebacks)
  useEffect(() => {
    (window as any).__facasflowChannelCount = getActiveRealtimeChannelCount;
    const empresaId = session?.empresaId || session?.company_id;
    if (!empresaId) return;

    const unsubscribe = subscribeToCompanyRealtime(
      empresaId,
      (remoteEvent) => {
        setDb((prev) => {
          if (remoteEvent.order) {
            const incoming = remoteEvent.order;
            if (pendingOrderIdsRef.current.has(incoming.id)) {
              return prev;
            }
            const existing = prev.orders.find(
              (o) =>
                (incoming.dbUuid && o.dbUuid === incoming.dbUuid) ||
                o.id === incoming.id
            );
            if (existing && !isNewerOrder(incoming, existing)) {
              return prev;
            }
            const nextOrders = existing
              ? prev.orders.map((o) =>
                  (incoming.dbUuid && o.dbUuid === incoming.dbUuid) ||
                  o.id === incoming.id
                    ? { ...o, ...incoming }
                    : o
                )
              : [incoming, ...prev.orders];
            return { ...prev, orders: nextOrders };
          }
          return prev;
        });
      },
      (status) => {
        setRealtimeStatus(status);
      },
      () => dbRef.current
    );

    return () => {
      unsubscribe();
    };
  }, [session?.empresaId, session?.company_id]);

  const handleAuthenticated = async (newSession: AuthSession) => {
    setSession(newSession);
    setSelectedCompanyId(null);
    setActiveSection(newSession.role === 'operador' ? 'esteira' : 'bento_home');
    setSearchQuery('');
    await hydrateFromSupabase(newSession);
    showToast(
      newSession.role === 'operador'
        ? `Acesso de Produção liberado (${newSession.ownerName})`
        : 'Sessão iniciada com sucesso!'
    );
  };

  const handleLogout = async () => {
    if (autoBackupTimerRef.current) {
      window.clearTimeout(autoBackupTimerRef.current);
    }
    try {
      await signOutSupabase();
    } catch {
      // ignore signout error, clear client state only (remote data remains untouched!)
    }
    setSession(null);
    setDb(createEmptyDb());
    setSearchQuery('');
    setIsNewModalOpen(false);
    setSettingsState({
      settings: {
        empresa_id: '',
        retencao_diaria: 30,
        retencao_mensal: 12,
        backup_automatico: true,
      },
      backups: [],
      logs: [],
      loading: false,
    });
  };

  const handleSelectSection = (target: ActiveSection) => {
    if (target === 'configuracoes' && !session?.isSuperAdmin) {
      setActiveSection(session?.role === 'operador' ? 'esteira' : 'bento_home');
      return;
    }
    if (
      session?.role === 'operador' &&
      !OPERATOR_ALLOWED_SECTIONS.includes(target)
    ) {
      setActiveSection('esteira');
      return;
    }
    setActiveSection(target);
  };

  const empresaId = session?.empresaId || session?.company_id || '';

  // Search filtering
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return db.orders;
    return db.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q) ||
        o.toolDescription.toLowerCase().includes(q)
    );
  }, [db.orders, searchQuery]);

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return db.companies;
    return db.companies.filter(
      (c) =>
        c.corporateName.toLowerCase().includes(q) ||
        c.cnpj.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q)
    );
  }, [db.companies, searchQuery]);

  const financials = useMemo(
    () => computeFinancialBreakdown(filteredOrders),
    [filteredOrders]
  );

  const nextOrderId = useMemo(() => getNextOrderId(db), [db]);

  // CRUD Handlers — Direct Supabase Persistence (Soft Delete)
  const handleAddCompany = async (newCompData: Omit<Company, 'id'>) => {
    if (!session || session.role !== 'admin') return;
    try {
      let maxNum = 0;
      for (const c of db.companies) {
        const n = parseInt(c.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
      const newCode = `EMP-${String(maxNum + 1).padStart(2, '0')}`;
      const created = await dbCreateCompany(empresaId, newCode, newCompData);
      setDb((prev) => ({
        ...prev,
        companies: [created, ...prev.companies],
      }));
      setSelectedCompanyId(created.id);
      scheduleAutoBackup();
      showToast(`Empresa "${created.corporateName}" cadastrada!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar empresa.', 'err');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!session || session.role !== 'admin') return;
    const comp = db.companies.find((c) => c.id === companyId);
    if (!comp?.dbUuid) return;
    try {
      const removedOrders = db.orders.filter((o) => o.companyId === companyId);
      const removedOrderIds = new Set(removedOrders.map((o) => o.id));
      await Promise.all([
        ...db.returns
          .filter((r) => removedOrderIds.has(r.orderId) && r.dbUuid)
          .map((r) => dbSoftDeleteReturn(empresaId, r.dbUuid!)),
        ...db.deliveries
          .filter((d) => removedOrderIds.has(d.orderId) && d.dbUuid)
          .map((d) => dbSoftDeleteDelivery(empresaId, d.dbUuid!)),
        ...removedOrders
          .filter((o) => o.dbUuid)
          .map((o) => dbSoftDeleteOrder(empresaId, o.dbUuid!)),
      ]);
      await dbSoftDeleteCompany(empresaId, comp.dbUuid);

      setDb((prev) => {
        const nextCompanies = prev.companies.filter((c) => c.id !== companyId);
        return {
          ...prev,
          companies: nextCompanies,
          orders: prev.orders.filter((o) => o.companyId !== companyId),
          deliveries: prev.deliveries.filter(
            (d) => !removedOrderIds.has(d.orderId)
          ),
          returns: prev.returns.filter((r) => !removedOrderIds.has(r.orderId)),
        };
      });
      if (selectedCompanyId === companyId) {
        setSelectedCompanyId(null);
      }
      scheduleAutoBackup();
      showToast(`Empresa "${comp.corporateName}" apagada!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover empresa.', 'err');
    }
  };

  const handleCreateOrderFull = async (payload: {
    companyId: string;
    companyName: string;
    companyPhone: string;
    toolDescription: string;
    amount: number;
    paymentModality: PaymentModality;
    stage: ProductionStage;
  }) => {
    if (!session) return;
    try {
      const stamp = nowTimestampBR();
      let existingComp = db.companies.find((c) => c.id === payload.companyId);
      let newCompCreated: Company | null = null;

      if (!existingComp) {
        let maxNum = 0;
        for (const c of db.companies) {
          const n = parseInt(c.id.replace(/\D/g, ''), 10);
          if (!Number.isNaN(n) && n > maxNum) maxNum = n;
        }
        const compCode = `EMP-${String(maxNum + 1).padStart(2, '0')}`;
        newCompCreated = await dbCreateCompany(empresaId, compCode, {
          corporateName: payload.companyName,
          cnpj: 'Não informado',
          phone: payload.companyPhone,
          contactName: 'PCP / Compras',
        });
        existingComp = newCompCreated;
      }

      const createdOrder = await dbCreateOrder(empresaId, nextOrderId, {
        companyId: existingComp.id,
        companyUuid: existingComp.dbUuid,
        companyName: existingComp.corporateName,
        companyPhone: existingComp.phone || payload.companyPhone,
        toolDescription: payload.toolDescription,
        amount: payload.amount,
        paymentModality: payload.paymentModality,
        stage: payload.stage,
        stageUpdatedAt: stamp,
      });

      setDb((prev) => ({
        ...prev,
        companies: newCompCreated
          ? [newCompCreated, ...prev.companies]
          : prev.companies,
        orders: [createdOrder, ...prev.orders],
      }));
      if (!selectedCompanyId) {
        setSelectedCompanyId(existingComp.id);
      }
      const stageLabel =
        PRODUCTION_STAGES.find((s) => s.id === payload.stage)?.label ||
        payload.stage;
      scheduleAutoBackup();
      showToast(`${createdOrder.id} criada em "${stageLabel}"!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao criar Ordem de Serviço.', 'err');
    }
  };

  // Seção 2 • Esteira Física de Produção (Optimistic single card + RPC mover_faca_v2)
  const handleMoveStage = useCallback(
    async (orderId: string, targetStage: ProductionStage) => {
      if (!session) return;
      const currentOrder = dbRef.current.orders.find((o) => o.id === orderId);
      if (!currentOrder || currentOrder.stage === targetStage) return;
      if (!currentOrder.dbUuid) return;
      if (pendingOrderIdsRef.current.has(orderId)) return;

      const stamp = nowTimestampBR();
      const nowIso = new Date().toISOString();
      const previousOrder = { ...currentOrder };
      const optimisticOrder: DieOrder = {
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

      pendingOrderIdsRef.current.add(orderId);
      setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
      setMoveError(null);
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? optimisticOrder : o)),
      }));

      try {
        const rpcRes = await dbMoveOrderStage(
          currentOrder.dbUuid,
          targetStage,
          stamp
        );
        const authoritativeOrder: DieOrder = {
          ...optimisticOrder,
          version: rpcRes.version ?? optimisticOrder.version,
          updatedAt: rpcRes.updatedAt ?? optimisticOrder.updatedAt,
        };

        pendingOrderIdsRef.current.delete(orderId);
        setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
        setDb((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? authoritativeOrder : o
          ),
        }));

        publishRealtimeUpdate({
          company_id: empresaId,
          section: 'esteira',
          actionLabel: '',
          actorName: session.ownerName,
          actorRole: session.role,
          order: authoritativeOrder,
        });
        scheduleAutoBackup();
      } catch {
        pendingOrderIdsRef.current.delete(orderId);
        setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
        setDb((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? previousOrder : o
          ),
        }));
        setMoveError(`Não foi possível mover ${orderId}. Estado restaurado.`);
        window.setTimeout(() => setMoveError(null), 4000);
      }
    },
    [session, empresaId, scheduleAutoBackup]
  );

  const handleTogglePaid = async (orderId: string) => {
    if (!session) return;
    const order = db.orders.find((o) => o.id === orderId);
    if (!order?.dbUuid) return;

    const today = toISODate();
    const isPaid = order.paymentStatus === 'pago';
    const nextStatus: PaymentStatus = isPaid ? 'nao_pago' : 'pago';
    const nextPaidAt = isPaid ? null : today;
    const nextVersion = (Number(order.version) || 1) + 1;

    try {
      await dbUpdateOrderPayment(empresaId, order.dbUuid, {
        status_pagamento: nextStatus,
        data_pagamento: nextPaidAt,
        version: nextVersion,
      });
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: nextStatus,
                paidAt: nextPaidAt || undefined,
                version: nextVersion,
                updatedAt: new Date().toISOString(),
              }
            : o
        ),
      }));
      scheduleAutoBackup();
      showToast(
        nextStatus === 'pago'
          ? `${orderId} marcada como paga!`
          : `${orderId} reaberta como Não Pago.`
      );
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar pagamento.', 'err');
    }
  };

  const handleEmitBilling30d = async (orderId: string) => {
    if (!session) return;
    const order = db.orders.find((o) => o.id === orderId);
    if (!order?.dbUuid) return;

    const today = toISODate();
    const nextDue = addDays(today, 30);
    const nextVersion = (Number(order.version) || 1) + 1;

    try {
      await dbUpdateOrderPayment(empresaId, order.dbUuid, {
        status_pagamento: 'a_receber',
        data_vencimento: nextDue,
        version: nextVersion,
      });
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: 'a_receber',
                dueDate: nextDue,
                version: nextVersion,
                updatedAt: new Date().toISOString(),
              }
            : o
        ),
      }));
      scheduleAutoBackup();
      showToast(`Faturamento 30 dias gerado para ${orderId}!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao gerar faturamento.', 'err');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!session) return;
    const target = db.orders.find((o) => o.id === orderId);
    if (!target?.dbUuid) return;

    try {
      await Promise.all([
        ...db.deliveries
          .filter((d) => d.orderId === orderId && d.dbUuid)
          .map((d) => dbSoftDeleteDelivery(empresaId, d.dbUuid!)),
        ...db.returns
          .filter((r) => r.orderId === orderId && r.dbUuid)
          .map((r) => dbSoftDeleteReturn(empresaId, r.dbUuid!)),
      ]);
      await dbSoftDeleteOrder(empresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.id !== orderId),
        deliveries: prev.deliveries.filter((d) => d.orderId !== orderId),
        returns: prev.returns.filter((r) => r.orderId !== orderId),
      }));
      scheduleAutoBackup();
      showToast(`Ordem ${orderId} removida com sucesso!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao apagar OS.', 'err');
    }
  };

  // Seção 4 • Entregas
  const handleAddDelivery = async (deliveryData: Omit<DeliveryRecord, 'id'>) => {
    if (!session) return;
    try {
      const code = getNextDeliveryId(db);
      const ord = db.orders.find((o) => o.id === deliveryData.orderId);
      const created = await dbCreateDelivery(
        empresaId,
        code,
        deliveryData,
        ord?.dbUuid
      );

      let movedVer = ord?.version || 1;
      const stamp = nowTimestampBR();
      if (ord?.dbUuid && ord.stage !== 'faca_pronta') {
        const rpcRes = await dbMoveOrderStage(ord.dbUuid, 'faca_pronta', stamp);
        movedVer = rpcRes.version ?? movedVer + 1;
      }

      setDb((prev) => ({
        ...prev,
        deliveries: [created, ...prev.deliveries],
        orders: prev.orders.map((o) =>
          o.id === deliveryData.orderId
            ? {
                ...o,
                stage: 'faca_pronta',
                stageUpdatedAt: stamp,
                version: movedVer,
                updatedAt: new Date().toISOString(),
              }
            : o
        ),
      }));
      scheduleAutoBackup();
      showToast(`Saída logística da ${deliveryData.orderId} registrada!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao registrar entrega.', 'err');
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!session) return;
    const del = db.deliveries.find((d) => d.id === deliveryId);
    if (!del?.dbUuid) return;
    try {
      await dbSoftDeleteDelivery(empresaId, del.dbUuid);
      setDb((prev) => ({
        ...prev,
        deliveries: prev.deliveries.filter((d) => d.id !== deliveryId),
      }));
      scheduleAutoBackup();
      showToast(`Registro de entrega ${deliveryId} removido!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover entrega.', 'err');
    }
  };

  // Seção 5 • Retornos e Ajustes
  const handleAddReturn = async (retData: Omit<WarrantyReturnRecord, 'id'>) => {
    if (!session) return;
    try {
      const code = getNextReturnId(db);
      const ord = db.orders.find((o) => o.id === retData.orderId);
      const created = await dbCreateReturn(empresaId, code, retData, ord?.dbUuid);
      setDb((prev) => ({
        ...prev,
        returns: [created, ...prev.returns],
      }));
      scheduleAutoBackup();
      showToast(`Retorno de garantia (${retData.orderId}) registrado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao registrar retorno.', 'err');
    }
  };

  const handleUpdateReturnStatus = async (id: string, nextStatus: ReturnStatus) => {
    if (!session) return;
    const target = db.returns.find((r) => r.id === id);
    if (!target?.dbUuid) return;
    try {
      await dbUpdateReturnStatus(empresaId, target.dbUuid, nextStatus);
      const stamp = nowTimestampBR();
      setDb((prev) => ({
        ...prev,
        returns: prev.returns.map((r) =>
          r.id === id ? { ...r, status: nextStatus, updatedAt: stamp } : r
        ),
      }));
      scheduleAutoBackup();
      showToast(`Status do retorno atualizado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar retorno.', 'err');
    }
  };

  const handleDeleteReturn = async (returnId: string) => {
    if (!session) return;
    const target = db.returns.find((r) => r.id === returnId);
    if (!target?.dbUuid) return;
    try {
      await dbSoftDeleteReturn(empresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        returns: prev.returns.filter((r) => r.id !== returnId),
      }));
      scheduleAutoBackup();
      showToast(`Registro de retorno ${returnId} removido!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao apagar retorno.', 'err');
    }
  };

  // Seção 6 • Estoque (CRUD restrito a admin; consumo rápido e estorno liberados para admin e operador)
  const handleAddStockItem = async (
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (!session || session.role !== 'admin') return;
    try {
      const code = getNextStockId(db);
      const created = await dbCreateStockItem(empresaId, code, payload);
      setDb((prev) => ({
        ...prev,
        stock: [created, ...(prev.stock || [])],
      }));
      scheduleAutoBackup();
      showToast(`Item "${created.name}" (${created.id}) adicionado ao estoque!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar item no estoque.', 'err');
    }
  };

  const handleUpdateStockItem = async (
    id: string,
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (!session || session.role !== 'admin') return;
    const target = (db.stock || []).find((item) => item.id === id);
    if (!target?.dbUuid) return;
    try {
      const updated = await dbUpdateStockItem(empresaId, target.dbUuid, payload);
      setDb((prev) => ({
        ...prev,
        stock: (prev.stock || []).map((item) =>
          item.id === id ? updated : item
        ),
      }));
      scheduleAutoBackup();
      showToast(`Estoque atualizado (${payload.name})!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar item de estoque.', 'err');
    }
  };

  const handleDeleteStockItem = async (id: string) => {
    if (!session || session.role !== 'admin') return;
    const target = (db.stock || []).find((item) => item.id === id);
    if (!target?.dbUuid) return;
    try {
      await dbSoftDeleteStockItem(empresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        stock: (prev.stock || []).filter((i) => i.id !== id),
      }));
      scheduleAutoBackup();
      showToast(`Item ${id} removido do estoque!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir item de estoque.', 'err');
    }
  };

  const handleRevertStockMovement = async (movement: StockMovementRecord) => {
    if (!session || session.role === 'cliente') return;
    const currentItem = (dbRef.current.stock || []).find(
      (i) => i.dbUuid === movement.stockItemUuid
    );
    if (!currentItem) {
      showToast('Insumo não localizado para desfazer a movimentação.', 'err');
      return;
    }
    try {
      const { updatedItem, revertedAt, estornoMovement } =
        await dbRevertStockMovement(
          empresaId,
          movement,
          currentItem,
          session.ownerName
        );
      setDb((prev) => ({
        ...prev,
        stock: (prev.stock || []).map((it) =>
          it.dbUuid === updatedItem.dbUuid ? updatedItem : it
        ),
        stockMovements: [
          estornoMovement,
          ...(prev.stockMovements || []).map((m) =>
            m.id === movement.id ? { ...m, revertedAt } : m
          ),
        ],
      }));
      scheduleAutoBackup();
      showToast(
        `Movimentação desfeita! Saldo de "${updatedItem.name}": ${updatedItem.quantity} ${updatedItem.unit}.`
      );
    } catch (err: any) {
      showToast(err?.message || 'Erro ao desfazer movimentação.', 'err');
    }
  };

  const handleQuickConsumeStock = async (
    item: StockItem,
    quantity: number,
    note?: string
  ) => {
    if (!session || session.role === 'cliente') return;
    try {
      const { updatedItem, movement } = await dbRegisterStockMovement(
        empresaId,
        item,
        -Math.abs(quantity),
        session.ownerName,
        note
      );
      setDb((prev) => ({
        ...prev,
        stock: (prev.stock || []).map((it) =>
          it.dbUuid === updatedItem.dbUuid ? updatedItem : it
        ),
        stockMovements: [movement, ...(prev.stockMovements || [])],
      }));
      scheduleAutoBackup();
      showToast(
        `Baixa registrada: -${movement.quantity} ${movement.unit} de "${movement.itemName}" (Saldo: ${updatedItem.quantity})`,
        'ok',
        {
          label: 'Desfazer',
          onClick: () => {
            setToast(null);
            handleRevertStockMovement(movement);
          },
        }
      );
    } catch (err: any) {
      showToast(err?.message || 'Erro ao registrar baixa de estoque.', 'err');
    }
  };

  const handleQuickReplenishStock = async (
    item: StockItem,
    quantity: number,
    note?: string
  ) => {
    if (!session || session.role !== 'admin') return;
    try {
      const { updatedItem, movement } = await dbRegisterStockMovement(
        empresaId,
        item,
        Math.abs(quantity),
        session.ownerName,
        note
      );
      setDb((prev) => ({
        ...prev,
        stock: (prev.stock || []).map((it) =>
          it.dbUuid === updatedItem.dbUuid ? updatedItem : it
        ),
        stockMovements: [movement, ...(prev.stockMovements || [])],
      }));
      scheduleAutoBackup();
      showToast(
        `Reposição registrada: +${movement.quantity} ${movement.unit} em "${movement.itemName}" (Saldo: ${updatedItem.quantity})`,
        'ok',
        {
          label: 'Desfazer',
          onClick: () => {
            setToast(null);
            handleRevertStockMovement(movement);
          },
        }
      );
    } catch (err: any) {
      showToast(err?.message || 'Erro ao repor estoque.', 'err');
    }
  };

  // Finanças -> Despesas (Seção 3 - CRUD completo com Soft Delete + RBAC Admin)
  const handleCreateExpense = async (
    payload: ExpenseDraftPayload
  ): Promise<ExpenseRecord> => {
    const created = await dbCreateExpense(empresaId, payload);
    setDb((prev) => ({
      ...prev,
      despesas: [created, ...(prev.despesas || [])],
    }));
    scheduleAutoBackup();
    showToast('Despesa cadastrada com sucesso!');
    return created;
  };

  const handleUpdateExpense = async (
    id: string,
    payload: ExpenseDraftPayload
  ): Promise<ExpenseRecord> => {
    const updated = await dbUpdateExpense(empresaId, id, payload);
    setDb((prev) => ({
      ...prev,
      despesas: (prev.despesas || []).map((d) => (d.id === id ? updated : d)),
    }));
    scheduleAutoBackup();
    showToast('Despesa atualizada!');
    return updated;
  };

  const handleDeleteExpense = async (id: string): Promise<void> => {
    await dbSoftDeleteExpense(empresaId, id);
    setDb((prev) => ({
      ...prev,
      despesas: (prev.despesas || []).filter((d) => d.id !== id),
    }));
    scheduleAutoBackup();
    showToast('Despesa removida!');
  };

  // Finanças -> Prestadores, Folha, Investimentos
  const handleAddProvider = async (
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    try {
      const code = getNextProviderId(db);
      const created = await dbCreateProvider(empresaId, code, payload);
      setDb((prev) => ({
        ...prev,
        serviceProviders: [created, ...(prev.serviceProviders || [])],
      }));
      scheduleAutoBackup();
      showToast(`Prestador "${created.name}" cadastrado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar prestador.', 'err');
    }
  };

  const handleUpdateProvider = async (
    id: string,
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const target = (db.serviceProviders || []).find((p) => p.id === id);
    if (!target?.dbUuid) return;
    try {
      const updated = await dbUpdateProvider(empresaId, target.dbUuid, payload);
      setDb((prev) => ({
        ...prev,
        serviceProviders: (prev.serviceProviders || []).map((p) =>
          p.id === id ? updated : p
        ),
      }));
      scheduleAutoBackup();
      showToast('Prestador atualizado!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar prestador.', 'err');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (session?.role !== 'admin') return;
    const target = (db.serviceProviders || []).find((p) => p.id === id);
    if (!target?.dbUuid) return;
    try {
      await dbSoftDeleteProvider(empresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        serviceProviders: (prev.serviceProviders || []).filter((p) => p.id !== id),
      }));
      scheduleAutoBackup();
      showToast('Prestador removido!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover prestador.', 'err');
    }
  };

  const handleAddPayrollEmployee = async (
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    try {
      const code = getNextPayrollEmployeeId(db);
      const created = await dbCreatePayrollEmployee(empresaId, code, payload);
      setDb((prev) => ({
        ...prev,
        payrollEmployees: [created, ...(prev.payrollEmployees || [])],
      }));
      scheduleAutoBackup();
      showToast(`Funcionário "${created.name}" cadastrado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar funcionário.', 'err');
    }
  };

  const handleUpdatePayrollEmployee = async (
    id: string,
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const target = (db.payrollEmployees || []).find((e) => e.id === id);
    if (!target?.dbUuid) return;
    try {
      const updated = await dbUpdatePayrollEmployee(
        empresaId,
        target.dbUuid,
        payload
      );
      setDb((prev) => ({
        ...prev,
        payrollEmployees: (prev.payrollEmployees || []).map((e) =>
          e.id === id ? updated : e
        ),
      }));
      scheduleAutoBackup();
      showToast('Funcionário atualizado!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar funcionário.', 'err');
    }
  };

  const handleDeletePayrollEmployee = async (id: string) => {
    if (session?.role !== 'admin') return;
    const target = (db.payrollEmployees || []).find((e) => e.id === id);
    if (!target?.dbUuid) return;
    try {
      await dbSoftDeletePayrollEmployee(empresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        payrollEmployees: (prev.payrollEmployees || []).filter(
          (e) => e.id !== id
        ),
      }));
      scheduleAutoBackup();
      showToast('Funcionário removido!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover funcionário.', 'err');
    }
  };

  const handleAddInvestment = async (
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    try {
      const code = getNextInvestmentId(db);
      const created = await dbCreateInvestment(empresaId, code, payload);
      setDb((prev) => ({
        ...prev,
        investments: [created, ...(prev.investments || [])],
      }));
      scheduleAutoBackup();
      showToast(`Investimento "${created.assetName}" adicionado!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao adicionar investimento.', 'err');
    }
  };

  const handleUpdateInvestment = async (
    id: string,
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const target = (db.investments || []).find((inv) => inv.id === id);
    if (!target?.dbUuid) return;
    try {
      const updated = await dbUpdateInvestment(empresaId, target.dbUuid, payload);
      setDb((prev) => ({
        ...prev,
        investments: (prev.investments || []).map((inv) =>
          inv.id === id ? updated : inv
        ),
      }));
      scheduleAutoBackup();
      showToast('Investimento atualizado!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar investimento.', 'err');
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    if (session?.role !== 'admin') return;
    const target = (db.investments || []).find((inv) => inv.id === id);
    if (!target?.dbUuid) return;
    try {
      await dbSoftDeleteInvestment(empresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        investments: (prev.investments || []).filter((inv) => inv.id !== id),
      }));
      scheduleAutoBackup();
      showToast('Investimento removido!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover investimento.', 'err');
    }
  };

  // Seção Notas (Admin & Operador)
  const nextNoteNumber = useMemo(() => getNextNoteNumber(db), [db]);

  const handleSaveNote = async (
    payload: Omit<NoteRecord, 'id' | 'company_id' | 'criadoPor' | 'criadoEm'>,
    editingId?: string
  ): Promise<NoteRecord | null> => {
    if (!session || session.role === 'cliente') return null;
    try {
      const saved = await dbSaveNote(
        empresaId,
        session.ownerName,
        payload,
        editingId
      );
      setDb((prev) => {
        const current = prev.notas || [];
        const nextNotas = editingId
          ? current.map((n) => (n.id === editingId ? saved : n))
          : [saved, ...current];
        return {
          ...prev,
          notas: nextNotas,
          noteSequence: Math.max(prev.noteSequence || 0, saved.numero),
        };
      });
      scheduleAutoBackup();
      showToast(
        `Pedido Nº ${formatPedidoNumber(saved.numero)} ${
          editingId ? 'atualizado' : 'emitido'
        }!`
      );
      return saved;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar pedido.', 'err');
      return null;
    }
  };

  const handleMarkNotePrinted = async (id: string) => {
    if (!session || session.role === 'cliente') return;
    try {
      await dbUpdateNoteStatus(empresaId, id, 'impressa');
      setDb((prev) => ({
        ...prev,
        notas: (prev.notas || []).map((n) =>
          n.id === id ? { ...n, status: 'impressa' as const } : n
        ),
      }));
    } catch {
      // non-blocking
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!session || session.role === 'cliente') return;
    try {
      await dbSoftDeleteNote(empresaId, id);
      setDb((prev) => ({
        ...prev,
        notas: (prev.notas || []).filter((n) => n.id !== id),
      }));
      scheduleAutoBackup();
      showToast('Pedido removido!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover pedido.', 'err');
    }
  };

  const handleTriggerPrint = (
    note: NoteRecord,
    emitter: PedidoEmitterProfile
  ) => {
    setPrintJob({ note, emitter });
    window.setTimeout(() => {
      window.print();
    }, 120);
  };

  // Equipe (Edge Function manage-team - sem service_role no frontend)
  const handleAddEmployee = async (payload: {
    ownerName: string;
    email: string;
    password: string;
    role: UserRole;
    jobTitle: string;
  }): Promise<{ error?: string }> => {
    if (!session || session.role !== 'admin') {
      return { error: 'Apenas administradores podem adicionar membros.' };
    }
    try {
      await invokeManageTeam({
        action: 'create_member',
        ...payload,
      });
      await hydrateFromSupabase(session);
      showToast(`Funcionário "${payload.ownerName}" cadastrado no Supabase!`);
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Erro ao criar membro.' };
    }
  };

  const handleToggleEmployeeRole = async (
    memberId: string,
    nextRole: UserRole
  ) => {
    if (!session || session.role !== 'admin') return;
    try {
      await invokeManageTeam({
        action: 'update_role',
        memberId,
        role: nextRole,
      });
      setDb((prev) => ({
        ...prev,
        employees: (prev.employees || []).map((e) =>
          e.id === memberId ? { ...e, role: nextRole } : e
        ),
      }));
      showToast(
        `Permissão alterada para ${
          nextRole === 'operador' ? 'Operador' : 'Administrador'
        }!`
      );
    } catch (err: any) {
      showToast(err?.message || 'Erro ao alterar perfil.', 'err');
    }
  };

  const handleDeleteEmployee = async (memberId: string) => {
    if (!session || session.role !== 'admin') return;
    try {
      await invokeManageTeam({
        action: 'remove_member',
        memberId,
      });
      setDb((prev) => ({
        ...prev,
        employees: (prev.employees || []).filter((e) => e.id !== memberId),
      }));
      showToast('Funcionário removido da equipe!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover funcionário.', 'err');
    }
  };

  const unDismissedAlerts = settingsState.logs.filter(
    (l) => l.status === 'erro' && !l.alerta_dispensado
  );

  const counts = {
    companies: db.companies.length,
    inProduction: db.orders.filter((o) => o.stage !== 'faca_pronta').length,
    overdue: financials.overdueCount,
    deliveries: db.deliveries.length,
    openReturns: db.returns.filter((r) => r.status !== 'liberado').length,
    stock: (db.stock || []).length,
    notas: (db.notas || []).length,
    employees: (db.employees || []).length,
    backupAlerts: unDismissedAlerts.length,
  };

  if (authChecking) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-slate-800 relative">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="liquid-glass rounded-[28px] px-8 py-7 flex flex-col items-center gap-3 relative z-10 shadow-xl">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-slate-900">
            Conectando ao FacasFlow Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] relative">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="blob blob-5" />
        <div className="relative z-10">
          <AuthLoginScreen onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    );
  }

  // Enforce RBAC + Super Admin section access
  const effectiveSection: ActiveSection =
    activeSection === 'configuracoes' && !session.isSuperAdmin
      ? session.role === 'operador'
        ? 'esteira'
        : 'bento_home'
      : session.role === 'operador' &&
          !OPERATOR_ALLOWED_SECTIONS.includes(activeSection)
        ? 'esteira'
        : activeSection;

  const printPages = printJob
    ? chunkNoteItems(printJob.note.items, PEDIDO_A5_ROWS)
    : [];

  return (
    <>
      <div className="no-print min-h-[100dvh] text-slate-900 pb-24 relative selection:bg-indigo-500 selection:text-white">
        {/* Ambient Liquid Glass Morphing Blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="blob blob-5" />

        {/* Dashboard Shell (sem z-index próprio para não prender modais abaixo do FAB) */}
        <div className="max-w-[1720px] mx-auto flex gap-5 relative p-3 sm:p-5 lg:p-7 min-w-0">
          <LiquidSidebar
            activeSection={effectiveSection}
            onSelectSection={handleSelectSection}
            tenantName={session.companyName}
            userRole={session.role}
            isSuperAdmin={Boolean(session.isSuperAdmin)}
            userName={session.ownerName}
            onLogout={handleLogout}
            counts={counts}
          />

          <div className="flex-1 flex flex-col gap-5 min-w-0">
            <HeaderBar
              activeSection={effectiveSection}
              onSelectSection={handleSelectSection}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNewOrder={() => setIsNewModalOpen(true)}
              tenantName={session.companyName}
              userRole={session.role}
              isSuperAdmin={Boolean(session.isSuperAdmin)}
              userName={session.ownerName}
              realtimeStatus={realtimeStatus}
              onLogout={handleLogout}
              counts={counts}
            />

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col gap-5 min-w-0">
              {/* Global Super Admin Alert Banner if a Backup Failure is Unresolved */}
              {session.isSuperAdmin &&
                unDismissedAlerts.length > 0 &&
                effectiveSection !== 'configuracoes' && (
                  <div className="rounded-[22px] bg-rose-500/15 border border-rose-500/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                      <div className="text-xs min-w-0">
                        <strong className="text-rose-900 block">
                          Atenção: falha recente detectada no serviço de backup
                        </strong>
                        <span className="text-rose-800 break-words">
                          {unDismissedAlerts[0].mensagem}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('configuracoes')}
                      className="min-h-[44px] px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <DatabaseBackup className="w-4 h-4" />
                      <span>Abrir Backups</span>
                    </button>
                  </div>
                )}

              {dbError && (
                <div className="rounded-[24px] bg-rose-500/15 border border-rose-500/70 p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-rose-900">
                  <span>{dbError}</span>
                  <button
                    type="button"
                    onClick={() => hydrateFromSupabase(session)}
                    className="liquid-glass-pill min-h-[44px] px-4 py-2 rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Recarregar</span>
                  </button>
                </div>
              )}

              {dbLoading && db.orders.length === 0 && db.companies.length === 0 ? (
                <div className="liquid-glass rounded-[28px] p-10 flex flex-col items-center gap-3 text-xs font-bold text-slate-700">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Carregando dados da empresa no Supabase...</span>
                </div>
              ) : null}

              {session.role === 'admin' && effectiveSection === 'bento_home' && (
                <BentoOverviewSection
                  companies={filteredCompanies}
                  orders={filteredOrders}
                  deliveries={db.deliveries}
                  returns={db.returns}
                  stock={db.stock || []}
                  financials={financials}
                  onNavigate={handleSelectSection}
                  onOpenNewOrder={() => setIsNewModalOpen(true)}
                  onSelectCompany={(id) => setSelectedCompanyId(id)}
                />
              )}

              {session.role === 'admin' && effectiveSection === 'empresas' && (
                <CompaniesCrmSection
                  companies={filteredCompanies}
                  orders={filteredOrders}
                  selectedCompanyId={selectedCompanyId}
                  onSelectCompany={setSelectedCompanyId}
                  onAddCompany={handleAddCompany}
                  onDeleteCompany={handleDeleteCompany}
                  onDeleteOrder={handleDeleteOrder}
                  onAddDieForCompany={(comp, desc, val, mod) =>
                    handleCreateOrderFull({
                      companyId: comp.id,
                      companyName: comp.corporateName,
                      companyPhone: comp.phone,
                      toolDescription: desc,
                      amount: val,
                      paymentModality: mod,
                      stage: 'arquivo_recebido',
                    })
                  }
                />
              )}

              {effectiveSection === 'esteira' && (
                <ProductionKanban
                  orders={filteredOrders}
                  pendingOrderIds={pendingOrderIds}
                  moveError={moveError}
                  onMoveStage={handleMoveStage}
                  onDeleteOrder={handleDeleteOrder}
                  onQuickRegisterDelivery={(order) => {
                    setPrefillDeliveryOrder(order);
                    handleSelectSection('entregas');
                  }}
                />
              )}

              {session.role === 'admin' && effectiveSection === 'financeiro' && (
                <FinanceAnalyticsSection
                  orders={filteredOrders}
                  financials={financials}
                  despesas={db.despesas || []}
                  canEditDespesas={session.role === 'admin'}
                  serviceProviders={db.serviceProviders || []}
                  payrollEmployees={db.payrollEmployees || []}
                  investments={db.investments || []}
                  onTogglePaid={handleTogglePaid}
                  onEmitBilling30d={handleEmitBilling30d}
                  onDeleteOrder={handleDeleteOrder}
                  onCreateExpense={handleCreateExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onAddProvider={handleAddProvider}
                  onUpdateProvider={handleUpdateProvider}
                  onDeleteProvider={handleDeleteProvider}
                  onAddPayrollEmployee={handleAddPayrollEmployee}
                  onUpdatePayrollEmployee={handleUpdatePayrollEmployee}
                  onDeletePayrollEmployee={handleDeletePayrollEmployee}
                  onAddInvestment={handleAddInvestment}
                  onUpdateInvestment={handleUpdateInvestment}
                  onDeleteInvestment={handleDeleteInvestment}
                />
              )}

              {effectiveSection === 'entregas' && (
                <DeliveriesLogisticsSection
                  orders={db.orders}
                  deliveries={db.deliveries}
                  prefillOrder={prefillDeliveryOrder}
                  onAddDelivery={handleAddDelivery}
                  onDeleteDelivery={handleDeleteDelivery}
                />
              )}

              {effectiveSection === 'retornos' && (
                <WarrantyReturnsSection
                  orders={db.orders}
                  returns={db.returns}
                  onAddReturn={handleAddReturn}
                  onUpdateReturnStatus={handleUpdateReturnStatus}
                  onDeleteReturn={handleDeleteReturn}
                />
              )}

              {effectiveSection === 'estoque' && (
                <StockSection
                  userRole={session.role}
                  items={db.stock || []}
                  movements={db.stockMovements || []}
                  globalSearchQuery={searchQuery}
                  onAddItem={handleAddStockItem}
                  onUpdateItem={handleUpdateStockItem}
                  onDeleteItem={handleDeleteStockItem}
                  onQuickConsume={handleQuickConsumeStock}
                  onQuickReplenish={handleQuickReplenishStock}
                  onRevertMovement={handleRevertStockMovement}
                />
              )}

              {effectiveSection === 'notas' && session.role !== 'cliente' && (
                <NotesSection
                  notas={db.notas || []}
                  companies={db.companies}
                  orders={db.orders}
                  nextNoteNumber={nextNoteNumber}
                  tenantKey={empresaId}
                  currentUserName={session.ownerName}
                  globalSearchQuery={searchQuery}
                  onSaveNote={handleSaveNote}
                  onMarkNotePrinted={handleMarkNotePrinted}
                  onDeleteNote={handleDeleteNote}
                  onTriggerPrint={handleTriggerPrint}
                  onSyncPrintPreview={setPrintJob}
                />
              )}

              {session.role === 'admin' && effectiveSection === 'equipe' && (
                <TeamManagementSection
                  session={session}
                  employees={db.employees || []}
                  onAddEmployee={handleAddEmployee}
                  onToggleEmployeeRole={handleToggleEmployeeRole}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              )}

              {session.isSuperAdmin &&
                effectiveSection === 'configuracoes' && (
                  <SettingsBackupsSection
                    empresaId={empresaId}
                    companyName={session.companyName}
                    settings={settingsState.settings}
                    backups={settingsState.backups}
                    logs={settingsState.logs}
                    loading={settingsState.loading}
                    onRefresh={() =>
                      refreshSettingsAndBackups(empresaId, session.isSuperAdmin)
                    }
                    onUpdateSettings={async (updates) => {
                      const updated = await dbUpdateCompanySettings(
                        empresaId,
                        updates
                      );
                      setSettingsState((prev) => ({
                        ...prev,
                        settings: updated,
                      }));
                    }}
                    onDismissAlert={async (logId) => {
                      await dbDismissBackupAlert(empresaId, logId);
                      setSettingsState((prev) => ({
                        ...prev,
                        logs: prev.logs.map((l) =>
                          l.id === logId ? { ...l, alerta_dispensado: true } : l
                        ),
                      }));
                    }}
                    onRestored={async () => {
                      await hydrateFromSupabase(session);
                    }}
                  />
                )}
            </main>
          </div>
        </div>

        {/* Toast Notification (Only explicit user actions; realtime is silent) */}
        {toast && (
          <div
            role="status"
            className={`fixed bottom-20 right-4 sm:right-6 z-[75] max-w-[calc(100vw-2rem)] px-4 py-3 rounded-2xl liquid-glass ring-2 ${
              toast.variant === 'err'
                ? 'ring-rose-500/70 text-rose-900'
                : 'ring-indigo-400/50 text-slate-900'
            } text-xs font-bold shadow-2xl flex items-center gap-2.5`}
          >
            {toast.variant === 'err' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="break-words">{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={toast.onAction}
                className="btn-compact ml-1 px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold shadow-sm transition cursor-pointer shrink-0"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        )}

        {/* Prominent Floating Action Button ("Nova OS") - Mobile/Tablet Admin Only */}
        {session.role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20 min-h-[48px] inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white border border-white/40 shadow-2xl shadow-indigo-600/40 transition-all cursor-pointer"
          >
            <span>Nova OS</span>
          </button>
        )}

        {/* Fast Entry Modal */}
        {session.role === 'admin' && (
          <FastEntryModal
            isOpen={isNewModalOpen}
            onClose={() => setIsNewModalOpen(false)}
            companies={db.companies}
            nextOrderId={nextOrderId}
            onSaveOrder={handleCreateOrderFull}
          />
        )}
      </div>

      {/* Container exclusivo de impressão A5 Retrato (148 x 210 mm) */}
      {printJob && (
        <div className="print-only-container">
          {printPages.map((chunk, idx) => (
            <PedidoA5Sheet
              key={`print-${printJob.note.id}-${idx}`}
              note={printJob.note}
              itemsChunk={chunk}
              pageIndex={idx}
              totalPages={printPages.length}
              emitter={printJob.emitter}
              isPrintMode
            />
          ))}
        </div>
      )}
    </>
  );
};

export default App;
