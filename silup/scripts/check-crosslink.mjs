// 상호 링크 게이트 — /longtermcare 와 /silup 이 서로를 가리키는지 확인
// (2026-08-30 홈페이지 신설로 장기요양 계산기가 루트에서 /longtermcare/ 로 이동)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ltcHtml = readFileSync(join(repo, 'longtermcare', 'index.html'), 'utf8');
const silupHtml = readFileSync(join(repo, 'silup', 'index.html'), 'utf8');

let failed = 0;
function need(name, cond, detail) {
  if (!cond) { failed++; console.error(`FAIL ${name}: ${detail}`); }
}

need('ltc→silup', /href="\/silup\/"/.test(ltcHtml), '장기요양 계산기에 /silup/ 링크 없음');
need('silup→ltc', /href="\/longtermcare\/"/.test(silupHtml), 'silup 에 /longtermcare/ 링크 없음');
// 루트 도구가 여전히 장기요양 계산기여야 한다 (경로를 바꾸지 않았음을 확인)
need('ltc.intact', ltcHtml.includes('장기요양 본인부담금 계산기'), '/longtermcare/ 제목이 바뀜');
need('ltc.script', ltcHtml.includes('src="calc.js"'), '/longtermcare/ 스크립트 참조가 깨짐');

if (failed) process.exit(1);
console.log('crosslink verification passed');
