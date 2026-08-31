// G5 — 5개 페이지의 푸터 내비게이션 + 내부 링크 해소(깨진 링크 0)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sm = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const PAGES = [...sm.matchAll(/<loc>https:\/\/onceinyourlife\.co\.kr(\/[^<]*)<\/loc>/g)]
  .map((m) => (m[1] === '/' ? 'index.html' : m[1].replace(/^\//, '') + 'index.html'));
const MUST = ['/', '/longtermcare/', '/silup/', '/about/', '/privacy/', '/contact/'];
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

// 루트 상대 경로를 실제 파일로 해소
const resolve = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean.startsWith('/')) return null;          // 외부/상대 링크는 별도 처리
  const p = join(root, clean);
  if (existsSync(p) && statSync(p).isDirectory()) return existsSync(join(p, 'index.html'));
  return existsSync(p);
};

for (const page of PAGES) {
  const p = join(root, page);
  if (!existsSync(p)) { fail(`${page} 없음`); continue; }
  const html = readFileSync(p, 'utf8');

  // (1) 푸터 내비게이션에 5개 링크 전부
  const foot = html.slice(html.indexOf('<footer>'));
  if (!foot) { fail(`${page}: footer 없음`); continue; }
  for (const href of MUST)
    if (!foot.includes(`href="${href}"`)) fail(`${page}: 푸터에 ${href} 링크 없음`);

  // (2) 내부 링크 해소
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (href.startsWith('/')) {
      if (!resolve(href)) fail(`${page}: 깨진 내부 링크 ${href}`);
    } else {
      const base = dirname(join(root, page));
      const t = join(base, href.split('#')[0].split('?')[0]);
      const ok = existsSync(t) && (statSync(t).isDirectory() ? existsSync(join(t, 'index.html')) : true);
      if (!ok) fail(`${page}: 깨진 상대 링크 ${href}`);
    }
  }
}

// (3) 양성 대조군 — 링크 해소기가 실제로 부재를 탐지하는지
if (resolve('/__definitely_missing__/')) fail('내부 오류: 링크 해소기가 존재하지 않는 경로를 통과시킴');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('link verification passed');
