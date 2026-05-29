// cloudfunctions/getWordsByBookId/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { bookId, groupNum = 1, groupSize = 5 } = event; // 🔥 修复1：groupSize默认值改为5（和前端一致）
  
  // 🔥 修复2：兼容bookId=0的情况，仅当bookId为undefined/null/空字符串时才报错
  if (bookId === undefined || bookId === null || bookId === '') {
    return { code: 400, msg: 'bookId不能为空', data: [] };
  }

  try {
    const numericBookId = Number(bookId);
    if (isNaN(numericBookId)) {
      return { code: 400, msg: 'bookId必须是数字类型', data: [] };
    }

    let query = db.collection('words').where({
      bookId: numericBookId
    });

    // 分页逻辑（groupSize>0时执行）
    if (groupSize > 0) {
      const skip = (groupNum - 1) * groupSize;
      query = query.skip(skip).limit(groupSize);
    }

    const res = await query.get();
    console.log(`查询到bookId=${numericBookId}的单词：`, res.data); // 🔥 新增日志，方便调试
    
    // 核心修复：统一翻译字段为 meaning
    const formatData = res.data.map(item => {
      return {
        ...item,
        // 优先用原有 meaning，没有则取 translation/其他字段（根据你的实际字段名改）
        meaning: item.meaning || item.translations || item.释义 || item.explain || '暂无释义'
      };
    });

    return {
      code: 200,
      msg: `获取单词列表成功（共${formatData.length}个）`,
      data: formatData || [],
      total: formatData.length
    };
  } catch (err) {
    console.error('获取单词失败：', err);
    return {
      code: 500,
      msg: '获取单词失败',
      error: err.message,
      data: []
    };
  }
};