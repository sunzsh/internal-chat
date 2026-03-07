(function initStores(global) {
  const core = global.InternalChatCore;
  const peerState = global.InternalChatPeerState || {};
  const networkHealth = global.InternalChatNetworkHealth || {};
  const { createPinia, defineStore } = Pinia;
  const markAsRaw = (typeof Vue !== 'undefined' && typeof Vue.markRaw === 'function')
    ? Vue.markRaw
    : (value) => value;
  const toOriginal = (typeof Vue !== 'undefined' && typeof Vue.toRaw === 'function')
    ? Vue.toRaw
    : (value) => value;

  const pinia = createPinia();

  const useAppStore = defineStore('app', {
    state: () => ({
      currentMode: 'lan',
      connectionStatus: 'disconnected',
      isReconnecting: false,
      reconnectAttempts: 0,
      currentRoomId: null,
      nickname: '',
      showNicknameModal: false,
      showPasswordModal: false,
      showAdvancedModal: false,
      signalingServer: null,
      keepaliveTimer: null,
      reconnectTimer: null,
      publicRoomsRefreshTimer: null,
      privateRoomId: null,
      roomPassword: '',
      lanKey: '',
      candidatePrefix: '',
      hostCandidatesOnly: false,
      baseIceServers: JSON.parse(JSON.stringify(window.fgdx_configuration.iceServers || [])),
      manualClose: false,
      scopeId: 'lan:default',
      scopeVersion: 0,
      socketSessionId: 0
    }),

    getters: {
      channelInfoText(state) {
        if (state.currentMode === 'public') {
          const roomPart = state.currentRoomId ? ` / 房间：${state.currentRoomId}` : ' / 未进入房间';
          return `当前模式：公共房间${roomPart}`;
        }
        if (state.currentMode === 'private') {
          return `当前模式：私有房间${state.privateRoomId ? ` / ${state.privateRoomId}` : ''}`;
        }
        const lanText = state.lanKey ? ` / 分组：${state.lanKey}` : '';
        return `当前模式：局域网${lanText}`;
      },

      connectionStatusClass(state) {
        if (state.isReconnecting) return 'reconnecting';
        return state.connectionStatus;
      }
    },

    actions: {
      initializeApp() {
        if (!window.RTCPeerConnection && !window.webkitRTCPeerConnection) {
          const chatStore = useChatStore();
          chatStore.addSystemMessage('您的浏览器不支持WebRTC，请使用Chrome、Firefox、Safari等现代浏览器访问。');
          return;
        }

        const match = document.cookie.match(/nickname=([^;]+)/);
        if (match) {
          this.nickname = decodeURIComponent(match[1]);
        }

        this.restoreNetworkOptions();

        this.privateRoomId = decodeURIComponent(window.location.pathname.split('/')[1] || '').trim();
        if (this.privateRoomId) {
          this.currentMode = 'private';
          this.updateScope(this.buildScopeId('private', this.privateRoomId, ''));
          this.showPasswordModal = true;
          return;
        }

        if (this.restoreFromHash()) {
          return;
        }

        this.restoreSession();
      },

      restoreFromHash() {
        const hashState = core.parseHashState(window.location.hash);
        if (!hashState) {
          return false;
        }
        this.currentMode = hashState.mode;
        this.currentRoomId = hashState.roomId || null;
        if (hashState.mode === 'lan') {
          this.lanKey = hashState.lanKey || '';
          this.updateScope(this.buildScopeId('lan', null, this.lanKey));
          this.connectWebSocket();
          return true;
        }
        if (hashState.mode === 'public') {
          this.updateScope(this.buildScopeId('public', this.currentRoomId, ''));
          if (this.currentRoomId) {
            this.connectWebSocket();
          }
          return true;
        }
        return false;
      },

      restoreSession() {
        const session = core.storageService.loadSession();
        if (!session.mode || !session.timestamp) {
          this.currentMode = 'lan';
          this.updateScope(this.buildScopeId('lan', null, this.lanKey));
          this.connectWebSocket();
          this.updateHashState();
          return;
        }
        const age = Date.now() - session.timestamp;
        if (age > 24 * 60 * 60 * 1000) {
          this.currentMode = 'lan';
          this.updateScope(this.buildScopeId('lan', null, this.lanKey));
          this.connectWebSocket();
          this.updateHashState();
          return;
        }

        this.currentMode = session.mode || 'lan';
        this.currentRoomId = session.roomId || null;
        this.lanKey = core.normalizeLanKey(session.lanKey || '') || '';
        if (session.nickname && !this.nickname) {
          this.nickname = session.nickname;
        }
        if (this.currentMode === 'public' && this.currentRoomId) {
          this.updateScope(this.buildScopeId('public', this.currentRoomId, ''));
          this.connectWebSocket();
        } else if (this.currentMode === 'lan') {
          this.updateScope(this.buildScopeId('lan', null, this.lanKey));
          this.connectWebSocket();
        }
        this.updateHashState();
      },

      saveSession() {
        core.storageService.saveSession({
          mode: this.currentMode,
          roomId: this.currentRoomId,
          lanKey: this.lanKey,
          nickname: this.nickname,
          timestamp: Date.now()
        });
      },

      buildScopeId(mode, roomId, lanKey) {
        if (mode === 'public') {
          return `public:${roomId || 'none'}`;
        }
        if (mode === 'private') {
          return `private:${roomId || this.privateRoomId || 'none'}`;
        }
        return `lan:${lanKey || 'default'}`;
      },

      updateScope(scopeId) {
        const nextScopeId = scopeId || 'lan:default';
        if (this.scopeId !== nextScopeId) {
          this.scopeId = nextScopeId;
          this.scopeVersion += 1;
          const chatStore = useChatStore();
          const userStore = useUserStore();
          userStore.clearTransferStats();
          chatStore.loadHistoryForScope(nextScopeId);
        }
      },

      applyScopeFromServer(data) {
        const serverMode = data?.mode || this.currentMode || 'lan';
        const lanKey = core.normalizeLanKey(data?.lanKey || this.lanKey || '');
        const roomId = data?.roomId || this.currentRoomId || this.privateRoomId || null;
        if (this.currentMode !== 'private') {
          this.currentMode = serverMode;
        }
        if (serverMode === 'public' && data?.roomId) {
          this.currentRoomId = data.roomId;
        }
        if (serverMode === 'lan' && data?.lanKey) {
          this.lanKey = lanKey;
        }
        this.updateScope(this.buildScopeId(serverMode, roomId, lanKey));
      },

      restoreNetworkOptions() {
        const options = core.storageService.loadNetworkOptions();
        this.lanKey = core.normalizeLanKey(options.lanKey || '');
        this.candidatePrefix = (options.candidatePrefix || '').trim();
        this.hostCandidatesOnly = Boolean(options.hostCandidatesOnly);
      },

      saveNetworkOptions() {
        core.storageService.saveNetworkOptions({
          lanKey: this.lanKey,
          candidatePrefix: this.candidatePrefix,
          hostCandidatesOnly: this.hostCandidatesOnly
        });
      },

      updateHashState() {
        if (this.currentMode === 'private') {
          return;
        }
        const nextHash = core.buildHashState(this.currentMode, this.currentRoomId, this.lanKey);
        if (window.location.hash === nextHash) {
          return;
        }
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
      },

      async switchMode(mode) {
        if (this.currentMode === 'private') {
          return;
        }
        if (mode === 'lan') {
          await this.switchToLanMode();
          return;
        }
        if (mode === 'public') {
          await this.switchToPublicMode();
        }
      },

      async switchToLanMode() {
        this.clearPublicRoomRefresh();
        this.currentMode = 'lan';
        this.currentRoomId = null;
        this.updateScope(this.buildScopeId('lan', null, this.lanKey));
        this.applyIceServers([]);
        this.disconnectSignaling(true);
        this.connectWebSocket();
        this.updateHashState();
        this.saveSession();
      },

      async switchToPublicMode() {
        const userStore = useUserStore();
        this.currentMode = 'public';
        this.currentRoomId = null;
        this.updateScope(this.buildScopeId('public', this.currentRoomId, ''));
        this.applyIceServers([]);
        this.disconnectSignaling(true);
        await userStore.loadPublicRooms();
        this.startPublicRoomRefresh();
        if (this.currentRoomId) {
          this.connectWebSocket();
        }
        this.updateHashState();
        this.saveSession();
      },

      startPublicRoomRefresh() {
        this.clearPublicRoomRefresh();
        this.publicRoomsRefreshTimer = setInterval(() => {
          const userStore = useUserStore();
          userStore.loadPublicRooms();
        }, 10000);
      },

      clearPublicRoomRefresh() {
        if (this.publicRoomsRefreshTimer) {
          clearInterval(this.publicRoomsRefreshTimer);
          this.publicRoomsRefreshTimer = null;
        }
      },

      getCurrentWsUrl() {
        const wsBase = core.wsUrl.replace(/\/$/g, '');
        if (this.currentMode === 'public') {
          if (!this.currentRoomId) {
            return null;
          }
          return `${wsBase}?m=public&r=${encodeURIComponent(this.currentRoomId)}`;
        }
        if (this.currentMode === 'private') {
          return `${wsBase}/${encodeURIComponent(this.privateRoomId)}${this.roomPassword ? '/' + this.roomPassword : ''}`;
        }
        const normalizedLanKey = core.normalizeLanKey(this.lanKey);
        if (normalizedLanKey) {
          return `${wsBase}?m=lan&k=${encodeURIComponent(normalizedLanKey)}`;
        }
        return `${wsBase}?m=lan`;
      },

      connectWebSocket() {
        const wsUrlWithPassword = this.getCurrentWsUrl();
        if (!wsUrlWithPassword) {
          this.connectionStatus = 'disconnected';
          this.isReconnecting = false;
          this.clearReconnectTimer();
          return;
        }

        const userStore = useUserStore();
        const socketSessionId = ++this.socketSessionId;
        this.manualClose = false;
        this.connectionStatus = 'connecting';
        this.isReconnecting = false;
        this.clearReconnectTimer();
        this.clearKeepalive();

        this.signalingServer = new WebSocket(wsUrlWithPassword);

        this.signalingServer.onopen = () => {
          if (socketSessionId !== this.socketSessionId) {
            return;
          }
          this.connectionStatus = 'connected';
          this.isReconnecting = false;
          this.reconnectAttempts = 0;
          this.clearKeepalive();
          this.keepaliveTimer = setInterval(() => {
            if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
              this.signalingServer.send(JSON.stringify({ type: '9999' }));
            }
          }, 10000);

          if (this.nickname) {
            setTimeout(() => {
              if (socketSessionId !== this.socketSessionId) {
                return;
              }
              if (!this.signalingServer || this.signalingServer.readyState !== WebSocket.OPEN || !userStore.me.id) {
                return;
              }
              this.signalingServer.send(JSON.stringify({
                uid: userStore.me.id,
                targetId: userStore.me.id,
                type: '9004',
                data: { nickname: this.nickname }
              }));
            }, 120);
          }
        };

        this.signalingServer.onmessage = ({ data: responseStr }) => {
          if (socketSessionId !== this.socketSessionId) {
            return;
          }
          const response = JSON.parse(responseStr);
          const { type, data } = response;

          if (type === '1001') {
            const ok = userStore.handleMeInfo(data);
            if (ok === false) {
              return;
            }
            this.applyScopeFromServer(data);
            return;
          }
          if (type === '1002') {
            userStore.refreshUsers(data);
            return;
          }
          if (type === '1003') {
            userStore.connectAllOther();
            return;
          }
          if (type === '1004') {
            userStore.addCandidate(data);
            return;
          }
          if (type === '1005') {
            userStore.joinConnection(data);
            return;
          }
          if (type === '1006') {
            userStore.joinedConnection(data);
            return;
          }
          if (type === '1007') {
            userStore.updateUserNickname(data);
            return;
          }
          if (type === '1099') {
            this.handleServerError(data);
          }
        };

        this.signalingServer.onclose = () => {
          if (socketSessionId !== this.socketSessionId) {
            return;
          }
          this.clearKeepalive();
          this.connectionStatus = 'disconnected';
          if (this.manualClose) {
            this.manualClose = false;
            return;
          }
          if (this.currentMode === 'public') {
            const userStoreRef = useUserStore();
            userStoreRef.loadPublicRooms();
          }
          if (!this.isReconnecting && this.reconnectAttempts < 3) {
            this.reconnect();
          }
        };

        this.signalingServer.onerror = () => {
          if (socketSessionId !== this.socketSessionId) {
            return;
          }
          this.connectionStatus = 'failed';
        };
      },

      disconnectSignaling(manual = true) {
        const userStore = useUserStore();
        this.socketSessionId += 1;
        this.manualClose = manual;
        this.clearKeepalive();
        this.clearReconnectTimer();
        if (this.signalingServer) {
          try {
            this.signalingServer.close();
          } catch (e) {
          }
        }
        this.signalingServer = null;
        this.connectionStatus = 'disconnected';
        this.isReconnecting = false;
        userStore.users.forEach(user => user.closeConnection && user.closeConnection());
        userStore.users = [];
        userStore.clearTransferStats();
      },

      clearKeepalive() {
        if (this.keepaliveTimer) {
          clearInterval(this.keepaliveTimer);
          this.keepaliveTimer = null;
        }
      },

      clearReconnectTimer() {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      },

      reconnect() {
        if (this.isReconnecting) {
          return;
        }
        this.isReconnecting = true;
        this.reconnectAttempts += 1;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);
        this.reconnectTimer = setTimeout(() => {
          this.connectWebSocket();
        }, delay);
      },

      applyIceServers(turns) {
        window.fgdx_configuration.iceServers = JSON.parse(JSON.stringify(this.baseIceServers));
        if (this.currentMode === 'private' && Array.isArray(turns) && turns.length > 0) {
          turns.forEach(turn => {
            window.fgdx_configuration.iceServers.push(turn);
          });
        }
      },

      shouldSendCandidate(candidate) {
        const info = core.parseCandidateInfo(candidate);
        if (!info.raw) {
          return true;
        }
        const type = (info.type || '').toLowerCase();
        if (this.hostCandidatesOnly && type && type !== 'host') {
          return false;
        }
        const prefix = (this.candidatePrefix || '').trim();
        if (prefix && info.address && !info.address.startsWith(prefix)) {
          return false;
        }
        return true;
      },

      applyAdvancedOptions({ lanKey, candidatePrefix, hostCandidatesOnly }) {
        this.lanKey = core.normalizeLanKey(lanKey || '');
        this.candidatePrefix = (candidatePrefix || '').trim();
        this.hostCandidatesOnly = Boolean(hostCandidatesOnly);
        if (this.currentMode === 'lan') {
          this.updateScope(this.buildScopeId('lan', null, this.lanKey));
        }
        this.saveNetworkOptions();
      },

      handleServerError(data) {
        const chatStore = useChatStore();
        const message = data?.message || '服务端返回错误';
        chatStore.addSystemMessage(message);
        if (data?.code === 'PUBLIC_ROOM_LIMIT') {
          this.currentRoomId = null;
          this.updateHashState();
          this.saveSession();
          const userStore = useUserStore();
          userStore.loadPublicRooms();
        }
      },

      cleanup() {
        this.disconnectSignaling(true);
        this.clearPublicRoomRefresh();
      }
    }
  });

  const useChatStore = defineStore('chat', {
    state: () => ({
      messages: [],
      isDragging: false,
      toasts: [],
      toastIdCounter: 0
    }),

    actions: {
      addMessage(message) {
        message.id = `msg_${Date.now()}_${Math.random()}`;
        this.messages.push(message);
        const appStore = useAppStore();
        core.storageService.saveMessages(appStore.scopeId, this.messages);
      },

      addSystemMessage(content) {
        this.addMessage({
          type: 'system',
          userName: '系统',
          content: this.escapeHtml(content),
          time: this.formatTime(new Date()),
          isMe: false
        });
      },

      addChatMessage(userId, content, nickname) {
        if (typeof content === 'string' && content.startsWith('##')) {
          return;
        }
        try {
          const parsed = JSON.parse(content);
          if (parsed.type && parsed.type.startsWith('##')) {
            return;
          }
        } catch (e) {
        }

        const userStore = useUserStore();
        let msg = this.escapeHtml(content);
        if (/(http|https):\/\/[^\s<>"']+/g.test(msg)) {
          msg = msg.replace(/(http|https):\/\/[^\s<>"']+/g, (url) => `<a href="${url}" target="_blank">${url}</a>`);
        }
        this.addMessage({
          type: 'text',
          userName: userId === userStore.me.id ? '我' : (nickname || userId),
          content: msg,
          time: this.formatTime(new Date()),
          isMe: userId === userStore.me.id
        });
      },

      addFileMessage(userId, file, nickname) {
        const userStore = useUserStore();
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
        this.addMessage({
          type: isImage ? 'image' : 'file',
          userName: userId === userStore.me.id ? '我' : (nickname || userId),
          fileName: file.name,
          fileUrl: file.url,
          time: this.formatTime(new Date()),
          isMe: userId === userStore.me.id
        });
      },

      loadHistory() {
        const appStore = useAppStore();
        this.loadHistoryForScope(appStore.scopeId);
      },

      loadHistoryForScope(scopeId) {
        const history = core.storageService.loadMessages(scopeId);
        if (history.length > 0) {
          this.messages = history;
          return;
        }
        this.messages = [];
      },

      clearHistory() {
        const appStore = useAppStore();
        this.messages = [];
        core.storageService.clearHistory(appStore.scopeId);
        this.showToast({ type: 'success', message: '历史记录已清除' });
      },

      showToast({ type = 'info', message, duration = 3000, action = null }) {
        const id = ++this.toastIdCounter;
        const toast = { id, type, message, action };
        this.toasts.push(toast);
        if (duration > 0) {
          setTimeout(() => this.removeToast(id), duration);
        }
      },

      removeToast(id) {
        const index = this.toasts.findIndex(item => item.id === id);
        if (index !== -1) {
          this.toasts.splice(index, 1);
        }
      },

      escapeHtml(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      },

      formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
  });

  const useUserStore = defineStore('user', {
    state: () => ({
      me: markAsRaw(new XChatUser()),
      users: [],
      publicRooms: [],
      isLoadingRooms: false,
      roomHintText: '公共房间最多 5 个',
      transferStatsCache: {},
      networkHealth: {
        lanDirect: 'unknown',
        natTraversal: 'unknown',
        relayAvailable: 'warn'
      }
    }),

    getters: {
      connectedUsers(state) {
        return state.users.filter(user => user.connected);
      },
      connectedUsersCount() {
        return this.connectedUsers.length;
      }
    },

    actions: {
      getRelayConfigured() {
        const appStore = useAppStore();
        const iceServers = appStore.baseIceServers || window.fgdx_configuration.iceServers || [];
        if (networkHealth.isRelayConfigured) {
          return networkHealth.isRelayConfigured(iceServers);
        }
        return false;
      },

      resetNetworkHealth() {
        const relayConfigured = this.getRelayConfigured();
        if (networkHealth.summarizePaths) {
          this.networkHealth = networkHealth.summarizePaths([], relayConfigured);
          return;
        }
        this.networkHealth = {
          lanDirect: 'unknown',
          natTraversal: 'unknown',
          relayAvailable: relayConfigured ? 'warn' : 'warn'
        };
      },

      updateNetworkHealthSummary() {
        const relayConfigured = this.getRelayConfigured();
        const paths = this.users
          .filter(user => !user.isMe && user.connected && user.networkPath)
          .map(user => user.networkPath);
        if (networkHealth.summarizePaths) {
          this.networkHealth = networkHealth.summarizePaths(paths, relayConfigured);
          return;
        }
        this.networkHealth = {
          lanDirect: 'unknown',
          natTraversal: 'unknown',
          relayAvailable: relayConfigured ? 'warn' : 'warn'
        };
      },

      clearTransferStats() {
        this.transferStatsCache = {};
        this.users.forEach(user => {
          user.speedText = '';
          user.networkPath = null;
        });
        this.resetNetworkHealth();
      },

      formatRate(bytesPerSecond) {
        if (!bytesPerSecond || bytesPerSecond <= 0) {
          return '0B/s';
        }
        if (bytesPerSecond >= 1024 * 1024) {
          return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)}MB/s`;
        }
        if (bytesPerSecond >= 1024) {
          return `${(bytesPerSecond / 1024).toFixed(1)}KB/s`;
        }
        return `${bytesPerSecond.toFixed(0)}B/s`;
      },

      async updateUserTransferStats(user) {
        if (!user || user.isMe || !user.rtcConn || !user.connected || typeof user.rtcConn.getStats !== 'function') {
          user.speedText = '';
          user.networkPath = null;
          return;
        }
        try {
          const stats = await user.rtcConn.getStats();
          let selectedPair = null;
          stats.forEach(report => {
            if (report.type !== 'candidate-pair') {
              return;
            }
            if (report.selected || report.nominated) {
              selectedPair = report;
            }
          });
          if (!selectedPair) {
            user.speedText = '统计中...';
            user.networkPath = null;
            return;
          }

          const localCandidate = selectedPair.localCandidateId ? stats.get(selectedPair.localCandidateId) : null;
          const remoteCandidate = selectedPair.remoteCandidateId ? stats.get(selectedPair.remoteCandidateId) : null;
          if (networkHealth.detectPathFlags) {
            user.networkPath = networkHealth.detectPathFlags({
              localType: localCandidate?.candidateType || '',
              remoteType: remoteCandidate?.candidateType || ''
            });
          }

          const now = Date.now();
          const bytesSent = selectedPair.bytesSent || 0;
          const bytesReceived = selectedPair.bytesReceived || 0;
          const prev = this.transferStatsCache[user.id];
          this.transferStatsCache[user.id] = { bytesSent, bytesReceived, ts: now };
          if (!prev || now <= prev.ts) {
            user.speedText = '统计中...';
            return;
          }

          const deltaMs = now - prev.ts;
          const up = Math.max(0, (bytesSent - prev.bytesSent) * 1000 / deltaMs);
          const down = Math.max(0, (bytesReceived - prev.bytesReceived) * 1000 / deltaMs);
          const rttMs = typeof selectedPair.currentRoundTripTime === 'number'
            ? Math.round(selectedPair.currentRoundTripTime * 1000)
            : null;
          user.speedText = `↑${this.formatRate(up)} ↓${this.formatRate(down)}${rttMs !== null ? ` RTT ${rttMs}ms` : ''}`;
        } catch (error) {
          user.speedText = '';
          user.networkPath = null;
        }
      },

      async updateTransferStats() {
        const tasks = this.users
          .filter(user => !user.isMe)
          .map(user => this.updateUserTransferStats(user));
        await Promise.all(tasks);
        this.updateNetworkHealthSummary();
      },

      handleMeInfo(data) {
        const appStore = useAppStore();
        const chatStore = useChatStore();
        this.me.id = data.id;
        this.me.roomId = data.roomId;

        if (appStore.currentMode === 'private' && appStore.privateRoomId && this.me.roomId !== appStore.privateRoomId) {
          chatStore.addSystemMessage('房间密码错误，请重新输入');
          appStore.disconnectSignaling(true);
          appStore.showPasswordModal = true;
          return false;
        }

        if (appStore.currentMode === 'lan' && data.lanKey && !appStore.lanKey) {
          appStore.lanKey = core.normalizeLanKey(data.lanKey);
        }

        appStore.applyIceServers(data.turns);
        return true;
      },

      refreshUsers(data) {
        const chatStore = useChatStore();
        const appStore = useAppStore();
        const scopedVersion = appStore.scopeVersion;
        const resUsers = data.map(item => {
          const old = this.users.find(user => user.id === item.id);
          if (old) {
            const rawOld = markAsRaw(toOriginal(old));
            rawOld.nickname = item.nickname || rawOld.nickname;
            return rawOld;
          }

          const user = markAsRaw(new XChatUser());
          user.id = item.id;
          user.isMe = item.id === this.me.id;
          user.nickname = item.nickname;
          user.onmessage = (msg) => {
            if (scopedVersion !== appStore.scopeVersion) {
              return;
            }
            chatStore.addChatMessage(user.id, msg, user.nickname);
          };
          user.onReviceFile = (file) => {
            if (scopedVersion !== appStore.scopeVersion) {
              return;
            }
            chatStore.addFileMessage(user.id, file, user.nickname);
          };
          user.onConnectionStateChange = () => {
            if (scopedVersion !== appStore.scopeVersion) {
              return;
            }
            this.updateUserConnectionState(user);
          };
          return user;
        });

        const removed = this.users.filter(user => !resUsers.find(next => next.id === user.id));
        removed.forEach(user => user.closeConnection && user.closeConnection());
        removed.forEach(user => {
          delete this.transferStatsCache[user.id];
        });
        this.users = resUsers;
        this.updateAllUserStates();
      },

      updateUserConnectionState(user) {
        user.displayName = user.isMe ? '我' : (user.nickname || user.id);
        const pcState = user.getConnectionState ? (user.getConnectionState() || 'disconnected') : 'disconnected';
        const channelState = user.chatChannel ? user.chatChannel.readyState : '';
        const next = peerState.resolvePeerStatus
          ? peerState.resolvePeerStatus({ isMe: user.isMe, pcState, channelState })
          : {
            connectionState: user.isMe ? 'connected' : (pcState === 'completed' ? 'connected' : pcState),
            connected: user.isMe ? true : (pcState === 'connected' || pcState === 'completed'),
            statusText: user.isMe ? '当前设备' : '未连接'
          };
        user.connectionState = next.connectionState;
        user.connected = next.connected;
        user.statusText = next.statusText;
        if (!user.connected) {
          user.speedText = '';
          user.networkPath = null;
        }
      },

      updateAllUserStates() {
        this.users.forEach(user => this.updateUserConnectionState(user));
        this.updateNetworkHealthSummary();
      },

      connectAllOther() {
        const appStore = useAppStore();
        const scopedVersion = appStore.scopeVersion;
        if (this.users.length <= 1 || !appStore.signalingServer || appStore.signalingServer.readyState !== WebSocket.OPEN) {
          return;
        }
        const targets = this.users.filter(user => user.id !== this.me.id);
        for (const target of targets) {
          target.onicecandidate = (candidate) => {
            if (scopedVersion !== appStore.scopeVersion) {
              return;
            }
            if (!appStore.shouldSendCandidate(candidate)) {
              return;
            }
            appStore.signalingServer.send(JSON.stringify({
              uid: this.me.id,
              targetId: target.id,
              type: '9001',
              data: { candidate }
            }));
          };
          target.createConnection().then(() => {
            if (scopedVersion !== appStore.scopeVersion) {
              return;
            }
            appStore.signalingServer.send(JSON.stringify({
              uid: this.me.id,
              targetId: target.id,
              type: '9002',
              data: { targetAddr: target.connAddressMe }
            }));
          }).catch(() => {
          });
        }
      },

      addCandidate(data) {
        const target = this.users.find(user => user.id === data.targetId);
        if (!target) {
          return;
        }
        target.addIceCandidate(data.candidate);
      },

      async joinConnection(data) {
        const appStore = useAppStore();
        const scopedVersion = appStore.scopeVersion;
        const user = this.users.find(item => item.id === data.targetId);
        if (!user) {
          return;
        }
        user.onicecandidate = (candidate) => {
          if (scopedVersion !== appStore.scopeVersion) {
            return;
          }
          if (!appStore.shouldSendCandidate(candidate)) {
            return;
          }
          appStore.signalingServer.send(JSON.stringify({
            uid: this.me.id,
            targetId: user.id,
            type: '9001',
            data: { candidate }
          }));
        };
        try {
          await user.connectTarget(data.offer.sdp);
          if (scopedVersion !== appStore.scopeVersion) {
            return;
          }
          appStore.signalingServer.send(JSON.stringify({
            uid: this.me.id,
            targetId: user.id,
            type: '9003',
            data: { targetAddr: user.connAddressMe }
          }));
          this.updateUserConnectionState(user);
        } catch (error) {
          console.error('joinConnection failed:', error);
        }
      },

      async joinedConnection(data) {
        const appStore = useAppStore();
        const scopedVersion = appStore.scopeVersion;
        const target = this.users.find(user => user.id === data.targetId);
        if (!target) {
          return;
        }
        try {
          await target.setRemoteSdp(data.answer.sdp);
          if (scopedVersion !== appStore.scopeVersion) {
            return;
          }
          this.updateUserConnectionState(target);
        } catch (error) {
          console.error('joinedConnection failed:', error);
        }
      },

      updateUserNickname(data) {
        const user = this.users.find(item => item.id === data.id);
        if (!user) {
          return;
        }
        user.nickname = data.nickname;
        this.updateUserConnectionState(user);
      },

      async loadPublicRooms() {
        this.isLoadingRooms = true;
        try {
          const response = await fetch('/api/public-rooms', { cache: 'no-store' });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          this.publicRooms = data.rooms || [];
          this.roomHintText = `公共房间最多 ${data.maxRooms} 个，剩余可新建：${data.availableSlots}`;
        } catch (error) {
          const reason = error && error.message ? error.message : '网络异常';
          this.roomHintText = `获取公共房间失败：${reason}`;
        } finally {
          this.isLoadingRooms = false;
        }
      },

      async joinRoom(roomId) {
        const appStore = useAppStore();
        const normalized = core.normalizePublicRoomName(roomId);
        if (!normalized) {
          throw new Error('房间名不合法');
        }
        appStore.currentMode = 'public';
        appStore.currentRoomId = normalized;
        appStore.updateScope(appStore.buildScopeId('public', normalized, ''));
        appStore.applyIceServers([]);
        appStore.disconnectSignaling(true);
        appStore.connectWebSocket();
        appStore.startPublicRoomRefresh();
        appStore.updateHashState();
        appStore.saveSession();
        await this.loadPublicRooms();
      }
    }
  });

  global.InternalChatStores = {
    pinia,
    useAppStore,
    useChatStore,
    useUserStore
  };
})(window);
