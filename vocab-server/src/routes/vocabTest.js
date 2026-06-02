const { Router } = require('express');
const { getRecords, saveRecord, startTest, submitTest } = require('../controllers/vocabTestController');

const router = Router();

router.get('/records', getRecords);
router.post('/records', saveRecord);
router.get('/start', startTest);
router.post('/submit', submitTest);

module.exports = router;
