// 服务器运行：读带音标的 txt → 插入 MySQL
// 用法: node seed.js
const path = require('path');
const fs = require('fs');
const sequelize = require('./db');
const { WordBook, Word } = require('./models');

const DATA_DIR = path.join(__dirname, 'data');

const BOOKS = [
  {
    id: 11,
    name: '四级英语词汇',
    description: '大学英语四级核心词汇（乱序）',
    file: '3 四级-乱序-enriched.txt',
  },
  {
    id: 12,
    name: '六级英语词汇',
    description: '大学英语六级核心词汇（乱序）',
    file: '4 六级-乱序-enriched.txt',
  },
];

function parseLine(line) {
  const parts = line.split('\t');
  if (parts.length < 3) return null;
  const word = parts[0].trim();
  const phonetic = parts[1].trim();
  const rest = parts.slice(2).join('\t').trim(); // 词性. 释义
  if (!word || !rest) return null;

  const dotIdx = rest.indexOf(' ');
  let part = '';
  let meaning = rest;
  if (dotIdx !== -1) {
    part = rest.slice(0, dotIdx).trim();
    meaning = rest.slice(dotIdx + 1).trim();
  }

  return { word, phonetic, part, meaning };
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
  } catch (err) {
    console.error('MySQL 连接失败:', err.message);
    process.exit(1);
  }

  for (const bookConf of BOOKS) {
    const txtPath = path.join(DATA_DIR, bookConf.file);
    if (!fs.existsSync(txtPath)) {
      console.error('词表文件不存在:', txtPath);
      console.error('请先在本地运行 node enrich.js 生成带音标的词表');
      continue;
    }

    const existing = await WordBook.findByPk(bookConf.id);
    if (existing) {
      const wordCount = await Word.count({ where: { bookId: bookConf.id } });
      if (wordCount > 0) {
        console.log(`跳过: ${bookConf.name} (id=${bookConf.id} 已有 ${wordCount} 词)`);
        continue;
      }
      console.log(`${bookConf.name} 书已存在但无词，补插入...`);
    }

    const raw = fs.readFileSync(txtPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    const words = [];

    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;

      words.push({
        word: parsed.word,
        phonetic: parsed.phonetic,
        part: parsed.part,
        meaning: parsed.meaning,
        bookId: bookConf.id,
      });
    }

    console.log(`解析完成: ${words.length} 个词`);

    if (!existing) {
      await WordBook.create({
        id: bookConf.id,
        name: bookConf.name,
        description: bookConf.description,
        totalWords: words.length,
      });
      console.log(`单词书已创建: ${bookConf.name} (id=${bookConf.id})`);
    } else {
      await existing.update({ totalWords: words.length });
    }

    const CHUNK = 500;
    for (let i = 0; i < words.length; i += CHUNK) {
      const chunk = words.slice(i, i + CHUNK);
      await Word.bulkCreate(chunk);
      console.log(`  插入 ${i + 1}-${Math.min(i + CHUNK, words.length)}/${words.length}`);
    }

    console.log(`完成: ${bookConf.name}`);
  }

  await sequelize.close();
  console.log('全部完成');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed 失败:', err);
  process.exit(1);
});
