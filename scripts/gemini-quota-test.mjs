import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const quota = require('../src/quota.js');

async function run() {
  console.log('Testing dsh-gemini Quota Engine...');

  // 1. getAccounts
  const accounts = quota.getAccounts();
  assert(Array.isArray(accounts), 'accounts must be an array');
  console.log(`ok  getAccounts: ${accounts.length} account(s) detected`);

  if (accounts.length > 0) {
    const acc = accounts[0];
    assert.equal(acc.provider, 'gemini', 'provider must be gemini');
    assert(acc.id, 'account must have an id');
    console.log(`ok  account metadata validated: ${acc.id}`);

    // 2. fetchQuota live check
    const res = await quota.fetchQuota();
    assert.equal(res.ok, true, 'fetchQuota must return ok=true');
    assert.equal(res.provider, 'gemini', 'provider must be gemini');
    assert(typeof res.fiveHour?.percent === 'number', 'fiveHour percent must be a number');
    assert(typeof res.weekly?.percent === 'number', 'weekly percent must be a number');
    console.log(`ok  live quota fetched: 5h=${res.fiveHour.percent}%, weekly=${res.weekly.percent}%`);
  }

  console.log('gemini-quota-test: OK');
}

run().catch(err => {
  console.error('gemini-quota-test FAILED:', err);
  process.exit(1);
});
