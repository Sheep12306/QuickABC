// cloudfunctions/getStudyData/index.js
// 初始化云开发
const cloud = require('wx-server-sdk')
cloud.init({
  // 务必替换为你的云开发环境ID
  env: 'cloud1-1gfs1z6a4027d442'
})

// 获取数据库引用
const db = cloud.database()
const userStudyCollection = db.collection('user_study_data')

// 云函数主入口
exports.main = async (event, context) => {
  try {
    // 1. 接收小程序端传递的openid
    const { openid } = event
    
    // 2. 参数校验
    if (!openid) {
      return {
        code: 400,
        msg: '缺少用户唯一标识openid'
      }
    }

    // 3. 查询该用户的学习数据
    const queryRes = await userStudyCollection
      .where({ openid: openid })
      .get()

    // 4. 返回数据（有数据返回真实值，无数据返回默认值）
    if (queryRes.data.length > 0) {
      const userData = queryRes.data[0]
      return {
        code: 200,
        msg: '获取学习数据成功',
        data: {
          _id: userData._id,
          openid: userData.openid,
          checkInDays: userData.checkInDays || 0,    // 默认0天
          vocabCount: userData.vocabCount || 0,      // 默认0个词汇
          level: userData.level || 1,                // 默认1级
          createTime: userData.createTime,
          updateTime: userData.updateTime
        }
      }
    } else {
      // 新用户返回默认数据
      return {
        code: 200,
        msg: '用户为新用户，返回默认数据',
        data: {
          checkInDays: 0,
          vocabCount: 0,
          level: 1
        }
      }
    }
  } catch (err) {
    // 错误捕获与提示
    console.error('拉取学习数据失败：', err)
    return {
      code: 500,
      msg: '服务器内部错误：' + err.message,
      error: err
    }
  }
}