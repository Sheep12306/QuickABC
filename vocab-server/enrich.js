// 本地运行：读 txt + 查在线词典 API 补音标 → 输出带音标的 txt
// 用法: node enrich.js

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');

const BOOKS = [
  {
    file: '4 六级-乱序.txt',
    out: '4 六级-乱序-enriched.txt',
  },
];

function parseLine(line) {
  const idx = line.indexOf('\t');
  if (idx === -1) return null;
  const word = line.slice(0, idx).trim();
  const rest = line.slice(idx + 1).trim();
  if (!word || !rest) return null;

  const dotIdx = rest.indexOf(' ');
  let part = '';
  let meaning = rest;
  if (dotIdx !== -1) {
    part = rest.slice(0, dotIdx).trim();
    meaning = rest.slice(dotIdx + 1).trim();
  }

  return { word, part, meaning };
}

async function lookupPhonetic(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    // 从返回数据中提取音标
    const phonetic = data[0]?.phonetic
      || data[0]?.phonetics?.[0]?.text
      || '';
    return phonetic;
  } catch (_) {
    return '';
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  for (const conf of BOOKS) {
    const txtPath = path.join(DATA_DIR, conf.file);
    const outPath = path.join(DATA_DIR, conf.out);

    if (!fs.existsSync(txtPath)) {
      console.error('词表文件不存在:', txtPath);
      continue;
    }

    console.log('处理:', conf.file);
    const raw = fs.readFileSync(txtPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());

    const outLines = [];
    let hits = 0;
    let count = 0;

    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;

      count++;
      const phonetic = await lookupPhonetic(parsed.word);
      if (phonetic) hits++;

      // 进度显示
      if (count % 50 === 0) {
        console.log(`  ${count}/${lines.length} (音标命中: ${hits})`);
      }

      outLines.push(`${parsed.word}\t${phonetic}\t${parsed.part} ${parsed.meaning}`);

      // 限速：每秒 5 个请求
      await sleep(200);
    }

    fs.writeFileSync(outPath, outLines.join('\n'), 'utf-8');
    console.log(`完成: ${conf.out} (${outLines.length} 词, 音标命中 ${hits}/${outLines.length})`);
  }

  console.log('全部完成');
}

main().catch(err => { console.error(err); process.exit(1); });
