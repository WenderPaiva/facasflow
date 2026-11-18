-- ============================================================================
-- FacasFlow V2: Multi-Tenant Persistence, Auth Profiles, Soft Delete,
--               Backups por Cliente (Storage + SHA-256) e Nova Seção Despesas
-- Postgres 17 + Supabase RLS Best Practices
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. Private internal schema (never exposed via PostgREST Data API)
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- 2. Enum Types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'despesa_categoria' and typnamespace = 'public'::regnamespace) then
    create type public.despesa_categoria as enum (
      'aluguel',
      'agua',
      'energia',
      'internet',
      'alimentacao',
      'combustivel',
      'manutencao',
      'contador',
      'marketing',
      'financiamento',
      'laminas',
      'madeira',
      'seguros',
      'impostos',
      'outros'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'despesa_status' and typnamespace = 'public'::regnamespace) then
    create type public.despesa_status as enum ('pendente', 'pago', 'cancelado');
  end if;

  if not exists (select 1 from pg_type where typname = 'forma_pagamento_enum' and typnamespace = 'public'::regnamespace) then
    create type public.forma_pagamento_enum as enum (
      'pix',
      'boleto_15',
      'boleto_30',
      'dinheiro',
      'cartao',
      'nao_pago'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'backup_tipo' and typnamespace = 'public'::regnamespace) then
    create type public.backup_tipo as enum ('automatico', 'manual', 'pre_restauracao');
  end if;
end $$;

-- 3. Automatic updated_at / updated_by / created_at trigger function
create or replace function public.fn_touch_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := now();
    new.updated_by := coalesce(v_uid, new.updated_by);
  else
    new.created_at := old.created_at;
    new.updated_at := now();
    new.updated_by := coalesce(v_uid, new.updated_by, old.updated_by);
  end if;
  return new;
end;
$$;

-- 4. Core Multi-Tenant Tables: empresas & perfis
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  legacy_key text unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_empresas_ativas
  on public.empresas (id)
  where deleted_at is null and ativo = true;

drop trigger if exists trg_empresas_audit on public.empresas;
create trigger trg_empresas_audit
before insert or update on public.empresas
for each row execute function public.fn_touch_audit_fields();

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id),
  nome text not null,
  email text not null,
  role text not null check (role in ('admin', 'operador', 'cliente')),
  cargo text not null default '',
  cliente_empresa_id uuid,
  ativo boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_perfis_empresa_active
  on public.perfis (empresa_id, id)
  where deleted_at is null and ativo = true;

create unique index if not exists uq_perfis_email_active
  on public.perfis (lower(email))
  where deleted_at is null;

drop trigger if exists trg_perfis_audit on public.perfis;
create trigger trg_perfis_audit
before insert or update on public.perfis
for each row execute function public.fn_touch_audit_fields();

-- 5. Security-Critical Tenant Helper Functions in Private Schema
-- Scoped strictly to (select auth.uid()) inside body; non-exposed schema.
create or replace function private.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.empresa_id
  from public.perfis p
  where p.id = (select auth.uid())
    and p.deleted_at is null
    and p.ativo = true
  limit 1;
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.role, '')
  from public.perfis p
  where p.id = (select auth.uid())
    and p.deleted_at is null
    and p.ativo = true
  limit 1;
$$;

create or replace function private.current_client_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.cliente_empresa_id
  from public.perfis p
  where p.id = (select auth.uid())
    and p.deleted_at is null
    and p.ativo = true
  limit 1;
$$;

revoke all on function private.current_empresa_id() from public, anon;
revoke all on function private.current_user_role() from public, anon;
revoke all on function private.current_client_company_id() from public, anon;
grant execute on function private.current_empresa_id() to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_client_company_id() to authenticated;

-- RLS for empresas & perfis
alter table public.empresas enable row level security;
alter table public.perfis enable row level security;

drop policy if exists empresas_select_own on public.empresas;
create policy empresas_select_own on public.empresas
  for select to authenticated
  using (id = (select private.current_empresa_id()) and deleted_at is null);

drop policy if exists empresas_update_admin on public.empresas;
create policy empresas_update_admin on public.empresas
  for update to authenticated
  using (
    id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists perfis_select_company on public.perfis;
create policy perfis_select_company on public.perfis
  for select to authenticated
  using (
    id = (select auth.uid())
    or (
      empresa_id = (select private.current_empresa_id())
      and (select private.current_user_role()) = 'admin'
    )
  );

drop policy if exists perfis_update_admin on public.perfis;
create policy perfis_update_admin on public.perfis
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

-- 6. Settings Table per Client (Configurações da Empresa & Política de Retenção)
create table if not exists public.configuracoes_empresa (
  empresa_id uuid primary key references public.empresas(id),
  retencao_diaria integer not null default 30 check (retencao_diaria between 1 and 365),
  retencao_mensal integer not null default 12 check (retencao_mensal between 1 and 60),
  backup_automatico boolean not null default true,
  preferencias jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

drop trigger if exists trg_config_audit on public.configuracoes_empresa;
create trigger trg_config_audit
before insert or update on public.configuracoes_empresa
for each row execute function public.fn_touch_audit_fields();

alter table public.configuracoes_empresa enable row level security;

drop policy if exists config_admin_all on public.configuracoes_empresa;
create policy config_admin_all on public.configuracoes_empresa
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists config_admin_insert on public.configuracoes_empresa;
create policy config_admin_insert on public.configuracoes_empresa
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists config_admin_update on public.configuracoes_empresa;
create policy config_admin_update on public.configuracoes_empresa
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

-- 7. Signup Trigger: Automatic Tenant Isolation (never reads role from user_metadata)
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_invited_empresa text;
  v_role text;
  v_company_name text;
  v_owner_name text;
  v_cargo text;
  v_client_comp_id uuid;
begin
  v_invited_empresa := nullif(trim(coalesce(new.raw_app_meta_data ->> 'empresa_id', '')), '');
  v_owner_name := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'owner_name', '')), ''),
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );
  v_company_name := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), ''),
    'Facaria ' || v_owner_name
  );

  if v_invited_empresa is not null then
    v_empresa_id := v_invited_empresa::uuid;
    v_role := case
      when (new.raw_app_meta_data ->> 'role') in ('admin', 'operador', 'cliente')
        then (new.raw_app_meta_data ->> 'role')
      else 'operador'
    end;
    v_cargo := coalesce(
      nullif(trim(coalesce(new.raw_app_meta_data ->> 'cargo', '')), ''),
      case when v_role = 'operador' then 'Operador de Produção' else 'Administrador' end
    );
    v_client_comp_id := nullif(trim(coalesce(new.raw_app_meta_data ->> 'cliente_empresa_id', '')), '')::uuid;
  else
    insert into public.empresas (nome, updated_by)
    values (v_company_name, new.id)
    returning id into v_empresa_id;

    insert into public.configuracoes_empresa (empresa_id, created_by, updated_by)
    values (v_empresa_id, new.id, new.id)
    on conflict (empresa_id) do nothing;

    v_role := 'admin';
    v_cargo := 'Administrador / Proprietário';
    v_client_comp_id := null;

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('empresa_id', v_empresa_id::text, 'role', v_role)
    where id = new.id;
  end if;

  insert into public.perfis (
    id, empresa_id, nome, email, role, cargo, cliente_empresa_id, created_by, updated_by
  )
  values (
    new.id,
    v_empresa_id,
    v_owner_name,
    lower(coalesce(new.email, '')),
    v_role,
    v_cargo,
    v_client_comp_id,
    new.id,
    new.id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- 8. Clientes Empresas (CRM de clientes da facaria)
create table if not exists public.clientes_empresas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text not null default '',
  razao_social text not null,
  cnpj text not null default '',
  telefone text not null default '',
  contato_nome text not null default '',
  cidade text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_clientes_empresas_active
  on public.clientes_empresas (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_clientes_empresas_audit on public.clientes_empresas;
create trigger trg_clientes_empresas_audit
before insert or update on public.clientes_empresas
for each row execute function public.fn_touch_audit_fields();

alter table public.clientes_empresas enable row level security;

drop policy if exists clientes_staff_select on public.clientes_empresas;
create policy clientes_staff_select on public.clientes_empresas
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (
      (select private.current_user_role()) in ('admin', 'operador')
      or (
        (select private.current_user_role()) = 'cliente'
        and id = (select private.current_client_company_id())
        and deleted_at is null
      )
    )
  );

drop policy if exists clientes_admin_insert on public.clientes_empresas;
create policy clientes_admin_insert on public.clientes_empresas
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists clientes_admin_update on public.clientes_empresas;
create policy clientes_admin_update on public.clientes_empresas
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

-- 9. Ordens de Serviço (Esteira & Recebimentos)
create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  numero_os text not null,
  cliente_empresa_id uuid,
  cliente_codigo_legado text default '',
  cliente_nome text not null,
  cliente_telefone text not null default '',
  descricao_ferramenta text not null,
  blade_meters numeric(10,2),
  wood_mm integer,
  valor numeric(12,2) not null default 0,
  forma_pagamento text not null check (forma_pagamento in ('pix', 'boleto', 'dinheiro', 'cartao', 'nao_pago')),
  status_pagamento text not null check (status_pagamento in ('pago', 'a_receber', 'vencido', 'sem_nota', 'nao_pago')),
  etapa text not null check (etapa in ('arquivo_recebido', 'desenho_produzido', 'faca_serrada', 'faca_dobrada', 'faca_ajustada', 'faca_pronta')),
  etapa_atualizada_em text not null default '',
  historico_etapas jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  data_vencimento date not null default current_date,
  data_pagamento date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz,
  unique (empresa_id, numero_os)
);

create index if not exists idx_ordens_servico_active
  on public.ordens_servico (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_ordens_servico_audit on public.ordens_servico;
create trigger trg_ordens_servico_audit
before insert or update on public.ordens_servico
for each row execute function public.fn_touch_audit_fields();

alter table public.ordens_servico enable row level security;

drop policy if exists ordens_select_policy on public.ordens_servico;
create policy ordens_select_policy on public.ordens_servico
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (
      (select private.current_user_role()) in ('admin', 'operador')
      or (
        (select private.current_user_role()) = 'cliente'
        and cliente_empresa_id = (select private.current_client_company_id())
        and deleted_at is null
      )
    )
  );

drop policy if exists ordens_admin_insert on public.ordens_servico;
create policy ordens_admin_insert on public.ordens_servico
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists ordens_staff_update on public.ordens_servico;
create policy ordens_staff_update on public.ordens_servico
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

-- Atomic RPC for moving card stage cleanly without overwriting concurrent updates
create or replace function public.mover_faca_v2(
  p_ordem_id uuid,
  p_etapa text,
  p_etapa_atualizada_em text default null
)
returns public.ordens_servico
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.ordens_servico;
  v_stamp text;
begin
  if p_etapa not in (
    'arquivo_recebido',
    'desenho_produzido',
    'faca_serrada',
    'faca_dobrada',
    'faca_ajustada',
    'faca_pronta'
  ) then
    raise exception 'Etapa inválida: %', p_etapa;
  end if;

  v_stamp := coalesce(
    nullif(trim(coalesce(p_etapa_atualizada_em, '')), ''),
    to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI')
  );

  update public.ordens_servico
  set
    etapa = p_etapa,
    etapa_atualizada_em = v_stamp,
    historico_etapas = coalesce(historico_etapas, '[]'::jsonb) ||
      jsonb_build_array(jsonb_build_object('stage', p_etapa, 'timestamp', v_stamp)),
    version = coalesce(version, 1) + 1
  where id = p_ordem_id
    and deleted_at is null
    and empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  returning * into v_row;

  if not found then
    raise exception 'Ordem % não encontrada ou sem permissão', p_ordem_id;
  end if;

  return v_row;
end;
$$;

grant execute on function public.mover_faca_v2(uuid, text, text) to authenticated;

-- 10. Entregas & Retornos
create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text default '',
  ordem_id uuid,
  numero_os text not null,
  cliente_empresa_id uuid,
  cliente_nome text not null,
  descricao_ferramenta text not null,
  metodo text not null,
  responsavel text not null,
  despachado_em text not null,
  observacao text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_entregas_active
  on public.entregas (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_entregas_audit on public.entregas;
create trigger trg_entregas_audit
before insert or update on public.entregas
for each row execute function public.fn_touch_audit_fields();

alter table public.entregas enable row level security;

drop policy if exists entregas_select_policy on public.entregas;
create policy entregas_select_policy on public.entregas
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (
      (select private.current_user_role()) in ('admin', 'operador')
      or (
        (select private.current_user_role()) = 'cliente'
        and cliente_empresa_id = (select private.current_client_company_id())
        and deleted_at is null
      )
    )
  );

drop policy if exists entregas_staff_insert on public.entregas;
create policy entregas_staff_insert on public.entregas
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists entregas_staff_update on public.entregas;
create policy entregas_staff_update on public.entregas
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

create table if not exists public.retornos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text default '',
  ordem_id uuid,
  numero_os text not null,
  cliente_empresa_id uuid,
  cliente_nome text not null,
  descricao_ferramenta text not null,
  motivo text not null,
  acao_tecnica text not null,
  valor_ajuste numeric(12,2) not null default 0,
  status text not null check (status in ('em_analise', 'em_ajuste', 'liberado')),
  data_retorno text not null default '',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_retornos_active
  on public.retornos (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_retornos_audit on public.retornos;
create trigger trg_retornos_audit
before insert or update on public.retornos
for each row execute function public.fn_touch_audit_fields();

alter table public.retornos enable row level security;

drop policy if exists retornos_select_policy on public.retornos;
create policy retornos_select_policy on public.retornos
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (
      (select private.current_user_role()) in ('admin', 'operador')
      or (
        (select private.current_user_role()) = 'cliente'
        and cliente_empresa_id = (select private.current_client_company_id())
        and deleted_at is null
      )
    )
  );

drop policy if exists retornos_staff_insert on public.retornos;
create policy retornos_staff_insert on public.retornos
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists retornos_staff_update on public.retornos;
create policy retornos_staff_update on public.retornos
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

-- 11. Estoque (Preserva regras de negócio; persistência 100% Supabase + Soft Delete)
create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text default '',
  categoria text not null check (categoria in ('madeiras', 'laminas')),
  nome text not null,
  quantidade numeric(12,2) not null default 0,
  unidade text not null,
  estoque_minimo numeric(12,2) not null default 0,
  fornecedor text not null default 'Não informado',
  custo_unitario numeric(12,2) not null default 0,
  data_entrada date not null default current_date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_estoque_itens_active
  on public.estoque_itens (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_estoque_itens_audit on public.estoque_itens;
create trigger trg_estoque_itens_audit
before insert or update on public.estoque_itens
for each row execute function public.fn_touch_audit_fields();

alter table public.estoque_itens enable row level security;

drop policy if exists estoque_staff_select on public.estoque_itens;
create policy estoque_staff_select on public.estoque_itens
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists estoque_staff_insert on public.estoque_itens;
create policy estoque_staff_insert on public.estoque_itens
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists estoque_staff_update on public.estoque_itens;
create policy estoque_staff_update on public.estoque_itens
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

-- 12. Notas & Nota Itens (Admin & Operador; recálculo server-side; Soft Delete)
create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  numero integer not null,
  data date not null default current_date,
  cliente_empresa_id uuid,
  cliente_nome text not null,
  cnpj text not null,
  contato text not null default '',
  endereco text,
  entregue_por text,
  os_numero text,
  status text not null default 'emitida' check (status in ('rascunho', 'emitida', 'impressa', 'cancelada')),
  total numeric(12,2) not null default 0,
  criado_por text not null default '',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz,
  unique (empresa_id, numero)
);

create index if not exists idx_notas_active
  on public.notas (empresa_id, numero desc)
  where deleted_at is null;

create or replace function public.fn_notas_prepare()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('nota_seq_' || new.empresa_id::text));
    if new.numero is null or new.numero <= 0 then
      select coalesce(max(numero), 0) + 1
      into new.numero
      from public.notas
      where empresa_id = new.empresa_id;
    end if;
    new.total := 0;
  elsif tg_op = 'UPDATE' then
    new.numero := old.numero;
    new.total := coalesce((
      select round(sum(total)::numeric, 2)
      from public.nota_itens
      where nota_id = new.id and deleted_at is null
    ), 0);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notas_prepare on public.notas;
create trigger trg_notas_prepare
before insert or update on public.notas
for each row execute function public.fn_notas_prepare();

drop trigger if exists trg_notas_audit on public.notas;
create trigger trg_notas_audit
before insert or update on public.notas
for each row execute function public.fn_touch_audit_fields();

create table if not exists public.nota_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nota_id uuid not null references public.notas(id) on delete cascade,
  descricao text not null,
  quantidade numeric(12,2) not null check (quantidade > 0),
  preco_unitario numeric(12,2) not null check (preco_unitario >= 0),
  total numeric(12,2) not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_nota_itens_nota
  on public.nota_itens (nota_id)
  where deleted_at is null;

create or replace function public.fn_nota_item_calc()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.total := round((new.quantidade * new.preco_unitario)::numeric, 2);
  return new;
end;
$$;

drop trigger if exists trg_nota_item_calc on public.nota_itens;
create trigger trg_nota_item_calc
before insert or update on public.nota_itens
for each row execute function public.fn_nota_item_calc();

create or replace function public.fn_nota_recalc_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_nota_id uuid;
begin
  v_nota_id := coalesce(new.nota_id, old.nota_id);
  update public.notas
  set total = coalesce((
    select round(sum(total)::numeric, 2)
    from public.nota_itens
    where nota_id = v_nota_id and deleted_at is null
  ), 0)
  where id = v_nota_id;
  return null;
end;
$$;

drop trigger if exists trg_nota_recalc_total on public.nota_itens;
create trigger trg_nota_recalc_total
after insert or update or delete on public.nota_itens
for each row execute function public.fn_nota_recalc_total();

drop trigger if exists trg_nota_itens_audit on public.nota_itens;
create trigger trg_nota_itens_audit
before insert or update on public.nota_itens
for each row execute function public.fn_touch_audit_fields();

alter table public.notas enable row level security;
alter table public.nota_itens enable row level security;

drop policy if exists notas_staff_select on public.notas;
create policy notas_staff_select on public.notas
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists notas_staff_insert on public.notas;
create policy notas_staff_insert on public.notas
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists notas_staff_update on public.notas;
create policy notas_staff_update on public.notas
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists nota_itens_staff_select on public.nota_itens;
create policy nota_itens_staff_select on public.nota_itens
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists nota_itens_staff_insert on public.nota_itens;
create policy nota_itens_staff_insert on public.nota_itens
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

drop policy if exists nota_itens_staff_update on public.nota_itens;
create policy nota_itens_staff_update on public.nota_itens
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

-- 13. DESPESAS (Seção 3.2 - Completo + Novas Categorias + Admin Only + Soft Delete)
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  categoria public.despesa_categoria not null,
  descricao text,
  valor numeric(12,2) not null check (valor > 0),
  data_competencia date not null,
  data_vencimento date,
  data_pagamento date,
  status public.despesa_status not null default 'pendente',
  forma_pagamento public.forma_pagamento_enum not null default 'pix',
  fornecedor text,
  observacao text,
  created_by uuid default auth.uid(),
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_despesas_outros_descricao check (
    categoria <> 'outros' or char_length(trim(coalesce(descricao, ''))) >= 3
  )
);

create index if not exists idx_despesas_empresa_competencia
  on public.despesas (empresa_id, data_competencia desc)
  where deleted_at is null;

create index if not exists idx_despesas_empresa_categoria
  on public.despesas (empresa_id, categoria, status)
  where deleted_at is null;

drop trigger if exists trg_despesas_audit on public.despesas;
create trigger trg_despesas_audit
before insert or update on public.despesas
for each row execute function public.fn_touch_audit_fields();

alter table public.despesas enable row level security;

drop policy if exists despesas_admin_select on public.despesas;
create policy despesas_admin_select on public.despesas
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists despesas_admin_insert on public.despesas;
create policy despesas_admin_insert on public.despesas
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists despesas_admin_update on public.despesas;
create policy despesas_admin_update on public.despesas
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

-- Security-invoker view calculating 'atrasado' dynamically at query time in America/Sao_Paulo (UTC-3)
create or replace view public.v_despesas_consulta
with (security_invoker = true)
as
select
  d.*,
  case
    when d.status = 'pendente'
      and d.data_vencimento is not null
      and d.data_vencimento < (now() at time zone 'America/Sao_Paulo')::date
    then 'atrasado'
    else d.status::text
  end as status_calculado
from public.despesas d
where d.deleted_at is null;

-- 14. Colaboradores (Prestadores de Serviço & Funcionários Folha) + Investimentos
create table if not exists public.prestadores_servico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text default '',
  nome text not null,
  servico text not null,
  valor numeric(12,2) not null default 0,
  forma_pagamento public.forma_pagamento_enum not null default 'pix',
  data_vencimento date not null default current_date,
  status text not null check (status in ('pendente', 'pago', 'atrasado')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_prestadores_active
  on public.prestadores_servico (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_prestadores_audit on public.prestadores_servico;
create trigger trg_prestadores_audit
before insert or update on public.prestadores_servico
for each row execute function public.fn_touch_audit_fields();

alter table public.prestadores_servico enable row level security;

drop policy if exists prestadores_admin_select on public.prestadores_servico;
create policy prestadores_admin_select on public.prestadores_servico
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists prestadores_admin_insert on public.prestadores_servico;
create policy prestadores_admin_insert on public.prestadores_servico
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists prestadores_admin_update on public.prestadores_servico;
create policy prestadores_admin_update on public.prestadores_servico
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

create table if not exists public.funcionarios_folha (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text default '',
  nome text not null,
  cargo text not null,
  salario numeric(12,2) not null default 0,
  data_admissao date not null default current_date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_funcionarios_folha_active
  on public.funcionarios_folha (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_funcionarios_folha_audit on public.funcionarios_folha;
create trigger trg_funcionarios_folha_audit
before insert or update on public.funcionarios_folha
for each row execute function public.fn_touch_audit_fields();

alter table public.funcionarios_folha enable row level security;

drop policy if exists funcionarios_folha_admin_select on public.funcionarios_folha;
create policy funcionarios_folha_admin_select on public.funcionarios_folha
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists funcionarios_folha_admin_insert on public.funcionarios_folha;
create policy funcionarios_folha_admin_insert on public.funcionarios_folha
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists funcionarios_folha_admin_update on public.funcionarios_folha;
create policy funcionarios_folha_admin_update on public.funcionarios_folha
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

create table if not exists public.investimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  codigo_legado text default '',
  nome_ativo text not null,
  tipo_ativo text not null check (tipo_ativo in ('renda_fixa', 'acoes', 'fii', 'outro')),
  data_aplicacao date not null default current_date,
  valor_aplicado numeric(12,2) not null default 0,
  valor_atual numeric(12,2) not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_investimentos_active
  on public.investimentos (empresa_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_investimentos_audit on public.investimentos;
create trigger trg_investimentos_audit
before insert or update on public.investimentos
for each row execute function public.fn_touch_audit_fields();

alter table public.investimentos enable row level security;

drop policy if exists investimentos_admin_select on public.investimentos;
create policy investimentos_admin_select on public.investimentos
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists investimentos_admin_insert on public.investimentos;
create policy investimentos_admin_insert on public.investimentos
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists investimentos_admin_update on public.investimentos;
create policy investimentos_admin_update on public.investimentos
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

-- 15. Backups & Backup Logs Tables + Private Storage Bucket
create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  tipo public.backup_tipo not null,
  schema_version integer not null default 2,
  storage_path text,
  payload jsonb,
  resumo_tabelas jsonb not null default '{}'::jsonb,
  tamanho_bytes bigint not null default 0,
  sha256 text not null,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '30 days')
);

create index if not exists idx_backups_empresa_created
  on public.backups (empresa_id, created_at desc);

alter table public.backups enable row level security;

drop policy if exists backups_admin_select on public.backups;
create policy backups_admin_select on public.backups
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

create table if not exists public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  backup_id uuid references public.backups(id) on delete set null,
  tipo public.backup_tipo not null,
  status text not null check (status in ('sucesso', 'erro')),
  mensagem text not null,
  alerta_dispensado boolean not null default false,
  executado_por uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_backup_logs_empresa_created
  on public.backup_logs (empresa_id, created_at desc);

alter table public.backup_logs enable row level security;

drop policy if exists backup_logs_admin_select on public.backup_logs;
create policy backup_logs_admin_select on public.backup_logs
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

drop policy if exists backup_logs_admin_update on public.backup_logs;
create policy backup_logs_admin_update on public.backup_logs
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) = 'admin'
  );

-- Private Bucket for gzipped JSON backups
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facasflow-backups',
  'facasflow-backups',
  false,
  52428800,
  array['application/gzip', 'application/x-gzip', 'application/json', 'application/octet-stream']
)
on conflict (id) do update
set public = false;

drop policy if exists storage_backups_admin_select on storage.objects;
create policy storage_backups_admin_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'facasflow-backups'
    and (select private.current_user_role()) = 'admin'
    and (storage.foldername(name))[1] = (select private.current_empresa_id())::text
  );

drop policy if exists storage_backups_admin_insert on storage.objects;
create policy storage_backups_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'facasflow-backups'
    and (select private.current_user_role()) = 'admin'
    and (storage.foldername(name))[1] = (select private.current_empresa_id())::text
  );

drop policy if exists storage_backups_admin_update on storage.objects;
create policy storage_backups_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'facasflow-backups'
    and (select private.current_user_role()) = 'admin'
    and (storage.foldername(name))[1] = (select private.current_empresa_id())::text
  )
  with check (
    bucket_id = 'facasflow-backups'
    and (select private.current_user_role()) = 'admin'
    and (storage.foldername(name))[1] = (select private.current_empresa_id())::text
  );

-- 16. Transactional Restore Function (executed exclusively by Edge Function service_role)
create or replace function public.aplicar_restauracao_empresa(
  p_empresa_id uuid,
  p_actor_id uuid,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rec jsonb;
  v_counts jsonb;
  v_deleted_time timestamptz := now();
begin
  if current_user <> 'service_role' and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Acesso negado à restauração transacional.';
  end if;

  -- Soft-delete all current active records of this company inside this single transaction
  update public.nota_itens set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.notas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.entregas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.retornos set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.estoque_itens set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.despesas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.prestadores_servico set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.funcionarios_folha set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.investimentos set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.ordens_servico set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.clientes_empresas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;

  -- Restore clientes_empresas
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'clientes_empresas', '[]'::jsonb)) loop
    insert into public.clientes_empresas (
      id, empresa_id, codigo_legado, razao_social, cnpj, telefone, contato_nome, cidade,
      created_by, created_at, updated_by, updated_at, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'razao_social', 'Cliente'),
      coalesce(v_rec ->> 'cnpj', ''),
      coalesce(v_rec ->> 'telefone', ''),
      coalesce(v_rec ->> 'contato_nome', ''),
      v_rec ->> 'cidade',
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      now(),
      null
    )
    on conflict (id) do update set
      razao_social = excluded.razao_social,
      cnpj = excluded.cnpj,
      telefone = excluded.telefone,
      contato_nome = excluded.contato_nome,
      cidade = excluded.cidade,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore ordens_servico
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'ordens_servico', '[]'::jsonb)) loop
    insert into public.ordens_servico (
      id, empresa_id, numero_os, cliente_empresa_id, cliente_codigo_legado, cliente_nome,
      cliente_telefone, descricao_ferramenta, blade_meters, wood_mm, valor, forma_pagamento,
      status_pagamento, etapa, etapa_atualizada_em, historico_etapas, version, data_vencimento,
      data_pagamento, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      v_rec ->> 'numero_os',
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_codigo_legado', ''),
      coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'cliente_telefone', ''),
      coalesce(v_rec ->> 'descricao_ferramenta', ''),
      (v_rec ->> 'blade_meters')::numeric,
      (v_rec ->> 'wood_mm')::int,
      coalesce((v_rec ->> 'valor')::numeric, 0),
      coalesce(v_rec ->> 'forma_pagamento', 'pix'),
      coalesce(v_rec ->> 'status_pagamento', 'a_receber'),
      coalesce(v_rec ->> 'etapa', 'arquivo_recebido'),
      coalesce(v_rec ->> 'etapa_atualizada_em', ''),
      coalesce(v_rec -> 'historico_etapas', '[]'::jsonb),
      coalesce((v_rec ->> 'version')::int, 1),
      coalesce((v_rec ->> 'data_vencimento')::date, current_date),
      nullif(v_rec ->> 'data_pagamento', '')::date,
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      numero_os = excluded.numero_os,
      cliente_empresa_id = excluded.cliente_empresa_id,
      cliente_nome = excluded.cliente_nome,
      descricao_ferramenta = excluded.descricao_ferramenta,
      valor = excluded.valor,
      forma_pagamento = excluded.forma_pagamento,
      status_pagamento = excluded.status_pagamento,
      etapa = excluded.etapa,
      etapa_atualizada_em = excluded.etapa_atualizada_em,
      historico_etapas = excluded.historico_etapas,
      version = excluded.version + 1,
      data_vencimento = excluded.data_vencimento,
      data_pagamento = excluded.data_pagamento,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore entregas
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'entregas', '[]'::jsonb)) loop
    insert into public.entregas (
      id, empresa_id, codigo_legado, ordem_id, numero_os, cliente_empresa_id,
      cliente_nome, descricao_ferramenta, metodo, responsavel, despachado_em,
      observacao, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      nullif(v_rec ->> 'ordem_id', '')::uuid,
      coalesce(v_rec ->> 'numero_os', ''),
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'descricao_ferramenta', ''),
      coalesce(v_rec ->> 'metodo', 'cliente_buscou'),
      coalesce(v_rec ->> 'responsavel', ''),
      coalesce(v_rec ->> 'despachado_em', ''),
      v_rec ->> 'observacao',
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      metodo = excluded.metodo,
      responsavel = excluded.responsavel,
      despachado_em = excluded.despachado_em,
      observacao = excluded.observacao,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore retornos
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'retornos', '[]'::jsonb)) loop
    insert into public.retornos (
      id, empresa_id, codigo_legado, ordem_id, numero_os, cliente_empresa_id,
      cliente_nome, descricao_ferramenta, motivo, acao_tecnica, valor_ajuste,
      status, data_retorno, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      nullif(v_rec ->> 'ordem_id', '')::uuid,
      coalesce(v_rec ->> 'numero_os', ''),
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'descricao_ferramenta', ''),
      coalesce(v_rec ->> 'motivo', ''),
      coalesce(v_rec ->> 'acao_tecnica', ''),
      coalesce((v_rec ->> 'valor_ajuste')::numeric, 0),
      coalesce(v_rec ->> 'status', 'em_analise'),
      coalesce(v_rec ->> 'data_retorno', ''),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      motivo = excluded.motivo,
      acao_tecnica = excluded.acao_tecnica,
      valor_ajuste = excluded.valor_ajuste,
      status = excluded.status,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore estoque_itens
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'estoque_itens', '[]'::jsonb)) loop
    insert into public.estoque_itens (
      id, empresa_id, codigo_legado, categoria, nome, quantidade, unidade,
      estoque_minimo, fornecedor, custo_unitario, data_entrada,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'categoria', 'madeiras'),
      coalesce(v_rec ->> 'nome', 'Material'),
      coalesce((v_rec ->> 'quantidade')::numeric, 0),
      coalesce(v_rec ->> 'unidade', 'un'),
      coalesce((v_rec ->> 'estoque_minimo')::numeric, 0),
      coalesce(v_rec ->> 'fornecedor', 'Não informado'),
      coalesce((v_rec ->> 'custo_unitario')::numeric, 0),
      coalesce((v_rec ->> 'data_entrada')::date, current_date),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      categoria = excluded.categoria,
      nome = excluded.nome,
      quantidade = excluded.quantidade,
      unidade = excluded.unidade,
      estoque_minimo = excluded.estoque_minimo,
      fornecedor = excluded.fornecedor,
      custo_unitario = excluded.custo_unitario,
      data_entrada = excluded.data_entrada,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore despesas
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'despesas', '[]'::jsonb)) loop
    insert into public.despesas (
      id, empresa_id, categoria, descricao, valor, data_competencia,
      data_vencimento, data_pagamento, status, forma_pagamento, fornecedor,
      observacao, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      (v_rec ->> 'categoria')::public.despesa_categoria,
      v_rec ->> 'descricao',
      (v_rec ->> 'valor')::numeric,
      (v_rec ->> 'data_competencia')::date,
      nullif(v_rec ->> 'data_vencimento', '')::date,
      nullif(v_rec ->> 'data_pagamento', '')::date,
      coalesce((v_rec ->> 'status')::public.despesa_status, 'pendente'::public.despesa_status),
      coalesce((v_rec ->> 'forma_pagamento')::public.forma_pagamento_enum, 'pix'::public.forma_pagamento_enum),
      v_rec ->> 'fornecedor',
      v_rec ->> 'observacao',
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      categoria = excluded.categoria,
      descricao = excluded.descricao,
      valor = excluded.valor,
      data_competencia = excluded.data_competencia,
      data_vencimento = excluded.data_vencimento,
      data_pagamento = excluded.data_pagamento,
      status = excluded.status,
      forma_pagamento = excluded.forma_pagamento,
      fornecedor = excluded.fornecedor,
      observacao = excluded.observacao,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore notas + nota_itens
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'notas', '[]'::jsonb)) loop
    insert into public.notas (
      id, empresa_id, numero, data, cliente_empresa_id, cliente_nome,
      cnpj, contato, endereco, entregue_por, os_numero, status,
      criado_por, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      (v_rec ->> 'numero')::int,
      coalesce((v_rec ->> 'data')::date, current_date),
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'cnpj', ''),
      coalesce(v_rec ->> 'contato', ''),
      v_rec ->> 'endereco',
      v_rec ->> 'entregue_por',
      v_rec ->> 'os_numero',
      coalesce(v_rec ->> 'status', 'emitida'),
      coalesce(v_rec ->> 'criado_por', ''),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      data = excluded.data,
      cliente_nome = excluded.cliente_nome,
      cnpj = excluded.cnpj,
      contato = excluded.contato,
      endereco = excluded.endereco,
      entregue_por = excluded.entregue_por,
      status = excluded.status,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'nota_itens', '[]'::jsonb)) loop
    insert into public.nota_itens (
      id, empresa_id, nota_id, descricao, quantidade, preco_unitario,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      (v_rec ->> 'nota_id')::uuid,
      coalesce(v_rec ->> 'descricao', ''),
      coalesce((v_rec ->> 'quantidade')::numeric, 1),
      coalesce((v_rec ->> 'preco_unitario')::numeric, 0),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      descricao = excluded.descricao,
      quantidade = excluded.quantidade,
      preco_unitario = excluded.preco_unitario,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore prestadores_servico
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'prestadores_servico', '[]'::jsonb)) loop
    insert into public.prestadores_servico (
      id, empresa_id, codigo_legado, nome, servico, valor, forma_pagamento,
      data_vencimento, status, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'nome', ''),
      coalesce(v_rec ->> 'servico', ''),
      coalesce((v_rec ->> 'valor')::numeric, 0),
      coalesce((v_rec ->> 'forma_pagamento')::public.forma_pagamento_enum, 'pix'::public.forma_pagamento_enum),
      coalesce((v_rec ->> 'data_vencimento')::date, current_date),
      coalesce(v_rec ->> 'status', 'pendente'),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      nome = excluded.nome,
      servico = excluded.servico,
      valor = excluded.valor,
      forma_pagamento = excluded.forma_pagamento,
      data_vencimento = excluded.data_vencimento,
      status = excluded.status,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore funcionarios_folha
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'funcionarios_folha', '[]'::jsonb)) loop
    insert into public.funcionarios_folha (
      id, empresa_id, codigo_legado, nome, cargo, salario, data_admissao,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'nome', ''),
      coalesce(v_rec ->> 'cargo', ''),
      coalesce((v_rec ->> 'salario')::numeric, 0),
      coalesce((v_rec ->> 'data_admissao')::date, current_date),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      nome = excluded.nome,
      cargo = excluded.cargo,
      salario = excluded.salario,
      data_admissao = excluded.data_admissao,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  -- Restore investimentos
  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'investimentos', '[]'::jsonb)) loop
    insert into public.investimentos (
      id, empresa_id, codigo_legado, nome_ativo, tipo_ativo, data_aplicacao,
      valor_aplicado, valor_atual, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'nome_ativo', ''),
      coalesce(v_rec ->> 'tipo_ativo', 'renda_fixa'),
      coalesce((v_rec ->> 'data_aplicacao')::date, current_date),
      coalesce((v_rec ->> 'valor_aplicado')::numeric, 0),
      coalesce((v_rec ->> 'valor_atual')::numeric, 0),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      nome_ativo = excluded.nome_ativo,
      tipo_ativo = excluded.tipo_ativo,
      data_aplicacao = excluded.data_aplicacao,
      valor_aplicado = excluded.valor_aplicado,
      valor_atual = excluded.valor_atual,
      updated_by = p_actor_id,
      deleted_at = null;
  end loop;

  v_counts := jsonb_build_object(
    'clientes_empresas', (select count(*) from public.clientes_empresas where empresa_id = p_empresa_id and deleted_at is null),
    'ordens_servico', (select count(*) from public.ordens_servico where empresa_id = p_empresa_id and deleted_at is null),
    'entregas', (select count(*) from public.entregas where empresa_id = p_empresa_id and deleted_at is null),
    'retornos', (select count(*) from public.retornos where empresa_id = p_empresa_id and deleted_at is null),
    'estoque_itens', (select count(*) from public.estoque_itens where empresa_id = p_empresa_id and deleted_at is null),
    'despesas', (select count(*) from public.despesas where empresa_id = p_empresa_id and deleted_at is null),
    'notas', (select count(*) from public.notas where empresa_id = p_empresa_id and deleted_at is null),
    'prestadores_servico', (select count(*) from public.prestadores_servico where empresa_id = p_empresa_id and deleted_at is null),
    'funcionarios_folha', (select count(*) from public.funcionarios_folha where empresa_id = p_empresa_id and deleted_at is null),
    'investimentos', (select count(*) from public.investimentos where empresa_id = p_empresa_id and deleted_at is null)
  );

  return v_counts;
end;
$$;

revoke all on function public.aplicar_restauracao_empresa(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.aplicar_restauracao_empresa(uuid, uuid, jsonb) to service_role;

-- 17. Realtime Publication & Replica Identity
alter table public.ordens_servico replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ordens_servico',
    'entregas',
    'retornos',
    'estoque_itens',
    'notas',
    'despesas',
    'clientes_empresas'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
