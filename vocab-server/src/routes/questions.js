const { Router } = require('express');
const { getQuestionList } = require('../controllers/questionController');

const router = Router();

router.get('/', getQuestionList);

module.exports = router;
