const wsUrl = 'wss://fagedongxi.com/ws';

var users = [];
var me = new XChatUser();

// 添加当前传输用户的引用
let currentTransferUser = null;
let currentNickname = '';
let roomPassword = ''; // 存储房间密码
let signalingServer = null;

var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}


// 初始化页面
function initPage() {
  const roomId = window.location.pathname.split('/')[1];
  if (roomId) {
    // 如果有roomId，显示密码输入框并隐藏主界面
    document.querySelector('.left').style.display = 'none';
    document.querySelector('.right').style.display = 'none';
    document.getElementById('passwordModal').style.display = 'block';
    
    // 添加回车事件监听
    const passwordInput = document.getElementById('roomPasswordInput');
    passwordInput.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitRoomPassword();
      }
    };
    // 自动聚焦密码输入框
    setTimeout(() => passwordInput.focus(), 0);
  } else {
    // 没有roomId，显示主界面
    document.querySelector('.left').style.display = 'flex';
    document.querySelector('.right').style.display = 'block';
    document.getElementById('passwordModal').style.display = 'none';
    // 连接WebSocket
    connectWebSocket();
  }
}

// 提交房间密码
function submitRoomPassword() {
  const passwordInput = document.getElementById('roomPasswordInput');
  roomPassword = passwordInput.value;
  
  if (!roomPassword) {
    alert('请输入密码');
    return;
  } else {
    roomPassword = MD5(roomPassword);
  }
  
  // 隐藏密码输入框，显示主界面
  document.getElementById('passwordModal').style.display = 'none';
  document.querySelector('.left').style.display = 'flex';
  document.querySelector('.right').style.display = 'block';
  
  // 连接WebSocket
  connectWebSocket();
}

// 连接WebSocket
function connectWebSocket() {
  const roomId = window.location.pathname.split('/')[1];
  const wsUrlWithPassword = wsUrl.replace(/\/$/g, '') + '/' + roomId + (roomPassword ? '/' + roomPassword : '');
  signalingServer = new WebSocket(wsUrlWithPassword);
  
  signalingServer.onopen = () => {
    console.log('Connected to signaling server');
    
    // 读取保存的昵称
    const match = document.cookie.match(/nickname=([^;]+)/);
    if (match) {
      currentNickname = decodeURIComponent(match[1]);
    }
    
    setInterval(() => {
      signalingServer.send(JSON.stringify({type: '9999'}));
    }, 1000 * 10);
  }

  signalingServer.onmessage = ({ data: responseStr }) => {
    const response = JSON.parse(responseStr);
    const { type, data } = response;

    if (type === '1001') {
      me.id = data.id;
      me.roomId = data.roomId;
      if (roomId && me.roomId !== roomId) {
        addChatItem('system', '房间密码错误，已切换至内网频道');
        return;
      }
      if (data.turns && data.turns.length > 0) {
        window.fgdx_configuration.iceServers.push(...data.turns)
      }
      // 如果有保存的昵称，发送给服务器
      if (currentNickname) {
        signalingServer.send(JSON.stringify({
          uid: me.id,
          targetId: me.id,
          type: '9004',
          data: { nickname: currentNickname }
        }));
      }
      return;
    }
    if (type === '1002') {
      refreshUsers(data);
      return;
    }
    if (type === '1003') {
      joinedRoom()
      return;
    }
    if (type === '1004') {
      addCandidate(data);
      return;
    }
    if (type === '1005') {
      joinConnection(data);
      return;
    }
    if (type === '1006') {
      joinedConnection(data);
      return;
    }
    if (type === '1007') {
      const user = users.find(u => u.id === data.id);
      if (user) {
        user.nickname = data.nickname;
        refreshUsersHTML();
      }
      return;
    }
  }

  signalingServer.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (error.target.readyState === WebSocket.CLOSED) {
      alert('密码错误或连接失败');
      // 显示密码输入框，隐藏主界面
      document.querySelector('.left').style.display = 'none';
      document.querySelector('.right').style.display = 'none';
      document.getElementById('passwordModal').style.display = 'block';
      document.getElementById('roomPasswordInput').value = '';
      document.getElementById('roomPasswordInput').focus();
    }
  };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

function setRemote() {
  me.setRemoteSdp(remoteSDP.value);
}

async function copy(e, msg) {
  const currentTarget = e.currentTarget
  function copySuccess() {
    currentTarget.innerHTML = `
      <svg viewBox="0 0 1024 1024" width="20" height="21"><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5L207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" fill="currentColor"></path></svg>
    `
    const timer = setTimeout(() => {
      currentTarget.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"></path></svg>
      `
      clearTimeout(timer)
    }, 1000);
  }
  function fallbackCopy() {
    const textarea = document.createElement('textarea');
    textarea.value = msg;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copySuccess()
  }
  try {
    await navigator.clipboard.writeText(msg);
    copySuccess()
  } catch (error) {
    fallbackCopy()
  }
}

function addLinkItem(uid, file) {
  const chatBox = document.querySelector('.chat-wrapper');
  const chatItem = document.createElement('div');
  chatItem.className = 'chat-item';
  
  const user = users.find(u => u.id === uid);
  const displayName = user?.nickname || uid;
  
  chatItem.innerHTML = `
    <div class="chat-item_user">${uid === me.id ? '（我）': ''}${displayName} :</div>
    <div class="chat-item_content"><a class="file" href="${file.url}" download="${file.name}">[文件] ${file.name}</a></div>
  `;
  chatBox.appendChild(chatItem);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addChatItem(uid, message) {
  // 如果是系统控制消息（以##开头），不显示在聊天记录中
  try {
    if (typeof message === 'string' && message.startsWith('##')) {
      return;
    }
    const parsed = JSON.parse(message);
    if (parsed.type && parsed.type.startsWith('##')) {
      return;
    }
  } catch {
    // 不是JSON消息，继续正常处理
  }

  const chatBox = document.querySelector('.chat-wrapper');
  const chatItem = document.createElement('div');
  chatItem.className = 'chat-item';
  let msg = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const copyText = msg
  // 判断是否url，兼容端口号的网址,http://127.0.0.1:8080/
  if (/(http|https):\/\/[a-zA-Z0-9\.\-\/\?=\:_]+/g.test(msg)) {
    msg = msg.replace(/(http|https):\/\/[a-zA-Z0-9\.\-\/\?=\:_]+/g, (url) => {
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }

  const user = users.find(u => u.id === uid);
  const displayName = uid === 'system' ? '系统' : (user?.nickname || uid);
  const isSystem = uid === 'system';

  const copyButton = document.createElement('button')
  copyButton.className = 'copy-btn'
  copyButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"></path></svg>'
  copyButton.onclick = function () {
    copy(event,copyText)
  }

  chatItem.innerHTML = `
    <div class="chat-item_user ${isSystem ? 'system' : ''}">${!isSystem && uid === me.id ? '（我）': ''}${displayName} :</div>
    <div class="chat-item_content">
      <pre>${msg}</pre>
    </div>
  `;
  if (!isSystem) {
    chatItem.querySelector('.chat-item_content').appendChild(copyButton);
  }
  chatBox.appendChild(chatItem);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function sendMessage(msg) {
  const message = msg ?? messageInput.value;
  addChatItem(me.id, message);
  users.forEach(u => {
    if (u.isMe) {
      return;
    }
    u.sendMessage(message);
  });
  messageInput.value = '';
}

async function sendFile(file) {
  pendingFile = file;
  
  const otherUsers = users.filter(u => !u.isMe);
  
  if (otherUsers.length === 1) {
    const modal = document.getElementById('userSelectModal');
    const progressContainer = modal.querySelector('.progress-container');
    const progressBar = modal.querySelector('.progress-bar-inner');
    const progressText = modal.querySelector('.progress-text');
    
    try {
      const user = otherUsers[0];
      currentTransferUser = user;
      const fileInfo = { name: file.name, size: file.size };
      
      // 显示进度条
      modal.style.display = 'block';
      document.getElementById('userSelectList').style.display = 'none';
      modal.querySelector('.modal-footer').style.display = 'block';
      modal.querySelector('.modal-footer button:last-child').style.display = 'none';
      progressContainer.style.display = 'block';
      
      // 创建进度回调
      const onProgress = (sent, total) => {
        const progress = (sent / total) * 100;
        progressBar.style.width = progress + '%';
        // 计算传输速度
        const speed = sent / (Date.now() - startTime) * 1000; // 字节/秒
        const speedText = speed > 1024 * 1024 
          ? `${(speed / (1024 * 1024)).toFixed(2)} MB/s`
          : `${(speed / 1024).toFixed(2)} KB/s`;
        const displayName = user.nickname || user.id;
        progressText.textContent = `正在发送给 ${displayName}... ${speedText}`;
      };
      
      const startTime = Date.now();
      await user.sendFile(fileInfo, file, onProgress);
      const displayName = user.nickname || user.id;
      addChatItem(me.id, `[文件] ${fileInfo.name} (发送给: ${displayName})`);
    } catch (error) {
      console.error('发送文件失败:', error);
      alert('发送文件失败，请重试');
    } finally {
      currentTransferUser = null;
      // 恢复界面状态
      modal.style.display = 'none';
      document.getElementById('userSelectList').style.display = 'block';
      modal.querySelector('.modal-footer').style.display = 'block';
      modal.querySelector('.modal-footer button:last-child').style.display = 'inline-block';
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }
    
    pendingFile = null;
    return;
  }
  
  showUserSelectModal();
}
function registCandidate() {
  for (const ca of JSON.parse(candidate.value)) {
    me.addIceCandidate(ca);
  }
}


function connectAllOther() {
  if (users.length <= 1) {
    return;
  }
  const targets = users.filter(u => u.id !== me.id);
  for (const target of targets) {
    target.onicecandidate = (candidate) => {
      // console.log('candidate', candidate);
      signalingServer.send(JSON.stringify({uid: me.id, targetId: target.id, type: '9001', data: { candidate }}));
    }
    target.createConnection().then(() => {
      // console.log('targetAddr', target.connAddressMe);
      signalingServer.send(JSON.stringify({uid: me.id, targetId: target.id, type: '9002', data: { targetAddr: target.connAddressMe }}));
    })
  }
}


function refreshUsers(data) {
  resUsers = data.map(
    u => {
      let uOld = users.find(uOld => uOld.id === u.id)
      if (uOld) {
        // 保持原有昵称
        u.nickname = u.nickname || uOld.nickname;
        return uOld;
      }
      let xchatUser = new XChatUser();
      xchatUser.id = u.id;
      xchatUser.isMe = u.id === me.id;
      xchatUser.nickname = u.nickname; // 设置昵称
      
      xchatUser.onConnectionStateChange = (state) => {
        console.log(`User ${xchatUser.id} connection state: ${state}`);
        refreshUsersHTML();
      };
      
      return xchatUser;
    }
  );

  // 找出删除的用户
  const delUsers = users.filter(u => !resUsers.find(u2 => u2.id === u.id));
  delUsers.forEach(u => {
    u.closeConnection();
  });

  users = resUsers;
  for (const u of users) {
    u.onmessage = (msg) => {
      addChatItem(u.id, msg);
    }
    u.onReviceFile = (file) => {
      addLinkItem(u.id, file);
    }
  }
  refreshUsersHTML();
}

function joinedRoom() {
  connectAllOther();
}

function addCandidate(data) {
  users.find(u => u.id === data.targetId).addIceCandidate(data.candidate);
}
async function joinConnection(data) {
  const user = users.find(u => u.id === data.targetId)
  if (!user) {
    return;
  }
  user.onicecandidate = (candidate) => {
    // console.log('candidate', candidate);
    signalingServer.send(JSON.stringify({uid: me.id, targetId: user.id, type: '9001', data: { candidate }}));
  }
  await user.connectTarget(data.offer.sdp)
  signalingServer.send(JSON.stringify({uid: me.id, targetId: user.id, type: '9003', data: { targetAddr: user.connAddressMe }}));
}

async function joinedConnection(data) {
  const target = users.find(u => u.id === data.targetId)
  if (!target) {
    return;
  }
  await target.setRemoteSdp(data.answer.sdp);
  refreshUsersHTML();
}

function refreshUsersHTML() {
  document.querySelector('#users').innerHTML = users.map(u => {
    const isConnected = u.isMe || u.isConnected();
    console.log(isConnected, '----');
    const statusClass = isConnected ? 'connected' : 'disconnected';
    const statusIcon = isConnected ? 
      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>` : 
      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z"/></svg>`;
    
    const displayName = u.nickname || u.id;
    
    return `
      <li>
        <span class="connection-status ${statusClass}">
          ${statusIcon}
        </span>
        ${displayName}${u.isMe?'（我）':''}
      </li>
    `;
  }).join('');
}

function enterTxt(event) {
  if (event.ctrlKey || event.shiftKey) {
    return;
  }
  if (event.keyCode === 13) {
    sendMessage();
    event.preventDefault();
  }
}

function showUserSelectModal() {
  const modal = document.getElementById('userSelectModal');
  const userList = document.getElementById('userSelectList');
  
  // 清空之前的列表
  userList.innerHTML = '';
  
  // 添加用户选项
  users.forEach(user => {
    if (!user.isMe) {
      const item = document.createElement('div');
      item.className = 'user-select-item';
      const displayName = user.nickname || user.id;
      
      item.innerHTML = `
        <label>
          <input type="checkbox" value="${user.id}">
          <span>${displayName}</span>
        </label>
      `;
      
      // 点击整行时切换复选框状态
      item.addEventListener('click', (e) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (e.target === checkbox) return;
        checkbox.checked = !checkbox.checked;
        e.preventDefault();
      });
      
      userList.appendChild(item);
    }
  });
  
  modal.style.display = 'block';
}

function cancelSendFile() {
  if (currentTransferUser) {
    currentTransferUser.cancelTransfer();
  }
  const modal = document.getElementById('userSelectModal');
  modal.style.display = 'none';
  pendingFile = null;
  currentTransferUser = null;
}

async function confirmSendFile() {
  const modal = document.getElementById('userSelectModal');
  const sendButton = modal.querySelector('.modal-footer button:last-child');
  const progressContainer = modal.querySelector('.progress-container');
  const progressBar = modal.querySelector('.progress-bar-inner');
  const progressText = modal.querySelector('.progress-text');
  const userList = document.getElementById('userSelectList');
  const selectedUsers = Array.from(document.querySelectorAll('#userSelectList input[type="checkbox"]:checked'))
    .map(checkbox => users.find(u => u.id === checkbox.value));
  
  if (selectedUsers.length > 0 && pendingFile) {
    sendButton.disabled = true;
    sendButton.textContent = '发送中...';
    userList.style.display = 'none';
    progressContainer.style.display = 'block';
    
    try {
      const fileInfo = { name: pendingFile.name, size: pendingFile.size };
      const totalUsers = selectedUsers.length;
      const startTime = Date.now();
      
      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        const displayName = user.nickname || user.id;
        progressText.textContent = `正在发送给 ${displayName}... (${i + 1}/${totalUsers})`;
        
        const onProgress = (sent, total) => {
          const userProgress = (sent / total) * 100;
          const totalProgress = ((i * 100) + userProgress) / totalUsers;
          progressBar.style.width = totalProgress + '%';
          // 计算传输速度
          const speed = sent / (Date.now() - startTime) * 1000; // 字节/秒
          const speedText = speed > 1024 * 1024 
            ? `${(speed / (1024 * 1024)).toFixed(2)} MB/s`
            : `${(speed / 1024).toFixed(2)} KB/s`;
          progressText.textContent = `正在发送给 ${displayName}... (${i + 1}/${totalUsers}) ${speedText}`;
        };
        
        await user.sendFile(fileInfo, pendingFile, onProgress);
      }
      
      // 使用昵称显示在聊天记录中
      const displayNames = selectedUsers.map(u => u.nickname || u.id).join(', ');
      addChatItem(me.id, `[文件] ${fileInfo.name} (发送给: ${displayNames})`);
    } catch (error) {
      console.error('发送文件失败:', error);
      alert('发送文件失败，请重试');
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = '发送';
      userList.style.display = 'block';
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }
  }
  
  modal.style.display = 'none';
  pendingFile = null;
}


let droptarget = document.body;
    
async function handleEvent(event) {
  event.preventDefault();
  if (event.type === 'drop') {
    droptarget.classList.remove('dragover');
    if (event.dataTransfer.files.length > 0) {
      await sendFile(event.dataTransfer.files[0]);
    }
  } else if (event.type === 'dragleave') {
    droptarget.classList.remove('dragover');
  } else {
    droptarget.classList.add('dragover');
  }
}

droptarget.addEventListener("dragenter", handleEvent);
droptarget.addEventListener("dragover", handleEvent);
droptarget.addEventListener("drop", handleEvent);
droptarget.addEventListener("dragleave", handleEvent);

document.querySelector('.file-btn').addEventListener('click', async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = async (e) => {
    if (e.target.files.length > 0) {
      await sendFile(e.target.files[0]);
    }
  };
  input.click();
});

document.querySelector('.send-btn').addEventListener('click', () => {
  if (messageInput.value.trim()) {  // 只有当消息不为空时才发送
    sendMessage();
  }
});

function showNicknameModal() {
  const modal = document.getElementById('nicknameModal');
  const input = document.getElementById('nicknameInput');
  input.value = currentNickname;
  modal.style.display = 'block';
  
  // 自动获取焦点
  setTimeout(() => input.focus(), 0);
  
  // 添加回车事件监听
  input.onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // 阻止默认的回车行为
      saveNickname();
    }
  };
}

function closeNicknameModal() {
  const modal = document.getElementById('nicknameModal');
  const input = document.getElementById('nicknameInput');
  modal.style.display = 'none';
  
  // 清除回车事件监听
  input.onkeydown = null;
}

function saveNickname() {
  const input = document.getElementById('nicknameInput');
  const nickname = input.value.trim();
  
  if (nickname) {
    currentNickname = nickname;
    document.cookie = `nickname=${encodeURIComponent(nickname)}; path=/; max-age=31536000`; // 保存一年
    
    // 更新本地显示
    const user = users.find(u => u.id === me.id);
    if (user) {
      user.nickname = nickname;
      refreshUsersHTML();
    }
    
    // 发送到服务器
    signalingServer.send(JSON.stringify({
      uid: me.id,
      targetId: me.id,
      type: '9004',
      data: { nickname }
    }));
  }
  
  closeNicknameModal();
}

// ... 添加昵称按钮事件监听
document.querySelector('.nickname-btn').addEventListener('click', showNicknameModal);

function toggleUsersList() {
  document.body.classList.toggle('show-users');
}

// Add event listener for toggle button and overlay
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.querySelector('.toggle-users-btn');
  const overlay = document.querySelector('.mobile-overlay');
  
  toggleBtn.addEventListener('click', toggleUsersList);
  overlay.addEventListener('click', toggleUsersList);

  // Hide users list by default on mobile
  if (window.innerWidth <= 768) {
    document.body.classList.remove('show-users');
  }
});