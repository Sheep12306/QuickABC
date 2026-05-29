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

      // Theme
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

      // Study stats
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
      this.initCloud();
      this.checkLocalLoginStatus();
      this.loadLocalStats();
      this.syncDataFromCloud();
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

    // ===== Phone modal (was missing) =====
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

    // ===== Cloud init =====
    initCloud() {
      if (!wx.cloud) {
        wx.showToast({ title: '微信版本过低', icon: 'none' });
        return;
      }
      wx.cloud.init({
        env: 'cloud1-1gfs1z6a4027d442',
        traceUser: true
      });
    },

    async syncDataFromCloud() {
      try {
        const openid = await this.getOpenid();
        if (openid) {
          const userProfile = await this.pullUserProfile();
          if (userProfile && userProfile._id) {
            this.setData({
              isLogin: true,
              userId: userProfile._id,
              userInfo: {
                avatarUrl: userProfile.avatar || this.data.userInfo.avatarUrl,
                nickName: userProfile.nickname || this.data.userInfo.nickName
              }
            });
            wx.setStorageSync('hasWechatLogin', true);
            wx.setStorageSync('userId', userProfile._id);
            await this.pullLatestStudyData();
          } else {
            this.clearLoginStatus();
          }
        }
      } catch (err) {
        console.error('同步失败', err);
      }
    },

    async getOpenid() {
      const cachedOpenid = wx.getStorageSync('openid');
      if (cachedOpenid) return cachedOpenid;
      try {
        const loginRes = await wx.login({});
        if (loginRes.code) {
          const cloudRes = await wx.cloud.callFunction({
            name: 'login',
            data: { code: loginRes.code, action: 'getOpenid' }
          });
          if (cloudRes.result?.openid) {
            wx.setStorageSync('openid', cloudRes.result.openid);
            return cloudRes.result.openid;
          }
        }
      } catch (err) {
        console.error('获取 openid 失败', err);
      }
      return null;
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
      this.setData({
        isLogin: false,
        userId: '',
        userInfo: { avatarUrl: '', nickName: '' }
      });
    },

    // ===== WeChat login =====
    async wechatAuthLogin() {
      try {
        const userRes = await wx.getUserProfile({
          desc: '用于完善会员资料',
          lang: 'zh_CN'
        });
        wx.showLoading({ title: '登录中...' });
        const loginRes = await wx.login({});
        if (!loginRes.code) throw new Error('登录凭证失败');
        const newUserInfo = userRes.userInfo;
        this.setData({ userInfo: newUserInfo });
        wx.setStorageSync('userInfo', newUserInfo);
        wx.setStorageSync('wxCode', loginRes.code);
        await this.getOpenid();
        const cloudRes = await wx.cloud.callFunction({
          name: 'login',
          data: {
            code: loginRes.code,
            action: 'login',
            userInfo: newUserInfo,
            openid: wx.getStorageSync('openid')
          }
        });
        if (cloudRes.result?.code === 200) {
          const userData = cloudRes.result.data;
          wx.setStorageSync('hasWechatLogin', true);
          wx.setStorageSync('userId', userData._id);
          this.setData({
            isLogin: true,
            userId: userData._id,
            userLevel: userData.level || 1,
            checkInDays: userData.checkInDays || 0
          });
          wx.showToast({ title: '登录成功', icon: 'success' });
          await this.pullLatestStudyData();
        } else {
          throw new Error(cloudRes.result?.msg || '登录失败');
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
      const openid = wx.getStorageSync('openid');
      if (!openid) return null;
      try {
        const res = await wx.cloud.callFunction({
          name: 'login',
          data: { action: 'getUserInfo', openid: openid }
        });
        if (res.result?.code === 200 && res.result.data) {
          const profile = res.result.data;
          const userInfo = {
            avatarUrl: profile.avatar || this.data.userInfo.avatarUrl,
            nickName: profile.nickname || this.data.userInfo.nickName
          };
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
          return profile;
        }
      } catch (err) {
        console.error('拉取 profile 失败', err);
      }
      return null;
    },

    async pullLatestStudyData() {
      const openid = wx.getStorageSync('openid');
      if (!openid) return;
      try {
        const res = await wx.cloud.callFunction({
          name: 'getStudyData',
          data: { openid: openid }
        });
        if (res.result?.code === 200) {
          const d = res.result.data;
          this.setData({
            checkInDays: d.checkInDays,
            lastVocabScore: d.vocabCount,
            userLevel: d.level
          });
          wx.setStorageSync('checkInDays', d.checkInDays);
          wx.setStorageSync('userLevel', d.level);
        }
      } catch (err) {
        console.error('拉取学习数据失败', err);
      }
    },

    async saveStudyData() {
      if (!this.data.isLogin) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      try {
        await wx.cloud.callFunction({
          name: 'saveStudyData',
          data: {
            openid: wx.getStorageSync('openid'),
            checkInDays: this.data.checkInDays,
            vocabCount: this.data.lastVocabScore,
            level: this.data.userLevel
          }
        });
      } catch (err) {
        console.error('保存失败', err);
      }
    },

    // ===== Daily check-in =====
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

    // ===== Navigation =====
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
