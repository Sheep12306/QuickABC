const { WordBook } = require('../models');
const { success, error } = require('../utils/response');

async function getAllWordBooks(req, res) {
  try {
    const books = await WordBook.findAll();
    return res.json(success(books, '获取单词书成功'));
  } catch (err) {
    return res.json(error('获取单词书失败', err));
  }
}

module.exports = { getAllWordBooks };
