import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getIdentityHeaderObject } from './stealth.js';

const STATE = path.join(os.homedir(), '.dsh/channel-pack/state.json');
const CRED_CANDIDATES = [
  path.join(os.homedir(), '.dsh/.credentials.yaml'),
  path.join(os.homedir(), '.dsh/credentials.yaml'),
  path.join(os.homedir(), '.dsh/profiles/desktop/credentials.yaml')
];
const MODELS_FILE = path.join(os.homedir(), '.dsh/channel-pack/gemini-models.json');
const QUOTA_URL = 'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary';
const MODELS_URL = 'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels';

let cache = null;
let lastFetch = 0;
let inFlight = null;

export const DEFAULT_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: true,
    recommended: true,
    effortOptions: ['low', 'medium', 'high', 'tiered'],
    concreteIds: ['gemini-3.8-flash-low', 'gemini-3.8-flash-medium', 'gemini-3.8-flash-high', 'gemini-3.8-flash-tiered']
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: false,
    recommended: false,
    effortOptions: [],
    concreteIds: ['gemini-3.5-flash']
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: true,
    recommended: false,
    effortOptions: ['low', 'medium', 'high', 'tiered'],
    concreteIds: ['gemini-2.5-pro']
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    supportsImages: true,
    supportsThinking: false,
    recommended: false,
    effortOptions: [],
    concreteIds: ['gemini-2.5-flash']
  }
];

export const getAccounts = () => {
  try {
    return (JSON.parse(fs.readFileSync(STATE, 'utf8')).accounts || []).filter(a => a.provider === 'gemini');
  } catch { return []; }
};

export const getToken = (ref) => {
  for (const credPath of CRED_CANDIDATES) {
    try {
      if (!fs.existsSync(credPath)) continue;
      const txt = fs.readFileSync(credPath, 'utf8');
      const m = txt.match(new RegExp(`${ref}:\\s*['"]?({.+?})['"]?\\s*$`, 'm')) || txt.match(new RegExp(`${ref}:\\s*['"]?({.*?})['"]?`, 's'));
      if (m) {
        const parsed = JSON.parse(m[1].replace(/\n/g, ' '));
        if (parsed?.access_token) return parsed.access_token;
      }
    } catch {}
  }
  return null;
};

export async function fetchOne(token) {
  try {
    const res = await fetch(QUOTA_URL, {
      method: 'POST',
      headers: getIdentityHeaderObject(token),
      body: JSON.stringify({ project: 'aicode-consumers' }),
      signal: AbortSignal.timeout(4500)
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const b = (data?.groups || []).flatMap(g => g?.buckets || []);
    const b5 = b.find(x => x?.bucketId === 'gemini-5h' || x?.bucketType?.includes('HOUR'));
    const bW = b.find(x => x?.bucketId === 'gemini-weekly' || x?.bucketType?.includes('WEEK'));
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
 * Extracts canonical base ID and tier from concrete model identifier
 */
function maskEmail(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/^([a-zA-Z0-9._%+-])[^@]*(@.+)$/, '$1***$2');
}

function extractCanonical(id) {
  const effortTiers = ['extra-low', 'low', 'medium', 'high', 'tiered'];
  for (const tier of effortTiers) {
    if (id.endsWith(`-${tier}`)) {
      return {
        canonicalId: id.slice(0, id.length - tier.length - 1),
        tier
      };
    }
  }
  return { canonicalId: id, tier: null };
}

/**
 * Fetch available models dynamically from Google Cloud Code PA
 * Groups raw upstream tier IDs into unified canonical models
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
  const modelMap = new Map();

  for (const [id, meta] of Object.entries(rawModels)) {
    if (id.startsWith('tab_') || id.startsWith('chat_2') || meta.isInternal) continue;
    
    const { canonicalId, tier } = extractCanonical(id);
    let displayName = meta.displayName || id;
    if (tier) {
      displayName = displayName.replace(/\s*\((Low|Medium|High|Tiered|Extra Low)\)/i, '').trim();
    }

    if (!modelMap.has(canonicalId)) {
      modelMap.set(canonicalId, {
        id: canonicalId,
        name: displayName,
        contextWindow: meta.maxTokens || 1048576,
        maxOutputTokens: meta.maxOutputTokens || 65535,
        supportsImages: Boolean(meta.supportsImages),
        supportsThinking: Boolean(meta.supportsThinking || tier),
        recommended: Boolean(meta.recommended),
        effortOptions: tier ? [tier] : (meta.supportsThinking ? ['low', 'medium', 'high', 'tiered'] : []),
        concreteIds: [id]
      });
    } else {
      const entry = modelMap.get(canonicalId);
      if (tier && !entry.effortOptions.includes(tier)) {
        entry.effortOptions.push(tier);
      }
      if (!entry.concreteIds.includes(id)) {
        entry.concreteIds.push(id);
      }
      if (meta.supportsImages) entry.supportsImages = true;
      if (meta.supportsThinking) entry.supportsThinking = true;
    }
  }

  const discovered = Array.from(modelMap.values()).map(m => {
    // Standardize effort order
    const order = ['low', 'medium', 'high', 'tiered', 'extra-low'];
    m.effortOptions.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return m;
  });

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

/**
 * Concurrent multi-account quota polling via Promise.allSettled
 */
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

      // Parallel concurrent execution for all configured accounts
      const settled = await Promise.allSettled(accs.map(async (a, index) => {
        const token = getToken(a.credentialRef);
        if (!token) {
          return { id: a.id, nickname: maskEmail(a.nickname), enabled: a.enabled, isPrimary: index === 0, ok: false, error: 'no_token' };
        }
        const q = await fetchOne(token);
        return {
          id: a.id,
          nickname: maskEmail(a.nickname),
          enabled: a.enabled,
          isPrimary: index === 0,
          ok: q.ok,
          fiveHour: q.fiveHour,
          weekly: q.weekly,
          error: q.error
        };
      }));

      const results = settled.map((s, idx) => s.status === 'fulfilled' ? s.value : {
        id: accs[idx].id,
        nickname: maskEmail(accs[idx].nickname),
        enabled: accs[idx].enabled,
        isPrimary: idx === 0,
        ok: false,
        error: s.reason?.message || 'timeout'
      });

      const primary = results.find(r => r.ok && r.enabled) || results[0];
      cache = {
        ok: Boolean(primary?.ok),
        enabled: true,
        provider: 'gemini',
        primaryAccountId: primary?.id,
        primaryAccount: maskEmail(primary?.nickname),
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
