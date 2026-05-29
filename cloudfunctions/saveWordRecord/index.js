// 云函数：保存单词学习记录（标记已学/已掌握）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { bookId, wordId, status } = event; // status: 1-已学 2-已掌握

  try {
    // 查询该用户是否已有该单词的学习记录
    const recordRes = await db.collection('wordStudyRecords')
      .where({
        userId: openid,
        bookId,
        wordId
      })
      .get();

    if (recordRes.data.length === 0) {
      // 新增学习记录
      await db.collection('wordStudyRecords').add({
        data: {
          userId: openid,
          bookId,
          wordId,
          status,
          studyTime: db.serverDate()
        }
      });
    } else {
      // 更新学习记录
      await db.collection('wordStudyRecords')
        .doc(recordRes.data[0]._id)
        .update({
          data: {
            status,
            studyTime: db.serverDate()
          }
        });
    }

    return {
      code: 200,
      msg: '学习记录同步成功'
    };
  } catch (err) {
    return {
      code: 500,
      msg: '同步学习记录失败',
      error: err.message
    };
  }
};