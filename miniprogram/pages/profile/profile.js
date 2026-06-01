const api = require('../../utils/api');
const { resolveAvatarUrl } = api;

Page({
    data: {
      userInfo: {
        avatar: '',
        nickname: '',
        grade: '',
        phone: '',
        school: ''
      },
      gradeList: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'],
      gradeIndex: -1,
      isSaving: false,
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
      this.loadUserInfo();
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    async loadUserInfo() {
      try {
        const token = wx.getStorageSync('token');
        if (token) {
          const res = await api.getProfile();
          if (res.code === 200 && res.data) {
            const cloudUserInfo = res.data;
            const gradeIndex = this.data.gradeList.indexOf(cloudUserInfo.grade);
            this.setData({
              userInfo: {
                avatar: resolveAvatarUrl(cloudUserInfo.avatar),
                nickname: cloudUserInfo.nickname || '',
                grade: cloudUserInfo.grade || '',
                phone: cloudUserInfo.phone || '',
                school: cloudUserInfo.school || ''
              },
              gradeIndex: gradeIndex > -1 ? gradeIndex : -1
            });
            this.saveToStorageNormalized(cloudUserInfo);
          } else {
            this.loadLocalUserInfo();
          }
        } else {
          this.loadLocalUserInfo();
        }
      } catch (err) {
        console.error('加载云端信息失败：', err);
        this.loadLocalUserInfo();
      }
    },

    loadLocalUserInfo() {
      const stored = wx.getStorageSync('userInfo') || {};
      const rawAvatar = stored.avatar || stored.avatarUrl || '';
      const userInfo = {
        avatar: resolveAvatarUrl(rawAvatar),
        nickname: stored.nickname || stored.nickName || '',
        grade: stored.grade || '',
        phone: stored.phone || '',
        school: stored.school || ''
      };
      const gradeIndex = this.data.gradeList.indexOf(userInfo.grade);
      this.setData({ userInfo, gradeIndex: gradeIndex > -1 ? gradeIndex : -1 });
    },

    saveToStorageNormalized(userInfo) {
      const normalized = {
        avatar: userInfo.avatar || '',
        avatarUrl: userInfo.avatar || '',
        nickname: userInfo.nickname || '',
        nickName: userInfo.nickname || '',
        grade: userInfo.grade || '',
        phone: userInfo.phone || '',
        school: userInfo.school || ''
      };
      wx.setStorageSync('userInfo', normalized);
    },

    chooseAvatar() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          this.cropAndUpload(tempFilePath);
        },
        fail: (err) => {
          console.error('选择头像失败：', err);
        }
      });
    },

    cropAndUpload(src) {
      wx.cropImage({
        src,
        cropScale: '1:1',
        success: (cropRes) => {
          this.setData({ 'userInfo.avatar': cropRes.tempFilePath });
          this.uploadAvatarToServer(cropRes.tempFilePath);
        },
        fail: () => {
          // 裁剪失败时直接用原图
          this.setData({ 'userInfo.avatar': src });
          this.uploadAvatarToServer(src);
        }
      });
    },

    async uploadAvatarToServer(filePath) {
      try {
        const res = await api.uploadAvatar(filePath);
        if (res.code === 200 && res.data) {
          this.setData({ 'userInfo.avatar': res.data.avatarUrl });
          wx.showToast({ title: '头像已上传', icon: 'success', duration: 1200 });
        }
      } catch (err) {
        console.error('头像上传失败：', err);
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      }
    },

    onNicknameInput(e) {
      this.setData({ 'userInfo.nickname': e.detail.value || '' });
    },

    onGradeChange(e) {
      const index = e.detail.value;
      this.setData({
        gradeIndex: index,
        'userInfo.grade': this.data.gradeList[index] || ''
      });
    },

    onPhoneInput(e) {
      this.setData({ 'userInfo.phone': e.detail.value || '' });
    },

    onSchoolInput(e) {
      this.setData({ 'userInfo.school': e.detail.value || '' });
    },

    async saveProfile() {
      const { userInfo, isSaving } = this.data;
      if (isSaving) return;

      if (!userInfo.nickname) {
        wx.showToast({ title: '请输入昵称', icon: 'none' });
        return;
      }
      if (!userInfo.grade) {
        wx.showToast({ title: '请选择年级', icon: 'none' });
        return;
      }
      if (!userInfo.phone) {
        wx.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }
      if (!/^1\d{10}$/.test(userInfo.phone)) {
        wx.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
      }
      if (!userInfo.school) {
        wx.showToast({ title: '请输入学校', icon: 'none' });
        return;
      }

      this.setData({ isSaving: true });
      wx.showLoading({ title: '保存中...' });

      try {
        const res = await api.saveProfile(userInfo);

        if (res.code === 200) {
          this.saveToStorageNormalized(userInfo);
          getApp().globalData.profileUpdated = Date.now();
          wx.hideLoading();
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.hideLoading();
          this.setData({ isSaving: false });
          wx.showToast({ title: res.msg || '保存失败', icon: 'none' });
        }
      } catch (err) {
        console.error('保存个人信息失败：', err);
        wx.hideLoading();
        this.setData({ isSaving: false });
        wx.showToast({ title: '保存失败，请检查网络', icon: 'none' });
      }
    }
  });
