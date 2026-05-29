// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { action, openid, score, testTime } = event;

    // 保存词汇量测试记录
    if (action === 'save') {
      const result = await db.collection('vocabTestRecords').add({
        data: {
          openid,
          score,
          testTime,
          createTime: new Date()
        }
      });

      // 更新用户的最新词汇量
      await db.collection('users').where({ openid }).update({
        data: {
          lastVocabScore: score,
          lastVocabTestTime: testTime
        }
      });

      return {
        code: 200,
        msg: '保存成功',
        data: result
      };
    }

    // 获取词汇量测试记录
    if (action === 'get') {
      const records = await db.collection('vocabTestRecords')
        .where({ openid })
        .orderBy('createTime', 'desc')
        .get();

      return {
        code: 200,
        msg: '获取成功',
        data: records.data
      };
    }

    return {
      code: 400,
      msg: '无效的操作'
    };
  } catch (err) {
    console.error(err);
    return {
      code: 500,
      msg: '操作失败',
      error: err.message
    };
  }
};
