const assert = require('assert');
const service = require('../data');

function createSocket(name) {
  return {
    request: {
      headers: {
        cookie: `nickname=${encodeURIComponent(name)}`
      }
    }
  };
}

module.exports = function runDataPublicRoomTests() {
  service.__resetForTest();

  for (let i = 1; i <= 5; i += 1) {
    assert.strictEqual(service.canJoinPublicRoom(`room-${i}`, 5), true);
    service.registerUser('127.0.0.1', `public:room-${i}`, createSocket(`u-${i}`));
  }

  assert.strictEqual(service.getPublicRooms().length, 5);
  assert.strictEqual(service.canJoinPublicRoom('room-6', 5), false);

  const roomUsers = service.getUserList('127.0.0.1', 'public:room-1');
  assert.strictEqual(roomUsers.length, 1);
  service.unregisterUser('127.0.0.1', 'public:room-1', roomUsers[0].id);

  const roomNames = service.getPublicRooms().map(room => room.roomId);
  assert.strictEqual(roomNames.includes('room-1'), false);

  const lanA = service.registerUser('192.168.1.10', 'lan:wifi-main', createSocket('lan-a'));
  service.registerUser('192.168.1.11', 'lan:wifi-main', createSocket('lan-b'));
  service.registerUser('192.168.1.12', null, createSocket('lan-auto'));
  const publicSameRoomUserA = service.registerUser('127.0.0.1', 'public:dup-check', createSocket('dup-a'));
  const publicSameRoomUserB = service.registerUser('127.0.0.1', 'public:dup-check', createSocket('dup-b'));
  assert.notStrictEqual(publicSameRoomUserA, publicSameRoomUserB);
  const lanScopedUsers = service.getUserList('192.168.1.20', 'lan:wifi-main');
  assert.strictEqual(lanScopedUsers.length, 2);
  const lanAutoUsers = service.getUserList('192.168.1.20', null);
  assert.strictEqual(lanAutoUsers.length, 1);
  service.unregisterUser('192.168.1.10', 'lan:wifi-main', lanA);
};
