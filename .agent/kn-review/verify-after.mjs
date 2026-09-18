// verify-after.mjs — verify state knowleged.md sau batch edits (nhóm A+C)
import fs from 'node:fs';
const raw = fs.readFileSync('docs/knowleged.md', 'utf8');
console.log('CRLF:', (raw.match(/\r\n/g) || []).length, '| LF total:', (raw.match(/\n/g) || []).length);

const checks = [
  'grace 1000ms chống click nhầm',
  '(3) grace period 1000ms cho click-anywhere',
  'Cập nhật 2026-09-12 (local pwsh 7.6.6)',
  'Contract phân tầng (đồng bộ §5d',
  'instance thứ 2 của KN-003',
  'Hướng evolve dài hạn: **KN-021**',
  'bản "đọc cơ chế" của CÙNG 2 sự cố',
  'Phân định KN-065',
  'Phân định KN-064',
  'hard-assert',
  'OCR review toàn bộ 68 KN',
  '~6 tháng" botnet',
  'AI_SERVER_URL`/`localhost:5050` grep = 0',
  'code hiện tại `www/web-thuat-toan/app.js` **không còn gán `.disabled`**',
];
for (const c of checks) console.log((raw.includes(c) ? 'OK  ' : 'MISS') + ' ' + c);

// KN-039 structure
const seg039 = raw.slice(raw.indexOf('### KN-039'), raw.indexOf('### KN-040'));
console.log('KN-039 Tags lines:', (seg039.match(/\*\*Tags:\*\*/g) || []).length, '| Cập nhật line:', seg039.includes('Cập nhật 2026-09-12'));

// table blanks check: rows KN-066..069 phải liền nhau
const idx066 = raw.indexOf('| KN-066 |');
const idx069 = raw.indexOf('| KN-069 |');
const tableSeg = raw.slice(idx066, idx069 + 80);
console.log('blank lines giữa 066-069:', (tableSeg.match(/\n\s*\n/g) || []).length, '(expect 0)');

// dup Tags toàn file
const tagsAll = raw.match(/^-\s*\*\*Tags:\*\*/gm) || [];
console.log('total Tags lines:', tagsAll.length);
