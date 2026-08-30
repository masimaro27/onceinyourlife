// G8 — 배포된 실제 URL이 200이고 신규 페이지 내용이 서빙되는지 검증
const BASE = 'https://onceinyourlife.co.kr';
const TARGETS = [
  ['/',         '장기요양 본인부담금 계산기'],
  ['/silup/',   '실업급여 계산기'],
  ['/about/',   '살면서 한 번은 겪는 일'],
  ['/privacy/', '개인정보 보호책임자'],
  ['/contact/', '오류 제보에 함께 적어주시면'],
];
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

for (const [path, token] of TARGETS) {
  const url = BASE + path;
  let res;
  try {
    res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
  } catch (e) { fail(`${path}: 요청 실패 — ${e.message}`); continue; }
  if (res.status !== 200) { fail(`${path}: status=${res.status}`); continue; }
  const html = await res.text();
  if (!html.includes(token)) fail(`${path}: 기대 문구 없음 — "${token}" (배포 반영 전일 수 있음)`);
  // 푸터 내비게이션이 실제 서빙본에 있는지
  for (const href of ['/about/', '/privacy/', '/contact/'])
    if (!html.includes(`href="${href}"`)) fail(`${path}: 서빙본 푸터에 ${href} 없음`);
  // 센티넬이 배포되지 않았는지
  if (html.includes('__CONTACT_' + 'EMAIL__')) fail(`${path}: 자리표시자가 배포됨`);
}

// 공통 스타일시트가 200으로 서빙되는지
try {
  const css = await fetch(BASE + '/assets/site.css', { signal: AbortSignal.timeout(20000) });
  if (css.status !== 200) fail(`/assets/site.css: status=${css.status}`);
  else if (!(await css.text()).includes('--accent')) fail('/assets/site.css: 내용이 예상과 다름');
} catch (e) { fail(`/assets/site.css: 요청 실패 — ${e.message}`); }

// 양성 대조군 — 존재하지 않는 경로가 200이 아님을 확인 (탐지 능력 증명)
try {
  const probe = await fetch(BASE + '/__definitely_missing__/', { signal: AbortSignal.timeout(20000) });
  if (probe.status === 200) fail('내부 오류: 존재하지 않는 경로가 200 — 상태 검사를 신뢰할 수 없음');
} catch { /* 네트워크 오류는 대조군 판정에서 제외 */ }

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('deployment verification passed');
