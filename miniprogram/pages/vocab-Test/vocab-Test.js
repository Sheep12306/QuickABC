const api = require('../../utils/api');

const CHECKPOINT_AT = 30;

function getLevel(vocab) {
  if (vocab < 500)  return { name: '词汇新手', badge: '🌱' };
  if (vocab < 1500) return { name: '词汇初学者', badge: '📖' };
  if (vocab < 3000) return { name: '词汇小能手', badge: '⭐' };
  if (vocab < 5000) return { name: '词汇高手', badge: '🔥' };
  if (vocab < 8000) return { name: '词汇大师', badge: '💎' };
  return { name: '词汇专家', badge: '👑' };
}

Page({
  data: {
    themeIdx: 0,
    themeColors: [
      { accent: '#43A047', light: '#E8F5E9' },
      { accent: '#00897B', light: '#E0F2F1' },
      { accent: '#F57C00', light: '#FFF3E0' },
      { accent: '#7B1FA2', light: '#F3E5F5' },
      { accent: '#1976D2', light: '#E3F2FD' }
    ],
    cardThemes: [
      { bg: 'linear-gradient(175deg, #C8E6C9 0%, #E8F5E9 30%, #F1F8F4 100%)' },
      { bg: 'linear-gradient(175deg, #B2DFDB 0%, #E0F2F1 30%, #F1F8F7 100%)' },
      { bg: 'linear-gradient(175deg, #FFE0B2 0%, #FFF3E0 30%, #FFF8F5 100%)' },
      { bg: 'linear-gradient(175deg, #E1BEE7 0%, #F3E5F5 30%, #F8F4FA 100%)' },
      { bg: 'linear-gradient(175deg, #BBDEFB 0%, #E3F2FD 30%, #F5F8FC 100%)' }
    ],

    phase: 'loading',
    words: [],
    currentIndex: 0,
    currentWord: null,
    answers: {},
    showMeaning: false,
    lastAnswer: '',
    answeredCount: 0,

    // 结果
    estimatedVocab: 0,
    bookResults: [],
    recommendations: [],
    totalCount: 0,
    levelName: '',
    levelBadge: '',
  },

  onLoad() {
    this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    this.startTest();
  },

  onShow() {
    this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
  },

  async startTest() {
    wx.showLoading({ title: '生成题目...' });
    try {
      const res = await api.startVocabTest();
      if (res.code === 200 && res.data) {
        const words = res.data.words || [];
        if (words.length === 0) {
          wx.showToast({ title: '暂无词书数据', icon: 'none' });
          return;
        }
        this.setData({
          words,
          phase: 'testing',
          currentIndex: 0,
          currentWord: words[0],
          answers: {},
          showMeaning: false,
          answeredCount: 0,
        });
      } else {
        wx.showToast({ title: res.msg || '生成失败', icon: 'none' });
      }
    } catch (err) {
      console.error('start test failed', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  selectAnswer(e) {
    if (this.data.showMeaning) return; // 已经答过了
    const { answer } = e.currentTarget.dataset;
    const word = this.data.currentWord;
    if (!word) return;

    this.data.answers[word.id] = answer;
    const cnt = Object.keys(this.data.answers).length;

    this.setData({
      answers: this.data.answers,
      answeredCount: cnt,
      showMeaning: true,
      lastAnswer: answer,
    });

    // 答完后1.5秒自动跳到下一题
    const idx = this.data.currentIndex;
    setTimeout(() => {
      if (this.data.phase !== 'testing') return;

      // 到达 checkpoint
      if (cnt >= CHECKPOINT_AT && !this.data._checkpointShown) {
        this.setData({ phase: 'checkpoint', _checkpointShown: true });
        return;
      }

      // 到达最后一题
      if (idx >= this.data.words.length - 1) {
        this.submitTest();
        return;
      }

      // 下一题
      const nextIdx = idx + 1;
      this.setData({
        currentIndex: nextIdx,
        currentWord: this.data.words[nextIdx],
        showMeaning: false,
        lastAnswer: '',
      });
    }, 1500);
  },

  continueTest() {
    const idx = this.data.currentIndex;
    if (idx >= this.data.words.length - 1) {
      this.submitTest();
      return;
    }
    const nextIdx = idx + 1;
    this.setData({
      phase: 'testing',
      currentIndex: nextIdx,
      currentWord: this.data.words[nextIdx],
      showMeaning: false,
      lastAnswer: '',
    });
  },

  async stopAndSubmit() {
    await this.submitTest();
  },

  async submitTest() {
    const cnt = Object.keys(this.data.answers).length;
    if (cnt === 0) {
      wx.showToast({ title: '请先作答', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '统计中...' });
    try {
      const answers = Object.entries(this.data.answers).map(([wordId, answer]) => ({
        wordId: parseInt(wordId), answer,
      }));

      const res = await api.submitVocabTest(answers);
      if (res.code === 200 && res.data) {
        const d = res.data;
        const level = getLevel(d.estimatedVocab || 0);
        this.setData({
          phase: 'result',
          estimatedVocab: d.estimatedVocab || 0,
          bookResults: d.bookResults || [],
          recommendations: d.recommendations || [],
          totalCount: d.totalCount || 0,
          levelName: level.name,
          levelBadge: level.badge,
        });
        wx.setStorageSync('lastVocabScore', d.estimatedVocab);
        let history = wx.getStorageSync('vocabHistory') || [];
        history.unshift({ testTime: d.testTime, score: d.estimatedVocab });
        wx.setStorageSync('vocabHistory', history);
      } else {
        wx.showToast({ title: res.msg || '提交失败', icon: 'none' });
      }
    } catch (err) {
      console.error('submit failed', err);
      wx.showToast({ title: '提交失败，请检查网络', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() { wx.navigateBack(); },

  retryTest() {
    this.setData({ phase: 'loading', words: [], currentIndex: 0, answers: {}, _checkpointShown: false });
    this.startTest();
  },
});
