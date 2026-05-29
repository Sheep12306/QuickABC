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

    async completeTest() {
      wx.showLoading({ title: '保存测试结果...' });
      try {
        const newScore = Math.floor(Math.random() * 2000) + 2000;
        const now = new Date();
        const newTime = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        const openid = wx.getStorageSync('openid');
        if (!openid) {
          wx.hideLoading();
          wx.showToast({ title: '请先登录', icon: 'none' });
          return;
        }

        const res = await wx.cloud.callFunction({
          name: 'saveVocabTest',
          data: { action: 'save', openid, score: newScore, testTime: newTime }
        });

        if (res.result?.code === 200) {
          wx.setStorageSync('lastVocabScore', newScore);
          let history = wx.getStorageSync('vocabHistory') || [];
          history.unshift({ testTime: newTime, score: newScore });
          wx.setStorageSync('vocabHistory', history);
          wx.showToast({ title: `测试完成！词汇量：${newScore}`, icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.result?.msg || '保存失败', icon: 'none' });
        }
      } catch (err) {
        console.error('保存测试结果失败', err);
        const newScore = Math.floor(Math.random() * 2000) + 2000;
        const now = new Date();
        const newTime = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        wx.setStorageSync('lastVocabScore', newScore);
        let history = wx.getStorageSync('vocabHistory') || [];
        history.unshift({ testTime: newTime, score: newScore });
        wx.setStorageSync('vocabHistory', history);
        wx.showToast({ title: `测试完成！词汇量：${newScore}（本地保存）`, icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } finally {
        wx.hideLoading();
      }
    },

    goBack() {
      wx.navigateBack();
    }
  });
