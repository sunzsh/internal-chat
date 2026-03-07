function normalizePublicRoomId(rawRoomId) {
  if (!rawRoomId || typeof rawRoomId !== 'string') {
    return null;
  }
  const roomId = decodeURIComponent(rawRoomId).trim().toLowerCase();
  if (!roomId || roomId.length > 32) {
    return null;
  }
  if (!/^[a-z0-9_-]+$/i.test(roomId)) {
    return null;
  }
  return roomId;
}

function normalizePrivateRoomId(rawRoomId) {
  if (!rawRoomId || typeof rawRoomId !== 'string') {
    return null;
  }
  const roomId = decodeURIComponent(rawRoomId).trim();
  if (!roomId || roomId.length > 32) {
    return null;
  }
  return roomId;
}

function normalizeLanKey(rawLanKey) {
  if (!rawLanKey || typeof rawLanKey !== 'string') {
    return null;
  }
  const lanKey = decodeURIComponent(rawLanKey).trim().toLowerCase();
  if (!lanKey || lanKey.length > 64) {
    return null;
  }
  if (!/^[a-z0-9._-]+$/i.test(lanKey)) {
    return null;
  }
  return lanKey;
}

function parseWsRoute(requestUrl) {
  const fullUrl = requestUrl || '';
  const [urlPath, queryString = ''] = fullUrl.split('?');
  const query = new URLSearchParams(queryString);
  const queryMode = (query.get('m') || '').trim().toLowerCase();
  const queryRoom = query.get('r');
  const queryLanKey = query.get('k');
  const segments = urlPath.replace(/^\/+/g, '').split('/');

  if (!segments[0] || segments[0] !== 'ws') {
    return { mode: 'invalid', roomId: null, passwordHash: null, lanKey: null };
  }

  if (queryMode === 'public') {
    const roomId = normalizePublicRoomId(queryRoom);
    if (!roomId) {
      return { mode: 'invalid', roomId: null, passwordHash: null, lanKey: null };
    }
    return { mode: 'public', roomId, passwordHash: null, lanKey: null };
  }

  if (queryMode === 'lan') {
    if (!queryLanKey) {
      return { mode: 'lan', roomId: null, passwordHash: null, lanKey: null };
    }
    const lanKey = normalizeLanKey(queryLanKey);
    if (!lanKey) {
      return { mode: 'invalid', roomId: null, passwordHash: null, lanKey: null };
    }
    return { mode: 'lan', roomId: null, passwordHash: null, lanKey };
  }

  if (!segments[1]) {
    return { mode: 'lan', roomId: null, passwordHash: null, lanKey: null };
  }

  if (segments[1] === 'public') {
    const roomId = normalizePublicRoomId(segments[2]);
    if (!roomId) {
      return { mode: 'invalid', roomId: null, passwordHash: null, lanKey: null };
    }
    return { mode: 'public', roomId, passwordHash: null, lanKey: null };
  }

  const roomId = normalizePrivateRoomId(segments[1]);
  const passwordHash = segments[2] && segments[2].trim() ? decodeURIComponent(segments[2]).trim().toLowerCase() : null;

  if (!roomId || roomId === 'ws') {
    return { mode: 'lan', roomId: null, passwordHash: null, lanKey: null };
  }

  return { mode: 'private', roomId, passwordHash, lanKey: null };
}

module.exports = {
  parseWsRoute
};
