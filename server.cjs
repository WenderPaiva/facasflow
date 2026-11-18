const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'facasflow-db.json');
const PORT = Number(process.env.PORT) || 4173;

// Ensure bundle is fresh on server startup
try {
  require('./scripts/build.cjs');
} catch (err) {
  console.error('[FacasFlow] Warning during startup build:', err.message);
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const sseClientsByCompany = new Map();

function broadcastSseToCompany(companyId, payload) {
  const clients = sseClientsByCompany.get(companyId);
  if (!clients) return;
  const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
  for (const clientRes of clients) {
    try {
      clientRes.write(dataStr);
    } catch {
      clients.delete(clientRes);
    }
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for REST adapter compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Server-Sent Events (SSE) Realtime Stream per Company
  if (pathname === '/api/realtime' && req.method === 'GET') {
    const rawCompanyId = parsedUrl.searchParams.get('company_id') || 'tenant_qualifacas';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');

    if (!sseClientsByCompany.has(rawCompanyId)) {
      sseClientsByCompany.set(rawCompanyId, new Set());
    }
    sseClientsByCompany.get(rawCompanyId).add(res);

    req.on('close', () => {
      const set = sseClientsByCompany.get(rawCompanyId);
      if (set) set.delete(res);
    });
    return;
  }

  // REST API Adapter Endpoint: /api/orders (Multi-tenant aware + Server-side RBAC)
  if (pathname === '/api/orders') {
    const rawCompanyId = parsedUrl.searchParams.get('company_id') || 'tenant_qualifacas';
    const safeCompanyId = rawCompanyId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const tenantDbFile = path.join(DATA_DIR, `facasflow-db-${safeCompanyId}.json`);
    const reqRole = String(req.headers['x-facasflow-role'] || 'admin').toLowerCase();

    const sanitizeForRole = (dbObj, role) => {
      if (role === 'admin') return dbObj;
      const copy = { ...dbObj };
      delete copy.expenses;
      delete copy.serviceProviders;
      delete copy.payrollEmployees;
      delete copy.investments;
      delete copy.employees;
      if (role === 'cliente') {
        delete copy.stock;
        delete copy.notas;
        delete copy.noteSequence;
      }
      return copy;
    };

    const enforceNotasIntegrity = (incomingDb, existingDb) => {
      if (!Array.isArray(incomingDb.notas)) return incomingDb;
      let seq = Math.max(
        Number(existingDb?.noteSequence) || 0,
        Number(incomingDb.noteSequence) || 0
      );
      const existingMap = new Map(
        (Array.isArray(existingDb?.notas) ? existingDb.notas : []).map((n) => [n.id, n])
      );

      const normalizedNotas = incomingDb.notas.map((n) => {
        const items = (Array.isArray(n.items) ? n.items : []).map((it) => {
          const qtd = Math.max(0, Number(it.quantidade) || 0);
          const unit = Math.max(0, Number(it.precoUnitario) || 0);
          return {
            ...it,
            quantidade: qtd,
            precoUnitario: unit,
            total: Math.round(qtd * unit * 100) / 100,
          };
        });
        const total = Math.round(items.reduce((s, it) => s + it.total, 0) * 100) / 100;
        const prev = existingMap.get(n.id);
        let numero = prev ? Number(prev.numero) : Number(n.numero) || 0;
        if (!prev && (!numero || numero <= seq)) {
          seq += 1;
          numero = seq;
        } else if (numero > seq) {
          seq = numero;
        }
        return { ...n, numero, items, total };
      });

      return { ...incomingDb, notas: normalizedNotas, noteSequence: seq };
    };

    if (req.method === 'GET') {
      if (fs.existsSync(tenantDbFile)) {
        try {
          const raw = fs.readFileSync(tenantDbFile, 'utf8');
          const parsed = JSON.parse(raw);
          const safePayload = sanitizeForRole(parsed, reqRole);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(safePayload));
          return;
        } catch {
          // fallback
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ company_id: rawCompanyId, orders: [] }));
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      if (reqRole === 'cliente') {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Forbidden: cliente role is read-only' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const clientId = String(req.headers['x-facasflow-client-id'] || '');
          const parsed = JSON.parse(body);
          const existing = fs.existsSync(tenantDbFile)
            ? JSON.parse(fs.readFileSync(tenantDbFile, 'utf8'))
            : null;
          let payloadToSave = enforceNotasIntegrity(parsed, existing);

          // Server-side monotonic version guard for orders to reject stale overwrites
          if (existing && Array.isArray(existing.orders) && Array.isArray(payloadToSave.orders)) {
            const existingOrderMap = new Map(existing.orders.map((o) => [o.id, o]));
            payloadToSave.orders = payloadToSave.orders.map((inc) => {
              const prev = existingOrderMap.get(inc.id);
              if (prev && (Number(prev.version) || 1) > (Number(inc.version) || 1)) {
                return prev;
              }
              return {
                ...inc,
                version: Number(inc.version) || 1,
                updatedAt: inc.updatedAt || new Date().toISOString(),
              };
            });
          }

          // Server-side RBAC: Operador cannot overwrite sensitive financial/admin collections
          if (reqRole === 'operador' && existing) {
            payloadToSave = {
              ...existing,
              orders: Array.isArray(payloadToSave.orders) ? payloadToSave.orders : existing.orders,
              deliveries: Array.isArray(payloadToSave.deliveries) ? payloadToSave.deliveries : existing.deliveries,
              returns: Array.isArray(payloadToSave.returns) ? payloadToSave.returns : existing.returns,
              stock: Array.isArray(payloadToSave.stock) ? payloadToSave.stock : existing.stock,
              notas: Array.isArray(payloadToSave.notas) ? payloadToSave.notas : existing.notas,
              noteSequence: payloadToSave.noteSequence ?? existing.noteSequence,
            };
          }

          fs.writeFileSync(tenantDbFile, JSON.stringify(payloadToSave, null, 2), 'utf8');
          broadcastSseToCompany(rawCompanyId, {
            eventId: `sse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            senderInstanceId: clientId,
            company_id: rawCompanyId,
            section: 'all',
            actionLabel: '',
            actorName: '',
            actorRole: reqRole === 'operador' ? 'operador' : 'admin',
            timestamp: new Date().toISOString(),
            db: sanitizeForRole(payloadToSave, reqRole),
          });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ status: 'ok', company_id: rawCompanyId, savedAt: new Date().toISOString() }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  // Atomic Single-Card Stage Move Endpoint: POST /api/orders/move (mirrors RPC mover_faca)
  if (pathname === '/api/orders/move' && req.method === 'POST') {
    const rawCompanyId = parsedUrl.searchParams.get('company_id') || 'tenant_qualifacas';
    const safeCompanyId = rawCompanyId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const tenantDbFile = path.join(DATA_DIR, `facasflow-db-${safeCompanyId}.json`);
    const reqRole = String(req.headers['x-facasflow-role'] || 'admin').toLowerCase();
    const clientId = String(req.headers['x-facasflow-client-id'] || '');

    if (reqRole === 'cliente') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const { orderId, stage, stageUpdatedAt } = JSON.parse(body);
        if (!orderId || !stage) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'orderId and stage required' }));
          return;
        }
        const existing = fs.existsSync(tenantDbFile)
          ? JSON.parse(fs.readFileSync(tenantDbFile, 'utf8'))
          : { company_id: rawCompanyId, orders: [] };
        let movedOrder = null;
        const nowIso = new Date().toISOString();
        const nextOrders = (existing.orders || []).map((o) => {
          if (o.id !== orderId) return o;
          const nextVer = (Number(o.version) || 1) + 1;
          movedOrder = {
            ...o,
            stage,
            stageUpdatedAt: stageUpdatedAt || o.stageUpdatedAt,
            stageHistory: [
              ...(o.stageHistory || []),
              { stage, timestamp: stageUpdatedAt || nowIso },
            ],
            version: nextVer,
            updatedAt: nowIso,
          };
          return movedOrder;
        });

        if (!movedOrder) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Order not found' }));
          return;
        }

        const nextDb = { ...existing, orders: nextOrders };
        fs.writeFileSync(tenantDbFile, JSON.stringify(nextDb, null, 2), 'utf8');
        broadcastSseToCompany(rawCompanyId, {
          eventId: `sse_move_${movedOrder.id}_v${movedOrder.version}_${Date.now()}`,
          senderInstanceId: clientId,
          company_id: rawCompanyId,
          section: 'esteira',
          actionLabel: '',
          actorName: '',
          actorRole: reqRole === 'operador' ? 'operador' : 'admin',
          timestamp: nowIso,
          order: movedOrder,
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'ok', order: movedOrder }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Static file serving
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, 'index.html');
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`  FACASFLOW OS & FINANCE ENGINE (QUALIFACAS EDITION)`);
  console.log(`  Servidor Local Ativo: http://localhost:${PORT}`);
  console.log(`  Banco em Disco (OneDrive): ${DB_FILE}`);
  console.log(`=============================================================\n`);
});
