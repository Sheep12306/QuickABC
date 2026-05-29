// cloudfunctions/saveUserLearnRecord/index.js
//云函数兜底（防止本地数据丢失）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, bookId, learnRecord } = event;
  try {
    // 查找用户学习记录
    const record = await db.collection('userLearnRecord')
      .where({ openid, bookId })
      .get();

    if (record.data.length > 0) {
      // 更新已有记录
      await db.collection('userLearnRecord')
        .doc(record.data[0]._id)
        .update({
          data: {
            learnRecord: learnRecord,
            updateTime: db.serverDate()
          }
        });
    } else {
      // 新增记录
      await db.collection('userLearnRecord').add({
        data: {
          openid,
          bookId,
          learnRecord: learnRecord,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    }
    return { code: 200, msg: '学习记录保存成功' };
  } catch (err) {
    return { code: 500, msg: '保存失败', error: err.message };
  }
};