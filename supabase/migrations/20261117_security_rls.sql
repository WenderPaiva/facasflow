-- FacasFlow Multi-Tenant Schema with Strict Role-Based Row Level Security (RLS)
-- Roles stored strictly in auth.jwt() -> 'app_metadata' ->> 'role' ('admin' | 'operador' | 'cliente')
-- Tenant isolation stored in auth.jwt() -> 'app_metadata' ->> 'company_id'

create or replace function public.facasflow_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '');
$$;

create or replace function public.facasflow_company_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'company_id'), '');
$$;

create or replace function public.facasflow_client_company_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'client_company_id'), '');
$$;

-- 1. Realtime Tenant State Snapshot (Admin only; never exposed to anon or cliente)
create table if not exists public.facasflow_tenant_state (
  company_id text primary key,
  db_payload jsonb not null default '{}'::jsonb,
  last_action text,
  last_actor text,
  updated_at timestamptz not null default now()
);
alter table public.facasflow_tenant_state enable row level security;

drop policy if exists "Allow tenant realtime access" on public.facasflow_tenant_state;
create policy "admin_full_tenant_state" on public.facasflow_tenant_state
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

-- 2. Companies (Admin: all; Operador: read-only; Cliente: own company read-only)
create table if not exists public.companies (
  id text primary key,
  company_id text not null,
  corporate_name text not null,
  cnpj text not null,
  phone text not null,
  contact_name text not null,
  city text,
  created_at timestamptz not null default now()
);
alter table public.companies enable row level security;

create policy "admin_companies_all" on public.companies
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

create policy "operador_companies_select" on public.companies
  for select to authenticated
  using (public.facasflow_role() = 'operador' and company_id = public.facasflow_company_id());

create policy "cliente_companies_select" on public.companies
  for select to authenticated
  using (
    public.facasflow_role() = 'cliente'
    and company_id = public.facasflow_company_id()
    and id = public.facasflow_client_company_id()
  );

-- 3. Orders (Admin: all; Operador: select/update stage; Cliente: own orders select)
create table if not exists public.orders (
  id text primary key,
  company_id text not null,
  client_company_id text not null,
  company_name text not null,
  company_phone text not null,
  tool_description text not null,
  amount numeric(12,2) not null default 0,
  payment_modality text not null check (payment_modality in ('pix', 'boleto', 'dinheiro', 'cartao', 'nao_pago')),
  payment_status text not null check (payment_status in ('pago', 'a_receber', 'vencido', 'sem_nota', 'nao_pago')),
  stage text not null,
  stage_updated_at text not null,
  due_date date not null,
  paid_at date,
  created_at date not null default current_date
);
alter table public.orders enable row level security;

create policy "admin_orders_all" on public.orders
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

create policy "operador_orders_select" on public.orders
  for select to authenticated
  using (public.facasflow_role() = 'operador' and company_id = public.facasflow_company_id());

create policy "operador_orders_update" on public.orders
  for update to authenticated
  using (public.facasflow_role() = 'operador' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'operador' and company_id = public.facasflow_company_id());

create policy "cliente_orders_select" on public.orders
  for select to authenticated
  using (
    public.facasflow_role() = 'cliente'
    and company_id = public.facasflow_company_id()
    and client_company_id = public.facasflow_client_company_id()
  );

-- 4. Deliveries (Admin & Operador: full; Cliente: own deliveries select)
create table if not exists public.deliveries (
  id text primary key,
  company_id text not null,
  order_id text not null,
  client_company_id text,
  tool_description text not null,
  company_name text not null,
  method text not null,
  carrier_or_person_name text not null,
  dispatched_at text not null,
  notes text
);
alter table public.deliveries enable row level security;

create policy "staff_deliveries_all" on public.deliveries
  for all to authenticated
  using (public.facasflow_role() in ('admin', 'operador') and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() in ('admin', 'operador') and company_id = public.facasflow_company_id());

create policy "cliente_deliveries_select" on public.deliveries
  for select to authenticated
  using (
    public.facasflow_role() = 'cliente'
    and company_id = public.facasflow_company_id()
    and client_company_id = public.facasflow_client_company_id()
  );

-- 5. Warranty Returns (Admin & Operador: full; Cliente: own returns select)
create table if not exists public.returns (
  id text primary key,
  company_id text not null,
  order_id text not null,
  client_company_id text,
  company_name text not null,
  tool_description text not null,
  reason text not null,
  technical_action text not null,
  adjustment_amount numeric(12,2) not null default 0,
  status text not null,
  created_at text not null,
  updated_at text not null
);
alter table public.returns enable row level security;

create policy "staff_returns_all" on public.returns
  for all to authenticated
  using (public.facasflow_role() in ('admin', 'operador') and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() in ('admin', 'operador') and company_id = public.facasflow_company_id());

create policy "cliente_returns_select" on public.returns
  for select to authenticated
  using (
    public.facasflow_role() = 'cliente'
    and company_id = public.facasflow_company_id()
    and client_company_id = public.facasflow_client_company_id()
  );

-- 6. Stock Items (Admin & Operador: full; Cliente: denied)
create table if not exists public.stock_items (
  id text primary key,
  company_id text not null,
  category text not null check (category in ('madeiras', 'laminas')),
  name text not null,
  quantity numeric(12,2) not null default 0,
  unit text not null,
  min_stock numeric(12,2) not null default 0,
  supplier text not null,
  unit_cost numeric(12,2) not null default 0,
  entry_date date not null,
  updated_at text not null
);
alter table public.stock_items enable row level security;

create policy "staff_stock_all" on public.stock_items
  for all to authenticated
  using (public.facasflow_role() in ('admin', 'operador') and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() in ('admin', 'operador') and company_id = public.facasflow_company_id());

-- 7. Monthly Expenses (Admin ONLY - sensitive finance data)
create table if not exists public.monthly_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  reference_month text not null,
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(company_id, reference_month)
);
alter table public.monthly_expenses enable row level security;

create policy "admin_expenses_all" on public.monthly_expenses
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

-- 8. Service Providers (Admin ONLY - sensitive collaborator data)
create table if not exists public.service_providers (
  id text primary key,
  company_id text not null,
  name text not null,
  service text not null,
  amount numeric(12,2) not null default 0,
  payment_modality text not null check (payment_modality in ('pix', 'boleto', 'dinheiro', 'cartao', 'nao_pago')),
  due_date date not null,
  status text not null check (status in ('pendente', 'pago', 'atrasado'))
);
alter table public.service_providers enable row level security;

create policy "admin_providers_all" on public.service_providers
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

-- 9. Payroll Employees (Admin ONLY - sensitive salary data)
create table if not exists public.payroll_employees (
  id text primary key,
  company_id text not null,
  name text not null,
  role_title text not null,
  salary numeric(12,2) not null default 0,
  admission_date date not null
);
alter table public.payroll_employees enable row level security;

create policy "admin_payroll_all" on public.payroll_employees
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

-- 10. Investments (Admin ONLY - sensitive investment data)
create table if not exists public.investments (
  id text primary key,
  company_id text not null,
  asset_name text not null,
  asset_type text not null check (asset_type in ('renda_fixa', 'acoes', 'fii', 'outro')),
  applied_date date not null,
  invested_amount numeric(12,2) not null default 0,
  current_amount numeric(12,2) not null default 0
);
alter table public.investments enable row level security;

create policy "admin_investments_all" on public.investments
  for all to authenticated
  using (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id())
  with check (public.facasflow_role() = 'admin' and company_id = public.facasflow_company_id());

-- Indexes for tenant/RLS performance
create index if not exists idx_companies_company_id on public.companies(company_id);
create index if not exists idx_orders_company_id on public.orders(company_id);
create index if not exists idx_deliveries_company_id on public.deliveries(company_id);
create index if not exists idx_returns_company_id on public.returns(company_id);
create index if not exists idx_stock_items_company_id on public.stock_items(company_id);
create index if not exists idx_monthly_expenses_company_id on public.monthly_expenses(company_id);
create index if not exists idx_service_providers_company_id on public.service_providers(company_id);
create index if not exists idx_payroll_employees_company_id on public.payroll_employees(company_id);
create index if not exists idx_investments_company_id on public.investments(company_id);
