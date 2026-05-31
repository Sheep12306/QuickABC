const api = require('../../utils/api');

Page({
    data: {
      userInfo: { nickname: '英语学习者' },
      userLevel: 12,
      streakDays: 7,

      todayLearned: 0,
      dailyGoal: 30,
      totalLearned: 0,
      accuracy: 0,

      currentBook: {},
      wordBooks: [],
      newWordsCount: 0,
      reviewCount: 0,

      // 单词预览
      previewWords: [],       // 全量预览词
      visibleWords: [],       // 当前可见的 3 个词
      previewStart: 0,        // 当前展示起始索引
      previewPageSize: 3,     // 每页显示 3 个

      cardThemeIndex: 0,
      cardThemes: [
        { name: 'forest', bg: 'linear-gradient(175deg, #C8E6C9 0%, #E8F5E9 30%, #F1F8F4 100%)', cardBg: 'rgba(255,255,255,0.62)', accent: '#43A047', tagBg: 'rgba(67,160,71,0.10)' },
        { name: 'ocean', bg: 'linear-gradient(175deg, #B2DFDB 0%, #E0F2F1 30%, #F1F8F7 100%)', cardBg: 'rgba(255,255,255,0.62)', accent: '#00897B', tagBg: 'rgba(0,137,123,0.10)' },
        { name: 'sunset', bg: 'linear-gradient(175deg, #FFE0B2 0%, #FFF3E0 30%, #FFF8F5 100%)', cardBg: 'rgba(255,255,255,0.62)', accent: '#F57C00', tagBg: 'rgba(245,124,0,0.10)' },
        { name: 'lavender', bg: 'linear-gradient(175deg, #E1BEE7 0%, #F3E5F5 30%, #F8F4FA 100%)', cardBg: 'rgba(255,255,255,0.62)', accent: '#7B1FA2', tagBg: 'rgba(123,31,162,0.10)' },
        { name: 'sky', bg: 'linear-gradient(175deg, #BBDEFB 0%, #E3F2FD 30%, #F5F8FC 100%)', cardBg: 'rgba(255,255,255,0.62)', accent: '#1976D2', tagBg: 'rgba(25,118,210,0.10)' }
      ]
    },

    onLoad: function() {
      const themeIdx = getApp().globalData.cardThemeIndex || 0;
      this.setData({ cardThemeIndex: themeIdx });
      this.loadWordBooksFromDB();
      this.initCurrentBookFromStorage();
    },

    onShow: function() {
      const themeIdx = getApp().globalData.cardThemeIndex || 0;
      if (themeIdx !== this.data.cardThemeIndex) {
        this.setData({ cardThemeIndex: themeIdx });
      }
      this.updateLearningData();
    },

    async loadWordBooksFromDB() {
      try {
        const res = await api.getAllWordBooks();
        if (res.code === 200 && res.data.length > 0) {
          this.setData({ wordBooks: res.data });
          if (!wx.getStorageSync('currentBook')) {
            const defaultBook = res.data[0];
            this.setData({ currentBook: defaultBook });
            wx.setStorageSync('currentBook', defaultBook);
            this.loadBookLearningData(defaultBook.id);
            this.loadPreviewWords(defaultBook.id);
          }
        } else {
          wx.showToast({ title: '暂无单词书数据', icon: 'none' });
        }
      } catch (err) {
        console.error('加载单词书失败:', err);
        wx.showToast({ title: '加载单词书失败', icon: 'none' });
      }
    },

    initCurrentBookFromStorage() {
      try {
        const savedBook = wx.getStorageSync('currentBook');
        if (savedBook && savedBook.id) {
          this.setData({ currentBook: savedBook });
          this.loadBookLearningData(savedBook.id);
          this.loadPreviewWords(savedBook.id);
        }
      } catch (e) {
        console.error('读取存储失败:', e);
      }
    },

    async loadBookLearningData(bookId) {
      try {
        const res = await api.getBookLearningData(bookId);
        if (res.code === 200) {
          const data = res.data;
          const totalWords = this.data.currentBook.totalWords || 1;
          const actualProgress = Math.round((data.totalLearned || 0) / totalWords * 100);
          const progress = Math.floor(actualProgress / 10) * 10;

          this.setData({
            todayLearned: data.todayLearned || 0,
            totalLearned: data.totalLearned || 0,
            accuracy: data.accuracy || 0,
            newWordsCount: data.newWordsCount || 0,
            reviewCount: data.reviewCount || 0,
            'currentBook.progress': progress,
            'currentBook.totalWords': totalWords,
          });
        }
      } catch (err) {
        console.error('加载学习数据失败:', err);
      }
    },

    // 加载预览单词（取第一组 15 个词供滚动展示）
    async loadPreviewWords(bookId) {
      try {
        const res = await api.getWordsByBookId({ bookId, groupNum: 1, groupSize: 15 });
        if (res.code === 200 && res.data.length > 0) {
          const words = res.data.map(w => ({
            word: w.word,
            phonetic: w.phonetic || '',
            part: w.part || '',
            meaning: w.meaning && w.meaning.length > 20 ? w.meaning.slice(0, 20) + '...' : (w.meaning || ''),
          }));
          this.setData({ previewWords: words, previewStart: 0 });
          this.updateVisibleWords();
        }
      } catch (err) {
        console.error('加载预览单词失败:', err);
      }
    },

    // 计算当前可见的 3 个词
    updateVisibleWords() {
      const { previewWords, previewStart, previewPageSize } = this.data;
      const visible = [];
      for (let i = previewStart; i < previewStart + previewPageSize && i < previewWords.length; i++) {
        visible.push({ ...previewWords[i], _index: i });
      }
      this.setData({ visibleWords: visible });
    },

    updateLearningData: function() {
      if (this.data.currentBook.id) {
        this.loadBookLearningData(this.data.currentBook.id);
      }
    },

    changeBook: function() {
      const that = this;
      if (this.data.wordBooks.length === 0) {
        wx.showToast({ title: '暂无单词书可切换', icon: 'none' });
        return;
      }

      wx.showActionSheet({
        itemList: this.data.wordBooks.map(book => `${book.name} (${book.totalWords || 0}词, ${book.progress || 0}%)`),
        success: function(res) {
          const selectedBook = that.data.wordBooks[res.tapIndex];
          that.setData({ currentBook: selectedBook });
          wx.setStorageSync('currentBook', selectedBook);
          that.loadBookLearningData(selectedBook.id);
          that.loadPreviewWords(selectedBook.id);
          wx.showToast({ title: `已切换到 ${selectedBook.name}`, icon: 'success' });
        },
        fail: function(err) {
          console.log('用户取消切换:', err);
        }
      });
    },

    // 上一个单词
    prevWord: function() {
      if (this.data.previewStart > 0) {
        const ns = this.data.previewStart - 1;
        this.setData({ previewStart: ns });
        this.updateVisibleWords();
      }
    },

    // 下一个单词
    nextWord: function() {
      const { previewStart, previewPageSize, previewWords } = this.data;
      if (previewStart + previewPageSize < previewWords.length) {
        const ns = previewStart + 1;
        this.setData({ previewStart: ns });
        this.updateVisibleWords();
      }
    },

    startStudy: function() {
      let currentBook = this.data.currentBook || {};
      if (!currentBook.id) {
        const cachedBook = wx.getStorageSync('currentBook') || {};
        currentBook = cachedBook;
      }
      if (!currentBook.id) {
        currentBook = { id: 11, name: '四级英语词汇' };
        this.setData({ currentBook });
        wx.setStorageSync('currentBook', currentBook);
      }
      if (!currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }

      // 当前高亮单词的索引 → 计算所属分组
      const activeIndex = this.data.previewStart + 1;
      const groupSize = 5;
      const startGroup = Math.floor(activeIndex / groupSize) + 1;

      wx.navigateTo({
        url: `/pages/learn/learn?bookId=${currentBook.id}&startGroup=${startGroup}&mode=normal`
      });
    },

    startNewWords: function() {
      if (!this.data.currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/new-word-review/new-word-review?bookId=${this.data.currentBook.id}`
      });
    },

    startReview: function() {
      if (!this.data.currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/review-mode/review-mode?bookId=${this.data.currentBook.id}`
      });
    },

    startTest: function() {
      if (!this.data.currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/test-list/test-list?bookId=${this.data.currentBook.id}`
      });
    },

    goToVocabBook: function() {
      wx.navigateTo({ url: '/pages/wordBookList/wordBookList' });
    },
  });