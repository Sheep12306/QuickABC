const { WrongWord } = require('../../models');
const { success, error } = require('../utils/response');

// POST /api/wrong-words
async function addWrongWord(req, res) {
  try {
    const { word } = req.body;

    await WrongWord.create({
      userId: req.userId,
      wordData: word,
      isMastered: false,
    });

    return res.json(success(null, '错词添加成功'));
  } catch (err) {
    return res.json(error('添加错词失败', err));
  }
}

module.exports = { addWrongWord };
