const { Router } = require('express');
const { getRecords, saveRecord } = require('../controllers/vocabTestController');

const router = Router();

router.get('/records', getRecords);
router.post('/records', saveRecord);

module.exports = router;
