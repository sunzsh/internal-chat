const assert = require('assert');
const peerState = require('../www/app/peer-state');

module.exports = function runPeerStateTests() {
  const openPeer = peerState.resolvePeerStatus({
    isMe: false,
    pcState: 'connected',
    channelState: 'open'
  });
  assert.strictEqual(openPeer.connected, true);
  assert.strictEqual(openPeer.connectionState, 'connected');
  assert.strictEqual(openPeer.statusText, '已连接');

  const waitingPeer = peerState.resolvePeerStatus({
    isMe: false,
    pcState: 'connected',
    channelState: 'connecting'
  });
  assert.strictEqual(waitingPeer.connected, false);
  assert.strictEqual(waitingPeer.connectionState, 'connecting');
  assert.strictEqual(waitingPeer.statusText, '通道准备中');

  const failedPeer = peerState.resolvePeerStatus({
    isMe: false,
    pcState: 'failed',
    channelState: 'closed'
  });
  assert.strictEqual(failedPeer.connected, false);
  assert.strictEqual(failedPeer.connectionState, 'failed');
  assert.strictEqual(failedPeer.statusText, '连接失败');

  const me = peerState.resolvePeerStatus({
    isMe: true,
    pcState: 'connected',
    channelState: 'open'
  });
  assert.strictEqual(me.connected, true);
  assert.strictEqual(me.statusText, '当前设备');

  assert.strictEqual(peerState.canSendData({ isMe: true, pcState: 'connected', channelState: 'open' }), false);
  assert.strictEqual(peerState.canSendData({ isMe: false, pcState: 'connected', channelState: 'open' }), true);
  assert.strictEqual(peerState.canSendData({ isMe: false, pcState: 'connected', channelState: 'closing' }), false);
};
