// S1 — sitemap.xml이 실제 공개 페이지와 정확히 일치하는지 (누락 0, 유령 URL 0)
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://onceinyourlife.co.kr';
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

if (!existsSync(join(root, 'sitemap.xml'))) { console.error('FAIL sitemap.xml 없음'); process.exit(1); }
const xml = readFileSync(join(root, 'sitemap.xml'), 'utf8');

// XML 기본 정합성
if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(xml.trim())) fail('XML 선언 없음');
if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) fail('sitemap 네임스페이스 없음');
const opens = (xml.match(/<url>/g) || []).length, closes = (xml.match(/<\/url>/g) || []).length;
if (opens !== closes) fail(`<url> 태그 불균형: ${opens} vs ${closes}`);

// sitemap이 주장하는 URL
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) fail('<loc> 항목이 없음');
for (const l of locs) if (!l.startsWith(ORIGIN)) fail(`절대 URL이 아니거나 도메인이 다름: ${l}`);
for (const l of locs) if (!/\/$/.test(l)) fail(`디렉터리 URL은 슬래시로 끝나야 함: ${l}`);
if (new Set(locs).size !== locs.length) fail('중복 <loc> 있음');

// lastmod 형식
for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1])) fail(`lastmod 형식 오류: ${m[1]}`);

// 실제 파일시스템의 공개 페이지와 대조
const SKIP = new Set(['.git', 'node_modules', '.unlazy', 'scripts', 'test', 'docs', 'assets']);
const findPages = (dir, acc = []) => {
  if (existsSync(join(dir, 'index.html'))) acc.push(dir);
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) findPages(p, acc);
  }
  return acc;
};
const actual = findPages(root).map((d) => {
  const rel = relative(root, d);
  return ORIGIN + (rel === '' ? '/' : `/${rel.split(/[\\/]/).join('/')}/`);
}).sort();

for (const a of actual) if (!locs.includes(a)) fail(`sitemap 누락: ${a}`);
for (const l of locs) if (!actual.includes(l)) fail(`실재하지 않는 URL이 sitemap에 있음: ${l}`);

// 생성기와 파일이 동기 상태인지 (손으로 고쳐 드리프트가 생겼는지)
try {
  execFileSync('node', ['scripts/gen-sitemap.mjs', '--check'], { cwd: root, stdio: 'pipe' });
} catch (e) {
  fail(`생성기와 sitemap.xml이 불일치 — ${(e.stdout || e.stderr || '').toString().trim().slice(0, 160)}`);
}

// 양성 대조군 — 대조 로직이 실제로 차이를 잡는지
if (actual.includes(ORIGIN + '/__definitely_missing__/'))
  fail('내부 오류: 페이지 탐색기가 존재하지 않는 경로를 반환함');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log(`seo verification passed (${locs.length} urls)`);
