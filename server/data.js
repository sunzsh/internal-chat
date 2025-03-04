function getCookieValue(socket) {
  try {
    // 尝试从不同的可能位置获取 cookie
    const cookie = socket.request?.headers?.cookie || 
                  socket.handshake?.headers?.cookie ||
                  socket._socket?.request?.headers?.cookie ||
                  socket.upgradeReq?.headers?.cookie;
    
    if (!cookie) return null;
    
    const match = cookie.match(/nickname=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch (e) {
    console.log('Error getting cookie:', e);
    return null;
  }
}

const data = {
  
}

/*
  A类地址：10.0.0.0–10.255.255.255
  B类地址：172.16.0.0–172.31.255.255 
  C类地址：192.168.0.0–192.168.255.255
*/
function internalNet(ip) {
  if (ip.startsWith('10.')) {
    return true;
  }
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }
  if (ip.startsWith('192.168.')) {
    return true;
  }
  return false;
}

function getKey(ip, roomId) {
  if (roomId) {
    return roomId;
  }
  const isInternalNet = internalNet(ip);
  return isInternalNet ? 'internal' : ip;
}

function registerUser(ip, roomId, socket) {
  const key = getKey(ip, roomId);
  const room = data[key]
  if (!room) {
    data[key] = []
  }
  let id = `${Math.floor(Math.random() * 1000000).toString().substring(3,5).padStart(2, '0')}${(new Date()).getMilliseconds().toString().padStart(3, '0')}`
  while (data[id]) {
    id = `${Math.floor(Math.random() * 1000000).toString().substring(3,5).padStart(2, '0')}${(new Date()).getMilliseconds().toString().padStart(3, '0')}`
  }
  const nickname = getCookieValue(socket);
  data[key].push({ id, socket, targets: {}, nickname })
  return id;
}

function unregisterUser(ip, roomId, id) {
  const key = getKey(ip, roomId);
  const room = data[key]
  if (room) {
    const index = room.findIndex(user => user.id === id)
    if (index !== -1) {
      return room.splice(index, 1)
    }
  }
}

function getUserList(ip, roomId) {
  const key = getKey(ip, roomId);
  const room = data[key]
  // 去掉socket属性
  return room ?? []
}

function getUser(ip, roomId, uid) {
  const key = getKey(ip, roomId);
  const room = data[key]
  return room.find(user => user.id === uid)
}

function updateNickname(ip, roomId, id, nickname) {
  const key = getKey(ip, roomId);
  const room = data[key];
  if (room) {
    const user = room.find(user => user.id === id);
    if (user) {
      user.nickname = nickname;
      return true;
    }
  }
  return false;
}

module.exports = { registerUser, unregisterUser, getUserList, getUser, updateNickname }