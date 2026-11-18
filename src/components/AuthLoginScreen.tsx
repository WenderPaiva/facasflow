import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  Layers,
  Lock,
  Mail,
  UserPlus,
} from 'lucide-react';
import {
  authenticateTenant,
  registerNewTenant,
} from '../services/storageAdapter';
import { AuthSession } from '../types/order';

interface AuthLoginScreenProps {
  onAuthenticated: (session: AuthSession) => void;
}

export const AuthLoginScreen: React.FC<AuthLoginScreenProps> = ({
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const res = authenticateTenant(normalizedEmail, normalizedPassword);
    if (res.error || !res.session) {
      setErrorMsg(res.error || 'Falha na autenticação.');
      return;
    }
    onAuthenticated(res.session);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const normalizedRegEmail = regEmail.trim().toLowerCase();
    const normalizedRegPassword = regPassword.trim();
    const res = registerNewTenant({
      companyName,
      ownerName,
      email: normalizedRegEmail,
      password: normalizedRegPassword,
    });
    if (res.error || !res.session) {
      setErrorMsg(res.error || 'Não foi possível criar a conta.');
      return;
    }
    onAuthenticated(res.session);
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md rounded-[32px] liquid-glass p-7 sm:p-9 shadow-2xl relative z-10">
        {/* Clean Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md shadow-indigo-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600 stroke-[2.2]" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none frosted-text-depth">
            Facas<span className="text-indigo-600">Flow</span>
          </h1>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-full liquid-glass-subtle mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'text-slate-700 hover:text-indigo-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                : 'text-slate-700 hover:text-indigo-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300/70 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  className="liquid-glass-pill w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="liquid-glass-pill w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2 active:scale-95"
            >
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da sua facaria"
                className="liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Seu nome"
                className="liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha *
              </label>
              <input
                type="password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="new-password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Crie uma senha"
                className="liquid-glass-pill w-full px-3.5 py-2.5 rounded-2xl text-xs text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-full font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-white/40 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta &amp; Entrar</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
