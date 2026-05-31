// 对未命中音标的词做补漏：重试 + 变形查询
// 用法: node enrich-miss.js

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const FILES = [
  '4 六级-乱序-enriched.txt',
  '3 四级-乱序-enriched.txt',
];

async function lookupPhonetic(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return data[0]?.phonetic || data[0]?.phonetics?.[0]?.text || '';
  } catch (_) {
    return '';
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log('跳过:', filename, '(文件不存在)');
    return;
  }

  console.log('\n处理:', filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());

  let misses = 0;
  let fixed = 0;
  const outLines = [];

  for (const line of lines) {
    const [word, phonetic, ...rest] = line.split('\t');
    if (!phonetic) {
      misses++;

      let result = '';
      for (let i = 0; i < 3 && !result; i++) {
        result = await lookupPhonetic(word);
        if (i > 0) await sleep(500);
      }

      if (!result) {
        const roots = [
          word.replace(/s$/, ''), word.replace(/es$/, ''),
          word.replace(/ing$/, ''), word.replace(/ed$/, ''),
          word.replace(/ly$/, ''), word.replace(/tion$/, 'te'),
          word.replace(/tions$/, 'te'),
        ];
        for (const root of roots) {
          if (root === word) continue;
          result = await lookupPhonetic(root);
          if (result) break;
          await sleep(500);
        }
      }

      if (result) {
        fixed++;
        outLines.push(`${word}\t${result}\t${rest.join('\t')}`);
      } else {
        outLines.push(line);
      }

      if (misses % 20 === 0) {
        console.log(`  已处理 ${misses} 个未命中, 补回 ${fixed} 个`);
      }

      await sleep(300);
    } else {
      outLines.push(line);
    }
  }

  fs.writeFileSync(filePath, outLines.join('\n'), 'utf-8');
  console.log(`补漏完成: ${misses} 个缺失, 补回 ${fixed} 个`);
  console.log(`覆盖率: ${outLines.filter(l => l.split('\t')[1]).length}/${outLines.length}`);
}

async function main() {
  for (const file of FILES) {
    await processFile(file);
  }
  console.log('\n全部完成');
}

main().catch(err => { console.error(err); process.exit(1); });
