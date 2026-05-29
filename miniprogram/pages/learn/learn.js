Page({
    data: {
      currentWords: [], // 当前分组单词
      currentGroup: 1, // 当前分组
      canNext: false, // 是否可下一组
      reviewStatus: false, // 复习状态
      reviewButtonVisible: false, // 复习按钮显示
      isLoading: false, // 加载状态
      bookId: '', // 当前单词书ID
      groupSize: 5, // 每组单词数
      themeColors: [
        { accent: '#43A047', light: '#E8F5E9', progressBg: 'rgba(67,160,71,0.12)' },
        { accent: '#00897B', light: '#E0F2F1', progressBg: 'rgba(0,137,123,0.10)' },
        { accent: '#F57C00', light: '#FFF3E0', progressBg: 'rgba(245,124,0,0.10)' },
        { accent: '#7B1FA2', light: '#F3E5F5', progressBg: 'rgba(123,31,162,0.10)' },
        { accent: '#1976D2', light: '#E3F2FD', progressBg: 'rgba(25,118,210,0.10)' }
      ],
      themeIdx: 0,
      lastWordIndex: 0, // 补充：最后学习的单词下标
      learnedWords: [] // 补充：已掌握单词ID列表
    },
  
    // 新增：音频上下文（不放到data里，避免干扰渲染）
    innerAudioContext: null,
  
    // 从云数据库恢复记录（本地无记录时兜底）
    restoreFromCloud: function () {
      const { bookId } = this.data;
      const openid = wx.getStorageSync('openid') || 'guest';
  
      wx.cloud.callFunction({
        name: 'getUserLearnRecord',
        data: { openid, bookId: bookId.toString() }, // 统一字符串类型
        success: (res) => {
          if (res.result.code === 200 && res.result.data) {
            const learnRecord = res.result.data.learnRecord;
            wx.setStorageSync(`learnRecord_${bookId}`, learnRecord);
            this.setData({
              currentGroup: learnRecord.lastGroup,
              lastWordIndex: learnRecord.lastWordIndex,
              learnedWords: learnRecord.learnedWords
            }, () => this.loadWords(learnRecord.lastGroup));
          }
        },
        fail: (err) => console.error('从云数据库恢复记录失败:', err)
      });
    },
  
    // 恢复上次学习记录（核心修复：仅恢复状态，不重复加载单词）
    restoreLearnRecord: function () {
      const { bookId } = this.data;
      const learnRecord = wx.getStorageSync(`learnRecord_${bookId}`) || {
        lastGroup: 1,
        lastWordIndex: 0,
        learnedWords: []
      };
  
      // 仅恢复状态，加载单词交给 loadWords 方法处理
      this.setData({
        currentGroup: learnRecord.lastGroup,
        lastWordIndex: learnRecord.lastWordIndex,
        learnedWords: learnRecord.learnedWords
      }, () => {
        // 调用原有 loadWords 方法，保证数据库优先逻辑
        this.loadWords(learnRecord.lastGroup);
        wx.showToast({
          title: `恢复到第${learnRecord.lastGroup}组`,
          icon: 'none',
          duration: 1500
        });
      });
    },
  
    // 页面加载：优先恢复学习记录 + 初始化发音（修复重复定义 + bookId 类型）
    onLoad: function (options) {
      // 🔥 修复1：打印日志确认bookId，统一字符串类型
      console.log('learn页面接收到的bookId：', options.bookId);
      const bookId = options.bookId || '';
      if (!bookId) {
        wx.showToast({ title: '未选择单词书', icon: 'none' });
        wx.navigateBack();
        return;
      }
  
      // 🔥 修复2：bookId 统一为字符串（避免数字/字符串不匹配）
      this.setData({ bookId: bookId.toString() });
      const themeIdx = getApp().globalData.cardThemeIndex || 0;
      this.setData({ themeIdx: themeIdx });
      this.restoreLearnRecord();
  
      // 新增：初始化音频上下文（关键：放在onLoad末尾，不干扰单词加载）
      this.innerAudioContext = wx.createInnerAudioContext();
      // 新增：监听音频播放状态，方便调试
      this.innerAudioContext.onPlay(() => {
        console.log('音频开始播放');
      });
      this.innerAudioContext.onStop(() => {
        console.log('音频停止播放');
      });
      this.innerAudioContext.onEnded(() => {
        console.log('音频播放结束');
      });
    },

    onShow: function() {
      const themeIdx = getApp().globalData.cardThemeIndex || 0;
      if (themeIdx !== this.data.themeIdx) {
        this.setData({ themeIdx: themeIdx });
      }
    },
  
    // 新增：播放单词发音（核心修复，加日志+备用方案）
    playWordAudio: function (word) {
      // 1. 调试日志：打印要发音的单词
      console.log('要发音的单词:', word);
      if (!word) {
        wx.showToast({ title: '单词为空', icon: 'none' });
        return;
      }
  
      // 2. 停止之前的发音，避免重叠
      if (this.innerAudioContext) {
        this.innerAudioContext.stop();
      } else {
        // 重新初始化音频上下文（防止初始化失败）
        this.innerAudioContext = wx.createInnerAudioContext();
      }
  
      // 3. 有道词典免费语音接口（encodeURIComponent处理特殊字符）
      const encodeWord = encodeURIComponent(word.trim());
      // 备用接口：百度翻译语音接口（防止有道接口失效）
      const voiceUrl = `https://dict.youdao.com/dictvoice?audio=${encodeWord}&type=1`;
      // const voiceUrl = `https://fanyi.baidu.com/gettts?lan=en&text=${encodeWord}&spd=5&source=web`; // 备用
  
      console.log('发音接口地址:', voiceUrl);
      this.innerAudioContext.src = voiceUrl;
  
      // 4. 播放发音 + 详细错误监听
      this.innerAudioContext.play();
  
      // 5. 发音提示
      // wx.showToast({ title: `正在播放: ${word}`, icon: 'none', duration: 1000 });
  
      // 6. 详细错误监听（定位问题）
      this.innerAudioContext.onError((err) => {
        console.error('音频播放错误:', err);
        wx.showToast({
          title: `发音失败: ${err.errMsg}`,
          icon: 'none',
          duration: 2000
        });
        // 备用方案：使用微信内置朗读（纯文本，无真人发音）
        wx.speechSynthesis({
          lang: 'en_US',
          content: word,
          success: () => console.log('备用朗读成功'),
          fail: (err) => console.error('备用朗读失败:', err)
        });
      });
    },
  
    // 新增：点击单词触发发音（修复事件获取）
    playCurrentAudio: function (e) {
      // 1. 调试日志：打印事件参数
      console.log('发音事件参数:', e);
      // 获取点击的单词索引（兼容currentTarget和target）
      const index = e.currentTarget?.dataset?.index || e.target?.dataset?.index;
      console.log('点击的单词索引:', index);
  
      // 2. 检查索引和单词数组
      if (index === undefined || index === null) {
        wx.showToast({ title: '未获取到单词索引', icon: 'none' });
        return;
      }
      if (!this.data.currentWords || this.data.currentWords.length === 0) {
        wx.showToast({ title: '单词列表为空', icon: 'none' });
        return;
      }
  
      // 3. 获取单词并播放
      const currentWord = this.data.currentWords[index];
      console.log('当前单词数据:', currentWord);
      if (currentWord && currentWord.en) {
        this.playWordAudio(currentWord.en);
      } else {
        wx.showToast({ title: '单词英文为空', icon: 'none' });
      }
    },
  
    // 加载指定分组单词（核心：数据库优先，修复格式化逻辑）
    loadWords: function (group) {
      const that = this;
      this.setData({ isLoading: true });
  
      this.loadWordsFromDB(group).then((realWords) => {
        if (realWords.length > 0) {
          // 标记已掌握单词（点击次数设为2）
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
          //wx.showToast({ title: `加载第${group}组（数据库单词）`, icon: 'none' });
        } else {
          wx.showToast({ title: '该分组暂无数据库单词', icon: 'none' });
          that.useMockWords(group);
        }
        that.checkReviewStatus();
        that.checkReviewButton();
        that.checkCanNext();
      }).catch((err) => {
        console.error('加载数据库单词失败:', err);
        wx.showToast({ title: '加载失败，使用本地单词', icon: 'none' });
        that.useMockWords(group);
        that.checkReviewStatus();
        that.checkReviewButton();
        that.checkCanNext();
      });
    },
  
    // 检查是否可下一组（所有单词点击过）
    checkCanNext: function () {
      const { currentWords } = this.data;
      const allClicked = currentWords.every(word => word.clickCount >= 1);
      this.setData({ canNext: allClicked });
    },
  
    // 从数据库加载单词（修复参数类型+格式化逻辑）
    loadWordsFromDB: function (group) {
      return new Promise(async (resolve, reject) => {
        try {
          const { bookId, groupSize } = this.data;
          const skip = (group - 1) * groupSize;
  
          const res = await wx.cloud.callFunction({
            name: 'getWordsByBookId',
            data: {
              bookId: bookId.toString(), // 统一字符串类型
              groupNum: group,
              groupSize: groupSize,
              skip: skip
            }
          });
  
          console.log('云函数返回:', res);
  
          // 容错：只要有数据就返回，不严格依赖code=200
          const resultData = res.result?.data || [];
          if (resultData.length > 0) {
            // 格式化数据库单词（仅做一次格式化）
            const formatWords = resultData.map(word => ({
              id: word._id,
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
  
    // 本地模拟单词（仅降级使用）
    useMockWords: function (group) {
      const { learnedWords } = this.data;
      const mockWords = [
        { id: 1, en: 'favorite', phonetic: '/ˈfeɪvərɪt/', part: 'adj./n.', meaning: '最喜爱的；特别喜欢的人或物', clickCount: 0 },
        { id: 2, en: 'foreigner', phonetic: '/ˈfɒrənə(r)/', part: 'n.', meaning: '外国人', clickCount: 0 },
        { id: 3, en: 'curly', phonetic: '/ˈkɜːli/', part: 'adj.', meaning: '卷曲的', clickCount: 0 },
        { id: 4, en: 'subject', phonetic: '/ˈsʌbdʒɪkt/', part: 'n.', meaning: '主题；学科', clickCount: 0 },
        { id: 5, en: 'drawer', phonetic: '/drɔː(r)/', part: 'n.', meaning: '抽屉', clickCount: 0 }
      ];
  
      // 标记已掌握的模拟单词
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
  
    // 保存学习记录（本地+云数据库兜底）
    saveLearnRecord: function () {
      const { bookId, currentGroup, lastWordIndex, currentWords } = this.data;
      const learnedWords = currentWords
        .filter(word => word.clickCount >= 2)
        .map(word => word.id || word._id);
  
      const learnRecord = {
        lastGroup: currentGroup,
        lastWordIndex: lastWordIndex || 0,
        learnedWords: learnedWords
      };
  
      // 本地存储核心记录
      wx.setStorageSync(`learnRecord_${bookId}`, learnRecord);
  
      // 可选：同步到云数据库
      wx.cloud.callFunction({
        name: 'saveUserLearnRecord',
        data: {
          openid: wx.getStorageSync('openid') || 'guest',
          bookId: bookId.toString(),
          learnRecord: learnRecord
        },
        fail: (err) => console.error('同步学习记录到云数据库失败:', err)
      });
    },
  
    // 保存当前组学习记录到数据库
    saveCurrentGroupLearnedRecord: function () {
      const { bookId, currentGroup, currentWords } = this.data;
      const learnedWords = currentWords.filter(word => word.clickCount >= 1);
      if (learnedWords.length === 0) return;
  
      // 原有逻辑：按分组保存
      const storageKey = `learnedWords_${bookId}_${currentGroup}`;
      wx.setStorageSync(storageKey, learnedWords);
  
      // 新增：按日期保存当日所有学习单词（核心桥梁）
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dateKey = `dailyLearnedWords_${bookId}_${todayStr}`;
  
      // 读取当日已保存的单词，合并后去重
      const oldDailyWords = wx.getStorageSync(dateKey) || [];
      const allDailyWords = oldDailyWords.concat(learnedWords);
      const uniqueDailyWords = Array.from(new Map(allDailyWords.map(item => [item.id, item]))).map(item => item[1]);
  
      // 保存到本地（供reviewdata读取）
      wx.setStorageSync(dateKey, uniqueDailyWords);
  
      // 原有云端保存逻辑
      const wordIds = learnedWords.map(word => word._id || word.id);
      wx.cloud.callFunction({
        name: 'saveLearnedWords',
        data: {
          bookId: bookId.toString(),
          groupNum: currentGroup,
          wordIds: wordIds
        },
        success: (res) => {
          console.log('学习记录保存成功:', res);
          wx.showToast({ title: '已保存学习记录', icon: 'success', duration: 1000 });
        },
        fail: (err) => {
          console.error('保存失败:', err);
          wx.showToast({ title: '保存记录失败', icon: 'none' });
        }
      });
    },
  
    // 单词点击事件（实时保存学习记录）
    wordClick: function (e) {
      const index = e.currentTarget.dataset.index;
      const currentWords = this.data.currentWords;
      currentWords[index].clickCount = (currentWords[index].clickCount || 0) + 1;
  
      this.setData({
        currentWords,
        lastWordIndex: index // 更新最后学习的单词下标
      });
  
      if (currentWords[index].clickCount >= 2) {
        this.saveCurrentGroupLearnedRecord();
      }
      // 实时保存学习记录
      this.saveLearnRecord();
      this.checkCanNext();
      this.checkReviewStatus();
      this.checkReviewButton();
    },
  
    // 下一组按钮点击
    nextGroup: function () {
      if (!this.data.canNext) {
        wx.showToast({ title: '请先点击完本组所有单词', icon: 'none' });
        return;
      }
      this.saveCurrentGroupLearnedRecord();
      this.saveLearnRecord(); // 切换分组前保存记录
      const nextGroup = this.data.currentGroup + 1;
      this.loadWords(nextGroup);
    },
  
    // 上一组按钮点击
    preGroup: function () {
      if (this.data.currentGroup > 1) {
        this.saveLearnRecord(); // 切换分组前保存记录
        const prevGroup = this.data.currentGroup - 1;
        this.loadWords(prevGroup);
      } else {
        wx.showToast({ title: '已经是第一组', icon: 'none' });
      }
    },
  
    // 复习检测按钮点击
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
          console.error('跳转复习页失败:', err);
          wx.showToast({ title: '跳转失败，请重试', icon: 'none' });
        }
      });
    },
  
    // 检查复习状态
    checkReviewStatus: function () {
      this.setData({
        reviewStatus: this.data.currentWords.some(word => word.clickCount > 0)
      });
    },
  
    // 检查复习按钮显示
    checkReviewButton: function () {
      this.setData({
        reviewButtonVisible: this.data.currentWords.some(word => word.clickCount > 0)
      });
    },
  
    // 页面隐藏/卸载时保存记录 + 销毁音频
    onHide: function () {
      this.saveLearnRecord();
    },
    onUnload: function () {
      this.saveLearnRecord();
      // 🔥 修复3：安全销毁音频实例（先判断是否存在，再调用方法）
      if (this.innerAudioContext) {
        try {
          this.innerAudioContext.stop();
          this.innerAudioContext.destroy();
          this.innerAudioContext = null; // 置空避免重复调用
        } catch (err) {
          console.error('销毁音频实例失败:', err);
        }
      }
    },
  
    // 核心修改：合并单词点击和发音事件（实现循环点击逻辑）
    handleWordTap: function (e) {
      const index = e.currentTarget.dataset.index;
      const currentWords = this.data.currentWords;
      const currentWord = currentWords[index];
  
      // 1. 先播放发音（每次点击都发音）
      if (currentWord && currentWord.en) {
        this.playWordAudio(currentWord.en);
      }
  
      // 2. 循环点击逻辑：点击4次后才重置为1次状态（保留1/2/3次完整状态）
      let newClickCount = currentWord.clickCount + 1;
      if (newClickCount > 3) { // 从 >=3 改为 >3，实现4次点击才重置
        newClickCount = 1;
        //wx.showToast({ title: '重置为初识状态', icon: 'none', duration: 800 });
      }
  
      // 3. 更新点击次数
      currentWords[index].clickCount = newClickCount;
      this.setData({
        currentWords,
        lastWordIndex: index
      });
  
      // 4. 保存记录（仅在点击到2次时保存，避免重复保存）
      if (newClickCount === 2) {
        this.saveCurrentGroupLearnedRecord();
      }
      this.saveLearnRecord();
      this.checkCanNext();
      this.checkReviewStatus();
      this.checkReviewButton();
    },
  
    // 临时测试方法（可删除）
    testSaveLearned: function () {
      const { bookId, currentGroup, currentWords } = this.data;
      const wordIds = currentWords.map(word => word.id);
      wx.cloud.callFunction({
        name: 'saveLearnedWords',
        data: { bookId: bookId.toString(), groupNum: currentGroup, wordIds },
        success: (res) => {
          console.log('学习记录保存成功:', res);
          //wx.showToast({ title: '记录已保存', icon: 'success' });
        },
        fail: (err) => {
          console.error('保存失败:', err);
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      });
    }
  });