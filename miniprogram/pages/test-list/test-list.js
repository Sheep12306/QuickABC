Page({
    data: {
      dictationWordList: [], // 听写日期列表（仅含当天有单词的日期）
      currentBookId: 1,     // 当前选中的单词本ID
      emptyText: "暂无可听写的单词",
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
  
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      // 获取传入的单词本ID，无则默认1
      const bookId = options.bookId ? parseInt(options.bookId) : 1;
      this.setData({ currentBookId: bookId });
      
      // 加载该单词本下所有有学习记录的日期单词数据
      this.loadDictationWordData(bookId);
    },
  
    /**
     * 核心方法：加载听写用的日期单词数据（适配听写场景改写）
     * @param {Number} bookId 单词本ID
     */
    loadDictationWordData(bookId) {
      const that = this;
      const today = new Date();
      let dictationWordList = [];
  
      // 1. 遍历最近30天（可根据需求调整），仅读取有单词的日期
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        // 格式化日期：YYYY-MM-DD（和学习页存储格式一致）
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
        // 2. 读取该日期下学习的单词（复用学习页存储的dailyLearnedWords）
        const dateKey = `dailyLearnedWords_${bookId}_${dateStr}`;
        const dailyWords = wx.getStorageSync(dateKey) || [];
  
        // 3. 只有该日期有单词时，才生成听写卡片
        if (dailyWords.length > 0) {
          dictationWordList.push({
            date: dateStr,
            words: dailyWords, // 直接关联当天学习的所有单词
            finishedCount: 0,  // 听写完成数（初始0）
            isCompleted: false // 听写是否完成（初始未完成）
          });
        }
      }
  
      // 4. 读取本地已保存的听写记录，合并状态（避免页面刷新丢失）
      const savedDictationWords = wx.getStorageSync(`dictationWords_${bookId}`) || [];
      dictationWordList = dictationWordList.map(item => {
        const savedItem = savedDictationWords.find(s => s.date === item.date);
        if (savedItem) {
          return {
            ...item,
            finishedCount: savedItem.finishedCount,
            isCompleted: savedItem.isCompleted
          };
        }
        return item;
      });
  
      // 5. 同步到本地缓存+更新页面
      that.setData({ dictationWordList });
      wx.setStorageSync(`dictationWords_${bookId}`, dictationWordList);
      console.log('听写日期列表（仅含有效单词）:', dictationWordList);
    },
  
    /**
     * 点击「去听写」按钮，跳转到听写练习页（携带当日单词）
     */
    goToDictation(e) {
      const { date, words } = e.currentTarget.dataset;
      const { currentBookId } = this.data;
      
      // 校验：确保该日期有单词
      if (!words || words.length === 0) {
        wx.showToast({ title: '该日期暂无可听写单词', icon: 'none', duration: 2000 });
        return;
      }
  
      // 跳转并携带核心参数：单词本ID、日期、当日单词列表
      wx.navigateTo({
        url: `/pages/dictation/dictation?bookId=${currentBookId}&date=${date}&words=${encodeURIComponent(JSON.stringify(words))}`
      });
    },
  
    /**
     * 页面显示时刷新数据（听写完成后返回列表自动更新）
     */
    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      const { currentBookId } = this.data;
      this.loadDictationWordData(currentBookId);
    }
  });