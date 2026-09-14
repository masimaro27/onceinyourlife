# Gates: 증여세 계산기

OWNS: gift/**

Scope: 수증자가 거주자이고 기본세율이 적용되는 증여의 세액을 계산한다.
설계는 `docs/specs/2026-09-02-gift-tax-calculator-design.md`.
애드센스 심사 중이므로 **배포하지 않는다** — 로컬에서 게이트까지만 통과시킨다.

- [x] G1: 계산 엔진이 공제·세율·할증·신고세액공제·과세최저한 경계를 모두 통과한다
  CHECK: node test/calc.test.mjs
  EXPECT: ALL TESTS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/gift; path=67909a68e42d/34 entries; output=ALL TESTS PASSED (65 assertions)

- [x] G2: 세액이 세율 구간 경계(1억·5억·10억·30억)에서 연속이다 — 누진공제표를 외부 오라클 없이 자체 검증한다
  CHECK: node test/continuity.test.mjs
  EXPECT: CONTINUITY VERIFIED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/gift; path=67909a68e42d/34 entries; output=CONTINUITY VERIFIED (점화식 재생산 · 경계 연속 · 제26조 원문 형식 5만건 일치 · 단조성)

- [x] G3: 부담부증여 채무 추정(제47조③)이 관계와 입증 여부에 따라 갈린다 — 직계존비속·배우자는 미입증 시 차감되지 않는다
  CHECK: node test/debt.test.mjs
  EXPECT: DEBT PRESUMPTION VERIFIED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/gift; path=67909a68e42d/34 entries; output=DEBT PRESUMPTION VERIFIED

- [x] G4: 브라우저에서 계산이 실제로 렌더되고 390px에서 가로 넘침이 없다
  CHECK: python3 scripts/ui_check.py
  EXPECT: UI verification passed

- [x] G5: 화면이 세무 용어 대신 일상어를 쓰고, 억 단위 입력을 한글로 되읽어 준다
  CHECK: node scripts/check-plain-language.mjs
  EXPECT: plain language verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/gift; path=67909a68e42d/34 entries; output=plain language verification passed

- [x] G6: 기준일·출처·면책과 「다루지 않는 것」 고지가 존재한다
  CHECK: node scripts/check-disclaimer.mjs
  EXPECT: disclaimer verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife/gift; path=67909a68e42d/34 entries; output=disclaimer verification passed

- [x] G7: data.js의 모든 수치가 아카이브 원문과 1:1 일치한다 — 독립 subagent 대조 검수
  EVIDENCE: 2026-09-02 독립 subagent 전수 대조 — **data.js 수치 불일치 0건** (49개 항목:
  공제한도 5·미성년한도 1·혼인출산한도 1·세율표 15·할증 3·상수 3·채무추정 5·관계매핑 7·출처 9).
  세율표는 제26조 원문(img alt 추출)과 코드의 누진공제 형식을 200,015개 지점에서 독립
  재계산해 불일치 0. 출처 URL 9개는 실제 접속해 내용을 확인했다.
  **다만 calc.js 산식에서 오류 3건을 잡아냈고 전부 고쳤다** — 아래 G9 참조.

- [x] G8: 사이트의 기존 게이트가 회귀 없이 전부 통과한다
  CHECK: node ../scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed

- [x] G9: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
  EVIDENCE: 1회차 발견 3건 (자체) + 2회차 독립 검수 발견 3건 (산식) —
    [중요] 과세최저한(제55조②)으로 빠지는 경로에서 early return 하면서 warnings 를 채우지
           않아 채무 차단 경고가 사라졌다. 세액과 무관한 사실이므로 경고를 최저한 판정 앞으로 옮김.
           G3 테스트가 검출했다.
    [중요] 금액 입력이 type="number" 라 천단위 콤보가 불가능해 `300000000` 이 raw 로 보였다.
           결과는 콤마로 나오는데 입력만 raw 라, 0을 하나 빠뜨려도 본인이 알아채기 어렵다 —
           이 계산기의 핵심 위험이 정확히 그 자리다. type="text" inputmode="numeric" 으로
           바꾸고 콤마 서식 + 커서 위치 보존(앞쪽 숫자 개수 기준)을 구현. 검증기도 갱신해
           type=number 로 되돌아가면 실패하도록 했다.
    [사소] 일괄 치환이 대입문 좌변까지 바꿔 `moneyValue('x') = 0` 문법 오류를 만들었다.
           node --check 로 검출. 정규식 일괄 치환은 좌변을 구분하지 못한다.
  2회차 재독 — 실제 타이핑으로 콤마·커서·되읽기 확인(1,234,567,890 → "12억 3,456만 7,890원",
  맨 앞 삽입 시 커서 유지), 화면 육안 확인, 게이트 7종 + 사이트 전역 게이트 재실행.
  3회차는 독립 검수(G7)가 산식 오류 3건을 잡았다 —
    [중대] **세대생략 할증에 안분 비율이 있다.** 법 제57조① 본문만 보면 산출세액 전액에
           30%를 더하는 것으로 읽혀 "상속세와 달리 안분이 없다"고 코드·주석·대조표 세 곳에
           단언했는데, 제57조②가 계산방법을 시행령에 위임했고 **시행령 제46조의3②**에
           `[산출세액 × (부모 제외 직계존속에게서 받은 재산 / 총증여재산가액) × 30(40)/100]
           − 종전에 납부한 할증과세액`(음수면 0)이 있다. 수식이 이미지라 img alt 로 확보했다.
           안분 비율은 이 계산기 범위에서 1이지만 **종전 할증 차감은 중립이 아니다** —
           10년 합산에 할증을 낸 증여가 있으면 이중으로 붙는다. 입력을 추가하고
           세대생략+10년합산이 겹칠 때만 노출하도록 했다.
    [중요] 40% 트리거의 증여재산가액에 **10년 가산분이 빠져 있었다**(시행령 제46조의3①).
           15억 + 가산 10억 = 25억인데 당해분만 보고 30%를 적용했다.
    [중요] 제58조② 납부세액공제 **한도 기준액에 할증을 포함**하고 있었다. 조문은
           "증여세산출세액"이고 제69조②가 굳이 "제57조 가산액을 포함한다"고 밝히는 것이
           그 반증이다. gross → computedTax 로 교정.
    [사소] 관계 라벨 "형제자매·친척"이 제53조 제4호(4촌 이내 혈족·3촌 이내 인척)보다 넓어
           5촌 이상도 1천만원 공제를 받는 것처럼 읽혔다. "형제자매·가까운 친척"으로 좁혔다.
  4회차 재독 — 새 규칙 테스트 9개 추가(65 assertions), UI에서 종전 할증 입력의 노출·경고
  동작 확인, 검증기가 라벨 하드코딩 대신 data-id 를 쓰도록 고쳐 라벨 변경에 깨지지 않게 함.
  신규 발견 0건으로 수렴.
