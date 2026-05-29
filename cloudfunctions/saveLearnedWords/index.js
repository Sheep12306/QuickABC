// cloudfunctions/saveLearnedWords/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { bookId, groupNum, wordIds } = event;
  const userId = cloud.getWXContext().OPENID;

  try {
    // 先删除旧记录（避免重复）
    await db.collection('userLearnedWords')
      .where({ userId, bookId, groupNum })
      .remove();
    
    // 新增记录（字段严格匹配）
    await db.collection('userLearnedWords').add({
      data: {
        userId,        // 用户唯一标识
        bookId,        // 单词书ID（字符串）
        groupNum,      // 分组号
        wordIds,       // 已学单词ID数组
        updateTime: db.serverDate() // 更新时间
      }
    });

    return { code: 200, msg: '保存成功', data: wordIds };
  } catch (err) {
    return { code: 500, msg: '保存失败', error: err.message };
  }
};