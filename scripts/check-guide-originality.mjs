// 가이드 글의 중복 콘텐츠 방어 — 대응 블로그 발행본과의 중복률을 실측한다.
// 블로그 원문이 없는 환경(CI 등)에서는 대조를 건너뛰되 그 사실을 출력한다.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(homedir(), 'Documents', '_개인', '블로그');
const SENTENCE_MAX = 0.0;   // 완전 일치 문장은 한 개도 허용하지 않는다
const NGRAM_MAX = 20.0;     // 12자 n-gram 중복률 상한(%)

// 글 → 대조할 블로그 원문 (설계 문서의 재료 매핑)
const PAIRS = [
  ['longtermcare/guide/monthly-limit/index.html', ['6_장기요양등급혜택']],
  ['longtermcare/guide/copay-rate/index.html', ['6_장기요양등급혜택']],
  ['longtermcare/guide/home-vs-facility/index.html', ['6_장기요양등급혜택', '7_요양원등급']],
  ['longtermcare/guide/over-limit/index.html', ['6_장기요양등급혜택']],
  ['longtermcare/guide/not-covered/index.html', ['6_장기요양등급혜택', '7_요양원등급']],
  ['silup/guide/how-it-works/index.html', ['2_실업급여계산']],
  ['silup/guide/average-wage/index.html', ['2_실업급여계산']],
  ['silup/guide/caps/index.html', ['2_실업급여계산']],
];

let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const sents = (t) => t.replace(/\s+/g, ' ').trim().split(/(?<=[.!?。]|다\.|니다\.)\s+/)
  .map((s) => s.replace(/[^가-힣a-zA-Z0-9]/g, '')).filter((s) => s.length >= 12);
const grams = (text, n = 12) => {
  const S = new Set();
  for (let i = 0; i + n <= text.length; i++) S.add(text.slice(i, i + n));
  return S;
};

if (!existsSync(BLOG)) {
  console.log('originality check skipped (블로그 원문 없음) — 대조 없이 통과시키지 않고 명시적으로 건너뜀');
  process.exit(0);
}

for (const [page, sources] of PAIRS) {
  const p = join(root, page);
  if (!existsSync(p)) { fail(`${page} 없음`); continue; }
  const mine = sents(strip(readFileSync(p, 'utf8')));
  if (!mine.length) { fail(`${page}: 비교할 본문이 없음`); continue; }

  const theirs = new Set();
  for (const s of sources) {
    const f = join(BLOG, s, '발행본.md');
    if (!existsSync(f)) { fail(`${page}: 대조 원문 없음 — ${s}`); continue; }
    for (const x of sents(readFileSync(f, 'utf8'))) theirs.add(x);
  }
  if (!theirs.size) { fail(`${page}: 대조 문장이 0개`); continue; }

  const hit = mine.filter((s) => theirs.has(s));
  const sentPct = (hit.length / mine.length) * 100;
  if (sentPct > SENTENCE_MAX) {
    fail(`${page}: 블로그와 완전히 같은 문장 ${hit.length}개 (${sentPct.toFixed(1)}%)`);
    hit.slice(0, 3).forEach((h) => console.error(`       · ${h.slice(0, 50)}...`));
  }

  const mg = grams(mine.join('')), tg = grams([...theirs].join(''));
  let common = 0;
  for (const g of mg) if (tg.has(g)) common++;
  const ngPct = (common / mg.size) * 100;
  if (ngPct > NGRAM_MAX) fail(`${page}: 12자 n-gram 중복률 ${ngPct.toFixed(1)}% > ${NGRAM_MAX}%`);
  console.log(`  ${page} — 문장 일치 ${sentPct.toFixed(1)}% / n-gram ${ngPct.toFixed(1)}%`);
}

// 양성 대조군 — 탐지기가 실제 중복을 잡는지 증명한다
const probe = '이 문장은 완전히 동일한 문장입니다 중복 탐지를 확인하기 위한 대조군입니다';
const pa = sents(probe), pb = new Set(sents(probe));
if (!pa.filter((s) => pb.has(s)).length)
  fail('내부 오류: 중복 탐지기가 동일 문장을 잡지 못함 — 위 결과를 신뢰할 수 없음');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('guide originality verification passed');
