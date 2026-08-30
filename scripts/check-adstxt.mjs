// G7 — ads.txt가 유효한 AdSense 형식인지 검증
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = join(root, 'ads.txt');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

if (!existsSync(p)) {
  console.error('FAIL ads.txt 없음 — AdSense 게시자 ID(pub-) 수령 후 생성할 것');
  process.exit(1);
}
const lines = readFileSync(p, 'utf8').split(/\r?\n/)
  .map(l => l.replace(/#.*$/, '').trim()).filter(Boolean);

if (!lines.length) fail('ads.txt에 유효한 레코드가 없음');

// google.com, pub-<16자리>, DIRECT, f08c47fec0942fa0
const RE = /^google\.com,\s*pub-\d{16},\s*DIRECT,\s*f08c47fec0942fa0$/;
let google = 0;
for (const l of lines) {
  const parts = l.split(',').map(s => s.trim());
  if (parts.length < 3) { fail(`레코드 필드 부족: "${l}"`); continue; }
  if (!['DIRECT', 'RESELLER'].includes(parts[2])) fail(`관계 필드가 DIRECT/RESELLER가 아님: "${l}"`);
  if (parts[0] === 'google.com') {
    google++;
    if (!RE.test(l)) fail(`AdSense 레코드 형식 불일치: "${l}"`);
    if (/pub-0{16}|pub-1234/.test(l)) fail(`자리표시자 게시자 ID가 남아 있음: "${l}"`);
  }
}
if (!google) fail('google.com AdSense 레코드가 없음');

// 양성 대조군 — 형식 검사기가 잘못된 줄을 실제로 거르는지
if (RE.test('google.com, pub-123, DIRECT, f08c47fec0942fa0'))
  fail('내부 오류: 형식 검사기가 잘못된 pub ID를 통과시킴');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('ads.txt verification passed');
