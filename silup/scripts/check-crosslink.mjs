// 상호 링크 게이트 — 루트 도구와 /silup 이 서로를 가리키는지 확인
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rootHtml = readFileSync(join(repo, 'index.html'), 'utf8');
const silupHtml = readFileSync(join(repo, 'silup', 'index.html'), 'utf8');

let failed = 0;
function need(name, cond, detail) {
  if (!cond) { failed++; console.error(`FAIL ${name}: ${detail}`); }
}

need('root→silup', /href="silup\/"/.test(rootHtml), '루트에 silup/ 링크 없음');
need('silup→root', /href="\.\.\/"/.test(silupHtml), 'silup 에 루트 링크 없음');
// 루트 도구가 여전히 장기요양 계산기여야 한다 (경로를 바꾸지 않았음을 확인)
need('root.intact', rootHtml.includes('장기요양 본인부담금 계산기'), '루트 제목이 바뀜');
need('root.script', rootHtml.includes('src="calc.js"'), '루트 스크립트 참조가 깨짐');

if (failed) process.exit(1);
console.log('crosslink verification passed');
