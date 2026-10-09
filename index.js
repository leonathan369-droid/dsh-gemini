/**
 * dsh-gemini — DeepSeek Harness Dedicated Gemini Engine
 * Features:
 *   - Google Cloud Code PA Dynamic Model Discovery
 *   - Hardware Hash & Session Anti-Fingerprint Stealth
 *   - Real-time 5h / Weekly Dual Quota Synchronization
 *   - Multi-Account Auto-Failover & Account Add / Toggle Management
 */
import {
  fetchQuota,
  getCachedModels,
  fetchRemoteAvailableModels,
  getAccounts,
  getRawAccounts,
  toggleAccount,
  deleteAccount,
  persistAddedAccount,
  getToken,
  fetchOne
} from './src/quota.js';
import { getDeviceIdentity, getSessionId } from './src/stealth.js';

export const name = 'dsh-gemini';
export const inject = ['llm'];
export const version = '2.0.0';

export function apply(ctx, config = {}) {
  const logger = ctx.logger ?? console;
  let channelPackModule = null;

  // 1. Mount Gemini Channel Pack (AccountPool, GeminiAuth, GeminiAdapter, RPC)
  ctx.inject(['credentials', 'commands', 'llm'], scoped => {
    let stopped = false;
    scoped.effect(() => () => { stopped = true; }, 'dsh-gemini: channel pack');

    // Prevent redundant port 8326 gateway binding collision with upstream or other plugins
    if (!process.env.DSH_OPENAI_GATEWAY_ENABLED) {
      process.env.DSH_OPENAI_GATEWAY_ENABLED = '0';
    }

    void import('./vendor/channel-pack/pack.js').then(pack => {
      if (stopped) return;
      channelPackModule = pack;
      pack.apply(scoped);
      logger.info?.('dsh-gemini: Gemini channel pack mounted successfully');
    }).catch(error => {
      if (stopped) return;
      logger.warn?.(`dsh-gemini: Gemini channel pack failed to mount: ${error?.message ?? error}`);
    });
  });

  // 2. Mount WebServer Routes (/api/gemini/*, /api/gemini-quota)
  ctx.inject(['webServer'], scoped => {
    const server = scoped.webServer;

    // A. Quota Endpoint (supports both /api/gemini/quota and legacy /api/gemini-quota)
    const handleQuota = async (req, res) => {
      const force = req.url?.includes('force=true') || req.method === 'POST';
      const data = await fetchQuota(force);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(data));
    };

    scoped.effect(() => server.register({
      kind: 'prefix',
      path: '/api/gemini-quota',
      handler: handleQuota
    }), 'dsh-gemini: legacy quota api');

    // Helper: Safely parses request URLs
    const parseUrl = (req) => {
      try { return new URL(req.url ?? '/', 'http://localhost'); }
      catch { return null; }
    };
    // Helper: Safely reads and parses JSON request bodies
    const readJsonBody = async (req, maxBytes = 65536) => new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > maxBytes) reject(new Error('payload_too_large'));
      });
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch { reject(new Error('invalid_json')); }
      });
      req.on('error', reject);
    });

    let lastPingTime = 0;
    let lastPingCache = null;

    // B. Main Gemini API Gateway
    scoped.effect(() => server.register({
      kind: 'prefix',
      path: '/api/gemini',
      handler: async (req, res) => {
        const url = parseUrl(req);
        if (!url) {
          res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'bad_request', message: 'malformed URI' }));
        }
        const p = url.pathname.replace(/^\/api\/gemini\/?/, '').replace(/\/$/, '');

        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');

        // Quota
        if (p === 'quota') return handleQuota(req, res);

        // Models list
        if (p === 'models') {
          const models = getCachedModels();
          return res.end(JSON.stringify({ ok: true, models, count: models.length }));
        }

        // Live fetch models from Google Cloud Code PA
        if (p === 'models/fetch') {
          try {
            const models = await fetchRemoteAvailableModels(null, true);
            return res.end(JSON.stringify({ ok: true, models, count: models.length, fetchedAt: Date.now() }));
          } catch (err) {
            const fallback = getCachedModels();
            return res.end(JSON.stringify({
              ok: false,
              error: String(err?.message || err),
              models: fallback,
              count: fallback.length
            }));
          }
        }

        // Account management: List all raw accounts (including disabled)
        if (p === 'accounts') {
          return res.end(JSON.stringify({ ok: true, accounts: getRawAccounts() }));
        }

        // Account management: Toggle account enabled/disabled
        if (p === 'account/toggle') {
          try {
            const { id, enabled } = await readJsonBody(req);
            const pool = channelPackModule?.getAccountPool();
            const result = toggleAccount(id, enabled);
            try { pool?.reload?.(); } catch {}
            return res.end(JSON.stringify({ ...result, accounts: getRawAccounts() }));
          } catch (err) {
            res.writeHead(400);
            return res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        }

        // Account management: Delete account completely
        if (p === 'account/delete') {
          try {
            const { id } = await readJsonBody(req);
            if (!id) return res.end(JSON.stringify({ ok: false, error: 'missing_account_id' }));
            const pool = channelPackModule?.getAccountPool();
            const result = deleteAccount(id);
            try { pool?.reload?.(); } catch {}
            return res.end(JSON.stringify(result));
          } catch (err) {
            res.writeHead(400);
            return res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        }

        // Account management: Add account via Google OAuth flow
        if (p === 'account/add') {
          try {
            if (!channelPackModule?.startGeminiOAuthFlow) {
              return res.end(JSON.stringify({ ok: false, error: 'OAuth engine not initialized yet' }));
            }
            const started = await channelPackModule.startGeminiOAuthFlow();
            started.result.then(async credential => {
              persistAddedAccount(credential);
              const pool = channelPackModule?.getAccountPool();
              try { pool?.reload?.(); } catch {}
              logger.info?.('[dsh-gemini] Google OAuth account added successfully');
            }).catch(err => {
              logger.warn?.(`[dsh-gemini] Google OAuth failed: ${err?.message || err}`);
            });
            return res.end(JSON.stringify({ ok: true, loginUrl: started.loginUrl }));
          } catch (err) {
            return res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        }

        // Ping / Latency test (with 3s debounce throttle guard to protect against button mashing)
        if (p === 'ping') {
          const now = Date.now();
          if (lastPingCache && (now - lastPingTime < 3000)) {
            return res.end(JSON.stringify(lastPingCache));
          }
          const start = now;
          try {
            const accs = getAccounts().filter(a => a.enabled);
            const token = accs[0] ? getToken(accs[0].credentialRef) : null;
            if (!token) return res.end(JSON.stringify({ ok: false, error: 'no_active_account', latency: 0 }));
            const q = await fetchOne(token);
            const latency = Date.now() - start;
            if (!q.ok) {
              return res.end(JSON.stringify({ ok: false, error: q.error || 'auth_failed', latency }));
            }
            lastPingTime = Date.now();
            lastPingCache = { ok: true, latency, timestamp: lastPingTime };
            return res.end(JSON.stringify(lastPingCache));
          } catch (err) {
            return res.end(JSON.stringify({ ok: false, error: err.message, latency: Date.now() - start }));
          }
        }

        // Stealth identity status
        if (p === 'stealth') {
          const id = getDeviceIdentity();
          return res.end(JSON.stringify({
            ok: true,
            machineIdHash: `${id.machineId.slice(0, 12)}...${id.machineId.slice(-8)}`,
            sessionId: getSessionId(),
            clientVersion: id.clientVersion,
            platform: id.platform
          }));
        }

        // General status
        if (p === 'state') {
          const accounts = getRawAccounts();
          const models = getCachedModels();
          return res.end(JSON.stringify({
            ok: true,
            version,
            accountsCount: accounts.length,
            modelsCount: models.length
          }));
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'not_found', path: p }));
      }
    }), 'dsh-gemini: gemini api');

    

    logger.info?.('dsh-gemini: web endpoints mounted');

    // Background auto-sync latest Google upstream models (best-effort)
    setTimeout(() => { fetchRemoteAvailableModels().catch(() => {}); }, 2000);
  });
}
