// G1 — 신뢰 페이지 3종의 존재·구조·메타 검증
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  ['privacy', '개인정보처리방침'],
  ['contact', '문의'],
  ['about', '소개'],
];
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

if (!existsSync(join(root, 'assets/site.css'))) fail('assets/site.css 없음');

for (const [dir, kw] of pages) {
  const p = join(root, dir, 'index.html');
  if (!existsSync(p)) { fail(`${dir}/index.html 없음`); continue; }
  const h = readFileSync(p, 'utf8');
  if (!/^<!doctype html>/i.test(h.trim())) fail(`${dir}: doctype 없음`);
  if (!h.includes('<html lang="ko">')) fail(`${dir}: lang="ko" 없음`);
  if (!h.includes('name="viewport"')) fail(`${dir}: viewport 메타 없음`);
  const t = h.match(/<title>([^<]+)<\/title>/);
  if (!t) fail(`${dir}: title 없음`);
  else if (!t[1].includes(kw)) fail(`${dir}: title에 "${kw}" 없음 (실제: ${t[1]})`);
  const d = h.match(/<meta name="description" content="([^"]+)"/);
  if (!d) fail(`${dir}: description 메타 없음`);
  else if (d[1].length < 40) fail(`${dir}: description이 너무 짧음 (${d[1].length}자)`);
  if (!h.includes('href="/assets/site.css"')) fail(`${dir}: 공통 스타일시트 미연결`);
}
if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('static pages verification passed');
