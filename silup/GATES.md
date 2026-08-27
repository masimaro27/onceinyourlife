# Gates: 실업급여(구직급여) 계산기 1차

OWNS: silup/**

Scope: 이직일 기준 구직급여일액·소정급여일수·총 예상액을 계산하는 정적 웹 도구. onceinyourlife.co.kr/silup 로 배포하고 루트 도구와 상호 링크한다.

- [ ] G1: 계산 엔진이 상한/하한/평균임금기간/소정급여일수/조기재취업수당/경계 케이스를 모두 통과한다
  CHECK: node silup/test/calc.test.mjs
  EXPECT: ALL TESTS PASSED
  EVIDENCE: pending

- [ ] G2: 브라우저에서 계산이 실제로 렌더되고 390px 폭에서 가로 넘침이 없다
  CHECK: python3 silup/scripts/ui_check.py
  EXPECT: UI verification passed
  EVIDENCE: pending

- [ ] G3: 상한액 법령 근거·기준일·면책·비포함 항목 고지 문구가 페이지에 존재한다
  CHECK: node silup/scripts/check-disclaimer.mjs
  EXPECT: disclaimer verification passed
  EVIDENCE: pending

- [ ] G4: silup/data.js의 모든 수치가 아카이브 원문(확인일 2026-08-28)과 1:1 일치한다 — 독립 subagent 대조 검수
  EVIDENCE: pending

- [ ] G5: 루트(장기요양) 도구와 /silup 이 서로 링크되고 루트 계산이 깨지지 않는다
  CHECK: node silup/scripts/check-crosslink.mjs
  EXPECT: crosslink verification passed
  EVIDENCE: pending

- [ ] G6: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
  EVIDENCE: pending
