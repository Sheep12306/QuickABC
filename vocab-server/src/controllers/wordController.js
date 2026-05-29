const { Word } = require('../models');
const { success, error } = require('../utils/response');

async function getWordsByBookId(req, res) {
  try {
    const { bookId } = req.params;
    const groupNum = parseInt(req.query.groupNum, 10) || 1;
    const groupSize = parseInt(req.query.groupSize, 10) || 5;

    const numericBookId = Number(bookId);
    if (isNaN(numericBookId)) {
      return res.json({ code: 400, msg: 'bookId必须是数字类型', data: [] });
    }

    let query = {
      where: { bookId: numericBookId },
    };

    if (groupSize > 0) {
      const skip = (groupNum - 1) * groupSize;
      query.offset = skip;
      query.limit = groupSize;
    }

    const result = await Word.findAndCountAll(query);

    const data = result.rows.map(item => ({
      ...item.toJSON(),
      meaning: item.meaning || '暂无释义',
    }));

    return res.json(success(data, `获取单词列表成功（共${data.length}个）`));
  } catch (err) {
    console.error('获取单词失败：', err);
    return res.json({ code: 500, msg: '获取单词失败', error: err.message, data: [] });
  }
}

async function getWordsByIds(req, res) {
  try {
    const { wordIds } = req.body;
    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return res.json(success([]));
    }

    const words = await Word.findAll({ where: { id: wordIds } });
    return res.json(success(words));
  } catch (err) {
    return res.json(error('获取单词失败', err));
  }
}

module.exports = { getWordsByBookId, getWordsByIds };
