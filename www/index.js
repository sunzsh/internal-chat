const { createApp } = Vue;

const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${wsProtocol}://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/ws`;

// MD5 函数
var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

window.fgdx_configuration = {
  iceServers: [
    {
      urls: ['stun:74.125.250.129:19302']
    }
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10
};

createApp({
  data() {
    return {
      // 连接状态
      signalingServer: null,
      me: new XChatUser(),
      users: [],
      
      // UI 状态
      currentMode: 'lan',
      isDragging: false,
      showNicknameModal: false,
      showPasswordModal: false,
      
      // 输入
      messageInput: '',
      nicknameInput: '',
      passwordInput: '',
      newRoomName: '',
      
      // 消息和房间
      messages: [],
      publicRooms: [],
      currentPublicRoomId: null,
      privateRoomId: null,
      roomPassword: '',
      
      // 其他
      currentNickname: '',
      keepaliveTimer: null,
      publicRoomsRefreshTimer: null,
      roomHintText: '公共房间最多 5 个',
      baseIceServers: JSON.parse(JSON.stringify(window.fgdx_configuration.iceServers || []))
    };
  },
  computed: {
    channelInfoText() {
      if (this.currentMode === 'public') {
        const roomPart = this.currentPublicRoomId ? ` / 房间：${this.currentPublicRoomId}` : ' / 未进入房间';
        return `当前模式：公共房间${roomPart}`;
      }
      if (this.currentMode === 'private') {
        return `当前模式：私有房间${this.privateRoomId ? ` / ${this.privateRoomId}` : ''}`;
      }
      return '当前模式：局域网';
    },
    
    connectionStatus() {
      return this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';
    },
    
    connectedUsers() {
      return this.users.filter(u => u.connected);
    }
  },
  
  mounted() {
    this.initPage();
    this.setupDragAndDrop();
  },
  
  beforeUnmount() {
    this.disconnectSignaling();
  },
  
  methods: {
    // 初始化
    initPage() {
      if (!window.RTCPeerConnection && !window.webkitRTCPeerConnection) {
        this.addSystemMessage('您的浏览器不支持WebRTC，请使用Chrome、Firefox、Safari等现代浏览器访问。');
        return;
      }

      this.privateRoomId = window.location.pathname.split('/')[1];
      if (this.privateRoomId) {
        this.currentMode = 'private';
        this.showPasswordModal = true;
      } else {
        this.currentMode = 'lan';
        this.connectWebSocket();
      }
      
      // 读取保存的昵称
      const match = document.cookie.match(/nickname=([^;]+)/);
      if (match) {
        this.currentNickname = decodeURIComponent(match[1]);
        this.nicknameInput = this.currentNickname;
      }
    },
    
    // 拖拽上传
    setupDragAndDrop() {
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.isDragging = true;
      });
      
      document.addEventListener('dragleave', (e) => {
        if (e.target === document.body || e.target === document.documentElement) {
          this.isDragging = false;
        }
      });
      
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        this.isDragging = false;
        
        if (e.dataTransfer.files.length > 0) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    },
    
    // WebSocket 连接
    connectWebSocket() {
      const wsUrlWithPassword = this.getCurrentWsUrl();
      if (!wsUrlWithPassword) {
        return;
      }
      
      this.signalingServer = new WebSocket(wsUrlWithPassword);
      
      this.signalingServer.onopen = () => {
        console.log('Connected to signaling server');
        
        this.clearKeepalive();
        this.keepaliveTimer = setInterval(() => {
          if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.signalingServer.send(JSON.stringify({type: '9999'}));
          }
        }, 10000);
        
        // 发送昵称
        if (this.currentNickname) {
          setTimeout(() => {
            this.signalingServer.send(JSON.stringify({
              uid: this.me.id,
              targetId: this.me.id,
              type: '9004',
              data: { nickname: this.currentNickname }
            }));
          }, 100);
        }
      };
      
      this.signalingServer.onmessage = ({ data: responseStr }) => {
        const response = JSON.parse(responseStr);
        const { type, data } = response;
        
        if (type === '1001') {
          this.me.id = data.id;
          this.me.roomId = data.roomId;
          
          if (this.currentMode === 'private' && this.privateRoomId && this.me.roomId !== this.privateRoomId) {
            this.addSystemMessage('房间密码错误，请重新输入');
            this.disconnectSignaling();
            this.showPasswordModal = true;
            this.passwordInput = '';
            return;
          }
          
          this.applyIceServers(data.turns);
          return;
        }
        
        if (type === '1002') {
          this.refreshUsers(data);
          return;
        }
        
        if (type === '1003') {
          this.connectAllOther();
          return;
        }
        
        if (type === '1004') {
          this.addCandidate(data);
          return;
        }
        
        if (type === '1005') {
          this.joinConnection(data);
          return;
        }
        
        if (type === '1006') {
          this.joinedConnection(data);
          return;
        }
        
        if (type === '1007') {
          const user = this.users.find(u => u.id === data.id);
          if (user) {
            user.nickname = data.nickname;
          }
          return;
        }
        
        if (type === '1099') {
          this.handleServerError(data);
          return;
        }
      };
      
      this.signalingServer.onclose = () => {
        this.clearKeepalive();
        if (this.currentMode === 'public') {
          this.loadPublicRooms();
        }
      };
      
      this.signalingServer.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    },
    
    getCurrentWsUrl() {
      const wsBase = wsUrl.replace(/\/$/g, '');
      if (this.currentMode === 'public') {
        if (!this.currentPublicRoomId) {
          return null;
        }
        return `${wsBase}/public/${encodeURIComponent(this.currentPublicRoomId)}`;
      }
      if (this.currentMode === 'private') {
        return `${wsBase}/${encodeURIComponent(this.privateRoomId)}${this.roomPassword ? '/' + this.roomPassword : ''}`;
      }
      return `${wsBase}/`;
    },
    
    disconnectSignaling() {
      this.clearKeepalive();
      if (this.signalingServer) {
        try {
          this.signalingServer.close();
        } catch {}
      }
      this.signalingServer = null;
      this.users.forEach(u => u.closeConnection && u.closeConnection());
      this.users = [];
    },
    
    clearKeepalive() {
      if (this.keepaliveTimer) {
        clearInterval(this.keepaliveTimer);
        this.keepaliveTimer = null;
      }
    },
    
    applyIceServers(turns) {
      window.fgdx_configuration.iceServers = JSON.parse(JSON.stringify(this.baseIceServers));
      if (this.currentMode === 'private' && Array.isArray(turns) && turns.length > 0) {
        turns.forEach(turn => {
          window.fgdx_configuration.iceServers.push(turn);
        });
      }
    },
    
    // 模式切换
    switchMode(mode) {
      if (mode === 'lan') {
        this.switchToLanMode();
      } else if (mode === 'public') {
        this.switchToPublicMode();
      }
    },
    
    async switchToLanMode() {
      if (this.publicRoomsRefreshTimer) {
        clearInterval(this.publicRoomsRefreshTimer);
        this.publicRoomsRefreshTimer = null;
      }
      this.currentPublicRoomId = null;
      this.currentMode = 'lan';
      this.applyIceServers([]);
      this.disconnectSignaling();
      this.connectWebSocket();
    },
    
    async switchToPublicMode() {
      this.currentMode = 'public';
      this.applyIceServers([]);
      this.disconnectSignaling();
      await this.loadPublicRooms();
      
      if (this.publicRoomsRefreshTimer) {
        clearInterval(this.publicRoomsRefreshTimer);
      }
      this.publicRoomsRefreshTimer = setInterval(() => {
        this.loadPublicRooms();
      }, 10000);
    },
    
    // 公共房间
    async loadPublicRooms() {
      try {
        const response = await fetch('/api/public-rooms', { cache: 'no-store' });
        const data = await response.json();
        this.publicRooms = data.rooms || [];
        this.roomHintText = `公共房间最多 ${data.maxRooms} 个，剩余可新建：${data.availableSlots}`;
      } catch (error) {
        console.error('Failed to load public rooms:', error);
        this.roomHintText = '获取公共房间失败';
      }
    },
    
    sanitizePublicRoomName(name) {
      return (name || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 32);
    },
    
    async createAndJoinRoom() {
      const roomName = this.sanitizePublicRoomName(this.newRoomName);
      if (!roomName) {
        alert('请输入合法房间名（字母、数字、_、-）');
        return;
      }
      this.newRoomName = roomName;
      await this.joinRoom(roomName);
    },
    
    async joinRoom(roomId) {
      const normalizedRoomId = this.sanitizePublicRoomName(roomId);
      if (!normalizedRoomId) {
        alert('房间名不合法');
        return;
      }
      this.currentPublicRoomId = normalizedRoomId;
      this.currentMode = 'public';
      this.disconnectSignaling();
      this.connectWebSocket();
      await this.loadPublicRooms();
    },
    
    // 用户管理
    refreshUsers(data) {
      const resUsers = data.map(u => {
        let uOld = this.users.find(uOld => uOld.id === u.id);
        if (uOld) {
          u.nickname = u.nickname || uOld.nickname;
          return uOld;
        }
        
        let xchatUser = new XChatUser();
        xchatUser.id = u.id;
        xchatUser.isMe = u.id === this.me.id;
        xchatUser.nickname = u.nickname;
        
        xchatUser.onmessage = (msg) => {
          this.addChatMessage(xchatUser.id, msg, xchatUser.nickname);
        };
        
        xchatUser.onReviceFile = (file) => {
          this.addFileMessage(xchatUser.id, file, xchatUser.nickname);
        };
        
        xchatUser.onConnectionStateChange = () => {
          this.$forceUpdate();
        };
        
        return xchatUser;
      });
      
      const delUsers = this.users.filter(u => !resUsers.find(u2 => u2.id === u.id));
      delUsers.forEach(u => {
        u.closeConnection && u.closeConnection();
      });
      
      this.users = resUsers;
    },
    
    connectAllOther() {
      if (this.users.length <= 1) {
        return;
      }
      const targets = this.users.filter(u => u.id !== this.me.id);
      for (const target of targets) {
        target.onicecandidate = (candidate) => {
          this.signalingServer.send(JSON.stringify({
            uid: this.me.id,
            targetId: target.id,
            type: '9001',
            data: { candidate }
          }));
        };
        target.createConnection().then(() => {
          this.signalingServer.send(JSON.stringify({
            uid: this.me.id,
            targetId: target.id,
            type: '9002',
            data: { targetAddr: target.connAddressMe }
          }));
        });
      }
    },
    
    addCandidate(data) {
      const target = this.users.find(u => u.id === data.targetId);
      if (!target) return;
      target.addIceCandidate(data.candidate);
    },
    
    async joinConnection(data) {
      const user = this.users.find(u => u.id === data.targetId);
      if (!user) return;
      
      user.onicecandidate = (candidate) => {
        this.signalingServer.send(JSON.stringify({
          uid: this.me.id,
          targetId: user.id,
          type: '9001',
          data: { candidate }
        }));
      };
      
      try {
        await user.connectTarget(data.offer.sdp);
        this.signalingServer.send(JSON.stringify({
          uid: this.me.id,
          targetId: user.id,
          type: '9003',
          data: { targetAddr: user.connAddressMe }
        }));
      } catch (error) {
        console.error('joinConnection failed:', error);
      }
    },
    
    async joinedConnection(data) {
      const target = this.users.find(u => u.id === data.targetId);
      if (!target) return;
      
      try {
        await target.setRemoteSdp(data.answer.sdp);
      } catch (error) {
        console.error('joinedConnection failed:', error);
      }
    },
    
    handleServerError(data) {
      const message = data?.message || '服务端返回错误';
      this.addSystemMessage(message);
      if (data?.code === 'PUBLIC_ROOM_LIMIT') {
        this.currentPublicRoomId = null;
        this.loadPublicRooms();
      }
    },
    
    // 消息处理
    addSystemMessage(content) {
      this.messages.push({
        type: 'system',
        userName: '系统',
        content: this.escapeHtml(content),
        time: this.formatTime(new Date()),
        isMe: false
      });
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    addChatMessage(userId, content, nickname) {
      // 过滤系统控制消息
      if (typeof content === 'string' && content.startsWith('##')) {
        return;
      }
      try {
        const parsed = JSON.parse(content);
        if (parsed.type && parsed.type.startsWith('##')) {
          return;
        }
      } catch {}
      
      let msg = this.escapeHtml(content);
      // 转换URL为链接
      if (/(http|https):\/\/[^\s<>"']+/g.test(msg)) {
        msg = msg.replace(/(http|https):\/\/[^\s<>"']+/g, (url) => {
          return `<a href="${url}" target="_blank">${url}</a>`;
        });
      }
      
      this.messages.push({
        type: 'text',
        userName: userId === this.me.id ? '我' : (nickname || userId),
        content: msg,
        time: this.formatTime(new Date()),
        isMe: userId === this.me.id
      });
      
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    addFileMessage(userId, file, nickname) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      
      this.messages.push({
        type: isImage ? 'image' : 'file',
        userName: userId === this.me.id ? '我' : (nickname || userId),
        fileName: file.name,
        fileUrl: file.url,
        time: this.formatTime(new Date()),
        isMe: userId === this.me.id
      });
      
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    sendMessage() {
      if (!this.messageInput.trim()) return;
      
      const message = this.messageInput;
      this.addChatMessage(this.me.id, message, this.currentNickname);
      
      this.users.forEach(u => {
        if (u.isMe || !u.isConnected()) return;
        u.sendMessage(message).catch(() => {});
      });
      
      this.messageInput = '';
    },
    
    // 文件处理
    selectFile() {
      this.$refs.fileInput.click();
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
      event.target.value = '';
    },
    
    async handleFileUpload(file) {
      const otherUsers = this.users.filter(u => !u.isMe && u.isConnected());
      
      if (otherUsers.length === 0) {
        alert('没有可用的接收用户');
        return;
      }
      
      if (otherUsers.length === 1) {
        await this.sendFileToUser(otherUsers[0], file);
      } else {
        // 多个用户时显示选择对话框（简化版本，直接发送给所有人）
        for (const user of otherUsers) {
          await this.sendFileToUser(user, file);
        }
      }
    },
    
    async sendFileToUser(user, file) {
      try {
        const fileInfo = { name: file.name, size: file.size };
        await user.sendFile(fileInfo, file, (sent, total) => {
          // 可以在这里更新进度
          console.log(`Progress: ${(sent / total * 100).toFixed(2)}%`);
        });
        
        const displayName = user.nickname || user.id;
        this.addChatMessage(this.me.id, `[文件] ${fileInfo.name} (发送给: ${displayName})`, this.currentNickname);
      } catch (error) {
        console.error('发送文件失败:', error);
        alert('发送文件失败，请重试');
      }
    },
    
    // 昵称设置
    saveNickname() {
      if (!this.nicknameInput.trim()) {
        alert('请输入昵称');
        return;
      }
      
      this.currentNickname = this.nicknameInput.trim();
      document.cookie = `nickname=${encodeURIComponent(this.currentNickname)}; max-age=31536000; path=/`;
      
      if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
        this.signalingServer.send(JSON.stringify({
          uid: this.me.id,
          targetId: this.me.id,
          type: '9004',
          data: { nickname: this.currentNickname }
        }));
      }
      
      this.showNicknameModal = false;
    },
    
    // 密码提交
    submitPassword() {
      if (!this.passwordInput) {
        alert('请输入密码');
        return;
      }
      
      this.roomPassword = MD5(this.passwordInput);
      this.currentMode = 'private';
      this.showPasswordModal = false;
      this.connectWebSocket();
    },
    
    // 图片预览
    previewImage(url, name) {
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>${name}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #0f172a;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 90vh;
                  object-fit: contain;
                  border-radius: 8px;
                }
              </style>
            </head>
            <body>
              <img src="${url}" alt="${name}" />
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    },
    
    // 工具函数
    escapeHtml(text) {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  },
  
  watch: {
    users: {
      handler() {
        // 更新用户显示信息
        this.users.forEach(user => {
          user.displayName = user.isMe ? '我' : (user.nickname || user.id);
          user.connected = user.isConnected ? user.isConnected() : false;
          user.connectionState = user.getConnectionState ? user.getConnectionState() : 'disconnected';
          user.statusText = user.connected ? '已连接' : '未连接';
        });
      },
      deep: true
    }
  }
}).mount('#app');
