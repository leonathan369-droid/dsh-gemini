/**
 * dsh-gemini — DeepSeek Harness Dedicated Gemini Engine
 * Features:
 *   - Google Cloud Code PA Dynamic Model Discovery
 *   - Hardware Hash & Session Anti-Fingerprint Stealth
 *   - Real-time 5h / Weekly Dual Quota Synchronization
 *   - Multi-Account Auto-Failover & Account Add / Toggle Management
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  fetchQuota,
  getCachedModels,
  saveCachedModels,
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

  // 2. Mount WebServer Routes (/api/gemini/*, /api/gemini-quota, /api/our-free-model/*)
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

    // B. Main Gemini API Gateway
    scoped.effect(() => server.register({
      kind: 'prefix',
      path: '/api/gemini',
      handler: async (req, res) => {
        let url;
        try {
          url = new URL(req.url ?? '/', 'http://localhost');
        } catch {
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
            const models = await fetchRemoteAvailableModels();
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
            if (pool) {
              try { await pool.updateAccount(id, { enabled: Boolean(enabled) }); } catch {}
            }
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
            if (pool) {
              try { await pool.removeAccount(id); } catch {}
            }
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
              logger.info?.('[dsh-gemini] Google OAuth account added successfully');
            }).catch(err => {
              logger.warn?.(`[dsh-gemini] Google OAuth failed: ${err?.message || err}`);
            });
            return res.end(JSON.stringify({ ok: true, loginUrl: started.loginUrl }));
          } catch (err) {
            return res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        }

        // Ping / Latency test
        if (p === 'ping') {
          const start = Date.now();
          try {
            const accs = getAccounts().filter(a => a.enabled);
            const token = accs[0] ? getToken(accs[0].credentialRef) : null;
            if (token) await fetchOne(token);
            const latency = Date.now() - start;
            return res.end(JSON.stringify({ ok: true, latency, timestamp: Date.now() }));
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

    // C. Backward compatibility for legacy our-free-model callers
    scoped.effect(() => server.register({
      kind: 'prefix',
      path: '/api/our-free-model',
      handler: (req, res) => {
        let url;
        try {
          url = new URL(req.url ?? '/', 'http://localhost');
        } catch {
          res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'bad_request', message: 'malformed URI' }));
        }
        const p = url.pathname.replace(/^\/api\/our-free-model/, '') || '/';

        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');

        const models = getCachedModels();
        if (p === '/summary') {
          res.end(JSON.stringify({
            version,
            catalog: models.map(m => ({ id: m.id, name: m.name, channel: 'channels', provider: 'gemini' })),
            available: models.length
          }));
        } else if (p === '/meta') {
          res.end(JSON.stringify({ version }));
        } else if (p === '/announcement' || p === '/announcements') {
          res.end(JSON.stringify({ acknowledged: true, version: '', unread: 0, announcements: [] }));
        } else if (p === '/stats') {
          res.end(JSON.stringify({ requests: 0, turns: 0, models: [] }));
        } else {
          res.end(JSON.stringify({ ok: true }));
        }
      }
    }), 'dsh-gemini: legacy dashboard api');

    logger.info?.('dsh-gemini: web endpoints mounted');
  });
}
