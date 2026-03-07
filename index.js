const WebSocket = require('ws');
const service = require('./data');
const { parseWsRoute } = require('./room-routing');
const path = require('path');

const http = require('http');
const fs = require('fs');

const originalLog = console.log;
console.log = function() {
  const date = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  
  const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
  try {
    originalLog.apply(console, [`[${timestamp}]`, ...arguments]);
  } catch (e) {
    // Ignore broken stdout/stderr pipe errors (for detached/background runs)
  }
};
const HTTP_PORT = process.argv[2] || 8081; // 合并后的统一端口
const HTTP_DIRECTORY = path.join(__dirname, 'www'); // 静态文件目录
const MAX_PUBLIC_ROOMS = 5;
const PUBLIC_ROOM_PREFIX = 'public:';

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]); // 去掉查询参数
  if (req.method === 'GET' && urlPath === '/api/public-rooms') {
    const rooms = service.getPublicRooms();
    const payload = {
      rooms,
      maxRooms: MAX_PUBLIC_ROOMS,
      availableSlots: Math.max(0, MAX_PUBLIC_ROOMS - rooms.length)
    };
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
    return;
  }

  let staticPath = urlPath;
  if (staticPath === '/') {
    staticPath = '/index.html'; // 默认访问 index.html
  }
  let filePath = path.join(HTTP_DIRECTORY, staticPath);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 如果文件不存在，回退到 index.html（SPA）
      filePath = path.join(HTTP_DIRECTORY, 'index.html');
    }

    fs.stat(filePath, (fallbackErr, fallbackStats) => {
      if (fallbackErr || !fallbackStats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      // 设置缓存头
      const ext = path.extname(filePath);
      if (ext === '.js' || ext === '.css') {
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天缓存
      }

      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Internal Server Error');
      });
      stream.pipe(res);
    });
  });
});

server.listen(HTTP_PORT, () => {
  console.log(`server start on port ${HTTP_PORT}`);
});


const wsServer = new WebSocket.Server({ server });

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`端口 ${HTTP_PORT} 已被占用，请先释放端口或使用其他端口启动，例如：node index.js 8082`);
    process.exit(1);
    return;
  }
  console.error('HTTP server error:', error);
  process.exit(1);
});

wsServer.on('error', (error) => {
  console.error('WebSocket server error:', error);
});


const SEND_TYPE_REG = '1001'; // 注册后发送用户id
const SEND_TYPE_ROOM_INFO = '1002'; // 发送房间信息
const SEND_TYPE_JOINED_ROOM = '1003'; // 加入房间后的通知，比如对于新进用户，Ta需要开始连接其他人
const SEND_TYPE_NEW_CANDIDATE = '1004'; // offer
const SEND_TYPE_NEW_CONNECTION = '1005'; // new connection
const SEND_TYPE_CONNECTED = '1006'; // new connection
const SEND_TYPE_NICKNAME_UPDATED = '1007'; // 昵称更新通知
const SEND_TYPE_VIDEO_OFFER = '1010'; // 视频 offer
const SEND_TYPE_VIDEO_ANSWER = '1011'; // 视频 answer
const SEND_TYPE_VIDEO_CANDIDATE = '1012'; // 视频 candidate
const SEND_TYPE_VIDEO_HANGUP = '1013'; // 视频挂断
const SEND_TYPE_ERROR = '1099'; // 错误消息

const RECEIVE_TYPE_NEW_CANDIDATE = '9001'; // offer
const RECEIVE_TYPE_NEW_CONNECTION = '9002'; // new connection
const RECEIVE_TYPE_CONNECTED = '9003'; // joined
const RECEIVE_TYPE_KEEPALIVE = '9999'; // keep-alive
const RECEIVE_TYPE_UPDATE_NICKNAME = '9004'; // 更新昵称请求
const RECEIVE_TYPE_VIDEO_OFFER = '9010'; // 视频 offer
const RECEIVE_TYPE_VIDEO_ANSWER = '9011'; // 视频 answer
const RECEIVE_TYPE_VIDEO_CANDIDATE = '9012'; // 视频 candidate
const RECEIVE_TYPE_VIDEO_HANGUP = '9013'; // 视频挂断

const ROOM_MODE_LAN = 'lan';
const ROOM_MODE_PRIVATE = 'private';
const ROOM_MODE_PUBLIC = 'public';

// 从room_pwd.json中获取房间密码
let roomPwd = { };
try {
  // 获取可执行程序所在目录
  const exePath = process.pkg ? path.dirname(process.execPath) : __dirname;
  roomPwdConfig = require(path.join(exePath, 'room_pwd.json'));
  let roomIds = [];
  roomPwdConfig.forEach(item => {
    roomIds.push(item.roomId);
    roomPwd[item.roomId] = { "pwd": item.pwd, "turns": item.turns };
  });
  console.log(`加载房间数据: ${roomIds.join(',')}`);
} catch (e) {
  // 没有room_pwd.json文件无需报错，不加载即可
  // console.error('Failed to load room_pwd.json');
}

wsServer.on('connection', (socket, request) => {
  const ip = request.headers['x-forwarded-for'] ?? request.headers['x-real-ip'] ?? socket._socket.remoteAddress.split("::ffff:").join("");
  const route = parseWsRoute(request.url);
  if (route.mode === 'invalid') {
    socketSend_Error(socket, { code: 'INVALID_ROUTE', message: '无效房间路由' });
    socket.close();
    return;
  }

  let roomMode = ROOM_MODE_LAN;
  let roomId = null;
  let roomIdForClient = null;
  let lanKeyForClient = null;
  let turns = null;

  if (route.mode === ROOM_MODE_LAN && route.lanKey) {
    roomMode = ROOM_MODE_LAN;
    roomId = `lan:${route.lanKey}`;
    lanKeyForClient = route.lanKey;
  } else if (route.mode === ROOM_MODE_PUBLIC) {
    const canJoin = service.canJoinPublicRoom(route.roomId, MAX_PUBLIC_ROOMS);
    if (!canJoin) {
      socketSend_Error(socket, { code: 'PUBLIC_ROOM_LIMIT', message: `公共房间最多支持 ${MAX_PUBLIC_ROOMS} 个` });
      socket.close();
      return;
    }
    roomMode = ROOM_MODE_PUBLIC;
    roomIdForClient = route.roomId;
    roomId = `${PUBLIC_ROOM_PREFIX}${route.roomId}`;
  } else if (route.mode === ROOM_MODE_PRIVATE) {
    const roomConfig = roomPwd[route.roomId];
    if (route.passwordHash && roomConfig && roomConfig.pwd.toLowerCase() === route.passwordHash.toLowerCase()) {
      roomMode = ROOM_MODE_PRIVATE;
      roomIdForClient = route.roomId;
      roomId = route.roomId;
      turns = roomConfig.turns;
    }
  }

  const currentId = service.registerUser(ip, roomId, socket);
  // 向客户端发送自己的id
  socketSend_UserId(socket, currentId, roomIdForClient, turns, roomMode, lanKeyForClient);
  
  console.log(`${currentId}@${ip}${roomIdForClient ? '/' + roomIdForClient : ''} connected [${roomMode}]`);
  
  socketBroadcast_RoomInfo(ip, roomId);

  socketSend_JoinedRoom(socket, currentId);
  

  socket.on('message', (msg, isBinary) => {
    const msgStr = msg.toString();
    if (!msgStr || msgStr.length > 1024 * 10) {
      return;
    }
    let message = null;
    try {
      message = JSON.parse(msgStr);
    } catch (e) {
      console.error('Invalid JSON', msgStr);
      message = null;
    }

    const { uid, targetId, type, data } = message;
    if (type === RECEIVE_TYPE_KEEPALIVE) {
      return;
    }
    if (!type || !uid || !targetId) {
      return null;
    }
    const me = service.getUser(ip, roomId, uid)
    const target = service.getUser(ip, roomId, targetId)
    if (!me || !target) {
      return;
    }

    if (type === RECEIVE_TYPE_NEW_CANDIDATE) {
      socketSend_Candidate(target.socket, { targetId: uid, candidate: data.candidate });
      return;
    }
    if (type === RECEIVE_TYPE_NEW_CONNECTION) {
      socketSend_ConnectInvite(target.socket, { targetId: uid, offer: data.targetAddr });
      return;
    }
    if (type === RECEIVE_TYPE_CONNECTED) {
      socketSend_Connected(target.socket, { targetId: uid, answer: data.targetAddr });
      return;
    }
    if (type === RECEIVE_TYPE_VIDEO_OFFER) {
      socketSend_VideoOffer(target.socket, { targetId: uid, offer: { sdp: data?.sdp } });
      return;
    }
    if (type === RECEIVE_TYPE_VIDEO_ANSWER) {
      socketSend_VideoAnswer(target.socket, { targetId: uid, answer: { sdp: data?.sdp } });
      return;
    }
    if (type === RECEIVE_TYPE_VIDEO_CANDIDATE) {
      socketSend_VideoCandidate(target.socket, { targetId: uid, candidate: data?.candidate });
      return;
    }
    if (type === RECEIVE_TYPE_VIDEO_HANGUP) {
      socketSend_VideoHangup(target.socket, { targetId: uid });
      return;
    }
    if (type === RECEIVE_TYPE_UPDATE_NICKNAME) {
      const success = service.updateNickname(ip, roomId, uid, data.nickname);
      if (success) {
        // 通知所有用户昵称更新
        service.getUserList(ip, roomId).forEach(user => {
          socketSend_NicknameUpdated(user.socket, { id: uid, nickname: data.nickname });
        });
      }
      return;
    }
    
  });

  let disconnected = false;
  const handleDisconnect = () => {
    if (disconnected) {
      return;
    }
    disconnected = true;
    service.unregisterUser(ip, roomId, currentId);
    socketBroadcast_RoomInfo(ip, roomId);
    console.log(`${currentId}@${ip}${roomIdForClient ? '/' + roomIdForClient : ''} disconnected [${roomMode}]`);
  };

  socket.on('close', handleDisconnect);

  socket.on('error', handleDisconnect);
});




function send(socket, type, data) {
  socket.send(JSON.stringify({ type, data }));
}

function socketSend_UserId(socket, id, roomId, turns, mode, lanKey) {
  send(socket, SEND_TYPE_REG, { id, roomId, turns, mode, lanKey });
}
function socketSend_RoomInfo(socket, ip, roomId) {
  const result = service.getUserList(ip, roomId).map(user => ({ 
    id: user.id,
    nickname: user.nickname 
  }));
  send(socket, SEND_TYPE_ROOM_INFO, result);
}
function socketSend_JoinedRoom(socket, id) {
  send(socket, SEND_TYPE_JOINED_ROOM, { id });
}

function socketSend_Candidate(socket, data) {
  send(socket, SEND_TYPE_NEW_CANDIDATE, data);
}

function socketSend_ConnectInvite(socket, data) {
  send(socket, SEND_TYPE_NEW_CONNECTION, data);
}

function socketSend_Connected(socket, data) {
  send(socket, SEND_TYPE_CONNECTED, data);
}

function socketSend_NicknameUpdated(socket, data) {
  send(socket, SEND_TYPE_NICKNAME_UPDATED, data);
}

function socketSend_VideoOffer(socket, data) {
  send(socket, SEND_TYPE_VIDEO_OFFER, data);
}

function socketSend_VideoAnswer(socket, data) {
  send(socket, SEND_TYPE_VIDEO_ANSWER, data);
}

function socketSend_VideoCandidate(socket, data) {
  send(socket, SEND_TYPE_VIDEO_CANDIDATE, data);
}

function socketSend_VideoHangup(socket, data) {
  send(socket, SEND_TYPE_VIDEO_HANGUP, data);
}

function socketSend_Error(socket, data) {
  send(socket, SEND_TYPE_ERROR, data);
}

function socketBroadcast_RoomInfo(ip, roomId) {
  service.getUserList(ip, roomId).forEach(user => {
    socketSend_RoomInfo(user.socket, ip, roomId);
  });
}
