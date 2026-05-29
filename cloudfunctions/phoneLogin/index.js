// cloudfunctions/phoneLogin/index.js
// 云函数入口文件
const cloud = require('wx-server-sdk');
// 引入微信官方解密手机号的依赖（需先安装）
const WXBizDataCrypt = require('./WXBizDataCrypt');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 自动匹配当前环境，也可写死你的env: 'cloud1-1gfs1z6a4027d442'
});

// 数据库引用
const db = cloud.database();
const usersCollection = db.collection('users'); // 确保你的用户表名为 users

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 1. 获取前端传过来的参数
    const { code, encryptedData, iv, openid, userInfo } = event;
    console.log('接收参数：', { code, openid, userInfo });

    // 校验必要参数
    if (!code || !encryptedData || !iv || !openid) {
      return {
        code: 400,
        msg: '参数缺失：code/encryptedData/iv/openid 不能为空'
      };
    }

    // 2. 调用微信接口获取 sessionKey（用于解密手机号）
    const wxRes = await cloud.callFunction({
      name: 'login', // 复用你已有的login云函数获取sessionKey
      data: { code, onlyGetSessionKey: true }
    });

    if (!wxRes.result || !wxRes.result.sessionKey) {
      return {
        code: 401,
        msg: '获取sessionKey失败，请检查code是否有效'
      };
    }
    const sessionKey = wxRes.result.sessionKey;

    // 3. 解密手机号（核心步骤）
    // 替换为你的小程序AppID（在微信公众平台可查）
    const appId = 'wx437eadbea15cf0b2'; 
    const pc = new WXBizDataCrypt(appId, sessionKey);
    // 解密手机号数据
    const phoneData = pc.decryptData(encryptedData, iv);
    console.log('解密后的手机号数据：', phoneData);

    if (!phoneData.phoneNumber) {
      return {
        code: 402,
        msg: '手机号解密失败'
      };
    }
    const phoneNumber = phoneData.phoneNumber; // 解密后的完整手机号

    // 4. 绑定手机号到用户（更新/新增用户数据）
    // 先查询用户是否已存在
    const userRes = await usersCollection.where({
      openid: openid
    }).get();

    let userId = '';
    if (userRes.data && userRes.data.length > 0) {
      // 4.1 已存在用户 → 更新手机号和用户信息
      userId = userRes.data[0]._id;
      await usersCollection.doc(userId).update({
        data: {
          phone: phoneNumber, // 绑定手机号
          avatarUrl: userInfo?.avatarUrl || userRes.data[0].avatarUrl,
          nickName: userInfo?.nickName || userRes.data[0].nickName,
          updateTime: db.serverDate() // 更新时间
        }
      });
    } else {
      // 4.2 新用户 → 新增用户记录
      const addRes = await usersCollection.add({
        data: {
          openid: openid,
          phone: phoneNumber,
          avatarUrl: userInfo?.avatarUrl || '',
          nickName: userInfo?.nickName || '',
          checkInDays: 0, // 初始打卡天数
          vocabCount: 0, // 初始词汇量
          level: 1, // 初始等级
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      userId = addRes._id;
    }

    // 5. 返回成功结果
    return {
      code: 200,
      msg: '手机号绑定成功',
      data: {
        phone: phoneNumber,
        userId: userId,
        openid: openid
      }
    };

  } catch (err) {
    console.error('phoneLogin云函数执行失败：', err);
    return {
      code: 500,
      msg: '服务器内部错误：' + err.message,
      error: err.toString()
    };
  }
};