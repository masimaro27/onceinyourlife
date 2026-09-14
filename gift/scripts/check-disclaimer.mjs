// G6 — 기준일·출처·면책·「다루지 않는 것」 고지
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const data = readFileSync(join(root, 'data.js'), 'utf8');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

const required = [
  ['index.html', html, '참고용 추정치'],
  ['index.html', html, '126'],                    // 국세청 상담센터
  ['index.html', html, '2026년 9월 2일'],          // 기준일
  ['index.html', html, '거주자'],                  // 적용 범위
  ['index.html', html, '평가는 따로'],             // 재산 평가 제외
  ['index.html', html, '양도소득세'],              // 부담부증여 다른 세목
  ['index.html', html, '취득세'],
  ['index.html', html, '가산세'],
  ['index.html', html, '근거'],
  ['data.js', data, '2026-09-02'],
  ['data.js', data, 'law.go.kr'],
  ['data.js', data, 'nts.go.kr'],
  ['data.js', data, '아카이브에 없는 값은 넣지 않는다'],
];
for (const [file, content, token] of required) {
  if (!content.includes(token)) fail(`${file}: "${token}" 없음`);
}
// 출처가 화면에 렌더되는지
if (!html.includes('id="sourceList"')) fail('출처 목록 자리 없음');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('disclaimer verification passed');
