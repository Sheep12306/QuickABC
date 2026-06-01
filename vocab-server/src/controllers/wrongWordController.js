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

// GET /api/wrong-words
async function getWrongWords(req, res) {
  try {
    const words = await WrongWord.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
    });
    return res.json(success(words));
  } catch (err) {
    return res.json(error('获取错词失败', err));
  }
}

// DELETE /api/wrong-words/:id
async function deleteWrongWord(req, res) {
  try {
    const { id } = req.params;
    await WrongWord.destroy({ where: { id, userId: req.userId } });
    return res.json(success(null, '删除成功'));
  } catch (err) {
    return res.json(error('删除失败', err));
  }
}

module.exports = { addWrongWord, getWrongWords, deleteWrongWord };
