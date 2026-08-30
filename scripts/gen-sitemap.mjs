// sitemap.xml 생성기 — 저장소의 공개 페이지(index.html)를 훑어 만든다.
// 페이지가 늘 때마다 손으로 고치지 않도록 파일시스템을 진실의 원천으로 삼는다.
// 사용: node scripts/gen-sitemap.mjs [--check]
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://onceinyourlife.co.kr';
const SKIP = new Set(['.git', 'node_modules', '.unlazy', 'scripts', 'test', 'docs', 'assets']);

// 공개 페이지 = index.html 이 있는 디렉터리. 도구 내부 scripts/test 는 제외.
function findPages(dir, acc = []) {
  if (existsSync(join(dir, 'index.html'))) acc.push(dir);
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) findPages(p, acc);
  }
  return acc;
}

// 마지막 커밋일을 lastmod 로 사용 (없으면 파일 mtime)
function lastmod(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', relative(root, file)],
      { cwd: root, encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* git 미사용 환경 */ }
  return statSync(file).mtime.toISOString().slice(0, 10);
}

const PRIORITY = { '/': '1.0' };
const pages = findPages(root).sort();
const entries = pages.map((d) => {
  const rel = relative(root, d);
  const loc = rel === '' ? '/' : `/${rel.split(/[\\/]/).join('/')}/`;
  return { loc, lastmod: lastmod(join(d, 'index.html')), priority: PRIORITY[loc] || '0.8' };
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${ORIGIN}${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const out = join(root, 'sitemap.xml');
if (process.argv.includes('--check')) {
  const cur = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (cur !== xml) {
    console.error('FAIL sitemap.xml이 실제 페이지 구성과 다릅니다. `node scripts/gen-sitemap.mjs` 로 재생성하세요.');
    process.exit(1);
  }
  console.log(`sitemap up to date (${entries.length} urls)`);
} else {
  writeFileSync(out, xml);
  console.log(`sitemap.xml 생성: ${entries.length} urls`);
  for (const e of entries) console.log(`  ${e.loc}  ${e.lastmod}`);
}
