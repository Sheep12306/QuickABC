// app.js
const api = require('./utils/api');

App({
  globalData: {
    cardThemeIndex: 0,
    token: null,
    userInfo: null
  },

  onLaunch() {
    // 小程序登录
    wx.login({
      success: async (res) => {
        if (!res.code) {
          console.error('获取微信登录code失败');
          return;
        }
        console.log('微信登录code:', res.code);

        try {
          // 调用后端登录接口
          const loginRes = await api.login(res.code);
          console.log('登录返回：', loginRes);

          if (loginRes.code === 200 && loginRes.data) {
            const { token, user } = loginRes.data;

            if (token) {
              wx.setStorageSync('token', token);
              this.globalData.token = token;
              console.log('Token保存成功');
            }

            if (user) {
              this.globalData.userInfo = user;
              wx.setStorageSync('userInfo', user);
              wx.setStorageSync('openid', user.openid);
              wx.setStorageSync('userId', user.id);
              wx.setStorageSync('hasWechatLogin', true);
              console.log('用户信息：', user.nickname);
            }
          }
        } catch (err) {
          console.error('登录请求失败', err);
        }
      },
      fail: (err) => {
        console.error('wx.login失败', err);
      }
    });
  }
});