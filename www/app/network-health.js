(function initNetworkHealth(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.InternalChatNetworkHealth = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function createNetworkHealth() {
  function normalizeCandidateType(type) {
    return (type || '').toString().trim().toLowerCase();
  }

  function isRelayType(type) {
    return normalizeCandidateType(type) === 'relay';
  }

  function isHostType(type) {
    return normalizeCandidateType(type) === 'host';
  }

  function isNatType(type) {
    const value = normalizeCandidateType(type);
    return value === 'srflx' || value === 'prflx';
  }

  function detectPathFlags({ localType, remoteType }) {
    const local = normalizeCandidateType(localType);
    const remote = normalizeCandidateType(remoteType);
    const relay = isRelayType(local) || isRelayType(remote);
    const lanDirect = !relay && isHostType(local) && isHostType(remote);
    const natTraversal = !relay && (isNatType(local) || isNatType(remote));
    return {
      lanDirect,
      natTraversal,
      relay
    };
  }

  function hasTurnUrl(urlValue) {
    if (!urlValue) {
      return false;
    }
    return urlValue.toString().toLowerCase().startsWith('turn:') || urlValue.toString().toLowerCase().startsWith('turns:');
  }

  function isRelayConfigured(iceServers) {
    if (!Array.isArray(iceServers)) {
      return false;
    }
    for (const server of iceServers) {
      const urls = Array.isArray(server?.urls) ? server.urls : [server?.urls];
      for (const url of urls) {
        if (hasTurnUrl(url)) {
          return true;
        }
      }
    }
    return false;
  }

  function normalizeMode(mode) {
    const value = (mode || '').toString().trim().toLowerCase();
    if (value === 'lan' || value === 'public' || value === 'private') {
      return value;
    }
    return 'lan';
  }

  function resolveRelayStatus({ mode, hasRelay, relayConfigured, hasAnyPath }) {
    if (mode === 'lan' || mode === 'public') {
      // LAN/公共房间不做中继兜底，未命中 relay 属于预期关闭。
      return hasRelay ? 'up' : 'down';
    }
    if (!hasAnyPath) {
      return relayConfigured ? 'warn' : 'unknown';
    }
    if (hasRelay) {
      return 'up';
    }
    return relayConfigured ? 'warn' : 'down';
  }

  function summarizePaths(paths, relayConfigured, mode) {
    const list = Array.isArray(paths) ? paths.filter(Boolean) : [];
    const normalizedMode = normalizeMode(mode);
    const hasLan = list.some(item => item.lanDirect);
    const hasNat = list.some(item => item.natTraversal);
    const hasRelay = list.some(item => item.relay);
    if (list.length === 0) {
      return {
        lanDirect: 'unknown',
        natTraversal: 'unknown',
        relayAvailable: resolveRelayStatus({
          mode: normalizedMode,
          hasRelay,
          relayConfigured,
          hasAnyPath: false
        })
      };
    }
    return {
      lanDirect: hasLan ? 'up' : 'down',
      natTraversal: hasNat ? 'up' : 'down',
      relayAvailable: resolveRelayStatus({
        mode: normalizedMode,
        hasRelay,
        relayConfigured,
        hasAnyPath: true
      })
    };
  }

  return {
    detectPathFlags,
    isRelayConfigured,
    summarizePaths
  };
});
