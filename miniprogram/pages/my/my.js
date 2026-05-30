const api = require('../../utils/api');

Page({
    data: {
      userInfo: {
        avatarUrl: '',
        nickName: ''
      },
      userId: '',
      isLogin: false,
      userLevel: 1,
      checkInDays: 0,
      lastVocabScore: 0,
      userPhone: '',
      phoneNumbers: [],
      selectedPhone: '',

      themeColors: [
        { accent: '#43A047', light: '#E8F5E9' },
        { accent: '#00897B', light: '#E0F2F1' },
        { accent: '#F57C00', light: '#FFF3E0' },
        { accent: '#7B1FA2', light: '#F3E5F5' },
        { accent: '#1976D2', light: '#E3F2FD' }
      ],
      cardThemes: [
        { bg: 'linear-gradient(175deg, #C8E6C9 0%, #E8F5E9 30%, #F1F8F4 100%)', name: '森林' },
        { bg: 'linear-gradient(175deg, #B2DFDB 0%, #E0F2F1 30%, #F1F8F7 100%)', name: '海洋' },
        { bg: 'linear-gradient(175deg, #FFE0B2 0%, #FFF3E0 30%, #FFF8F5 100%)', name: '日落' },
        { bg: 'linear-gradient(175deg, #E1BEE7 0%, #F3E5F5 30%, #F8F4FA 100%)', name: '薰衣草' },
        { bg: 'linear-gradient(175deg, #BBDEFB 0%, #E3F2FD 30%, #F5F8FC 100%)', name: '天空' }
      ],
      themeIdx: 0,

      todayWords: 0,
      totalWords: 0,
      accuracy: 0,
      streakDays: 0,
      wrongWordsCount: 0,
      vocabBookCount: 0,
      dictationCount: 0,
      dailyGoal: 30,

      showPhoneModal: false
    },

    onLoad() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      this.checkLocalLoginStatus();
      this.loadLocalStats();
      this.syncDataFromServer();
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      if (this.data.isLogin) {
        this.pullUserProfile();
        this.pullLatestStudyData();
      }
      this.loadLocalStats();
      this.checkLocalLoginStatus();
    },

    loadLocalStats() {
      try {
        this.setData({
          todayWords: wx.getStorageSync('todayLearned') || 0,
          totalWords: wx.getStorageSync('totalLearned') || 0,
          accuracy: wx.getStorageSync('accuracy') || 0,
          streakDays: wx.getStorageSync('streakDays') || 0,
          wrongWordsCount: (wx.getStorageSync('wrong_words') || []).length,
          vocabBookCount: (wx.getStorageSync('newWords') || []).length,
          dictationCount: (wx.getStorageSync('dictationRecords') || []).length
        });
      } catch (e) {
        // ignore
      }
    },

    showPhoneModal() {
      wx.showModal({
        title: '绑定手机号',
        editable: true,
        placeholderText: '请输入手机号',
        success: (res) => {
          if (res.confirm && res.content) {
            const phone = res.content.trim();
            if (/^1\d{10}$/.test(phone)) {
              const masked = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
              this.setData({ userPhone: masked });
              wx.setStorageSync('userPhone', phone);
              wx.showToast({ title: '绑定成功', icon: 'success' });
            } else {
              wx.showToast({ title: '手机号格式不正确', icon: 'none' });
            }
          }
        }
      });
    },

    async syncDataFromServer() {
      try {
        const openid = wx.getStorageSync('openid');
        const token = wx.getStorageSync('token');
        if (!openid && !token) return;

        const userProfile = await this.pullUserProfile();
        if (userProfile && userProfile.id) {
          this.setData({
            isLogin: true,
            userId: userProfile.id,
            userInfo: {
              avatarUrl: userProfile.avatar || this.data.userInfo.avatarUrl,
              nickName: userProfile.nickname || this.data.userInfo.nickName
            }
          });
          wx.setStorageSync('hasWechatLogin', true);
          wx.setStorageSync('userId', userProfile.id);
          await this.pullLatestStudyData();
        } else {
          this.clearLoginStatus();
        }
      } catch (err) {
        console.error('sync failed', err);
      }
    },

    checkLocalLoginStatus() {
      const hasLogin = wx.getStorageSync('hasWechatLogin');
      const userInfo = wx.getStorageSync('userInfo') || {};
      const userId = wx.getStorageSync('userId') || '';
      this.setData({
        isLogin: hasLogin,
        userId: userId,
        userInfo: {
          avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
          nickName: userInfo.nickName || userInfo.nickname || ''
        },
        userPhone: wx.getStorageSync('userPhone') || '',
        checkInDays: wx.getStorageSync('checkInDays') || 0
      });
    },

    clearLoginStatus() {
      wx.removeStorageSync('hasWechatLogin');
      wx.removeStorageSync('userId');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('token');
      wx.removeStorageSync('openid');
      this.setData({
        isLogin: false,
        userId: '',
        userInfo: { avatarUrl: '', nickName: '' }
      });
    },

    async wechatAuthLogin() {
      try {
        const userRes = await wx.getUserProfile({
          desc: '用于完善会员资料',
          lang: 'zh_CN'
        });
        wx.showLoading({ title: '登录中...' });
        const loginRes = await wx.login({});
        if (!loginRes.code) throw new Error('login code failed');

        const newUserInfo = userRes.userInfo;
        this.setData({ userInfo: newUserInfo });
        wx.setStorageSync('userInfo', newUserInfo);

        const res = await api.login(loginRes.code, newUserInfo);

        if (res.code === 200 && res.data) {
          const { token, user } = res.data;
          wx.setStorageSync('token', token);
          wx.setStorageSync('openid', user.openid);
          wx.setStorageSync('hasWechatLogin', true);
          wx.setStorageSync('userId', user.id);
          this.setData({
            isLogin: true,
            userId: user.id,
            userLevel: user.level || 1,
            checkInDays: user.checkInDays || 0
          });
          wx.showToast({ title: '登录成功', icon: 'success' });
          await this.pullLatestStudyData();
        } else {
          throw new Error(res.msg || 'login failed');
        }
      } catch (err) {
        console.error(err);
        wx.showToast({ title: err.message || '登录失败', icon: 'none' });
        this.clearLoginStatus();
      } finally {
        wx.hideLoading();
      }
    },

    async pullUserProfile() {
      const token = wx.getStorageSync('token');
      if (!token) return null;
      try {
        const res = await api.getUserInfo();
        if (res.code === 200 && res.data) {
          const profile = res.data;
          const userInfo = {
            avatarUrl: profile.avatar || this.data.userInfo.avatarUrl,
            nickName: profile.nickname || this.data.userInfo.nickName
          };
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
          return profile;
        }
      } catch (err) {
        console.error('pull profile failed', err);
      }
      return null;
    },

    async pullLatestStudyData() {
      const token = wx.getStorageSync('token');
      if (!token) return;
      try {
        const res = await api.getStudyData();
        if (res.code === 200 && res.data) {
          const d = res.data;
          this.setData({
            checkInDays: d.checkInDays || 0,
            lastVocabScore: d.vocabCount || 0,
            userLevel: d.level || 1
          });
          wx.setStorageSync('checkInDays', d.checkInDays || 0);
          wx.setStorageSync('userLevel', d.level || 1);
        }
      } catch (err) {
        console.error('pull study data failed', err);
      }
    },

    async saveStudyData() {
      if (!this.data.isLogin) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      try {
        await api.saveStudyData({
          checkInDays: this.data.checkInDays,
          vocabCount: this.data.lastVocabScore,
          level: this.data.userLevel
        });
      } catch (err) {
        console.error('save failed', err);
      }
    },

    async checkIn() {
      if (!this.data.isLogin) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      wx.showLoading({ title: '打卡中...' });
      try {
        const newDays = this.data.checkInDays + 1;
        this.setData({ checkInDays: newDays });
        wx.setStorageSync('checkInDays', newDays);
        await this.saveStudyData();
        wx.showToast({ title: '打卡成功', icon: 'success' });
      } catch (err) {
        wx.showToast({ title: '打卡失败', icon: 'none' });
      } finally {
        wx.hideLoading();
      }
    },

    goToProfile() {
      wx.navigateTo({ url: '/pages/profile/profile' });
    },
    checkInStats() {
      wx.navigateTo({ url: '/pages/studyRecord/studyRecord' });
    },
    goToVocabDetail() {
      wx.navigateTo({ url: '/pages/vocab-Detail/vocab-Detail' });
    },
    goToVocabTest() {
      wx.navigateTo({ url: '/pages/vocab-Test/vocab-Test' });
    },
    goToStudySetting() {
      wx.navigateTo({ url: '/pages/studySetting/studySetting' });
    },
    goToSetting() {
      wx.navigateTo({ url: '/pages/settings/settings' });
    },
    goToWrongWords() {
      wx.navigateTo({ url: '/pages/new-word-review/new-word-review?isWrongWordMode=true' });
    },
    goToVocabBook() {
      wx.navigateTo({ url: '/pages/wordBookList/wordBookList' });
    },
    goToDictationRecords() {
      wx.showToast({ title: '功能开发中，敬请期待', icon: 'none' });
    },
    switchTheme() {
      const total = this.data.cardThemes.length;
      const idx = (this.data.themeIdx + 1) % total;
      this.setData({ themeIdx: idx });
      getApp().globalData.cardThemeIndex = idx;
    },

    onUnload() {
      wx.hideLoading();
    }
  });