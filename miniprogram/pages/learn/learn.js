const api = require('../../utils/api');

Page({
    data: {
      currentWords: [],
      currentGroup: 1,
      canNext: false,
      reviewStatus: false,
      reviewButtonVisible: false,
      isLoading: false,
      bookId: '',
      groupSize: 5,
      themeColors: [
        { accent: '#43A047', light: '#E8F5E9', progressBg: 'rgba(67,160,71,0.12)' },
        { accent: '#00897B', light: '#E0F2F1', progressBg: 'rgba(0,137,123,0.10)' },
        { accent: '#F57C00', light: '#FFF3E0', progressBg: 'rgba(245,124,0,0.10)' },
        { accent: '#7B1FA2', light: '#F3E5F5', progressBg: 'rgba(123,31,162,0.10)' },
        { accent: '#1976D2', light: '#E3F2FD', progressBg: 'rgba(25,118,210,0.10)' }
      ],
      themeIdx: 0,
      lastWordIndex: 0,
      learnedWords: []
    },

    innerAudioContext: null,

    restoreFromCloud: async function () {
      const { bookId } = this.data;
      try {
        const res = await api.getLearnRecord(bookId);
        if (res.code === 200 && res.data) {
          const learnRecord = res.data.learnRecord;
          wx.setStorageSync(`learnRecord_${bookId}`, learnRecord);
          this.setData({
            currentGroup: learnRecord.lastGroup,
            lastWordIndex: learnRecord.lastWordIndex,
            learnedWords: learnRecord.learnedWords
          }, () => this.loadWords(learnRecord.lastGroup));
        }
      } catch (err) {
        console.error('恢复记录失败:', err);
      }
    },

    restoreLearnRecord: function () {
      const { bookId } = this.data;
      const learnRecord = wx.getStorageSync(`learnRecord_${bookId}`) || {
        lastGroup: 1,
        lastWordIndex: 0,
        learnedWords: []
      };

      this.setData({
        currentGroup: learnRecord.lastGroup,
        lastWordIndex: learnRecord.lastWordIndex,
        learnedWords: learnRecord.learnedWords
      }, () => {
        this.loadWords(learnRecord.lastGroup);
        wx.showToast({
          title: `恢复到第${learnRecord.lastGroup}组`,
          icon: 'none',
          duration: 1500
        });
      });
    },

    onLoad: function (options) {
      console.log('learn bookId:', options.bookId);
      const bookId = options.bookId || '';
      if (!bookId) {
        wx.showToast({ title: '未选择单词书', icon: 'none' });
        wx.navigateBack();
        return;
      }

      this.setData({ bookId: bookId.toString() });
      const themeIdx = getApp().globalData.cardThemeIndex || 0;
      this.setData({ themeIdx: themeIdx });
      this.restoreLearnRecord();

      this.innerAudioContext = wx.createInnerAudioContext();
      this.innerAudioContext.onPlay(() => console.log('audio play'));
      this.innerAudioContext.onStop(() => console.log('audio stop'));
      this.innerAudioContext.onEnded(() => console.log('audio ended'));
    },

    onShow: function() {
      const themeIdx = getApp().globalData.cardThemeIndex || 0;
      if (themeIdx !== this.data.themeIdx) {
        this.setData({ themeIdx: themeIdx });
      }
    },

    playWordAudio: function (word) {
      console.log('play:', word);
      if (!word) {
        wx.showToast({ title: '单词为空', icon: 'none' });
        return;
      }

      if (this.innerAudioContext) {
        this.innerAudioContext.stop();
      } else {
        this.innerAudioContext = wx.createInnerAudioContext();
      }

      const encodeWord = encodeURIComponent(word.trim());
      const voiceUrl = `https://dict.youdao.com/dictvoice?audio=${encodeWord}&type=1`;

      console.log('voice url:', voiceUrl);
      this.innerAudioContext.src = voiceUrl;
      this.innerAudioContext.play();

      this.innerAudioContext.onError((err) => {
        console.error('audio error:', err);
        wx.showToast({ title: `发音失败: ${err.errMsg}`, icon: 'none', duration: 2000 });
        wx.speechSynthesis({
          lang: 'en_US',
          content: word,
          success: () => console.log('tts ok'),
          fail: (err) => console.error('tts fail:', err)
        });
      });
    },

    playCurrentAudio: function (e) {
      console.log('pronounce event:', e);
      const index = e.currentTarget?.dataset?.index || e.target?.dataset?.index;
      console.log('word index:', index);

      if (index === undefined || index === null) {
        wx.showToast({ title: '未获取到单词索引', icon: 'none' });
        return;
      }
      if (!this.data.currentWords || this.data.currentWords.length === 0) {
        wx.showToast({ title: '单词列表为空', icon: 'none' });
        return;
      }

      const currentWord = this.data.currentWords[index];
      console.log('current word:', currentWord);
      if (currentWord && currentWord.en) {
        this.playWordAudio(currentWord.en);
      } else {
        wx.showToast({ title: '单词英文为空', icon: 'none' });
      }
    },

    loadWords: function (group) {
      const that = this;
      this.setData({ isLoading: true });

      this.loadWordsFromDB(group).then((realWords) => {
        if (realWords.length > 0) {
          const formatWords = realWords.map(word => ({
            ...word,
            clickCount: that.data.learnedWords.includes(word.id) ? 2 : word.clickCount || 0
          }));
          that.setData({
            currentWords: formatWords,
            currentGroup: group,
            canNext: false,
            isLoading: false
          });
        } else {
          wx.showToast({ title: '该分组暂无单词', icon: 'none' });
          that.useMockWords(group);
        }
        that.checkReviewStatus();
        that.checkReviewButton();
        that.checkCanNext();
      }).catch((err) => {
        console.error('load words failed:', err);
        wx.showToast({ title: '加载失败，使用本地单词', icon: 'none' });
        that.useMockWords(group);
        that.checkReviewStatus();
        that.checkReviewButton();
        that.checkCanNext();
      });
    },

    checkCanNext: function () {
      const { currentWords } = this.data;
      const allClicked = currentWords.every(word => word.clickCount >= 1);
      this.setData({ canNext: allClicked });
    },

    loadWordsFromDB: function (group) {
      return new Promise(async (resolve, reject) => {
        try {
          const { bookId, groupSize } = this.data;

          const res = await api.getWordsByBookId({
            bookId: bookId.toString(),
            groupNum: group,
            groupSize: groupSize
          });

          console.log('API response:', res);

          const resultData = res.data || [];
          if (resultData.length > 0) {
            const formatWords = resultData.map(word => ({
              id: word.id,
              en: word.word || word.en,
              phonetic: word.phonetic || '',
              part: word.part || word.pos || '',
              meaning: word.meaning || word.translation || '',
              clickCount: 0
            }));
            resolve(formatWords);
          } else {
            resolve([]);
          }
        } catch (err) {
          reject(err);
        }
      });
    },

    useMockWords: function (group) {
      const { learnedWords } = this.data;
      const mockWords = [
        { id: 1, en: 'favorite', phonetic: '/ˈfeɪvərɪt/', part: 'adj./n.', meaning: '最喜爱的', clickCount: 0 },
        { id: 2, en: 'foreigner', phonetic: '/ˈfɒrənə(r)/', part: 'n.', meaning: '外国人', clickCount: 0 },
        { id: 3, en: 'curly', phonetic: '/ˈkɜːli/', part: 'adj.', meaning: '卷曲的', clickCount: 0 },
        { id: 4, en: 'subject', phonetic: '/ˈsʌbdʒɪkt/', part: 'n.', meaning: '主题', clickCount: 0 },
        { id: 5, en: 'drawer', phonetic: '/drɔː(r)/', part: 'n.', meaning: '抽屉', clickCount: 0 }
      ];

      const formatMockWords = mockWords.map(word => ({
        ...word,
        clickCount: learnedWords.includes(word.id) ? 2 : 0
      }));

      this.setData({
        currentWords: formatMockWords,
        currentGroup: group,
        canNext: false,
        isLoading: false
      });
      this.checkCanNext();
    },

    saveLearnRecord: function () {
      const { bookId, currentGroup, lastWordIndex, currentWords } = this.data;
      const learnedWords = currentWords
        .filter(word => word.clickCount >= 2)
        .map(word => word.id);

      const learnRecord = {
        lastGroup: currentGroup,
        lastWordIndex: lastWordIndex || 0,
        learnedWords: learnedWords
      };

      wx.setStorageSync(`learnRecord_${bookId}`, learnRecord);

      api.saveLearnRecord(bookId, learnRecord).catch(err =>
        console.error('sync learn record failed:', err)
      );
    },

    saveCurrentGroupLearnedRecord: function () {
      const { bookId, currentGroup, currentWords } = this.data;
      const learnedWords = currentWords.filter(word => word.clickCount >= 1);
      if (learnedWords.length === 0) return;

      const storageKey = `learnedWords_${bookId}_${currentGroup}`;
      wx.setStorageSync(storageKey, learnedWords);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dateKey = `dailyLearnedWords_${bookId}_${todayStr}`;

      const oldDailyWords = wx.getStorageSync(dateKey) || [];
      const allDailyWords = oldDailyWords.concat(learnedWords);
      const uniqueDailyWords = Array.from(new Map(allDailyWords.map(item => [item.id, item]))).map(item => item[1]);

      wx.setStorageSync(dateKey, uniqueDailyWords);

      const wordIds = learnedWords.map(word => word.id);
      api.saveLearnedWords(bookId, currentGroup, wordIds).then(res => {
        console.log('saved:', res);
        wx.showToast({ title: '已保存学习记录', icon: 'success', duration: 1000 });
      }).catch(err => {
        console.error('save failed:', err);
        wx.showToast({ title: '保存记录失败', icon: 'none' });
      });
    },

    wordClick: function (e) {
      const index = e.currentTarget.dataset.index;
      const currentWords = this.data.currentWords;
      currentWords[index].clickCount = (currentWords[index].clickCount || 0) + 1;

      this.setData({
        currentWords,
        lastWordIndex: index
      });

      if (currentWords[index].clickCount >= 2) {
        this.saveCurrentGroupLearnedRecord();
      }
      this.saveLearnRecord();
      this.checkCanNext();
      this.checkReviewStatus();
      this.checkReviewButton();
    },

    nextGroup: function () {
      if (!this.data.canNext) {
        wx.showToast({ title: '请先点击完本组所有单词', icon: 'none' });
        return;
      }
      this.saveCurrentGroupLearnedRecord();
      this.saveLearnRecord();
      const nextGroup = this.data.currentGroup + 1;
      this.loadWords(nextGroup);
    },

    preGroup: function () {
      if (this.data.currentGroup > 1) {
        this.saveLearnRecord();
        const prevGroup = this.data.currentGroup - 1;
        this.loadWords(prevGroup);
      } else {
        wx.showToast({ title: '已经是第一组', icon: 'none' });
      }
    },

    handleReviewButton: function () {
      const learnedWords = this.data.currentWords.filter(word => word.clickCount >= 1);
      if (learnedWords.length === 0) {
        wx.showToast({ title: '暂无已学习的单词', icon: 'none' });
        return;
      }

      const todayIndex = this.data.currentGroup;
      const learnedGroupList = Array.from({ length: todayIndex }, (_, i) => i + 1);
      const wordsStr = encodeURIComponent(JSON.stringify(learnedWords));
      const { bookId } = this.data;

      wx.navigateTo({
        url: `/pages/review/review?bookId=${bookId}&todayIndex=${todayIndex}&learnedGroupList=${JSON.stringify(learnedGroupList)}&words=${wordsStr}`,
        fail: (err) => {
          console.error('nav to review failed:', err);
          wx.showToast({ title: '跳转失败，请重试', icon: 'none' });
        }
      });
    },

    checkReviewStatus: function () {
      this.setData({
        reviewStatus: this.data.currentWords.some(word => word.clickCount > 0)
      });
    },

    checkReviewButton: function () {
      this.setData({
        reviewButtonVisible: this.data.currentWords.some(word => word.clickCount > 0)
      });
    },

    onHide: function () {
      this.saveLearnRecord();
    },
    onUnload: function () {
      this.saveLearnRecord();
      if (this.innerAudioContext) {
        try {
          this.innerAudioContext.stop();
          this.innerAudioContext.destroy();
          this.innerAudioContext = null;
        } catch (err) {
          console.error('destroy audio failed:', err);
        }
      }
    },

    handleWordTap: function (e) {
      const index = e.currentTarget.dataset.index;
      const currentWords = this.data.currentWords;
      const currentWord = currentWords[index];

      if (currentWord && currentWord.en) {
        this.playWordAudio(currentWord.en);
      }

      let newClickCount = currentWord.clickCount + 1;
      if (newClickCount > 3) {
        newClickCount = 1;
      }

      currentWords[index].clickCount = newClickCount;
      this.setData({
        currentWords,
        lastWordIndex: index
      });

      if (newClickCount === 2) {
        this.saveCurrentGroupLearnedRecord();
      }
      this.saveLearnRecord();
      this.checkCanNext();
      this.checkReviewStatus();
      this.checkReviewButton();
    },

    testSaveLearned: async function () {
      const { bookId, currentGroup, currentWords } = this.data;
      const wordIds = currentWords.map(word => word.id);
      try {
        const res = await api.saveLearnedWords(bookId, currentGroup, wordIds);
        console.log('saved:', res);
      } catch (err) {
        console.error('save failed:', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  });