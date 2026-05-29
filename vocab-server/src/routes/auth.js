const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { login, getUserInfo } = require('../controllers/authController');

const router = Router();

router.post('/login', login);
router.get('/userinfo', authMiddleware, getUserInfo);

module.exports = router;
