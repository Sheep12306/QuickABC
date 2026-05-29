// 云函数：getQuestionList
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { scopeIds } = event; // 前端传的选中分类ID（如[1,2,3]）
  try {
    // 根据分类筛选题目，取100题（适配你的100题模拟考试）
    const questionRes = await db.collection('questionBank')
      .where({ scope: db.command.in(scopeIds) })
      .limit(100)
      .get();
    return {
      code: 200,
      data: questionRes.data
    };
  } catch (err) {
    return {
      code: 500,
      msg: '获取题库失败',
      error: err.message
    };
  }
};