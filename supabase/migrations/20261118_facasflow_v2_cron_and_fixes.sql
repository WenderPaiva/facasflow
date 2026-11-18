-- Indexes for remaining foreign keys & pg_cron + pg_net daily backup schedule
create index if not exists idx_backup_logs_backup_id on public.backup_logs (backup_id);
create index if not exists idx_backups_criado_por on public.backups (criado_por);
create index if not exists idx_nota_itens_empresa_id on public.nota_itens (empresa_id) where deleted_at is null;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Allow restoring soft-deleted notas without numero collisions
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
      where empresa_id = new.empresa_id and deleted_at is null and numero > 0;
    end if;
    new.total := 0;
  elsif tg_op = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is null then
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

-- Safe transactional restore (releases unique slots on soft-deleted rows not in snapshot)
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
      contato_nome = excluded.contato_nome, cidade = excluded.cidade, updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'ordens_servico', '[]'::jsonb)) loop
    insert into public.ordens_servico (
      id, empresa_id, numero_os, cliente_empresa_id, cliente_codigo_legado, cliente_nome,
      cliente_telefone, descricao_ferramenta, blade_meters, wood_mm, valor, forma_pagamento,
      status_pagamento, etapa, etapa_atualizada_em, historico_etapas, version, data_vencimento,
      data_pagamento, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, v_rec ->> 'numero_os', nullif(v_rec ->> 'cliente_empresa_id', '')::uuid,
      coalesce(v_rec ->> 'cliente_codigo_legado', ''), coalesce(v_rec ->> 'cliente_nome', ''),
      coalesce(v_rec ->> 'cliente_telefone', ''), coalesce(v_rec ->> 'descricao_ferramenta', ''),
      (v_rec ->> 'blade_meters')::numeric, (v_rec ->> 'wood_mm')::int, coalesce((v_rec ->> 'valor')::numeric, 0),
      coalesce(v_rec ->> 'forma_pagamento', 'pix'), coalesce(v_rec ->> 'status_pagamento', 'a_receber'),
      coalesce(v_rec ->> 'etapa', 'arquivo_recebido'), coalesce(v_rec ->> 'etapa_atualizada_em', ''),
      coalesce(v_rec -> 'historico_etapas', '[]'::jsonb), coalesce((v_rec ->> 'version')::int, 1),
      coalesce((v_rec ->> 'data_vencimento')::date, current_date), nullif(v_rec ->> 'data_pagamento', '')::date,
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      numero_os = excluded.numero_os, cliente_empresa_id = excluded.cliente_empresa_id,
      cliente_nome = excluded.cliente_nome, descricao_ferramenta = excluded.descricao_ferramenta,
      valor = excluded.valor, forma_pagamento = excluded.forma_pagamento, status_pagamento = excluded.status_pagamento,
      etapa = excluded.etapa, etapa_atualizada_em = excluded.etapa_atualizada_em, historico_etapas = excluded.historico_etapas,
      version = excluded.version + 1, data_vencimento = excluded.data_vencimento, data_pagamento = excluded.data_pagamento,
      updated_by = p_actor_id, deleted_at = null;
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
      observacao = excluded.observacao, updated_by = p_actor_id, deleted_at = null;
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
      status = excluded.status, updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'estoque_itens', '[]'::jsonb)) loop
    insert into public.estoque_itens (
      id, empresa_id, codigo_legado, categoria, nome, quantidade, unidade, estoque_minimo,
      fornecedor, custo_unitario, data_entrada, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''),
      coalesce(v_rec ->> 'categoria', 'madeiras'), coalesce(v_rec ->> 'nome', 'Material'),
      coalesce((v_rec ->> 'quantidade')::numeric, 0), coalesce(v_rec ->> 'unidade', 'un'),
      coalesce((v_rec ->> 'estoque_minimo')::numeric, 0), coalesce(v_rec ->> 'fornecedor', 'Não informado'),
      coalesce((v_rec ->> 'custo_unitario')::numeric, 0), coalesce((v_rec ->> 'data_entrada')::date, current_date),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      categoria = excluded.categoria, nome = excluded.nome, quantidade = excluded.quantidade, unidade = excluded.unidade,
      estoque_minimo = excluded.estoque_minimo, fornecedor = excluded.fornecedor, custo_unitario = excluded.custo_unitario,
      data_entrada = excluded.data_entrada, updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'despesas', '[]'::jsonb)) loop
    insert into public.despesas (
      id, empresa_id, categoria, descricao, valor, data_competencia, data_vencimento, data_pagamento,
      status, forma_pagamento, fornecedor, observacao, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, (v_rec ->> 'categoria')::public.despesa_categoria, v_rec ->> 'descricao',
      (v_rec ->> 'valor')::numeric, (v_rec ->> 'data_competencia')::date, nullif(v_rec ->> 'data_vencimento', '')::date,
      nullif(v_rec ->> 'data_pagamento', '')::date, coalesce((v_rec ->> 'status')::public.despesa_status, 'pendente'::public.despesa_status),
      coalesce((v_rec ->> 'forma_pagamento')::public.forma_pagamento_enum, 'pix'::public.forma_pagamento_enum),
      v_rec ->> 'fornecedor', v_rec ->> 'observacao', p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()),
      p_actor_id, null
    )
    on conflict (id) do update set
      categoria = excluded.categoria, descricao = excluded.descricao, valor = excluded.valor,
      data_competencia = excluded.data_competencia, data_vencimento = excluded.data_vencimento, data_pagamento = excluded.data_pagamento,
      status = excluded.status, forma_pagamento = excluded.forma_pagamento, fornecedor = excluded.fornecedor,
      observacao = excluded.observacao, updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'notas', '[]'::jsonb)) loop
    insert into public.notas (
      id, empresa_id, numero, data, cliente_empresa_id, cliente_nome, cnpj, contato, endereco,
      entregue_por, os_numero, status, criado_por, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, (v_rec ->> 'numero')::int, coalesce((v_rec ->> 'data')::date, current_date),
      nullif(v_rec ->> 'cliente_empresa_id', '')::uuid, coalesce(v_rec ->> 'cliente_nome', ''), coalesce(v_rec ->> 'cnpj', ''),
      coalesce(v_rec ->> 'contato', ''), v_rec ->> 'endereco', v_rec ->> 'entregue_por', v_rec ->> 'os_numero',
      coalesce(v_rec ->> 'status', 'emitida'), coalesce(v_rec ->> 'criado_por', ''), p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      numero = excluded.numero, data = excluded.data, cliente_nome = excluded.cliente_nome, cnpj = excluded.cnpj, contato = excluded.contato,
      endereco = excluded.endereco, entregue_por = excluded.entregue_por, status = excluded.status,
      updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'nota_itens', '[]'::jsonb)) loop
    insert into public.nota_itens (
      id, empresa_id, nota_id, descricao, quantidade, preco_unitario, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, (v_rec ->> 'nota_id')::uuid, coalesce(v_rec ->> 'descricao', ''),
      coalesce((v_rec ->> 'quantidade')::numeric, 1), coalesce((v_rec ->> 'preco_unitario')::numeric, 0),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      descricao = excluded.descricao, quantidade = excluded.quantidade, preco_unitario = excluded.preco_unitario,
      updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'prestadores_servico', '[]'::jsonb)) loop
    insert into public.prestadores_servico (
      id, empresa_id, codigo_legado, nome, servico, valor, forma_pagamento, data_vencimento, status,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''), coalesce(v_rec ->> 'nome', ''),
      coalesce(v_rec ->> 'servico', ''), coalesce((v_rec ->> 'valor')::numeric, 0),
      coalesce((v_rec ->> 'forma_pagamento')::public.forma_pagamento_enum, 'pix'::public.forma_pagamento_enum),
      coalesce((v_rec ->> 'data_vencimento')::date, current_date), coalesce(v_rec ->> 'status', 'pendente'),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      nome = excluded.nome, servico = excluded.servico, valor = excluded.valor, forma_pagamento = excluded.forma_pagamento,
      data_vencimento = excluded.data_vencimento, status = excluded.status, updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'funcionarios_folha', '[]'::jsonb)) loop
    insert into public.funcionarios_folha (
      id, empresa_id, codigo_legado, nome, cargo, salario, data_admissao, created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''), coalesce(v_rec ->> 'nome', ''),
      coalesce(v_rec ->> 'cargo', ''), coalesce((v_rec ->> 'salario')::numeric, 0),
      coalesce((v_rec ->> 'data_admissao')::date, current_date), p_actor_id,
      coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      nome = excluded.nome, cargo = excluded.cargo, salario = excluded.salario,
      data_admissao = excluded.data_admissao, updated_by = p_actor_id, deleted_at = null;
  end loop;

  for v_rec in select * from jsonb_array_elements(coalesce(p_snapshot -> 'investimentos', '[]'::jsonb)) loop
    insert into public.investimentos (
      id, empresa_id, codigo_legado, nome_ativo, tipo_ativo, data_aplicacao, valor_aplicado, valor_atual,
      created_by, created_at, updated_by, deleted_at
    ) values (
      (v_rec ->> 'id')::uuid, p_empresa_id, coalesce(v_rec ->> 'codigo_legado', ''), coalesce(v_rec ->> 'nome_ativo', ''),
      coalesce(v_rec ->> 'tipo_ativo', 'renda_fixa'), coalesce((v_rec ->> 'data_aplicacao')::date, current_date),
      coalesce((v_rec ->> 'valor_aplicado')::numeric, 0), coalesce((v_rec ->> 'valor_atual')::numeric, 0),
      p_actor_id, coalesce((v_rec ->> 'created_at')::timestamptz, now()), p_actor_id, null
    )
    on conflict (id) do update set
      nome_ativo = excluded.nome_ativo, tipo_ativo = excluded.tipo_ativo, data_aplicacao = excluded.data_aplicacao,
      valor_aplicado = excluded.valor_aplicado, valor_atual = excluded.valor_atual, updated_by = p_actor_id, deleted_at = null;
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

-- Agendamento diário às 03:00 UTC (00:00 BRT Goiás) via pg_cron + pg_net usando Supabase Vault
-- Obs.: Crie o segredo BACKUP_CRON_SECRET nas Edge Function Secrets e execute:
-- select vault.create_secret('<SEU_BACKUP_CRON_SECRET>', 'backup_cron_secret');
select vault.create_secret('https://apnityirmkfuuokcpbpm.supabase.co', 'project_url')
where not exists (select 1 from vault.secrets where name = 'project_url');

select cron.schedule(
  'facasflow-daily-backup',
  '0 3 * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url' limit 1) || '/functions/v1/backup-engine',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'backup_cron_secret' limit 1), '')
      ),
      body := '{"action":"snapshot_all"}'::jsonb
    ) as request_id;
  $$
);
