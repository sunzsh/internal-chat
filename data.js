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

const PUBLIC_ROOM_PREFIX = 'public:';

/**
 * 判断给定的 IP 地址是否属于内网或回环地址。
 *
 * 内网范围包括：
 * - IPv4 A类私有地址：10.0.0.0 – 10.255.255.255
 * - IPv4 B类私有地址：172.16.0.0 – 172.31.255.255
 * - IPv4 C类私有地址：192.168.0.0 – 192.168.255.255
 * - IPv4 回环地址：127.0.0.0 – 127.255.255.255
 * - IPv6 回环地址：::1
 * - IPv6 私有地址（fc00::/7）
 * - IPv6 链路本地地址（fe80::/10）
 *
 * @param {string} ip - 要判断的 IP 地址（IPv4 或 IPv6）。
 * @returns {boolean} 如果是内网或回环地址，返回 true；否则返回 false。
 */
function internalNet(ip) {
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('127.')) return true;         // IPv4 回环
  if (ip === '::1') return true;                  // IPv6 回环
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // IPv6 私有地址
  if (ip.startsWith('fe80:')) return true;        // IPv6 链路本地地址（可选）
  return false;
}


function getKey(ip, roomId) {
  if (roomId) {
    return roomId;
  }
  const isInternalNet = internalNet(ip);
  return isInternalNet ? 'internal' : ip;
}

function isPublicRoomKey(key) {
  return typeof key === 'string' && key.startsWith(PUBLIC_ROOM_PREFIX);
}

function getPublicRoomIdByKey(key) {
  return key.substring(PUBLIC_ROOM_PREFIX.length);
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
      const removed = room.splice(index, 1);
      if (room.length === 0) {
        delete data[key];
      }
      return removed;
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
  if (!room) {
    return null;
  }
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

function getPublicRooms() {
  return Object.keys(data)
    .filter(isPublicRoomKey)
    .map(key => ({
      roomId: getPublicRoomIdByKey(key),
      userCount: data[key].length
    }))
    .filter(room => room.userCount > 0)
    .sort((a, b) => a.roomId.localeCompare(b.roomId));
}

function canJoinPublicRoom(roomId, maxRooms) {
  const roomKey = `${PUBLIC_ROOM_PREFIX}${roomId}`;
  if (data[roomKey] && data[roomKey].length > 0) {
    return true;
  }
  return getPublicRooms().length < maxRooms;
}

function __resetForTest() {
  for (const key of Object.keys(data)) {
    delete data[key];
  }
}

module.exports = {
  registerUser,
  unregisterUser,
  getUserList,
  getUser,
  updateNickname,
  getPublicRooms,
  canJoinPublicRoom,
  __resetForTest
}
