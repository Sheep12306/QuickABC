const { Router } = require('express');
const authMiddleware = require('../middleware/auth');

const authRoutes = require('./auth');
const wordBookRoutes = require('./wordBooks');
const wordRoutes = require('./words');
const studyRoutes = require('./study');
const userRoutes = require('./user');
const vocabTestRoutes = require('./vocabTest');
const wrongWordRoutes = require('./wrongWords');
const questionRoutes = require('./questions');
const commuteRoutes = require('./commute');

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/wordbooks', authMiddleware, wordBookRoutes);
router.use('/words', authMiddleware, wordRoutes);
router.use('/study', authMiddleware, studyRoutes);
router.use('/user', authMiddleware, userRoutes);
router.use('/vocab-test', authMiddleware, vocabTestRoutes);
router.use('/wrong-words', authMiddleware, wrongWordRoutes);
router.use('/questions', authMiddleware, questionRoutes);
router.use('/commute', authMiddleware, commuteRoutes);

module.exports = router;
