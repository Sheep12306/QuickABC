const { Question } = require('../models');
const { success, error } = require('../utils/response');

// GET /api/questions
async function getQuestionList(req, res) {
  try {
    const { scopeIds } = req.query;
    const ids = scopeIds ? scopeIds.split(',').map(Number) : [];

    let questions;
    if (ids.length > 0) {
      questions = await Question.findAll({
        where: { scope: ids },
        limit: 100,
      });
    } else {
      questions = await Question.findAll({ limit: 100 });
    }

    return res.json(success(questions));
  } catch (err) {
    return res.json({ code: 500, msg: '获取题库失败', error: err.message });
  }
}

module.exports = { getQuestionList };
