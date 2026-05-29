// 云函数：addBookIdToWords
// 功能：批量给单词表添加 bookId 字段，默认值 = 0，只补不存在的字段
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口
exports.main = async (event, context) => {
  // ========== 只需确认表名 ==========
  const COLLECTION_NAME = 'words' // 你的单词表名
  const DEFAULT_BOOK_ID = 0       // 已改为 0
  const BATCH_LIMIT = 100
  // =================================

  try {
    // 统计没有 bookId 的数据
    const countRes = await db.collection(COLLECTION_NAME)
      .where({ bookId: _.exists(false) })
      .count()

    const total = countRes.total
    if (total === 0) {
      return {
        success: true,
        msg: '✅ 所有单词已有 bookId，无需更新',
        total: 0,
        updated: 0
      }
    }

    let updatedCount = 0
    while (updatedCount < total) {
      const res = await db.collection(COLLECTION_NAME)
        .where({ bookId: _.exists(false) })
        .limit(BATCH_LIMIT)
        .get()

      const words = res.data
      if (words.length === 0) break

      // 批量更新：bookId = 0
      const batch = db.batchUpdate()
      words.forEach(item => {
        batch(COLLECTION_NAME).doc(item._id).update({
          data: { bookId: DEFAULT_BOOK_ID }
        })
      })
      await batch.commit()

      updatedCount += words.length
    }

    return {
      success: true,
      msg: '🎉 全部单词已添加 bookId = 0',
      total: total,
      updated: updatedCount
    }

  } catch (e) {
    console.error('失败：', e)
    return {
      success: false,
      errMsg: e.message
    }
  }
}