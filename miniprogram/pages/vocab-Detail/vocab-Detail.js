const api = require('../../utils/api');

Page({
    data: {
      lastVocabScore: 0,
      vocabHistory: [],
      themeColors: [
        { accent: '#43A047', light: '#E8F5E9' },
        { accent: '#00897B', light: '#E0F2F1' },
        { accent: '#F57C00', light: '#FFF3E0' },
        { accent: '#7B1FA2', light: '#F3E5F5' },
        { accent: '#1976D2', light: '#E3F2FD' }
      ],
      themeIdx: 0,
      cardThemes: [
        { bg: 'linear-gradient(175deg, #C8E6C9 0%, #E8F5E9 30%, #F1F8F4 100%)' },
        { bg: 'linear-gradient(175deg, #B2DFDB 0%, #E0F2F1 30%, #F1F8F7 100%)' },
        { bg: 'linear-gradient(175deg, #FFE0B2 0%, #FFF3E0 30%, #FFF8F5 100%)' },
        { bg: 'linear-gradient(175deg, #E1BEE7 0%, #F3E5F5 30%, #F8F4FA 100%)' },
        { bg: 'linear-gradient(175deg, #BBDEFB 0%, #E3F2FD 30%, #F5F8FC 100%)' }
      ]
    },

    onLoad() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      this.getVocabTestRecords();
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    async getVocabTestRecords() {
      wx.showLoading({ title: '加载中...' });
      try {
        const res = await api.getVocabTestRecords();
        if (res.code === 200) {
          const records = res.data || [];
          const vocabHistory = records.map(record => ({
            id: record.id,
            testTime: record.testTime,
            score: record.score,
            estimatedVocab: record.estimatedVocab || record.score,
            bookResults: record.bookResults ? JSON.parse(record.bookResults) : null,
          }));
          const lastVocabScore = vocabHistory.length > 0 ? vocabHistory[0].estimatedVocab : 0;
          this.setData({ lastVocabScore, vocabHistory });
          wx.setStorageSync('lastVocabScore', lastVocabScore);
          wx.setStorageSync('vocabHistory', vocabHistory);
        } else {
          wx.showToast({ title: res.msg || '获取记录失败', icon: 'none' });
        }
      } catch (err) {
        console.error('获取词汇量测试记录失败', err);
        wx.showToast({ title: '获取记录失败', icon: 'none' });
        const lastVocabScore = wx.getStorageSync('lastVocabScore') || 0;
        const vocabHistory = wx.getStorageSync('vocabHistory') || [];
        this.setData({ lastVocabScore, vocabHistory });
      } finally {
        wx.hideLoading();
      }
    },

    showRecordDetail(e) {
      const record = e.currentTarget.dataset.record;
      if (!record || !record.bookResults) return;
      // 有详细数据才展示
    },

    goBack() {
      wx.navigateBack();
    },

    goToVocabTest() {
      wx.navigateTo({ url: '/pages/vocab-Test/vocab-Test' });
    }
  });
