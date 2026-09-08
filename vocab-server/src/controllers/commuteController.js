const { CommuteSetting, CommuteRecord } = require('../../models');
const { success, fail, error } = require('../utils/response');
const quotes = require('../data/quotes');
const tts = require('../utils/tts');

const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 计算连续学习天数（从今天或昨天往回数）
async function computeStreak(userId) {
  const records = await CommuteRecord.findAll({
    where: { userId },
    attributes: ['date'],
    order: [['date', 'DESC']],
  });
  const dates = new Set(records.map(r => r.date));
  const today = toDateStr(new Date());
  const cursor = new Date();
  if (!dates.has(today)) {
    cursor.setDate(cursor.getDate() - 1); // 今天没学，从昨天开始数
  }
  let streak = 0;
  while (dates.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// 生成早报文本（日期 + 每日一句 + 结束引导，无天气）
function buildMorning() {
  const now = new Date();
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return {
    greetingEn: 'Good morning.',
    greetingCn: '早上好。',
    dateEn: `Today is ${WEEKDAYS_EN[now.getDay()]}, ${MONTHS_EN[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}.`,
    dateCn: `今天是${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日，${WEEKDAYS_CN[now.getDay()]}。`,
    quoteEn: quote.en,
    quoteCn: quote.cn,
    leadEn: "Let's start today's English review.",
    leadCn: '让我们开始今天的英语复习吧。',
  };
}

// GET /api/commute/today
async function getToday(req, res) {
  try {
    const userId = req.userId;

    const setting = await CommuteSetting.findOne({ where: { userId } });
    const streak = await computeStreak(userId);
    const morning = buildMorning();

    return res.json(success({
      mode: setting ? setting.mode : 'normal',
      streak,
      morning,
    }));
  } catch (err) {
    return res.json(error('获取通勤任务失败', err));
  }
}

// POST /api/commute/settings
async function saveSettings(req, res) {
  try {
    const { mode } = req.body;
    if (!['fast', 'normal', 'slow'].includes(mode)) {
      return res.json(fail(400, '无效的播放模式'));
    }

    const [setting] = await CommuteSetting.findOrCreate({
      where: { userId: req.userId },
      defaults: { userId: req.userId, mode },
    });
    if (setting.mode !== mode) {
      await setting.update({ mode, updatedAt: new Date() });
    }

    return res.json(success({ mode }, '播放模式已保存'));
  } catch (err) {
    return res.json(error('保存设置失败', err));
  }
}

// POST /api/commute/complete
async function completeReview(req, res) {
  try {
    const { wordCount = 0, duration = 0 } = req.body;
    const date = toDateStr(new Date());

    await CommuteRecord.findOrCreate({
      where: { userId: req.userId, date },
      defaults: { userId: req.userId, date, wordCount, duration, createdAt: new Date() },
    });

    const streak = await computeStreak(req.userId);
    return res.json(success({ streak }, '复习完成'));
  } catch (err) {
    return res.json(error('保存复习记录失败', err));
  }
}

// POST /api/commute/tts
async function synthesizeTts(req, res) {
  try {
    const { text, lang = 'en_US' } = req.body;
    if (!text || !String(text).trim()) {
      return res.json(fail(400, '缺少文本'));
    }

    const filePath = await tts.synthesize(String(text).trim(), lang);
    const normalized = filePath.replace(/\\/g, '/');
    const idx = normalized.indexOf('/uploads/');
    const url = idx >= 0 ? normalized.slice(idx) : null;

    return res.json(success({ url }, '合成成功'));
  } catch (err) {
    // 合成失败不抛错，返回 url=null，前端自动降级为占位推进
    console.error('TTS 合成失败:', err.message || err);
    return res.json(success({ url: null }, '合成失败，已降级为占位'));
  }
}

module.exports = { getToday, saveSettings, completeReview, synthesizeTts };
