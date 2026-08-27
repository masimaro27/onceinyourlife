// 고지 문구 게이트 — silup/index.html 과 silup/data.js 의 필수 문구 확인
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const data = readFileSync(join(root, 'data.js'), 'utf8');

const required = [
  ['index.html', html, '참고용 추정치'],
  ['index.html', html, '1350'],
  ['index.html', html, '원 미만'],
  ['index.html', html, '수급기간'],
  ['index.html', html, '180일'],
  ['index.html', html, '시행령 제68조'],
  ['index.html', html, '68,100원'],
  ['index.html', html, '2026년 8월 28일'],
  ['index.html', html, '출처'],
  ['data.js', data, '2026-08-28'],
  ['data.js', data, 'law.go.kr'],
  ['data.js', data, 'minimumwage.go.kr'],
  ['data.js', data, 'ei.work24.go.kr'],
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
