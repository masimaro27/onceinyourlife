// H1 — 이동한 장기요양 계산기의 기존 게이트 4개를 새 위치에서 실행한다
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cwd = join(root, 'longtermcare');
const suite = [
  ['계산 엔진', 'node', ['test/calc.test.mjs'], 'ALL TESTS PASSED'],
  ['UI', 'python3', ['scripts/ui_check.py'], 'UI verification passed'],
  ['고지 문구', 'node', ['scripts/check-disclaimer.mjs'], 'disclaimer verification passed'],
  ['문서', 'node', ['scripts/check-docs.mjs'], 'docs verification passed'],
];
let failed = 0;
for (const [name, bin, args, expect] of suite) {
  let out = '';
  try {
    out = execFileSync(bin, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}: exit=${e.status} ${(e.stdout || '') + (e.stderr || '')}`.trim().slice(0, 300));
    continue;
  }
  if (!out.includes(expect)) { failed++; console.error(`FAIL ${name}: "${expect}" 미출력 — ${out.trim().slice(0, 200)}`); }
}
// 양성 대조군 — 실패를 실제로 잡는지
try { execFileSync('node', ['-e', 'process.exit(1)'], { cwd, stdio: 'ignore' }); failed++; console.error('내부 오류: 실패한 프로세스를 통과시킴'); } catch { /* 기대대로 예외 */ }

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('ltc suite verification passed');
