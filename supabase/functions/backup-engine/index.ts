import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { gzipSync, gunzipSync } from "node:zlib";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHEMA_VERSION = 2;
const BACKUP_BUCKET = "facasflow-backups";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function computeSha256Hex(bytes: Uint8Array): Promise<string> {
  const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function gzipCompress(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(gzipSync(bytes));
}

async function gzipDecompress(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(gunzipSync(bytes));
}

function migrateSnapshotPayload(raw: any, targetEmpresaId: string): {
  schema_version: number;
  tables: Record<string, any[]>;
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("Estrutura do arquivo de backup inválida.");
  }

  // V2 canonical structure
  if (raw.schema_version === 2 && raw.tables && typeof raw.tables === "object") {
    return {
      schema_version: 2,
      tables: {
        clientes_empresas: Array.isArray(raw.tables.clientes_empresas) ? raw.tables.clientes_empresas : [],
        ordens_servico: Array.isArray(raw.tables.ordens_servico) ? raw.tables.ordens_servico : [],
        entregas: Array.isArray(raw.tables.entregas) ? raw.tables.entregas : [],
        retornos: Array.isArray(raw.tables.retornos) ? raw.tables.retornos : [],
        estoque_itens: Array.isArray(raw.tables.estoque_itens) ? raw.tables.estoque_itens : [],
        notas: Array.isArray(raw.tables.notas) ? raw.tables.notas : [],
        nota_itens: Array.isArray(raw.tables.nota_itens) ? raw.tables.nota_itens : [],
        despesas: Array.isArray(raw.tables.despesas) ? raw.tables.despesas : [],
        prestadores_servico: Array.isArray(raw.tables.prestadores_servico) ? raw.tables.prestadores_servico : [],
        funcionarios_folha: Array.isArray(raw.tables.funcionarios_folha) ? raw.tables.funcionarios_folha : [],
        investimentos: Array.isArray(raw.tables.investimentos) ? raw.tables.investimentos : [],
      },
    };
  }

  // Migrate V1 / legacy JSON exports into V2 format
  const src = raw.tables || raw;
  const legacyCompanies = Array.isArray(src.companies) ? src.companies : (Array.isArray(src.clientes_empresas) ? src.clientes_empresas : []);
  const legacyOrders = Array.isArray(src.orders) ? src.orders : (Array.isArray(src.ordens_servico) ? src.ordens_servico : []);
  const legacyDeliveries = Array.isArray(src.deliveries) ? src.deliveries : (Array.isArray(src.entregas) ? src.entregas : []);
  const legacyReturns = Array.isArray(src.returns) ? src.returns : (Array.isArray(src.retornos) ? src.retornos : []);
  const legacyStock = Array.isArray(src.stock) ? src.stock : (Array.isArray(src.estoque_itens) ? src.estoque_itens : []);
  const legacyDespesas = Array.isArray(src.despesas) ? src.despesas : [];
  const legacyProviders = Array.isArray(src.serviceProviders) ? src.serviceProviders : (Array.isArray(src.prestadores_servico) ? src.prestadores_servico : []);
  const legacyPayroll = Array.isArray(src.payrollEmployees) ? src.payrollEmployees : (Array.isArray(src.funcionarios_folha) ? src.funcionarios_folha : []);
  const legacyInvestments = Array.isArray(src.investments) ? src.investments : (Array.isArray(src.investimentos) ? src.investimentos : []);

  // Convert legacy monthly expenses map into V2 despesas rows if present
  if (legacyDespesas.length === 0 && Array.isArray(src.expenses)) {
    for (const m of src.expenses) {
      const refMonth = String(m.month || "").slice(0, 7);
      if (!refMonth) continue;
      const compDate = `${refMonth}-01`;
      for (const [cat, val] of Object.entries(m.values || {})) {
        const numVal = Number(val) || 0;
        if (numVal > 0) {
          legacyDespesas.push({
            id: crypto.randomUUID(),
            empresa_id: targetEmpresaId,
            categoria: cat,
            descricao: `Migrado de ${refMonth}`,
            valor: Math.round(numVal * 100) / 100,
            data_competencia: compDate,
            status: "pago",
            forma_pagamento: "pix",
          });
        }
      }
    }
  }

  const ensureUuid = (v: unknown) =>
    typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
      ? v
      : crypto.randomUUID();

  return {
    schema_version: 2,
    tables: {
      clientes_empresas: legacyCompanies.map((c: any) => ({
        id: ensureUuid(c.id),
        codigo_legado: c.codigo_legado || (typeof c.id === "string" ? c.id : ""),
        razao_social: c.razao_social || c.corporateName || "Cliente",
        cnpj: c.cnpj || "",
        telefone: c.telefone || c.phone || "",
        contato_nome: c.contato_nome || c.contactName || "",
        cidade: c.cidade || c.city || null,
      })),
      ordens_servico: legacyOrders.map((o: any, idx: number) => ({
        id: ensureUuid(o.id),
        numero_os: o.numero_os || (typeof o.id === "string" ? o.id : `OS-${String(idx + 1).padStart(3, "0")}`),
        cliente_empresa_id: o.cliente_empresa_id || null,
        cliente_codigo_legado: o.cliente_codigo_legado || o.companyId || "",
        cliente_nome: o.cliente_nome || o.companyName || "Cliente",
        cliente_telefone: o.cliente_telefone || o.companyPhone || "",
        descricao_ferramenta: o.descricao_ferramenta || o.toolDescription || "Faca",
        valor: Number(o.valor ?? o.amount) || 0,
        forma_pagamento: o.forma_pagamento || o.paymentModality || "pix",
        status_pagamento: o.status_pagamento || o.paymentStatus || "a_receber",
        etapa: o.etapa || o.stage || "arquivo_recebido",
        etapa_atualizada_em: o.etapa_atualizada_em || o.stageUpdatedAt || "",
        historico_etapas: o.historico_etapas || o.stageHistory || [],
        version: Number(o.version) || 1,
        data_vencimento: o.data_vencimento || o.dueDate || new Date().toISOString().slice(0, 10),
        data_pagamento: o.data_pagamento || o.paidAt || null,
      })),
      entregas: legacyDeliveries.map((d: any) => ({
        id: ensureUuid(d.id),
        codigo_legado: d.codigo_legado || (typeof d.id === "string" ? d.id : ""),
        ordem_id: d.ordem_id || null,
        numero_os: d.numero_os || d.orderId || "",
        cliente_nome: d.cliente_nome || d.companyName || "",
        descricao_ferramenta: d.descricao_ferramenta || d.toolDescription || "",
        metodo: d.metodo || d.method || "cliente_buscou",
        responsavel: d.responsavel || d.carrierOrPersonName || "",
        despachado_em: d.despachado_em || d.dispatchedAt || "",
        observacao: d.observacao || d.notes || null,
      })),
      retornos: legacyReturns.map((r: any) => ({
        id: ensureUuid(r.id),
        codigo_legado: r.codigo_legado || (typeof r.id === "string" ? r.id : ""),
        ordem_id: r.ordem_id || null,
        numero_os: r.numero_os || r.orderId || "",
        cliente_nome: r.cliente_nome || r.companyName || "",
        descricao_ferramenta: r.descricao_ferramenta || r.toolDescription || "",
        motivo: r.motivo || r.reason || "",
        acao_tecnica: r.acao_tecnica || r.technicalAction || "",
        valor_ajuste: Number(r.valor_ajuste ?? r.adjustmentAmount) || 0,
        status: r.status || "em_analise",
        data_retorno: r.data_retorno || r.createdAt || "",
      })),
      estoque_itens: legacyStock.map((s: any) => ({
        id: ensureUuid(s.id),
        codigo_legado: s.codigo_legado || (typeof s.id === "string" ? s.id : ""),
        categoria: s.categoria || s.category || "madeiras",
        nome: s.nome || s.name || "Material",
        quantidade: Number(s.quantidade ?? s.quantity) || 0,
        unidade: s.unidade || s.unit || "un",
        estoque_minimo: Number(s.estoque_minimo ?? s.minStock) || 0,
        fornecedor: s.fornecedor || s.supplier || "Não informado",
        custo_unitario: Number(s.custo_unitario ?? s.unitCost) || 0,
        data_entrada: s.data_entrada || s.entryDate || new Date().toISOString().slice(0, 10),
      })),
      notas: Array.isArray(src.notas) ? src.notas.map((n: any, idx: number) => ({
        id: ensureUuid(n.id),
        numero: Number(n.numero) || idx + 1,
        data: n.data || new Date().toISOString().slice(0, 10),
        cliente_nome: n.cliente_nome || n.clienteNome || "",
        cnpj: n.cnpj || "",
        contato: n.contato || "",
        endereco: n.endereco || null,
        entregue_por: n.entregue_por || n.entreguePor || null,
        os_numero: n.os_numero || n.osId || null,
        status: n.status || "emitida",
        criado_por: n.criado_por || n.criadoPor || "",
      })) : [],
      nota_itens: Array.isArray(src.nota_itens) ? src.nota_itens : [],
      despesas: legacyDespesas.map((d: any) => ({
        ...d,
        id: ensureUuid(d.id),
        empresa_id: targetEmpresaId,
      })),
      prestadores_servico: legacyProviders.map((p: any) => ({
        id: ensureUuid(p.id),
        codigo_legado: p.codigo_legado || (typeof p.id === "string" ? p.id : ""),
        nome: p.nome || p.name || "",
        servico: p.servico || p.service || "",
        valor: Number(p.valor ?? p.amount) || 0,
        forma_pagamento: p.forma_pagamento || (p.paymentModality === "boleto" ? "boleto_30" : p.paymentModality) || "pix",
        data_vencimento: p.data_vencimento || p.dueDate || new Date().toISOString().slice(0, 10),
        status: p.status || "pendente",
      })),
      funcionarios_folha: legacyPayroll.map((e: any) => ({
        id: ensureUuid(e.id),
        codigo_legado: e.codigo_legado || (typeof e.id === "string" ? e.id : ""),
        nome: e.nome || e.name || "",
        cargo: e.cargo || e.roleTitle || "",
        salario: Number(e.salario ?? e.salary) || 0,
        data_admissao: e.data_admissao || e.admissionDate || new Date().toISOString().slice(0, 10),
      })),
      investimentos: legacyInvestments.map((i: any) => ({
        id: ensureUuid(i.id),
        codigo_legado: i.codigo_legado || (typeof i.id === "string" ? i.id : ""),
        nome_ativo: i.nome_ativo || i.assetName || "",
        tipo_ativo: i.tipo_ativo || i.assetType || "renda_fixa",
        data_aplicacao: i.data_aplicacao || i.appliedDate || new Date().toISOString().slice(0, 10),
        valor_aplicado: Number(i.valor_aplicado ?? i.investedAmount) || 0,
        valor_atual: Number(i.valor_atual ?? i.currentAmount) || 0,
      })),
    },
  };
}

function summarizeTables(tables: Record<string, any[]>): Record<string, number> {
  return {
    clientes_empresas: tables.clientes_empresas?.length || 0,
    ordens_servico: tables.ordens_servico?.length || 0,
    entregas: tables.entregas?.length || 0,
    retornos: tables.retornos?.length || 0,
    estoque_itens: tables.estoque_itens?.length || 0,
    notas: tables.notas?.length || 0,
    nota_itens: tables.nota_itens?.length || 0,
    despesas: tables.despesas?.length || 0,
    prestadores_servico: tables.prestadores_servico?.length || 0,
    funcionarios_folha: tables.funcionarios_folha?.length || 0,
    investimentos: tables.investimentos?.length || 0,
  };
}

async function fetchActiveTables(supabaseAdmin: any, empresaId: string): Promise<Record<string, any[]>> {
  const tableNames = [
    "clientes_empresas",
    "ordens_servico",
    "entregas",
    "retornos",
    "estoque_itens",
    "notas",
    "nota_itens",
    "despesas",
    "prestadores_servico",
    "funcionarios_folha",
    "investimentos",
  ];
  const results = await Promise.all(
    tableNames.map(async (t) => {
      const { data, error } = await supabaseAdmin
        .from(t)
        .select("*")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null);
      if (error) throw new Error(`Erro ao ler ${t}: ${error.message}`);
      return [t, data || []] as const;
    })
  );
  return Object.fromEntries(results);
}

async function applyRetentionPolicy(supabaseAdmin: any, empresaId: string) {
  const { data: cfg } = await supabaseAdmin
    .from("configuracoes_empresa")
    .select("retencao_diaria, retencao_mensal")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  const dailyLimit = Math.max(1, Number(cfg?.retencao_diaria) || 30);
  const monthlyLimit = Math.max(1, Number(cfg?.retencao_mensal) || 12);

  const { data: rows } = await supabaseAdmin
    .from("backups")
    .select("id, tipo, storage_path, created_at, expira_em")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (!rows || rows.length <= 1) return;

  const nowMs = Date.now();
  const mostRecentId = rows[0].id;
  const keepIds = new Set<string>([mostRecentId]);
  const keptMonths = new Set<string>();
  const keptDailyDays = new Set<string>();

  for (const row of rows) {
    if (row.id === mostRecentId) continue;

    if (row.tipo === "pre_restauracao") {
      if (new Date(row.expira_em).getTime() > nowMs) {
        keepIds.add(row.id);
      }
      continue;
    }

    if (row.tipo === "manual" && new Date(row.expira_em).getTime() > nowMs) {
      keepIds.add(row.id);
      continue;
    }

    const dayKey = new Date(row.created_at).toISOString().slice(0, 10);
    if (!keptDailyDays.has(dayKey) && keptDailyDays.size < dailyLimit) {
      keptDailyDays.add(dayKey);
      keepIds.add(row.id);
      continue;
    }

    const monthKey = dayKey.slice(0, 7);
    if (!keptMonths.has(monthKey) && keptMonths.size < monthlyLimit) {
      keptMonths.add(monthKey);
      keepIds.add(row.id);
    }
  }

  const toDelete = rows.filter((r: any) => !keepIds.has(r.id));
  if (toDelete.length === 0) return;

  const paths = toDelete.map((r: any) => r.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(BACKUP_BUCKET).remove(paths);
  }
  await supabaseAdmin
    .from("backups")
    .delete()
    .in("id", toDelete.map((r: any) => r.id));
}

async function generateCompanyBackup(
  supabaseAdmin: any,
  empresaId: string,
  tipo: "automatico" | "manual" | "pre_restauracao",
  criadoPor: string | null,
  debounced = false
) {
  if (debounced && tipo === "automatico") {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("backups")
      .select("id, created_at")
      .eq("empresa_id", empresaId)
      .eq("tipo", "automatico")
      .gte("created_at", oneHourAgo)
      .limit(1);
    if (recent && recent.length > 0) {
      return { skipped: true, reason: "rate_limit_1h" };
    }
  }

  const tables = await fetchActiveTables(supabaseAdmin, empresaId);
  const summary = summarizeTables(tables);
  const generatedAt = new Date().toISOString();
  const snapshotObj = {
    schema_version: SCHEMA_VERSION,
    empresa_id: empresaId,
    generated_at: generatedAt,
    tables,
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(snapshotObj));
  const sha256 = await computeSha256Hex(jsonBytes);
  const gzBytes = await gzipCompress(jsonBytes);
  const stampSlug = generatedAt.replace(/[:.]/g, "-");
  const storagePath = `${empresaId}/${stampSlug}_${tipo}.json.gz`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BACKUP_BUCKET)
    .upload(storagePath, gzBytes, {
      contentType: "application/gzip",
      upsert: false,
    });

  if (uploadErr) {
    await supabaseAdmin.from("backup_logs").insert({
      empresa_id: empresaId,
      tipo,
      status: "erro",
      mensagem: `Falha ao gravar arquivo no Storage: ${uploadErr.message}`,
      executado_por: criadoPor,
    });
    throw new Error(uploadErr.message);
  }

  const daysToExpire = tipo === "pre_restauracao" ? 90 : 30;
  const expiraEm = new Date(Date.now() + daysToExpire * 86400 * 1000).toISOString();

  const { data: backupRow, error: insertErr } = await supabaseAdmin
    .from("backups")
    .insert({
      empresa_id: empresaId,
      tipo,
      schema_version: SCHEMA_VERSION,
      storage_path: storagePath,
      payload: null,
      resumo_tabelas: summary,
      tamanho_bytes: gzBytes.byteLength,
      sha256,
      criado_por: criadoPor,
      expira_em: expiraEm,
    })
    .select("*")
    .single();

  if (insertErr) {
    await supabaseAdmin.storage.from(BACKUP_BUCKET).remove([storagePath]);
    await supabaseAdmin.from("backup_logs").insert({
      empresa_id: empresaId,
      tipo,
      status: "erro",
      mensagem: `Falha ao registrar metadados de backup: ${insertErr.message}`,
      executado_por: criadoPor,
    });
    throw new Error(insertErr.message);
  }

  await supabaseAdmin.from("backup_logs").insert({
    empresa_id: empresaId,
    backup_id: backupRow.id,
    tipo,
    status: "sucesso",
    mensagem: `Snapshot ${tipo} concluído (${gzBytes.byteLength} bytes).`,
    executado_por: criadoPor,
  });

  await applyRetentionPolicy(supabaseAdmin, empresaId);

  return { skipped: false, backup: backupRow };
}

async function readAndVerifyBackupFile(supabaseAdmin: any, backupRow: any) {
  let rawJsonBytes: Uint8Array;

  if (backupRow.storage_path) {
    const { data: fileBlob, error: dlErr } = await supabaseAdmin.storage
      .from(BACKUP_BUCKET)
      .download(backupRow.storage_path);
    if (dlErr || !fileBlob) {
      throw new Error(`Arquivo de backup indisponível: ${dlErr?.message || "não encontrado"}`);
    }
    const gzBytes = new Uint8Array(await fileBlob.arrayBuffer());
    rawJsonBytes = await gzipDecompress(gzBytes);
  } else if (backupRow.payload) {
    rawJsonBytes = new TextEncoder().encode(JSON.stringify(backupRow.payload));
  } else {
    throw new Error("Backup sem conteúdo de armazenamento.");
  }

  const actualSha256 = await computeSha256Hex(rawJsonBytes);
  const integrityOk = actualSha256 === backupRow.sha256;
  const parsed = JSON.parse(new TextDecoder().decode(rawJsonBytes));

  return {
    integrityOk,
    expectedSha256: backupRow.sha256,
    actualSha256,
    parsed,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cronSecret = Deno.env.get("BACKUP_CRON_SECRET") || "";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // Cron / Batch Snapshot across all active companies (isolated per tenant)
    if (action === "snapshot_all") {
      const incomingCron = req.headers.get("x-cron-secret") || "";
      const authHdr = req.headers.get("authorization") || "";
      const isAuthorized =
        (cronSecret && incomingCron === cronSecret) ||
        authHdr === `Bearer ${serviceRoleKey}`;

      if (!isAuthorized) {
        return jsonResponse({ error: "Não autorizado para snapshot global." }, 401);
      }

      const { data: companies } = await supabaseAdmin
        .from("empresas")
        .select("id")
        .eq("ativo", true)
        .is("deleted_at", null);

      const results: Array<{ empresaId: string; status: string; message?: string }> = [];
      for (const comp of companies || []) {
        try {
          const { data: cfg } = await supabaseAdmin
            .from("configuracoes_empresa")
            .select("backup_automatico")
            .eq("empresa_id", comp.id)
            .maybeSingle();
          if (cfg && cfg.backup_automatico === false) {
            results.push({ empresaId: comp.id, status: "skipped_disabled" });
            continue;
          }
          await generateCompanyBackup(supabaseAdmin, comp.id, "automatico", null, false);
          results.push({ empresaId: comp.id, status: "ok" });
        } catch (err: any) {
          results.push({
            empresaId: comp.id,
            status: "error",
            message: err?.message || "Erro desconhecido",
          });
        }
      }

      console.log("snapshot_all finished", { totalCompanies: results.length });
      return jsonResponse({ status: "completed", results });
    }

    // All remaining actions require authenticated Admin user
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ error: "Token de autenticação ausente." }, 401);
    }

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
    }

    const user = authData.user;
    const { data: perfil, error: perfilErr } = await supabaseAdmin
      .from("perfis")
      .select("id, empresa_id, role, ativo, deleted_at")
      .eq("id", user.id)
      .is("deleted_at", null)
      .eq("ativo", true)
      .maybeSingle();

    if (perfilErr || !perfil) {
      return jsonResponse({ error: "Perfil de usuário não encontrado." }, 403);
    }

    if (perfil.role !== "admin") {
      return jsonResponse({ error: "Apenas administradores podem gerenciar backups." }, 403);
    }

    const empresaId = perfil.empresa_id;

    if (action === "snapshot_company") {
      const tipo = body.tipo === "automatico" ? "automatico" : "manual";
      const debounced = Boolean(body.debounced);
      const res = await generateCompanyBackup(supabaseAdmin, empresaId, tipo, user.id, debounced);
      return jsonResponse(res);
    }

    if (action === "signed_url" || action === "download_json") {
      const backupId = String(body.backupId || "");
      const { data: backupRow, error: bErr } = await supabaseAdmin
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (bErr || !backupRow) {
        return jsonResponse({ error: "Backup não encontrado para esta empresa." }, 404);
      }

      if (action === "signed_url" && backupRow.storage_path) {
        const { data: signed, error: sErr } = await supabaseAdmin.storage
          .from(BACKUP_BUCKET)
          .createSignedUrl(backupRow.storage_path, 300);
        if (sErr || !signed?.signedUrl) {
          return jsonResponse({ error: sErr?.message || "Erro ao gerar URL assinada." }, 500);
        }
        return jsonResponse({ signedUrl: signed.signedUrl, expiresInSeconds: 300 });
      }

      const verified = await readAndVerifyBackupFile(supabaseAdmin, backupRow);
      if (!verified.integrityOk) {
        return jsonResponse(
          { error: "Integridade SHA-256 inválida. Download bloqueado." },
          422
        );
      }
      return jsonResponse({
        snapshot: {
          ...verified.parsed,
          sha256: verified.actualSha256,
        },
      });
    }

    if (action === "preview_backup") {
      const backupId = String(body.backupId || "");
      const { data: backupRow } = await supabaseAdmin
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (!backupRow) {
        return jsonResponse({ error: "Backup não encontrado para esta empresa." }, 404);
      }

      const verified = await readAndVerifyBackupFile(supabaseAdmin, backupRow);
      const currentTables = await fetchActiveTables(supabaseAdmin, empresaId);
      const currentCounts = summarizeTables(currentTables);
      let backupCounts = backupRow.resumo_tabelas || {};

      if (verified.integrityOk) {
        const migrated = migrateSnapshotPayload(verified.parsed, empresaId);
        backupCounts = summarizeTables(migrated.tables);
      }

      return jsonResponse({
        backupId: backupRow.id,
        integrityOk: verified.integrityOk,
        expectedSha256: verified.expectedSha256,
        actualSha256: verified.actualSha256,
        schemaVersion: backupRow.schema_version,
        backupCounts,
        currentCounts,
      });
    }

    if (action === "restore_backup") {
      const backupId = String(body.backupId || "");
      const confirmText = String(body.confirmText || "").trim().toUpperCase();
      if (confirmText !== "RESTAURAR") {
        return jsonResponse(
          { error: "Digite RESTAURAR para confirmar a restauração." },
          400
        );
      }

      const { data: backupRow } = await supabaseAdmin
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (!backupRow) {
        return jsonResponse({ error: "Backup não encontrado para esta empresa." }, 404);
      }

      const verified = await readAndVerifyBackupFile(supabaseAdmin, backupRow);
      if (!verified.integrityOk) {
        await supabaseAdmin.from("backup_logs").insert({
          empresa_id: empresaId,
          backup_id: backupRow.id,
          tipo: "pre_restauracao",
          status: "erro",
          mensagem: `Restauração bloqueada: SHA-256 inválido (esperado ${verified.expectedSha256.slice(0, 12)}, obtido ${verified.actualSha256.slice(0, 12)}).`,
          executado_por: user.id,
        });
        return jsonResponse(
          {
            error: `Falha na verificação SHA-256: arquivo corrompido ou adulterado (esperado ${verified.expectedSha256.slice(0, 16)}..., obtido ${verified.actualSha256.slice(0, 16)}...). Restauração bloqueada.`,
          },
          422
        );
      }

      const migrated = migrateSnapshotPayload(verified.parsed, empresaId);
      const preBackupRes = await generateCompanyBackup(
        supabaseAdmin,
        empresaId,
        "pre_restauracao",
        user.id,
        false
      );

      const { data: restoredCounts, error: restoreErr } = await supabaseAdmin.rpc(
        "aplicar_restauracao_empresa",
        {
          p_empresa_id: empresaId,
          p_actor_id: user.id,
          p_snapshot: migrated.tables,
        }
      );

      if (restoreErr) {
        await supabaseAdmin.from("backup_logs").insert({
          empresa_id: empresaId,
          backup_id: backupRow.id,
          tipo: "pre_restauracao",
          status: "erro",
          mensagem: `Erro transacional na restauração: ${restoreErr.message}`,
          executado_por: user.id,
        });
        return jsonResponse({ error: restoreErr.message }, 500);
      }

      await supabaseAdmin.from("backup_logs").insert({
        empresa_id: empresaId,
        backup_id: backupRow.id,
        tipo: "pre_restauracao",
        status: "sucesso",
        mensagem: `Restauração concluída com sucesso (backup prévio criado: ${preBackupRes.backup?.id}).`,
        executado_por: user.id,
      });

      return jsonResponse({
        status: "restored",
        preBackupId: preBackupRes.backup?.id,
        restoredCounts,
      });
    }

    if (action === "import_backup") {
      const confirmText = String(body.confirmText || "").trim().toUpperCase();
      if (confirmText !== "IMPORTAR") {
        return jsonResponse(
          { error: "Digite IMPORTAR para confirmar a substituição dos dados." },
          400
        );
      }
      const rawJson = body.snapshot;
      if (!rawJson || typeof rawJson !== "object") {
        return jsonResponse({ error: "Payload JSON inválido para importação." }, 400);
      }

      // If optional sha256 envelope exists, verify before migrating
      if (rawJson.sha256 && rawJson.tables) {
        const cleanCopy = {
          schema_version: rawJson.schema_version,
          empresa_id: rawJson.empresa_id,
          generated_at: rawJson.generated_at,
          tables: rawJson.tables,
        };
        const digest = await computeSha256Hex(
          new TextEncoder().encode(JSON.stringify(cleanCopy))
        );
        if (digest !== rawJson.sha256) {
          return jsonResponse(
            { error: "Arquivo JSON importado falhou na verificação SHA-256." },
            422
          );
        }
      }

      const migrated = migrateSnapshotPayload(rawJson, empresaId);
      const preBackupRes = await generateCompanyBackup(
        supabaseAdmin,
        empresaId,
        "pre_restauracao",
        user.id,
        false
      );

      const { data: restoredCounts, error: restoreErr } = await supabaseAdmin.rpc(
        "aplicar_restauracao_empresa",
        {
          p_empresa_id: empresaId,
          p_actor_id: user.id,
          p_snapshot: migrated.tables,
        }
      );

      if (restoreErr) {
        return jsonResponse({ error: restoreErr.message }, 500);
      }

      await supabaseAdmin.from("backup_logs").insert({
        empresa_id: empresaId,
        backup_id: preBackupRes.backup?.id,
        tipo: "manual",
        status: "sucesso",
        mensagem: "Importação manual JSON restaurada em transação.",
        executado_por: user.id,
      });

      return jsonResponse({
        status: "imported",
        preBackupId: preBackupRes.backup?.id,
        restoredCounts,
      });
    }

    return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (err: any) {
    console.error("backup-engine error:", err?.message || "unknown");
    return jsonResponse({ error: err?.message || "Erro interno no motor de backup." }, 500);
  }
});
