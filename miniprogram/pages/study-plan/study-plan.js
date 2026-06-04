Page({
  data: {
    themeIdx: 0,
    themeColors: [
      { accent: '#43A047', light: '#E8F5E9' },
      { accent: '#00897B', light: '#E0F2F1' },
      { accent: '#F57C00', light: '#FFF3E0' },
      { accent: '#7B1FA2', light: '#F3E5F5' },
      { accent: '#1976D2', light: '#E3F2FD' }
    ],
    cardThemes: [
      { bg: 'linear-gradient(175deg, #C8E6C9 0%, #E8F5E9 30%, #F1F8F4 100%)' },
      { bg: 'linear-gradient(175deg, #B2DFDB 0%, #E0F2F1 30%, #F1F8F7 100%)' },
      { bg: 'linear-gradient(175deg, #FFE0B2 0%, #FFF3E0 30%, #FFF8F5 100%)' },
      { bg: 'linear-gradient(175deg, #E1BEE7 0%, #F3E5F5 30%, #F8F4FA 100%)' },
      { bg: 'linear-gradient(175deg, #BBDEFB 0%, #E3F2FD 30%, #F5F8FC 100%)' }
    ],
    dailyGoal: 20,
    quickOptions: [5, 10, 15, 20, 25, 30, 40, 50]
  },

  onLoad() {
    this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    const goal = wx.getStorageSync('dailyGoal') || 20;
    this.setData({ dailyGoal: goal });
  },

  onShow() {
    this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
  },

  selectGoal(e) {
    const goal = parseInt(e.currentTarget.dataset.goal);
    if (isNaN(goal) || goal < 5 || goal % 5 !== 0) return;
    this.setData({ dailyGoal: goal });
    wx.setStorageSync('dailyGoal', goal);
    wx.showToast({ title: '每日目标已设为 ' + goal + ' 词', icon: 'success', duration: 1200 });
  },

  onCustomInput(e) {
    this.setData({ customValue: parseInt(e.detail.value) || 0 });
  },

  saveCustom() {
    const val = this.data.customValue;
    if (!val || val < 5 || val % 5 !== 0) {
      wx.showToast({ title: '请输入5的倍数（最小5）', icon: 'none' });
      return;
    }
    this.setData({ dailyGoal: val });
    wx.setStorageSync('dailyGoal', val);
    wx.showToast({ title: '每日目标已设为 ' + val + ' 词', icon: 'success', duration: 1200 });
  },

  goBack() {
    wx.navigateBack();
  }
});
