const { Router } = require('express');
const { addWrongWord } = require('../controllers/wrongWordController');

const router = Router();

router.post('/', addWrongWord);

module.exports = router;
