// cloudfunctions/getLearnedWordIds/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { bookId, groupNum } = event;
  // 云函数内部获取用户 OPENID
  const wxContext = cloud.getWXContext();
  const userId = wxContext.OPENID;

  try {
    const res = await db.collection('userLearnedWords')
      .where({
        userId: userId,
        bookId: bookId,
        groupNum: groupNum
      }).get();
    return { code: 200, data: res.data };
  } catch (err) {
    return { code: 500, msg: '查询失败', error: err.message };
  }
};