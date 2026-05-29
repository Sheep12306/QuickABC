// cloudfunctions/getBookLearningData/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { bookId } = event;
  const wxContext = cloud.getWXContext();
  try {
    // 读取当前用户该单词书的学习数据
    const res = await db.collection('userBookProgress')
      .where({
        userId: wxContext.OPENID,
        bookId: bookId
      }).get();

    if (res.data.length > 0) {
      return {
        code: 200,
        data: res.data[0]
      };
    } else {
      // 无数据时返回默认值
      return {
        code: 200,
        data: {
          todayLearned: 0,
          totalLearned: 0,
          accuracy: 0,
          newWordsCount: 0,
          reviewCount: 0
        }
      };
    }
  } catch (err) {
    return {
      code: 500,
      msg: '获取学习数据失败',
      error: err.message
    };
  }
};