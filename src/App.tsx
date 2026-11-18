import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthLoginScreen } from './components/AuthLoginScreen';
import { BentoOverviewSection } from './components/BentoOverviewSection';
import { CompaniesCrmSection } from './components/CompaniesCrmSection';
import { DeliveriesLogisticsSection } from './components/DeliveriesLogisticsSection';
import { FastEntryModal } from './components/FastEntryModal';
import { FinanceAnalyticsSection } from './components/FinanceAnalyticsSection';
import { HeaderBar, LiquidSidebar } from './components/HeaderBar';
import {
  CanhotoSlipCard,
  chunkNoteItems,
  NotesSection,
} from './components/NotesSection';
import { ProductionKanban } from './components/ProductionKanban';
import { StockSection } from './components/StockSection';
import { TeamManagementSection } from './components/TeamManagementSection';
import { WarrantyReturnsSection } from './components/WarrantyReturnsSection';
import {
  getActiveRealtimeChannelCount,
  isSupabaseCloudActive,
  moveOrderStageViaRpc,
  publishRealtimeUpdate,
  subscribeToCompanyRealtime,
} from './services/realtimeEngine';
import {
  clearActiveSession,
  deleteEmployeeFromCompany,
  getActiveSession,
  getCompanyEmployees,
  getNextDeliveryId,
  getNextInvestmentId,
  getNextNoteNumber,
  getNextOrderId,
  getNextPayrollEmployeeId,
  getNextProviderId,
  getNextReturnId,
  getNextStockId,
  loadEnterpriseDatabase,
  moveOrderStageOnServer,
  registerEmployeeForCompany,
  saveActiveSession,
  saveEnterpriseDatabase,
  saveEnterpriseDatabaseLocalOnly,
  updateEmployeeRoleInCompany,
} from './services/storageAdapter';
import {
  ActiveSection,
  AuthSession,
  Company,
  DeliveryRecord,
  DieOrder,
  EnterpriseDatabase,
  ExpenseCategoryKey,
  InvestmentRecord,
  NoteRecord,
  PaymentModality,
  PaymentStatus,
  PayrollEmployeeRecord,
  ProductionStage,
  ReturnStatus,
  ServiceProviderRecord,
  StockItem,
  TenantAccount,
  UserRole,
  WarrantyReturnRecord,
} from './types/order';
import {
  addDays,
  computeFinancialBreakdown,
  nowTimestampBR,
  PAYMENT_MODALITY_META,
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

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getActiveSession()
  );
  const [db, setDb] = useState<EnterpriseDatabase>(() => {
    const active = getActiveSession();
    return loadEnterpriseDatabase(active?.company_id || 'tenant_qualifacas');
  });
  const [employees, setEmployees] = useState<TenantAccount[]>(() => {
    const active = getActiveSession();
    return getCompanyEmployees(active?.company_id || 'tenant_qualifacas');
  });
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    const active = getActiveSession();
    return active?.role === 'operador' ? 'esteira' : 'bento_home';
  });
  const [realtimeStatus, setRealtimeStatus] = useState<
    'connected' | 'supabase_live' | 'reconnecting'
  >('connected');
  const [realtimeConfigTick, setRealtimeConfigTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    db.companies[0]?.id || null
  );
  const [prefillDeliveryOrder, setPrefillDeliveryOrder] =
    useState<DieOrder | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [printJob, setPrintJob] = useState<{
    note: NoteRecord;
    threePerPage: boolean;
  } | null>(null);
  const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);
  const pendingOrderIdsRef = useRef<Set<string>>(new Set());
  const [moveError, setMoveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
  } | null>(null);

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  const isNewerOrder = (incoming: DieOrder, local?: DieOrder): boolean => {
    if (!local) return true;
    const incVer = Number(incoming.version) || 0;
    const locVer = Number(local.version) || 0;
    if (incVer > locVer) return true;
    if (incVer < locVer) return false;
    return (incoming.updatedAt || '') > (local.updatedAt || '');
  };

  // Subscribe to Realtime updates for the logged-in company_id (Read-only state merge; never writes back)
  useEffect(() => {
    (window as any).__facasflowChannelCount = getActiveRealtimeChannelCount;
    if (!session?.company_id) return;

    const unsubscribe = subscribeToCompanyRealtime(
      session.company_id,
      (remoteEvent) => {
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
              ? prev.orders.map((o) =>
                  o.id === incoming.id ? { ...o, ...incoming } : o
                )
              : [incoming, ...prev.orders];
            nextDb = saveEnterpriseDatabaseLocalOnly({
              ...prev,
              orders: nextOrders,
            });
          } else if (remoteEvent.db) {
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
            nextDb = saveEnterpriseDatabaseLocalOnly({
              ...remoteEvent.db,
              company_id: session.company_id,
              orders: mergedOrders,
            });
          }
          return nextDb;
        });
        setEmployees(getCompanyEmployees(session.company_id));
      },
      (status) => {
        setRealtimeStatus(status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [session?.company_id, realtimeConfigTick]);

  const handleAuthenticated = (newSession: AuthSession) => {
    const tenantDb = loadEnterpriseDatabase(newSession.company_id);
    const companyEmps = getCompanyEmployees(newSession.company_id);
    setSession(newSession);
    setDb(tenantDb);
    setEmployees(companyEmps);
    setSelectedCompanyId(tenantDb.companies[0]?.id || null);
    setActiveSection(
      newSession.role === 'operador' ? 'esteira' : 'bento_home'
    );
    setSearchQuery('');
    showToast(
      newSession.role === 'operador'
        ? `Acesso de Produção liberado (${newSession.ownerName})`
        : 'Sessão iniciada com sucesso!'
    );
  };

  const handleLogout = () => {
    clearActiveSession();
    setSession(null);
    setSearchQuery('');
    setIsNewModalOpen(false);
  };

  const handleSelectSection = (target: ActiveSection) => {
    if (
      session?.role === 'operador' &&
      !OPERATOR_ALLOWED_SECTIONS.includes(target)
    ) {
      setActiveSection('esteira');
      return;
    }
    setActiveSection(target);
  };

  const commitDb = (
    nextDb: EnterpriseDatabase,
    realtimeMeta?: {
      section: 'esteira' | 'entregas' | 'retornos' | 'estoque' | 'notas' | 'financeiro' | 'equipe' | 'all';
      actionLabel: string;
    }
  ) => {
    const activeTenantId =
      session?.company_id || nextDb.company_id || 'tenant_qualifacas';
    const currentEmps = getCompanyEmployees(activeTenantId);
    const saved = saveEnterpriseDatabase({
      ...nextDb,
      company_id: activeTenantId,
      employees: currentEmps,
    });
    setDb(saved);
    setEmployees(currentEmps);

    if (realtimeMeta && session) {
      publishRealtimeUpdate({
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

  // Handlers
  const handleAddCompany = (newCompData: Omit<Company, 'id'>) => {
    let maxNum = 0;
    for (const c of db.companies) {
      const n = parseInt(c.id.replace(/\D/g, ''), 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
    const newId = `EMP-${String(maxNum + 1).padStart(2, '0')}`;
    const created: Company = {
      id: newId,
      company_id: session?.company_id,
      ...newCompData,
    };
    commitDb(
      {
        ...db,
        companies: [created, ...db.companies],
      },
      {
        section: 'all',
        actionLabel: `Empresa "${created.corporateName}" cadastrada`,
      }
    );
    setSelectedCompanyId(newId);
    showToast(`Empresa "${created.corporateName}" cadastrada!`);
  };

  const handleCreateOrderFull = (payload: {
    companyId: string;
    companyName: string;
    companyPhone: string;
    toolDescription: string;
    amount: number;
    paymentModality: PaymentModality;
    stage: ProductionStage;
  }) => {
    const today = toISODate();
    const stamp = nowTimestampBR();
    const days = PAYMENT_MODALITY_META[payload.paymentModality]?.defaultDays ?? 30;

    let payStatus: PaymentStatus = 'a_receber';
    if (payload.paymentModality === 'nao_pago') payStatus = 'nao_pago';
    else if (
      payload.paymentModality === 'pix' ||
      payload.paymentModality === 'dinheiro'
    ) {
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

    const newOrder: DieOrder = {
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
      dueDate: addDays(today, days),
      paidAt: payStatus === 'pago' ? today : undefined,
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    const stageLabel =
      PRODUCTION_STAGES.find((s) => s.id === payload.stage)?.label ||
      payload.stage;

    commitDb(
      {
        ...db,
        companies: updatedCompanies,
        orders: [newOrder, ...db.orders],
      },
      {
        section: 'esteira',
        actionLabel: `Nova ${newOrder.id} enviada para "${stageLabel}"`,
      }
    );
    if (!selectedCompanyId) {
      setSelectedCompanyId(payload.companyId);
    }

    showToast(`${newOrder.id} criada em "${stageLabel}"!`);
  };

  // Seção 2 • Esteira Física de Produção (Única função responsável por mover o card)
  const handleMoveStage = useCallback(
    async (orderId: string, targetStage: ProductionStage) => {
      if (!session) return;
      const currentOrder = db.orders.find((o) => o.id === orderId);
      if (!currentOrder || currentOrder.stage === targetStage) return;
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

      // 1. Marcar pendente e aplicar atualização otimista apenas neste card
      pendingOrderIdsRef.current.add(orderId);
      setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
      setMoveError(null);
      setDb((prev) =>
        saveEnterpriseDatabaseLocalOnly({
          ...prev,
          orders: prev.orders.map((o) => (o.id === orderId ? optimisticOrder : o)),
        })
      );

      try {
        let authoritativeOrder = optimisticOrder;

        // 2. Escrita única via RPC (Supabase) ou endpoint atômico (server.cjs)
        if (isSupabaseCloudActive()) {
          const rpcRow = await moveOrderStageViaRpc(orderId, targetStage, stamp);
          if (rpcRow) {
            authoritativeOrder = {
              ...optimisticOrder,
              version: rpcRow.version ?? optimisticOrder.version,
              updatedAt: rpcRow.updated_at ?? optimisticOrder.updatedAt,
            };
          }
        } else {
          const serverOrder = await moveOrderStageOnServer({
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
        setDb((prev) =>
          saveEnterpriseDatabaseLocalOnly({
            ...prev,
            orders: prev.orders.map((o) =>
              o.id === orderId ? authoritativeOrder : o
            ),
          })
        );

        // 4. Broadcast apenas do card movido (BroadcastChannel / Supabase Broadcast)
        publishRealtimeUpdate({
          company_id: session.company_id,
          section: 'esteira',
          actionLabel: '',
          actorName: session.ownerName,
          actorRole: session.role,
          order: authoritativeOrder,
        });
      } catch {
        // Reverter apenas este card e exibir erro discreto (sem toast de tempo real)
        pendingOrderIdsRef.current.delete(orderId);
        setPendingOrderIds(Array.from(pendingOrderIdsRef.current));
        setDb((prev) =>
          saveEnterpriseDatabaseLocalOnly({
            ...prev,
            orders: prev.orders.map((o) =>
              o.id === orderId ? previousOrder : o
            ),
          })
        );
        setMoveError(`Não foi possível mover ${orderId}. Estado restaurado.`);
        setTimeout(() => setMoveError(null), 4000);
      }
    },
    [db.orders, session]
  );

  const handleTogglePaid = (orderId: string) => {
    const today = toISODate();
    const nextOrders = db.orders.map((o) => {
      if (o.id !== orderId) return o;
      const isPaid = o.paymentStatus === 'pago';
      return {
        ...o,
        paymentStatus: (isPaid ? 'a_receber' : 'pago') as PaymentStatus,
        paidAt: isPaid ? undefined : today,
      };
    });
    commitDb(
      { ...db, orders: nextOrders },
      {
        section: 'all',
        actionLabel: `Status financeiro de ${orderId} atualizado`,
      }
    );
    showToast(`Status financeiro de ${orderId} atualizado!`);
  };

  const handleEmitBilling30d = (orderId: string) => {
    const today = toISODate();
    const nextOrders = db.orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        paymentStatus: 'a_receber' as PaymentStatus,
        dueDate: addDays(today, 30),
      };
    });
    commitDb(
      { ...db, orders: nextOrders },
      {
        section: 'all',
        actionLabel: `Faturamento 30 dias gerado para ${orderId}`,
      }
    );
    showToast(`Faturamento 30 dias gerado para ${orderId}!`);
  };

  // Seção 4 • Entregas e Logísticas de Saída (Realtime Broadcast)
  const handleAddDelivery = (deliveryData: Omit<DeliveryRecord, 'id'>) => {
    const newDel: DeliveryRecord = {
      id: getNextDeliveryId(db),
      company_id: session?.company_id,
      ...deliveryData,
    };
    const stamp = nowTimestampBR();
    const nextOrders = db.orders.map((o) =>
      o.id === deliveryData.orderId
        ? { ...o, stage: 'faca_pronta' as ProductionStage, stageUpdatedAt: stamp }
        : o
    );
    commitDb(
      {
        ...db,
        orders: nextOrders,
        deliveries: [newDel, ...db.deliveries],
      },
      {
        section: 'entregas',
        actionLabel: `Saída logística da ${deliveryData.orderId} registrada na Seção 4`,
      }
    );
    showToast(`Saída logística da ${deliveryData.orderId} registrada!`);
  };

  // Seção 5 • Retornos e Ajustes (Realtime Broadcast)
  const handleAddReturn = (retData: Omit<WarrantyReturnRecord, 'id'>) => {
    const newRet: WarrantyReturnRecord = {
      id: getNextReturnId(db),
      company_id: session?.company_id,
      ...retData,
    };
    commitDb(
      {
        ...db,
        returns: [newRet, ...db.returns],
      },
      {
        section: 'retornos',
        actionLabel: `Retorno de garantia (${retData.orderId}) registrado na Seção 5`,
      }
    );
    showToast(`Retorno de garantia (${retData.orderId}) registrado!`);
  };

  const handleUpdateReturnStatus = (id: string, nextStatus: ReturnStatus) => {
    const stamp = nowTimestampBR();
    const targetRet = db.returns.find((r) => r.id === id);
    const nextReturns = db.returns.map((r) =>
      r.id === id ? { ...r, status: nextStatus, updatedAt: stamp } : r
    );
    commitDb(
      { ...db, returns: nextReturns },
      {
        section: 'retornos',
        actionLabel: `Status do retorno ${targetRet?.orderId || id} alterado para "${nextStatus}" na Seção 5`,
      }
    );
    showToast(`Status do retorno atualizado (${stamp})!`);
  };

  const handleDeleteCompany = (companyId: string) => {
    const comp = db.companies.find((c) => c.id === companyId);
    const removedOrderIds = new Set(
      db.orders.filter((o) => o.companyId === companyId).map((o) => o.id)
    );
    const nextCompanies = db.companies.filter((c) => c.id !== companyId);
    const nextOrders = db.orders.filter((o) => o.companyId !== companyId);
    const nextDeliveries = db.deliveries.filter(
      (d) => !removedOrderIds.has(d.orderId)
    );
    const nextReturns = db.returns.filter(
      (r) => !removedOrderIds.has(r.orderId)
    );

    commitDb(
      {
        ...db,
        companies: nextCompanies,
        orders: nextOrders,
        deliveries: nextDeliveries,
        returns: nextReturns,
      },
      {
        section: 'all',
        actionLabel: `Empresa "${comp?.corporateName || companyId}" removida`,
      }
    );

    if (selectedCompanyId === companyId) {
      setSelectedCompanyId(nextCompanies[0]?.id || null);
    }
    showToast(`Empresa "${comp?.corporateName || companyId}" apagada!`);
  };

  const handleDeleteOrder = (orderId: string) => {
    const nextOrders = db.orders.filter((o) => o.id !== orderId);
    const nextDeliveries = db.deliveries.filter((d) => d.orderId !== orderId);
    const nextReturns = db.returns.filter((r) => r.orderId !== orderId);
    commitDb(
      {
        ...db,
        orders: nextOrders,
        deliveries: nextDeliveries,
        returns: nextReturns,
      },
      {
        section: 'esteira',
        actionLabel: `Ordem ${orderId} apagada`,
      }
    );
    showToast(`Ordem ${orderId} apagada com sucesso!`);
  };

  const handleDeleteDelivery = (deliveryId: string) => {
    const nextDeliveries = db.deliveries.filter((d) => d.id !== deliveryId);
    commitDb(
      { ...db, deliveries: nextDeliveries },
      {
        section: 'entregas',
        actionLabel: `Registro de entrega ${deliveryId} apagado na Seção 4`,
      }
    );
    showToast(`Registro de entrega ${deliveryId} apagado!`);
  };

  const handleDeleteReturn = (returnId: string) => {
    const nextReturns = db.returns.filter((r) => r.id !== returnId);
    commitDb(
      { ...db, returns: nextReturns },
      {
        section: 'retornos',
        actionLabel: `Registro de retorno ${returnId} apagado na Seção 5`,
      }
    );
    showToast(`Registro de retorno ${returnId} apagado!`);
  };

  // Seção 6 • Estoque (Realtime Broadcast)
  const handleAddStockItem = (
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    const stamp = nowTimestampBR();
    const newItem: StockItem = {
      id: getNextStockId(db),
      company_id: session?.company_id,
      ...payload,
      updatedAt: stamp,
    };
    commitDb(
      {
        ...db,
        stock: [newItem, ...(db.stock || [])],
      },
      {
        section: 'estoque',
        actionLabel: `Item "${newItem.name}" adicionado ao Estoque`,
      }
    );
    showToast(`Item "${newItem.name}" (${newItem.id}) adicionado ao estoque!`);
  };

  const handleUpdateStockItem = (
    id: string,
    payload: Omit<StockItem, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    const stamp = nowTimestampBR();
    const nextStock = (db.stock || []).map((item) =>
      item.id === id
        ? {
            ...item,
            ...payload,
            updatedAt: stamp,
          }
        : item
    );
    commitDb(
      { ...db, stock: nextStock },
      {
        section: 'estoque',
        actionLabel: `Item ${id} (${payload.name}) atualizado no Estoque`,
      }
    );
    showToast(`Estoque atualizado (${payload.name})!`);
  };

  const handleDeleteStockItem = (id: string) => {
    const target = (db.stock || []).find((i) => i.id === id);
    const nextStock = (db.stock || []).filter((i) => i.id !== id);
    commitDb(
      { ...db, stock: nextStock },
      {
        section: 'estoque',
        actionLabel: `Item "${target?.name || id}" removido do Estoque`,
      }
    );
    showToast(`Item ${id} removido do estoque!`);
  };

  // Finanças: Despesas, Prestadores, Funcionários e Investimentos (Admin Only)
  const handleUpsertMonthExpenses = (
    month: string,
    values: Record<ExpenseCategoryKey, number>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const current = db.expenses || [];
    const exists = current.some((e) => e.month === month);
    const nextExpenses = exists
      ? current.map((e) =>
          e.month === month ? { month, values, updatedAt: stamp } : e
        )
      : [{ month, values, updatedAt: stamp }, ...current];
    commitDb(
      { ...db, expenses: nextExpenses },
      { section: 'financeiro', actionLabel: `Despesas de ${month} atualizadas` }
    );
  };

  const handleAddProvider = (
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const newProv: ServiceProviderRecord = {
      id: getNextProviderId(db),
      company_id: session.company_id,
      ...payload,
      updatedAt: stamp,
    };
    commitDb(
      { ...db, serviceProviders: [newProv, ...(db.serviceProviders || [])] },
      { section: 'financeiro', actionLabel: `Prestador "${newProv.name}" adicionado` }
    );
    showToast(`Prestador "${newProv.name}" cadastrado!`);
  };

  const handleUpdateProvider = (
    id: string,
    payload: Omit<ServiceProviderRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const next = (db.serviceProviders || []).map((p) =>
      p.id === id ? { ...p, ...payload, updatedAt: stamp } : p
    );
    commitDb(
      { ...db, serviceProviders: next },
      { section: 'financeiro', actionLabel: `Prestador "${payload.name}" atualizado` }
    );
    showToast(`Prestador atualizado!`);
  };

  const handleDeleteProvider = (id: string) => {
    if (session?.role !== 'admin') return;
    const next = (db.serviceProviders || []).filter((p) => p.id !== id);
    commitDb(
      { ...db, serviceProviders: next },
      { section: 'financeiro', actionLabel: `Prestador ${id} removido` }
    );
    showToast(`Prestador removido!`);
  };

  const handleAddPayrollEmployee = (
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const newEmp: PayrollEmployeeRecord = {
      id: getNextPayrollEmployeeId(db),
      company_id: session.company_id,
      ...payload,
      updatedAt: stamp,
    };
    commitDb(
      { ...db, payrollEmployees: [newEmp, ...(db.payrollEmployees || [])] },
      { section: 'financeiro', actionLabel: `Funcionário "${newEmp.name}" cadastrado` }
    );
    showToast(`Funcionário "${newEmp.name}" cadastrado!`);
  };

  const handleUpdatePayrollEmployee = (
    id: string,
    payload: Omit<PayrollEmployeeRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const next = (db.payrollEmployees || []).map((e) =>
      e.id === id ? { ...e, ...payload, updatedAt: stamp } : e
    );
    commitDb(
      { ...db, payrollEmployees: next },
      { section: 'financeiro', actionLabel: `Funcionário "${payload.name}" atualizado` }
    );
    showToast(`Funcionário atualizado!`);
  };

  const handleDeletePayrollEmployee = (id: string) => {
    if (session?.role !== 'admin') return;
    const next = (db.payrollEmployees || []).filter((e) => e.id !== id);
    commitDb(
      { ...db, payrollEmployees: next },
      { section: 'financeiro', actionLabel: `Funcionário ${id} removido` }
    );
    showToast(`Funcionário removido!`);
  };

  const handleAddInvestment = (
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const newInv: InvestmentRecord = {
      id: getNextInvestmentId(db),
      company_id: session.company_id,
      ...payload,
      updatedAt: stamp,
    };
    commitDb(
      { ...db, investments: [newInv, ...(db.investments || [])] },
      { section: 'financeiro', actionLabel: `Investimento "${newInv.assetName}" cadastrado` }
    );
    showToast(`Investimento "${newInv.assetName}" adicionado!`);
  };

  const handleUpdateInvestment = (
    id: string,
    payload: Omit<InvestmentRecord, 'id' | 'company_id' | 'updatedAt'>
  ) => {
    if (session?.role !== 'admin') return;
    const stamp = nowTimestampBR();
    const next = (db.investments || []).map((inv) =>
      inv.id === id ? { ...inv, ...payload, updatedAt: stamp } : inv
    );
    commitDb(
      { ...db, investments: next },
      { section: 'financeiro', actionLabel: `Investimento "${payload.assetName}" atualizado` }
    );
    showToast(`Investimento atualizado!`);
  };

  const handleDeleteInvestment = (id: string) => {
    if (session?.role !== 'admin') return;
    const next = (db.investments || []).filter((inv) => inv.id !== id);
    commitDb(
      { ...db, investments: next },
      { section: 'financeiro', actionLabel: `Investimento ${id} removido` }
    );
    showToast(`Investimento removido!`);
  };

  // Seção Notas (Admin & Operador)
  const nextNoteNumber = useMemo(() => getNextNoteNumber(db), [db]);

  const handleSaveNote = (
    payload: Omit<NoteRecord, 'id' | 'company_id' | 'criadoPor' | 'criadoEm'>,
    editingId?: string
  ) => {
    if (!session || session.role === 'cliente') return;
    const stamp = new Date().toISOString();
    const currentNotas = db.notas || [];

    if (editingId) {
      const nextNotas = currentNotas.map((n) =>
        n.id === editingId
          ? {
              ...n,
              ...payload,
              numero: n.numero,
            }
          : n
      );
      commitDb(
        { ...db, notas: nextNotas },
        {
          section: 'notas',
          actionLabel: `Nota Nº ${String(payload.numero).padStart(4, '0')} atualizada`,
        }
      );
      showToast(`Nota Nº ${String(payload.numero).padStart(4, '0')} atualizada!`);
      return;
    }

    const assignedNumber = getNextNoteNumber(db);
    const newNote: NoteRecord = {
      id: `NF-${Date.now().toString().slice(-6)}`,
      company_id: session.company_id,
      ...payload,
      numero: assignedNumber,
      criadoPor: session.ownerName,
      criadoEm: stamp,
    };
    commitDb(
      {
        ...db,
        notas: [newNote, ...currentNotas],
        noteSequence: assignedNumber,
      },
      {
        section: 'notas',
        actionLabel: `Nota Nº ${String(assignedNumber).padStart(4, '0')} emitida`,
      }
    );
    showToast(`Nota Nº ${String(assignedNumber).padStart(4, '0')} emitida!`);
  };

  const handleMarkNotePrinted = (id: string) => {
    if (!session || session.role === 'cliente') return;
    const nextNotas = (db.notas || []).map((n) =>
      n.id === id ? { ...n, status: 'impressa' as const } : n
    );
    commitDb(
      { ...db, notas: nextNotas },
      { section: 'notas', actionLabel: `Nota impressa` }
    );
  };

  const handleDeleteNote = (id: string) => {
    if (!session || session.role === 'cliente') return;
    const nextNotas = (db.notas || []).filter((n) => n.id !== id);
    commitDb(
      { ...db, notas: nextNotas },
      { section: 'notas', actionLabel: `Nota removida` }
    );
    showToast(`Nota removida!`);
  };

  const handleTriggerPrint = (note: NoteRecord, threePerPage: boolean) => {
    setPrintJob({ note, threePerPage });
    setTimeout(() => {
      window.print();
    }, 120);
  };

  // Employee Management (Admin Only)
  const handleAddEmployee = (payload: {
    ownerName: string;
    email: string;
    password: string;
    role: UserRole;
    jobTitle: string;
  }): { error?: string } => {
    if (!session) return { error: 'Sessão inválida.' };
    const res = registerEmployeeForCompany({
      company_id: session.company_id,
      companyName: session.companyName,
      ...payload,
    });
    if (res.error || !res.employee) {
      return { error: res.error };
    }
    const updatedList = getCompanyEmployees(session.company_id);
    setEmployees(updatedList);
    commitDb(
      { ...db, employees: updatedList },
      {
        section: 'equipe',
        actionLabel: `Funcionário "${res.employee.ownerName}" (${
          res.employee.role === 'operador' ? 'Operador' : 'Admin'
        }) cadastrado`,
      }
    );
    showToast(`Funcionário "${res.employee.ownerName}" cadastrado com sucesso!`);
    return {};
  };

  const handleToggleEmployeeRole = (email: string, nextRole: UserRole) => {
    if (!session) return;
    const updatedList = updateEmployeeRoleInCompany(
      email,
      session.company_id,
      nextRole
    );
    setEmployees(updatedList);
    commitDb(
      { ...db, employees: updatedList },
      {
        section: 'equipe',
        actionLabel: `Permissão de ${email} alterada para ${
          nextRole === 'operador' ? 'Operador' : 'Administrador'
        }`,
      }
    );
    showToast(
      `Perfil de ${email} alterado para ${
        nextRole === 'operador' ? 'Operador (Seções 2, 4 e 5)' : 'Administrador'
      }!`
    );
  };

  const handleDeleteEmployee = (email: string) => {
    if (!session) return;
    const updatedList = deleteEmployeeFromCompany(email, session.company_id);
    setEmployees(updatedList);
    commitDb(
      { ...db, employees: updatedList },
      {
        section: 'equipe',
        actionLabel: `Funcionário ${email} removido da equipe`,
      }
    );
    showToast(`Funcionário ${email} removido!`);
  };

  const handleImpersonateEmployee = (emp: TenantAccount) => {
    const newSession: AuthSession = {
      userId: emp.id,
      company_id: emp.company_id,
      companyName: emp.companyName,
      ownerName: emp.ownerName,
      email: emp.email,
      role: emp.role,
      jobTitle: emp.jobTitle,
      loggedInAt: new Date().toISOString(),
    };
    saveActiveSession(newSession);
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
    return (
      <div className="min-h-screen relative overflow-hidden">
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

  // Enforce RBAC section access
  const effectiveSection: ActiveSection =
    session.role === 'operador' &&
    !OPERATOR_ALLOWED_SECTIONS.includes(activeSection)
      ? 'esteira'
      : activeSection;

  const printSlips = printJob
    ? (() => {
        const chunks = chunkNoteItems(printJob.note.items, 6);
        if (printJob.threePerPage && chunks.length === 1) {
          return [chunks[0], chunks[0], chunks[0]];
        }
        return chunks;
      })()
    : [];

  return (
    <>
    <div className="no-print min-h-screen text-slate-900 pb-20 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient Liquid Glass Morphing Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
      <div className="blob blob-5" />

      {/* Dashboard Shell */}
      <div className="max-w-[1720px] mx-auto flex gap-5 relative z-10 p-3 md:p-6 lg:p-7">
        <LiquidSidebar
          activeSection={effectiveSection}
          onSelectSection={handleSelectSection}
          tenantName={session.companyName}
          userRole={session.role}
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
            userName={session.ownerName}
            realtimeStatus={realtimeStatus}
            onLogout={handleLogout}
            counts={counts}
          />

          {/* Main Content Container */}
          <main className="flex-1 flex flex-col gap-5">
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
            expenses={db.expenses || []}
            serviceProviders={db.serviceProviders || []}
            payrollEmployees={db.payrollEmployees || []}
            investments={db.investments || []}
            onTogglePaid={handleTogglePaid}
            onEmitBilling30d={handleEmitBilling30d}
            onDeleteOrder={handleDeleteOrder}
            onUpsertMonthExpenses={handleUpsertMonthExpenses}
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
            items={db.stock || []}
            globalSearchQuery={searchQuery}
            onAddItem={handleAddStockItem}
            onUpdateItem={handleUpdateStockItem}
            onDeleteItem={handleDeleteStockItem}
          />
        )}

        {effectiveSection === 'notas' && session.role !== 'cliente' && (
          <NotesSection
            notas={db.notas || []}
            companies={db.companies}
            orders={db.orders}
            nextNoteNumber={nextNoteNumber}
            tenantName={session.companyName}
            currentUserName={session.ownerName}
            globalSearchQuery={searchQuery}
            onSaveNote={handleSaveNote}
            onMarkNotePrinted={handleMarkNotePrinted}
            onDeleteNote={handleDeleteNote}
            onTriggerPrint={handleTriggerPrint}
          />
        )}

        {session.role === 'admin' && effectiveSection === 'equipe' && (
          <TeamManagementSection
            session={session}
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onToggleEmployeeRole={handleToggleEmployeeRole}
            onDeleteEmployee={handleDeleteEmployee}
            onImpersonateEmployee={handleImpersonateEmployee}
          />
        )}
          </main>
        </div>
      </div>

      {/* Toast Notification (Apenas ações locais; sincronização é silenciosa) */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-3 rounded-2xl liquid-glass ring-2 ring-indigo-400/50 text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Prominent Floating Action Button ("Nova OS") - Mobile/Tablet Admin Only */}
      {session.role === 'admin' && (
        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white border border-white/40 shadow-2xl shadow-indigo-600/40 transition-all cursor-pointer"
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

    {/* Container exclusivo de impressão 1/3 A4 */}
    {printJob && (
      <div className="print-only-container">
        {printSlips.map((chunk, idx) => (
          <CanhotoSlipCard
            key={`print-${printJob.note.id}-${idx}`}
            note={printJob.note}
            itemsChunk={chunk}
            slipIndex={printJob.threePerPage && chunkNoteItems(printJob.note.items, 6).length === 1 ? 0 : idx}
            totalSlips={chunkNoteItems(printJob.note.items, 6).length}
            tenantName={session.companyName}
            isPrintMode
          />
        ))}
      </div>
    )}
    </>
  );
};

export default App;
