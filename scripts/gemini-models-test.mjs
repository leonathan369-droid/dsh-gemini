import assert from 'node:assert';
import { getDeviceIdentity, getSessionId, getGeminiHeaders } from '../src/stealth.js';
import { getCachedModels } from '../src/quota.js';

async function run() {
  console.log('Testing dsh-gemini Stealth & Dynamic Model Engine...');

  // 1. Device identity & hardware hash test
  const identity = getDeviceIdentity();
  assert(identity.machineId, 'machineId must exist');
  assert.equal(identity.machineId.length, 64, 'machineId must be a 64-character SHA256 hex string');
  assert.notEqual(identity.machineId, 'cmdc-pak', 'machineId must not be static cmdc-pak fingerprint');
  console.log(`ok  stealth machineId verified: ${identity.machineId.slice(0, 16)}...`);

  // 2. Session ID test
  const sessionId = getSessionId();
  assert(sessionId, 'sessionId must exist');
  assert.equal(sessionId.length, 36, 'sessionId must be an RFC4122 v4 UUID');
  assert.notEqual(sessionId, 'proxy', 'sessionId must not be static "proxy"');
  console.log(`ok  session UUID verified: ${sessionId}`);

  // 3. Headers generator test
  const headers = getGeminiHeaders({ access_token: 'test_token' });
  assert.equal(headers.get('Authorization'), 'Bearer test_token');
  assert.equal(headers.get('x-client-name'), 'antigravity');
  assert.equal(headers.get('x-machine-id'), identity.machineId);
  assert.equal(headers.get('x-vscode-sessionid'), sessionId);
  console.log('ok  antigravity stealth headers verified');

  // 4. Cached models test
  const models = getCachedModels();
  assert(Array.isArray(models), 'models must be an array');
  assert(models.length > 0, 'models list must not be empty');
  
  // Verify canonical family grouping
  const flash38 = models.find(m => m.id === 'gemini-3.8-flash');
  assert(flash38, 'Canonical model gemini-3.8-flash must be present');
  assert(flash38.supportsThinking, 'gemini-3.8-flash must support thinking');
  assert(flash38.effortOptions.length > 0, 'gemini-3.8-flash must have effortOptions');
  console.log(`ok  canonical gemini-3.8-flash verified: effortOptions=[${flash38.effortOptions.join(', ')}]`);

  console.log('gemini-models-test: OK');
}

run().catch(err => {
  console.error('gemini-models-test FAILED:', err);
  process.exit(1);
});
