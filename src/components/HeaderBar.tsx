import React, { useEffect, useState } from 'react';
import {
  Building2,
  FileText,
  Kanban,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  PieChart,
  Search,
  Settings,
  Truck,
  Users,
  Wrench,
  X,
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
  isSuperAdmin?: boolean;
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
    backupAlerts?: number;
  };
}

export const NAV_SECTIONS: {
  id: ActiveSection;
  label: string;
  shortLabel: string;
  group: 'primary' | 'operacao' | 'gestao';
  roles: UserRole[];
  superAdminOnly?: boolean;
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
  {
    id: 'configuracoes',
    label: 'Configurações & Backups',
    shortLabel: 'Configurações',
    group: 'gestao',
    roles: ['admin'],
    superAdminOnly: true,
    icon: Settings,
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
  if (id === 'configuracoes' && (counts.backupAlerts || 0) > 0) {
    return counts.backupAlerts;
  }
  return undefined;
}

const SidebarBody: React.FC<{
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  tenantName: string;
  userRole: UserRole;
  isSuperAdmin?: boolean;
  userName: string;
  onLogout: () => void;
  counts: HeaderBarProps['counts'];
  onCloseMobile?: () => void;
}> = ({
  activeSection,
  onSelectSection,
  tenantName,
  userRole,
  isSuperAdmin = false,
  userName,
  onLogout,
  counts,
  onCloseMobile,
}) => {
  const visibleSections = NAV_SECTIONS.filter(
    (item) =>
      item.roles.includes(userRole) && (!item.superAdminOnly || isSuperAdmin)
  );
  const primaryItem = visibleSections.find((s) => s.group === 'primary');
  const operacaoItems = visibleSections.filter((s) => s.group === 'operacao');
  const gestaoItems = visibleSections.filter((s) => s.group === 'gestao');

  const selectAndClose = (section: ActiveSection) => {
    onSelectSection(section);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavItem = (item: (typeof NAV_SECTIONS)[number]) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const badge = getBadgeCount(item.id, counts);
    const isAlertBadge =
      item.id === 'financeiro' || item.id === 'configuracoes';

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => selectAndClose(item.id)}
        className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
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
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold leading-none shrink-0 ${
              isActive
                ? 'bg-white/25 text-white'
                : isAlertBadge
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
    <div className="flex flex-col justify-between h-full gap-5">
      <div className="space-y-5 overflow-y-auto pr-0.5">
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              selectAndClose(userRole === 'operador' ? 'esteira' : 'bento_home')
            }
            className="flex items-center gap-3 px-2 py-1.5 min-h-[44px] cursor-pointer group text-left min-w-0"
            data-purpose="brand-header"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md shadow-indigo-500/25 flex items-center justify-center group-hover:scale-105 transition shrink-0">
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

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="lg:hidden min-h-[44px] min-w-[44px] rounded-full liquid-glass-pill flex items-center justify-center text-slate-700 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {primaryItem && <div>{renderNavItem(primaryItem)}</div>}

        {operacaoItems.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-600/90 uppercase frosted-text-depth">
              Operação
            </div>
            <nav className="space-y-1">{operacaoItems.map(renderNavItem)}</nav>
          </div>
        )}

        {gestaoItems.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold tracking-wider text-slate-600/90 uppercase frosted-text-depth">
              Gestão &amp; Finanças
            </div>
            <nav className="space-y-1">{gestaoItems.map(renderNavItem)}</nav>
          </div>
        )}
      </div>

      {/* User Profile Box */}
      <div
        className="pt-4 border-t border-white/60 flex items-center justify-between gap-2 shrink-0"
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
              {userRole === 'operador'
                ? 'Produção'
                : userRole === 'cliente'
                ? 'Cliente'
                : 'Administrador'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          aria-label="Encerrar sessão"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-rose-600 rounded-full hover:bg-white/50 transition cursor-pointer shrink-0"
          title="Encerrar sessão"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};

export const LiquidSidebar: React.FC<
  Pick<
    HeaderBarProps,
    | 'activeSection'
    | 'onSelectSection'
    | 'tenantName'
    | 'userRole'
    | 'isSuperAdmin'
    | 'userName'
    | 'onLogout'
    | 'counts'
  >
> = (props) => {
  return (
    <aside
      className="w-[248px] shrink-0 liquid-glass rounded-[28px] p-5 flex-col justify-between hidden lg:flex sticky top-6 self-start min-h-[calc(100dvh-3.5rem)]"
      data-purpose="sidebar"
    >
      <SidebarBody {...props} />
    </aside>
  );
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
  onOpenNewOrder,
  tenantName,
  userRole,
  isSuperAdmin = false,
  userName,
  onLogout,
  counts,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setDrawerOpen(false);
    };
    onChange(mq);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <header
        className="sticky lg:static top-0 z-20 flex flex-col gap-2.5 pt-[env(safe-area-inset-top)] pb-2 lg:pb-0 lg:pt-0 bg-gradient-to-b from-white/55 to-transparent lg:bg-none backdrop-blur-md lg:backdrop-blur-none -mx-3 px-3 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0 min-w-0"
        data-purpose="top-navigation-bar"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 min-w-0">
          {/* Mobile/Tablet Hamburger + Brand + Search */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden min-h-[44px] min-w-[44px] rounded-full liquid-glass-pill flex items-center justify-center text-slate-800 hover:text-indigo-700 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectSection(userRole === 'operador' ? 'esteira' : 'bento_home')
              }
              aria-label="Início FacasFlow"
              className="lg:hidden min-h-[44px] min-w-[44px] rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-md flex items-center justify-center shrink-0 cursor-pointer"
            >
              <div className="w-full h-full bg-white/90 rounded-[10px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
            </button>

            <div className="relative flex-1 min-w-0 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4 stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar OS, empresa, CNPJ ou faca..."
                className="liquid-glass-pill w-full min-h-[44px] pl-10 pr-10 py-2 rounded-full text-base text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpar busca"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Nova OS CTA + Quick Exit on Mobile */}
          <div className="flex items-center gap-2 shrink-0">
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={onOpenNewOrder}
                className="min-h-[44px] bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm rounded-full px-4 sm:px-5 py-2 flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/40 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Nova OS</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair"
              className="lg:hidden liquid-glass-pill min-h-[44px] min-w-[44px] rounded-full px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 hover:text-rose-600 cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Slide-out Drawer (< 1024px) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[70] lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm"
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] h-[100dvh] liquid-glass p-5 rounded-r-[28px] shadow-2xl border-r border-white/75 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <SidebarBody
              activeSection={activeSection}
              onSelectSection={onSelectSection}
              tenantName={tenantName}
              userRole={userRole}
              isSuperAdmin={isSuperAdmin}
              userName={userName}
              onLogout={onLogout}
              counts={counts}
              onCloseMobile={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
