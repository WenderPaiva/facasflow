-- ============================================================================
-- FacasFlow V3 Updates:
-- 1. Novas categorias de despesas (flow_dashboard, taxas_bancarias)
-- 2. Super Admin flag (is_super_admin) + RLS estrito em Configurações & Backups
-- 3. Correção definitiva de colisão de numeração em Notas (soft-delete)
-- 4. Tabela estoque_movimentacoes (Registro Rápido de Consumo + Estorno)
-- 5. Abertura de Investimentos com categorias Aplicação, Consórcio e Outros
-- ============================================================================

alter type public.despesa_categoria add value if not exists 'flow_dashboard';
alter type public.despesa_categoria add value if not exists 'taxas_bancarias';

alter table public.perfis
  add column if not exists is_super_admin boolean not null default false;

create or replace function public.fn_protect_super_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'INSERT' then
      new.is_super_admin := false;
    elsif tg_op = 'UPDATE' then
      new.is_super_admin := old.is_super_admin;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_perfis_protect_super_admin
before insert or update on public.perfis
for each row execute function public.fn_protect_super_admin();

update public.perfis
set is_super_admin = true
where lower(email) = 'wenderautomation@gmail.com';

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.is_super_admin = true
      and p.deleted_at is null
      and p.ativo = true
  );
$$;

revoke all on function private.is_super_admin() from public, anon;
grant execute on function private.is_super_admin() to authenticated;

alter policy config_admin_all on public.configuracoes_empresa
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  );

alter policy config_admin_insert on public.configuracoes_empresa
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  );

alter policy config_admin_update on public.configuracoes_empresa
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  );

alter policy backups_admin_select on public.backups
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  );

alter policy backup_logs_admin_select on public.backup_logs
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  );

alter policy backup_logs_admin_update on public.backup_logs
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.is_super_admin()) = true
  );

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
      where empresa_id = new.empresa_id
        and deleted_at is null
        and numero > 0;
    end if;
    while exists (
      select 1 from public.notas
      where empresa_id = new.empresa_id and numero = new.numero
    ) loop
      new.numero := new.numero + 1;
    end loop;
    new.total := 0;
  elsif tg_op = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null and new.numero > 0 then
      new.numero := -(100000 + (('x' || left(md5(old.id::text || coalesce(new.deleted_at::text, now()::text)), 6))::bit(24)::int));
    elsif old.deleted_at is null and new.deleted_at is null then
      new.numero := old.numero;
    end if;
    new.total := coalesce((
      select round(sum(total)::numeric, 2)
      from public.nota_itens
      where nota_id = new.id and deleted_at is null
    ), 0);
  end if;
  return new;
end;
$$;

update public.notas
set numero = -(100000 + (('x' || left(md5(id::text || deleted_at::text), 6))::bit(24)::int))
where deleted_at is not null and numero > 0;

create table if not exists public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  estoque_item_id uuid not null references public.estoque_itens(id),
  item_codigo text not null default '',
  item_nome text not null,
  categoria text not null default 'madeiras',
  unidade text not null default 'un',
  tipo text not null check (tipo in ('consumo', 'reposicao', 'estorno')),
  quantidade numeric(12,2) not null check (quantidade > 0),
  saldo_anterior numeric(12,2) not null default 0,
  saldo_posterior numeric(12,2) not null default 0,
  responsavel_nome text not null default '',
  observacao text,
  estornado_em timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_estoque_movimentacoes_empresa_recent
  on public.estoque_movimentacoes (empresa_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_estoque_movimentacoes_item
  on public.estoque_movimentacoes (estoque_item_id)
  where deleted_at is null;

create or replace trigger trg_estoque_movimentacoes_audit
before insert or update on public.estoque_movimentacoes
for each row execute function public.fn_touch_audit_fields();

alter table public.estoque_movimentacoes enable row level security;

create policy estoque_mov_staff_select on public.estoque_movimentacoes
  for select to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

create policy estoque_mov_staff_insert on public.estoque_movimentacoes
  for insert to authenticated
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

create policy estoque_mov_staff_update on public.estoque_movimentacoes
  for update to authenticated
  using (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  )
  with check (
    empresa_id = (select private.current_empresa_id())
    and (select private.current_user_role()) in ('admin', 'operador')
  );

alter table public.investimentos
  add column if not exists descricao text,
  add column if not exists categoria text not null default 'aplicacao' check (categoria in ('aplicacao', 'consorcio', 'outros'));
