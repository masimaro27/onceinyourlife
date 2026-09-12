// G9 — v2 공통 크롬: 배포 대상 전 페이지에 topbar가, 홈 제외 전 페이지에 크럼이 있는지
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

const xml = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const pages = [...xml.matchAll(/<loc>https:\/\/onceinyourlife\.co\.kr([^<]*)<\/loc>/g)].map((m) => m[1]);
if (pages.length < 10) fail(`sitemap에서 읽은 페이지가 너무 적음: ${pages.length}`);

for (const u of pages) {
  const f = join(root, u === '/' ? 'index.html' : u.slice(1) + 'index.html');
  const s = readFileSync(f, 'utf8');
  if (!s.includes('class="topbar"')) fail(`${u} topbar 없음`);
  if (!s.includes('class="brand" href="/"')) fail(`${u} 브랜드 홈 링크 없음`);
  if (!s.includes('fonts.googleapis.com/css2?family=Gowun+Batang')) fail(`${u} 명조 글꼴 링크 없음`);
  if (u !== '/') {
    if (!s.includes('class="crumb"')) fail(`${u} 크럼 없음`);
    if (!/class="crumb"><a href="\/">홈<\/a>/.test(s)) fail(`${u} 크럼이 홈에서 시작하지 않음`);
    const crumbLinks = (s.match(/class="crumb">[\s\S]*?<\/nav>/)?.[0].match(/<a /g) || []).length;
    if (!s.includes('aria-current="page"') && crumbLinks < 2)
      fail(`${u} 크럼에 현재 항목 표기도, 2단 이상 상위 경로도 없음`);
  }
  if ((s.match(/class="topbar"/g) || []).length > 1) fail(`${u} topbar 중복`);
}

// 양성 대조군 — 크럼 검사 정규식이 실제로 잡는지
if (/class="crumb"><a href="\/">홈<\/a>/.test('<nav class="crumb"><a href="/x/">가이드</a>'))
  fail('내부 오류: 크럼 검사기가 음성 사례를 통과시킴');
if (!/class="crumb"><a href="\/">홈<\/a>/.test('<nav class="crumb"><a href="/">홈</a><span>›</span>'))
  fail('내부 오류: 크럼 검사기가 양성 대조군을 잡지 못함');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log(`v2 chrome verification passed (${pages.length} pages)`);
