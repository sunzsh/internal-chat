(function initPeerState(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.InternalChatPeerState = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function createPeerState() {
  function normalizePcState(pcState) {
    const state = (pcState || '').toString().toLowerCase();
    if (state === 'completed') {
      return 'connected';
    }
    if (state === 'new' || state === 'connecting' || state === 'connected' || state === 'disconnected' || state === 'failed' || state === 'closed') {
      return state;
    }
    return 'disconnected';
  }

  function isDataChannelOpen(channelState) {
    return (channelState || '').toString().toLowerCase() === 'open';
  }

  function resolvePeerStatus({ isMe, pcState, channelState }) {
    if (isMe) {
      return {
        connectionState: 'connected',
        connected: true,
        statusText: '当前设备'
      };
    }

    const normalized = normalizePcState(pcState);
    const channelOpen = isDataChannelOpen(channelState);
    if (normalized === 'connected' && !channelOpen) {
      return {
        connectionState: 'connecting',
        connected: false,
        statusText: '通道准备中'
      };
    }

    const connected = normalized === 'connected' && channelOpen;
    const statusMap = {
      new: '初始化',
      connecting: '连接中',
      connected: '已连接',
      disconnected: '未连接',
      failed: '连接失败',
      closed: '已关闭'
    };
    return {
      connectionState: normalized,
      connected,
      statusText: statusMap[normalized] || '未连接'
    };
  }

  function canSendData({ isMe, pcState, channelState }) {
    if (isMe) {
      return false;
    }
    const status = resolvePeerStatus({ isMe, pcState, channelState });
    return status.connected;
  }

  return {
    normalizePcState,
    isDataChannelOpen,
    resolvePeerStatus,
    canSendData
  };
});
