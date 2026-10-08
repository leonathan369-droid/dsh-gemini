/**
 * DSH Gemini Stealth & Anti-Fingerprint Engine
 * 
 * Manages unique persistent hardware identities, session-level UUIDs,
 * and realistic Google Cloud Code / Antigravity telemetry headers.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const STATE_DIR = path.join(os.homedir(), '.dsh/channel-pack');
const IDENTITY_FILE = path.join(STATE_DIR, 'device-identity.json');

// Session-level RFC4122 v4 UUID, regenerated on each process boot but consistent across requests
let currentSessionId = crypto.randomUUID();

/**
 * Retrieves or generates a persistent device identity hash unique to this machine.
 * Eliminates the static "cmdc-pak" fingerprint shared across all upstream installs.
 */
export function getDeviceIdentity() {
  try {
    if (fs.existsSync(IDENTITY_FILE)) {
      const data = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'));
      if (data && typeof data.machineId === 'string' && data.machineId.length === 64) {
        return data;
      }
    }
  } catch {}

  // Safe machine characteristics resolution for containerized / sandbox environments
  let username = 'user';
  try { username = os.userInfo()?.username || 'user'; } catch {}
  let hostname = 'localhost';
  try { hostname = os.hostname() || 'localhost'; } catch {}
  let platform = 'darwin';
  try { platform = os.platform() || 'darwin'; } catch {}
  let arch = 'arm64';
  try { arch = os.arch() || 'arm64'; } catch {}
  let cpuModel = 'Apple';
  try { cpuModel = os.cpus()?.[0]?.model || 'Apple'; } catch {}

  const seed = [hostname, username, platform, arch, cpuModel].join('|');
  const machineId = crypto.createHash('sha256').update(seed).digest('hex');
  const identity = {
    machineId,
    clientVersion: '4.3.0',
    platform: `${platform}/${arch}`,
    createdAt: Date.now()
  };

  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2) + '\n', 'utf8');
  } catch {}

  return identity;
}

/**
 * Returns current session UUID (simulating real VS Code session ID)
 */
export function getSessionId() {
  return currentSessionId;
}

/**
 * Builds realistic Google Cloud Code / Antigravity request headers
 */
export function getGeminiHeaders(credential, options = {}) {
  const identity = getDeviceIdentity();
  const headers = new Headers();

  if (credential?.access_token) {
    headers.set('Authorization', `Bearer ${credential.access_token}`);
  }
  headers.set('Content-Type', 'application/json');
  headers.set('User-Agent', `antigravity/${identity.clientVersion} (${identity.platform})`);
  headers.set('x-client-name', 'antigravity');
  headers.set('x-client-version', identity.clientVersion);
  headers.set('x-machine-id', identity.machineId);
  headers.set('x-vscode-sessionid', currentSessionId);
  headers.set('x-goog-api-client', 'gl-node/22.19.0 gdcl/1.0.0');
  headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7');

  if (options.includeAccept === true) {
    headers.set('Accept', 'application/json');
  }

  return headers;
}

/**
 * Object representation of identity headers for simple fetch calls
 */
export function getIdentityHeaderObject(token = null) {
  const identity = getDeviceIdentity();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': `antigravity/${identity.clientVersion} (${identity.platform})`,
    'x-client-name': 'antigravity',
    'x-client-version': identity.clientVersion,
    'x-machine-id': identity.machineId,
    'x-vscode-sessionid': currentSessionId,
    'x-goog-api-client': 'gl-node/22.19.0 gdcl/1.0.0',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
