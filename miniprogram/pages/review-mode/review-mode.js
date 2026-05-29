Page({
    data: {
      dateWordList: [],
      currentBookId: 1,
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
  
    onLoad(options) {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      const bookId = options.bookId ? parseInt(options.bookId) : 1;
      this.setData({ currentBookId: bookId });
      
      this.loadDateWordData(bookId);
    },
  
    // 核心修改：1.空状态 2.仅读取有单词的日期 3.性能优化 4.兼容dailyLearnedWords存储
    loadDateWordData(bookId) {
      const that = this;
      const today = new Date();
      let dateWordList = [];
  
      // 1. 遍历最近30天（可调整），仅读取有单词的日期
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
        // 2. 优先读取按日期存储的单词（learn页保存的dailyLearnedWords），性能更优
        const dateKey = `dailyLearnedWords_${bookId}_${dateStr}`;
        const dailyWords = wx.getStorageSync(dateKey) || [];
  
        // 3. 只有该日期有单词时，才生成卡片
        if (dailyWords.length > 0) {
          dateWordList.push({
            date: dateStr,
            words: dailyWords, // 直接使用当日学习的单词
            isCheckIn: false,
            checkCount: 0
          });
        }
      }
  
      // 4. 读取本地已打卡记录，合并到列表
      const savedDateWords = wx.getStorageSync(`dateWords_${bookId}`) || [];
      dateWordList = dateWordList.map(item => {
        const savedItem = savedDateWords.find(s => s.date === item.date);
        if (savedItem) {
          return {
            ...item,
            checkCount: savedItem.checkCount,
            isCheckIn: savedItem.isCheckIn
          };
        }
        return item;
      });
  
      // 5. 过滤：打卡次数>=10次的日期自动移除
      dateWordList = dateWordList.filter(item => item.checkCount < 10);
  
      // 6. 同步到本地，更新页面
      that.setData({ dateWordList });
      wx.setStorageSync(`dateWords_${bookId}`, dateWordList);
      console.log('最终日期列表（仅含有单词的日期）:', dateWordList);
    },
  
    // 修复跳转路径 + 传递打卡次数
    goToDateReview(e) {
      console.log('点击了日期卡片：', e);
      const { date } = e.currentTarget.dataset;
      const { currentBookId, dateWordList } = this.data;
      // 找到当前日期的索引和打卡次数
      const index = dateWordList.findIndex(item => item.date === date);
      const currentItem = dateWordList[index];
      const checkCount = currentItem.checkCount || 0;
  
      // 读取当日单词（兼容原有存储）
      const dateKey = `dailyLearnedWords_${currentBookId}_${date}`;
      const dailyWords = wx.getStorageSync(dateKey) || [];
      const wordsStr = dailyWords.length > 0 ? encodeURIComponent(JSON.stringify(dailyWords)) : '[]';
      
      // 核心修复：跳转路径改为正确的 reviewdata（原 review-dat 是笔误）
      wx.navigateTo({
        url: `/pages/review-date/review-date?bookId=${currentBookId}&date=${date}&words=${wordsStr}&index=${index}&checkCount=${checkCount}`,
        fail: (err) => {
          console.error('跳转失败：', err);
          wx.showToast({
            title: '跳转失败，请检查页面配置',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
  
    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      const { currentBookId } = this.data;
      this.loadDateWordData(currentBookId);
    },

    // 优化打卡次数更新逻辑
    updateCheckCount(index) {
      const dateWordList = [...this.data.dateWordList];
      if (!dateWordList[index]) return; // 防止越界
      
      dateWordList[index].checkCount += 1;
      dateWordList[index].isCheckIn = true;
      
      // 打卡10次自动移除
      if (dateWordList[index].checkCount >= 10) {
        dateWordList.splice(index, 1);
        // 同时删除该日期的单词存储，节省内存
        const dateKey = `dailyLearnedWords_${this.data.currentBookId}_${dateWordList[index]?.date}`;
        wx.removeStorageSync(dateKey);
        wx.showToast({
          title: '该日期已完成复习，自动清理',
          icon: 'success',
          duration: 1500
        });
      }
  
      this.setData({ dateWordList });
      wx.setStorageSync(`dateWords_${this.data.currentBookId}`, dateWordList);
    }
  });