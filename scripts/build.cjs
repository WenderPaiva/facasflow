const fs = require('node:fs');
const path = require('node:path');

const tsPath =
  'C:/Users/wende/AppData/Local/Programs/Antigravity IDE/resources/app/extensions/node_modules/typescript/lib/typescript.js';
const ts = require(tsPath);

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');

const MODULE_FILES = [
  'types/order.ts',
  'utils/financeEngine.ts',
  'data/seedOrders.ts',
  'services/supabaseClient.ts',
  'services/supabaseDataService.ts',
  'services/storageAdapter.ts',
  'services/realtimeEngine.ts',
  'components/AuthLoginScreen.tsx',
  'components/HeaderBar.tsx',
  'components/BentoOverviewSection.tsx',
  'components/CompaniesCrmSection.tsx',
  'components/ProductionKanban.tsx',
  'components/ResponsiveCategoryChart.tsx',
  'components/ExpensesSection.tsx',
  'components/ExpensesSubsection.tsx',
  'components/CollaboratorsSubsection.tsx',
  'components/InvestmentsSubsection.tsx',
  'components/FinanceAnalyticsSection.tsx',
  'components/DeliveriesLogisticsSection.tsx',
  'components/WarrantyReturnsSection.tsx',
  'components/StockSection.tsx',
  'components/NotesSection.tsx',
  'components/TeamManagementSection.tsx',
  'components/SettingsBackupsSection.tsx',
  'components/FastEntryModal.tsx',
  'App.tsx',
  'main.tsx',
];

function normalizeId(relPath) {
  return './' + relPath.replace(/\\/g, '/').replace(/\.(tsx|ts)$/, '');
}

function buildBundle() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const compiledModules = [];

  for (const relFile of MODULE_FILES) {
    const absPath = path.join(SRC_DIR, relFile);
    const sourceCode = fs.readFileSync(absPath, 'utf8');
    const modId = normalizeId(relFile);

    const result = ts.transpileModule(sourceCode, {
      fileName: absPath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        strict: true,
      },
      reportDiagnostics: true,
    });

    if (result.diagnostics && result.diagnostics.length > 0) {
      for (const diag of result.diagnostics) {
        console.error(
          `[TS Error in ${relFile}]:`,
          ts.flattenDiagnosticMessageText(diag.messageText, '\n')
        );
      }
      process.exit(1);
    }

    compiledModules.push({
      id: modId,
      dir: path.posix.dirname(modId),
      code: result.outputText,
    });
  }

  const bundleSource = `// FacasFlow Enterprise (Dark Crimson Bento Edition) - Compiled ESM Bundle
import * as ReactNamespace from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import * as LucideIcons from 'https://esm.sh/lucide-react@0.468.0?deps=react@19.0.0';
import * as SupabaseJs from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const React = ReactNamespace.default || ReactNamespace;
const __externalModules = {
  'react': Object.assign({ default: React }, ReactNamespace),
  'react-dom/client': { createRoot, default: { createRoot } },
  'lucide-react': LucideIcons,
  '@supabase/supabase-js': Object.assign({ default: SupabaseJs }, SupabaseJs)
};

const __moduleFactories = {};
const __moduleCache = {};

function __resolvePath(baseDir, request) {
  if (!request.startsWith('.')) return request;
  const parts = (baseDir + '/' + request).split('/');
  const resolved = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  return './' + resolved.join('/').replace(/\\.(tsx|ts|js)$/, '');
}

function __require(baseDir, request) {
  if (__externalModules[request]) {
    return __externalModules[request];
  }
  const resolvedId = __resolvePath(baseDir, request);
  if (__moduleCache[resolvedId]) {
    return __moduleCache[resolvedId].exports;
  }
  const factory = __moduleFactories[resolvedId];
  if (!factory) {
    throw new Error('Module not found in FacasFlow bundle: ' + request + ' (resolved: ' + resolvedId + ')');
  }
  const moduleObj = { exports: {} };
  __moduleCache[resolvedId] = moduleObj;
  factory(moduleObj, moduleObj.exports, (req) => __require(factory.dir, req));
  return moduleObj.exports;
}

${compiledModules
  .map(
    (m) => `
__moduleFactories[${JSON.stringify(m.id)}] = Object.assign(
  function(module, exports, require) {
${m.code}
  },
  { dir: ${JSON.stringify(m.dir)} }
);`
  )
  .join('\n')}

// Bootstrap main entry
__require('.', './main');
`;

  const outFile = path.join(DIST_DIR, 'facasflow.bundle.js');
  fs.writeFileSync(outFile, bundleSource, 'utf8');

  // Generate dist/index.html & dist/404.html for GitHub Pages (base: '/qualifacas/')
  const rootHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const distHtml = rootHtml.replace(
    'src="./dist/facasflow.bundle.js"',
    'src="./facasflow.bundle.js"'
  );
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), distHtml, 'utf8');
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), distHtml, 'utf8');
  fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '', 'utf8');

  // Build isolated Admin/Engineer Console bundle (never included in facasflow.bundle.js)
  const ADMIN_FILES = [
    'types/order.ts',
    'utils/financeEngine.ts',
    'data/seedOrders.ts',
    'services/supabaseClient.ts',
    'services/storageAdapter.ts',
    'services/realtimeEngine.ts',
    'admin/AdminSystemPanel.tsx',
  ];
  const adminCompiled = ADMIN_FILES.map((relFile) => {
    const absPath = path.join(SRC_DIR, relFile);
    const sourceCode = fs.readFileSync(absPath, 'utf8');
    const modId = normalizeId(relFile);
    const res = ts.transpileModule(sourceCode, {
      fileName: absPath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        strict: true,
      },
      reportDiagnostics: true,
    });
    if (res.diagnostics && res.diagnostics.length > 0) {
      for (const diag of res.diagnostics) {
        console.error(
          `[TS Error in ${relFile}]:`,
          ts.flattenDiagnosticMessageText(diag.messageText, '\n')
        );
      }
      process.exit(1);
    }
    return {
      id: modId,
      dir: path.posix.dirname(modId),
      code: res.outputText,
    };
  });

  const adminBundleSource = `// FacasFlow Admin/Engineer Console - Isolated Bundle
import * as ReactNamespace from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import * as LucideIcons from 'https://esm.sh/lucide-react@0.468.0?deps=react@19.0.0';
import * as SupabaseJs from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const React = ReactNamespace.default || ReactNamespace;
const __externalModules = {
  'react': Object.assign({ default: React }, ReactNamespace),
  'react-dom/client': { createRoot, default: { createRoot } },
  'lucide-react': LucideIcons,
  '@supabase/supabase-js': Object.assign({ default: SupabaseJs }, SupabaseJs)
};

const __moduleFactories = {};
const __moduleCache = {};

function __resolvePath(baseDir, request) {
  if (!request.startsWith('.')) return request;
  const parts = (baseDir + '/' + request).split('/');
  const resolved = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  return './' + resolved.join('/').replace(/\\.(tsx|ts|js)$/, '');
}

function __require(baseDir, request) {
  if (__externalModules[request]) return __externalModules[request];
  const resolvedId = __resolvePath(baseDir, request);
  if (__moduleCache[resolvedId]) return __moduleCache[resolvedId].exports;
  const factory = __moduleFactories[resolvedId];
  if (!factory) {
    throw new Error('Module not found in Admin bundle: ' + request + ' (resolved: ' + resolvedId + ')');
  }
  const moduleObj = { exports: {} };
  __moduleCache[resolvedId] = moduleObj;
  factory(moduleObj, moduleObj.exports, (req) => __require(factory.dir, req));
  return moduleObj.exports;
}

${adminCompiled
  .map(
    (m) => `
__moduleFactories[${JSON.stringify(m.id)}] = Object.assign(
  function(module, exports, require) {
${m.code}
  },
  { dir: ${JSON.stringify(m.dir)} }
);`
  )
  .join('\n')}

__require('.', './admin/AdminSystemPanel');
`;

  fs.writeFileSync(path.join(DIST_DIR, 'admin.bundle.js'), adminBundleSource, 'utf8');
  if (fs.existsSync(path.join(ROOT, 'admin.html'))) {
    const adminHtml = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8').replace(
      'src="./dist/admin.bundle.js"',
      'src="./admin.bundle.js"'
    );
    fs.writeFileSync(path.join(DIST_DIR, 'admin.html'), adminHtml, 'utf8');
  }

  console.log(
    `[FacasFlow Build] Compiled ${compiledModules.length} modules -> dist/index.html, dist/404.html & dist/facasflow.bundle.js (${(
      Buffer.byteLength(bundleSource, 'utf8') / 1024
    ).toFixed(1)} KB)`
  );
}

buildBundle();
