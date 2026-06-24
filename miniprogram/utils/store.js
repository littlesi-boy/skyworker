const { RANKS, ITEMS, SKINS } = require('./config');
const { CLOUD_ENV } = require('./env');

function todayKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function createDefaultProfile() {
  return {
    nickname: '游客身份',
    avatarUrl: '',
    motto: '稳住心态写代码',
    completedProfile: false,
    rankIndex: 0,
    totalScore: 0,
    highestRankIndex: 0,
    passCount: 0,
    failCount: 0,
    perfectCount: 0,
    overtimeRounds: 0,
    overtimeCount: 0,
    overtimeSeconds: 0,
    totalRounds: 0,
    reviveAdCount: 0,
    reviveShareCount: 0,
    items: {
      time: 1,
      mood: 1,
      progress: 1,
      needle: 1,
      bean: 1,
      mindstone: 1
    },
    skins: ['default'],
    activeSkin: 'default',
    records: [],
    autoCheckIn: true,
    privacyAccepted: false,
    friendAuth: false,
    leaderboardEnabled: false,
    musicEnabled: true,
    musicVolume: 0.3,
    sfxEnabled: true,
    profileRewardClaimed: false,
    lastCheckInDate: '',
    checkInStreak: 0,
    checkInCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadProfile() {
  const profile = wx.getStorageSync('profile') || createDefaultProfile();
  return normalizeProfile(profile);
}

function normalizeProfile(profile) {
  const next = Object.assign(createDefaultProfile(), profile || {});
  next.items = Object.assign({ time: 1, mood: 1, progress: 1, needle: 1, bean: 1, mindstone: 1 }, profile.items || {});
  next.skins = Array.from(new Set(next.skins && next.skins.length ? next.skins : ['default']));
  next.records = Array.isArray(next.records) ? next.records.slice(0, 30) : [];
  next.rankIndex = Math.min(Math.max(next.rankIndex || 0, 0), RANKS.length - 1);
  next.highestRankIndex = Math.min(Math.max(next.highestRankIndex || 0, next.rankIndex), RANKS.length - 1);
  if (!next.activeSkin || !SKINS.find((skin) => skin.id === next.activeSkin)) {
    next.activeSkin = 'default';
  }
  return next;
}

function isProfileReady(profile) {
  const nickname = (profile && profile.nickname || '').trim();
  const motto = (profile && profile.motto || '').trim();
  return !!(
    profile &&
    profile.completedProfile &&
    profile.avatarUrl &&
    nickname &&
    nickname !== '游客身份' &&
    motto
  );
}

function saveProfile(profile) {
  const next = normalizeProfile(Object.assign({}, profile, { updatedAt: Date.now() }));
  wx.setStorageSync('profile', next);
  const app = typeof getApp === 'function' ? getApp({ allowDefault: true }) : null;
  if (app && app.globalData) {
    app.globalData.profile = next;
  }
  syncProfile(next);
  return next;
}

function syncProfile(profile) {
  if (!wx.cloud || !profile.completedProfile) return;
  wx.cloud.callFunction({
    name: 'syncUserData',
    config: {
      env: CLOUD_ENV
    },
    data: { profile },
    fail() {}
  });
}

function trackEvent(name, payload) {
  if (!wx.cloud) return;
  wx.cloud.callFunction({
    name: 'trackEvent',
    config: {
      env: CLOUD_ENV
    },
    data: { name, payload: payload || {}, clientTime: Date.now() },
    fail() {}
  });
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomItems(count) {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(randomFrom(ITEMS));
  }
  return result;
}

function randomSkin(rankIndex) {
  const pool = SKINS.filter((skin) => skin.id !== 'default' && (rankIndex >= 7 || skin.rarity !== '传说'));
  return randomFrom(pool);
}

function rankByScore(score) {
  let rankIndex = 0;
  RANKS.forEach((rank, index) => {
    if (score >= rank.threshold) {
      rankIndex = Math.min(index + 1, RANKS.length - 1);
    }
  });
  return rankIndex;
}

module.exports = {
  todayKey,
  createDefaultProfile,
  isProfileReady,
  loadProfile,
  saveProfile,
  trackEvent,
  randomFrom,
  randomItems,
  randomSkin,
  rankByScore
};
