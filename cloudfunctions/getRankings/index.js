const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION = 'user_profiles';

function safeNumber(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function toPublicRanking(item, position, openid) {
  return {
    position,
    leaderboardId: item.leaderboardId || `${position}`,
    displayName: item.displayName || '匿名打工人',
    rankIndex: safeNumber(item.rankIndex),
    totalScore: safeNumber(item.totalScore),
    passCount: safeNumber(item.passCount),
    perfectCount: safeNumber(item.perfectCount),
    totalRounds: safeNumber(item.totalRounds),
    isMine: !!(openid && item._openid === openid),
    updatedAt: item.updatedAt || 0
  };
}

function uniqueRankingRows(rows, limit) {
  const seen = {};
  const result = [];
  (rows || []).forEach((item) => {
    const key = item.leaderboardId || item._openid || item.displayName || item._id;
    if (!key || seen[key]) return;
    seen[key] = true;
    result.push(item);
  });
  return result.slice(0, limit);
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
  const limit = Math.min(Math.max(safeNumber(event.limit) || 50, 10), 100);
  let collection = db.collection(COLLECTION);

  let result;
  try {
    result = await collection
      .where({ leaderboardEnabled: true })
      .orderBy('totalScore', 'desc')
      .orderBy('perfectCount', 'desc')
      .orderBy('updatedAt', 'asc')
      .limit(Math.min(limit * 3, 100))
      .get();
  } catch (err) {
    if (isCollectionMissing(err)) {
      collection = await ensureCollection();
      return {
        ok: true,
        list: [],
        mine: { enabled: false, rank: 0 }
      };
    }
    return {
      ok: false,
      list: [],
      mine: { enabled: false, rank: 0 },
      error: err && (err.errMsg || err.message) ? (err.errMsg || err.message) : 'ranking query failed'
    };
  }

  const uniqueRows = uniqueRankingRows(result.data || [], limit);
  const list = uniqueRows.map((item, index) => toPublicRanking(item, index + 1, openid));
  let mineResult;
  try {
    mineResult = await collection.where({ _openid: openid }).limit(1).get();
  } catch (err) {
    if (isCollectionMissing(err)) {
      await ensureCollection();
      return {
        ok: true,
        list,
        mine: { enabled: false, rank: 0 }
      };
    }
    throw err;
  }
  const mineDoc = mineResult.data && mineResult.data[0] ? mineResult.data[0] : null;
  let mine = { enabled: false, rank: 0 };

  if (mineDoc && mineDoc.leaderboardEnabled) {
    const ahead = await collection.where({
      leaderboardEnabled: true,
      totalScore: _.gt(safeNumber(mineDoc.totalScore))
    }).count();
    const topHit = list.find((item) => item.isMine);
    mine = {
      enabled: true,
      rank: topHit ? topHit.position : (ahead.total || 0) + 1,
      displayName: mineDoc.displayName || '匿名打工人',
      totalScore: safeNumber(mineDoc.totalScore),
      rankIndex: safeNumber(mineDoc.rankIndex)
    };
  }

  return {
    ok: true,
    list,
    mine
  };
};
