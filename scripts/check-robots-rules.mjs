// S2 — robots.txt가 콘텐츠를 막지 않고 비콘텐츠만 막는지, sitemap을 절대 URL로 가리키는지
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(root, 'robots.txt'))) { console.error('FAIL robots.txt 없음'); process.exit(1); }
const txt = readFileSync(join(root, 'robots.txt'), 'utf8');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

const lines = txt.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
const directives = lines.map((l) => {
  const i = l.indexOf(':');
  return [l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()];
});
const disallows = directives.filter(([k]) => k === 'disallow').map(([, v]) => v);
const allows = directives.filter(([k]) => k === 'allow').map(([, v]) => v);

if (!directives.some(([k]) => k === 'user-agent')) fail('User-agent 지시자 없음');

// 치명적 실수 — 전체 차단
if (disallows.includes('/')) fail('사이트 전체를 차단하고 있음 (Disallow: /)');

// robots.txt 규칙을 단순 평가 (Google 규칙: 가장 긴 일치가 우선, 동률이면 Allow 우선)
const matches = (rule, path) => {
  if (!rule) return false;
  // 끝의 $ 앵커는 이스케이프 전에 떼어낸다 (이스케이프하면 \$ 가 되어 slice가 깨진다)
  const anchored = rule.endsWith("$");
  const raw = anchored ? rule.slice(0, -1) : rule;
  const esc = raw.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + esc + (anchored ? "$" : "")).test(path);
};
const allowed = (path) => {
  const a = allows.filter((r) => matches(r, path)).reduce((m, r) => Math.max(m, r.length), -1);
  const d = disallows.filter((r) => matches(r, path)).reduce((m, r) => Math.max(m, r.length), -1);
  if (d < 0) return true;
  return a >= d;
};

// 반드시 크롤 가능해야 하는 것
const MUST_ALLOW = ['/', '/longtermcare/', '/silup/', '/about/', '/privacy/', '/contact/',
                    '/assets/site.css', '/ads.txt', '/sitemap.xml'];
for (const p of MUST_ALLOW) if (!allowed(p)) fail(`차단하면 안 되는 경로가 차단됨: ${p}`);

// 차단되어야 하는 것 (얇은 콘텐츠·비공개용 파일)
const MUST_BLOCK = ['/scripts/check-seo.mjs', '/docs/specs/x.md', '/longtermcare/test/calc.test.mjs',
                    '/silup/scripts/ui_check.py', '/README.md'];
for (const p of MUST_BLOCK) if (allowed(p)) fail(`비콘텐츠 경로가 차단되지 않음: ${p}`);

// sitemap 참조
const sm = directives.find(([k]) => k === 'sitemap');
if (!sm) fail('Sitemap 지시자 없음');
else if (sm[1] !== 'https://onceinyourlife.co.kr/sitemap.xml') fail(`Sitemap URL이 절대 URL이 아니거나 다름: ${sm[1]}`);

// 양성 대조군 — 평가기가 차단을 실제로 판정하는지
if (allowed('/scripts/')) fail('내부 오류: 규칙 평가기가 명시적 Disallow를 통과시킴');
if (!allowed('/__unlisted__/')) fail('내부 오류: 규칙 평가기가 규칙 없는 경로를 차단함');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('robots rules verification passed');
