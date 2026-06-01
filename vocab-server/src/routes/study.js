const { Router } = require('express');
const ctrl = require('../controllers/studyController');

const router = Router();

router.get('/progress/:bookId', ctrl.getBookProgress);
router.get('/learned-words/:bookId', ctrl.getLearnedWordIds);
router.put('/learned-words/:bookId', ctrl.saveLearnedWords);
router.get('/learn-record/:bookId', ctrl.getLearnRecord);
router.put('/learn-record/:bookId', ctrl.saveLearnRecord);

module.exports = router;
