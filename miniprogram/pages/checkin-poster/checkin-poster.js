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
    checkInDays: 0,
    todayLearned: 0,
    currentDate: '',
    nickName: '',
    posterPath: '',
    posterReady: false
  },

  onLoad(options) {
    this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    const userInfo = wx.getStorageSync('userInfo') || {};
    const nickName = userInfo.nickName || userInfo.nickname || '';
    const checkInDays = parseInt(options.checkInDays) || parseInt(wx.getStorageSync('checkInDays')) || 0;
    const todayLearned = parseInt(options.todayLearned) || 0;
    const d = new Date();
    const dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

    this.setData({ checkInDays, todayLearned, currentDate: dateStr, nickName });
    this.drawPoster(nickName, checkInDays, todayLearned, dateStr);
  },

  drawPoster(nickName, days, words, dateStr) {
    const ctx = wx.createCanvasContext('posterCanvas', this);
    const w = 375, h = 580;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#E8F5E9');
    bgGrad.addColorStop(0.5, '#F1F8F4');
    bgGrad.addColorStop(1, '#C8E6C9');
    ctx.setFillStyle(bgGrad);
    ctx.fillRect(0, 0, w, h);

    ctx.setFillStyle('rgba(67,160,71,0.08)');
    ctx.beginPath(); ctx.arc(300, 80, 120, 0, 2 * Math.PI); ctx.fill();
    ctx.setFillStyle('rgba(67,160,71,0.05)');
    ctx.beginPath(); ctx.arc(60, 480, 100, 0, 2 * Math.PI); ctx.fill();

    ctx.setFillStyle('#43A047');
    ctx.setFontSize(24);
    ctx.setTextAlign('center');
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('单词打卡', w / 2, 70);

    ctx.setFillStyle('#2C3E2D');
    ctx.setFontSize(14);
    ctx.font = 'normal 14px sans-serif';
    ctx.fillText('已坚持背单词', w / 2, 140);

    ctx.setFillStyle('#43A047');
    ctx.setFontSize(72);
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText(String(days), w / 2, 220);

    ctx.setFillStyle('#2C3E2D');
    ctx.setFontSize(16);
    ctx.font = 'normal 16px sans-serif';
    ctx.fillText('天', w / 2, 248);

    ctx.setStrokeStyle('rgba(67,160,71,0.2)');
    ctx.setLineWidth(1);
    ctx.beginPath(); ctx.moveTo(80, 280); ctx.lineTo(w - 80, 280); ctx.stroke();

    ctx.setFillStyle('#4A5B4B');
    ctx.setFontSize(15);
    ctx.font = 'normal 15px sans-serif';
    ctx.fillText('今日已背', w / 2 - 70, 320);
    ctx.setFillStyle('#43A047');
    ctx.setFontSize(32);
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(String(words), w / 2 - 70, 362);
    ctx.setFillStyle('#4A5B4B');
    ctx.setFontSize(14);
    ctx.font = 'normal 14px sans-serif';
    ctx.fillText('个单词', w / 2 - 70, 384);

    ctx.setFillStyle('#4A5B4B');
    ctx.setFontSize(15);
    ctx.font = 'normal 15px sans-serif';
    ctx.fillText('日期', w / 2 + 70, 320);
    ctx.setFillStyle('#2C3E2D');
    ctx.setFontSize(16);
    ctx.font = 'normal 16px sans-serif';
    ctx.fillText(dateStr, w / 2 + 70, 356);

    ctx.setFillStyle('#8A9B8B');
    ctx.setFontSize(13);
    ctx.font = 'normal 13px sans-serif';
    ctx.fillText('每天坚持一点点，词汇量不断增长', w / 2, 440);

    if (nickName) {
      ctx.setFillStyle('#B0B8B0');
      ctx.setFontSize(11);
      ctx.font = 'normal 11px sans-serif';
      ctx.fillText(nickName + ' · QuickABC', w / 2, 480);
    }

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          success: (res) => this.setData({ posterPath: res.tempFilePath, posterReady: true }),
          fail: (e) => console.error('canvas export failed', e)
        }, this);
      }, 500);
    });
  },

  savePoster() {
    if (!this.data.posterPath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterPath,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: () => {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中允许保存图片到相册',
          confirmText: '去设置',
          success(r) { if (r.confirm) wx.openSetting(); }
        });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '我已坚持背单词 ' + this.data.checkInDays + ' 天',
      path: '/pages/index/index',
      imageUrl: this.data.posterPath || ''
    };
  },

  goBack() { wx.navigateBack(); }
});
