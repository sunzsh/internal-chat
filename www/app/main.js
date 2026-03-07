(function initMain(global) {
  const { createApp, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, toRaw } = Vue;
  const core = global.InternalChatCore;
  const peerState = global.InternalChatPeerState || {};
  const { pinia, useAppStore, useChatStore, useUserStore } = global.InternalChatStores;

  const app = createApp({
    setup() {
      const appStore = useAppStore();
      const chatStore = useChatStore();
      const userStore = useUserStore();

      const messageInput = ref('');
      const nicknameInput = ref('');
      const passwordInput = ref('');
      const newRoomName = ref('');
      const networkOptions = ref([{ id: 'auto', label: '自动（不限制）', lanKey: '', prefix: '' }]);
      const detectedLocalIps = ref([]);
      const selectedNetworkOption = ref('auto');
      const detectingNetworkOptions = ref(false);
      const useManualAdvanced = ref(false);
      const manualLanKeyInput = ref('');
      const manualCandidatePrefixInput = ref('');
      const manualHostCandidatesOnlyInput = ref(false);
      const showPublicRoomManager = ref(true);
      const showNetworkPanel = ref(false);
      const manualSpeedTesting = ref(false);
      const lastManualSpeedTestAt = ref('');
      const networkWidgetRef = ref(null);
      const messagesContainer = ref(null);
      const fileInput = ref(null);
      let userStateTimer = null;
      let speedTimer = null;
      let outsideClickHandler = null;

      const currentMode = computed(() => appStore.currentMode);
      const connectionStatus = computed(() => appStore.connectionStatus);
      const connectionStatusClass = computed(() => appStore.connectionStatusClass);
      const isReconnecting = computed(() => appStore.isReconnecting);
      const channelInfoText = computed(() => appStore.channelInfoText);
      const currentPublicRoomId = computed(() => appStore.currentRoomId);

      const showNicknameModal = computed({
        get: () => appStore.showNicknameModal,
        set: (val) => { appStore.showNicknameModal = val; }
      });

      const showPasswordModal = computed({
        get: () => appStore.showPasswordModal,
        set: (val) => { appStore.showPasswordModal = val; }
      });

      const showAdvancedModal = computed({
        get: () => appStore.showAdvancedModal,
        set: (val) => { appStore.showAdvancedModal = val; }
      });

      const messages = computed(() => chatStore.messages);
      const isDragging = computed(() => chatStore.isDragging);
      const toasts = computed(() => chatStore.toasts);

      const users = computed(() => userStore.users);
      const publicRooms = computed(() => userStore.publicRooms);
      const isLoadingRooms = computed(() => userStore.isLoadingRooms);
      const roomHintText = computed(() => userStore.roomHintText);
      const connectedUsersCount = computed(() => userStore.connectedUsersCount);
      const networkHealth = computed(() => userStore.networkHealth || {});
      const currentModeLabel = computed(() => {
        if (currentMode.value === 'public') {
          return '公共房间';
        }
        if (currentMode.value === 'private') {
          return '私有房间';
        }
        return '局域网';
      });
      const connectedPeerCount = computed(() => users.value.filter(user => {
        const target = unwrapUser(user);
        return target && !target.isMe && target.connected;
      }).length);
      const speedTestDescription = computed(() => {
        if (currentMode.value === 'lan') {
          return '测速按最近约 2 秒的 WebRTC 流量统计，空闲时显示 0B/s 属正常。';
        }
        return '测速按最近约 2 秒的 WebRTC 流量统计，公网/NAT 环境下波动会更明显。';
      });
      const networkDiagnosticItems = computed(() => {
        const health = networkHealth.value || {};
        const mode = currentMode.value;
        const peers = connectedPeerCount.value;
        return [
          {
            key: 'lanDirect',
            title: 'LAN直连',
            status: health.lanDirect || 'unknown',
            detail: getNetworkHealthDetail('lanDirect', health.lanDirect, mode, peers)
          },
          {
            key: 'natTraversal',
            title: 'P2P NAT穿透',
            status: health.natTraversal || 'unknown',
            detail: getNetworkHealthDetail('natTraversal', health.natTraversal, mode, peers)
          },
          {
            key: 'relayAvailable',
            title: 'Relay可用',
            status: health.relayAvailable || 'unknown',
            detail: getNetworkHealthDetail('relayAvailable', health.relayAvailable, mode, peers)
          }
        ];
      });

      onMounted(async () => {
        appStore.initializeApp();
        nicknameInput.value = appStore.nickname;
        await refreshNetworkOptions();
        syncSelectedNetworkOption();
        if (appStore.currentMode === 'public') {
          await userStore.loadPublicRooms();
          appStore.startPublicRoomRefresh();
        }
        showPublicRoomManager.value = !(appStore.currentMode === 'public' && appStore.currentRoomId);
        chatStore.loadHistory();
        setupDragAndDrop();
        userStateTimer = setInterval(() => {
          userStore.updateAllUserStates();
        }, 1500);
        speedTimer = setInterval(() => {
          userStore.updateTransferStats();
        }, 2000);
        outsideClickHandler = (event) => {
          if (!showNetworkPanel.value) {
            return;
          }
          const el = networkWidgetRef.value;
          if (el && !el.contains(event.target)) {
            showNetworkPanel.value = false;
          }
        };
        document.addEventListener('click', outsideClickHandler);
      });

      onBeforeUnmount(() => {
        if (userStateTimer) {
          clearInterval(userStateTimer);
        }
        if (speedTimer) {
          clearInterval(speedTimer);
        }
        if (outsideClickHandler) {
          document.removeEventListener('click', outsideClickHandler);
        }
        appStore.cleanup();
      });

      watch(messages, () => {
        nextTick(() => {
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
          }
        });
      }, { deep: true });

      watch(() => appStore.showAdvancedModal, (visible) => {
        if (visible) {
          refreshNetworkOptions();
          syncSelectedNetworkOption();
          manualLanKeyInput.value = appStore.lanKey || '';
          manualCandidatePrefixInput.value = appStore.candidatePrefix || '';
          manualHostCandidatesOnlyInput.value = appStore.hostCandidatesOnly;
        }
      });

      watch(currentPublicRoomId, (roomId) => {
        if (appStore.currentMode !== 'public') {
          return;
        }
        showPublicRoomManager.value = !roomId;
      });

      watch(currentMode, (mode) => {
        if (mode !== 'public') {
          showPublicRoomManager.value = true;
        }
      });

      function syncSelectedNetworkOption() {
        const candidatePrefix = (appStore.candidatePrefix || '').trim();
        const lanKey = (appStore.lanKey || '').trim();
        if (!candidatePrefix && !lanKey) {
          selectedNetworkOption.value = 'auto';
          useManualAdvanced.value = false;
          return;
        }
        const matched = networkOptions.value.find(option => option.prefix === candidatePrefix || option.lanKey === lanKey);
        if (matched) {
          selectedNetworkOption.value = matched.id;
          useManualAdvanced.value = false;
          return;
        }
        selectedNetworkOption.value = 'auto';
        useManualAdvanced.value = true;
      }

      async function refreshNetworkOptions() {
        if (detectingNetworkOptions.value) {
          return;
        }
        detectingNetworkOptions.value = true;
        try {
          const detectedResult = await core.detectLocalNetworks();
          const detected = detectedResult.networks || [];
          detectedLocalIps.value = detectedResult.localIps || [];
          networkOptions.value = [
            { id: 'auto', label: '自动（不限制）', lanKey: '', prefix: '' },
            ...detected
          ];
          syncSelectedNetworkOption();
        } catch (error) {
          console.error('refreshNetworkOptions failed:', error);
          networkOptions.value = [{ id: 'auto', label: '自动（不限制）', lanKey: '', prefix: '' }];
          detectedLocalIps.value = [];
          selectedNetworkOption.value = 'auto';
        } finally {
          detectingNetworkOptions.value = false;
        }
      }

      function setupDragAndDrop() {
        let dragCounter = 0;
        document.addEventListener('dragenter', (event) => {
          event.preventDefault();
          dragCounter += 1;
          if (event.dataTransfer.types.includes('Files')) {
            chatStore.isDragging = true;
          }
        });
        document.addEventListener('dragleave', (event) => {
          event.preventDefault();
          dragCounter -= 1;
          if (dragCounter <= 0) {
            dragCounter = 0;
            chatStore.isDragging = false;
          }
        });
        document.addEventListener('dragover', (event) => {
          event.preventDefault();
        });
        document.addEventListener('drop', (event) => {
          event.preventDefault();
          dragCounter = 0;
          chatStore.isDragging = false;
          if (event.dataTransfer.files.length > 0) {
            handleFileUpload(event.dataTransfer.files[0]);
          }
        });
      }

      function switchMode(mode) {
        appStore.switchMode(mode);
      }

      function unwrapUser(user) {
        if (typeof toRaw === 'function') {
          return toRaw(user);
        }
        return user;
      }

      function canSendToUser(user) {
        const target = unwrapUser(user);
        if (!target || target.isMe) {
          return false;
        }
        const pcState = target.getConnectionState ? target.getConnectionState() : target.connectionState;
        const channelState = target.chatChannel ? target.chatChannel.readyState : '';
        if (peerState.canSendData) {
          return peerState.canSendData({
            isMe: target.isMe,
            pcState,
            channelState
          });
        }
        return target.isConnected ? target.isConnected() : false;
      }

      function reconnect() {
        appStore.reconnect();
      }

      async function loadPublicRooms() {
        await userStore.loadPublicRooms();
      }

      async function createAndJoinRoom() {
        const roomName = core.normalizePublicRoomName(newRoomName.value);
        if (!roomName) {
          chatStore.showToast({ type: 'warning', message: '请输入合法房间名（字母、数字、_、-）' });
          return;
        }
        newRoomName.value = roomName;
        try {
          await userStore.joinRoom(roomName);
          showPublicRoomManager.value = false;
        } catch (error) {
          chatStore.showToast({ type: 'error', message: error.message || '进入房间失败' });
        }
      }

      async function joinRoom(roomId) {
        try {
          await userStore.joinRoom(roomId);
          showPublicRoomManager.value = false;
        } catch (error) {
          chatStore.showToast({ type: 'error', message: error.message || '进入房间失败' });
        }
      }

      async function togglePublicRoomManager() {
        showPublicRoomManager.value = !showPublicRoomManager.value;
        if (showPublicRoomManager.value) {
          await userStore.loadPublicRooms();
        }
      }

      function sendMessage() {
        if (!messageInput.value.trim()) {
          return;
        }
        const message = messageInput.value;
        chatStore.addChatMessage(userStore.me.id, message, appStore.nickname);
        userStore.users.forEach(user => {
          const target = unwrapUser(user);
          if (!canSendToUser(target)) {
            return;
          }
          target.sendMessage(message).catch(() => {
          });
        });
        messageInput.value = '';
      }

      function selectFile() {
        fileInput.value.click();
      }

      function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
          handleFileUpload(file);
        }
        event.target.value = '';
      }

      async function handleFileUpload(file) {
        const targetUsers = userStore.users
          .map(user => unwrapUser(user))
          .filter(user => canSendToUser(user));
        if (targetUsers.length === 0) {
          chatStore.showToast({ type: 'warning', message: '没有可用的接收用户' });
          return;
        }
        for (const user of targetUsers) {
          await sendFileToUser(user, file);
        }
      }

      async function sendFileToUser(user, file) {
        const target = unwrapUser(user);
        try {
          const fileInfo = { name: file.name, size: file.size };
          await target.sendFile(fileInfo, file, () => {
          });
          const displayName = target.nickname || target.id;
          chatStore.addChatMessage(userStore.me.id, `[文件] ${fileInfo.name} (发送给: ${displayName})`, appStore.nickname);
          chatStore.showToast({ type: 'success', message: `文件已发送给 ${displayName}` });
        } catch (error) {
          const displayName = target.nickname || target.id;
          const reason = error && error.message ? error.message : '未知错误';
          chatStore.showToast({ type: 'error', message: `发送给 ${displayName} 失败：${reason}` });
        }
      }

      function healthEmoji(status) {
        if (status === 'up') {
          return '🟢';
        }
        if (status === 'warn') {
          return '🟡';
        }
        if (status === 'down') {
          return '🔴';
        }
        return '⚪';
      }

      function healthClass(status) {
        if (status === 'up') {
          return 'up';
        }
        if (status === 'warn') {
          return 'warn';
        }
        if (status === 'down') {
          return 'down';
        }
        return 'unknown';
      }

      function healthLabel(status) {
        if (status === 'up') {
          return '正常';
        }
        if (status === 'warn') {
          return '可用/待验证';
        }
        if (status === 'down') {
          return '不可用';
        }
        return '未检测';
      }

      function getNetworkHealthDetail(kind, status, mode, connectedPeerCountValue) {
        const peers = Number(connectedPeerCountValue) || 0;
        const hasPeers = peers > 0;
        if (kind === 'lanDirect') {
          if (status === 'up') {
            return mode === 'lan'
              ? '已检测到同网段 host-host 直连，通常延迟最低。'
              : '当前会话中存在同网段直连路径。';
          }
          if (!hasPeers) {
            return '暂无已连接对端，建立连接后才会更新结果。';
          }
          if (mode === 'lan') {
            return '当前未命中局域网直连，可能不在同网段或被网卡筛选限制。';
          }
          return '当前连接未走局域网直连（在公网房间属于常见情况）。';
        }
        if (kind === 'natTraversal') {
          if (status === 'up') {
            return mode === 'public'
              ? '已通过 NAT 穿透建立 P2P，公网房间主要依赖此路径。'
              : '当前连接已出现 NAT 穿透路径。';
          }
          if (!hasPeers) {
            return '暂无已连接对端，建立连接后才会更新结果。';
          }
          if (mode === 'public') {
            return '未检测到 NAT 穿透，通常与双方 NAT/防火墙策略有关。';
          }
          return '当前连接未使用 NAT 穿透。';
        }
        if (kind === 'relayAvailable') {
          if (mode === 'lan' || mode === 'public') {
            if (status === 'up') {
              return '当前路径出现中继流量。';
            }
            return '当前模式不启用中继兜底，连不上会直接失败。';
          }
          if (status === 'up') {
            return '当前已命中 TURN 中继链路。';
          }
          if (status === 'warn') {
            return '已配置 TURN，但当前尚未实际走中继。';
          }
          if (!hasPeers) {
            return '暂无已连接对端，建立连接后才会更新结果。';
          }
          return '当前未检测到 TURN 中继路径。';
        }
        return '等待检测数据。';
      }

      function formatClock(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      }

      async function manualSpeedTest() {
        if (manualSpeedTesting.value) {
          return;
        }
        if (connectedPeerCount.value <= 0) {
          chatStore.showToast({ type: 'warning', message: '当前没有已连接对端，无法测速' });
          return;
        }
        manualSpeedTesting.value = true;
        try {
          await userStore.runManualSpeedTest(3, 800);
          lastManualSpeedTestAt.value = formatClock(new Date());
          chatStore.showToast({ type: 'info', message: '已完成一次手动测速（最近约2秒样本）' });
        } finally {
          manualSpeedTesting.value = false;
        }
      }

      function toggleNetworkPanel() {
        showNetworkPanel.value = !showNetworkPanel.value;
      }

      function saveNickname() {
        if (!nicknameInput.value.trim()) {
          chatStore.showToast({ type: 'warning', message: '请输入昵称' });
          return;
        }
        appStore.nickname = nicknameInput.value.trim();
        document.cookie = `nickname=${encodeURIComponent(appStore.nickname)}; max-age=31536000; path=/`;
        if (appStore.signalingServer && appStore.signalingServer.readyState === WebSocket.OPEN) {
          appStore.signalingServer.send(JSON.stringify({
            uid: userStore.me.id,
            targetId: userStore.me.id,
            type: '9004',
            data: { nickname: appStore.nickname }
          }));
        }
        appStore.showNicknameModal = false;
        appStore.saveSession();
        chatStore.showToast({ type: 'success', message: '昵称已保存' });
      }

      function submitPassword() {
        if (!passwordInput.value) {
          chatStore.showToast({ type: 'warning', message: '请输入密码' });
          return;
        }
        appStore.roomPassword = core.MD5(passwordInput.value);
        appStore.currentMode = 'private';
        appStore.showPasswordModal = false;
        appStore.connectWebSocket();
      }

      function saveAdvancedOptions() {
        if (useManualAdvanced.value) {
          const normalizedManualLanKey = core.normalizeLanKey(manualLanKeyInput.value || '');
          if (manualLanKeyInput.value && !normalizedManualLanKey) {
            chatStore.showToast({ type: 'warning', message: '手动 LAN 分组键仅支持字母数字 . _ -' });
            return;
          }
          appStore.applyAdvancedOptions({
            lanKey: normalizedManualLanKey,
            candidatePrefix: (manualCandidatePrefixInput.value || '').trim(),
            hostCandidatesOnly: Boolean(manualHostCandidatesOnlyInput.value)
          });
        } else {
          const selected = networkOptions.value.find(option => option.id === selectedNetworkOption.value) || networkOptions.value[0];
          const useScopedNetwork = selected && selected.id !== 'auto';
          appStore.applyAdvancedOptions({
            lanKey: useScopedNetwork ? selected.lanKey : '',
            candidatePrefix: useScopedNetwork ? selected.prefix : '',
            hostCandidatesOnly: useScopedNetwork
          });
        }
        appStore.showAdvancedModal = false;
        if (appStore.currentMode === 'lan') {
          appStore.disconnectSignaling(true);
          appStore.connectWebSocket();
          appStore.updateHashState();
          appStore.saveSession();
        }
        chatStore.showToast({ type: 'success', message: '网络选项已保存' });
      }

      function previewImage(url, name) {
        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
          return;
        }
        previewWindow.document.write(`
          <html>
            <head>
              <title>${name}</title>
              <style>
                body{margin:0;padding:20px;background:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh;}
                img{max-width:100%;max-height:90vh;object-fit:contain;border-radius:8px;}
              </style>
            </head>
            <body><img src="${url}" alt="${name}" /></body>
          </html>
        `);
        previewWindow.document.close();
      }

      function clearHistory() {
        if (confirm('确定要清除所有历史记录吗？')) {
          chatStore.clearHistory();
        }
      }

      function removeToast(id) {
        chatStore.removeToast(id);
      }

      return {
        messageInput,
        nicknameInput,
        passwordInput,
        newRoomName,
        networkOptions,
        detectedLocalIps,
        selectedNetworkOption,
        detectingNetworkOptions,
        useManualAdvanced,
        manualLanKeyInput,
        manualCandidatePrefixInput,
        manualHostCandidatesOnlyInput,
        showPublicRoomManager,
        showNetworkPanel,
        manualSpeedTesting,
        lastManualSpeedTestAt,
        networkWidgetRef,
        messagesContainer,
        fileInput,
        currentMode,
        connectionStatus,
        connectionStatusClass,
        isReconnecting,
        channelInfoText,
        currentPublicRoomId,
        showNicknameModal,
        showPasswordModal,
        showAdvancedModal,
        messages,
        isDragging,
        toasts,
        users,
        publicRooms,
        isLoadingRooms,
        roomHintText,
        connectedUsersCount,
        networkHealth,
        currentModeLabel,
        connectedPeerCount,
        speedTestDescription,
        networkDiagnosticItems,
        switchMode,
        reconnect,
        loadPublicRooms,
        createAndJoinRoom,
        joinRoom,
        togglePublicRoomManager,
        sendMessage,
        selectFile,
        handleFileSelect,
        saveNickname,
        submitPassword,
        saveAdvancedOptions,
        refreshNetworkOptions,
        healthEmoji,
        healthLabel,
        healthClass,
        manualSpeedTest,
        toggleNetworkPanel,
        previewImage,
        clearHistory,
        removeToast
      };
    }
  });

  app.use(pinia);
  app.mount('#app');
})(window);
