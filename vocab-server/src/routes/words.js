const { Router } = require('express');
const { getWordsByIds } = require('../controllers/wordController');

const router = Router();

router.post('/batch', getWordsByIds);

module.exports = router;
