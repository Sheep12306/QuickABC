Page({
    data: {
      // 用户信息
      userInfo: {
        nickname: '英语学习者'
      },
      userLevel: 12,
      streakDays: 7,
      
      // 学习统计
      todayLearned: 0,
      dailyGoal: 30,
      totalLearned: 0,
      accuracy: 0,
      
      // 单词书数据（默认空，从数据库加载）
      currentBook: {},
      wordBooks: [], // 从数据库读取的单词书列表
      newWordsCount: 0,
      reviewCount: 0,

      // 歌词区展示词
      lyricLines: [
        { word: 'abandon', trans: '放弃' },
        { word: 'ability', trans: '能力' },
        { word: 'absence', trans: '缺席' }
      ],

      // 卡片背景主题
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
      // 初始化云开发
      this.initCloud();
      // 1. 先加载数据库中的单词书列表
      this.loadWordBooksFromDB();
      // 2. 读取本地存储的当前单词书
      this.initCurrentBookFromStorage();
    },
  
    onShow: function() {
      this.updateLearningData();
    },
  
    // 初始化云开发
    initCloud() {
      if (!wx.cloud) {
        wx.showToast({
          title: '当前微信版本不支持云开发',
          icon: 'none'
        });
        return;
      }
      wx.cloud.init({
        env: 'cloud1-1gfs1z6a4027d442', // 替换为你的云环境ID
        traceUser: true
      });
    },
  
    // 从数据库加载所有单词书
    async loadWordBooksFromDB() {
      try {
        // 调用云函数获取单词书列表
        const res = await wx.cloud.callFunction({
          name: 'getAllWordBooks'
        });
  
        if (res.result.code === 200 && res.result.data.length > 0) {
          this.setData({
            wordBooks: res.result.data // 数据库中的单词书列表（如小学单词书）
          });
  
          // 如果本地没有保存的单词书，默认选第一本
          if (!wx.getStorageSync('currentBook')) {
            const defaultBook = res.result.data[0];
            this.setData({ currentBook: defaultBook });
            wx.setStorageSync('currentBook', defaultBook);
            // 加载默认单词书的学习数据
            this.loadBookLearningData(defaultBook.id);
          }
        } else {
          wx.showToast({
            title: '暂无单词书数据',
            icon: 'none'
          });
        }
      } catch (err) {
        console.error('加载单词书失败:', err);
        wx.showToast({
          title: '加载单词书失败',
          icon: 'none'
        });
      }
    },
  
    // 从本地存储初始化当前单词书
    initCurrentBookFromStorage() {
      try {
        const savedBook = wx.getStorageSync('currentBook');
        if (savedBook && savedBook.id) {
          this.setData({ currentBook: savedBook });
          // 加载该单词书的学习数据
          this.loadBookLearningData(savedBook.id);
        }
      } catch (e) {
        console.error('读取存储失败:', e);
      }
    },
  
    // 加载指定单词书的学习数据（从数据库）
    async loadBookLearningData(bookId) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'getBookLearningData',
          data: { bookId }
        });
  
        if (res.result.code === 200) {
          const data = res.result.data;
          this.setData({
            todayLearned: data.todayLearned || 0,
            totalLearned: data.totalLearned || 0,
            accuracy: data.accuracy || 0,
            newWordsCount: data.newWordsCount || 0,
            reviewCount: data.reviewCount || 0
          });
        }
      } catch (err) {
        console.error('加载学习数据失败:', err);
      }
    },
  
    // 更新学习数据
    updateLearningData: function() {
      if (this.data.currentBook.id) {
        this.loadBookLearningData(this.data.currentBook.id);
      }
    },
  
    // 核心修改：切换单词书（从数据库列表选择）
    changeBook: function() {
      const that = this;
      // 空列表防护
      if (this.data.wordBooks.length === 0) {
        wx.showToast({ title: '暂无单词书可切换', icon: 'none' });
        return;
      }
  
      wx.showActionSheet({
        itemList: this.data.wordBooks.map(book => `${book.name} (${book.progress || 0}%)`),
        success: function(res) {
          const selectedBook = that.data.wordBooks[res.tapIndex];
          // 更新当前单词书
          that.setData({ currentBook: selectedBook });
          // 持久化存储
          wx.setStorageSync('currentBook', selectedBook);
          // 加载该单词书的学习数据
          that.loadBookLearningData(selectedBook.id);
          // 提示
          wx.showToast({
            title: `已切换到 ${selectedBook.name}`,
            icon: 'success'
          });
        },
        fail: function(err) {
          console.log('用户取消切换:', err);
        }
      });
    },
  
// 开始背单词（携带真实bookId）
startStudy: function() {
    // 🔥 绝对兜底：获取currentBook，无论如何都保证能拿到id
    let currentBook = this.data.currentBook || {};
    
    // 🔥 最强兜底：如果id为空，从缓存再读一次
    if (!currentBook.id) {
        const cachedBook = wx.getStorageSync('currentBook') || {};
        currentBook = cachedBook;
    }

    // 🔥 最终兜底：如果id依然为空，手动赋值为小学单词（关键！）
    if (!currentBook.id) {
        currentBook = {
            id: 'primary_school', // 👈 这里必须是一个真实存在的 ID
            name: '小学单词汇总'
        };
        // 同步回data和缓存
        this.setData({ currentBook });
        wx.setStorageSync('currentBook', currentBook);
    }

    // 现在再做判断，100% 不会触发提示
    if (!currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
    }

    wx.navigateTo({
        url: `/pages/learn/learn?bookId=${currentBook.id}&mode=normal`
    });
},
    // 生词学习
    startNewWords: function() {
      if (!this.data.currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/new-word-review/new-word-review?bookId=${this.data.currentBook.id}`
      });
    },
  
    // 复习模式
    startReview: function() {
      if (!this.data.currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/review-mode/review-mode?bookId=${this.data.currentBook.id}`
      });
    },
  
    // 开始测试
    startTest: function() {
      if (!this.data.currentBook.id) {
        wx.showToast({ title: '请先选择单词书', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/test-list/test-list?bookId=${this.data.currentBook.id}`
      });
    },

    // 生词本
    goToVocabBook: function() {
      wx.navigateTo({ url: '/pages/wordBookList/wordBookList' });
    },

    // 切换卡片背景 - 上一主题
    prevTheme: function() {
      const total = this.data.cardThemes.length;
      const idx = (this.data.cardThemeIndex - 1 + total) % total;
      this.setData({ cardThemeIndex: idx });
      getApp().globalData.cardThemeIndex = idx;
    },

    // 切换卡片背景 - 下一主题
    nextTheme: function() {
      const total = this.data.cardThemes.length;
      const idx = (this.data.cardThemeIndex + 1) % total;
      this.setData({ cardThemeIndex: idx });
      getApp().globalData.cardThemeIndex = idx;
    }
  });