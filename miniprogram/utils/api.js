// 后端 API 地址（部署时改为你的阿里云服务器域名）
const API_BASE = 'http://115.29.149.87:3001/api';
const SERVER_BASE = 'http://115.29.149.87:3001';

function resolveAvatarUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return SERVER_BASE + url;
  return url;
}

function request(method, path, data) {
  const token = wx.getStorageSync('token') || '';
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + path,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          reject(new Error('登录已过期'));
        } else {
          reject(new Error(res.data?.msg || '请求失败'));
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

module.exports = {
  resolveAvatarUrl,

  // 认证
  login: (code, userInfo) => request('POST', '/auth/login', { code, userInfo }),
  getUserInfo: () => request('GET', '/auth/userinfo'),

  // 单词书
  getAllWordBooks: () => request('GET', '/wordbooks'),

  // 单词
  getWordsByBookId: (data) => {
    const { bookId, groupNum = 1, groupSize = 5 } = data;
    return request('GET', `/wordbooks/${bookId}/words?groupNum=${groupNum}&groupSize=${groupSize}`);
  },
  getWordsByIds: (wordIds) => request('POST', '/words/batch', { wordIds }),

  // 学习进度
  getBookLearningData: (bookId) => request('GET', `/study/progress/${bookId}`),

  // 已学单词
  getLearnedWordIds: (bookId, groupNum) => request('GET', `/study/learned-words/${bookId}?groupNum=${groupNum}`),
  saveLearnedWords: (bookId, groupNum, wordIds) => request('PUT', `/study/learned-words/${bookId}`, { groupNum, wordIds }),

  // 学习记录
  getLearnRecord: (bookId) => request('GET', `/study/learn-record/${bookId}`),
  saveLearnRecord: (bookId, learnRecord) => request('PUT', `/study/learn-record/${bookId}`, { learnRecord }),

  // 用户
  getProfile: () => request('GET', '/user/profile'),
  saveProfile: (userInfo) => request('PUT', '/user/profile', { userInfo }),
  uploadAvatar: (filePath) => new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token') || '';
    wx.uploadFile({
      url: API_BASE + '/user/avatar',
      filePath,
      name: 'avatar',
      header: { 'Authorization': token ? `Bearer ${token}` : '' },
      success(res) {
        try { resolve(JSON.parse(res.data)); } catch (e) { reject(new Error('解析失败')); }
      },
      fail(err) { reject(err); }
    });
  }),
  getStudyData: () => request('GET', '/user/study-data'),
  saveStudyData: (data) => request('PUT', '/user/study-data', data),

  // 词汇测试
  getVocabTestRecords: () => request('GET', '/vocab-test/records'),
  saveVocabTestRecord: (score, testTime) => request('POST', '/vocab-test/records', { score, testTime }),
  startVocabTest: () => request('GET', '/vocab-test/start'),
  submitVocabTest: (answers) => request('POST', '/vocab-test/submit', { answers }),

  // 错词 + 题库
  getWrongWords: () => request('GET', '/wrong-words'),
  addWrongWord: (word) => request('POST', '/wrong-words', { word }),
  deleteWrongWord: (id) => request('DELETE', `/wrong-words/${id}`),
  getQuestionList: (scopeIds) => request('GET', `/questions?scopeIds=${scopeIds.join(',')}`),
};
