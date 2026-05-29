const { Router } = require('express');
const { getAllWordBooks } = require('../controllers/wordBookController');
const { getWordsByBookId } = require('../controllers/wordController');

const router = Router();

router.get('/', getAllWordBooks);
router.get('/:bookId/words', getWordsByBookId);

module.exports = router;
