const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, code, userInfo, openid, encryptedData, iv } = event;
  
  // 1. 获取 OpenID (如果前端没传)
  let currentOpenid = openid;
  if (!currentOpenid && code) {
    const res = await cloud.getOpenData({ list: [code] }); // 注意：这里通常需要用 wx.login 的 code 换 openid
    // 简化版：实际生产中建议用 request 请求微信接口换 openid，这里假设前端已传 openid 或使用云开发自带能力
    // 云开发环境下，wx.context.OPENID 可直接获取
    currentOpenid = cloud.getWXContext().OPENID; 
  }

  const collection = db.collection('users'); // 确保数据库集合名叫 users

  // 2. 动作：获取用户信息
  if (action === 'getUserInfo') {
    const res = await collection.where({ openid: event.openid }).get();
    if (res.data.length > 0) {
      return { code: 200, data: res.data[0] };
    }
    return { code: 404, msg: '用户不存在' };
  }

  // 3. 动作：登录/注册 (核心：写入数据库)
  if (action === 'login' || action === 'loginWithPhone' || action === 'sync') {
    const now = new Date();
    const userRecord = {
      openid: currentOpenid,
      avatar: userInfo?.avatarUrl || '',
      nickname: userInfo?.nickName || '',
      level: 1,
      checkInDays: 0,
      vocabCount: 0,
      createTime: now,
      updateTime: now
    };

    if (action === 'loginWithPhone' && encryptedData) {
      // 解密手机号逻辑 (需要云函数配置好权限)
      try {
        const phoneData = cloud.getOpenData({ list: [encryptedData] }); // 注意：手机号解密需特定方式，此处简化
        // 实际解密需用 wx-server-sdk 的 getOpenData 或专门接口
        // 这里假设云函数能处理 encryptedData
        userRecord.phone = 'encrypted'; // 实际需解密后存入
      } catch (e) { console.error(e); }
    }

    // 查询是否存在
    const existRes = await collection.where({ openid: currentOpenid }).get();
    
    if (existRes.data.length > 0) {
      // 更新现有用户 (更新头像昵称)
      await collection.doc(existRes.data[0]._id).update({
        data: {
          avatar: userRecord.avatar,
          nickname: userRecord.nickname,
          updateTime: now
        }
      });
      return { code: 200, data: { ...existRes.data[0], ...userRecord } };
    } else {
      // 创建新用户
      const addRes = await collection.add({ data: userRecord });
      return { code: 200, data: { _id: addRes._id, ...userRecord } };
    }
  }

  return { code: 500, msg: '未知动作' };
};
