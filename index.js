/**
 * dsh-our-free-model — Gemini Dedicated Edition with Integrated Quota Monitor
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchQuota } from './src/quota.js';

export const name = 'our-free-model';
export const inject = ['llm'];
export const version = '2.0.0';

export function apply(ctx, config = {}) {
  const logger = ctx.logger ?? console;

  // 1. Mount Gemini Channel Pack (AccountPool, GeminiAuth, GeminiAdapter, RPC)
  ctx.inject(['credentials', 'commands', 'llm'], scoped => {
    let stopped = false;
    scoped.effect(() => () => { stopped = true; }, 'our-free-model: channel pack');

    void import('./vendor/channel-pack/pack.js').then(pack => {
      if (stopped) return;
      pack.apply(scoped);
      logger.info?.('our-free-model: Gemini channel pack mounted successfully');
    }).catch(error => {
      if (stopped) return;
      logger.warn?.(`our-free-model: Gemini channel pack failed to mount: ${error?.message ?? error}`);
    });
  });

  // 2. Mount WebServer Routes (/api/gemini-quota and settings endpoints)
  ctx.inject(['webServer'], scoped => {
    const server = scoped.webServer;

    // Quota endpoint
    scoped.effect(() => server.register({
      kind: 'prefix',
      path: '/api/gemini-quota',
      handler: async (req, res) => {
        const data = await fetchQuota(req.url?.includes('force=true') || req.method === 'POST');
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify(data));
      }
    }), 'our-free-model: quota api');

    // Settings dashboard endpoints
    scoped.effect(() => server.register({
      kind: 'prefix',
      path: '/api/our-free-model',
      handler: (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const p = url.pathname.replace(/^\/api\/our-free-model/, '') || '/';

        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');

        if (p === '/summary') {
          res.end(JSON.stringify({
            version,
            catalog: [
              { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', channel: 'channels', provider: 'gemini' }
            ],
            available: 1
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
    }), 'our-free-model: dashboard api');

    logger.info?.('our-free-model: web endpoints mounted');
  });
}
