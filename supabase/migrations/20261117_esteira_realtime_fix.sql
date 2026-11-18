-- FacasFlow Esteira Realtime Fix: Versionamento, RPC mover_faca, Publication e Replica Identity

-- 1. Adicionar versionamento monotônico e updated_at na tabela orders
alter table public.orders
  add column if not exists version integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Replica Identity FULL para eventos UPDATE filtrados por company_id
alter table public.orders replica identity full;

-- 3. Trigger BEFORE UPDATE apenas na linha alterada (sem escrita em cascata em outras tabelas)
create or replace function public.fn_orders_bump_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_orders_bump_version on public.orders;
create trigger trg_orders_bump_version
before update on public.orders
for each row
execute function public.fn_orders_bump_version();

-- 4. RPC transacional única para movimentação de etapa (SECURITY INVOKER respeita RLS)
create or replace function public.mover_faca(
  p_id text,
  p_etapa text,
  p_stage_updated_at text default null
)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.orders;
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

  update public.orders
  set
    stage = p_etapa,
    stage_updated_at = coalesce(p_stage_updated_at, to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI'))
  where id = p_id
    and company_id = public.facasflow_company_id()
    and public.facasflow_role() in ('admin', 'operador')
  returning * into v_row;

  if not found then
    raise exception 'Ordem % não encontrada ou sem permissão', p_id;
  end if;

  return v_row;
end;
$$;

grant execute on function public.mover_faca(text, text, text) to authenticated;

-- 5. Garantir publicação supabase_realtime para as tabelas operacionais
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deliveries'
  ) then
    alter publication supabase_realtime add table public.deliveries;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'returns'
  ) then
    alter publication supabase_realtime add table public.returns;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stock_items'
  ) then
    alter publication supabase_realtime add table public.stock_items;
  end if;
end $$;
