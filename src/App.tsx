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
  dbBulkSoftDeleteDeliveries,
  dbBulkSoftDeleteOrders,
  dbBulkSoftDeleteReturns,
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
  dbSoftDeleteCollaboratorLinkedExpenses,
  dbSoftDeleteDelivery,
  dbSoftDeleteExpense,
  dbSoftDeleteInvestment,
  dbSoftDeleteNote,
  dbSoftDeleteOrder,
  dbSoftDeletePayrollEmployee,
  dbSoftDeleteProvider,
  dbSoftDeleteReturn,
  dbSoftDeleteStockItem,
  dbSyncCollaboratorExpense,
  dbUpdateCompanySettings,
  dbUpdateExpense,
  dbUpdateInvestment,
  dbUpdateNoteStatus,
  dbUpdateOrderFull,
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
  getNextCompanyCode,
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
  OrderFinanceUpdatePayload,
  OrderUpsertPayload,
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
  resolveMonthPaymentDate,
  roundCurrencyBRL,
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

function mergeSyncedExpenses(
  current: ExpenseRecord[] | undefined,
  syncResult: { upserted?: ExpenseRecord; removedIds: string[] }
): ExpenseRecord[] {
  const removedSet = new Set(syncResult.removedIds || []);
  let list = (current || []).filter((d) => !removedSet.has(d.id));
  if (syncResult.upserted) {
    const up = syncResult.upserted;
    const exists = list.some((d) => d.id === up.id);
    list = exists ? list.map((d) => (d.id === up.id ? up : d)) : [up, ...list];
  }
  return list;
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
  const [editingOrder, setEditingOrder] = useState<DieOrder | null>(null);
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
  const hydrationSeqRef = useRef(0);
  const moveErrorTimerRef = useRef<number | null>(null);
  const printTimerRef = useRef<number | null>(null);

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
        if (!sessionRef.current?.isSuperAdmin) return;
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
      if (activeSession.role === 'cliente') {
        hydrationSeqRef.current += 1;
        setDb(createEmptyDb());
        setDbError(null);
        setDbLoading(false);
        return;
      }
      const targetEmpresaId = activeSession.empresaId || activeSession.company_id;
      const seq = ++hydrationSeqRef.current;
      setDbLoading(true);
      setDbError(null);
      try {
        const loaded = await loadCompanyDatabaseFromSupabase(
          targetEmpresaId,
          activeSession.role
        );
        if (seq !== hydrationSeqRef.current) return;
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
        if (seq !== hydrationSeqRef.current) return;
        setDbError(
          err?.message ||
            'Não foi possível carregar os dados da empresa no Supabase.'
        );
      } finally {
        if (seq === hydrationSeqRef.current) {
          setDbLoading(false);
        }
      }
    },
    [refreshSettingsAndBackups]
  );

  // Schedule debounced automatic snapshot after data changes (~15s idle, 1h server throttle)
  const scheduleAutoBackup = useCallback(() => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    if (settingsState.settings.backup_automatico === false) return;

    if (autoBackupTimerRef.current) {
      window.clearTimeout(autoBackupTimerRef.current);
    }
    autoBackupTimerRef.current = window.setTimeout(async () => {
      const latest = sessionRef.current;
      if (!latest || latest.role !== 'admin') return;
      const empresaId = latest.empresaId || latest.company_id;
      try {
        await invokeBackupEngine({
          action: 'snapshot_company',
          tipo: 'automatico',
          debounced: true,
        });
        if (sessionRef.current?.isSuperAdmin) {
          await refreshSettingsAndBackups(empresaId, true);
        }
      } catch {
        if (sessionRef.current?.isSuperAdmin) {
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
            restored.role === 'admin' ? 'bento_home' : 'esteira'
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
        hydrationSeqRef.current += 1;
        if (autoBackupTimerRef.current) {
          window.clearTimeout(autoBackupTimerRef.current);
        }
        if (toastTimerRef.current) {
          window.clearTimeout(toastTimerRef.current);
        }
        if (moveErrorTimerRef.current) {
          window.clearTimeout(moveErrorTimerRef.current);
        }
        if (printTimerRef.current) {
          window.clearTimeout(printTimerRef.current);
        }
        pendingOrderIdsRef.current.clear();
        setPendingOrderIds([]);
        setEditingOrder(null);
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
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (moveErrorTimerRef.current) {
        window.clearTimeout(moveErrorTimerRef.current);
      }
      if (printTimerRef.current) {
        window.clearTimeout(printTimerRef.current);
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
    const targetEmpresaId = session?.empresaId || session?.company_id;
    if (!targetEmpresaId || session?.role === 'cliente') return;

    const unsubscribe = subscribeToCompanyRealtime(
      targetEmpresaId,
      (remoteEvent) => {
        setDb((prev) => {
          const delUuids = new Set<string>(remoteEvent.deletedOrderUuids || []);
          if (remoteEvent.deletedOrderUuid) delUuids.add(remoteEvent.deletedOrderUuid);
          const delIds = new Set<string>(remoteEvent.deletedOrderIds || []);
          if (remoteEvent.deletedOrderId) delIds.add(remoteEvent.deletedOrderId);

          if (delUuids.size > 0 || delIds.size > 0) {
            const removedIds = new Set<string>(delIds);
            for (const o of prev.orders) {
              if (o.dbUuid && delUuids.has(o.dbUuid)) removedIds.add(o.id);
            }
            return {
              ...prev,
              orders: prev.orders.filter(
                (o) => !((o.dbUuid && delUuids.has(o.dbUuid)) || removedIds.has(o.id))
              ),
              deliveries: prev.deliveries.filter((d) => !removedIds.has(d.orderId)),
              returns: prev.returns.filter((r) => !removedIds.has(r.orderId)),
            };
          }
          if (remoteEvent.order) {
            const incoming = remoteEvent.order;
            if (pendingOrderIdsRef.current.has(incoming.id)) {
              return prev;
            }
            const existing = prev.orders.find((o) =>
              incoming.dbUuid && o.dbUuid ? o.dbUuid === incoming.dbUuid : o.id === incoming.id
            );
            if (existing && !isNewerOrder(incoming, existing)) {
              return prev;
            }
            const nextOrders = existing
              ? prev.orders.map((o) =>
                  (incoming.dbUuid && o.dbUuid ? o.dbUuid === incoming.dbUuid : o.id === incoming.id)
                    ? { ...o, ...incoming }
                    : o
                )
              : [incoming, ...prev.orders.filter((o) => o.id !== incoming.id)];
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
  }, [session?.empresaId, session?.company_id, session?.role]);

  const handleAuthenticated = async (newSession: AuthSession) => {
    setSession(newSession);
    setSelectedCompanyId(null);
    setActiveSection(newSession.role === 'admin' ? 'bento_home' : 'esteira');
    setSearchQuery('');
    await hydrateFromSupabase(newSession);
    showToast(
      newSession.role === 'operador'
        ? `Acesso de Produção liberado (${newSession.ownerName})`
        : 'Sessão iniciada com sucesso!'
    );
  };

  const handleLogout = useCallback(async () => {
    hydrationSeqRef.current += 1;
    if (autoBackupTimerRef.current) {
      window.clearTimeout(autoBackupTimerRef.current);
    }
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    if (moveErrorTimerRef.current) {
      window.clearTimeout(moveErrorTimerRef.current);
    }
    if (printTimerRef.current) {
      window.clearTimeout(printTimerRef.current);
    }
    pendingOrderIdsRef.current.clear();
    setPendingOrderIds([]);
    setMoveError(null);
    setToast(null);
    try {
      await signOutSupabase();
    } catch {
      // ignore signout error, clear client state only (remote data remains untouched!)
    }
    setSession(null);
    setDb(createEmptyDb());
    setSearchQuery('');
    setIsNewModalOpen(false);
    setEditingOrder(null);
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
  }, []);

  const handleSelectSection = useCallback(
    (target: ActiveSection) => {
      const currentSession = sessionRef.current;
      if (!currentSession || currentSession.role === 'cliente') {
        return;
      }
      if (target === 'configuracoes' && !currentSession.isSuperAdmin) {
        setActiveSection(
          currentSession.role === 'operador' ? 'esteira' : 'bento_home'
        );
        return;
      }
      if (
        currentSession.role === 'operador' &&
        !OPERATOR_ALLOWED_SECTIONS.includes(target)
      ) {
        setActiveSection('esteira');
        return;
      }
      setActiveSection(target);
    },
    []
  );

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
    () => computeFinancialBreakdown(db.orders),
    [db.orders]
  );

  const nextOrderId = useMemo(() => getNextOrderId(db), [db]);

  // CRUD Handlers — Direct Supabase Persistence (Soft Delete)
  const handleAddCompany = async (
    newCompData: Omit<Company, 'id'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    try {
      const newCode = getNextCompanyCode(dbRef.current.companies);
      const created = await dbCreateCompany(empresaId, newCode, newCompData);
      setDb((prev) => ({
        ...prev,
        companies: [created, ...prev.companies],
      }));
      setSelectedCompanyId(created.id);
      scheduleAutoBackup();
      showToast(`Empresa "${created.corporateName}" cadastrada!`);
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar empresa.', 'err');
      return false;
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const targetEmpresaId = active.empresaId || active.company_id;
    const snap = dbRef.current;
    const comp = snap.companies.find((c) => c.id === companyId);
    if (!comp?.dbUuid) return;
    try {
      const removedOrders = snap.orders.filter((o) => o.companyId === companyId);
      const removedOrderIds = new Set(removedOrders.map((o) => o.id));
      const returnUuids = snap.returns
        .filter((r) => removedOrderIds.has(r.orderId) && r.dbUuid)
        .map((r) => r.dbUuid!);
      const deliveryUuids = snap.deliveries
        .filter((d) => removedOrderIds.has(d.orderId) && d.dbUuid)
        .map((d) => d.dbUuid!);
      const orderUuids = removedOrders
        .filter((o) => o.dbUuid)
        .map((o) => o.dbUuid!);

      await Promise.all([
        dbBulkSoftDeleteReturns(targetEmpresaId, returnUuids),
        dbBulkSoftDeleteDeliveries(targetEmpresaId, deliveryUuids),
        dbBulkSoftDeleteOrders(targetEmpresaId, orderUuids),
      ]);
      await dbSoftDeleteCompany(targetEmpresaId, comp.dbUuid);

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
      setSelectedCompanyId((prev) => (prev === companyId ? null : prev));
      setPrefillDeliveryOrder((prev) =>
        prev && removedOrderIds.has(prev.id) ? null : prev
      );
      if (removedOrders.length > 0) {
        publishRealtimeUpdate({
          company_id: targetEmpresaId,
          section: 'esteira',
          actionLabel: '',
          actorName: active.ownerName,
          actorRole: active.role,
          deletedOrderUuids: orderUuids,
          deletedOrderIds: Array.from(removedOrderIds),
        });
      }
      scheduleAutoBackup();
      showToast(`Empresa "${comp.corporateName}" apagada!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover empresa.', 'err');
    }
  };

  const handleCreateOrderFull = async (
    payload: OrderUpsertPayload
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') {
      showToast('Apenas administradores podem cadastrar novas OS.', 'err');
      return false;
    }
    try {
      const stamp = nowTimestampBR();
      const snap = dbRef.current;
      let existingComp =
        payload.companyId && payload.companyId !== '__new__'
          ? snap.companies.find((c) => c.id === payload.companyId)
          : undefined;
      let newCompCreated: Company | null = null;

      if (!existingComp) {
        const compCode = getNextCompanyCode(snap.companies);
        newCompCreated = await dbCreateCompany(empresaId, compCode, {
          corporateName: payload.companyName,
          cnpj: 'Não informado',
          phone: payload.companyPhone,
          contactName: 'PCP / Compras',
        });
        existingComp = newCompCreated;
      }

      const createdOrder = await dbCreateOrder(empresaId, 'AUTO', {
        companyId: existingComp.id,
        companyUuid: existingComp.dbUuid,
        companyName: existingComp.corporateName,
        companyPhone: existingComp.phone || payload.companyPhone,
        toolDescription: payload.toolDescription,
        bladeMeters: payload.bladeMeters ?? null,
        woodMm: payload.woodMm ?? null,
        dueDate: payload.dueDate,
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
      setSelectedCompanyId((prev) => prev || existingComp!.id);
      publishRealtimeUpdate({
        company_id: empresaId,
        section: 'esteira',
        actionLabel: '',
        actorName: active.ownerName,
        actorRole: active.role,
        order: createdOrder,
      });
      const stageLabel =
        PRODUCTION_STAGES.find((s) => s.id === payload.stage)?.label ||
        payload.stage;
      scheduleAutoBackup();
      showToast(`${createdOrder.id} criada em "${stageLabel}"!`);
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao criar Ordem de Serviço.', 'err');
      return false;
    }
  };

  const handleUpdateOrderFull = async (
    orderId: string,
    payload: OrderUpsertPayload
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') {
      showToast('Apenas administradores podem editar OS.', 'err');
      return false;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const snap = dbRef.current;
    const existingOrder = snap.orders.find((o) => o.id === orderId);
    if (!existingOrder?.dbUuid) {
      showToast('Ordem de Serviço não localizada para edição.', 'err');
      return false;
    }

    try {
      const stamp = nowTimestampBR();
      let existingComp =
        payload.companyId && payload.companyId !== '__new__'
          ? snap.companies.find((c) => c.id === payload.companyId)
          : undefined;
      let newCompCreated: Company | null = null;

      if (!existingComp) {
        const compCode = getNextCompanyCode(snap.companies);
        newCompCreated = await dbCreateCompany(targetEmpresaId, compCode, {
          corporateName: payload.companyName,
          cnpj: 'Não informado',
          phone: payload.companyPhone,
          contactName: 'PCP / Compras',
        });
        existingComp = newCompCreated;
      }

      const stageChanged = existingOrder.stage !== payload.stage;
      const nextHistory = stageChanged
        ? [
            ...(existingOrder.stageHistory || []),
            { stage: payload.stage, timestamp: stamp },
          ]
        : existingOrder.stageHistory || [];

      const updatedOrder = await dbUpdateOrderFull(
        targetEmpresaId,
        existingOrder.dbUuid,
        {
          companyId: existingComp.id,
          companyUuid: existingComp.dbUuid,
          companyName: existingComp.corporateName,
          companyPhone: existingComp.phone || payload.companyPhone,
          toolDescription: payload.toolDescription,
          bladeMeters: payload.bladeMeters ?? null,
          woodMm: payload.woodMm ?? null,
          dueDate: payload.dueDate || existingOrder.dueDate,
          amount: payload.amount,
          paymentModality: payload.paymentModality,
          stage: payload.stage,
          stageChanged,
          stageUpdatedAt: stageChanged ? stamp : existingOrder.stageUpdatedAt,
          stageHistory: nextHistory,
          currentVersion: existingOrder.version,
        }
      );

      setDb((prev) => ({
        ...prev,
        companies: newCompCreated
          ? [newCompCreated, ...prev.companies]
          : prev.companies,
        orders: prev.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        deliveries: prev.deliveries.map((d) =>
          d.orderId === orderId
            ? {
                ...d,
                companyName: updatedOrder.companyName,
                toolDescription: updatedOrder.toolDescription,
              }
            : d
        ),
        returns: prev.returns.map((r) =>
          r.orderId === orderId
            ? {
                ...r,
                companyName: updatedOrder.companyName,
                toolDescription: updatedOrder.toolDescription,
              }
            : r
        ),
      }));
      setPrefillDeliveryOrder((prev) =>
        prev?.id === orderId ? updatedOrder : prev
      );
      publishRealtimeUpdate({
        company_id: targetEmpresaId,
        section: 'esteira',
        actionLabel: '',
        actorName: active.ownerName,
        actorRole: active.role,
        order: updatedOrder,
      });
      scheduleAutoBackup();
      showToast(`${updatedOrder.id} atualizada com sucesso!`);
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar Ordem de Serviço.', 'err');
      return false;
    }
  };

  // Seção 2 • Esteira Física de Produção (Optimistic single card + RPC mover_faca_v2)
  const handleMoveStage = useCallback(
    async (orderId: string, targetStage: ProductionStage) => {
      const active = sessionRef.current;
      if (!active || active.role === 'cliente') return;
      const currentOrder = dbRef.current.orders.find((o) => o.id === orderId);
      if (!currentOrder || currentOrder.stage === targetStage) return;
      if (!currentOrder.dbUuid) return;
      if (pendingOrderIdsRef.current.has(orderId)) return;

      const stamp = nowTimestampBR();
      const nowIso = new Date().toISOString();
      const previousStageState = {
        stage: currentOrder.stage,
        stageUpdatedAt: currentOrder.stageUpdatedAt,
        stageHistory: currentOrder.stageHistory,
        version: currentOrder.version,
        updatedAt: currentOrder.updatedAt,
      };
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
            o.id === orderId ? { ...o, ...authoritativeOrder } : o
          ),
        }));

        publishRealtimeUpdate({
          company_id: empresaId,
          section: 'esteira',
          actionLabel: '',
          actorName: active.ownerName,
          actorRole: active.role,
          order: authoritativeOrder,
        });
        scheduleAutoBackup();
      } catch (err: any) {
        pendingOrderIdsRef.current.delete(orderId);
        setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
        setDb((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...o, ...previousStageState } : o
          ),
        }));
        setMoveError(
          err?.message || `Não foi possível mover ${orderId}. Estado restaurado.`
        );
        if (moveErrorTimerRef.current) {
          window.clearTimeout(moveErrorTimerRef.current);
        }
        moveErrorTimerRef.current = window.setTimeout(
          () => setMoveError(null),
          4000
        );
      }
    },
    [empresaId, scheduleAutoBackup]
  );

  const handleTogglePaid = async (orderId: string) => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const order = dbRef.current.orders.find((o) => o.id === orderId);
    if (!order?.dbUuid) return;

    const today = toISODate();
    const isPaid = order.paymentStatus === 'pago';
    const nextStatus: PaymentStatus = isPaid ? 'nao_pago' : 'pago';
    const nextPaidAt = isPaid ? null : today;
    const nextVersion = (Number(order.version) || 1) + 1;

    try {
      const updatedOrder = await dbUpdateOrderPayment(empresaId, order.dbUuid, {
        status_pagamento: nextStatus,
        data_pagamento: nextPaidAt,
        version: nextVersion,
      });
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? updatedOrder : o
        ),
      }));
      publishRealtimeUpdate({
        company_id: empresaId,
        section: 'financeiro',
        actionLabel: '',
        actorName: active.ownerName,
        actorRole: active.role,
        order: updatedOrder,
      });
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const order = dbRef.current.orders.find((o) => o.id === orderId);
    if (!order?.dbUuid) return;

    const today = toISODate();
    const nextDue = addDays(today, 30);
    const nextVersion = (Number(order.version) || 1) + 1;

    try {
      const updatedOrder = await dbUpdateOrderPayment(empresaId, order.dbUuid, {
        status_pagamento: 'a_receber',
        data_vencimento: nextDue,
        version: nextVersion,
      });
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? updatedOrder : o
        ),
      }));
      publishRealtimeUpdate({
        company_id: empresaId,
        section: 'financeiro',
        actionLabel: '',
        actorName: active.ownerName,
        actorRole: active.role,
        order: updatedOrder,
      });
      scheduleAutoBackup();
      showToast(`Faturamento 30 dias gerado para ${orderId}!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao gerar faturamento.', 'err');
    }
  };

  const handleUpdateOrderFinance = async (
    orderId: string,
    payload: OrderFinanceUpdatePayload
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    const targetEmpresaId = active.empresaId || active.company_id;
    const order = dbRef.current.orders.find((o) => o.id === orderId);
    if (!order?.dbUuid) return false;

    const nextVersion = (Number(order.version) || 1) + 1;
    const nextPaidAt =
      payload.paymentStatus === 'pago'
        ? (payload.paidAt || toISODate()).slice(0, 10)
        : null;

    try {
      const updatedOrder = await dbUpdateOrderPayment(
        targetEmpresaId,
        order.dbUuid,
        {
          valor: payload.amount,
          forma_pagamento: payload.paymentModality,
          status_pagamento: payload.paymentStatus,
          data_vencimento: payload.dueDate,
          data_pagamento: nextPaidAt,
          observacao_financeira: payload.financialNotes ?? null,
          version: nextVersion,
        }
      );
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
      }));
      publishRealtimeUpdate({
        company_id: targetEmpresaId,
        section: 'financeiro',
        actionLabel: '',
        actorName: active.ownerName,
        actorRole: active.role,
        order: updatedOrder,
      });
      scheduleAutoBackup();
      showToast(`Dados financeiros da ${orderId} atualizados!`);
      return true;
    } catch (err: any) {
      showToast(
        err?.message || 'Erro ao atualizar dados financeiros da OS.',
        'err'
      );
      return false;
    }
  };

  const handleDeleteOrder = useCallback(
    async (orderId: string) => {
      const active = sessionRef.current;
      if (!active || active.role !== 'admin') return;
      if (pendingOrderIdsRef.current.has(orderId)) return;
      const targetEmpresaId = active.empresaId || active.company_id;
      const snap = dbRef.current;
      const target = snap.orders.find((o) => o.id === orderId);
      if (!target?.dbUuid) return;

      pendingOrderIdsRef.current.add(orderId);
      setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
      try {
        const deliveryUuids = snap.deliveries
          .filter((d) => d.orderId === orderId && d.dbUuid)
          .map((d) => d.dbUuid!);
        const returnUuids = snap.returns
          .filter((r) => r.orderId === orderId && r.dbUuid)
          .map((r) => r.dbUuid!);

        await Promise.all([
          dbBulkSoftDeleteDeliveries(targetEmpresaId, deliveryUuids),
          dbBulkSoftDeleteReturns(targetEmpresaId, returnUuids),
        ]);
        await dbSoftDeleteOrder(targetEmpresaId, target.dbUuid);
        setDb((prev) => ({
          ...prev,
          orders: prev.orders.filter((o) => o.id !== orderId),
          deliveries: prev.deliveries.filter((d) => d.orderId !== orderId),
          returns: prev.returns.filter((r) => r.orderId !== orderId),
        }));
        setPrefillDeliveryOrder((prev) => (prev?.id === orderId ? null : prev));
        publishRealtimeUpdate({
          company_id: targetEmpresaId,
          section: 'esteira',
          actionLabel: '',
          actorName: active.ownerName,
          actorRole: active.role,
          deletedOrderUuid: target.dbUuid,
          deletedOrderId: target.id,
        });
        scheduleAutoBackup();
        showToast(`Ordem ${orderId} removida com sucesso!`);
      } catch (err: any) {
        showToast(err?.message || 'Erro ao apagar OS.', 'err');
      } finally {
        pendingOrderIdsRef.current.delete(orderId);
        setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
      }
    },
    [scheduleAutoBackup, showToast]
  );

  const handleQuickRegisterDelivery = useCallback(
    (order: DieOrder) => {
      setPrefillDeliveryOrder(order);
      handleSelectSection('entregas');
    },
    [handleSelectSection]
  );

  // Seção 4 • Entregas
  const handleAddDelivery = async (
    deliveryData: Omit<DeliveryRecord, 'id'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return false;
    try {
      const snap = dbRef.current;
      const code = getNextDeliveryId(snap);
      const ord = snap.orders.find((o) => o.id === deliveryData.orderId);
      const created = await dbCreateDelivery(
        empresaId,
        code,
        deliveryData,
        ord?.dbUuid
      );

      setDb((prev) => ({
        ...prev,
        deliveries: [created, ...prev.deliveries],
      }));

      let stageWarning: string | null = null;
      if (ord?.dbUuid && ord.stage !== 'faca_pronta') {
        const stamp = nowTimestampBR();
        try {
          const rpcRes = await dbMoveOrderStage(ord.dbUuid, 'faca_pronta', stamp);
          const updatedOrder: DieOrder = {
            ...ord,
            stage: 'faca_pronta',
            stageUpdatedAt: stamp,
            stageHistory: [
              ...(ord.stageHistory || []),
              { stage: 'faca_pronta', timestamp: stamp },
            ],
            version: rpcRes.version ?? (Number(ord.version) || 1) + 1,
            updatedAt: rpcRes.updatedAt ?? new Date().toISOString(),
          };
          setDb((prev) => ({
            ...prev,
            orders: prev.orders.map((o) =>
              o.id === deliveryData.orderId ? { ...o, ...updatedOrder } : o
            ),
          }));
          publishRealtimeUpdate({
            company_id: empresaId,
            section: 'esteira',
            actionLabel: '',
            actorName: active.ownerName,
            actorRole: active.role,
            order: updatedOrder,
          });
        } catch (moveErr: any) {
          stageWarning = moveErr?.message || 'não foi possível atualizar etapa na esteira';
        }
      }

      scheduleAutoBackup();
      if (stageWarning) {
        showToast(
          `Saída logística registrada, porém: ${stageWarning}.`,
          'err'
        );
      } else {
        showToast(`Saída logística da ${deliveryData.orderId} registrada!`);
      }
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao registrar entrega.', 'err');
      return false;
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
    const del = dbRef.current.deliveries.find((d) => d.id === deliveryId);
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
  const handleAddReturn = async (
    retData: Omit<WarrantyReturnRecord, 'id'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return false;
    try {
      const snap = dbRef.current;
      const code = getNextReturnId(snap);
      const ord = snap.orders.find((o) => o.id === retData.orderId);
      const created = await dbCreateReturn(empresaId, code, retData, ord?.dbUuid);
      setDb((prev) => ({
        ...prev,
        returns: [created, ...prev.returns],
      }));
      scheduleAutoBackup();
      showToast(`Retorno de garantia (${retData.orderId}) registrado!`);
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao registrar retorno.', 'err');
      return false;
    }
  };

  const handleUpdateReturnStatus = async (id: string, nextStatus: ReturnStatus) => {
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
    const target = dbRef.current.returns.find((r) => r.id === id);
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
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
    const target = dbRef.current.returns.find((r) => r.id === returnId);
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    try {
      const code = getNextStockId(dbRef.current);
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const target = (dbRef.current.stock || []).find((item) => item.id === id);
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const target = (dbRef.current.stock || []).find((item) => item.id === id);
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
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
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
          active.ownerName
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
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
    try {
      const { updatedItem, movement } = await dbRegisterStockMovement(
        empresaId,
        item,
        -Math.abs(quantity),
        active.ownerName,
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    try {
      const { updatedItem, movement } = await dbRegisterStockMovement(
        empresaId,
        item,
        Math.abs(quantity),
        active.ownerName,
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

  const syncCollaboratorFromExpenseChange = async (
    targetEmpresaId: string,
    expense: ExpenseRecord,
    isUnpaidOrRemoved: boolean
  ) => {
    if (!expense.origem_tipo || !expense.origem_id) return;
    const expComp = (
      expense.competencia_referencia ||
      expense.data_competencia ||
      ''
    ).slice(0, 7);
    const currentComp = toISODate().slice(0, 7);

    if (expense.origem_tipo === 'prestador') {
      const prov = (dbRef.current.serviceProviders || []).find(
        (p) => p.dbUuid === expense.origem_id
      );
      if (!prov?.dbUuid) return;
      const provComp = (prov.dueDate || '').slice(0, 7);
      const matchesActive = provComp === expComp || expComp === currentComp;
      if (!matchesActive) return;

      if (isUnpaidOrRemoved && prov.status === 'pago') {
        const updatedProv = await dbUpdateProvider(targetEmpresaId, prov.dbUuid, {
          name: prov.name,
          service: prov.service,
          amount: prov.amount,
          paymentModality: prov.paymentModality,
          dueDate: prov.dueDate,
          paymentDay: prov.paymentDay,
          status: 'pendente',
        });
        setDb((prev) => ({
          ...prev,
          serviceProviders: (prev.serviceProviders || []).map((p) =>
            p.id === prov.id ? updatedProv : p
          ),
        }));
      } else if (
        !isUnpaidOrRemoved &&
        (prov.status !== 'pago' ||
          roundCurrencyBRL(prov.amount) !== roundCurrencyBRL(expense.valor))
      ) {
        const syncedAmount = roundCurrencyBRL(expense.valor);
        const updatedProv = await dbUpdateProvider(targetEmpresaId, prov.dbUuid, {
          name: prov.name,
          service: prov.service,
          amount: syncedAmount > 0 ? syncedAmount : prov.amount,
          paymentModality: prov.paymentModality,
          dueDate: prov.dueDate,
          paymentDay: prov.paymentDay,
          status: 'pago',
        });
        setDb((prev) => ({
          ...prev,
          serviceProviders: (prev.serviceProviders || []).map((p) =>
            p.id === prov.id ? updatedProv : p
          ),
        }));
      }
      return;
    }

    if (expense.origem_tipo === 'funcionario') {
      const emp = (dbRef.current.payrollEmployees || []).find(
        (e) => e.dbUuid === expense.origem_id
      );
      if (!emp?.dbUuid) return;

      if (
        isUnpaidOrRemoved &&
        emp.paymentStatus === 'pago' &&
        (!emp.paidCompetence ||
          emp.paidCompetence.slice(0, 7) === expComp ||
          expComp === currentComp)
      ) {
        const updatedEmp = await dbUpdatePayrollEmployee(
          targetEmpresaId,
          emp.dbUuid,
          {
            name: emp.name,
            roleTitle: emp.roleTitle,
            salary: emp.salary,
            admissionDate: emp.admissionDate,
            paymentDay: emp.paymentDay,
            paymentModality: emp.paymentModality,
            paymentStatus: 'pendente',
            paidAt: undefined,
            paidCompetence: undefined,
          }
        );
        setDb((prev) => ({
          ...prev,
          payrollEmployees: (prev.payrollEmployees || []).map((e) =>
            e.id === emp.id ? updatedEmp : e
          ),
        }));
      } else if (
        !isUnpaidOrRemoved &&
        expComp === currentComp &&
        (emp.paymentStatus !== 'pago' ||
          (emp.paidCompetence || '').slice(0, 7) !== expComp)
      ) {
        const updatedEmp = await dbUpdatePayrollEmployee(
          targetEmpresaId,
          emp.dbUuid,
          {
            name: emp.name,
            roleTitle: emp.roleTitle,
            salary: emp.salary,
            admissionDate: emp.admissionDate,
            paymentDay: emp.paymentDay,
            paymentModality: emp.paymentModality,
            paymentStatus: 'pago',
            paidAt: expense.data_pagamento || toISODate(),
            paidCompetence: expComp,
          }
        );
        setDb((prev) => ({
          ...prev,
          payrollEmployees: (prev.payrollEmployees || []).map((e) =>
            e.id === emp.id ? updatedEmp : e
          ),
        }));
      }
    }
  };

  // Finanças -> Despesas (Seção 3 - CRUD completo com Soft Delete + RBAC Admin)
  const handleCreateExpense = async (
    payload: ExpenseDraftPayload
  ): Promise<ExpenseRecord> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') {
      throw new Error('Apenas administradores podem cadastrar despesas.');
    }
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') {
      throw new Error('Apenas administradores podem editar despesas.');
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const updated = await dbUpdateExpense(targetEmpresaId, id, payload);
    setDb((prev) => ({
      ...prev,
      despesas: (prev.despesas || []).map((d) => (d.id === id ? updated : d)),
    }));
    if (updated.origem_tipo && updated.origem_id) {
      await syncCollaboratorFromExpenseChange(
        targetEmpresaId,
        updated,
        updated.status !== 'pago'
      );
    }
    scheduleAutoBackup();
    showToast('Despesa atualizada!');
    return updated;
  };

  const handleDeleteExpense = async (id: string): Promise<void> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') {
      throw new Error('Apenas administradores podem excluir despesas.');
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const existingExpense = (dbRef.current.despesas || []).find(
      (d) => d.id === id
    );
    await dbSoftDeleteExpense(targetEmpresaId, id);
    setDb((prev) => ({
      ...prev,
      despesas: (prev.despesas || []).filter((d) => d.id !== id),
    }));
    if (existingExpense?.origem_tipo && existingExpense?.origem_id) {
      await syncCollaboratorFromExpenseChange(
        targetEmpresaId,
        existingExpense,
        true
      );
    }
    scheduleAutoBackup();
    showToast('Despesa removida!');
  };

  // Finanças -> Prestadores, Folha, Investimentos (com sincronização bidirecional em Despesas)
  const handleAddProvider = async (
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    if (payload.status === 'pago' && (Number(payload.amount) || 0) <= 0) {
      showToast(
        'Informe um valor maior que R$ 0,00 antes de marcar o prestador como Pago.',
        'err'
      );
      return false;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    try {
      const code = getNextProviderId(dbRef.current);
      const created = await dbCreateProvider(targetEmpresaId, code, payload);
      const competence = (created.dueDate || toISODate()).slice(0, 7);
      const day =
        created.paymentDay || Number((created.dueDate || '').slice(8, 10)) || 5;
      const dataVencimento = resolveMonthPaymentDate(competence, day);
      const syncRes = created.dbUuid
        ? await dbSyncCollaboratorExpense(targetEmpresaId, {
            origemTipo: 'prestador',
            origemId: created.dbUuid,
            competencia: competence,
            isPaid: created.status === 'pago',
            nome: created.name,
            subtitulo: created.service,
            valor: created.amount,
            formaPagamento: created.paymentModality || 'pix',
            dataVencimento,
            dataPagamento: created.status === 'pago' ? toISODate() : undefined,
          })
        : { removedIds: [] };

      setDb((prev) => ({
        ...prev,
        serviceProviders: [created, ...(prev.serviceProviders || [])],
        despesas: mergeSyncedExpenses(prev.despesas, syncRes),
      }));
      scheduleAutoBackup();
      showToast(
        created.status === 'pago'
          ? `Prestador "${created.name}" cadastrado e lançado nas Despesas!`
          : `Prestador "${created.name}" cadastrado!`
      );
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar prestador.', 'err');
      return false;
    }
  };

  const handleUpdateProvider = async (
    id: string,
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    if (payload.status === 'pago' && (Number(payload.amount) || 0) <= 0) {
      showToast(
        'Informe um valor maior que R$ 0,00 antes de marcar o prestador como Pago.',
        'err'
      );
      return false;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const target = (dbRef.current.serviceProviders || []).find((p) => p.id === id);
    if (!target?.dbUuid) return false;
    try {
      const updated = await dbUpdateProvider(targetEmpresaId, target.dbUuid, payload);
      const competence = (updated.dueDate || toISODate()).slice(0, 7);
      const day =
        updated.paymentDay || Number((updated.dueDate || '').slice(8, 10)) || 5;
      const dataVencimento = resolveMonthPaymentDate(competence, day);
      const syncRes = await dbSyncCollaboratorExpense(targetEmpresaId, {
        origemTipo: 'prestador',
        origemId: target.dbUuid,
        competencia: competence,
        isPaid: updated.status === 'pago',
        nome: updated.name,
        subtitulo: updated.service,
        valor: updated.amount,
        formaPagamento: updated.paymentModality || 'pix',
        dataVencimento,
        dataPagamento: updated.status === 'pago' ? toISODate() : undefined,
      });

      setDb((prev) => ({
        ...prev,
        serviceProviders: (prev.serviceProviders || []).map((p) =>
          p.id === id ? updated : p
        ),
        despesas: mergeSyncedExpenses(prev.despesas, syncRes),
      }));
      scheduleAutoBackup();
      showToast('Prestador atualizado!');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar prestador.', 'err');
      return false;
    }
  };

  const handleDeleteProvider = async (id: string) => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const targetEmpresaId = active.empresaId || active.company_id;
    const target = (dbRef.current.serviceProviders || []).find((p) => p.id === id);
    if (!target?.dbUuid) return;
    try {
      const removedExpenseIds = await dbSoftDeleteCollaboratorLinkedExpenses(
        targetEmpresaId,
        'prestador',
        target.dbUuid
      );
      await dbSoftDeleteProvider(targetEmpresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        serviceProviders: (prev.serviceProviders || []).filter((p) => p.id !== id),
        despesas: mergeSyncedExpenses(prev.despesas, {
          removedIds: removedExpenseIds,
        }),
      }));
      scheduleAutoBackup();
      showToast('Prestador removido!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover prestador.', 'err');
    }
  };

  const handleAddPayrollEmployee = async (
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    if (payload.paymentStatus === 'pago' && (Number(payload.salary) || 0) <= 0) {
      showToast(
        'Informe um salário maior que R$ 0,00 antes de marcar como Pago.',
        'err'
      );
      return false;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    try {
      const code = getNextPayrollEmployeeId(dbRef.current);
      const created = await dbCreatePayrollEmployee(targetEmpresaId, code, payload);
      const competence = (
        created.paidCompetence ||
        payload.paidCompetence ||
        toISODate().slice(0, 7)
      ).slice(0, 7);
      const dataVencimento = resolveMonthPaymentDate(
        competence,
        created.paymentDay || 5
      );
      const syncRes = created.dbUuid
        ? await dbSyncCollaboratorExpense(targetEmpresaId, {
            origemTipo: 'funcionario',
            origemId: created.dbUuid,
            competencia: competence,
            isPaid: created.paymentStatus === 'pago',
            nome: created.name,
            subtitulo: created.roleTitle,
            valor: created.salary,
            formaPagamento: created.paymentModality || 'pix',
            dataVencimento,
            dataPagamento: created.paidAt || toISODate(),
          })
        : { removedIds: [] };

      setDb((prev) => ({
        ...prev,
        payrollEmployees: [created, ...(prev.payrollEmployees || [])],
        despesas: mergeSyncedExpenses(prev.despesas, syncRes),
      }));
      scheduleAutoBackup();
      showToast(
        created.paymentStatus === 'pago'
          ? `Funcionário "${created.name}" cadastrado e salário lançado nas Despesas!`
          : `Funcionário "${created.name}" cadastrado!`
      );
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar funcionário.', 'err');
      return false;
    }
  };

  const handleUpdatePayrollEmployee = async (
    id: string,
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    if (payload.paymentStatus === 'pago' && (Number(payload.salary) || 0) <= 0) {
      showToast(
        'Informe um salário maior que R$ 0,00 antes de marcar como Pago.',
        'err'
      );
      return false;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const target = (dbRef.current.payrollEmployees || []).find((e) => e.id === id);
    if (!target?.dbUuid) return false;
    try {
      const updated = await dbUpdatePayrollEmployee(
        targetEmpresaId,
        target.dbUuid,
        payload
      );
      const competence = (
        payload.paidCompetence ||
        updated.paidCompetence ||
        target.paidCompetence ||
        toISODate().slice(0, 7)
      ).slice(0, 7);
      const dataVencimento = resolveMonthPaymentDate(
        competence,
        updated.paymentDay || 5
      );
      const syncRes = await dbSyncCollaboratorExpense(targetEmpresaId, {
        origemTipo: 'funcionario',
        origemId: target.dbUuid,
        competencia: competence,
        isPaid: updated.paymentStatus === 'pago',
        nome: updated.name,
        subtitulo: updated.roleTitle,
        valor: updated.salary,
        formaPagamento: updated.paymentModality || 'pix',
        dataVencimento,
        dataPagamento: updated.paidAt || toISODate(),
      });

      setDb((prev) => ({
        ...prev,
        payrollEmployees: (prev.payrollEmployees || []).map((e) =>
          e.id === id ? updated : e
        ),
        despesas: mergeSyncedExpenses(prev.despesas, syncRes),
      }));
      scheduleAutoBackup();
      showToast('Funcionário atualizado!');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar funcionário.', 'err');
      return false;
    }
  };

  const handleDeletePayrollEmployee = async (id: string) => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const targetEmpresaId = active.empresaId || active.company_id;
    const target = (dbRef.current.payrollEmployees || []).find((e) => e.id === id);
    if (!target?.dbUuid) return;
    try {
      const removedExpenseIds = await dbSoftDeleteCollaboratorLinkedExpenses(
        targetEmpresaId,
        'funcionario',
        target.dbUuid
      );
      await dbSoftDeletePayrollEmployee(targetEmpresaId, target.dbUuid);
      setDb((prev) => ({
        ...prev,
        payrollEmployees: (prev.payrollEmployees || []).filter(
          (e) => e.id !== id
        ),
        despesas: mergeSyncedExpenses(prev.despesas, {
          removedIds: removedExpenseIds,
        }),
      }));
      scheduleAutoBackup();
      showToast('Funcionário removido!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao remover funcionário.', 'err');
    }
  };

  const handleToggleProviderPayment = async (
    provider: ServiceProviderRecord,
    targetStatus: 'pago' | 'pendente',
    competenceMonth: string
  ): Promise<void> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin' || !provider.dbUuid) return;
    const isPaid = targetStatus === 'pago';
    if (isPaid && (Number(provider.amount) || 0) <= 0) {
      showToast(
        'Informe um valor maior que R$ 0,00 antes de marcar como Pago.',
        'err'
      );
      return;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const cleanComp = (competenceMonth || toISODate().slice(0, 7)).slice(0, 7);
    const day =
      provider.paymentDay || Number((provider.dueDate || '').slice(8, 10)) || 5;
    const dataVencimento = resolveMonthPaymentDate(cleanComp, day);
    const today = toISODate();

    try {
      const syncRes = await dbSyncCollaboratorExpense(targetEmpresaId, {
        origemTipo: 'prestador',
        origemId: provider.dbUuid,
        competencia: cleanComp,
        isPaid,
        nome: provider.name,
        subtitulo: provider.service,
        valor: provider.amount,
        formaPagamento: provider.paymentModality || 'pix',
        dataVencimento,
        dataPagamento: isPaid ? today : undefined,
      });

      const updated = await dbUpdateProvider(targetEmpresaId, provider.dbUuid, {
        name: provider.name,
        service: provider.service,
        amount: provider.amount,
        paymentModality: provider.paymentModality || 'pix',
        dueDate: dataVencimento,
        paymentDay: day,
        status: targetStatus,
      });

      setDb((prev) => ({
        ...prev,
        serviceProviders: (prev.serviceProviders || []).map((p) =>
          p.id === provider.id ? updated : p
        ),
        despesas: mergeSyncedExpenses(prev.despesas, syncRes),
      }));
      scheduleAutoBackup();
      showToast(
        isPaid
          ? `Pagamento de "${provider.name}" (${cleanComp}) lançado nas Despesas!`
          : `Pagamento de "${provider.name}" (${cleanComp}) estornado para Pendente.`
      );
    } catch (err: any) {
      showToast(
        err?.message || 'Erro ao atualizar status de pagamento do prestador.',
        'err'
      );
    }
  };

  const handleTogglePayrollPayment = async (
    employee: PayrollEmployeeRecord,
    targetStatus: 'pago' | 'pendente',
    competenceMonth: string
  ): Promise<void> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin' || !employee.dbUuid) return;
    const isPaid = targetStatus === 'pago';
    if (isPaid && (Number(employee.salary) || 0) <= 0) {
      showToast(
        'Informe um salário maior que R$ 0,00 antes de marcar como Pago.',
        'err'
      );
      return;
    }
    const targetEmpresaId = active.empresaId || active.company_id;
    const cleanComp = (competenceMonth || toISODate().slice(0, 7)).slice(0, 7);
    const day = employee.paymentDay || 5;
    const dataVencimento = resolveMonthPaymentDate(cleanComp, day);
    const today = toISODate();

    try {
      const syncRes = await dbSyncCollaboratorExpense(targetEmpresaId, {
        origemTipo: 'funcionario',
        origemId: employee.dbUuid,
        competencia: cleanComp,
        isPaid,
        nome: employee.name,
        subtitulo: employee.roleTitle,
        valor: employee.salary,
        formaPagamento: employee.paymentModality || 'pix',
        dataVencimento,
        dataPagamento: isPaid ? today : undefined,
      });

      const updated = await dbUpdatePayrollEmployee(
        targetEmpresaId,
        employee.dbUuid,
        {
          name: employee.name,
          roleTitle: employee.roleTitle,
          salary: employee.salary,
          admissionDate: employee.admissionDate,
          paymentDay: day,
          paymentModality: employee.paymentModality || 'pix',
          paymentStatus: targetStatus,
          paidAt: isPaid ? today : undefined,
          paidCompetence: isPaid ? cleanComp : undefined,
        }
      );

      setDb((prev) => ({
        ...prev,
        payrollEmployees: (prev.payrollEmployees || []).map((e) =>
          e.id === employee.id ? updated : e
        ),
        despesas: mergeSyncedExpenses(prev.despesas, syncRes),
      }));
      scheduleAutoBackup();
      showToast(
        isPaid
          ? `Salário de "${employee.name}" (${cleanComp}) lançado nas Despesas!`
          : `Salário de "${employee.name}" (${cleanComp}) estornado para Pendente.`
      );
    } catch (err: any) {
      showToast(
        err?.message || 'Erro ao atualizar status de pagamento do funcionário.',
        'err'
      );
    }
  };

  const handleAddInvestment = async (
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    const targetEmpresaId = active.empresaId || active.company_id;
    try {
      const code = getNextInvestmentId(dbRef.current);
      const created = await dbCreateInvestment(targetEmpresaId, code, payload);
      setDb((prev) => ({
        ...prev,
        investments: [created, ...(prev.investments || [])],
      }));
      scheduleAutoBackup();
      showToast(`Investimento "${created.assetName}" adicionado!`);
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao adicionar investimento.', 'err');
      return false;
    }
  };

  const handleUpdateInvestment = async (
    id: string,
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ): Promise<boolean> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return false;
    const targetEmpresaId = active.empresaId || active.company_id;
    const target = (dbRef.current.investments || []).find((inv) => inv.id === id);
    if (!target?.dbUuid) return false;
    try {
      const updated = await dbUpdateInvestment(targetEmpresaId, target.dbUuid, payload);
      setDb((prev) => ({
        ...prev,
        investments: (prev.investments || []).map((inv) =>
          inv.id === id ? updated : inv
        ),
      }));
      scheduleAutoBackup();
      showToast('Investimento atualizado!');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar investimento.', 'err');
      return false;
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
    const targetEmpresaId = active.empresaId || active.company_id;
    const target = (dbRef.current.investments || []).find((inv) => inv.id === id);
    if (!target?.dbUuid) return;
    try {
      await dbSoftDeleteInvestment(targetEmpresaId, target.dbUuid);
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
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return null;
    try {
      const saved = await dbSaveNote(
        empresaId,
        active.ownerName,
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
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
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
    const active = sessionRef.current;
    if (!active || active.role === 'cliente') return;
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

  const handleTriggerPrint = useCallback(
    (note: NoteRecord, emitter: PedidoEmitterProfile) => {
      setPrintJob({ note, emitter });
      if (printTimerRef.current) {
        window.clearTimeout(printTimerRef.current);
      }
      printTimerRef.current = window.setTimeout(() => {
        window.print();
      }, 120);
    },
    []
  );

  // Equipe (Edge Function manage-team - sem service_role no frontend)
  const handleAddEmployee = async (payload: {
    ownerName: string;
    email: string;
    password: string;
    role: UserRole;
    jobTitle: string;
  }): Promise<{ error?: string }> => {
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') {
      return { error: 'Apenas administradores podem adicionar membros.' };
    }
    try {
      await invokeManageTeam({
        action: 'create_member',
        ...payload,
      });
      await hydrateFromSupabase(active);
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
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
    const active = sessionRef.current;
    if (!active || active.role !== 'admin') return;
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

  const unDismissedAlerts = useMemo(
    () => settingsState.logs.filter((l) => l.status === 'erro' && !l.alerta_dispensado),
    [settingsState.logs]
  );

  const counts = useMemo(
    () => ({
      companies: db.companies.length,
      inProduction: db.orders.filter((o) => o.stage !== 'faca_pronta').length,
      overdue: financials.overdueCount,
      deliveries: db.deliveries.length,
      openReturns: db.returns.filter((r) => r.status !== 'liberado').length,
      stock: (db.stock || []).length,
      notas: (db.notas || []).length,
      employees: (db.employees || []).length,
      backupAlerts: unDismissedAlerts.length,
    }),
    [
      db.companies.length,
      db.orders,
      financials.overdueCount,
      db.deliveries.length,
      db.returns,
      db.stock,
      db.notas,
      db.employees,
      unDismissedAlerts.length,
    ]
  );

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

  if (session.role === 'cliente') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-slate-800 relative">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="liquid-glass rounded-[28px] max-w-md w-full p-8 text-center space-y-4 relative z-10 shadow-xl">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900">
            Acesso Restrito ao Painel Interno
          </h2>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Seu usuário possui perfil <strong>Cliente</strong>. Solicite ao administrador da facaria a liberação para Operador ou Administrador caso precise acessar a esteira.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            Sair da conta
          </button>
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
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setIsNewModalOpen(true);
              }}
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
                  companies={db.companies}
                  orders={db.orders}
                  deliveries={db.deliveries}
                  returns={db.returns}
                  stock={db.stock || []}
                  financials={financials}
                  onNavigate={handleSelectSection}
                  onOpenNewOrder={() => {
                    setEditingOrder(null);
                    setIsNewModalOpen(true);
                  }}
                  onSelectCompany={(id) => setSelectedCompanyId(id)}
                />
              )}

              {session.role === 'admin' && effectiveSection === 'empresas' && (
                <CompaniesCrmSection
                  companies={filteredCompanies}
                  orders={db.orders}
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
                  userRole={session.role}
                  pendingOrderIds={pendingOrderIds}
                  moveError={moveError}
                  onMoveStage={handleMoveStage}
                  onEditOrder={(order) => {
                    setEditingOrder(order);
                    setIsNewModalOpen(true);
                  }}
                  onDeleteOrder={handleDeleteOrder}
                  onQuickRegisterDelivery={handleQuickRegisterDelivery}
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
                  onUpdateOrderFinance={handleUpdateOrderFinance}
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
                  onToggleProviderPayment={handleToggleProviderPayment}
                  onTogglePayrollPayment={handleTogglePayrollPayment}
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

              {effectiveSection === 'notas' && (
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
            onClick={() => {
              setEditingOrder(null);
              setIsNewModalOpen(true);
            }}
            className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20 min-h-[48px] inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white border border-white/40 shadow-2xl shadow-indigo-600/40 transition-all cursor-pointer"
          >
            <span>Nova OS</span>
          </button>
        )}

        {/* Fast Entry Modal */}
        {session.role === 'admin' && (
          <FastEntryModal
            isOpen={isNewModalOpen}
            onClose={() => {
              setIsNewModalOpen(false);
              setEditingOrder(null);
            }}
            companies={db.companies}
            nextOrderId={nextOrderId}
            editingOrder={editingOrder}
            onSaveOrder={handleCreateOrderFull}
            onUpdateOrder={handleUpdateOrderFull}
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
