const { VocabTestRecord, User, WordBook, Word } = require('../../models');
const { success, error } = require('../utils/response');

const SAMPLE_PER_BOOK = 10;

// GET /api/vocab-test/records
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

// POST /api/vocab-test/records
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

// GET /api/vocab-test/start — 每本词书随机抽词
async function startTest(req, res) {
  try {
    const books = await WordBook.findAll();
    if (!books.length) return res.json(error('暂无词书数据'));

    const allWords = [];

    for (const book of books) {
      if (!book.totalWords || book.totalWords < SAMPLE_PER_BOOK) continue;
      const words = await Word.findAll({
        where: { bookId: book.id },
        order: Word.sequelize.literal('RAND()'),
        limit: SAMPLE_PER_BOOK,
        attributes: ['id', 'word', 'phonetic', 'part', 'meaning', 'bookId'],
      });
      words.forEach(w => {
        allWords.push({
          id: w.id,
          word: w.word,
          phonetic: w.phonetic,
          part: w.part,
          meaning: w.meaning,
          bookId: book.id,
          bookName: book.name,
          bookTotal: book.totalWords,
        });
      });
    }

    if (!allWords.length) return res.json(error('抽词失败，请检查词书数据'));

    // 打乱顺序
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    return res.json(success({ words: allWords }));
  } catch (err) {
    return res.json(error('生成测试题目失败', err));
  }
}

// POST /api/vocab-test/submit — 提交答案，计算结果
async function submitTest(req, res) {
  try {
    const { answers } = req.body;
    if (!answers || !answers.length) return res.json(error('缺少答案数据'));

    // 查询所有答案对应的单词
    const wordIds = answers.map(a => a.wordId);
    const words = await Word.findAll({
      where: { id: wordIds },
      attributes: ['id', 'bookId'],
    });
    const wordBookMap = {};
    words.forEach(w => { wordBookMap[w.id] = w.bookId; });

    // 查询所有词书信息
    const books = await WordBook.findAll();
    const bookInfoMap = {};
    books.forEach(b => { bookInfoMap[b.id] = { name: b.name, totalWords: b.totalWords }; });

    // 按 bookId 分组统计
    const bookMap = {};
    for (const a of answers) {
      const bookId = wordBookMap[a.wordId];
      if (!bookId) continue;

      if (!bookMap[bookId]) {
        bookMap[bookId] = { totalScore: 0, count: 0 };
      }
      bookMap[bookId].count += 1;
      if (a.answer === 'know') bookMap[bookId].totalScore += 1;
      else if (a.answer === 'fuzzy') bookMap[bookId].totalScore += 0.5;
    }

    // 计算每本书认识率 + 估算总词汇量
    let estimatedVocab = 0;
    const bookResults = [];

    for (const [bookId, data] of Object.entries(bookMap)) {
      const info = bookInfoMap[parseInt(bookId)] || { name: '', totalWords: 0 };
      const rate = data.count > 0 ? data.totalScore / data.count : 0;
      estimatedVocab += Math.round(rate * info.totalWords);

      bookResults.push({
        bookId: parseInt(bookId),
        bookName: info.name,
        rate: Math.round(rate * 100),
        score: data.totalScore,
        count: data.count,
        totalWords: info.totalWords,
        contribution: Math.round(rate * info.totalWords),
      });
    }

    const totalScore = bookResults.reduce((s, b) => s + b.score, 0);
    const totalCount = bookResults.reduce((s, b) => s + b.count, 0);
    const now = new Date();
    const testTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    await VocabTestRecord.create({
      userId: req.userId,
      score: Math.round((totalScore / Math.max(totalCount, 1)) * 100) || 0,
      estimatedVocab,
      bookResults: JSON.stringify(bookResults),
      testTime,
    });

    await User.update(
      { lastVocabScore: estimatedVocab, lastVocabTestTime: testTime, updatedAt: new Date() },
      { where: { id: req.userId } },
    );

    // 推荐认识率 < 80% 的词书
    const recommendations = bookResults
      .filter(b => b.rate < 80)
      .map(b => ({ bookId: b.bookId, bookName: b.bookName, rate: b.rate }));

    return res.json(success({
      estimatedVocab,
      totalScore,
      totalCount,
      bookResults,
      recommendations,
      testTime,
    }, '测试完成'));
  } catch (err) {
    return res.json(error('提交测试失败', err));
  }
}

module.exports = { getRecords, saveRecord, startTest, submitTest };
