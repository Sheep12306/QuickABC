const { VocabTestRecord, User } = require('../models');
const { success, error } = require('../utils/response');

// GET /api/vocab-records
async function getRecords(req, res) {
  try {
    const records = await VocabTestRecord.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
    });
    return res.json(success(records));
  } catch (err) {
    return res.json(error('获取测试记录失败', err));
  }
}

// POST /api/vocab-records
async function saveRecord(req, res) {
  try {
    const { score, testTime } = req.body;

    await VocabTestRecord.create({
      userId: req.userId,
      score,
      testTime,
    });

    await User.update(
      { lastVocabScore: score, lastVocabTestTime: testTime, updatedAt: new Date() },
      { where: { id: req.userId } },
    );

    return res.json(success(null, '词汇测试保存成功'));
  } catch (err) {
    return res.json(error('保存词汇测试失败', err));
  }
}

module.exports = { getRecords, saveRecord };
