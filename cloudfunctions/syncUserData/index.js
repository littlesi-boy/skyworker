const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const profile = event.profile || {};
  const now = Date.now();
  const safeProfile = {
    nickname: profile.nickname || '游客身份',
    avatarUrl: profile.avatarUrl || '',
    motto: profile.motto || '',
    completedProfile: !!profile.completedProfile,
    rankIndex: profile.rankIndex || 0,
    totalScore: profile.totalScore || 0,
    highestRankIndex: profile.highestRankIndex || 0,
    passCount: profile.passCount || 0,
    failCount: profile.failCount || 0,
    perfectCount: profile.perfectCount || 0,
    overtimeRounds: profile.overtimeRounds || 0,
    overtimeCount: profile.overtimeCount || 0,
    overtimeSeconds: profile.overtimeSeconds || 0,
    totalRounds: profile.totalRounds || 0,
    reviveAdCount: profile.reviveAdCount || 0,
    reviveShareCount: profile.reviveShareCount || 0,
    items: profile.items || {},
    skins: profile.skins || ['default'],
    activeSkin: profile.activeSkin || 'default',
    records: Array.isArray(profile.records) ? profile.records.slice(0, 30) : [],
    autoCheckIn: profile.autoCheckIn !== false,
    privacyAccepted: !!profile.privacyAccepted,
    friendAuth: !!profile.friendAuth,
    leaderboardEnabled: !!profile.leaderboardEnabled,
    musicEnabled: profile.musicEnabled !== false,
    musicVolume: typeof profile.musicVolume === 'number' ? profile.musicVolume : 0.3,
    sfxEnabled: profile.sfxEnabled !== false,
    profileRewardClaimed: !!profile.profileRewardClaimed,
    lastCheckInDate: profile.lastCheckInDate || '',
    checkInStreak: profile.checkInStreak || 0,
    checkInCount: profile.checkInCount || 0,
    updatedAt: now
  };

  const existed = await db.collection('user_profiles').where({ _openid: openid }).limit(1).get();
  if (existed.data.length) {
    await db.collection('user_profiles').doc(existed.data[0]._id).update({
      data: safeProfile
    });
    return { ok: true, mode: 'update' };
  }

  await db.collection('user_profiles').add({
    data: Object.assign({}, safeProfile, {
      createdAt: now
    })
  });
  return { ok: true, mode: 'add' };
};
