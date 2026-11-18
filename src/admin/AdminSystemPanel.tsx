import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, Copy, Database, Radio, Shield } from 'lucide-react';
import {
  getActiveSession,
} from '../services/storageAdapter';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  SupabaseRealtimeConfig,
} from '../services/realtimeEngine';

/**
 * Rota restrita a Administradores/Engenheiros.
 * Empacotada separadamente em dist/admin.bundle.js (nunca incluída no bundle do cliente).
 */
const AdminSystemPanel: React.FC = () => {
  const session = getActiveSession();
  const [supaConfig, setSupaConfig] = useState<SupabaseRealtimeConfig>(() =>
    getSupabaseConfig()
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!session || session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="liquid-glass rounded-[28px] p-8 max-w-md text-center space-y-3">
          <Shield className="w-10 h-10 text-indigo-600 mx-auto" />
          <h1 className="text-lg font-extrabold text-slate-900">
            Acesso Restrito ao Administrador
          </h1>
          <p className="text-xs font-medium text-slate-700">
            Esta rota técnica é exclusiva para administradores autenticados.
          </p>
          <a
            href="./index.html"
            className="inline-block px-5 py-2.5 rounded-full text-xs font-bold bg-indigo-600 text-white"
          >
            Voltar ao Login
          </a>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supaConfig);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const rlsNote = `-- Utilize apenas a chave anon/publishable no frontend.
-- Aplique supabase/migrations/20261117_security_rls.sql no SQL Editor do Supabase.`;

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="liquid-glass rounded-[28px] p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 border border-indigo-300/60 inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Painel Técnico do Administrador
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60 inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Realtime &amp; RLS
            </span>
          </div>
          <a
            href="./index.html"
            className="liquid-glass-pill px-4 py-2 rounded-full text-xs font-bold text-slate-800"
          >
            Voltar ao Dashboard
          </a>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          Configuração Supabase Realtime &amp; Segurança
        </h1>
        <p className="text-xs font-medium text-slate-700">
          Configure apenas a URL do projeto e a chave pública anon. Nenhuma service_role key deve ser inserida no frontend.
        </p>
      </div>

      <form onSubmit={handleSave} className="liquid-glass rounded-[28px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Conexão Supabase Anon Key
          </span>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
            <input
              type="checkbox"
              checked={supaConfig.enabled}
              onChange={(e) =>
                setSupaConfig({ ...supaConfig, enabled: e.target.checked })
              }
              className="rounded accent-emerald-600 w-4 h-4"
            />
            <span>Habilitar Supabase Cloud</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="url"
            value={supaConfig.url}
            onChange={(e) => setSupaConfig({ ...supaConfig, url: e.target.value })}
            placeholder="https://seu-projeto.supabase.co"
            className="liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900"
          />
          <input
            type="password"
            value={supaConfig.anonKey}
            onChange={(e) =>
              setSupaConfig({ ...supaConfig, anonKey: e.target.value })
            }
            placeholder="Supabase Anon / Publishable Key"
            className="liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            Salvar Configuração
          </button>
          {savedNotice && (
            <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
              <Check className="w-4 h-4" /> Configuração salva com segurança
            </span>
          )}
        </div>

        <div className="rounded-2xl liquid-glass-subtle p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700">
              Migração RLS obrigatória
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(rlsNote);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2000);
              }}
              className="liquid-glass-pill px-3 py-1 rounded-full text-[11px] font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedSql ? 'Copiado' : 'Copiar Nota'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-slate-800 overflow-x-auto">
            {rlsNote}
          </pre>
        </div>
      </form>
    </div>
  );
};

const rootEl = document.getElementById('admin-root');
if (rootEl) {
  createRoot(rootEl).render(<AdminSystemPanel />);
}
