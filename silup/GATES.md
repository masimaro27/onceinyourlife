# Gates: 실업급여(구직급여) 계산기 1차

OWNS: silup/**

Scope: 이직일 기준 구직급여일액·소정급여일수·총 예상액을 계산하는 정적 웹 도구. onceinyourlife.co.kr/silup 로 배포하고 루트 도구와 상호 링크한다.

- [x] G1: 계산 엔진이 상한/하한/평균임금기간/소정급여일수/조기재취업수당/경계 케이스를 모두 통과한다
  CHECK: node test/calc.test.mjs
  EXPECT: ALL TESTS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/silup; path=f681d46c4e3d/27 entries; output=ALL TESTS PASSED (56 assertions)

- [x] G2: 브라우저에서 계산이 실제로 렌더되고 390px 폭에서 가로 넘침이 없다
  CHECK: python3 scripts/ui_check.py
  EXPECT: UI verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/silup; path=f681d46c4e3d/27 entries; output=UI verification passed

- [x] G3: 상한액 법령 근거·기준일·면책·비포함 항목 고지 문구가 페이지에 존재한다
  CHECK: node scripts/check-disclaimer.mjs
  EXPECT: disclaimer verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/silup; path=f681d46c4e3d/27 entries; output=disclaimer verification passed

- [ ] G4: silup/data.js의 모든 수치가 아카이브 원문(확인일 2026-08-28)과 1:1 일치한다 — 독립 subagent 대조 검수
  EVIDENCE: pending — 독립 subagent 검수는 아직 하지 않았다.
  참고: 2026-08-31 작성자 본인 대조에서는 불일치 0건이었다.
  아카이브 `블로그/_자료/원문/퇴직실직_구직급여일액_소정급여일수.md` 기준 —
  시행령 제68조 상한 113,500(2026-), 부칙 제4조 경과조치 66,000(2025.12.31. 이전),
  최저임금 9,620/9,860/10,030/10,320(136~139행), 소정급여일수 120·150·180·210·240 및
  120·180·210·240·270(96~97행), 최저구직급여일액 2026년 66,048(141행) 전부 일치.
  다만 이는 독립 검수가 아니므로 게이트는 미충족으로 둔다.

- [x] G5: 루트(장기요양) 도구와 /silup 이 서로 링크되고 루트 계산이 깨지지 않는다
  CHECK: node scripts/check-crosslink.mjs
  EXPECT: crosslink verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/silup; path=f681d46c4e3d/27 entries; output=crosslink verification passed

- [x] G6: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
  EVIDENCE: 2026-08-31 개편 회차 발견 4건 —
    [중요] capTable 행이 baseCap/dailyCap 두 모양으로 갈렸는데 calc.js가 baseCap만 읽었다.
           `base > undefined`가 조용히 false가 되어 2025년 이직자에게 상한이 통째로 누락
           (기초일액 326,086원, 일액 195,652원). calc.js가 두 모양을 모두 처리하도록 고치고,
           둘 다 없는 행은 bad_cap_row로 던지게 했다.
    [중요] capDaily가 `Math.floor(undefined * 0.6)` = NaN이 되어 화면까지 흘렀다.
           테스트가 잡지 못하던 사용자 노출 결함.
    [중요] won(null)이 "0원"으로 둔갑해 "기초일액 상한 0원 × 60%"라는 거짓 문장을 출력했다.
           원문 미확보 구간은 근거를 적지 않도록 문구를 고치고, won()이 숫자 아닌 값을
           0원으로 만들지 않게 방어했다.
    [사소] 이직일 입력의 max가 2027-12-31인데 data.supportedTo는 2026-12-31이었다.
           범위가 HTML과 data.js 두 군데 적혀 어긋난 것 — app.js가 data.js에서 주입하도록
           일원화했다.
  재독 회차: 두 상한 경로(2025 dailyCap / 2026 baseCap)를 실측 비교하고 화면 문구를 육안
  확인. 게이트 4종 전부 통과(56 assertions). 신규 발견 0건으로 수렴.
