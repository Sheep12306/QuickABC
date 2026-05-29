const { UserBookProgress, UserLearnedWords, UserLearnRecord, WordStudyRecord } = require('../models');
const { success, error } = require('../utils/response');

// GET /api/study/progress/:bookId
async function getBookProgress(req, res) {
  try {
    const { bookId } = req.params;
    const record = await UserBookProgress.findOne({
      where: { userId: req.userId, bookId },
    });

    if (record) {
      return res.json(success(record));
    }

    return res.json(success({
      todayLearned: 0,
      totalLearned: 0,
      accuracy: 0,
      newWordsCount: 0,
      reviewCount: 0,
    }));
  } catch (err) {
    return res.json(error('获取学习数据失败', err));
  }
}

// POST /api/study/word-record
async function saveWordRecord(req, res) {
  try {
    const { bookId, wordId, status } = req.body;

    const existing = await WordStudyRecord.findOne({
      where: { userId: req.userId, bookId, wordId },
    });

    if (existing) {
      await existing.update({ status, studyTime: new Date() });
    } else {
      await WordStudyRecord.create({
        userId: req.userId,
        bookId,
        wordId,
        status,
        studyTime: new Date(),
      });
    }

    return res.json(success(null, '学习记录同步成功'));
  } catch (err) {
    return res.json(error('同步学习记录失败', err));
  }
}

// GET /api/study/word-status
async function getWordStatus(req, res) {
  try {
    const { bookId, groupNum } = req.query;
    const records = await WordStudyRecord.findAll({
      where: { userId: req.userId, bookId, groupNum: parseInt(groupNum, 10) || 0 },
    });

    return res.json(success(records, '获取学习状态成功'));
  } catch (err) {
    return res.json(error('获取学习状态失败', err));
  }
}

// GET /api/study/learned-words/:bookId
async function getLearnedWordIds(req, res) {
  try {
    const { bookId } = req.params;
    const { groupNum } = req.query;

    const record = await UserLearnedWords.findOne({
      where: { userId: req.userId, bookId, groupNum: parseInt(groupNum, 10) },
    });

    return res.json(success(record || { wordIds: [] }));
  } catch (err) {
    return res.json(error('查询失败', err));
  }
}

// PUT /api/study/learned-words/:bookId
async function saveLearnedWords(req, res) {
  try {
    const { bookId } = req.params;
    const { groupNum, wordIds } = req.body;

    await UserLearnedWords.destroy({
      where: { userId: req.userId, bookId, groupNum },
    });

    await UserLearnedWords.create({
      userId: req.userId,
      bookId,
      groupNum,
      wordIds,
      updatedAt: new Date(),
    });

    return res.json(success(wordIds, '保存成功'));
  } catch (err) {
    return res.json(error('保存失败', err));
  }
}

// GET /api/study/learn-record/:bookId
async function getLearnRecord(req, res) {
  try {
    const { bookId } = req.params;
    const record = await UserLearnRecord.findOne({
      where: { userId: req.userId, bookId },
    });

    if (record) {
      return res.json(success(record));
    }
    return res.json(success(null));
  } catch (err) {
    return res.json(error('获取学习记录失败', err));
  }
}

// PUT /api/study/learn-record/:bookId
async function saveLearnRecord(req, res) {
  try {
    const { bookId } = req.params;
    const { learnRecord } = req.body;

    const existing = await UserLearnRecord.findOne({
      where: { userId: req.userId, bookId },
    });

    if (existing) {
      await existing.update({ learnRecord, updatedAt: new Date() });
    } else {
      await UserLearnRecord.create({
        userId: req.userId,
        bookId,
        learnRecord,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return res.json(success(null, '学习记录保存成功'));
  } catch (err) {
    return res.json(error('保存失败', err));
  }
}

module.exports = {
  getBookProgress,
  saveWordRecord,
  getWordStatus,
  getLearnedWordIds,
  saveLearnedWords,
  getLearnRecord,
  saveLearnRecord,
};
