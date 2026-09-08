// 语音合成（后端）—— 基于微软 Edge Read Aloud 免费接口（msedge-tts）
// 生成 MP3 并落到 uploads/tts/ 下，按 `lang:text` 的 MD5 做磁盘缓存，重复词只合成一次。

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', '..', 'uploads', 'tts');

const VOICES = {
  en_US: 'en-US-JennyNeural',
  zh_CN: 'zh-CN-XiaoxiaoNeural',
};

// 极简 XML 转义，避免文本中的 & < > 等字符破坏 SSML
function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureDir() {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

function hashFor(lang, text) {
  return crypto.createHash('md5').update(`${lang}:${text}`).digest('hex');
}

// 合成语音，返回本地 mp3 文件绝对路径（命中缓存直接返回）
async function synthesize(text, lang = 'en_US') {
  const voice = VOICES[lang] || VOICES.en_US;
  const file = path.join(AUDIO_DIR, `${hashFor(lang, text)}.mp3`);

  ensureDir();
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    return file;
  }

  // 懒加载：依赖缺失时这里抛错，由上层捕获并降级，不影响服务启动
  const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(escapeXml(text));

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    audioStream.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    audioStream.on('error', reject);
  });

  return file;
}

module.exports = { synthesize, AUDIO_DIR };
