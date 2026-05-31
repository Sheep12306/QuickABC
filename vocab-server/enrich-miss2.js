// 第二轮补漏：用有道词典页面 + 另一个免费 API
// 用法: node enrich-miss2.js

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const FILES = [
  '4 六级-乱序-enriched.txt',
  '3 四级-乱序-enriched.txt',
];

// 来源1: 有道词典 HTML 页面提取音标
async function lookupYoudao(word) {
  try {
    const url = `https://dict.youdao.com/result?word=${encodeURIComponent(word)}&lang=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const html = await res.text();

    // 匹配音标模式: 英 /xxx/ 或 UK /xxx/
    const m = html.match(/(?:英|UK)\s*[\[\/]([^\[\]\/]+)[\]\/]/i)
      || html.match(/phonetic[^>]*>[^<]*[\[\/]([^\[\]\/]+)[\]\/]/i)
      || html.match(/pronounce[^>]*>[^<]*[\[\/]([^\[\]\/]+)[\]\/]/i);
    if (m && m[1]) return '/' + m[1] + '/';
    return '';
  } catch (_) {
    return '';
  }
}

// 来源2: dictionaryapi.dev（原来的接口，重试）
async function lookupApi(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return '';
    const data = await res.json();
    return data[0]?.phonetic || data[0]?.phonetics?.[0]?.text || '';
  } catch (_) {
    return '';
  }
}

async function lookup(word) {
  // 先试有道（对中文用户友好，覆盖面广）
  let result = await lookupYoudao(word);
  if (result) return result;

  // 再试 dictionaryapi
  await sleep(300);
  result = await lookupApi(word);
  if (result) return result;

  return '';
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

  let processed = 0;
  let fixed = 0;
  const outLines = [];

  for (const line of lines) {
    const [word, phonetic, ...rest] = line.split('\t');

    if (!phonetic) {
      processed++;
      const result = await lookup(word);
      if (result) {
        fixed++;
        outLines.push(`${word}\t${result}\t${rest.join('\t')}`);
        console.log(`  [${fixed}/${processed}] ${word} → ${result}`);
      } else {
        outLines.push(line);
      }

      await sleep(350);

      if (processed % 30 === 0) {
        console.log(`  进度: ${processed} 未命中, 补回 ${fixed}`);
      }
    } else {
      outLines.push(line);
    }
  }

  fs.writeFileSync(filePath, outLines.join('\n'), 'utf-8');
  console.log(`补漏完成: ${processed} 个缺失, 补回 ${fixed} 个`);
  const total = outLines.filter(l => l.split('\t')[1]).length;
  console.log(`覆盖率: ${total}/${outLines.length} (${(total / outLines.length * 100).toFixed(1)}%)`);
}

async function main() {
  for (const file of FILES) {
    await processFile(file);
  }
  console.log('\n全部完成');
}

main().catch(err => { console.error(err); process.exit(1); });
