#!/usr/bin/env node
/**
 * DSH Plugin Switcher & Test Automation Tool
 * 
 * Usage:
 *   node scripts/dsh-plugin-manager.mjs status
 *   node scripts/dsh-plugin-manager.mjs switch dev
 *   node scripts/dsh-plugin-manager.mjs switch stable
 *   node scripts/dsh-plugin-manager.mjs test
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROFILE_DIR = '/Users/leo_nathan/.dsh/profiles/desktop';
const PKG_PATH = path.join(PROFILE_DIR, 'package.json');
const NM_DIR = path.join(PROFILE_DIR, 'node_modules');
const GEMINI_REPO = '/Users/leo_nathan/.dsh/dsh-gemini';

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (e) {
    if (!silent) console.error(`Command failed: ${cmd}\n${e.message}`);
    return null;
  }
}

function runOutput(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getStatus() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  const bundles = pkg.dsh?.profile?.bundles || [];
  const deps = pkg.dependencies || {};

  const isDev = Boolean(deps['dsh-gemini'] && bundles.includes('dsh-gemini'));
  const isStable = Boolean(deps['dsh-our-free-model'] && bundles.includes('dsh-our-free-model'));

  // Get DSH process
  const pid = runOutput("pgrep -f 'DeepSeek Harness Helper \\(Renderer\\)' | head -n 1") ||
              runOutput("pgrep -f 'DeepSeek Harness' | head -n 1");
  const hostPid = runOutput("ps aux | grep -i 'dsh-desktop-host' | grep -v grep | awk '{print $2}' | head -n 1");
  
  let port = '';
  if (hostPid) {
    port = runOutput(`lsof -nP -p ${hostPid} 2>/dev/null | grep LISTEN | awk '{print $9}' | head -n 1 | cut -d: -f2`);
  }

  return {
    mode: isDev ? 'dev (dsh-gemini)' : isStable ? 'stable (dsh-our-free-model + quota)' : 'custom/unknown',
    isDev,
    isStable,
    bundles,
    hostPid: hostPid || 'stopped',
    port: port || 'unknown',
  };
}

function restartDsh() {
  console.log('🔄 Restarting DeepSeek Harness...');
  run("osascript -e 'quit app \"DeepSeek Harness\"' 2>/dev/null || true", true);
  run("sleep 2", true);
  run("pkill -f 'DeepSeek Harness' 2>/dev/null || true", true);
  run("sleep 2", true);
  run("open -a 'DeepSeek Harness'");
  console.log('⏳ Waiting 8s for DSH to boot and mount bundles...');
  run("sleep 8", true);
  console.log('✅ DeepSeek Harness started.');
}

function verifyEndpoint() {
  let status = getStatus();
  // If port not found immediately, retry after 2s
  if (!status.port || status.port === 'unknown') {
    run("sleep 2", true);
    status = getStatus();
  }

  if (status.port && status.port !== 'unknown') {
    console.log(`🌐 Verifying endpoints on port ${status.port}...`);
    
    // 1. Quota API
    const quotaRes = runOutput(`curl -s "http://127.0.0.1:${status.port}/api/gemini/quota"`) ||
                     runOutput(`curl -s "http://127.0.0.1:${status.port}/api/gemini-quota"`);
    try {
      const data = JSON.parse(quotaRes);
      if (data.ok) {
        console.log(`✅ Quota API responding: 5h=${data.fiveHour?.percent}%, weekly=${data.weekly?.percent}%, accounts=${data.accounts?.length}`);
      } else {
        console.log(`⚠️ Quota API returned ok=false: ${quotaRes.slice(0, 100)}`);
      }
    } catch {
      console.log(`⚠️ Quota API response not JSON: ${quotaRes.slice(0, 100)}`);
    }

    // 2. Models API
    const modelsRes = runOutput(`curl -s "http://127.0.0.1:${status.port}/api/gemini/models"`);
    try {
      const data = JSON.parse(modelsRes);
      if (data.ok && Array.isArray(data.models)) {
        console.log(`✅ Models API responding: ${data.models.length} model(s) registered`);
      }
    } catch {}

    // 3. Stealth API
    const stealthRes = runOutput(`curl -s "http://127.0.0.1:${status.port}/api/gemini/stealth"`);
    try {
      const data = JSON.parse(stealthRes);
      if (data.ok) {
        console.log(`✅ Stealth API responding: machineId=${data.machineIdHash}, sessionId=${data.sessionId?.slice(0, 8)}...`);
      }
    } catch {}
  } else {
    console.log('⚠️ DSH host port not detected yet (DSH may still be launching in background).');
  }
}

function switchToDev() {
  console.log('📦 Switching DSH runtime to [DEV: dsh-gemini]...');
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  
  // Backup
  const bakPath = `${PKG_PATH}.bak-auto-${Date.now()}`;
  fs.writeFileSync(bakPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`💾 Backed up package.json to ${bakPath}`);

  // Update dependencies
  delete pkg.dependencies['dsh-our-free-model'];
  delete pkg.dependencies['dsh-gemini-quota'];
  pkg.dependencies['dsh-gemini'] = 'link:../../dsh-gemini';

  // Update bundles
  const bundles = pkg.dsh.profile.bundles.filter(b => b !== 'dsh-our-free-model' && b !== 'dsh-gemini-quota' && b !== 'dsh-gemini');
  bundles.splice(2, 0, 'dsh-gemini');
  pkg.dsh.profile.bundles = bundles;

  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

  // Handle node_modules
  const nmGemini = path.join(NM_DIR, 'dsh-gemini');
  const nmOfm = path.join(NM_DIR, 'dsh-our-free-model');
  const nmQuota = path.join(NM_DIR, 'dsh-gemini-quota');

  if (fs.existsSync(nmOfm) && !fs.existsSync(`${nmOfm}.bak-retired`)) {
    fs.renameSync(nmOfm, `${nmOfm}.bak-retired`);
  }
  if (fs.existsSync(nmQuota) && !fs.existsSync(`${nmQuota}.bak-retired`)) {
    fs.renameSync(nmQuota, `${nmQuota}.bak-retired`);
  }

  if (fs.existsSync(nmGemini)) fs.unlinkSync(nmGemini);
  fs.symlinkSync(GEMINI_REPO, nmGemini);

  console.log('🔗 Linked dsh-gemini in node_modules.');
  restartDsh();
  verifyEndpoint();
}

function switchToStable() {
  console.log('📦 Switching DSH runtime to [STABLE: dsh-our-free-model + quota]...');
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));

  // Backup
  const bakPath = `${PKG_PATH}.bak-auto-${Date.now()}`;
  fs.writeFileSync(bakPath, JSON.stringify(pkg, null, 2) + '\n');

  delete pkg.dependencies['dsh-gemini'];
  pkg.dependencies['dsh-our-free-model'] = '2.0.0';
  pkg.dependencies['dsh-gemini-quota'] = '1.0.0';

  const bundles = pkg.dsh.profile.bundles.filter(b => b !== 'dsh-gemini' && b !== 'dsh-our-free-model' && b !== 'dsh-gemini-quota');
  bundles.splice(2, 0, 'dsh-gemini-quota', 'dsh-our-free-model');
  pkg.dsh.profile.bundles = bundles;

  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

  // Handle node_modules
  const nmGemini = path.join(NM_DIR, 'dsh-gemini');
  const nmOfm = path.join(NM_DIR, 'dsh-our-free-model');
  const nmQuota = path.join(NM_DIR, 'dsh-gemini-quota');

  if (fs.existsSync(nmGemini)) fs.unlinkSync(nmGemini);

  if (!fs.existsSync(nmOfm) && fs.existsSync(`${nmOfm}.bak-retired`)) {
    fs.renameSync(`${nmOfm}.bak-retired`, nmOfm);
  }
  if (!fs.existsSync(nmQuota) && fs.existsSync(`${nmQuota}.bak-retired`)) {
    fs.renameSync(`${nmQuota}.bak-retired`, nmQuota);
  }

  console.log('✅ Restored stable packages in node_modules.');
  restartDsh();
  verifyEndpoint();
}

const action = process.argv[2];
const target = process.argv[3];

if (action === 'status') {
  const status = getStatus();
  console.log('=== DSH Plugin Status ===');
  console.log(`Current Mode : ${status.mode}`);
  console.log(`Host PID     : ${status.hostPid}`);
  console.log(`Web Port     : ${status.port}`);
  console.log(`Bundles      : ${status.bundles.join(', ')}`);
  verifyEndpoint();
} else if (action === 'switch') {
  if (target === 'dev') switchToDev();
  else if (target === 'stable') switchToStable();
  else console.error('Unknown target. Use: dev | stable');
} else if (action === 'restart') {
  restartDsh();
  verifyEndpoint();
} else if (action === 'test') {
  console.log('Running test suites in repo...');
  run(`cd ${GEMINI_REPO} && npm test`);
  verifyEndpoint();
} else {
  console.log('Usage:');
  console.log('  node scripts/dsh-plugin-manager.mjs status');
  console.log('  node scripts/dsh-plugin-manager.mjs switch dev');
  console.log('  node scripts/dsh-plugin-manager.mjs switch stable');
  console.log('  node scripts/dsh-plugin-manager.mjs restart');
  console.log('  node scripts/dsh-plugin-manager.mjs test');
}
