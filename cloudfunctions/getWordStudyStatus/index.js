const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, bookId, groupNum } = event;
  try {
    // 查询该用户指定单词书+分组的学习记录
    const res = await db.collection('wordStudyRecords')
      .where({
        userId,
        bookId,
        groupNum
      })
      .get();

    return {
      code: 200,
      msg: '获取学习状态成功',
      data: res.data
    };
  } catch (err) {
    return {
      code: 500,
      msg: '获取学习状态失败',
      error: err.message
    };
  }
};