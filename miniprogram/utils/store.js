const { RANKS, ITEMS, SKINS, CHECKIN_TEXTS } = require('./config');
const { CLOUD_ENV } = require('./env');

const TEST_ACCOUNT_KEYWORDS = ['测试账号', '测试', 'test', 'tester', 'debug', 'qa', 'uat', 'q斯滑', 'q斯滑(3)'];
const BASE_SKIN_IDS = ['default', 'eye-care'];

function normalizeAccountText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[“”"'‘’\s()（）[\]{}【】]/g, '');
}

function todayKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function yesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const month = `${yesterday.getMonth() + 1}`.padStart(2, '0');
  const day = `${yesterday.getDate()}`.padStart(2, '0');
  return `${yesterday.getFullYear()}-${month}-${day}`;
}

function createDefaultProfile() {
  return {
    openid: '',
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
      mood: 1,
      progress: 1,
      needle: 1,
      freeze: 1,
      slowdown: 1,
      bean: 1,
      mindstone: 1
    },
    skins: BASE_SKIN_IDS.slice(),
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
    testAccount: false,
    testBonusGranted: false,
    testBonusVersion: 0,
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
  const source = profile || {};
  const next = Object.assign(createDefaultProfile(), source);
  next.items = Object.assign({ mood: 1, progress: 1, needle: 1, freeze: 1, slowdown: 1, bean: 1, mindstone: 1 }, source.items || {});
  next.records = Array.isArray(next.records) ? next.records.slice(0, 30) : [];
  next.rankIndex = Math.min(Math.max(next.rankIndex || 0, 0), RANKS.length - 1);
  next.highestRankIndex = Math.min(Math.max(next.highestRankIndex || 0, next.rankIndex), RANKS.length - 1);
  next.skins = normalizeSkins(next.skins, next.rankIndex);
  if (!next.activeSkin || !SKINS.find((skin) => skin.id === next.activeSkin)) {
    next.activeSkin = 'default';
  }
  if (!isSkinUnlocked(next.activeSkin, next.rankIndex)) {
    next.activeSkin = 'default';
  }
  next.defaultSkinVersion = Math.max(1, next.defaultSkinVersion || 0);
  next.friendAuth = !!(next.friendAuth || next.leaderboardEnabled);
  next.leaderboardEnabled = !!(next.friendAuth || next.leaderboardEnabled);
  next.completedProfile = hasProfileBasics(next);
  next.testAccount = !!(next.testAccount || isTestAccount(next));
  next.testBonusVersion = Math.max(0, next.testBonusVersion || 0);
  return next;
}

function normalizeSkins(skins, rankIndex) {
  const owned = Array.from(new Set(BASE_SKIN_IDS.concat(skins && skins.length ? skins : [])));
  SKINS.forEach((skin) => {
    if (skin.unlockRankIndex !== undefined && isSkinUnlocked(skin.id, rankIndex)) {
      owned.push(skin.id);
    }
  });
  return Array.from(new Set(owned)).filter((id) => {
    const skin = SKINS.find((item) => item.id === id);
    return skin && isSkinUnlocked(id, rankIndex);
  });
}

function isSkinUnlocked(id, rankIndex) {
  const skin = SKINS.find((item) => item.id === id);
  if (!skin) return false;
  return skin.unlockRankIndex === undefined || rankIndex >= skin.unlockRankIndex;
}

function isTestAccount(profile) {
  if (profile && profile.testAccount) return true;
  const openid = ((profile && profile.openid) || '').trim();
  const nickname = normalizeAccountText(profile && profile.nickname);
  const motto = normalizeAccountText(profile && profile.motto);
  const openidMatch = openid && openid === 'YOUR_TEST_OPENID';
  return openidMatch || nickname.includes('斯滑') || TEST_ACCOUNT_KEYWORDS.some((key) => {
    const needle = normalizeAccountText(key);
    return nickname.includes(needle) || motto.includes(needle);
  });
}

function isProfileReady(profile) {
  return hasProfileBasics(profile);
}

function isFormalProfile(profile) {
  return !!(
    profile &&
    isProfileReady(profile) &&
    (
      profile.privacyAccepted ||
      profile.friendAuth ||
      profile.leaderboardEnabled ||
      profile.testAccount ||
      isTestAccount(profile)
    )
  );
}

function hasProfileBasics(profile) {
  const nickname = (profile && profile.nickname || '').trim();
  const motto = (profile && profile.motto || '').trim();
  return !!(
    profile &&
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

function shouldAutoCheckIn(profile) {
  const next = normalizeProfile(profile || {});
  return isFormalProfile(next) && next.autoCheckIn !== false && next.lastCheckInDate !== todayKey();
}

function checkInProfile(auto) {
  const profile = loadProfile();
  const today = todayKey();
  if (!isFormalProfile(profile)) {
    return { checkedIn: false, reason: 'profile_not_ready', profile };
  }
  if (profile.lastCheckInDate === today) {
    return { checkedIn: false, reason: 'already_checked_in', profile };
  }

  profile.checkInStreak = profile.lastCheckInDate === yesterdayKey() ? profile.checkInStreak + 1 : 1;
  profile.checkInCount += 1;
  profile.lastCheckInDate = today;
  profile.items.bean = (profile.items.bean || 0) + 1;

  const rewards = ['效率豆 +1'];
  if (profile.checkInStreak >= 2 && profile.checkInStreak % 2 === 0) {
    const skin = randomSkin(profile.rankIndex);
    if (skin && !profile.skins.includes(skin.id)) {
      profile.skins.push(skin.id);
      rewards.push(`连续打卡赠送：${skin.name}`);
    } else {
      const item = randomFrom(ITEMS);
      profile.items[item.id] = (profile.items[item.id] || 0) + 1;
      rewards.push(`连续打卡赠送：${item.name}`);
    }
  }

  const saved = saveProfile(profile);
  trackEvent('check_in', { auto: !!auto, streak: saved.checkInStreak });
  return {
    checkedIn: true,
    profile: saved,
    modal: {
      auto: !!auto,
      copy: randomFrom(CHECKIN_TEXTS),
      reward: rewards.join('、')
    }
  };
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
  const pool = SKINS.filter((skin) => (
    !BASE_SKIN_IDS.includes(skin.id) &&
    skin.unlockRankIndex === undefined &&
    (rankIndex >= 7 || skin.rarity !== '传说')
  ));
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
  isFormalProfile,
  shouldAutoCheckIn,
  checkInProfile,
  loadProfile,
  saveProfile,
  isTestAccount,
  trackEvent,
  randomFrom,
  randomItems,
  randomSkin,
  isSkinUnlocked,
  rankByScore
};
