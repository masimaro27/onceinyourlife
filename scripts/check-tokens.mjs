// D5 — 색과 폰트 크기가 토큰으로만 지정되는지, 스케일이 7단계 이하인지
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = 'assets/tokens.css';
// 페이지 목록은 sitemap에서 유도한다 — 글이 늘어도 손대지 않기 위함
const sm = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const FILES = ['assets/site.css', ...[...sm.matchAll(/<loc>https:\/\/onceinyourlife\.co\.kr(\/[^<]*)<\/loc>/g)]
  .map((m) => (m[1] === '/' ? 'index.html' : m[1].replace(/^\//, '') + 'index.html'))];
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

// (1) 토큰 파일 밖에 색 리터럴이 없어야 한다
for (const f of FILES) {
  const s = readFileSync(join(root, f), 'utf8');
  const hits = [...new Set(s.match(/#[0-9a-fA-F]{3,8}\b/g) || [])];
  if (hits.length) fail(`${f}: 색 리터럴 ${hits.join(', ')}`);
  const rgb = [...new Set(s.match(/rgba?\([\d\s,.%]+\)/g) || [])];
  if (rgb.length) fail(`${f}: rgb 리터럴 ${rgb.join(', ')}`);
}

// (2) 폰트 크기가 토큰으로만 지정되어야 한다
for (const f of FILES) {
  const s = readFileSync(join(root, f), 'utf8');
  const lit = [...new Set((s.match(/font-size:\s*[^;}]+/g) || [])
    .filter((d) => !/var\(--fs-/.test(d)))];
  if (lit.length) fail(`${f}: 토큰 아닌 폰트 크기 ${lit.join(' / ')}`);
}

// (3) 스케일 단계 수
const tok = readFileSync(join(root, TOKENS), 'utf8');
const scale = [...new Set((tok.match(/--fs-[a-z0-9]+:\s*[^;]+/g) || []).map((s) => s.split(':')[1].trim()))];
if (scale.length > 7) fail(`타이포 스케일 ${scale.length}단계 (상한 7): ${scale.join(', ')}`);

// (4) 다크 모드 정의가 토큰 파일에 존재
if (!/@media \(prefers-color-scheme: dark\)/.test(tok)) fail('tokens.css에 다크 모드 정의 없음');

// (5) 전 페이지가 토큰 스타일시트를 링크
for (const f of FILES.filter((f) => f.endsWith('.html'))) {
  if (!readFileSync(join(root, f), 'utf8').includes('/assets/tokens.css'))
    fail(`${f}: tokens.css 미링크`);
}

// 양성 대조군 — 리터럴 탐지기가 실제로 잡는지
if (!('a { color: ' + '#abc' + '; }').match(/#[0-9a-fA-F]{3,8}\b/))
  fail('내부 오류: 색 리터럴 탐지기가 양성 대조군을 잡지 못함');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log(`token verification passed (스케일 ${scale.length}단계)`);
