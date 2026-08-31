// D6 — 기존 게이트를 한 번에 돌려 회귀를 잡는다
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const cwd = join(dirname(fileURLToPath(import.meta.url)), '..');
const S = [
  ['링크', 'node', ['scripts/check-links.mjs'], 'link verification passed', cwd],
  ['SEO', 'node', ['scripts/check-seo.mjs'], 'seo verification passed', cwd],
  ['robots', 'node', ['scripts/check-robots-rules.mjs'], 'robots rules verification passed', cwd],
  ['홈', 'node', ['scripts/check-home.mjs'], 'home verification passed', cwd],
  ['가이드 독창성', 'node', ['scripts/check-guide-originality.mjs'], 'guide originality verification passed', cwd],
  ['애드센스 스위트', 'node', ['scripts/check-adsense-suite.mjs'], 'adsense suite verification passed', cwd],
  ['장기요양 스위트', 'node', ['scripts/check-ltc-suite.mjs'], 'ltc suite verification passed', cwd],
];
let failed = 0;
for (const [name, bin, args, expect, wd] of S) {
  let out = '';
  try { out = execFileSync(bin, args, { cwd: wd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { failed++; console.error(`FAIL ${name}: ${((e.stdout||'')+(e.stderr||'')).trim().slice(0,240)}`); continue; }
  if (!out.includes(expect)) { failed++; console.error(`FAIL ${name}: "${expect}" 미출력`); }
}
if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('regression suite verification passed');
