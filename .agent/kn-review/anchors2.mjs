// anchors2.mjs — điều tra 2 anchor MISS (CRLF? spacing?)
import fs from 'node:fs';
const t = fs.readFileSync('docs/knowleged.md', 'utf8');
console.log('CRLF:', (t.match(/\r\n/g) || []).length, '| LF total:', (t.match(/\n/g) || []).length, '| lines:', t.split('\n').length);
const needle = '- **Tags:** `process` `dx` `windows` `powershell` `scripts`';
let idx = -1, n = 0;
while ((idx = t.indexOf(needle, idx + 1)) >= 0) {
  n++;
  console.log(`-- occurrence ${n} @${idx}:`);
  console.log(JSON.stringify(t.slice(idx, idx + 160)));
}
const needle2 = 'đều REFUSED.';
const i2 = t.indexOf(needle2);
console.log('REFUSED @', i2, JSON.stringify(t.slice(i2 - 30, i2 + 40)));
