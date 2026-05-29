// cloudfunctions/getAllWordBooks/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 从wordBooks集合读取所有单词书
    const res = await db.collection('wordBooks').get();
    return {
      code: 200,
      msg: '获取单词书成功',
      data: res.data
    };
  } catch (err) {
    return {
      code: 500,
      msg: '获取单词书失败',
      error: err.message
    };
  }
};