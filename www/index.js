const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
wsUrl += window.location.host + '/ws';

var users = [];
var me = new XChatUser();

// 添加当前传输用户的引用
let currentTransferUser = null;
let currentNickname = '';

function setRemote() {
  me.setRemoteSdp(remoteSDP.value);
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
  // 判断是否url，兼容端口号的网址,http://127.0.0.1:8080/
  if (/(http|https):\/\/[a-zA-Z0-9\.\-\/\?=\:_]+/g.test(msg)) {
    msg = msg.replace(/(http|https):\/\/[a-zA-Z0-9\.\-\/\?=\:_]+/g, (url) => {
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }

  const user = users.find(u => u.id === uid);
  const displayName = user?.nickname || uid;

  chatItem.innerHTML = `
    <div class="chat-item_user">${uid === me.id ? '（我）': ''}${displayName} :</div>
    <div class="chat-item_content"><pre>${msg}</pre></div>
  `;
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

// 连接信令服务器
const signalingServer = new WebSocket(wsUrl);
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