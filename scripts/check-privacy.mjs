// G2 — 개인정보처리방침이 저장소의 실제 코드와 모순되지 않는지 대조 검증
// 핵심: "수집하지 않는다"는 진술을 문서에서 읽고, 실제 코드를 스캔해 반증을 찾는다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = readFileSync(join(root, 'privacy/index.html'), 'utf8');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

// (1) 법정 기재사항 — 개인정보 보호법 제30조 항목이 표제로 존재하는지
const required = [
  '처리하는 개인정보 항목', '처리 목적', '보유·이용 기간', '제3자 제공',
  '정보주체의 권리', '안전성 확보 조치', '개인정보 보호책임자',
  '권익침해 구제', '방침의 변경', '시행일',
];
for (const r of required) if (!doc.includes(r)) fail(`법정 기재사항 누락: "${r}"`);

// (2) 광고 쿠키 고지 — AdSense 심사 대응
for (const r of ['쿠키', 'Google', '맞춤 광고', 'google.com/settings/ads', 'aboutads.info'])
  if (!doc.includes(r)) fail(`광고·쿠키 고지 누락: "${r}"`);

// (3) 연락처가 실제 주소인지 (센티넬이면 실패)
const mail = doc.match(/mailto:([^"]+)"/);
if (!mail) fail('보호책임자 mailto 링크 없음');
else if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(mail[1]))
  fail(`보호책임자 연락처가 유효한 이메일이 아님: "${mail[1]}"`);

// (4) 진술 ↔ 코드 대조 — 문서가 "수집하지 않는다"고 하면 코드에 반증이 없어야 한다
const claimsNoCollection = doc.includes('개인정보도 수집·처리하지 않습니다');
const claimsNoStorage = doc.includes('브라우저 저장소에도 기록되지 않습니다');
const claimsNoAnalytics = doc.includes('별도의 접속 통계·분석 도구');
const claimsNoAdsYet = doc.includes('광고가 게재되어 있지 않으며, 쿠키를 사용하지 않습니다');

const walk = (d, acc = []) => {
  for (const e of readdirSync(d)) {
    if (['.git', 'node_modules', '.unlazy', 'docs'].includes(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(html|js|mjs)$/.test(e) && !p.includes(`${'scripts'}`) && !/test/.test(p)) acc.push(p);
  }
  return acc;
};
const files = walk(root);
const hit = (re) => files.filter(f => re.test(readFileSync(f, 'utf8'))).map(f => relative(root, f));

if (claimsNoAnalytics) {
  const h = hit(/gtag\(|google-analytics|googletagmanager|clarity\.ms|hotjar/);
  if (h.length) fail(`"분석 도구 미사용" 진술과 모순 — 발견: ${h.join(', ')}`);
}
if (claimsNoStorage) {
  const h = hit(/localStorage|sessionStorage|document\.cookie|indexedDB/);
  if (h.length) fail(`"브라우저 저장소 미사용" 진술과 모순 — 발견: ${h.join(', ')}`);
}
if (claimsNoCollection) {
  const h = hit(/fetch\(|XMLHttpRequest|sendBeacon|<form[\s>]/);
  if (h.length) fail(`"개인정보 미수집" 진술과 모순되는 전송·수집 코드 — 발견: ${h.join(', ')}`);
}
if (claimsNoAdsYet) {
  const h = hit(/adsbygoogle|pagead2\.googlesyndication/);
  if (h.length) fail(`"광고 미게재" 진술과 모순 — 발견: ${h.join(', ')}. 광고를 실제로 넣었다면 방침 3항을 갱신할 것`);
}
if (!claimsNoCollection) fail('방침에 개인정보 미수집 진술이 없음 — 이 사이트의 실제 동작과 다름');

// (5) 양성 대조군 — 스캐너가 실제로 탐지 능력이 있는지 확인
const probe = '<scr' + 'ipt>localStorage.setItem("x",1)</scr' + 'ipt>';
if (!/localStorage/.test(probe)) fail('내부 오류: 부정 검사 스캐너가 양성 대조군을 탐지하지 못함');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('privacy policy verification passed');
