// H2 — 홈페이지가 사이트 정체성을 설명하고 도구·신뢰 페이지로 모두 연결되는지
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = readFileSync(join(root, 'index.html'), 'utf8');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

// 루트가 계산기로 되돌아가 있지 않은지 (이동 회귀 방지)
if (doc.includes('src="calc.js"') || doc.includes('id="gradeSeg"'))
  fail('루트가 아직 계산기다 — /longtermcare/ 이동이 되돌아갔다');

const t = doc.match(/<title>([^<]+)<\/title>/);
if (!t) fail('title 없음');
else if (!t[1].includes('살면서 한 번은 겪는 일')) fail(`title이 사이트명이 아님: ${t[1]}`);

const desc = doc.match(/<meta name="description" content="([^"]+)"/);
if (!desc) fail('description 메타 없음');
else if (desc[1].length < 40) fail(`description이 너무 짧음: ${desc[1].length}자`);

for (const r of ['살면서 한 번은 겪는 일', '원문을 근거', '기준일', '추정치', '브라우저 안에서만'])
  if (!doc.includes(r)) fail(`홈페이지 필수 문구 누락: "${r}"`);

// 본문(푸터 제외)에서 도구 2개 + 신뢰 페이지 3종으로 연결
const body = doc.split('<footer>')[0];
const links = [
  ['/longtermcare/', '장기요양 계산기'], ['/silup/', '실업급여 계산기'],
  ['/about/', '소개'], ['/privacy/', '개인정보처리방침'], ['/contact/', '문의'],
];
for (const [href, label] of links)
  if (!body.includes(`href="${href}"`)) fail(`본문에 ${label} 링크 없음 (${href})`);

// 각 갈래 카드에 설명이, 계산기 카드에는 법적 기준 표기가 함께 있는지 (v2)
const cards = [...body.matchAll(/<div class="ccard[^"]*">([\s\S]*?)\n      <\/div>/g)];
if (cards.length < 6) fail(`갈래 카드가 6개 미만: ${cards.length}`);
let toolCards = 0;
for (const [, inner] of cards) {
  if (!/class="desc"/.test(inner)) fail('갈래 카드에 설명 없음');
  if (/class="pill-tool"/.test(inner)) {
    toolCards++;
    if (!/class="basis"/.test(inner)) fail('계산기 카드에 기준 표기 없음');
  }
}
if (toolCards < 2) fail(`계산기 카드가 2개 미만: ${toolCards}`);

const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
if (text.length < 400) fail(`홈 본문이 너무 짧음: ${text.length}자`);

// 양성 대조군 — 카드 파서가 실제로 동작하는지
const probe = '<div class="ccard cat-x">\n<div class="desc">d</div>\n      </div>';
if (![...probe.matchAll(/<div class="ccard[^"]*">([\s\S]*?)\n      <\/div>/g)].length)
  fail('내부 오류: 갈래 카드 파서가 양성 대조군을 인식하지 못함');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('home verification passed');
