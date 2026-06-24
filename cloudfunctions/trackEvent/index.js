const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const name = event.name || 'unknown';
  const payload = event.payload || {};
  await db.collection('events').add({
    data: {
      name,
      payload,
      clientTime: event.clientTime || 0,
      createdAt: Date.now(),
      appid: wxContext.APPID
    }
  });
  return { ok: true };
};
