// cloudfunctions/getUserProfile/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid } = event;
  try {
    const res = await db.collection('users').where({ openid: openid }).get();
    if (res.data.length > 0) {
      return {
        code: 200,
        msg: '获取个人信息成功',
        data: res.data[0]
      };
    } else {
      return {
        code: 404,
        msg: '暂无个人信息',
        data: null
      };
    }
  } catch (err) {
    console.error('获取用户信息失败：', err);
    return {
      code: 500,
      msg: '获取失败',
      error: err.message
    };
  }
};