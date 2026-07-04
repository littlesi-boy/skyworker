const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION = 'user_profiles';

function clampNumber(value, min, max) {
  const num = Number(value) || 0;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

function safeDisplayName(openid) {
  const hash = crypto.createHash('sha256').update(String(openid || '')).digest('hex');
  const code = hash.slice(0, 6).toUpperCase();
  return `匿名打工人${code}`;
}

function leaderboardId(openid) {
  return crypto.createHash('sha256').update(`tg1:${String(openid || '')}`).digest('hex').slice(0, 16);
}

function isCollectionMissing(err) {
  const message = String((err && (err.errMsg || err.message || err.code)) || '');
  return message.includes('-502005') ||
    message.includes('ResourceNotFound') ||
    message.includes('collection not exists') ||
    message.includes('Db or Table not exist');
}

async function ensureCollection() {
  try {
    await db.createCollection(COLLECTION);
  } catch (err) {
    if (!isCollectionMissing(err) && !String((err && (err.errMsg || err.message)) || '').includes('already exists')) {
      throw err;
    }
  }
  return db.collection(COLLECTION);
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const profile = event.profile || {};
  const now = Date.now();
  const enabled = !!profile.leaderboardEnabled && !!profile.completedProfile;
  const leaderboardFields = enabled
    ? {
        displayName: safeDisplayName(openid),
        leaderboardId: leaderboardId(openid),
        rankIndex: clampNumber(profile.rankIndex, 0, 9),
        totalScore: clampNumber(profile.totalScore, 0, 999999),
        highestRankIndex: clampNumber(profile.highestRankIndex, 0, 9),
        passCount: clampNumber(profile.passCount, 0, 999999),
        failCount: clampNumber(profile.failCount, 0, 999999),
        perfectCount: clampNumber(profile.perfectCount, 0, 999999),
        overtimeRounds: clampNumber(profile.overtimeRounds, 0, 999999),
        totalRounds: clampNumber(profile.totalRounds, 0, 999999)
      }
    : {};
  const cleanFields = {
    nickname: _.remove(),
    avatarUrl: _.remove(),
    motto: _.remove(),
    records: _.remove(),
    items: _.remove(),
    skins: _.remove(),
    activeSkin: _.remove(),
    musicEnabled: _.remove(),
    musicVolume: _.remove(),
    sfxEnabled: _.remove(),
    autoCheckIn: _.remove(),
    lastCheckInDate: _.remove(),
    checkInStreak: _.remove(),
    checkInCount: _.remove(),
    reviveAdCount: _.remove(),
    reviveShareCount: _.remove(),
    profileRewardClaimed: _.remove()
  };
  const removeLeaderboardFields = enabled ? {} : {
    displayName: _.remove(),
    leaderboardId: _.remove(),
    rankIndex: _.remove(),
    totalScore: _.remove(),
    highestRankIndex: _.remove(),
    passCount: _.remove(),
    failCount: _.remove(),
    perfectCount: _.remove(),
    overtimeRounds: _.remove(),
    totalRounds: _.remove()
  };
  const updateData = Object.assign({}, cleanFields, removeLeaderboardFields, leaderboardFields, {
    _openid: openid,
    leaderboardEnabled: enabled,
    completedProfile: !!profile.completedProfile,
    updatedAt: now
  });
  const addData = Object.assign({}, leaderboardFields, {
    _openid: openid,
    leaderboardEnabled: enabled,
    completedProfile: !!profile.completedProfile,
    createdAt: now,
    updatedAt: now
  });

  let collection = db.collection(COLLECTION);
  let existed;
  try {
    existed = await collection.where({ _openid: openid }).limit(1).get();
  } catch (err) {
    if (!isCollectionMissing(err)) throw err;
    collection = await ensureCollection();
    existed = { data: [] };
  }
  if (existed.data.length) {
    await collection.doc(existed.data[0]._id).update({
      data: updateData
    });
    return { ok: true, mode: 'update', leaderboardEnabled: enabled };
  }

  await collection.add({
    data: addData
  });
  return { ok: true, mode: 'add', leaderboardEnabled: enabled };
};
