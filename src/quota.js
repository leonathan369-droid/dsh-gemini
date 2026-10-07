import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const URL = 'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary';
const CRED = path.join(os.homedir(), '.dsh/.credentials.yaml');
const STATE = path.join(os.homedir(), '.dsh/channel-pack/state.json');
let cache = null, lastFetch = 0, inFlight = null;

export const getAccounts = () => {
  try {
    return (JSON.parse(fs.readFileSync(STATE, 'utf8')).accounts || []).filter(a => a.provider === 'gemini' && a.enabled);
  } catch { return []; }
};

const getToken = (ref, txt) => {
  try {
    const m = txt.match(new RegExp(`${ref}:\\s*['"]?({.+?})['"]?\\s*$`, 'm')) || txt.match(new RegExp(`${ref}:\\s*['"]?({.*?})['"]?`, 's'));
    return m ? JSON.parse(m[1].replace(/\n/g, ' ')).access_token : null;
  } catch { return null; }
};

export async function fetchOne(token) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'antigravity/4.3.0 (cmdc-pak)',
        'x-client-name': 'antigravity'
      },
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
  } catch (e) { return { ok: false, error: String(e?.message || e) }; }
}

async function doFetch(accounts) {
  let txt = '';
  try { txt = fs.readFileSync(CRED, 'utf8'); } catch {}
  const now = Date.now();
  const isLimited = a => Object.values(a.modelRateLimits || {}).some(t => Number(t) > now);
  const primaryId = accounts.find(a => !isLimited(a))?.id || accounts[0]?.id;

  const settled = await Promise.allSettled(accounts.map(async acc => {
    const token = getToken(acc.credentialRef, txt);
    const q = token ? await fetchOne(token) : { ok: false, error: '未授权' };
    return {
      id: acc.id,
      nickname: acc.nickname || acc.id,
      isPrimary: acc.id === primaryId,
      isRateLimited: isLimited(acc),
      ok: q.ok,
      fiveHour: q.fiveHour,
      weekly: q.weekly
    };
  }));

  const list = settled.map((r, i) => r.status === 'fulfilled' ? r.value : {
    id: accounts[i].id, nickname: accounts[i].nickname || accounts[i].id,
    isPrimary: accounts[i].id === primaryId, isRateLimited: false, ok: false
  });

  const primary = list.find(a => a.isPrimary) || list[0];
  lastFetch = Date.now();
  return cache = {
    ok: true, enabled: true, provider: 'gemini',
    sig: JSON.stringify(accounts.map(a => [a.id, a.enabled, a.credentialRef, a.modelRateLimits])),
    primaryAccountId: primary.id, primaryAccount: primary.nickname,
    fiveHour: primary.fiveHour, weekly: primary.weekly,
    accounts: list, fetchedAt: lastFetch
  };
}

export async function fetchQuota(force = false) {
  const accounts = getAccounts();
  if (!accounts.length) { cache = null; return { ok: false, enabled: false, error: '未启用账号' }; }
  const sig = JSON.stringify(accounts.map(a => [a.id, a.enabled, a.credentialRef, a.modelRateLimits]));
  if (cache && cache.sig !== sig) { cache = null; force = true; }
  if (!force && cache && Date.now() - lastFetch < 15000) return cache;
  return inFlight ||= doFetch(accounts).finally(() => { inFlight = null; });
}
