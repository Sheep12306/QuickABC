Page({
    data: {
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

    onLoad() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    clearCache() {
      wx.showModal({
        title: '清除缓存',
        content: '确定要清除本地缓存数据吗？这将清除学习记录缓存，但不会影响云端数据。',
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '清理中...' });
            try {
              // Keep login-related keys, clear study caches
              const keepKeys = ['openid', 'hasWechatLogin', 'userId', 'userInfo', 'userPhone', 'currentBook'];
              const allKeys = wx.getStorageInfoSync().keys;
              allKeys.forEach(key => {
                if (!keepKeys.includes(key)) {
                  wx.removeStorageSync(key);
                }
              });
              wx.hideLoading();
              wx.showToast({ title: '缓存已清除', icon: 'success' });
            } catch (e) {
              wx.hideLoading();
              wx.showToast({ title: '清理失败', icon: 'none' });
            }
          }
        }
      });
    },

    showAbout() {
      wx.showModal({
        title: '关于快背单词',
        content: '快背单词是一款专注英语词汇学习的微信小程序。支持单词书学习、错词复习、听写练习、词汇量测试等功能。\n\n版本：1.0.0\n技术：WeChat Cloud Development',
        showCancel: false,
        confirmText: '知道了'
      });
    },

    showFeedback() {
      wx.showModal({
        title: '意见反馈',
        content: '感谢您的使用！如有任何建议或问题，欢迎通过以下方式反馈。\n\n反馈渠道开发中，敬请期待。',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  });
