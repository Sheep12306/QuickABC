const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'gaokao3500.txt'), 'utf-8');
const lines = raw.split('\n');

const adPatterns = ['更多精', '苦功尽付', '微信公众号', 'shangfen1208'];
const isAd = function(s) { return adPatterns.some(function(a) { return s.includes(a); }) || !s.trim(); };

const isEntry = function(s) { return /^[A-Za-z]/.test(s) && /\[.*?\]/.test(s); };

var entries = [];
var cur = null;

for (var i = 0; i < lines.length; i++) {
  var t = lines[i].trim();
  if (isAd(t)) continue;
  if (!t) continue;

  if (isEntry(t)) {
    if (cur) entries.push(cur);
    cur = t;
  } else if (cur) {
    cur += ' ' + t;
  }
}
if (cur) entries.push(cur);

function parse(raw) {
  var word = '', phonetic = '';
  var m = raw.match(/^(.+?)\s*\[(.*?)\]\s*/);
  if (m) { word = m[1].trim(); phonetic = m[2].replace(/\s+/g, ''); }
  var rest = raw.slice(m ? m[0].length : 0).trim();

  var pm = rest.match(/^((?:(?:n|v|a|ad|adj|adv|pron|prep|conj|aux|modal|int|num|art|vi|vt)\.?\s*\/*\s*)+)\s*/);
  var part = '', meaning = rest;
  if (pm) { part = pm[1].replace(/\s+/g, ' ').trim(); meaning = rest.slice(pm[0].length).trim(); }

  word = word.replace(/[\(\)（）]/g, '').replace(/\s+/g, ' ').trim();
  meaning = meaning.replace(/\s+/g, ' ').trim().substring(0, 500);
  return { word: word, phonetic: phonetic, part: part || '', meaning: meaning || rest };
}

var result = entries.map(function(e) { return parse(e); }).filter(function(e) { return e.word && e.word.length > 1; });

console.log('Parsed ' + result.length + ' entries');
fs.writeFileSync(path.join(__dirname, 'gaokao3500_parsed.json'), JSON.stringify(result, null, 2));
console.log('Done!');
