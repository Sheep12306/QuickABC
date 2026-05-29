// 云函数入口文件
//保存用户数据，wx登录接口
// cloudfunctions/saveStudyData/index.js
// 初始化云开发
const cloud = require('wx-server-sdk')
cloud.init({
  // 务必替换为你的云开发环境ID（和小程序端一致）
  env: 'cloud1-1gfs1z6a4027d442'
})

// 获取数据库引用
const db = cloud.database()
// 定义用户学习数据集合（可自定义名称）
const userStudyCollection = db.collection('user_study_data')

// 云函数主入口
exports.main = async (event, context) => {
  try {
    // 1. 接收小程序端传递的参数
    const { openid, checkInDays, vocabCount, level } = event
    
    // 2. 参数校验
    if (!openid) {
      return {
        code: 400,
        msg: '缺少用户唯一标识openid'
      }
    }

    // 3. 查询该用户是否已有数据
    const queryRes = await userStudyCollection
      .where({ openid: openid })
      .get()

    // 4. 有数据则更新，无数据则新增
    if (queryRes.data.length > 0) {
      // 更新已有数据
      await userStudyCollection
        .doc(queryRes.data[0]._id) // 根据文档ID更新
        .update({
          data: {
            checkInDays: checkInDays,
            vocabCount: vocabCount,
            level: level,
            updateTime: db.serverDate() // 使用云端时间，避免客户端时间不一致
          }
        })
      
      return {
        code: 200,
        msg: '学习数据更新成功',
        data: {
          _id: queryRes.data[0]._id,
          checkInDays: checkInDays,
          vocabCount: vocabCount,
          level: level
        }
      }
    } else {
      // 新增用户数据
      const addRes = await userStudyCollection.add({
        data: {
          openid: openid,          // 用户唯一标识
          checkInDays: checkInDays, // 打卡天数
          vocabCount: vocabCount,   // 词汇量
          level: level,             // 用户等级
          createTime: db.serverDate(), // 创建时间
          updateTime: db.serverDate()  // 更新时间
        }
      })
      
      return {
        code: 200,
        msg: '学习数据新增成功',
        data: {
          _id: addRes._id,
          checkInDays: checkInDays,
          vocabCount: vocabCount,
          level: level
        }
      }
    }
  } catch (err) {
    // 错误捕获与提示
    console.error('保存学习数据失败：', err)
    return {
      code: 500,
      msg: '服务器内部错误：' + err.message,
      error: err
    }
  }
}