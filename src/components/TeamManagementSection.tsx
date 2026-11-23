import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { AuthSession, TenantAccount, UserRole } from '../types/order';

interface TeamManagementSectionProps {
  session: AuthSession;
  employees: TenantAccount[];
  onAddEmployee: (payload: {
    ownerName: string;
    email: string;
    password: string;
    role: UserRole;
    jobTitle: string;
  }) => Promise<{ error?: string }>;
  onToggleEmployeeRole: (memberId: string, nextRole: UserRole) => Promise<void>;
  onDeleteEmployee: (memberId: string) => Promise<void>;
}

export const TeamManagementSection: React.FC<TeamManagementSectionProps> = ({
  session,
  employees,
  onAddEmployee,
  onToggleEmployeeRole,
  onDeleteEmployee,
}) => {
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserRole>('operador');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await onAddEmployee({
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        jobTitle:
          jobTitle.trim() ||
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAccessInfo = async (emp: TenantAccount) => {
    try {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const text = `FacasFlow — Acesso (${session.companyName})\nURL: ${baseUrl}\nE-mail: ${emp.email}`;
      await navigator.clipboard.writeText(text);
      setCopiedEmail(emp.email);
      setTimeout(() => setCopiedEmail(null), 2500);
    } catch {
      // ignore clipboard restriction
    }
  };

  const inputClass =
    'liquid-glass-pill w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl text-base text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition';

  return (
    <div className="space-y-6">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add Employee Form */}
        <div className="lg:col-span-5 liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-300/60 flex items-center justify-center text-indigo-700">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Cadastrar Novo Funcionário
                </h3>
                <p className="text-[11px] font-medium text-slate-600">
                  Vinculado automaticamente à sua empresa
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-300/60 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Funcionário *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ex: Carlos Montador"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Login *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@facaria.com"
                      className="liquid-glass-pill w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ex: 123456"
                      className="liquid-glass-pill w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Função na Fábrica
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Serrador, Dobrador, Expedição..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nível de Permissão (Perfil de Acesso) *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('operador')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      role === 'operador'
                        ? 'bg-indigo-500/15 border-indigo-400/70 ring-1 ring-indigo-400/50'
                        : 'liquid-glass-subtle hover:bg-white/40'
                    }`}
                  >
                    <Wrench
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        role === 'operador' ? 'text-indigo-700' : 'text-slate-600'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Operador / Produção
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 mt-0.5 leading-relaxed">
                        Libera acesso apenas para{' '}
                        <span className="text-indigo-700 font-bold">
                          Esteira, Entregas, Retornos, Estoque e Notas
                        </span>
                        . Oculta Finanças, Empresas e Visão Geral.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      role === 'admin'
                        ? 'bg-indigo-500/15 border-indigo-400/70 ring-1 ring-indigo-400/50'
                        : 'liquid-glass-subtle hover:bg-white/40'
                    }`}
                  >
                    <Shield
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        role === 'admin' ? 'text-indigo-700' : 'text-slate-600'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Administrador
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 mt-0.5 leading-relaxed">
                        Acesso irrestrito a todas as seções, financeiro, cadastro de
                        empresas e gestão de equipe.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] py-3 px-4 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2 active:scale-95 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>
                  {submitting
                    ? 'Cadastrando no Supabase...'
                    : 'Cadastrar Funcionário na Empresa'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Team Directory */}
        <div className="lg:col-span-7 liquid-glass rounded-[28px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center text-indigo-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Usuários &amp; Funcionários da Empresa ({employees.length})
                  </h3>
                  <p className="text-[11px] font-medium text-slate-600">
                    Gerencie cargos, teste a visão de operador ou envie o link de acesso
                    para o celular do funcionário
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {employees.map((emp) => {
                const isSelf =
                  emp.email.trim().toLowerCase() ===
                  session.email.trim().toLowerCase();
                const isOperador = emp.role === 'operador';

                return (
                  <div
                    key={emp.email}
                    className="p-4 rounded-2xl liquid-glass-subtle transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {emp.ownerName}
                        </span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full bg-white/70 border border-white/80 text-slate-700 text-[10px] font-bold">
                            Você
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            isOperador
                              ? 'bg-amber-500/15 text-amber-800 border-amber-300/60'
                              : 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60'
                          }`}
                        >
                          {isOperador
                            ? 'Operador • Fábrica'
                            : 'Administrador Total'}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          Cargo:{' '}
                          <strong className="text-slate-900">
                            {emp.jobTitle ||
                              (isOperador ? 'Operador de Produção' : 'Administrador')}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          E-mail:{' '}
                          <code className="text-slate-900 font-mono font-bold break-all">
                            {emp.email}
                          </code>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyAccessInfo(emp)}
                        className="liquid-glass-pill min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-slate-800 text-xs font-bold transition cursor-pointer"
                        title="Copiar endereço e e-mail de acesso"
                      >
                        {copiedEmail === emp.email ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-600" />
                            <span>Copiar Acesso</span>
                          </>
                        )}
                      </button>

                      {!isSelf && emp.id && (
                        <button
                          type="button"
                          disabled={busyId === emp.id}
                          onClick={async () => {
                            const memberId = emp.id;
                            if (!memberId) return;
                            setBusyId(memberId);
                            try {
                              await onToggleEmployeeRole(
                                memberId,
                                isOperador ? 'admin' : 'operador'
                              );
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="liquid-glass-pill min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-slate-700 text-xs font-bold transition cursor-pointer"
                          title="Alternar entre Operador e Administrador"
                        >
                          <UserCheck className="w-4 h-4 text-indigo-600" />
                          <span>
                            {isOperador ? 'Tornar Admin' : 'Tornar Operador'}
                          </span>
                        </button>
                      )}

                      {!isSelf &&
                        emp.id &&
                        (confirmDeleteId === emp.id ? (
                          <div className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-300/70 rounded-full px-3 py-1">
                            <button
                              type="button"
                              disabled={busyId === emp.id}
                              onClick={async () => {
                                const memberId = emp.id;
                                if (!memberId) return;
                                setBusyId(memberId);
                                try {
                                  await onDeleteEmployee(memberId);
                                  setConfirmDeleteId(null);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="min-h-[36px] text-xs font-bold text-rose-800 hover:text-rose-950 px-2 cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              aria-label="Cancelar exclusão"
                              className="min-h-[36px] min-w-[36px] text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(emp.id || null)}
                            aria-label="Excluir funcionário"
                            className="btn-compact w-9 h-9 rounded-full bg-white/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-700 border border-white/75 flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Excluir funcionário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              Operadores acessam apenas Esteira, Entregas, Retornos, Estoque e Notas.
            </span>
            <span>
              As permissões são aplicadas em tempo real no painel e no banco de dados.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
