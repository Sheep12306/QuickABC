const { Router } = require('express');
const ctrl = require('../controllers/commuteController');

const router = Router();

router.get('/today', ctrl.getToday);
router.post('/settings', ctrl.saveSettings);
router.post('/complete', ctrl.completeReview);
router.post('/tts', ctrl.synthesizeTts);

module.exports = router;
