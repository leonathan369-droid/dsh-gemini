import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getIdentityHeaderObject, sleepWithJitter } from './stealth.js';

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
const refreshInFlight = new Map();
const accountCooldowns = new Map();

export function isAccountInCooldown(accountId) {
  const cd = accountCooldowns.get(accountId);
  if (!cd) return false;
  if (Date.now() < cd) return true;
  accountCooldowns.delete(accountId);
  return false;
}

export function setAccountCooldown(accountId, cooldownMs = 60000) {
  accountCooldowns.set(accountId, Date.now() + cooldownMs);
}

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
    return (JSON.parse(fs.readFileSync(STATE, 'utf8')).accounts || []).filter(a => a.provider === 'gemini' && a.enabled);
  } catch { return []; }
};

export const getCredential = (ref) => {
  for (const credPath of CRED_CANDIDATES) {
    try {
      if (!fs.existsSync(credPath)) continue;
      const txt = fs.readFileSync(credPath, 'utf8');
      const m = txt.match(new RegExp(`${ref}:\\s*['"]?({.+?})['"]?\\s*$`, 'm')) || txt.match(new RegExp(`${ref}:\\s*['"]?({.*?})['"]?`, 's'));
      if (m) {
        const parsed = JSON.parse(m[1].replace(/\n/g, ' '));
        if (parsed) return parsed;
      }
    } catch {}
  }
  return null;
};

export const getToken = (ref) => getCredential(ref)?.access_token || null;

export function refreshTokenForRef(ref) {
  if (refreshInFlight.has(ref)) {
    return refreshInFlight.get(ref);
  }

  const promise = (async () => {
    for (const credPath of CRED_CANDIDATES) {
      try {
        if (!fs.existsSync(credPath)) continue;
        const txt = fs.readFileSync(credPath, "utf8");
        const m = txt.match(new RegExp(`(${ref}:\\s*['"]?)({.+?})(['"]?\\s*$)`, "m")) || txt.match(new RegExp(`(${ref}:\\s*['"]?)({.*?})(['"]?)`, "s"));
        if (m) {
          const parsed = JSON.parse(m[2].replace(/\n/g, " "));
          if (!parsed?.refresh_token) return null;
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com",
              client_secret: "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",
              refresh_token: parsed.refresh_token,
              grant_type: "refresh_token"
            }),
            signal: AbortSignal.timeout(8000)
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.access_token) {
            parsed.access_token = data.access_token;
            if (data.expires_in) parsed.expiry = new Date(Date.now() + data.expires_in * 1000).toISOString();
            const updated = `${m[1]}${JSON.stringify(parsed)}${m[3]}`;
            fs.writeFileSync(credPath, txt.replace(m[0], updated), "utf8");
            return data.access_token;
          }
        }
      } catch {}
    }
    return null;
  })().finally(() => {
    refreshInFlight.delete(ref);
  });

  refreshInFlight.set(ref, promise);
  return promise;
}

export async function fetchOne(token, project = 'aicode-consumers') {
  try {
    const res = await fetch(QUOTA_URL, {
      method: 'POST',
      headers: getIdentityHeaderObject(token),
      body: JSON.stringify({ project: project || 'aicode-consumers' }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.status === 429) {
      return { ok: false, error: 'HTTP 429', rateLimited: true };
    }
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
const maskEmail = (str) => str || '';

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
  const accounts = getAccounts();
  if (!accounts.length) {
    cache = null;
    return { ok: false, enabled: false, error: '未启用账号', provider: 'gemini', accounts: [] };
  }

  const sig = JSON.stringify(accounts.map(a => [a.id, a.enabled, a.credentialRef, a.modelRateLimits]));
  if (cache && cache.sig !== sig) { cache = null; force = true; }
  if (!force && cache && Date.now() - lastFetch < 15000) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const list = [];
      for (let i = 0; i < accounts.length; i++) {
        const a = accounts[i];
        if (i > 0) {
          // Staggered pacing: 350ms average delay between accounts to eliminate burst spikes
          await sleepWithJitter(300, 100);
        }

        // Check 429 in-memory circuit breaker
        if (!force && isAccountInCooldown(a.id)) {
          const prevAcc = cache?.accounts?.find(acc => acc.id === a.id);
          list.push(prevAcc || {
            id: a.id,
            nickname: maskEmail(a.nickname),
            enabled: true,
            isPrimary: i === 0,
            ok: false,
            error: '429 冷却中 (60s)'
          });
          continue;
        }

        const cred = getCredential(a.credentialRef);
        let token = cred?.access_token || null;
        if (!token) {
          list.push({ id: a.id, nickname: maskEmail(a.nickname), enabled: true, isPrimary: i === 0, ok: false, error: 'no_token' });
          continue;
        }

        // Pre-emptive expiration check (180s buffer)
        if (cred?.expiry) {
          const expiresAt = Date.parse(cred.expiry);
          if (Number.isFinite(expiresAt) && expiresAt - Date.now() < 180000) {
            const fresh = await refreshTokenForRef(a.credentialRef);
            if (fresh) token = fresh;
          }
        }

        // Dynamic project resolution: respect detected companion project or safely fallback
        const targetProject = a.cloudaicompanionProject || cred?.cloudaicompanionProject || 'aicode-consumers';
        let q = await fetchOne(token, targetProject);

        if (q.error === 'HTTP 401') {
          const fresh = await refreshTokenForRef(a.credentialRef);
          if (fresh) {
            token = fresh;
            q = await fetchOne(fresh, targetProject);
          }
        } else if (q.rateLimited || q.error === 'HTTP 429') {
          setAccountCooldown(a.id, 60000);
        }

        list.push({
          id: a.id,
          nickname: maskEmail(a.nickname),
          enabled: true,
          isPrimary: i === 0,
          ok: q.ok,
          fiveHour: q.fiveHour,
          weekly: q.weekly,
          error: q.error
        });
      }

      const primary = list.find(a => a.isPrimary) || list[0];
      lastFetch = Date.now();
      cache = {
        ok: Boolean(primary?.ok),
        enabled: true,
        provider: 'gemini',
        sig,
        primaryAccountId: primary?.id,
        primaryAccount: primary?.nickname,
        fiveHour: primary?.fiveHour || { percent: 0, resetTime: '' },
        weekly: primary?.weekly || { percent: 0, resetTime: '' },
        accounts: list,
        fetchedAt: lastFetch
      };
      return cache;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
export const getRawAccounts = () => {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    return (raw.accounts || []).filter(a => a.provider === 'gemini').map(a => ({
      id: a.id,
      nickname: maskEmail(a.nickname),
      enabled: Boolean(a.enabled),
      credentialRef: a.credentialRef,
      createdAt: a.createdAt,
      expiresAt: a.expiresAt
    }));
  } catch { return []; }
};

export const toggleAccount = (accountId, enabled) => {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    const acc = (raw.accounts || []).find(a => a.id === accountId && a.provider === 'gemini');
    if (acc) {
      acc.enabled = enabled !== undefined ? Boolean(enabled) : !acc.enabled;
      if (!acc.enabled && raw.primaryAccountId === accountId) {
        const next = (raw.accounts || []).find(a => a.provider === 'gemini' && a.enabled && a.id !== accountId);
        raw.primaryAccountId = next ? next.id : null;
      }
      fs.writeFileSync(STATE, JSON.stringify(raw, null, 2) + '\n', 'utf8');
      cache = null;
      lastFetch = 0;
      return { ok: true, account: { ...acc, nickname: maskEmail(acc.nickname) } };
    }
    return { ok: false, error: 'account_not_found' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

export const deleteAccount = (accountId) => {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    const idx = (raw.accounts || []).findIndex(a => a.id === accountId && a.provider === 'gemini');
    if (idx === -1) return { ok: false, error: 'account_not_found' };

    const target = raw.accounts[idx];
    const ref = target.credentialRef;

    // 1. Remove from state.json
    raw.accounts.splice(idx, 1);
    if (raw.primaryAccountId === accountId) {
      const next = raw.accounts.find(a => a.provider === 'gemini' && a.enabled);
      raw.primaryAccountId = next ? next.id : null;
    }
    fs.writeFileSync(STATE, JSON.stringify(raw, null, 2) + '\n', 'utf8');

    // 2. Remove from all credential YAML files using deterministic multiline block regex
    if (ref) {
      const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Matches: ^  <ref>: ... including all continuation lines up to next sibling key or unindented header
      const pattern = new RegExp(`^[ \t]*${escapedRef}:[^\n]*(?:\n(?![ \t]{0,2}[A-Za-z0-9_-]+:)[^\n]*)*\n?`, 'm');
      for (const credPath of CRED_CANDIDATES) {
        if (!fs.existsSync(credPath)) continue;
        const txt = fs.readFileSync(credPath, 'utf8');
        const cleaned = txt.replace(pattern, '');
        if (cleaned !== txt) {
          fs.writeFileSync(credPath, cleaned, 'utf8');
        }
      }
    }

    // 3. Clear memory caches
    cache = null;
    return { ok: true, deletedId: accountId, accounts: getRawAccounts() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

export const persistAddedAccount = (credential, email = null) => {
  try {
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const id = `gemini-${suffix.toLowerCase()}`;
    const refName = `GEMINI_ACCOUNT_${suffix}`;
    const userEmail = email || credential.email || id;

    const credPath = path.join(os.homedir(), '.dsh/.credentials.yaml');
    if (fs.existsSync(credPath)) {
      let credContent = fs.readFileSync(credPath, 'utf8');
      const entry = `  ${refName}: '${JSON.stringify(credential)}'\n`;
      if (credContent.includes('refs:\n')) {
        credContent = credContent.replace('refs:\n', `refs:\n${entry}`);
      } else {
        credContent += `\nrefs:\n${entry}`;
      }
      fs.writeFileSync(credPath, credContent, 'utf8');
    }

    const raw = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { accounts: [] };
    if (!Array.isArray(raw.accounts)) raw.accounts = [];
    raw.accounts.push({
      id,
      provider: 'gemini',
      nickname: userEmail,
      enabled: true,
      credentialRef: refName,
      refreshable: Boolean(credential.refresh_token),
      createdAt: Date.now(),
      expiresAt: credential.expires_in ? Date.now() + credential.expires_in * 1000 : undefined
    });
    fs.writeFileSync(STATE, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    cache = null;
    return { ok: true, accountId: id, email: userEmail };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};
