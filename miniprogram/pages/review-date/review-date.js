Page({
    data: {
      // 核心数据
      reviewList: [],
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
      const { bookId, date, words, index } = options;
      this.setData({ 
        index: parseInt(index),
        checkCount: parseInt(options.checkCount) || 0
      });
    
      if (words && words !== '[]') {
        try {
          const realWords = JSON.parse(decodeURIComponent(words));
          const isOnlyOneWord = realWords.length === 1;
          this.setData({
            reviewList: realWords,
            totalWords: realWords.length,
            currentWord: realWords[0] || null,
            // ✅ 初始判断：只有1个单词时直接显示打卡提示
            showCheckInTip: isOnlyOneWord
          });
        } catch (e) {
          this.setData({ reviewList: [], totalWords: 0, currentWord: null });
        }
      } else {
        this.setData({ reviewList: [], totalWords: 0, currentWord: null });
      }
    },
  
    // 播放当前单词发音（保留原有逻辑）
    playCurrentAudio() {
      if (this.data.currentWord && this.data.currentWord.en) {
        this.playWordAudio(this.data.currentWord.en);
      }
    },
  
    // 播放单词发音（保留原有逻辑）
    playWordAudio(word) {
      if (!word) return;
  
      // 停止之前的发音，避免重叠
      if (this.innerAudioContext) {
        this.innerAudioContext.stop();
      }
      this.innerAudioContext = wx.createInnerAudioContext();
  
      // 有道词典免费语音接口
      const voiceUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
      
      this.innerAudioContext.src = voiceUrl;
      this.innerAudioContext.play();
  
      // 监听发音错误
      this.innerAudioContext.onError((err) => {
        console.error('发音失败:', err);
        wx.showToast({ title: '发音失败', icon: 'none' });
      });
    },
  
    // 页面卸载时销毁音频实例 + 清除定时器（新增）
    onUnload() {
      if (this.innerAudioContext) {
        this.innerAudioContext.stop();
        this.innerAudioContext.destroy();
      }
      // 清除answerTimer定时器，避免内存泄漏
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
      }
    },
  
    // 纠正为不认识
    correctToDontKnow() {
      if (!this.data.currentWord) return;
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }
      this.setData({
        currentMarkedAsKnow: false,
        dontKnowCount: this.data.dontKnowCount + 1
      });
      this.saveWrongWordToLocal(this.data.currentWord);
    },

    // 标记为认识（核心修改：在setData回调中调用提示检查）
    markKnow() {
      this.setData({
        hasMadeChoice: true,
        currentMarkedAsKnow: true,
        showAnswer: true,
        knowCount: this.data.knowCount + 1
      }, () => {
        // 点击认识后自动播放当前单词发音
        this.playCurrentAudio();
        // 检查是否弹出打卡提示
        this.checkShowToastTip();
      });
    },
  
    // 标记为不认识（修复：删除不存在的方法调用，保留核心逻辑）
    markDontKnow: function() {
      if (!this.data.currentWord || this.data.hasMadeChoice) return;
      
      const currentWord = this.data.currentWord; // 保存当前单词，避免异步问题
      this.playCurrentAudio();
      
      this.setData({
        showAnswer: true,
        hasMadeChoice: true,
        currentMarkedAsKnow: false,
        dontKnowCount: this.data.dontKnowCount + 1 // 需复习+1
      });
      
      // ===== 删除不存在的方法调用（修复报错核心）=====
      // this.updateWordStatus('dontKnow');
      // this.addToTempUnknowWords(currentWord);
      // this.addToNewWords(currentWord);
    
      // ===== 保留本地缓存记录错词逻辑 =====
      this.saveWrongWordToLocal(currentWord);
      
      this.setData({
        answerTimer: setTimeout(() => {
          this.nextWord();
        }, 2000)
      });
    },
  
    // ===== 新增：本地缓存记录错词的方法（保留）=====
    saveWrongWordToLocal: function(word) {
      try {
        // 1. 验证单词数据，避免空数据
        if (!word || !word.en) {
          console.warn('单词数据异常，跳过本地记录：', word);
          return;
        }
        // 2. 读取本地已存错词，兼容空数据/非数组情况
        let wrongWords = wx.getStorageSync('wrong_words') || [];
        if (!Array.isArray(wrongWords)) wrongWords = [];
        // 3. 去重：同一个单词仅记录一次
        const isExist = wrongWords.some(item => item.en === word.en);
        if (isExist) {
          console.log('ℹ️ 该错词已存在本地缓存：', word.en);
          return;
        }
        // 4. 格式化数据，确保和刷错词页面字段一致
        const formattedWord = {
          en: word.en || '',
          phonetic: word.phonetic || '',
          part: word.part || '',
          meaning: word.meaning || ''
        };
        // 5. 保存到本地缓存
        wrongWords.push(formattedWord);
        wx.setStorageSync('wrong_words', wrongWords);
        console.log('错词已保存到本地缓存：', word.en);
      } catch (err) {
        // 异常仅打印日志，不影响主流程
        console.error('本地记录错词失败：', err);
      }
    },
  
    // 下一个单词（保留原有逻辑）
    nextWord() {
      const nextIndex = this.data.currentIndex + 1;
      const isLastWord = nextIndex >= this.data.totalWords;
  
      if (isLastWord) {
        // ✅ 最后一个单词：显示打卡提示，不直接完成
        this.setData({ showCheckInTip: true });
        return;
      }
  
      this.setData({
        currentIndex: nextIndex,
        currentWord: this.data.reviewList[nextIndex],
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false,
        showCheckInTip: false // 非最后一个单词：隐藏打卡提示
      });
    },
  
    // 上一个单词（保留原有逻辑）
    prevWord() {
      const prevIndex = this.data.currentIndex - 1;
      if (prevIndex < 0) return;
      this.setData({
        currentIndex: prevIndex,
        currentWord: this.data.reviewList[prevIndex],
        hasMadeChoice: false,
        showAnswer: false,
        currentMarkedAsKnow: false,
        showCheckInTip: false // 回退时隐藏打卡提示
      });
    },
  
    // 打乱单词顺序（保留原有逻辑）
    shuffleWords() {
      const list = [...this.data.reviewList];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      this.setData({
        reviewList: list,
        currentIndex: 0,
        currentWord: list[0] || null,
        hasMadeChoice: false,
        showAnswer: false,
        showCheckInTip: false // 打乱后隐藏打卡提示
      });
    },
  
    // 核心修改：打卡逻辑（始终可点，条件触发）
    handleCheckIn() {
      const { currentIndex, totalWords, hasMadeChoice } = this.data;
      
      // ✅ 正确判断逻辑：
      // 1. 单词总数 > 0（避免空列表误判）
      // 2. 当前索引 == 最后一个单词索引（totalWords - 1）
      // 3. 已标记该单词为认识/不认识（hasMadeChoice: true）
      const isLastWord = totalWords > 0 && currentIndex === totalWords - 1;
      const isAllReviewed = isLastWord && hasMadeChoice;
  
      // 未复习完：提示用户
      if (!isAllReviewed) {
        wx.showToast({
          title: '请复习完所有单词',
          icon: 'none',
          duration: 1500
        });
        return;
      }
  
      // 复习完：执行打卡逻辑（原有代码不变）
      const newCheckCount = this.data.checkCount + 1;
      this.setData({ checkCount: newCheckCount });
  
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.updateCheckCount) {
        prevPage.updateCheckCount(this.data.index);
      }
  
      wx.showToast({
        title: '打卡成功！',
        icon: 'success',
        duration: 1500
      });
  
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    },
  
    // 核心修复：强制打印日志 + 简化判断
    checkShowToastTip() {
      const { currentIndex, totalWords, hasMadeChoice } = this.data;
      console.log('当前索引:', currentIndex, '总数:', totalWords, '是否标记:', hasMadeChoice);
      
      // 简化判断：只要是最后一个单词（索引=总数-1）且已标记，就弹出提示
      if (totalWords > 0 && currentIndex === totalWords - 1 && hasMadeChoice) {
        wx.showToast({
          title: '太棒了，快去打卡吧',
          icon: 'none',
          duration: 2000
        });
      }
    },
  
    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    // 返回抗遗忘列表（保留原有逻辑）
    goBack() {
      wx.navigateBack();
    }
  });