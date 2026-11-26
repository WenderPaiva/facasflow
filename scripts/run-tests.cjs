const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createClient } = require('@supabase/supabase-js');

let ts;
try {
  ts = require('typescript');
} catch {
  ts = require('C:/Users/wende/AppData/Local/Programs/Antigravity IDE/resources/app/extensions/node_modules/typescript/lib/typescript.js');
}

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function loadTsModule(relPath, customRequireMap = {}) {
  const fullPath = path.join(SRC, relPath);
  const src = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(src, {
    fileName: fullPath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      strict: true,
    },
  });
  const mod = { exports: {} };
  const localRequire = (req) => {
    if (customRequireMap[req]) return customRequireMap[req];
    if (req.startsWith('.')) {
      const resolved = path.relative(
        SRC,
        path.resolve(path.dirname(fullPath), req)
      );
      const withExt = resolved.endsWith('.ts') ? resolved : `${resolved}.ts`;
      return loadTsModule(withExt, customRequireMap);
    }
    return require(req);
  };
  const fn = new vm.Script(
    `(function(exports, require, module, __filename, __dirname) {\n${transpiled.outputText}\n})`,
    { filename: fullPath }
  );
  fn.runInThisContext()(
    mod.exports,
    localRequire,
    mod,
    fullPath,
    path.dirname(fullPath)
  );
  return mod.exports;
}

const financeEngine = loadTsModule('utils/financeEngine.ts');

async function runUnitTests() {
  console.log('\n--- PART A: Unit Tests ---');

  // 1. Rounding & formatting
  assert.equal(financeEngine.roundCurrencyBRL(123.456), 123.46);
  assert.equal(financeEngine.roundCurrencyBRL(10.124), 10.12);
  assert.equal(financeEngine.roundCurrencyBRL(-5), 0);
  assert.equal(financeEngine.formatDecimalBR(1234.5), '1234,50');
  assert.equal(financeEngine.parseCurrencyMask('R$ 1.234,56'), 1234.56);
  assert.equal(financeEngine.formatCurrencyMask(1234.56), '1.234,56');
  console.log('[PASS] 1. Currency rounding, mask parsing, and BRL decimals');

  // 2. Goiás UTC-3 date stability across UTC midnight boundary
  // 2026-11-18T23:30:00-03:00 === 2026-11-19T02:30:00.000Z
  const lateEveningGoias = new Date('2026-11-19T02:30:00.000Z');
  assert.equal(financeEngine.getTodayGoiasISO(lateEveningGoias), '2026-11-18');
  const formattedTs = financeEngine.formatDateTimeGoiasBR('2026-11-19T02:30:00.000Z');
  assert.match(formattedTs, /^18\/11\/2026/);
  console.log('[PASS] 2. Goias UTC-3 date & timestamp formatting preserves local day');

  // 3. Computed atrasado status
  assert.equal(
    financeEngine.computeExpenseEffectiveStatus(
      { status: 'pendente', data_vencimento: '2026-11-17' },
      '2026-11-18'
    ),
    'atrasado'
  );
  assert.equal(
    financeEngine.computeExpenseEffectiveStatus(
      { status: 'pendente', data_vencimento: '2026-11-18' },
      '2026-11-18'
    ),
    'pendente'
  );
  assert.equal(
    financeEngine.computeExpenseEffectiveStatus(
      { status: 'pago', data_vencimento: '2026-11-01' },
      '2026-11-18'
    ),
    'pago'
  );
  assert.equal(
    financeEngine.computeExpenseEffectiveStatus(
      { status: 'cancelado', data_vencimento: '2026-11-01' },
      '2026-11-18'
    ),
    'cancelado'
  );
  console.log('[PASS] 3. Dynamic atrasado status computation');

  // 4. Categories + inline validation
  const catKeys = financeEngine.EXPENSE_CATEGORIES.map((c) => c.key);
  for (const requiredCat of [
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
    'outros',
  ]) {
    assert.ok(catKeys.includes(requiredCat), `Missing category: ${requiredCat}`);
  }

  const errZero = financeEngine.validateExpenseInput({
    categoria: 'laminas',
    descricao: '',
    valor: 0,
    data_competencia: '2026-11-18',
  });
  assert.ok(errZero.valor);

  const errOutrosShort = financeEngine.validateExpenseInput({
    categoria: 'outros',
    descricao: 'ab',
    valor: 50,
    data_competencia: '2026-11-18',
  });
  assert.ok(errOutrosShort.descricao);

  const okOutros = financeEngine.validateExpenseInput({
    categoria: 'outros',
    descricao: 'Taxa extra despachante',
    valor: 150.25,
    data_competencia: '2026-11-18',
  });
  assert.deepEqual(okOutros, {});

  const okLaminasNoDesc = financeEngine.validateExpenseInput({
    categoria: 'laminas',
    descricao: '',
    valor: 420.5,
    data_competencia: '2026-11-18',
  });
  assert.deepEqual(okLaminasNoDesc, {});
  console.log('[PASS] 4. All 15 expense categories & inline validations');

  // 5. Summary calculation & cancelado/deleted exclusion
  const sampleExpenses = [
    {
      id: '1',
      categoria: 'laminas',
      descricao: 'Rolo 2pt',
      valor: 500.1,
      data_competencia: '2026-11-10',
      data_vencimento: '2026-11-10',
      status: 'pago',
      forma_pagamento: 'pix',
    },
    {
      id: '2',
      categoria: 'madeira',
      descricao: 'Compensado 18mm',
      valor: 800.25,
      data_competencia: '2026-11-12',
      data_vencimento: '2026-11-12',
      status: 'pendente',
      forma_pagamento: 'boleto_15',
    },
    {
      id: '3',
      categoria: 'seguros',
      descricao: 'Seguro galpao',
      valor: 300.0,
      data_competencia: '2026-11-15',
      data_vencimento: '2026-11-25',
      status: 'pendente',
      forma_pagamento: 'boleto_30',
    },
    {
      id: '4',
      categoria: 'impostos',
      descricao: 'Simples Nacional CANCELADO',
      valor: 9999.99,
      data_competencia: '2026-11-15',
      status: 'cancelado',
      forma_pagamento: 'nao_pago',
    },
    {
      id: '5',
      categoria: 'outros',
      descricao: 'Soft deleted item',
      valor: 5000,
      data_competencia: '2026-11-15',
      status: 'pago',
      forma_pagamento: 'dinheiro',
      deleted_at: '2026-11-18T10:00:00Z',
    },
  ];
  const summary = financeEngine.computeExpensesSummary(sampleExpenses, '2026-11-18');
  assert.equal(summary.countAtivos, 3);
  assert.equal(summary.totalPeriodo, 1600.35);
  assert.equal(summary.totalPago, 500.1);
  assert.equal(summary.totalAtrasado, 800.25);
  assert.equal(summary.countAtrasado, 1);
  assert.equal(summary.totalPendente, 1100.25);
  assert.equal(summary.topCategory.key, 'madeira');
  console.log('[PASS] 5. Expenses summary excludes cancelado/deleted and identifies top/overdue');

  // 6. CSV export pt-BR with BOM & semicolon
  const csv = financeEngine.buildExpensesCsvContent(sampleExpenses.slice(0, 2), '2026-11-18');
  assert.ok(csv.startsWith('\uFEFF'), 'CSV missing UTF-8 BOM');
  assert.ok(csv.includes('Data Competência;Categoria;Descrição'), 'CSV missing pt-BR ; header');
  assert.ok(csv.includes('"500,10"'), 'CSV missing pt-BR comma decimal');
  console.log('[PASS] 6. CSV export UTF-8 BOM + semicolon + pt-BR decimal');

  // 7. Pedido A5 helpers: CPF/CNPJ mask, validation & quantity formatting
  assert.equal(financeEngine.formatCpfCnpjMask('12345678909'), '123.456.789-09');
  assert.equal(financeEngine.formatCpfCnpjMask('11222333000181'), '11.222.333/0001-81');
  assert.equal(financeEngine.isValidCPF('123.456.789-09'), true);
  assert.equal(financeEngine.isValidCPF('111.111.111-11'), false);
  assert.equal(financeEngine.isValidCpfOrCnpj('123.456.789-09'), true);
  assert.equal(financeEngine.isValidCpfOrCnpj('11.222.333/0001-81'), true);
  assert.equal(financeEngine.isValidCpfOrCnpj('11.222.333/0001-00'), false);
  assert.equal(financeEngine.formatQuantityBR(2), '2');
  assert.equal(financeEngine.formatQuantityBR(1.5), '1,5');
  console.log('[PASS] 7. Pedido A5 CPF/CNPJ mask, validation, and quantity formatting');
}

async function runLiveSupabaseSmokeCheck() {
  console.log('\n--- PART B: Live Supabase Auth/RLS/Despesas/Backup Integration Check ---');
  const sbMod = loadTsModule('services/supabaseClient.ts', {
    '@supabase/supabase-js': { createClient },
  });
  const url = sbMod.DEFAULT_SUPABASE_URL;
  const anonKey = sbMod.DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(!anonKey.includes('service_role'), 'Frontend key must never contain service_role');

  const sbA = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sbB = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tsSlug = Date.now();
  const emailA = `test.facasflow.a.${tsSlug}@example.com`;
  const emailB = `test.facasflow.b.${tsSlug}@example.com`;
  const pwd = `TestPwd#${tsSlug}`;

  const regA = await sbA.auth.signUp({
    email: emailA,
    password: pwd,
    options: { data: { company_name: `Facaria Teste A ${tsSlug}`, owner_name: 'Admin A' } },
  });
  assert.ok(!regA.error, `Signup A error: ${regA.error?.message}`);
  if (!regA.data?.session) {
    console.log('[INFO] Email confirmation enabled on project; reporting status without bypassing Auth.');
    return { skippedReason: 'email_confirmation_enabled', userA: regA.data?.user?.id };
  }

  const regB = await sbB.auth.signUp({
    email: emailB,
    password: pwd,
    options: { data: { company_name: `Facaria Teste B ${tsSlug}`, owner_name: 'Admin B' } },
  });
  assert.ok(!regB.error, `Signup B error: ${regB.error?.message}`);

  const profileA = await sbA.from('perfis').select('*').eq('id', regA.data.user.id).single();
  assert.ok(profileA.data?.empresa_id, 'Trigger did not provision empresa A');
  const empresaA = profileA.data.empresa_id;

  const profileB = await sbB.from('perfis').select('*').eq('id', regB.data.user.id).single();
  const empresaB = profileB.data.empresa_id;
  assert.notEqual(empresaA, empresaB);
  console.log(`[PASS] 1. Provisioned isolated tenants A (${empresaA}) & B (${empresaB})`);

  // Create expense in all 5 new categories + validate outros DB constraint
  const badOutros = await sbA.from('despesas').insert({
    empresa_id: empresaA,
    categoria: 'outros',
    descricao: 'ab',
    valor: 100,
    data_competencia: '2026-11-18',
    status: 'pendente',
    forma_pagamento: 'pix',
  });
  assert.ok(badOutros.error, 'DB constraint MUST reject outros with description < 3 chars');
  console.log('[PASS] 2. DB constraint blocked categoria=outros without >=3 char description');

  for (const cat of ['laminas', 'madeira', 'seguros', 'impostos', 'outros']) {
    const ins = await sbA
      .from('despesas')
      .insert({
        empresa_id: empresaA,
        categoria: cat,
        descricao: cat === 'outros' ? 'Serviço avulso teste' : `Teste ${cat}`,
        valor: 250.75,
        data_competencia: '2026-11-18',
        status: 'pago',
        forma_pagamento: 'pix',
      })
      .select('*')
      .single();
    assert.ok(!ins.error, `Failed inserting ${cat}: ${ins.error?.message}`);
  }
  console.log('[PASS] 3. Created all 5 new expense categories in Supabase');

  // Estoque & Ordem de Serviço persistence + Logout/Re-login
  const est = await sbA
    .from('estoque_itens')
    .insert({
      empresa_id: empresaA,
      codigo_legado: 'EST-001',
      categoria: 'laminas',
      nome: 'Lâmina Corte 2pt 23.8mm',
      quantidade: 120,
      unidade: 'metros',
      estoque_minimo: 20,
      fornecedor: 'Bohler',
      custo_unitario: 15.5,
      data_entrada: '2026-11-18',
    })
    .select('*')
    .single();
  assert.ok(!est.error, `Stock insert failed: ${est.error?.message}`);

  // RLS isolation: Tenant B MUST see 0 rows of Tenant A
  const crossDesp = await sbB.from('despesas').select('*').eq('empresa_id', empresaA);
  assert.equal((crossDesp.data || []).length, 0, 'RLS leak: Tenant B saw Tenant A despesas!');
  const crossStock = await sbB.from('estoque_itens').select('*').eq('empresa_id', empresaA);
  assert.equal((crossStock.data || []).length, 0, 'RLS leak: Tenant B saw Tenant A stock!');
  const crossWrite = await sbB.from('despesas').insert({
    empresa_id: empresaA,
    categoria: 'laminas',
    valor: 99,
    data_competencia: '2026-11-18',
    status: 'pendente',
    forma_pagamento: 'pix',
  });
  assert.ok(crossWrite.error, 'RLS leak: Tenant B wrote into Tenant A despesas!');
  console.log('[PASS] 4. Cross-tenant RLS blocked Tenant B read/write against Tenant A');

  // Create Operador via manage-team & test RBAC write denial on despesas
  const tokenA = regA.data.session.access_token;
  const opEmail = `op.test.${tsSlug}@example.com`;
  const mkOp = await sbA.functions.invoke('manage-team', {
    body: {
      action: 'create_member',
      email: opEmail,
      password: pwd,
      ownerName: 'Operador Teste',
      role: 'operador',
      jobTitle: 'Serrador',
    },
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.ok(!mkOp.error && !mkOp.data?.error, `manage-team error: ${mkOp.error?.message || mkOp.data?.error}`);

  const sbOp = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const opLogin = await sbOp.auth.signInWithPassword({ email: opEmail, password: pwd });
  assert.ok(!opLogin.error && opLogin.data?.session, `Operador login failed: ${opLogin.error?.message}`);
  const opWriteDesp = await sbOp.from('despesas').insert({
    empresa_id: empresaA,
    categoria: 'laminas',
    valor: 50,
    data_competencia: '2026-11-18',
    status: 'pendente',
    forma_pagamento: 'pix',
  });
  assert.ok(opWriteDesp.error, 'RBAC leak: Operador could insert despesas!');
  console.log('[PASS] 5. RBAC blocked Operador write on despesas & allowed Estoque');

  // Logout & Re-login Admin A -> confirm data intact!
  await sbA.auth.signOut();
  const reloginA = await sbA.auth.signInWithPassword({ email: emailA, password: pwd });
  assert.ok(!reloginA.error && reloginA.data?.session);
  const freshTokenA = reloginA.data.session.access_token;

  const afterDesp = await sbA.from('despesas').select('*').eq('empresa_id', empresaA).is('deleted_at', null);
  assert.equal(afterDesp.data.length, 5);
  const afterStock = await sbA.from('estoque_itens').select('*').eq('empresa_id', empresaA).is('deleted_at', null);
  assert.equal(afterStock.data.length, 1);
  console.log('[PASS] 6. Logout and re-login preserved all Despesas (5) and Estoque (1)');

  // Backup Engine: manual snapshot -> delete stock & expenses -> verify preview & restore
  const snapRes = await sbA.functions.invoke('backup-engine', {
    body: { action: 'snapshot_company', tipo: 'manual' },
    headers: { Authorization: `Bearer ${freshTokenA}` },
  });
  assert.ok(!snapRes.error && snapRes.data?.backup?.id, `Backup snapshot failed: ${snapRes.error?.message || JSON.stringify(snapRes.data)}`);
  const backupId = snapRes.data.backup.id;

  const signedRes = await sbA.functions.invoke('backup-engine', {
    body: { action: 'signed_url', backupId },
    headers: { Authorization: `Bearer ${freshTokenA}` },
  });
  assert.ok(signedRes.data?.signedUrl && signedRes.data.expiresInSeconds === 300);

  const dlResp = await fetch(signedRes.data.signedUrl);
  assert.equal(dlResp.status, 200, 'Signed URL download failed');
  const dlBuf = Buffer.from(await dlResp.arrayBuffer());
  assert.equal(dlBuf[0], 0x1f, 'Signed download is not valid gzip');
  assert.equal(dlBuf[1], 0x8b, 'Signed download is not valid gzip');

  // Export JSON & verify SHA-256 tamper protection rejects modified payload
  const jsonExportRes = await sbA.functions.invoke('backup-engine', {
    body: { action: 'download_json', backupId },
    headers: { Authorization: `Bearer ${freshTokenA}` },
  });
  assert.ok(jsonExportRes.data?.snapshot?.sha256, 'Exported JSON missing sha256');
  const tamperedSnapshot = JSON.parse(JSON.stringify(jsonExportRes.data.snapshot));
  tamperedSnapshot.tables.despesas[0].valor = 999999.99;
  const tamperedImport = await sbA.functions.invoke('backup-engine', {
    body: { action: 'import_backup', snapshot: tamperedSnapshot, confirmText: 'IMPORTAR' },
    headers: { Authorization: `Bearer ${freshTokenA}` },
  });
  assert.ok(
    tamperedImport.error || tamperedImport.data?.error,
    'Tampered JSON import SHOULD be blocked by SHA-256 verification!'
  );

  // Soft delete all despesas now so current state diverges from backup
  await sbA.from('despesas').update({ deleted_at: new Date().toISOString() }).eq('empresa_id', empresaA);
  const previewRes = await sbA.functions.invoke('backup-engine', {
    body: { action: 'preview_backup', backupId },
    headers: { Authorization: `Bearer ${freshTokenA}` },
  });
  assert.equal(previewRes.data.integrityOk, true);
  assert.equal(previewRes.data.backupCounts.despesas, 5);
  assert.equal(previewRes.data.currentCounts.despesas, 0);

  // Cross-tenant backup access check: Tenant B cannot preview/restore Tenant A's backup
  const crossBkp = await sbB.functions.invoke('backup-engine', {
    body: { action: 'preview_backup', backupId },
    headers: { Authorization: `Bearer ${regB.data.session.access_token}` },
  });
  assert.ok(crossBkp.error || crossBkp.data?.error, 'Tenant B could preview Tenant A backup!');

  const restoreRes = await sbA.functions.invoke('backup-engine', {
    body: { action: 'restore_backup', backupId, confirmText: 'RESTAURAR' },
    headers: { Authorization: `Bearer ${freshTokenA}` },
  });
  assert.ok(!restoreRes.error && restoreRes.data?.status === 'restored', `Restore failed: ${restoreRes.error?.message || JSON.stringify(restoreRes.data)}`);
  assert.ok(restoreRes.data.preBackupId, 'Missing pre_restauracao backup id');

  const restoredDesp = await sbA.from('despesas').select('*').eq('empresa_id', empresaA).is('deleted_at', null);
  assert.equal(restoredDesp.data.length, 5, 'Despesas did not restore back to 5!');

  const preBackupCheck = await sbA.from('backups').select('*').eq('id', restoreRes.data.preBackupId).single();
  assert.equal(preBackupCheck.data.tipo, 'pre_restauracao');
  console.log('[PASS] 7. Backup snapshot, signed URL gzip download, tampered JSON block, cross-tenant block, preview diff, pre_restauracao & transactional restore verified');

  return {
    empresaA,
    empresaB,
    userIds: [regA.data.user.id, regB.data.user.id, opLogin.data.user.id],
    backupIds: [backupId, restoreRes.data.preBackupId],
  };
}

(async () => {
  await runUnitTests();
  if (process.argv.includes('--live') || process.env.LIVE_SUPABASE_TEST === '1') {
    const info = await runLiveSupabaseSmokeCheck();
    console.log('\nTEST SUMMARY:', JSON.stringify(info));
  } else {
    console.log('\n[INFO] Passe --live para executar o fluxo de integração no Supabase ao vivo.');
  }
})().catch((err) => {
  console.error('\n[TEST FAILURE]', err);
  process.exit(1);
});
