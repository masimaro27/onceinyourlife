// H5 — 애드센스 게이트 9개가 새 구조에서도 회귀 없이 통과하는지
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = join(dirname(fileURLToPath(import.meta.url)), '..');
const suite = [
  ['G1 정적 페이지', 'node', ['scripts/check-static-pages.mjs'], 'static pages verification passed'],
  ['G2 개인정보방침', 'node', ['scripts/check-privacy.mjs'], 'privacy policy verification passed'],
  ['G3 문의', 'node', ['scripts/check-contact.mjs'], 'contact verification passed'],
  ['G4 소개', 'node', ['scripts/check-about.mjs'], 'about verification passed'],
  ['G5 링크', 'node', ['scripts/check-links.mjs'], 'link verification passed'],
  ['G6 페이지 UI', 'python3', ['scripts/ui_check_pages.py'], 'pages UI verification passed'],
  ['G7 ads.txt', 'node', ['scripts/check-adstxt.mjs'], 'ads.txt verification passed'],
  ['silup 상호링크', 'node', ['scripts/check-crosslink.mjs'], 'crosslink verification passed'],
  ['silup UI', 'python3', ['scripts/ui_check.py'], 'UI verification passed'],
  ['silup 고지문구', 'node', ['scripts/check-disclaimer.mjs'], 'disclaimer verification passed'],
];
let failed = 0;
for (const [name, bin, args, expect] of suite) {
  const runCwd = name.startsWith('silup') ? join(cwd, 'silup') : cwd;
  let out = '';
  try {
    out = execFileSync(bin, args, { cwd: runCwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}: exit=${e.status} ${(e.stdout || '') + (e.stderr || '')}`.trim().slice(0, 300));
    continue;
  }
  if (!out.includes(expect)) { failed++; console.error(`FAIL ${name}: "${expect}" 미출력`); }
}
if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('adsense suite verification passed');
