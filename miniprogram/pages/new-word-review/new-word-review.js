Page({
    data: {
      wrongWordsList: [],
      currentIndex: 0,
      totalWords: 0,
      currentWord: null,
      showAnswer: false,
      hasMadeChoice: false,
      currentMarkedAsKnow: false,
      knowCount: 0,
      dontKnowCount: 0,
      isWrongWordMode: false,
      themeColors: [
        { accent: '#43A047', light: '#E8F5E9' },
        { accent: '#00897B', light: '#E0F2F1' },
        { accent: '#F57C00', light: '#FFF3E0' },
        { accent: '#7B1FA2', light: '#F3E5F5' },
        { accent: '#1976D2', light: '#E3F2FD' }
      ],
      themeIdx: 0
    },

    onLoad(options) {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      const { bookId, words, isWrongWordMode } = options;
      this.setData({ isWrongWordMode: isWrongWordMode === 'true' });

      if (this.data.isWrongWordMode) {
        this.loadWrongWordsFromLocal();
      } else if (words && words !== '[]') {
        try {
          const realWords = JSON.parse(decodeURIComponent(words));
          this.setData({
            wrongWordsList: realWords,
            totalWords: realWords.length,
            currentWord: realWords[0] || null
          });
        } catch (e) {
          this.setData({ wrongWordsList: [], totalWords: 0, currentWord: null });
        }
      }
    },

    // 加载本地错词缓存
    loadWrongWordsFromLocal() {
      try {
        let wrongWords = wx.getStorageSync('wrong_words') || [];
        if (!Array.isArray(wrongWords)) {
          wrongWords = [];
          wx.setStorageSync('wrong_words', []);
        }

        if (wrongWords.length === 0) {
          this.setData({ wrongWordsList: [], totalWords: 0, currentWord: null });
          return;
        }

        const formattedList = wrongWords.map(item => ({
          en: item.en || '',
          phonetic: item.phonetic || '',
          meaning: item.meaning || '',
          part: item.part || ''
        }));

        this.setData({
          wrongWordsList: formattedList,
          totalWords: formattedList.length,
          currentIndex: 0,
          currentWord: formattedList[0] || null,
          knowCount: 0,
          dontKnowCount: formattedList.length
        }, () => {
          if (formattedList.length > 0) {
            this.playCurrentAudio();
          }
        });
      } catch (err) {
        console.error('加载错词失败：', err);
        this.setData({ wrongWordsList: [], totalWords: 0, currentWord: null });
      }
    },

    // 标记为认识 — 显示答案，2秒后消去该词
    markKnow() {
      if (!this.data.currentWord || this.data.hasMadeChoice || this._tapLock) return;
      this._tapLock = true;

      this.setData({
        hasMadeChoice: true,
        currentMarkedAsKnow: true,
        showAnswer: true,
        knowCount: this.data.knowCount + 1,
        dontKnowCount: Math.max(0, this.data.dontKnowCount - 1)
      }, () => {
        this.playCurrentAudio();
        if (this.data.isWrongWordMode) {
          this.setData({
            answerTimer: setTimeout(() => {
              this.removeWrongWord();
            }, 2000)
          });
        }
      });
    },

    // 标记为不认识 — 保留该词，2秒后移到下一个
    markDontKnow() {
      if (!this.data.currentWord || this.data.hasMadeChoice || this._tapLock) return;
      this._tapLock = true;

      this.setData({
        showAnswer: true,
        hasMadeChoice: true,
        currentMarkedAsKnow: false,
        dontKnowCount: this.data.dontKnowCount + 1
      }, () => {
        this.playCurrentAudio();
        this.setData({
          answerTimer: setTimeout(() => {
            this.nextWord();
          }, 2000)
        });
      });
    },

    // 更正为不认识：撤回认识，错词模式加回列表
    correctToDontKnow() {
      if (!this.data.currentWord) return;
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }
      // 错词模式：把刚移除的词加回去
      if (this.data.isWrongWordMode) {
        const word = this.data.currentWord;
        const newList = [word, ...this.data.wrongWordsList];
        wx.setStorageSync('wrong_words', newList);
        this.setData({
          wrongWordsList: newList,
          totalWords: newList.length,
          currentMarkedAsKnow: false,
          knowCount: Math.max(0, this.data.knowCount - 1)
        });
      } else {
        this.setData({
          currentMarkedAsKnow: false,
          knowCount: Math.max(0, this.data.knowCount - 1)
        });
      }
    },

    // 移除已掌握的错词
    removeWrongWord() {
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }

      const { wrongWordsList, currentIndex, currentWord } = this.data;
      if (!currentWord || wrongWordsList.length === 0) return;

      const newWrongList = wrongWordsList.filter((_, idx) => idx !== currentIndex);
      wx.setStorageSync('wrong_words', newWrongList);

      if (newWrongList.length === 0) {
        this.setData({
          wrongWordsList: [],
          totalWords: 0,
          currentWord: null,
          hasMadeChoice: false,
          showAnswer: false,
          currentMarkedAsKnow: false,
          dontKnowCount: 0
        });
        this._tapLock = false;
        wx.showToast({ title: '所有错词已掌握！', icon: 'success', duration: 2000 });
        setTimeout(() => wx.navigateBack(), 2000);
        return;
      }

      const newIndex = currentIndex >= newWrongList.length ? newWrongList.length - 1 : currentIndex;

      this.setData({
        wrongWordsList: newWrongList,
        totalWords: newWrongList.length,
        currentIndex: newIndex,
        currentWord: newWrongList[newIndex] || null,
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false,
        dontKnowCount: Math.max(0, this.data.dontKnowCount - 1)
      });
      this._tapLock = false;
    },

    // 下一个单词
    nextWord() {
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }

      const nextIndex = this.data.currentIndex + 1;
      const isLastWord = nextIndex >= this.data.totalWords;

      if (isLastWord) {
        if (this.data.isWrongWordMode && this.data.totalWords > 0) {
          wx.showToast({ title: '已过一轮，继续加油！', icon: 'none', duration: 1500 });
          this.setData({
            currentIndex: 0,
            currentWord: this.data.wrongWordsList[0] || null,
            hasMadeChoice: false,
            showAnswer: false,
            currentMarkedAsKnow: false
          });
          this._tapLock = false;
          return;
        }
        wx.showToast({ title: '已完成', icon: 'none' });
        return;
      }

      const newWord = this.data.wrongWordsList[nextIndex];
      this._tapLock = false;
      this.setData({
        currentIndex: nextIndex,
        currentWord: newWord || null,
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false
      });
    },

    // 上一个单词
    prevWord() {
      const prevIndex = this.data.currentIndex - 1;
      if (prevIndex < 0) return;
      this.setData({
        currentIndex: prevIndex,
        currentWord: this.data.wrongWordsList[prevIndex] || null,
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false
      });
    },

    // 打乱顺序，从第一个开始复习
    shuffleWords() {
      if (this.data.totalWords === 0) return;
      const list = [...this.data.wrongWordsList];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }
      this._tapLock = false;
      this.setData({
        wrongWordsList: list,
        currentIndex: 0,
        currentWord: list[0] || null,
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false
      });
      wx.showToast({ title: '已打乱复习顺序', icon: 'success', duration: 1200 });
    },

    // 播放当前单词发音
    playCurrentAudio() {
      if (this.data.currentWord && this.data.currentWord.en) {
        this.playWordAudio(this.data.currentWord.en);
      }
    },

    // 播放单词发音
    playWordAudio(word) {
      if (!word) return;
      if (this.innerAudioContext) {
        try { this.innerAudioContext.stop(); } catch (e) {}
        try { this.innerAudioContext.destroy(); } catch (e) {}
      }
      try {
        const innerAudioContext = wx.createInnerAudioContext();
        this.innerAudioContext = innerAudioContext;
        innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
        innerAudioContext.play();
        innerAudioContext.onError((err) => {
          console.error('发音失败:', err);
        });
      } catch (err) {
        console.error('发音加载失败:', err);
      }
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    onUnload() {
      if (this.innerAudioContext) {
        try { this.innerAudioContext.stop(); } catch (e) {}
        try { this.innerAudioContext.destroy(); } catch (e) {}
      }
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
      }
    },

    goBack() {
      wx.navigateBack();
    }
  });