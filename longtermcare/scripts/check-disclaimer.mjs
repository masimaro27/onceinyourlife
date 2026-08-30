// 고지 문구 게이트 — index.html과 data.js의 필수 문구·메타 존재 확인
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const data = readFileSync(join(root, 'data.js'), 'utf8');

const required = [
  ['index.html', html, '참고용 추정치'],
  ['index.html', html, '1577-1000'],
  ['index.html', html, '2026년 1월 1일'],
  ['index.html', html, '식사재료비'],
  ['index.html', html, '비급여'],
  ['index.html', html, '원단위'],
  ['index.html', html, '장기요양인정서'],
  ['index.html', html, '출처'],
  ['data.js', data, '2026-08-24'],
  ['data.js', data, 'longtermcare.or.kr'],
  ['data.js', data, 'law.go.kr'],
];

let failed = 0;
for (const [file, content, token] of required) {
  if (!content.includes(token)) {
    failed++;
    console.error(`FAIL ${file}: missing "${token}"`);
  }
}
if (failed) process.exit(1);
console.log('disclaimer verification passed');
