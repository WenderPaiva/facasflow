-- FacasFlow Seção Notas: Tabelas, Sequence, Recálculo Server-Side e RLS (Admin & Operador apenas)

create sequence if not exists public.notas_numero_seq start 1 increment 1;

create table if not exists public.notas (
  id text primary key,
  company_id text not null,
  numero integer not null default nextval('public.notas_numero_seq'),
  data date not null default current_date,
  empresa_id text,
  cliente_nome text not null,
  cnpj text not null,
  contato text not null,
  endereco text,
  entregue_por text,
  os_id text,
  status text not null default 'emitida' check (status in ('rascunho', 'emitida', 'impressa', 'cancelada')),
  total numeric(12,2) not null default 0,
  criado_por text not null default '',
  criado_em timestamptz not null default now(),
  unique (company_id, numero)
);

create table if not exists public.nota_itens (
  id text primary key,
  nota_id text not null references public.notas(id) on delete cascade,
  descricao text not null,
  quantidade numeric(12,2) not null check (quantidade > 0),
  preco_unitario numeric(12,2) not null check (preco_unitario >= 0),
  total numeric(12,2) not null default 0
);

-- Trigger 5.4: Recalcular total da linha e total da nota diretamente no banco
create or replace function public.fn_nota_item_compute_total()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.total := round((new.quantidade * new.preco_unitario)::numeric, 2);
  return new;
end;
$$;

drop trigger if exists trg_nota_item_compute_total on public.nota_itens;
create trigger trg_nota_item_compute_total
before insert or update on public.nota_itens
for each row
execute function public.fn_nota_item_compute_total();

create or replace function public.fn_recalc_nota_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_nota_id text;
begin
  target_nota_id := coalesce(new.nota_id, old.nota_id);
  update public.notas
  set total = coalesce((
    select round(sum(total)::numeric, 2)
    from public.nota_itens
    where nota_id = target_nota_id
  ), 0)
  where id = target_nota_id;
  return null;
end;
$$;

drop trigger if exists trg_recalc_nota_total on public.nota_itens;
create trigger trg_recalc_nota_total
after insert or update or delete on public.nota_itens
for each row
execute function public.fn_recalc_nota_total();

-- Impedir que o frontend envie total manipulado ao inserir/atualizar nota sem itens correspondentes
create or replace function public.fn_nota_guard_total()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.total := 0;
  elsif tg_op = 'UPDATE' then
    new.total := coalesce((
      select round(sum(total)::numeric, 2)
      from public.nota_itens
      where nota_id = new.id
    ), 0);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_nota_guard_total on public.notas;
create trigger trg_nota_guard_total
before insert or update on public.notas
for each row
execute function public.fn_nota_guard_total();

-- 5.2 Row Level Security (RLS): Somente administrador e operador acessam; perfil cliente bloqueado
alter table public.notas enable row level security;
alter table public.nota_itens enable row level security;

create policy "staff_notas_all" on public.notas
  for all to authenticated
  using (
    public.facasflow_role() in ('admin', 'operador')
    and company_id = public.facasflow_company_id()
  )
  with check (
    public.facasflow_role() in ('admin', 'operador')
    and company_id = public.facasflow_company_id()
  );

create policy "staff_nota_itens_all" on public.nota_itens
  for all to authenticated
  using (
    exists (
      select 1 from public.notas n
      where n.id = nota_itens.nota_id
        and n.company_id = public.facasflow_company_id()
        and public.facasflow_role() in ('admin', 'operador')
    )
  )
  with check (
    exists (
      select 1 from public.notas n
      where n.id = nota_itens.nota_id
        and n.company_id = public.facasflow_company_id()
        and public.facasflow_role() in ('admin', 'operador')
    )
  );

create index if not exists idx_notas_company_id on public.notas(company_id);
create index if not exists idx_nota_itens_nota_id on public.nota_itens(nota_id);
