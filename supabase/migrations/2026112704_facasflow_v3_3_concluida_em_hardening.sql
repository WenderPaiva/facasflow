-- ============================================================================
-- FacasFlow V3.3 (Hardening): Protecao anti-retroativo de concluida_em para
-- operador no trigger, suporte a restore via new.concluida_em e correcao
-- segura de virada de ano/bissexto.
-- ============================================================================

create or replace function public.fn_ordens_servico_prepare()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_next bigint;
  v_role text;
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('os_seq_' || new.empresa_id::text));

    if new.numero_os is null
       or btrim(new.numero_os) = ''
       or upper(btrim(new.numero_os)) = 'AUTO'
       or exists (
         select 1 from public.ordens_servico
         where empresa_id = new.empresa_id and numero_os = new.numero_os
       ) then
      select coalesce(max(
        case
          when numero_os ~ '^OS-[0-9]+$' then substring(numero_os from 4)::bigint
          else 0
        end
      ), 0) + 1
      into v_next
      from public.ordens_servico
      where empresa_id = new.empresa_id
        and deleted_at is null;

      new.numero_os := 'OS-' || lpad(v_next::text, greatest(3, length(v_next::text)), '0');
      while exists (
        select 1 from public.ordens_servico
        where empresa_id = new.empresa_id and numero_os = new.numero_os
      ) loop
        v_next := v_next + 1;
        new.numero_os := 'OS-' || lpad(v_next::text, greatest(3, length(v_next::text)), '0');
      end loop;
    end if;

    if new.etapa = 'faca_pronta' and new.concluida_em is null then
      new.concluida_em := now();
    elsif new.etapa is distinct from 'faca_pronta' then
      new.concluida_em := null;
    end if;
  elsif tg_op = 'UPDATE' then
    v_role := (select private.current_user_role());

    if v_role = 'operador' then
      if (new.empresa_id is distinct from old.empresa_id)
         or (new.numero_os is distinct from old.numero_os)
         or (new.cliente_empresa_id is distinct from old.cliente_empresa_id)
         or (new.cliente_codigo_legado is distinct from old.cliente_codigo_legado)
         or (new.cliente_nome is distinct from old.cliente_nome)
         or (new.cliente_telefone is distinct from old.cliente_telefone)
         or (new.descricao_ferramenta is distinct from old.descricao_ferramenta)
         or (new.blade_meters is distinct from old.blade_meters)
         or (new.wood_mm is distinct from old.wood_mm)
         or (new.observacao_financeira is distinct from old.observacao_financeira)
         or (new.created_at is distinct from old.created_at)
         or (new.deleted_at is distinct from old.deleted_at)
         or (new.valor is distinct from old.valor)
         or (new.status_pagamento is distinct from old.status_pagamento)
         or (new.forma_pagamento is distinct from old.forma_pagamento)
         or (new.data_pagamento is distinct from old.data_pagamento)
         or (new.data_vencimento is distinct from old.data_vencimento) then
        raise exception 'Operadores podem alterar apenas a etapa de produção da Ordem de Serviço.';
      end if;

      if new.etapa = 'faca_pronta' and old.etapa is distinct from 'faca_pronta' then
        new.concluida_em := now();
      elsif new.etapa = 'faca_pronta' and old.etapa = 'faca_pronta' then
        new.concluida_em := coalesce(old.concluida_em, old.updated_at, old.created_at, now());
      else
        new.concluida_em := null;
      end if;
    else
      if new.etapa = 'faca_pronta' and old.etapa is distinct from 'faca_pronta' then
        new.concluida_em := coalesce(new.concluida_em, now());
      elsif new.etapa = 'faca_pronta' and old.etapa = 'faca_pronta' then
        new.concluida_em := coalesce(new.concluida_em, old.concluida_em, old.updated_at, old.created_at, now());
      else
        new.concluida_em := null;
      end if;
    end if;

    if old.deleted_at is null and new.deleted_at is not null and position('__old_' in new.numero_os) = 0 then
      new.numero_os := old.numero_os || '__old_' || left(md5(old.id::text || coalesce(new.deleted_at::text, now()::text)), 6);
    end if;

    if new.version is not distinct from old.version
       and old.deleted_at is null
       and new.deleted_at is null then
      new.version := coalesce(old.version, 1) + 1;
    end if;
  end if;

  return new;
end;
$$;

update public.ordens_servico
set concluida_em = make_timestamptz(
  extract(year from (coalesce(created_at, now()) at time zone 'America/Sao_Paulo'))::int + 1,
  substring(etapa_atualizada_em from 4 for 2)::int,
  least(
    substring(etapa_atualizada_em from 1 for 2)::int,
    extract(day from (
      make_date(
        extract(year from (coalesce(created_at, now()) at time zone 'America/Sao_Paulo'))::int + 1,
        substring(etapa_atualizada_em from 4 for 2)::int,
        1
      ) + interval '1 month - 1 day'
    ))::int
  ),
  substring(etapa_atualizada_em from 10 for 2)::int,
  substring(etapa_atualizada_em from 13 for 2)::int,
  least(59.999, greatest(0, extract(second from coalesce(created_at, now())))),
  'America/Sao_Paulo'
)
where etapa = 'faca_pronta'
  and concluida_em is not null
  and created_at is not null
  and concluida_em < (created_at - interval '1 day')
  and etapa_atualizada_em ~ '^[0-9]{2}/[0-9]{2} às [0-9]{2}:[0-9]{2}$'
  and substring(etapa_atualizada_em from 4 for 2)::int between 1 and 12
  and substring(etapa_atualizada_em from 1 for 2)::int between 1 and 31
  and substring(etapa_atualizada_em from 10 for 2)::int between 0 and 23
  and substring(etapa_atualizada_em from 13 for 2)::int between 0 and 59
  and substring(etapa_atualizada_em from 4 for 2)::int
      < extract(month from (created_at at time zone 'America/Sao_Paulo'))::int;
