import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getIdentityHeaderObject } from './stealth.js';

const QUOTA_URL = 'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary';
const MODELS_URL = 'https://daily-cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels';
const CRED = path.join(os.homedir(), '.dsh/.credentials.yaml');
const STATE = path.join(os.homedir(), '.dsh/channel-pack/state.json');
const MODELS_FILE = path.join(os.homedir(), '.dsh/channel-pack/gemini-models.json');

let cache = null, lastFetch = 0, inFlight = null;

// Built-in reliable fallbacks if remote discovery has not run yet
export const DEFAULT_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: true,
    recommended: true,
    effortOptions: ['low', 'medium', 'high', 'tiered']
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: false,
    recommended: false
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: true,
    recommended: false
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: false,
    recommended: false
  }
];

export const getAccounts = () => {
  try {
    return (JSON.parse(fs.readFileSync(STATE, 'utf8')).accounts || []).filter(a => a.provider === 'gemini');
  } catch { return []; }
};

export const getToken = (ref) => {
  try {
    const txt = fs.readFileSync(CRED, 'utf8');
    const m = txt.match(new RegExp(`${ref}:\\s*['"]?({.+?})['"]?\\s*$`, 'm')) || txt.match(new RegExp(`${ref}:\\s*['"]?({.*?})['"]?`, 's'));
    return m ? JSON.parse(m[1].replace(/\n/g, ' ')).access_token : null;
  } catch { return null; }
};

export async function fetchOne(token) {
  try {
    const res = await fetch(QUOTA_URL, {
      method: 'POST',
      headers: getIdentityHeaderObject(token),
      body: JSON.stringify({ project: 'aicode-consumers' }),
      signal: AbortSignal.timeout(4500)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const b = (data?.groups || []).flatMap(g => g?.buckets || []);
    const b5 = b.find(x => x?.bucketId === 'gemini-5h');
    const bW = b.find(x => x?.bucketId === 'gemini-weekly');
    return {
      ok: true,
      fiveHour: b5 ? { percent: Math.round((b5.remainingFraction || 0) * 100), resetTime: b5.resetTime } : null,
      weekly: bW ? { percent: Math.round((bW.remainingFraction || 0) * 100), resetTime: bW.resetTime } : null
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch available models dynamically from Google Cloud Code PA
 */
export async function fetchRemoteAvailableModels(token = null) {
  if (!token) {
    const accs = getAccounts().filter(a => a.enabled);
    if (!accs.length) throw new Error('No active Gemini account found');
    token = getToken(accs[0].credentialRef);
    if (!token) throw new Error('Unable to resolve OAuth token');
  }

  const res = await fetch(MODELS_URL, {
    method: 'POST',
    headers: getIdentityHeaderObject(token),
    body: JSON.stringify({ project: 'aicode-consumers' }),
    signal: AbortSignal.timeout(6000)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Cloud Code returned HTTP ${res.status}: ${errText.slice(0, 100)}`);
  }

  const data = await res.json();
  const rawModels = data?.models || {};
  const discovered = [];

  // Filter and extract conversational/coding models, ignore internal tab completion
  for (const [id, meta] of Object.entries(rawModels)) {
    if (id.startsWith('tab_') || id.startsWith('chat_2') || meta.isInternal) continue;
    
    discovered.push({
      id,
      name: meta.displayName || id,
      contextWindow: meta.maxTokens || 1048576,
      maxOutputTokens: meta.maxOutputTokens || 65535,
      supportsImages: Boolean(meta.supportsImages),
      supportsThinking: Boolean(meta.supportsThinking),
      recommended: Boolean(meta.recommended),
      effortOptions: meta.supportsThinking ? ['low', 'medium', 'high', 'tiered'] : []
    });
  }

  // If list came back empty for some reason, preserve defaults
  const finalList = discovered.length > 0 ? discovered : DEFAULT_MODELS;
  saveCachedModels(finalList);
  return finalList;
}

export function getCachedModels() {
  try {
    if (fs.existsSync(MODELS_FILE)) {
      const data = JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  return DEFAULT_MODELS;
}

export function saveCachedModels(models) {
  try {
    fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2) + '\n', 'utf8');
  } catch {}
}

export async function fetchQuota(force = false) {
  const now = Date.now();
  if (!force && cache && (now - lastFetch < 30000)) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const accs = getAccounts();
      if (!accs.length) {
        return { ok: false, error: 'no_account', enabled: false, provider: 'gemini', accounts: [] };
      }

      const results = [];
      for (const a of accs) {
        const token = getToken(a.credentialRef);
        if (!token) {
          results.push({ id: a.id, nickname: a.nickname, enabled: a.enabled, ok: false, error: 'no_token' });
          continue;
        }
        const q = await fetchOne(token);
        results.push({
          id: a.id,
          nickname: a.nickname,
          enabled: a.enabled,
          isPrimary: a.id === accs[0].id,
          ok: q.ok,
          fiveHour: q.fiveHour,
          weekly: q.weekly,
          error: q.error
        });
      }

      const primary = results.find(r => r.ok && r.enabled) || results[0];
      cache = {
        ok: Boolean(primary?.ok),
        enabled: true,
        provider: 'gemini',
        primaryAccountId: primary?.id,
        primaryAccount: primary?.nickname,
        fiveHour: primary?.fiveHour || { percent: 0, resetTime: '' },
        weekly: primary?.weekly || { percent: 0, resetTime: '' },
        accounts: results,
        fetchedAt: Date.now()
      };
      lastFetch = Date.now();
      return cache;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
