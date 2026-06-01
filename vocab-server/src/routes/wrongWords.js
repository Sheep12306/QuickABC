const { Router } = require('express');
const { addWrongWord, getWrongWords, deleteWrongWord } = require('../controllers/wrongWordController');

const router = Router();

router.get('/', getWrongWords);
router.post('/', addWrongWord);
router.delete('/:id', deleteWrongWord);

module.exports = router;
