const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { success, fail, error } = require('../utils/response');
const { code2session } = require('../utils/wechat');

async function login(req, res) {
  try {
    const { code, userInfo } = req.body;
    if (!code) {
      return res.json(fail(400, '缺少登录凭证code'));
    }

    const { openid } = await code2session(code);

    let user = await User.findOne({ where: { openid } });

    const now = new Date();
    if (user) {
      await user.update({
        nickname: userInfo?.nickName || user.nickname,
        avatar: userInfo?.avatarUrl || user.avatar,
        updatedAt: now,
      });
    } else {
      user = await User.create({
        openid,
        nickname: userInfo?.nickName || '',
        avatar: userInfo?.avatarUrl || '',
        level: 1,
        checkInDays: 0,
        vocabCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    const token = jwt.sign({ openid }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    return res.json(success({
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        level: user.level,
        checkInDays: user.checkInDays,
        vocabCount: user.vocabCount,
      },
    }, '登录成功'));
  } catch (err) {
    console.error('登录失败：', err);
    return res.json(error('登录失败', err));
  }
}

async function getUserInfo(req, res) {
  try {
    const user = req.user;
    return res.json(success({
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatar: user.avatar,
      level: user.level,
      checkInDays: user.checkInDays,
      vocabCount: user.vocabCount,
      grade: user.grade,
      phone: user.phone,
      school: user.school,
    }));
  } catch (err) {
    return res.json(error('获取用户信息失败', err));
  }
}

module.exports = { login, getUserInfo };
