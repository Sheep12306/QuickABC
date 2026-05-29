// cloudfunctions/addWrongWord/index.js
const cloud = require('wx-server-sdk')

// 核心修复：正确初始化云环境（使用对象格式）
cloud.init({
  env: 'cloud1-1gfs1z6a4027d442' // 你的云环境ID，必须和app.js一致
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    await db.collection('wrong_words').add({
      data: {
        openid: wxContext.OPENID,
        word: event.word,
        createTime: db.serverDate(),
        isMastered: false
      }
    })
    return { success: true }
  } catch (err) {
    console.error("添加错词失败：", err)
    return { success: false, err: err.message }
  }
}