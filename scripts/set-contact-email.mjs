// 문의 이메일을 페이지에 주입한다. 사용: node scripts/set-contact-email.mjs you@example.com
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const email = process.argv[2];
const SENTINEL = '__CONTACT_' + 'EMAIL__';

if (!email) { console.error('사용법: node scripts/set-contact-email.mjs <이메일>'); process.exit(1); }
if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email)) {
  console.error(`유효한 이메일이 아닙니다: "${email}"`); process.exit(1);
}
if (new RegExp(['jo','bis','\\.','co'].join('')).test(email)) {
  console.error('회사 도메인 주소는 공개 페이지에 넣지 않습니다.'); process.exit(1);
}

let touched = 0;
for (const f of ['privacy/index.html', 'contact/index.html']) {
  const p = join(root, f);
  const s = readFileSync(p, 'utf8');
  if (!s.includes(SENTINEL)) { console.log(`SKIP ${f} (자리표시자 없음)`); continue; }
  writeFileSync(p, s.split(SENTINEL).join(email));
  console.log(`OK   ${f}`);
  touched++;
}
if (!touched) { console.error('주입할 자리표시자를 찾지 못했습니다.'); process.exit(1); }
console.log(`문의 이메일 주입 완료: ${email}`);
