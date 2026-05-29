const axios = require('axios');
const config = require('../config');

const JSC2S_URL = 'https://api.weixin.qq.com/sns/jscode2session';

async function code2session(code) {
  const params = {
    appid: config.wechat.appId,
    secret: config.wechat.appSecret,
    js_code: code,
    grant_type: 'authorization_code',
  };
  const { data } = await axios.get(JSC2S_URL, { params });
  if (data.errcode) {
    throw new Error(`WeChat API error: ${data.errcode} ${data.errmsg}`);
  }
  return { openid: data.openid, sessionKey: data.session_key, unionid: data.unionid };
}

module.exports = { code2session };
