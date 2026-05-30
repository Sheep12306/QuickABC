const api = require('../../utils/api');

Page({
    data: {
      mixTitle: '',
      currentWord: null,
      currentIndex: 0,
      reviewWords: [],
      originGroupWords: [],
      allWords: [],
      tempUnknowWords: [],
      todayIndex: 1, // 当日学习序号（和 learn 一致）
      learnedGroupList: [], // 本次学习过的组列表 [1,2,3...]
      selectedMixGroups: [], // 选中的混组
      showMixPicker: false, // 废弃：不再显示混组下拉弹窗
      bookId: 1,
      knowCount: 0,          // 已掌握：点击认识的次数
      dontKnowCount: 0,      // 需复习：剩余待复习单词数
      showAnswer: false,
      answerTimer: null,
      hasMadeChoice: false,
      currentMarkedAsKnow: false,
      currentGroup: 1, // 当前组号
      selectedGroups: [], // 选中的组列表
      mixReviewTotal: 0,
      themeColors: [
        { accent: '#43A047', light: '#E8F5E9' },
        { accent: '#00897B', light: '#E0F2F1' },
        { accent: '#F57C00', light: '#FFF3E0' },
        { accent: '#7B1FA2', light: '#F3E5F5' },
        { accent: '#1976D2', light: '#E3F2FD' }
      ],
      themeIdx: 0,
      remainingCount: 1, // 剩余数量
      reviewedGroups: [] // 已复习组数
    },
  
    onLoad: function(options) {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      try {
        // 1. 解析基础参数（bookId/group）
        const bookId = options.bookId ? parseInt(options.bookId) : 1;
        const group = options.group ? parseInt(options.group) : 1;
        
        // 核心修复：从 learn 传递的参数直接获取当日学习序号，避免计算错误
        const todayIndex = options.todayIndex ? parseInt(options.todayIndex) : 1;
        // 兜底：防止 todayIndex 为 0
        const safeTodayIndex = todayIndex === 0 ? 1 : todayIndex;
        // 获取本次学习过的所有组列表
        const learnedGroupList = options.learnedGroupList ? JSON.parse(options.learnedGroupList) : [safeTodayIndex];
  
        this.setData({
          bookId: bookId,
          currentGroup: group,
          selectedGroups: [group],
          mixGroupCount: 1,
          remainingCount: 1,
          todayGroupIndex: safeTodayIndex, // 和 learn 页面的当日组号对齐
          todayIndex: safeTodayIndex,
          learnedGroupList: learnedGroupList
        });
  
        // 2. 获取已复习组数（按bookId精准存储）
        const reviewedGroups = wx.getStorageSync(`reviewedGroups_${bookId}`) || [];
        this.setData({ reviewedGroups });
  
        // 3. 核心修改：解析learn页面传递的单词数据（优先使用，不调用数据库）
        if (options.words) {
          // 解码并解析单词数据
          const reviewWords = JSON.parse(decodeURIComponent(options.words));
          // 格式化单词，适配复习页面结构
          const formatWords = reviewWords.map(word => ({
            id: word.id || word._id,
            en: word.en,
            phonetic: word.phonetic || '',
            part: word.part || '',
            meaning: word.meaning || '',
            consecutiveKnowCount: 0,
            lastStatus: 'unknown',
            belongGroup: group,
            clickCount: word.clickCount || 0 // 保留learn页面的点击次数
          }));
  
          // 赋值给复习页面的数据源（完全替代数据库加载）
          this.setData({
            originGroupWords: formatWords,
            reviewWords: formatWords,
            allWords: formatWords,
            totalWords: formatWords.length,
            currentWord: formatWords[0] || null,
            currentIndex: 0,
            knowCount: 0,
            dontKnowCount: formatWords.length, // 初始需复习=总词数
            tempUnknowWords: [],
            mixReviewTotal: 0 // 初始混组总词数=0
          });
        } else {
          // 降级：无传递数据时，仍调用数据库（兼容原有逻辑）
          this.loadFullGroupWords(bookId, group);
        }
  
        this.updateMixTitle();
      } catch (err) {
        console.error('解析复习数据失败:', err);
        wx.showToast({ title: '加载复习单词失败', icon: 'none' });
        // 降级使用示范数据
        const mockWords = this.getMockWords(this.data.currentGroup);
        this.setData({
          originGroupWords: mockWords,
          reviewWords: mockWords,
          allWords: mockWords,
          totalWords: mockWords.length,
          currentWord: mockWords[0] || null,
          knowCount: 0,
          dontKnowCount: mockWords.length, // 示范数据初始需复习=总词数
          mixReviewTotal: 0
        });
      }
    },
  
    // 新增：从数据库加载对应bookId+group的单词（保留，作为降级逻辑）
    async getWordsFromDB(bookId, group) {
      try {
        const resRecord = await api.getLearnedWordIds(bookId, group);

        if (resRecord.code !== 200 || !resRecord.data || resRecord.data.length === 0) {
          return [];
        }

        const learnedWordIds = resRecord.data[0].wordIds;
        if (!learnedWordIds || learnedWordIds.length === 0) {
          return [];
        }

        const resWords = await api.getWordsByIds(learnedWordIds);

        if (resWords.code === 200 && resWords.data.length > 0) {
          return resWords.data.map(word => ({
            id: word.id,
            en: word.word || word.en,
            phonetic: word.phonetic || '',
            part: word.part || '',
            meaning: word.meaning || word.translation || '',
            consecutiveKnowCount: 0,
            lastStatus: 'unknown',
            belongGroup: group
          }));
        } else {
          return [];
        }
      } catch (err) {
        console.error('查询失败:', err);
        return [];
      }
    },
  
    // 保留：示范单词（降级用）
    getMockWords(group) {
      const groupWordMap = {
        1: [
          { id: 1, en: 'favorite', phonetic: '/ˈfeɪvərɪt/', part: 'adj./n.', meaning: '最喜爱的；特别喜欢的人或物', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 1 },
          { id: 2, en: 'foreigner', phonetic: '/ˈfɒrənə(r)/', part: 'n.', meaning: '外国人', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 1 },
          { id: 3, en: 'curly', phonetic: '/ˈkɜːli/', part: 'adj.', meaning: '卷曲的', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 1 },
          { id: 4, en: 'subject', phonetic: '/ˈsʌbdʒɪkt/', part: 'n.', meaning: '主题；学科', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 1 },
          { id: 5, en: 'drawer', phonetic: '/drɔː(r)/', part: 'n.', meaning: '抽屉', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 1 },
        ],
        2: [
          { id: 6, en: 'apple', phonetic: '/ˈæpl/', part: 'n.', meaning: '苹果', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 2 },
          { id: 7, en: 'banana', phonetic: '/bəˈnɑːnə/', part: 'n.', meaning: '香蕉', consecutiveKnowCount: 0, lastStatus: 'unknown', belongGroup: 2 },
        ]
      };
      return groupWordMap[group] || [];
    },
  
    // 核心：加载该组所有单词（改为优先使用传递的单词，保留原有逻辑结构）
    loadFullGroupWords: async function(bookId, group) {
      // 从数据库加载单词（异步）
      const originWords = await this.getWordsFromDB(bookId, group);
      
      // 保留原有赋值逻辑，确保所有功能正常
      this.setData({
        originGroupWords: originWords, // 存储全量原始单词
        reviewWords: originWords,      // 复习列表=全量单词
        allWords: originWords,
        totalWords: originWords.length, // 总数=该组单词数
        currentWord: originWords[0] || null,
        currentIndex: 0,
        knowCount: 0,
        dontKnowCount: originWords.length, // 数据库加载初始需复习=总词数
        tempUnknowWords: []
      });
    },
  
    // 生成混组标题（简化逻辑）
    updateMixTitle: function() {
      const { todayGroupIndex, mixGroupCount } = this.data;
      let mixTitle = '';
      if (mixGroupCount > 1) {
        mixTitle = '混组复习'; // 混组时显示
      } else {
        mixTitle = `第${todayGroupIndex}组复习`; // 和 learn 页面格式一致
      }
      this.setData({ mixTitle });
    },
  
    // 新增：一键混组复习（合并当前组前所有组单词）
    oneClickMixReview: function() {
      const { todayIndex, learnedGroupList, bookId, originGroupWords } = this.data;
      const prevGroups = learnedGroupList.filter(g => g < todayIndex);
  
      if (prevGroups.length === 0) {
        wx.showToast({ title: '暂无前面组的单词可混组', icon: 'none' });
        return;
      }
  
      let mixWords = [];
      prevGroups.forEach(g => {
        const storageKey = `learnedWords_${bookId}_${g}`;
        const groupWords = wx.getStorageSync(storageKey) || [];
        groupWords.forEach(word => {
          if (!mixWords.some(w => w.id === word.id) && !originGroupWords.some(w => w.id === word.id)) {
            mixWords.push(word);
          }
        });
      });
  
      const finalWords = [...originGroupWords, ...mixWords];
      this.setData({
        reviewWords: finalWords,
        allWords: finalWords,
        totalWords: finalWords.length,
        currentWord: finalWords[0] || null,
        currentIndex: 0,
        mixGroupCount: prevGroups.length + 1,
        mixReviewTotal: finalWords.length, // 混组按钮数字=总词数
        knowCount: 0, // 混组后已掌握重置为0
        dontKnowCount: finalWords.length // 混组后需复习=总词数
      }, () => {
        this.calcStats();
        this.updateMixTitle();
        wx.showToast({ 
          title: `已混组${prevGroups.length + 1}组（共${finalWords.length}个单词）`, 
          icon: 'success' 
        });
      });
    },
    
    // 废弃：原手动选择组数的方法（保留但不使用）
    openGroupSelectModal: function() {
      wx.showToast({ title: '已改为一键混组', icon: 'none' });
    },
  
    // 合并混组单词（兼容原有逻辑）
    mergeMixGroupWords: async function() {
      const { originGroupWords, selectedGroups, currentGroup, bookId } = this.data;
      
      let mixWords = [];
      // 遍历选中的混组，从数据库加载对应单词
      for (let g of selectedGroups) {
        if (g !== currentGroup) {
          const groupWords = await this.getWordsFromDB(bookId, g);
          // 去重：避免和当前组/已加载混组单词重复
          groupWords.forEach(word => {
            if (!mixWords.some(w => w.id === word.id) && !originGroupWords.some(w => w.id === word.id)) {
              mixWords.push(word);
            }
          });
        }
      }
  
      const finalWords = [...originGroupWords, ...mixWords];
      this.setData({
        reviewWords: finalWords,
        allWords: finalWords,
        totalWords: finalWords.length,
        currentWord: finalWords[0] || null,
        currentIndex: 0
      }, () => this.calcStats());
    },
  
    // 统计已掌握/需复习数量（简化，仅保留兼容）
    calcStats: function() {
      // 统计逻辑改为点击时实时更新，此方法仅保留兼容原有调用
      const { allWords } = this.data;
      const knowCount = allWords.filter(w => w.consecutiveKnowCount >= 2).length;
      const dontKnowCount = allWords.filter(w => w.lastStatus === 'dontKnow').length;
      // 仅当非手动点击更新时，才同步数据（避免覆盖实时统计）
      if (this.data.hasMadeChoice === false) {
        this.setData({ knowCount, dontKnowCount });
      }
    },
  
    // 标记为认识：已掌握+1，需复习-1
    markKnow: function() {
      if (!this.data.currentWord || this.data.hasMadeChoice) return;
      this.playCurrentAudio();
      this.setData({
        showAnswer: true,
        hasMadeChoice: true,
        currentMarkedAsKnow: true,
        knowCount: this.data.knowCount + 1, // 已掌握+1
        dontKnowCount: Math.max(0, this.data.dontKnowCount - 1) // 需复习-1（最小为0）
      });
      this.updateWordStatus('know');
      this.setData({
        answerTimer: setTimeout(() => {
          this.nextWord();
        }, 2000)
      });
    },
  
    // 标记为不认识（追加到末尾必复习）：需复习+1
  // 标记为不认识（追加到末尾必复习）：需复习+1
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
    
    this.updateWordStatus('dontKnow');
    this.addToTempUnknowWords(currentWord);
    this.addToNewWords(currentWord);
  
    // ===== 核心新增：本地缓存记录错词（优先执行，不受网络/云函数影响）=====
    this.saveWrongWordToLocal(currentWord);
    
    // 原有云函数上传逻辑（保留，作为兜底备份）
    api.addWrongWord(currentWord).then(res => {
      console.log('wrong word saved:', res);
    }).catch(err => {
      console.error('wrong word save failed:', err);
    });
    
    this.setData({
      answerTimer: setTimeout(() => {
        this.nextWord();
      }, 2000)
    });
  },
  
  // ===== 新增：保存错词到本地缓存的方法（放在markDontKnow同层级）=====
  saveWrongWordToLocal: function(word) {
    try {
      // 1. 验证单词数据完整性
      if (!word || !word.en) {
        console.warn('单词数据异常，跳过本地记录：', word);
        return;
      }
      // 2. 读取本地已存储的错词（兼容空数据/非数组情况）
      let wrongWords = wx.getStorageSync('wrong_words') || [];
      if (!Array.isArray(wrongWords)) {
        wrongWords = [];
      }
      // 3. 去重：避免重复记录同一个错词（按en字段匹配）
      const isWordExist = wrongWords.some(item => item.en === word.en);
      if (isWordExist) {
        console.log('该错词已存在本地缓存，无需重复记录：', word.en);
        return;
      }
      // 4. 格式化错词数据（确保字段完整，和刷错词页面兼容）
      const formattedWord = {
        en: word.en || '',
        phonetic: word.phonetic || '',
        meaning: word.meaning || '',
        addTime: new Date().getTime() // 可选：记录添加时间，方便后续排序
      };
      // 5. 保存到本地缓存
      wrongWords.push(formattedWord);
      wx.setStorageSync('wrong_words', wrongWords);
      console.log('错词成功保存到本地缓存：', word.en);
    } catch (err) {
      // 异常仅打印日志，不影响主流程
      console.error('本地缓存记录错词失败：', err);
    }
  },
  
    // 追加答错单词到末尾
    addToTempUnknowWords: function(word) {
      let { tempUnknowWords } = this.data;
      if (!tempUnknowWords.some(w => w.id === word.id)) {
        tempUnknowWords.push({...word});
        this.setData({ tempUnknowWords });
      }
    },
  
    // 纠正为不认识
    correctToDontKnow: function() {
      if (!this.data.currentWord) return;
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }
      this.updateWordStatus('dontKnow');
      this.addToTempUnknowWords(this.data.currentWord);
      this.addToNewWords(this.data.currentWord);
      this.setData({ 
        currentMarkedAsKnow: false,
        dontKnowCount: this.data.dontKnowCount + 1 // 纠正时需复习+1
      });
    },
  
    // 更新单词掌握状态
    updateWordStatus: function(status) {
      const allWords = [...this.data.allWords];
      const reviewWords = [...this.data.reviewWords];
      const currentIndex = this.data.currentIndex;
      const currentWord = reviewWords[currentIndex];
      const wordInAll = allWords.find(w => w.id === currentWord.id);
      if (wordInAll) {
        if (status === 'know') {
          wordInAll.consecutiveKnowCount += 1;
          wordInAll.lastStatus = 'know';
        } else {
          wordInAll.consecutiveKnowCount = 0;
          wordInAll.lastStatus = 'dontKnow';
        }
        this.setData({
          allWords: allWords,
          reviewWords: reviewWords
        }, () => {
          this.calcStats();
          this.checkReviewCompletion();
        });
      }
    },
  
    // 下一个单词（答错单词追加到末尾）
    nextWord: function() {
      const { currentIndex, reviewWords, tempUnknowWords } = this.data;
      if (this.data.answerTimer) {
        clearTimeout(this.data.answerTimer);
        this.setData({ answerTimer: null });
      }
      if (currentIndex < reviewWords.length - 1) {
        this.goToWord(currentIndex + 1);
      } else if (tempUnknowWords.length > 0) {
        const newReviewWords = [...reviewWords, ...tempUnknowWords];
        this.setData({
          reviewWords: newReviewWords,
          tempUnknowWords: [],
          totalWords: newReviewWords.length,
          dontKnowCount: this.data.dontKnowCount + tempUnknowWords.length // 追加答错单词时需复习+对应数量
        }, () => {
          this.goToWord(currentIndex + 1);
        });
      } else {
        wx.showToast({ title: '已到最后一个单词', icon: 'none' });
        this.checkReviewCompletion();
      }
    },
  
    // 跳转到指定单词
    goToWord: function(index) {
      this.setData({
        currentWord: this.data.reviewWords[index],
        currentIndex: index,
        showAnswer: false,
        hasMadeChoice: false,
        currentMarkedAsKnow: false
      });
    },
  
    // 复习完成判定+标记状态（同步到Learn页）
    checkReviewCompletion: function() {
      const { reviewWords, tempUnknowWords, currentGroup, bookId } = this.data;
      const allMastered = reviewWords.every(w => w.consecutiveKnowCount >= 2);
      if (allMastered && tempUnknowWords.length === 0) {
        // 1. 标记该组为已复习（多维度存储，确保Learn页能识别）
        this.markGroupAsReviewed(bookId, currentGroup);
        // 2. 提示+返回Learn页
        wx.showToast({ title: '该组复习完成', icon: 'success', duration: 1500 });
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
            success: () => {
              // 额外标记，确保Learn页onShow能检测到
              wx.setStorageSync(`groupCompleted_${bookId}_${currentGroup}`, true);
            }
          });
        }, 1500);
      }
    },
  
    // 标记该组为已复习（按bookId存储）
    markGroupAsReviewed: function(bookId, group) {
      let { reviewedGroups } = this.data;
      if (!reviewedGroups.includes(group)) {
        reviewedGroups.push(group);
        this.setData({ reviewedGroups });
        // 持久化：按bookId存储已复习组数
        wx.setStorageSync(`reviewedGroups_${bookId}`, reviewedGroups);
        // 兼容旧存储
        wx.setStorageSync(`reviewed_group_${group}`, true);
      }
    },
  
  // 播放单词发音（支持任意英文单词）
  playWordAudio: function(word) {
    if (!word) return;

    // 停止之前的发音，避免重叠
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
    }
    this.innerAudioContext = wx.createInnerAudioContext();

    // 有道词典免费语音接口（自动识别单词并返回读音）
    const voiceUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
    
    // 播放发音
    this.innerAudioContext.src = voiceUrl;
    this.innerAudioContext.play();

    // 发音提示（可选，可删掉）
    //wx.showToast({ title: '发音中...', icon: 'none', duration: 600 });

    // 监听发音结束/失败
    this.innerAudioContext.onError((err) => {
      console.log('发音失败:', err);
      wx.showToast({ title: '发音失败', icon: 'none' });
    });
  },

  // 点击单词触发发音（你已设置的事件）
  playCurrentAudio: function() {
    if (this.data.currentWord && this.data.currentWord.en) {
      // 传入当前单词的英文文本，接口自动返回对应读音
      this.playWordAudio(this.data.currentWord.en);
    }
  },

  // 页面卸载时销毁音频实例（避免内存泄漏）
  onUnload: function() {
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
    }
  },
  
    // 加入生词本
    addToNewWords: function(word) {
      const newWords = wx.getStorageSync('newWords') || [];
      if (!newWords.some(w => w.id === word.id)) {
        newWords.push({
          id: word.id, en: word.en, phonetic: word.phonetic, part: word.part, meaning: word.meaning,
          addedTime: new Date().toISOString(), reviewCount: 1
        });
        wx.setStorageSync('newWords', newWords);
      }
    },
  
    // 上一个单词
    prevWord: function() {
      if (this.data.currentIndex > 0) {
        if (this.data.answerTimer) clearTimeout(this.data.answerTimer);
        this.goToWord(this.data.currentIndex - 1);
      }
    },
  
    // 打乱单词顺序
    shuffleWords: function() {
      const reviewWords = [...this.data.reviewWords];
      for (let i = reviewWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reviewWords[i], reviewWords[j]] = [reviewWords[j], reviewWords[i]];
      }
      this.setData({
        reviewWords: reviewWords, currentWord: reviewWords[0], currentIndex: 0,
        showAnswer: false, hasMadeChoice: false, currentMarkedAsKnow: false
      });
      wx.showToast({ title: '已打乱顺序', icon: 'success' });
    },
  
    // 返回Learn页（主动返回也标记为已复习）
    goBack: function() {
      const { bookId, currentGroup } = this.data;
      this.markGroupAsReviewed(bookId, currentGroup);
      wx.navigateBack({
        success: () => {
          wx.setStorageSync(`groupCompleted_${bookId}_${currentGroup}`, true);
        }
      });
    },

    onShow: function() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    }
  });