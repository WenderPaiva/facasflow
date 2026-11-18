import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://apnityirmkfuuokcpbpm.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_tZAalUZ5CmjuxULkFHEX-g_PIDuZMmp';

const SUPABASE_CONFIG_KEY = 'facasflow_supabase_config_v1';

export interface SupabaseClientConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

function isServiceRoleKey(key: string): boolean {
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

export function getResolvedSupabaseCredentials(): { url: string; key: string } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SupabaseClientConfig;
        if (
          parsed?.enabled &&
          parsed.url?.trim() &&
          parsed.anonKey?.trim() &&
          !isServiceRoleKey(parsed.anonKey.trim())
        ) {
          return {
            url: parsed.url.trim().replace(/\/+$/, ''),
            key: parsed.anonKey.trim(),
          };
        }
      }
    }
  } catch {
    // ignore invalid localStorage override
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedEndpointSig = '';

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = getResolvedSupabaseCredentials();
  const sig = `${url}|${key}`;
  if (!cachedClient || cachedEndpointSig !== sig) {
    cachedEndpointSig = sig;
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'facasflow_sb_auth_v2',
      },
      realtime: {
        params: { eventsPerSecond: 20 },
      },
    });
  }
  return cachedClient;
}
