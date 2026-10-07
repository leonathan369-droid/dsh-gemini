/**
 * Run test suites for dsh-gemini.
 *
 *     node scripts/test-all.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));

const suites = [
  ['client-lint', 'client-lint.mjs', []],
  ['sanitize', 'sanitize-test.mjs', []],
  ['gemini-quota', 'gemini-quota-test.mjs', []],
];

const SUITE_TIMEOUT_MS = 30_000;

function runSuite(script, args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(scriptsDir, script), ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let forceKillTimer;
    let spawnError = null;
    const started = Date.now();
    const forward = (stream, chunk) => {
      const text = chunk.toString();
      stream === 'stdout' ? stdout += text : stderr += text;
      process[stream].write(text);
    };
    child.stdout.on('data', chunk => forward('stdout', chunk));
    child.stderr.on('data', chunk => forward('stderr', chunk));
    const deadline = setTimeout(() => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      timedOut = true;
      child.kill();
      forceKillTimer = setTimeout(() => child.kill('SIGKILL'), 500);
    }, SUITE_TIMEOUT_MS);
    child.once('error', error => {
      spawnError = error;
    });
    child.once('close', (status, signal) => {
      clearTimeout(deadline);
      if (forceKillTimer !== undefined) clearTimeout(forceKillTimer);
      resolve({ error: spawnError, signal, status, stdout, stderr, ms: Date.now() - started, timedOut });
    });
  });
}

const results = [];
console.log('Running dsh-gemini test suites...');
for (const [name, script, args] of suites) {
  const run = await runSuite(script, args);
  const hung = run.timedOut || run.error !== null || run.signal !== null;
  const ok = !hung && run.status === 0;
  results.push({ name, ok, ms: run.ms });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(16)} ${String(run.ms).padStart(5)} ms`);
}

const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} suites passed${failed.length > 0 ? ` — ${failed.map(f => f.name).join(', ')} failed` : ''}`);
process.exitCode = failed.length === 0 ? 0 : 1;
