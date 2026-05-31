// 四级 XLS → 标准 enriched 格式转换
// 用法: node convert-cet4.js
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const INPUT = path.join(DATA_DIR, '02.大学英语四级词汇完整带音标-可打印-可编辑-乱序版.txt');
const OUTPUT = path.join(DATA_DIR, '3 四级-乱序-enriched.txt');

// UTF-16LE 读取
const raw = fs.readFileSync(INPUT, 'utf-16le');
const lines = raw.split('\n').filter(l => l.trim());

const outLines = [];
let skipped = 0;

for (const line of lines) {
  const parts = line.split('\t');
  if (parts.length < 4) { skipped++; continue; }

  const num = parts[0].trim();
  // 跳过表头
  if (isNaN(parseInt(num))) { skipped++; continue; }

  const word = parts[1].trim();  // 单词
  const phonetic = parts[2].trim(); // 音标
  const rest = parts[3].trim();     // 释义（可能含多个 tab 片段）

  if (!word || !rest) { skipped++; continue; }

  // 分离词性和释义
  const dotIdx = rest.indexOf(' ');
  let part = '';
  let meaning = rest;
  if (dotIdx !== -1) {
    part = rest.slice(0, dotIdx).trim();
    meaning = rest.slice(dotIdx + 1).trim();
  }

  // 标准格式: word\tphonetic\tpart meaning
  outLines.push(`${word}\t${phonetic}\t${part} ${meaning}`);
}

fs.writeFileSync(OUTPUT, outLines.join('\n'), 'utf-8');
console.log(`转换完成: ${outLines.length} 词 (跳过 ${skipped} 行)`);
