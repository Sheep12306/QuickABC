const { Router } = require('express');
const ctrl = require('../controllers/userController');

const router = Router();

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.saveProfile);
router.get('/study-data', ctrl.getStudyData);
router.put('/study-data', ctrl.saveStudyData);

module.exports = router;
