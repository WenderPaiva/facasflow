-- ============================================================================
-- FacasFlow V3.3: Timestamp deterministico de conclusao (concluida_em)
-- para fila FIFO de 15 facas em Facas Finalizadas -> Facas Armazenadas.
-- ============================================================================

alter table public.ordens_servico
  add column if not exists concluida_em timestamptz;

create index if not exists idx_ordens_empresa_concluida_em
  on public.ordens_servico (empresa_id, concluida_em desc)
  where deleted_at is null and etapa = 'faca_pronta';

update public.ordens_servico
set concluida_em = case
  when etapa_atualizada_em ~ '^[0-9]{2}/[0-9]{2} às [0-9]{2}:[0-9]{2}$' then
    make_timestamptz(
      extract(year from (coalesce(created_at, now()) at time zone 'America/Sao_Paulo'))::int,
      substring(etapa_atualizada_em from 4 for 2)::int,
      substring(etapa_atualizada_em from 1 for 2)::int,
      substring(etapa_atualizada_em from 10 for 2)::int,
      substring(etapa_atualizada_em from 13 for 2)::int,
      least(59.999, greatest(0, extract(second from coalesce(created_at, now())))),
      'America/Sao_Paulo'
    )
  else coalesce(updated_at, created_at, now())
end
where etapa = 'faca_pronta'
  and concluida_em is null;

create or replace function public.fn_ordens_servico_prepare()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_next bigint;
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
    if (select private.current_user_role()) = 'operador' then
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
    end if;

    if new.etapa = 'faca_pronta' and old.etapa is distinct from 'faca_pronta' then
      new.concluida_em := coalesce(new.concluida_em, now());
    elsif new.etapa = 'faca_pronta' and old.etapa = 'faca_pronta' then
      new.concluida_em := coalesce(old.concluida_em, new.concluida_em, old.updated_at, old.created_at, now());
    else
      new.concluida_em := null;
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

create or replace function public.mover_faca_v2(
  p_ordem_id uuid,
  p_etapa text,
  p_etapa_atualizada_em text default null
)
returns public.ordens_servico
language plpgsql
set search_path = ''
as $$
declare
  v_row public.ordens_servico;
  v_stamp text;
begin
  if p_etapa not in ('arquivo_recebido','desenho_produzido','faca_serrada','faca_dobrada','faca_ajustada','faca_pronta') then
    raise exception 'Etapa inválida: %', p_etapa;
  end if;
  v_stamp := coalesce(nullif(trim(coalesce(p_etapa_atualizada_em, '')), ''), to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI'));
  update public.ordens_servico
  set etapa = p_etapa,
      etapa_atualizada_em = v_stamp,
      historico_etapas = coalesce(historico_etapas, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('stage', p_etapa, 'timestamp', v_stamp)),
      concluida_em = case
        when p_etapa = 'faca_pronta' then
          case when etapa = 'faca_pronta' then coalesce(concluida_em, now()) else now() end
        else null
      end,
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

  update public.nota_itens set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.notas
  set deleted_at = v_deleted_time,
      updated_by = p_actor_id,
      numero = case
        when exists (
          select 1 from jsonb_array_elements(coalesce(p_snapshot -> 'notas', '[]'::jsonb)) x
          where (x ->> 'id')::uuid = public.notas.id
        ) then numero
        else -(100000 + (('x' || left(md5(id::text || v_deleted_time::text), 6))::bit(24)::int))
      end
  where empresa_id = p_empresa_id and deleted_at is null;

  update public.entregas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.retornos set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.estoque_itens set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.despesas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.prestadores_servico set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.funcionarios_folha set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;
  update public.investimentos set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;

  update public.ordens_servico
  set deleted_at = v_deleted_time,
      updated_by = p_actor_id,
      numero_os = case
        when exists (
          select 1 from jsonb_array_elements(coalesce(p_snapshot -> 'ordens_servico', '[]'::jsonb)) x
          where (x ->> 'id')::uuid = public.ordens_servico.id
        ) then numero_os
        else numero_os || '__old_' || left(md5(id::text || v_deleted_time::text), 6)
      end
  where empresa_id = p_empresa_id and deleted_at is null;

  update public.clientes_empresas set deleted_at = v_deleted_time, updated_by = p_actor_id where empresa_id = p_empresa_id and deleted_at is null;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'clientes_empresas', '[]'::jsonb)) loop
    insert into public.clientes_empresas (
      id, empresa_id, codigo_legado, razao_social, cnpj, telefone, contato_nome, cidade,
      created_by, created_at, updated_by, updated_at, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'razao_social', 'Cliente'), coalesce(v_rec ->> 'cnpj', ''),
      coalesce(v_rec ->> 'telefone', ''), coalesce(v_rec ->> 'contato_nome', ''),
      v_rec ->> 'cidade', p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id, now(), null
    )
    on conflict (id) do update set
      razao_social = excluded.razao_social, cnpj = excluded.cnpj, telefone = excluded.telefone,
      contato_nome = excluded.contato_nome, cidade = excluded.cidade, updated_by = p_actor_id, deleted_at = null
    where public.clientes_empresas.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'ordens_servico', '[]'::jsonb)) loop
    insert into public.ordens_servico (
      id, empresa_id, numero_os, cliente_empresa_id, cliente_codigo_legado, cliente_nome,
      cliente_telefone, descricao_ferramenta, blade_meters, wood_mm, valor, forma_pagamento,
      status_pagamento, etapa, etapa_atualizada_em, historico_etapas, version, data_vencimento,
      data_pagamento, observacao_financeira, concluida_em, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, v_rec ->> 'numero_os', nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_codigo_legado', ''), coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'cliente_telefone', ''), coalesce(v_rec ->> 'descricao_ferramenta', ''),
      (v_rec ->> 'blade_meters')::numeric, (v_rec ->> 'wood_mm')::int, coalesce((v_rec ->> 'valor')::numeric, 0),
      coalesce(v_rec ->> 'forma_pagamento', 'pix'), coalesce(v_rec ->> 'status_pagamento', 'nao_pago'),
      coalesce(v_rec ->> 'etapa', 'arquivo_recebido'), coalesce(v_rec ->> 'etapa_atualizada_em', ''),
      coalesce(v_rec -> 'historico_etapas', '[]'::jsonb), coalesce((v_rec ->> 'version')::int, 1),
      coalesce((v_rec ->> 'data_vencimento')::date, current_date), nullif(v_rec ->> 'data_pagamento', '')::date,
      v_rec ->> 'observacao_financeira', nullif(v_rec ->> 'concluida_em', '')::timestamptz,
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      numero_os = excluded.numero_os, cliente_empresa_id = excluded.cliente_empresa_id,
      cliente_nome = excluded.cliente_nome, cliente_telefone = excluded.cliente_telefone,
      descricao_ferramenta = excluded.descricao_ferramenta, blade_meters = excluded.blade_meters,
      wood_mm = excluded.wood_mm, valor = excluded.valor, forma_pagamento = excluded.forma_pagamento,
      status_pagamento = excluded.status_pagamento, etapa = excluded.etapa,
      etapa_atualizada_em = excluded.etapa_atualizada_em, historico_etapas = excluded.historico_etapas,
      version = excluded.version + 1, data_vencimento = excluded.data_vencimento,
      data_pagamento = excluded.data_pagamento, observacao_financeira = excluded.observacao_financeira,
      concluida_em = excluded.concluida_em, updated_by = p_actor_id, deleted_at = null
    where public.ordens_servico.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'entregas', '[]'::jsonb)) loop
    insert into public.entregas (
      id, empresa_id, codigo_legado, ordem_id, numero_os, cliente_empresa_id, cliente_nome,
      descricao_ferramenta, metodo, responsavel, despachado_em, observacao,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''),
      nullif(v_rec ->> 'ordem_id', '')::uuid, coalesce(v_rec ->> 'numero_os', ''),
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid, coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'descricao_ferramenta', ''), coalesce(v_rec ->> 'metodo', 'cliente_buscou'),
      coalesce(v_rec ->> 'responsavel', ''), coalesce(v_rec ->> 'despachado_em', ''), v_rec ->> 'observacao',
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      metodo = excluded.metodo, responsavel = excluded.responsavel, despachado_em = excluded.despachado_em,
      observacao = excluded.observacao, updated_by = p_actor_id, deleted_at = null
    where public.entregas.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'retornos', '[]'::jsonb)) loop
    insert into public.retornos (
      id, empresa_id, codigo_legado, ordem_id, numero_os, cliente_empresa_id, cliente_nome,
      descricao_ferramenta, motivo, acao_tecnica, valor_ajuste, status, data_retorno,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''),
      nullif(v_rec ->> 'ordem_id', '')::uuid, coalesce(v_rec ->> 'numero_os', ''),
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid, coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'descricao_ferramenta', ''), coalesce(v_rec ->> 'motivo', ''),
      coalesce(v_rec ->> 'acao_tecnica', ''), coalesce((v_rec ->> 'valor_ajuste')::numeric, 0),
      coalesce(v_rec ->> 'status', 'em_analise'), coalesce(v_rec ->> 'data_retorno', ''),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      motivo = excluded.motivo, acao_tecnica = excluded.acao_tecnica, valor_ajuste = excluded.valor_ajuste,
      status = excluded.status, updated_by = p_actor_id, deleted_at = null
    where public.retornos.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'estoque_itens', '[]'::jsonb)) loop
    insert into public.estoque_itens (
      id, empresa_id, codigo_legado, categoria, nome, quantidade, unidade, estoque_minimo,
      fornecedor, custo_unitario, data_entrada, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'categoria', 'madeiras'), coalesce(v_rec ->> 'nome', 'Material'),
      round(coalesce((v_rec ->> 'quantidade')::numeric, 0)), coalesce(v_rec ->> 'unidade', 'un'),
      round(coalesce((v_rec ->> 'estoque_minimo')::numeric, 0)), coalesce(v_rec ->> 'fornecedor', 'Não informado'),
      coalesce((v_rec ->> 'custo_unitario')::numeric, 0), coalesce((v_rec ->> 'data_entrada')::date, current_date),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      categoria = excluded.categoria, nome = excluded.nome, quantidade = excluded.quantidade, unidade = excluded.unidade,
      estoque_minimo = excluded.estoque_minimo, fornecedor = excluded.fornecedor, custo_unitario = excluded.custo_unitario,
      data_entrada = excluded.data_entrada, updated_by = p_actor_id, deleted_at = null
    where public.estoque_itens.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'despesas', '[]'::jsonb)) loop
    insert into public.despesas (
      id, empresa_id, categoria, descricao, valor, data_competencia, data_vencimento, data_pagamento,
      status, forma_pagamento, fornecedor, observacao, origem_tipo, origem_id, competencia_referencia,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid,
      p_empresa_id,
      (case when (v_rec ->> 'categoria') = 'combustivel' then 'transportes' else coalesce(v_rec ->> 'categoria', 'outros') end)::public.despesa_categoria,
      v_rec ->> 'descricao',
      (v_rec ->> 'valor')::numeric,
      (v_rec ->> 'data_competencia')::date,
      nullif(v_rec ->> 'data_vencimento', '')::date,
      nullif(v_rec ->> 'data_pagamento', '')::date,
      coalesce((v_rec ->> 'status')::public.despesa_status, 'pendente'::public.despesa_status),
      coalesce((v_rec ->> 'forma_pagamento')::public.forma_pagamento_enum, 'pix'::public.forma_pagamento_enum),
      v_rec ->> 'fornecedor',
      v_rec ->> 'observacao',
      nullif(v_rec ->> 'origem_tipo', ''),
      nullif(v_rec ->> 'origem_id', '')::uuid,
      nullif(v_rec ->> 'competencia_referencia', ''),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id,
      null
    )
    on conflict (id) do update set
      categoria = excluded.categoria, descricao = excluded.descricao, valor = excluded.valor,
      data_competencia = excluded.data_competencia, data_vencimento = excluded.data_vencimento, data_pagamento = excluded.data_pagamento,
      status = excluded.status, forma_pagamento = excluded.forma_pagamento, fornecedor = excluded.fornecedor,
      observacao = excluded.observacao, origem_tipo = excluded.origem_tipo, origem_id = excluded.origem_id,
      competencia_referencia = excluded.competencia_referencia, updated_by = p_actor_id, deleted_at = null
    where public.despesas.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'notas', '[]'::jsonb)) loop
    insert into public.notas (
      id, empresa_id, numero, data, data_saida, cliente_empresa_id, cliente_nome, cnpj, inscricao,
      contato, endereco, entregue_por, os_numero, status, criado_por, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, (v_rec ->> 'numero')::int, coalesce((v_rec ->> 'data')::date, current_date),
      nullif(v_rec ->> 'data_saida', '')::date, nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_nome', ''), coalesce(v_rec ->> 'cnpj', ''), v_rec ->> 'inscricao',
      coalesce(v_rec ->> 'contato', ''), v_rec ->> 'endereco', v_rec ->> 'entregue_por', v_rec ->> 'os_numero',
      coalesce(v_rec ->> 'status', 'emitida'), coalesce(v_rec ->> 'criado_por', ''), p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      numero = excluded.numero, data = excluded.data, data_saida = excluded.data_saida,
      cliente_nome = excluded.cliente_nome, cnpj = excluded.cnpj, inscricao = excluded.inscricao,
      contato = excluded.contato, endereco = excluded.endereco, entregue_por = excluded.entregue_por,
      status = excluded.status, updated_by = p_actor_id, deleted_at = null
    where public.notas.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'nota_itens', '[]'::jsonb)) loop
    if exists (
      select 1 from public.notas n
      where n.id = (v_rec ->> 'nota_id')::uuid
        and n.empresa_id = p_empresa_id
    ) then
      insert into public.nota_itens (
        id, empresa_id, nota_id, descricao, quantidade, preco_unitario, created_by, created_at, updated_by, deleted_at
      ) values (
        (v_rec ->> 'id')::uuid, p_empresa_id, (v_rec ->> 'nota_id')::uuid, coalesce(v_rec ->> 'descricao', ''),
        coalesce((v_rec ->> 'quantidade')::numeric, 1), coalesce((v_rec ->> 'preco_unitario')::numeric, 0),
        p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
      )
      on conflict (id) do update set
        descricao = excluded.descricao, quantidade = excluded.quantidade, preco_unitario = excluded.preco_unitario,
        updated_by = p_actor_id, deleted_at = null
      where public.nota_itens.empresa_id = p_empresa_id;
    end if;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'prestadores_servico', '[]'::jsonb)) loop
    insert into public.prestadores_servico (
      id, empresa_id, codigo_legado, nome, servico, valor, forma_pagamento, data_vencimento, status, dia_pagamento,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''), coalesce(v_rec ->> 'nome', ''),
      coalesce(v_rec ->> 'servico', ''), coalesce((v_rec ->> 'valor')::numeric, 0),
      coalesce((v_rec ->> 'forma_pagamento')::public.forma_pagamento_enum, 'pix'::public.forma_pagamento_enum),
      coalesce((v_rec ->> 'data_vencimento')::date, current_date), coalesce(v_rec ->> 'status', 'pendente'),
      nullif(v_rec ->> 'dia_pagamento', '')::int,
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      nome = excluded.nome, servico = excluded.servico, valor = excluded.valor, forma_pagamento = excluded.forma_pagamento,
      data_vencimento = excluded.data_vencimento, status = excluded.status, dia_pagamento = excluded.dia_pagamento,
      updated_by = p_actor_id, deleted_at = null
    where public.prestadores_servico.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'funcionarios_folha', '[]'::jsonb)) loop
    insert into public.funcionarios_folha (
      id, empresa_id, codigo_legado, nome, cargo, salario, data_admissao,
      dia_pagamento, status_pagamento, forma_pagamento, data_pagamento, competencia_paga,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''), coalesce(v_rec ->> 'nome', ''),
      coalesce(v_rec ->> 'cargo', ''), coalesce((v_rec ->> 'salario')::numeric, 0),
      coalesce((v_rec ->> 'data_admissao')::date, current_date),
      coalesce(nullif(v_rec ->> 'dia_pagamento', '')::int, 5),
      coalesce(nullif(v_rec ->> 'status_pagamento', ''), 'pendente'),
      coalesce(nullif(v_rec ->> 'forma_pagamento', ''), 'pix')::public.forma_pagamento_enum,
      nullif(v_rec ->> 'data_pagamento', '')::date,
      nullif(v_rec ->> 'competencia_paga', ''),
      p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      nome = excluded.nome, cargo = excluded.cargo, salario = excluded.salario,
      data_admissao = excluded.data_admissao, dia_pagamento = excluded.dia_pagamento,
      status_pagamento = excluded.status_pagamento, forma_pagamento = excluded.forma_pagamento,
      data_pagamento = excluded.data_pagamento, competencia_paga = excluded.competencia_paga,
      updated_by = p_actor_id, deleted_at = null
    where public.funcionarios_folha.empresa_id = p_empresa_id;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'investimentos', '[]'::jsonb)) loop
    insert into public.investimentos (
      id, empresa_id, codigo_legado, nome_ativo, descricao, tipo_ativo, categoria, data_aplicacao, valor_aplicado, valor_atual,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''), coalesce(v_rec ->> 'nome_ativo', ''),
      v_rec ->> 'descricao', coalesce(v_rec ->> 'tipo_ativo', 'outro'), coalesce(v_rec ->> 'categoria', 'aplicacao'),
      coalesce((v_rec ->> 'data_aplicacao')::date, current_date),
      coalesce((v_rec ->> 'valor_aplicado')::numeric, 0), coalesce((v_rec ->> 'valor_atual')::numeric, 0),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      nome_ativo = excluded.nome_ativo, descricao = excluded.descricao, tipo_ativo = excluded.tipo_ativo,
      categoria = excluded.categoria, data_aplicacao = excluded.data_aplicacao,
      valor_aplicado = excluded.valor_aplicado, valor_atual = excluded.valor_atual, updated_by = p_actor_id, deleted_at = null
    where public.investimentos.empresa_id = p_empresa_id;
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
