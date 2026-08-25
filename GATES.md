# Gates: 장기요양 본인부담 계산기 1차

OWNS: **

Scope: 서비스 조합형 장기요양 본인부담 계산기(정적 웹) — 스펙·계획 문서, 데이터/계산 엔진/UI, 검증 완료된 로컬 빌드

- [ ] G1: calc.js 계산 엔진이 한도 이내/초과/감경/면제/시설/경고 케이스를 모두 통과한다
  CHECK: node test/calc.test.mjs
  EXPECT: ALL TESTS PASSED
  EVIDENCE: pending

- [ ] G2: 브라우저에서 재가 조합·시설 계산이 실제로 렌더되고 390px 폭에서 가로 넘침이 없다
  CHECK: python3 scripts/ui_check.py
  EXPECT: UI verification passed
  EVIDENCE: pending

- [ ] G3: 페이지에 기준일·출처·면책(참고용 추정치, 공단 확인)·비급여 미포함 문구가 존재한다
  CHECK: node scripts/check-disclaimer.mjs
  EXPECT: disclaimer verification passed
  EVIDENCE: pending

- [ ] G4: data.js의 모든 수치가 블로그 아카이브 원문(확인일 2026-08-24)과 1:1 일치한다 — 독립 subagent 대조 검수
  EVIDENCE: pending

- [ ] G5: 스펙 문서와 구현 계획 문서가 저장소에 존재하고 git에 커밋되어 있다
  CHECK: node scripts/check-docs.mjs
  EXPECT: docs verification passed
  EVIDENCE: pending

- [ ] G6: 4-pass 개선 루프(전문가 재독·결함 사냥·폴리시) 마지막 회차에서 신규 발견 0건
  EVIDENCE: pending
