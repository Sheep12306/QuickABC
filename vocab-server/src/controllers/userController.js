const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../../models');
const { success, error } = require('../utils/response');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${req.userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
}).single('avatar');

// GET /api/user/profile
async function getProfile(req, res) {
  try {
    const user = req.user;
    return res.json(success({
      id: user.id,
      openid: user.openid,
      avatar: user.avatar,
      nickname: user.nickname,
      grade: user.grade,
      phone: user.phone,
      school: user.school,
    }));
  } catch (err) {
    return res.json(error('获取个人信息失败', err));
  }
}

// PUT /api/user/profile
async function saveProfile(req, res) {
  try {
    const { userInfo } = req.body;
    if (!userInfo) {
      return res.json({ code: 400, msg: '缺少用户信息' });
    }

    await req.user.update({
      nickname: userInfo.nickname || userInfo.nickName || req.user.nickname,
      avatar: userInfo.avatar || userInfo.avatarUrl || req.user.avatar,
      grade: userInfo.grade || req.user.grade,
      phone: userInfo.phone || req.user.phone,
      school: userInfo.school || req.user.school,
      updatedAt: new Date(),
    });

    return res.json(success(null, '个人信息保存成功'));
  } catch (err) {
    return res.json(error('保存用户信息失败', err));
  }
}

// GET /api/user/study-data
async function getStudyData(req, res) {
  try {
    const user = req.user;
    return res.json(success({
      checkInDays: user.checkInDays,
      vocabCount: user.vocabCount,
      level: user.level,
    }));
  } catch (err) {
    return res.json(error('拉取学习数据失败', err));
  }
}

// PUT /api/user/study-data
async function saveStudyData(req, res) {
  try {
    const { checkInDays, vocabCount, level } = req.body;
    await req.user.update({
      checkInDays: checkInDays ?? req.user.checkInDays,
      vocabCount: vocabCount ?? req.user.vocabCount,
      level: level ?? req.user.level,
      updatedAt: new Date(),
    });

    return res.json(success(null, '学习数据保存成功'));
  } catch (err) {
    return res.json(error('保存学习数据失败', err));
  }
}

// POST /api/user/avatar
async function uploadAvatar(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.json(error('头像大小不能超过2MB'));
      return res.json(error('头像上传失败: ' + err.message));
    }
    if (!req.file) return res.json(error('请选择头像文件'));

    const avatarUrl = `/uploads/${req.file.filename}`;
    try {
      await req.user.update({ avatar: avatarUrl, updatedAt: new Date() });
      return res.json(success({ avatarUrl }, '头像上传成功'));
    } catch (e) {
      return res.json(error('保存头像失败'));
    }
  });
}

module.exports = { getProfile, saveProfile, getStudyData, saveStudyData, uploadAvatar };
