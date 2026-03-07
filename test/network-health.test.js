const assert = require('assert');
const networkHealth = require('../www/app/network-health');

module.exports = function runNetworkHealthTests() {
  assert.strictEqual(networkHealth.isRelayConfigured([
    { urls: ['stun:stun.l.google.com:19302'] }
  ]), false);
  assert.strictEqual(networkHealth.isRelayConfigured([
    { urls: ['turn:turn.example.com:3478'] }
  ]), true);

  const lanPath = networkHealth.detectPathFlags({ localType: 'host', remoteType: 'host' });
  assert.strictEqual(lanPath.lanDirect, true);
  assert.strictEqual(lanPath.natTraversal, false);
  assert.strictEqual(lanPath.relay, false);

  const natPath = networkHealth.detectPathFlags({ localType: 'srflx', remoteType: 'host' });
  assert.strictEqual(natPath.lanDirect, false);
  assert.strictEqual(natPath.natTraversal, true);
  assert.strictEqual(natPath.relay, false);

  const relayPath = networkHealth.detectPathFlags({ localType: 'relay', remoteType: 'relay' });
  assert.strictEqual(relayPath.relay, true);
  assert.strictEqual(relayPath.natTraversal, false);

  const emptySummary = networkHealth.summarizePaths([], false);
  assert.strictEqual(emptySummary.lanDirect, 'unknown');
  assert.strictEqual(emptySummary.natTraversal, 'unknown');
  assert.strictEqual(emptySummary.relayAvailable, 'warn');

  const mixedSummary = networkHealth.summarizePaths([lanPath, natPath], true);
  assert.strictEqual(mixedSummary.lanDirect, 'up');
  assert.strictEqual(mixedSummary.natTraversal, 'up');
  assert.strictEqual(mixedSummary.relayAvailable, 'warn');

  const relaySummary = networkHealth.summarizePaths([relayPath], true);
  assert.strictEqual(relaySummary.relayAvailable, 'up');
};
