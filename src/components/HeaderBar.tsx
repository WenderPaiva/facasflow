import React from 'react';
import {
  Building2,
  FileText,
  Kanban,
  Layers,
  LayoutGrid,
  LogOut,
  Package,
  PieChart,
  Search,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { ActiveSection, UserRole } from '../types/order';

interface HeaderBarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewOrder: () => void;
  tenantName: string;
  userRole: UserRole;
  userName: string;
  realtimeStatus: 'connected' | 'supabase_live' | 'reconnecting';
  onLogout: () => void;
  counts: {
    companies: number;
    inProduction: number;
    overdue: number;
    deliveries: number;
    openReturns: number;
    stock: number;
    notas: number;
    employees: number;
  };
}

export const NAV_SECTIONS: {
  id: ActiveSection;
  label: string;
  shortLabel: string;
  group: 'primary' | 'operacao' | 'gestao';
  roles: UserRole[];
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'bento_home',
    label: 'Visão Geral',
    shortLabel: 'Visão Geral',
    group: 'primary',
    roles: ['admin'],
    icon: LayoutGrid,
  },
  {
    id: 'esteira',
    label: 'Esteira de Produção',
    shortLabel: 'Esteira',
    group: 'operacao',
    roles: ['admin', 'operador'],
    icon: Kanban,
  },
  {
    id: 'empresas',
    label: 'Cadastro de Empresas',
    shortLabel: 'Empresas',
    group: 'operacao',
    roles: ['admin'],
    icon: Building2,
  },
  {
    id: 'entregas',
    label: 'Entregas & Logística',
    shortLabel: 'Entregas',
    group: 'operacao',
    roles: ['admin', 'operador'],
    icon: Truck,
  },
  {
    id: 'retornos',
    label: 'Retornos & Ajustes',
    shortLabel: 'Retornos',
    group: 'operacao',
    roles: ['admin', 'operador'],
    icon: Wrench,
  },
  {
    id: 'estoque',
    label: 'Estoque',
    shortLabel: 'Estoque',
    group: 'operacao',
    roles: ['admin', 'operador'],
    icon: Package,
  },
  {
    id: 'notas',
    label: 'Notas',
    shortLabel: 'Notas',
    group: 'operacao',
    roles: ['admin', 'operador'],
    icon: FileText,
  },
  {
    id: 'financeiro',
    label: 'Finanças 30/60d',
    shortLabel: 'Finanças',
    group: 'gestao',
    roles: ['admin'],
    icon: PieChart,
  },
  {
    id: 'equipe',
    label: 'Gestão de Equipe',
    shortLabel: 'Equipe',
    group: 'gestao',
    roles: ['admin'],
    icon: Users,
  },
];

function getBadgeCount(
  id: ActiveSection,
  counts: HeaderBarProps['counts']
): number | undefined {
  if (id === 'empresas') return counts.companies;
  if (id === 'esteira') return counts.inProduction;
  if (id === 'financeiro' && counts.overdue > 0) return counts.overdue;
  if (id === 'entregas') return counts.deliveries;
  if (id === 'retornos' && counts.openReturns > 0) return counts.openReturns;
  if (id === 'estoque') return counts.stock;
  if (id === 'notas') return counts.notas;
  if (id === 'equipe') return counts.employees;
  return undefined;
}

export const LiquidSidebar: React.FC<
  Pick<
    HeaderBarProps,
    | 'activeSection'
    | 'onSelectSection'
    | 'tenantName'
    | 'userRole'
    | 'userName'
    | 'onLogout'
    | 'counts'
  >
> = ({
  activeSection,
  onSelectSection,
  tenantName,
  userRole,
  userName,
  onLogout,
  counts,
}) => {
  const visibleSections = NAV_SECTIONS.filter((item) =>
    item.roles.includes(userRole)
  );
  const primaryItem = visibleSections.find((s) => s.group === 'primary');
  const operacaoItems = visibleSections.filter((s) => s.group === 'operacao');
  const gestaoItems = visibleSections.filter((s) => s.group === 'gestao');

  const renderNavItem = (item: (typeof NAV_SECTIONS)[number]) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const badge = getBadgeCount(item.id, counts);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectSection(item.id)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-white/40'
            : 'text-slate-800 hover:text-indigo-700 hover:bg-white/45'
        }`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-white' : 'text-slate-600'
            }`}
          />
          <span className="truncate">{item.shortLabel}</span>
        </span>
        {badge !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
              isActive
                ? 'bg-white/25 text-white'
                : item.id === 'financeiro'
                ? 'bg-rose-500/20 text-rose-700 border border-rose-300/60'
                : 'bg-white/60 text-slate-700 border border-white/70'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className="w-[248px] shrink-0 liquid-glass rounded-[28px] p-5 flex-col justify-between hidden lg:flex sticky top-6 self-start min-h-[calc(100vh-3.5rem)]"
      data-purpose="sidebar"
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <button
          type="button"
          onClick={() =>
            onSelectSection(userRole === 'operador' ? 'esteira' : 'bento_home')
          }
          className="flex items-center gap-3 px-2 py-1.5 cursor-pointer group text-left"
          data-purpose="brand-header"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md shadow-indigo-500/25 flex items-center justify-center group-hover:scale-105 transition">
            <div className="w-full h-full bg-white/90 backdrop-blur-md rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600 stroke-[2.2]" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 frosted-text-depth">
                Facas
              </span>
              <span className="font-black text-lg text-indigo-600 ml-0.5 drop-shadow-[0_1px_8px_rgba(99,102,241,0.35)]">
                Flow
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 truncate">
              {tenantName}
            </p>
          </div>
        </button>

        {/* Primary Overview Pill */}
        {primaryItem && <div>{renderNavItem(primaryItem)}</div>}

        {/* Operação */}
        {operacaoItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-600/90 uppercase frosted-text-depth">
              Operação
            </div>
            <nav className="space-y-0.5">
              {operacaoItems.map(renderNavItem)}
            </nav>
          </div>
        )}

        {/* Gestão & Finanças */}
        {gestaoItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-600/90 uppercase frosted-text-depth">
              Gestão &amp; Finanças
            </div>
            <nav className="space-y-0.5">
              {gestaoItems.map(renderNavItem)}
            </nav>
          </div>
        )}
      </div>

      {/* User Profile Box */}
      <div
        className="pt-4 border-t border-white/60 flex items-center justify-between gap-2"
        data-purpose="user-profile"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-white/90 shadow-md">
              {userName
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
          </div>
          <div className="text-left leading-tight min-w-0">
            <p className="text-xs font-bold text-slate-900 frosted-text-depth truncate">
              {userName}
            </p>
            <p className="text-[11px] text-slate-600 font-semibold truncate">
              {userRole === 'operador' ? 'Produção' : 'Administrador'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-slate-600 hover:text-rose-600 p-2 rounded-full hover:bg-white/50 transition cursor-pointer shrink-0"
          title="Encerrar sessão"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </aside>
  );
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
  onOpenNewOrder,
  userRole,
  userName,
  realtimeStatus,
  onLogout,
  counts,
}) => {
  const visibleSections = NAV_SECTIONS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <header className="flex flex-col gap-3" data-purpose="top-navigation-bar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mobile Brand + Search Input */}
        <div className="flex items-center gap-3 flex-1 min-w-[220px] max-w-xl">
          <div className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4 stroke-[2.2]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar OS, empresa, CNPJ ou faca..."
              className="liquid-glass-pill w-full pl-11 pr-10 py-2.5 rounded-full text-xs md:text-sm text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Nova OS CTA + Mobile Logout */}
        <div className="flex items-center gap-2.5 shrink-0">

          {userRole === 'admin' && (
            <button
              type="button"
              onClick={onOpenNewOrder}
              className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/40 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Nova OS</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="lg:hidden liquid-glass-pill rounded-full px-3.5 py-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-rose-600 cursor-pointer"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Pills */}
      <div className="flex lg:hidden flex-wrap items-center gap-2">
        {visibleSections.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const badge = getBadgeCount(item.id, counts);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-white/40'
                  : 'liquid-glass-pill text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.shortLabel}</span>
              {badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-white/70 text-slate-700'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
