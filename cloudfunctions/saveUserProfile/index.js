// cloudfunctions/saveUserProfile/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, userInfo } = event;
  try {
    // 检查用户是否存在，不存在则新增，存在则更新
    const userRes = await db.collection('users').where({ openid: openid }).get();
    if (userRes.data.length > 0) {
      // 更新已有用户信息
      await db.collection('users').doc(userRes.data[0]._id).update({
        data: {
          avatar: userInfo.avatar,
          nickname: userInfo.nickname,
          grade: userInfo.grade,
          phone: userInfo.phone,
          school: userInfo.school,
          updateTime: db.serverDate()
        }
      });
    } else {
      // 新增用户信息
      await db.collection('users').add({
        data: {
          openid: openid,
          avatar: userInfo.avatar,
          nickname: userInfo.nickname,
          grade: userInfo.grade,
          phone: userInfo.phone,
          school: userInfo.school,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    }
    return {
      code: 200,
      msg: '个人信息保存成功',
      data: userInfo
    };
  } catch (err) {
    console.error('保存用户信息失败：', err);
    return {
      code: 500,
      msg: '保存失败',
      error: err.message
    };
  }
};