(function initCore(global) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/ws`;

  // MD5 函数 (用于私有房间密码摘要)
  var MD5=function(d){var r=M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

  if (!window.fgdx_configuration) {
    window.fgdx_configuration = {
      iceServers: [{ urls: ['stun:74.125.250.129:19302'] }],
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 10
    };
  }

  function normalizeLanKey(rawValue) {
    const value = (rawValue || '').trim().toLowerCase();
    if (!value) {
      return '';
    }
    if (!/^[a-z0-9._-]{1,64}$/i.test(value)) {
      return '';
    }
    return value;
  }

  function normalizePublicRoomName(rawValue) {
    return (rawValue || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 32);
  }

  function parseHashState(hashValue) {
    const hash = (hashValue || '').replace(/^#/, '').trim();
    if (!hash) {
      return null;
    }
    if (hash === '~p') {
      return { mode: 'public', roomId: null, lanKey: '' };
    }
    if (hash.startsWith('~p.')) {
      const room = normalizePublicRoomName(decodeURIComponent(hash.substring(3)));
      if (!room) {
        return null;
      }
      return { mode: 'public', roomId: room, lanKey: '' };
    }
    if (hash === '~l') {
      return { mode: 'lan', roomId: null, lanKey: '' };
    }
    if (hash.startsWith('~l.')) {
      const lanKey = normalizeLanKey(decodeURIComponent(hash.substring(3)));
      if (!lanKey) {
        return { mode: 'lan', roomId: null, lanKey: '' };
      }
      return { mode: 'lan', roomId: null, lanKey };
    }
    return null;
  }

  function buildHashState(mode, roomId, lanKey) {
    if (mode === 'public') {
      return roomId ? `#~p.${encodeURIComponent(roomId)}` : '#~p';
    }
    if (mode === 'lan' && lanKey) {
      return `#~l.${encodeURIComponent(lanKey)}`;
    }
    return '#~l';
  }

  function parseCandidateInfo(candidateValue) {
    const line = typeof candidateValue === 'string'
      ? candidateValue
      : (candidateValue && candidateValue.candidate) ? candidateValue.candidate : '';
    if (!line) {
      return { raw: '', address: '', type: '' };
    }
    const parts = line.trim().split(/\s+/);
    const typIndex = parts.findIndex(part => part === 'typ');
    const type = typIndex >= 0 ? (parts[typIndex + 1] || '') : '';
    const address = parts.length >= 5 ? parts[4] : '';
    return { raw: line, address, type };
  }

  function isIPv4Address(value) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(value || '');
  }

  function buildLanKeyFromPrefix(prefix) {
    const normalized = (prefix || '').replace(/\.$/, '').trim();
    if (!normalized) {
      return '';
    }
    return `net-${normalized.replace(/\./g, '-')}`;
  }

  async function detectLocalNetworks(timeoutMs = 1800) {
    if (!window.RTCPeerConnection) {
      return { networks: [], localIps: [] };
    }
    const networkMap = new Map();
    const localIpSet = new Set();
    const pc = new RTCPeerConnection({ iceServers: [] });

    function addAddress(address) {
      if (!isIPv4Address(address) || address.startsWith('127.') || address === '0.0.0.0') {
        return;
      }
      localIpSet.add(address);
      const parts = address.split('.');
      const prefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
      if (!networkMap.has(prefix)) {
        networkMap.set(prefix, {
          id: `ipv4-${parts[0]}-${parts[1]}-${parts[2]}`,
          label: `IPv4 ${prefix}x`,
          prefix,
          lanKey: buildLanKeyFromPrefix(prefix),
          localIps: new Set()
        });
      }
      networkMap.get(prefix).localIps.add(address);
    }

    try {
      pc.createDataChannel('net-detect');
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }
        const info = parseCandidateInfo(event.candidate);
        if (!info.address) {
          return;
        }
        addAddress(info.address);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, timeoutMs);
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timer);
            resolve();
          }
        };
      });
    } catch (error) {
      console.error('detectLocalNetworks failed:', error);
    } finally {
      pc.close();
    }

    const networks = Array.from(networkMap.values())
      .map(item => ({
        id: item.id,
        label: item.label,
        prefix: item.prefix,
        lanKey: item.lanKey,
        localIps: Array.from(item.localIps).sort()
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      networks,
      localIps: Array.from(localIpSet).sort()
    };
  }

  class StorageService {
    saveSession(data) {
      try {
        localStorage.setItem('chat_session', JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    }

    loadSession() {
      try {
        return JSON.parse(localStorage.getItem('chat_session') || '{}');
      } catch (e) {
        return {};
      }
    }

    saveNetworkOptions(data) {
      try {
        localStorage.setItem('chat_network_options', JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save network options:', e);
      }
    }

    loadNetworkOptions() {
      try {
        return JSON.parse(localStorage.getItem('chat_network_options') || '{}');
      } catch (e) {
        return {};
      }
    }

    saveMessages(roomId, messages) {
      try {
        const key = `chat_history_${roomId}`;
        const limited = messages.slice(-100);
        localStorage.setItem(key, JSON.stringify(limited));
      } catch (e) {
        console.error('Failed to save messages:', e);
      }
    }

    loadMessages(roomId) {
      try {
        const key = `chat_history_${roomId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch (e) {
        return [];
      }
    }

    clearHistory(roomId) {
      try {
        const key = `chat_history_${roomId}`;
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to clear history:', e);
      }
    }
  }

  global.InternalChatCore = {
    wsUrl,
    MD5,
    normalizeLanKey,
    normalizePublicRoomName,
    buildLanKeyFromPrefix,
    parseHashState,
    buildHashState,
    parseCandidateInfo,
    detectLocalNetworks,
    storageService: new StorageService()
  };
})(window);
