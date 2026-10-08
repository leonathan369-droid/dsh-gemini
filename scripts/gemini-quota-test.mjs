import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const quota = require('../src/quota.js');

async function run() {
  console.log("Testing dsh-gemini Quota Engine...");

  // 1. getRawAccounts & getAccounts
  const rawAccounts = quota.getRawAccounts ? quota.getRawAccounts() : [];
  const enabledAccounts = quota.getAccounts();
  assert(Array.isArray(enabledAccounts), "accounts must be an array");
  console.log(`ok  accounts detected: ${rawAccounts.length} raw, ${enabledAccounts.length} enabled`);

  // 2. fetchQuota check
  const res = await quota.fetchQuota(true);
  if (enabledAccounts.length > 0) {
    assert.equal(res.ok, true, "fetchQuota must return ok=true when enabled accounts exist");
    assert.equal(res.enabled, true, "enabled must be true");
    assert.equal(res.provider, "gemini", "provider must be gemini");
    assert(typeof res.fiveHour?.percent === "number", "fiveHour percent must be a number");
    assert(typeof res.weekly?.percent === "number", "weekly percent must be a number");
    console.log(`ok  live quota fetched: 5h=${res.fiveHour.percent}%, weekly=${res.weekly.percent}%`);
  } else {
    assert.equal(res.enabled, false, "enabled must be false when all accounts disabled");
    console.log("ok  accurately reported enabled=false when all accounts disabled");
  }

  console.log("gemini-quota-test: OK");
}

run().catch(err => {
  console.error('gemini-quota-test FAILED:', err);
  process.exit(1);
});
