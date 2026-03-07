const assert = require('assert');
const { parseWsRoute } = require('../room-routing');

module.exports = function runRoomRoutingTests() {
  const lan = parseWsRoute('/ws');
  assert.strictEqual(lan.mode, 'lan');
  assert.strictEqual(lan.roomId, null);
  assert.strictEqual(lan.lanKey, null);

  const lanByQuery = parseWsRoute('/ws?m=lan&k=wifi-main');
  assert.strictEqual(lanByQuery.mode, 'lan');
  assert.strictEqual(lanByQuery.roomId, null);
  assert.strictEqual(lanByQuery.lanKey, 'wifi-main');

  const privateRoom = parseWsRoute('/ws/my-room/abcd1234');
  assert.strictEqual(privateRoom.mode, 'private');
  assert.strictEqual(privateRoom.roomId, 'my-room');
  assert.strictEqual(privateRoom.passwordHash, 'abcd1234');

  const privateCnRoom = parseWsRoute('/ws/%E6%88%BF%E9%97%B4/abcd1234');
  assert.strictEqual(privateCnRoom.mode, 'private');
  assert.strictEqual(privateCnRoom.roomId, '房间');

  const publicRoom = parseWsRoute('/ws/public/team-a');
  assert.strictEqual(publicRoom.mode, 'public');
  assert.strictEqual(publicRoom.roomId, 'team-a');
  assert.strictEqual(publicRoom.passwordHash, null);

  const publicByQuery = parseWsRoute('/ws?m=public&r=team-a');
  assert.strictEqual(publicByQuery.mode, 'public');
  assert.strictEqual(publicByQuery.roomId, 'team-a');
  assert.strictEqual(publicByQuery.passwordHash, null);

  const invalidPublic = parseWsRoute('/ws/public');
  assert.strictEqual(invalidPublic.mode, 'invalid');

  const invalidPublicName = parseWsRoute('/ws/public/team@a');
  assert.strictEqual(invalidPublicName.mode, 'invalid');

  const invalidLanKey = parseWsRoute('/ws?m=lan&k=bad key');
  assert.strictEqual(invalidLanKey.mode, 'invalid');
};
