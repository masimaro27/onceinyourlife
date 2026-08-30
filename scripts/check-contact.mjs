// G3 — 문의 페이지의 연락 수단 유효성 + 회사 이메일 부재(부정 검사)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

const doc = readFileSync(join(root, 'contact/index.html'), 'utf8');

// (1) 동작하는 mailto 연락 수단
const mails = [...doc.matchAll(/mailto:([^"]+)"/g)].map(m => m[1]);
if (!mails.length) fail('문의 페이지에 mailto 링크 없음');
const EMAIL = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
for (const m of mails) if (!EMAIL.test(m)) fail(`유효한 이메일이 아님: "${m}"`);

// (2) 문의 안내에 필요한 최소 내용
for (const r of ['오류', '제보', '1577-1000', '1350'])
  if (!doc.includes(r)) fail(`문의 페이지 필수 안내 누락: "${r}"`);

// (3) 부정 검사 — 저장소 전체에 회사 이메일/도메인이 없어야 한다
const BAD = /jobis\.co/;
const walk = (d, acc = []) => {
  for (const e of readdirSync(d)) {
    if (['.git', 'node_modules', '.unlazy'].includes(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
};
const SELF = fileURLToPath(import.meta.url);
const offenders = walk(root).filter(f => {
  if (f === SELF) return false;
  try { return BAD.test(readFileSync(f, 'utf8')); } catch { return false; }
}).map(f => relative(root, f));
if (offenders.length) fail(`회사 이메일/도메인이 저장소에 존재: ${offenders.join(', ')}`);

// (4) 양성 대조군 — 부정 검사가 실제로 탐지 능력이 있음을 증명한 뒤에만 (3)의 부재를 신뢰
const control = 'contact: someone@' + ['jo', 'bis', '.', 'co'].join('');
if (!BAD.test(control)) fail('내부 오류: 부정 검사 패턴이 양성 대조군을 탐지하지 못함 — (3)의 통과를 신뢰할 수 없음');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('contact verification passed');
