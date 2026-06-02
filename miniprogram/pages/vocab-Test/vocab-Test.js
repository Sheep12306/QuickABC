const api = require('../../utils/api');

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

    // 状态: loading | testing | result
    phase: 'loading',
    words: [],
    currentIndex: 0,
    answers: {},

    // 结果
    estimatedVocab: 0,
    bookResults: [],
    recommendations: [],
    totalCount: 0,
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
        this.setData({ words, phase: 'testing', currentIndex: 0 });
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

  get currentWord() {
    return this.data.words[this.data.currentIndex] || null;
  },

  get answeredCount() {
    return Object.keys(this.data.answers).length;
  },

  get allAnswered() {
    return this.data.words.length > 0 && this.answeredCount >= this.data.words.length;
  },

  selectAnswer(e) {
    const { answer } = e.currentTarget.dataset;
    const { currentIndex } = this.data;
    const word = this.currentWord;
    if (!word) return;

    this.data.answers[word.id] = answer;
    this.setData({ answers: this.data.answers });

    // 自动跳到下一题
    if (currentIndex < this.data.words.length - 1) {
      setTimeout(() => {
        this.setData({ currentIndex: currentIndex + 1 });
      }, 200);
    }
  },

  prevWord() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 });
    }
  },

  nextWord() {
    if (this.data.currentIndex < this.data.words.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 });
    }
  },

  jumpTo(e) {
    const index = e.currentTarget.dataset.index;
    if (index >= 0 && index < this.data.words.length) {
      this.setData({ currentIndex: index });
    }
  },

  async submitTest() {
    if (!this.allAnswered) {
      wx.showToast({ title: '请答完所有题目', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '统计中...' });
    try {
      const answers = Object.entries(this.data.answers).map(([wordId, answer]) => ({
        wordId: parseInt(wordId),
        answer,
      }));

      const res = await api.submitVocabTest(answers);
      if (res.code === 200 && res.data) {
        const d = res.data;
        this.setData({
          phase: 'result',
          estimatedVocab: d.estimatedVocab || 0,
          bookResults: d.bookResults || [],
          recommendations: d.recommendations || [],
          totalCount: d.totalCount || 0,
        });
        // 同步本地
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

  answerLabel(answer) {
    if (answer === 'know') return '认识';
    if (answer === 'fuzzy') return '模糊';
    if (answer === 'dontKnow') return '不认识';
    return '';
  },

  goBack() {
    wx.navigateBack();
  },

  retryTest() {
    this.setData({ phase: 'loading', words: [], currentIndex: 0, answers: {} });
    this.startTest();
  },
});
