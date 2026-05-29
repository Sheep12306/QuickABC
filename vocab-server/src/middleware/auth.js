const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ code: 401, msg: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findOne({ where: { openid: decoded.openid } });
    if (!user) {
      return res.json({ code: 401, msg: '用户不存在' });
    }
    req.openid = decoded.openid;
    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.json({ code: 401, msg: '登录已过期，请重新登录' });
    }
    return res.json({ code: 401, msg: '登录验证失败' });
  }
}

module.exports = authMiddleware;
