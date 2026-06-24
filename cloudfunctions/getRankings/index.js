const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async () => {
  const result = await db.collection('user_profiles')
    .where({
      leaderboardEnabled: true
    })
    .orderBy('totalScore', 'desc')
    .limit(50)
    .get();

  const list = (result.data || []).map((item) => ({
    nickname: item.nickname || '匿名打工人',
    avatarUrl: item.avatarUrl || '',
    rankIndex: item.rankIndex || 0,
    totalScore: item.totalScore || 0
  }));

  return {
    ok: true,
    list
  };
};
