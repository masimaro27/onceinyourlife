// G4 — 소개 페이지가 사이트 정체성·운영 주체·도구 2개를 설명하고 링크하는지
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = readFileSync(join(root, 'about/index.html'), 'utf8');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

for (const r of ['살면서 한 번은 겪는 일', '장기요양', '실업급여', '개인이 만들고 운영', '추정치', '기준일'])
  if (!doc.includes(r)) fail(`소개 페이지 필수 내용 누락: "${r}"`);

// 두 도구로 가는 본문 링크(푸터 nav 제외)가 실제로 존재하는지
const body = doc.split('<footer>')[0];
for (const [href, label] of [['href="/longtermcare/"', '장기요양 계산기'], ['href="/silup/"', '실업급여 계산기']]) {
  const links = [...body.matchAll(/<a class="other-tool" href="([^"]+)"[\s\S]*?<\/a>/g)];
  if (!links.some(m => `href="${m[1]}"` === href)) fail(`본문에 ${label} 카드 링크 없음 (${href})`);
}
// 본문 분량 — 얇은 페이지는 AdSense low value content 사유
const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
if (text.length < 500) fail(`소개 본문이 너무 짧음: ${text.length}자 (최소 500자)`);

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('about verification passed');
