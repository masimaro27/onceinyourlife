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

- [x] G4: silup/data.js의 모든 수치가 아카이브 원문(확인일 2026-08-28)과 1:1 일치한다 — 독립 subagent 대조 검수
  EVIDENCE: 2026-09-02 독립 subagent 전수 대조 — **불일치 0건**.
  수치·날짜 27개, 라벨 7개, URL 6개(총 40개 항목)를 원문 `퇴직실직_구직급여일액_소정급여일수.md`와
  대조. 수치 27개 중 26개가 원문의 특정 줄에 직접 근거를 갖고 값이 일치하며, 코드 주석은
  근거로 쓰지 않고 전부 원문에서 확인했다. 파생값 6종(113,500×0.6=68,100 / 각 연도
  최저임금×8×0.8 / 10,700×8×0.8=68,480>68,100 등)을 독립 재계산해 원문과 일치함을 확인 —
  minWage·minBenefitRate·maxDailyWorkHours가 동시에 맞아야 성립하는 교차검증이다.
  근거 미확보였던 `supportedFrom`은 이번에 주석으로 근거를 명시했다.
  검수가 함께 제기한 지적 중 다음을 반영: ①`index.html`의 수급요건 서술이 아카이브 근거 없이
  "180일 이상, 비자발적 이직"으로 적혀 있어 법 제40조 원문을 새로 수집(`퇴직실직_수급요건_법령.md`)해
  "이직일 이전 18개월 안의 합산 180일" + "제58조 제한 사유에 해당하지 않을 것"으로 교정.
  종전 서술은 자진퇴사 정당사유를 배제해 자사 블로그 3편과 모순이었다.
  ②`sources`에 계산의 뼈대 조문(법 제40·45·50조, 시행령 제84조, 근로기준법 제50조)을 보강.
  미반영으로 남긴 것: 대기기간 7일·시행령 제84조② 2년 제한·통상임금 하한 단서의 화면 고지
  (계산값이 아니라 안내 문구 사안이라 별건으로 둔다).

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
