// 문서 게이트 — 스펙·계획 문서가 존재하고 git에 커밋되어 있는지 확인
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 이동 후 저장소 루트는 두 단계 위 (longtermcare/scripts → repo)
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const docs = [
  'docs/specs/2026-08-26-ltc-copay-calculator-design.md',
  'PLAN.md',
];

let failed = 0;
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split('\n');
for (const d of docs) {
  if (!existsSync(join(root, d))) { failed++; console.error(`FAIL missing file: ${d}`); continue; }
  if (!tracked.includes(d)) { failed++; console.error(`FAIL not committed: ${d}`); }
}
if (failed) process.exit(1);
console.log('docs verification passed');
