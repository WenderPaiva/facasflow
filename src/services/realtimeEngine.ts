import {
  DieOrder,
  EnterpriseDatabase,
  ProductionStage,
  RealtimeSyncEvent,
  TenantAccount,
  UserRole,
} from '../types/order';

const SUPABASE_CONFIG_KEY = 'facasflow_supabase_config_v1';
export const CLIENT_INSTANCE_ID = `client_${Math.random().toString(36).slice(2, 10)}`;

export interface SupabaseRealtimeConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export function getSupabaseConfig(): SupabaseRealtimeConfig {
  try {
    const raw = window.localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseRealtimeConfig;
      if (parsed && typeof parsed.url === 'string' && typeof parsed.anonKey === 'string') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { url: '', anonKey: '', enabled: false };
}

export function saveSupabaseConfig(config: SupabaseRealtimeConfig): void {
  try {
    window.localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

let activeSupabaseChannel: any = null;
let activeSupabaseClient: any = null;
let activeBroadcastChannel: BroadcastChannel | null = null;
let activeSubscriptionCount = 0;

export function getActiveRealtimeChannelCount(): number {
  return activeSubscriptionCount;
}

export function isSupabaseCloudActive(): boolean {
  return Boolean(activeSupabaseClient && activeSupabaseChannel);
}

/**
 * Call Postgres RPC mover_faca(p_id, p_etapa, p_stage_updated_at) when Supabase is connected.
 */
export async function moveOrderStageViaRpc(
  orderId: string,
  targetStage: ProductionStage,
  stageUpdatedAt: string
): Promise<{ version?: number; updated_at?: string } | null> {
  if (!activeSupabaseClient) return null;
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
export function publishRealtimeUpdate(params: {
  company_id: string;
  section: 'esteira' | 'entregas' | 'retornos' | 'estoque' | 'notas' | 'financeiro' | 'equipe' | 'all';
  actionLabel: string;
  actorName: string;
  actorRole: UserRole;
  order?: DieOrder;
  db?: EnterpriseDatabase;
}): void {
  const event: RealtimeSyncEvent = {
    eventId: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    senderInstanceId: CLIENT_INSTANCE_ID,
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
    } else if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(`facasflow_rt_${params.company_id}`);
      ch.postMessage(event);
      ch.close();
    }
  } catch {
    // ignore
  }

  // 2. LocalStorage Realtime Event key (triggers 'storage' event in other tabs only)
  try {
    window.localStorage.setItem(
      `facasflow_rt_event_${params.company_id}`,
      JSON.stringify(event)
    );
  } catch {
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
        .upsert(
          {
            company_id: params.company_id,
            db_payload: params.db,
            updated_at: event.timestamp,
            last_action: params.actionLabel,
            last_actor: params.actorName,
          },
          { onConflict: 'company_id' }
        )
        .then(() => {})
        .catch(() => {});
    }
  } catch {
    // ignore
  }
}

/**
 * Subscribe to real-time updates for a specific `company_id`.
 * Strictly read-only listener: updates local UI state only, never writes back to DB.
 */
export function subscribeToCompanyRealtime(
  company_id: string,
  onRemoteUpdate: (event: RealtimeSyncEvent) => void,
  onConnectionStatusChange?: (status: 'connected' | 'supabase_live' | 'reconnecting') => void
): () => void {
  let isDisposed = false;
  const seenEvents = new Set<string>();
  let localBroadcast: BroadcastChannel | null = null;
  let localSupabaseClient: any = null;
  let localSupabaseChannel: any = null;

  activeSubscriptionCount += 1;

  const handleIncoming = (rawEvent: any) => {
    if (isDisposed || !rawEvent) return;
    if (rawEvent.senderInstanceId && rawEvent.senderInstanceId === CLIENT_INSTANCE_ID) {
      return;
    }
    if (rawEvent.company_id !== company_id) return;
    if (rawEvent.eventId) {
      if (seenEvents.has(rawEvent.eventId)) return;
      seenEvents.add(rawEvent.eventId);
      if (seenEvents.size > 200) {
        const first = seenEvents.values().next().value;
        if (first) seenEvents.delete(first);
      }
    }
    if (!rawEvent.order && (!rawEvent.db || !Array.isArray(rawEvent.db.orders))) {
      return;
    }

    onRemoteUpdate(rawEvent as RealtimeSyncEvent);
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
    } catch {
      // ignore
    }
  }

  // 2. StorageEvent (fires only in OTHER tabs)
  const storageHandler = (e: StorageEvent) => {
    if (!e.newValue) return;
    if (e.key === `facasflow_rt_event_${company_id}`) {
      try {
        handleIncoming(JSON.parse(e.newValue));
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  // 3. Server-Sent Events (SSE) for localhost server.cjs
  let sseSource: EventSource | null = null;
  if (
    typeof EventSource !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    try {
      sseSource = new EventSource(
        `/api/realtime?company_id=${encodeURIComponent(company_id)}`
      );
      sseSource.onmessage = (evt) => {
        try {
          handleIncoming(JSON.parse(evt.data));
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }

  // 4. Supabase Realtime Channel (normalized orders changes + broadcast)
  const supaCfg = getSupabaseConfig();
  if (supaCfg.enabled && supaCfg.url.trim() && supaCfg.anonKey.trim()) {
    const dynamicImport = new Function('url', 'return import(url)');
    dynamicImport('https://esm.sh/@supabase/supabase-js@2.47.10')
      .then((mod: any) => {
        if (isDisposed) return;
        const createClient = mod.createClient;
        const client = createClient(supaCfg.url.trim(), supaCfg.anonKey.trim(), {
          realtime: { params: { eventsPerSecond: 20 } },
        });
        localSupabaseClient = client;
        activeSupabaseClient = client;

        if (activeSupabaseChannel) {
          try {
            client.removeChannel(activeSupabaseChannel);
          } catch {
            // ignore
          }
          activeSupabaseChannel = null;
        }

        const channel = client
          .channel(`facasflow_company_${company_id}`, {
            config: { broadcast: { self: false } },
          })
          .on('broadcast', { event: 'facasflow_sync' }, (payload: any) => {
            if (payload?.payload) {
              handleIncoming(payload.payload);
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `company_id=eq.${company_id}`,
            },
            (change: any) => {
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
            }
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED' && !isDisposed) {
              onConnectionStatusChange?.('supabase_live');
            }
          });

        if (isDisposed) {
          try {
            client.removeChannel(channel);
          } catch {
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
      } catch {
        // ignore
      }
      if (activeSupabaseChannel === localSupabaseChannel) {
        activeSupabaseChannel = null;
      }
      localSupabaseChannel = null;
    }
  };
}

export function broadcastEmployeeRegistryUpdate(accounts: TenantAccount[]): void {
  try {
    window.localStorage.setItem(
      'facasflow_saas_tenants_v1',
      JSON.stringify(accounts)
    );
  } catch {
    // ignore
  }
}
