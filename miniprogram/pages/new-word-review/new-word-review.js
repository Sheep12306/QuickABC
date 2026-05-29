Page({
    data: {
      // 核心数据
      reviewList: [],        // 原复习列表
      wrongWordsList: [],    // 新增：错词列表
      currentIndex: 0,
      totalWords: 0,
      currentWord: null,
      showAnswer: false,
      hasMadeChoice: false,
      currentMarkedAsKnow: false,
      knowCount: 0,
      dontKnowCount: 0,
      checkCount: 0,
      index: 0, // 抗遗忘列表的索引，用于更新打卡次数
      showCheckInTip: false,
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
      const { bookId, date, words, index, isWrongWordMode } = options;
      this.setData({
        index: parseInt(index),
        checkCount: parseInt(options.checkCount) || 0,
        isWrongWordMode: isWrongWordMode === 'true' // 接收跳转参数，判断是否刷错词
      });
  
      // 核心修复：根据模式加载不同数据源
      if (this.data.isWrongWordMode) {
        // 刷错词模式：加载本地缓存的错词
        this.loadWrongWordsFromLocal();
      } else {
        // 正常复习模式：加载传入的单词列表
        if (words && words !== '[]') {
          try {
            const realWords = JSON.parse(decodeURIComponent(words));
            const isOnlyOneWord = realWords.length === 1;
            this.setData({
              reviewList: realWords,
              totalWords: realWords.length,
              currentWord: realWords[0] || null,
              showCheckInTip: isOnlyOneWord
            });
          } catch (e) {
            this.setData({ reviewList: [], totalWords: 0, currentWord: null });
          }
        } else {
          this.setData({ reviewList: [], totalWords: 0, currentWord: null });
        }
      }
    },
  
    // 新增：加载本地错词缓存（核心修复）
    loadWrongWordsFromLocal() {
      try {
        // 1. 强制读取缓存，兼容空数据
        let wrongWords = wx.getStorageSync('wrong_words') || [];
        console.log('📥 加载本地错词缓存：', wrongWords);
        
        // 2. 强制转为数组，避免格式错误
        if (!Array.isArray(wrongWords)) {
          wrongWords = [];
          wx.setStorageSync('wrong_words', []); // 重置缓存为数组
        }
  
        // 3. 空数据处理
        if (wrongWords.length === 0) {
          this.setData({
            wrongWordsList: [],
            totalWords: 0,
            currentWord: null
          });
          wx.showToast({ title: '暂无错词', icon: 'none' });
          return;
        }
  
        // 4. 格式化数据，和保存格式对齐
        const formattedList = wrongWords.map(item => ({
          en: item.en || '未知单词',
          phonetic: item.phonetic || '',
          meaning: item.meaning || '',
          part: item.part || ''
        }));
  
        // 5. 更新页面数据（复用totalWords/currentIndex等字段）
        this.setData({
          wrongWordsList: formattedList,
          totalWords: formattedList.length,
          currentIndex: 0,
          currentWord: formattedList[0] || null
        }, () => {
          console.log('错词加载完成，共', formattedList.length, '个');
          if (formattedList.length > 0) {
            this.playCurrentAudio(); // 播放第一个单词发音
          }
        });
  
      } catch (err) {
        console.error('加载错词失败：', err);
        this.setData({
          wrongWordsList: [],
          totalWords: 0,
          currentWord: null
        });
        wx.showToast({ title: '加载错词失败', icon: 'none' });
      }
    },
  
    // 播放当前单词发音
    playCurrentAudio() {
      if (this.data.currentWord && this.data.currentWord.en) {
        this.playWordAudio(this.data.currentWord.en);
      }
    },
  
    // 播放单词发音（优化版）
    playWordAudio(word) {
      if (!word) return;
  
      if (this.innerAudioContext) {
        try {
          this.innerAudioContext.stop();
          this.innerAudioContext.destroy();
        } catch (e) {}
      }
      
      try {
        const innerAudioContext = wx.createInnerAudioContext();
        this.innerAudioContext = innerAudioContext;
        const voiceUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
        innerAudioContext.src = voiceUrl;
        innerAudioContext.play();
        innerAudioContext.onError((err) => {
          console.error('发音失败:', err);
          wx.showToast({ title: '发音失败', icon: 'none' });
        });
      } catch (err) {
        wx.showToast({ title: '发音加载失败', icon: 'none' });
      }
    },
  
    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    // 页面卸载时清理
    onUnload() {
      if (this.innerAudioContext) {
        try {
          this.innerAudioContext.stop();
          this.innerAudioContext.destroy();
        } catch (e) {}
      }
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
      }
    },
  
    // 标记为认识（兼容两种模式）
    markKnow() {
      this.setData({
        hasMadeChoice: true,
        currentMarkedAsKnow: true,
        showAnswer: true,
        knowCount: this.data.knowCount + 1
      }, () => {
        this.playCurrentAudio();
        
        // 刷错词模式：标记认识后移除该错词
        if (this.data.isWrongWordMode) {
          this.removeWrongWord();
        } else {
          this.checkShowToastTip();
        }
      });
    },
  
    // 新增：移除已掌握的错词（刷错词模式专用）
    removeWrongWord() {
      const { wrongWordsList, currentIndex, currentWord } = this.data;
      if (!currentWord || wrongWordsList.length === 0) return;
  
      // 1. 过滤掉当前单词
      const newWrongList = wrongWordsList.filter((_, idx) => idx !== currentIndex);
      // 2. 更新本地缓存
      wx.setStorageSync('wrong_words', newWrongList);
      // 3. 更新页面数据
      this.setData({
        wrongWordsList: newWrongList,
        totalWords: newWrongList.length,
        currentIndex: 0,
        currentWord: newWrongList[0] || null,
        hasMadeChoice: false,
        showAnswer: false
      }, () => {
        console.log('错词已移除，剩余：', newWrongList.length);
        if (newWrongList.length > 0) {
          this.playCurrentAudio();
        } else {
          wx.showToast({ title: '所有错词已掌握！', icon: 'success' });
        }
      });
    },
  
    // 标记为不认识（确保错词保存）
    markDontKnow: function() {
      if (!this.data.currentWord || this.data.hasMadeChoice) return;
      
      const currentWord = this.data.currentWord;
      this.playCurrentAudio();
      
      this.setData({
        showAnswer: true,
        hasMadeChoice: true,
        currentMarkedAsKnow: false,
        dontKnowCount: this.data.dontKnowCount + 1
      }, () => {
        // 只有非刷错词模式才保存错词（避免刷错词时重复保存）
        if (!this.data.isWrongWordMode) {
          this.saveWrongWordToLocal(currentWord);
        }
        
        this.setData({
          answerTimer: setTimeout(() => {
            this.nextWord();
          }, 2000)
        });
      });
    },
  
    // 保存错词到本地（强制保存，无去重）
    saveWrongWordToLocal: function(word) {
      try {
        if (!word || !word.en) {
          console.warn('单词数据异常：', word);
          return;
        }
        
        // 1. 强制读取并初始化缓存
        let wrongWords = wx.getStorageSync('wrong_words') || [];
        if (!Array.isArray(wrongWords)) wrongWords = [];
        
        // 2. 强制添加（注释去重，先验证）
        const formattedWord = {
          en: word.en.trim(),
          phonetic: word.phonetic || '',
          meaning: word.meaning || '',
          part: word.part || ''
        };
        wrongWords.push(formattedWord);
        
        // 3. 强制写入缓存
        wx.setStorageSync('wrong_words', wrongWords);
        console.log('错词保存成功，缓存数据：', wx.getStorageSync('wrong_words'));
        wx.showToast({ title: '错词已记录', icon: 'success' });
        
      } catch (err) {
        console.error('保存错词失败：', err);
        wx.showToast({ title: '错词保存失败', icon: 'none' });
      }
    },
  
    // 下一个单词（兼容两种模式）
    nextWord() {
      const nextIndex = this.data.currentIndex + 1;
      const isLastWord = nextIndex >= this.data.totalWords;
  
      if (isLastWord) {
        this.setData({ showCheckInTip: true });
        return;
      }
  
      // 根据模式选择数据源
      const newWord = this.data.isWrongWordMode 
        ? this.data.wrongWordsList[nextIndex] 
        : this.data.reviewList[nextIndex];
  
      this.setData({
        currentIndex: nextIndex,
        currentWord: newWord,
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false,
        showCheckInTip: false
      });
    },
  
    // 上一个单词（兼容两种模式）
    prevWord() {
      const prevIndex = this.data.currentIndex - 1;
      if (prevIndex < 0) return;
  
      // 根据模式选择数据源
      const newWord = this.data.isWrongWordMode 
        ? this.data.wrongWordsList[prevIndex] 
        : this.data.reviewList[prevIndex];
  
      this.setData({
        currentIndex: prevIndex,
        currentWord: newWord,
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false,
        showCheckInTip: false
      });
    },
  
    // 打乱单词顺序（兼容两种模式）
    shuffleWords() {
      // 根据模式选择数据源
      const originalList = this.data.isWrongWordMode 
        ? [...this.data.wrongWordsList] 
        : [...this.data.reviewList];
  
      // 打乱逻辑
      for (let i = originalList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [originalList[i], originalList[j]] = [originalList[j], originalList[i]];
      }
  
      // 根据模式更新数据源
      const updateData = {
        currentIndex: 0,
        currentWord: originalList[0] || null,
        hasMadeChoice: false,
        showAnswer: false,
        showCheckInTip: false
      };
  
      if (this.data.isWrongWordMode) {
        updateData.wrongWordsList = originalList;
      } else {
        updateData.reviewList = originalList;
      }
  
      this.setData(updateData);
    },
  
    // 打卡逻辑（仅复习模式生效）
    handleCheckIn() {
      // 刷错词模式不执行打卡
      if (this.data.isWrongWordMode) {
        wx.showToast({ title: '刷错词模式无需打卡', icon: 'none' });
        return;
      }
  
      const { currentIndex, totalWords, hasMadeChoice } = this.data;
      const isLastWord = totalWords > 0 && currentIndex === totalWords - 1;
      const isAllReviewed = isLastWord && hasMadeChoice;
  
      if (!isAllReviewed) {
        wx.showToast({ title: '请复习完所有单词', icon: 'none' });
        return;
      }
  
      const newCheckCount = this.data.checkCount + 1;
      this.setData({ checkCount: newCheckCount });
  
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.updateCheckCount) {
        prevPage.updateCheckCount(this.data.index);
      }
  
      wx.showToast({ title: '打卡成功！', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    },
  
    // 提示检查
    checkShowToastTip() {
      const { currentIndex, totalWords, hasMadeChoice } = this.data;
      if (totalWords > 0 && currentIndex === totalWords - 1 && hasMadeChoice) {
        wx.showToast({ title: '太棒了，快去打卡吧', icon: 'none', duration: 2000 });
      }
    },
  
    // 返回
    goBack() {
      wx.navigateBack();
    }
  });