# Gates: 장기요양 본인부담 계산기 1차

OWNS: **

Scope: 서비스 조합형 장기요양 본인부담 계산기(정적 웹) — 스펙·계획 문서, 데이터/계산 엔진/UI, 검증 완료된 로컬 빌드

- [x] G1: calc.js 계산 엔진이 한도 이내/초과/감경/면제/시설/경고 케이스를 모두 통과한다
  CHECK: node test/calc.test.mjs
  EXPECT: ALL TESTS PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/장기요양계산기; path=51ff6ffb235d/26 entries; output=ALL TESTS PASSED (24 assertions)

- [x] G2: 브라우저에서 재가 조합·시설 계산이 실제로 렌더되고 390px 폭에서 가로 넘침이 없다
  CHECK: python3 scripts/ui_check.py
  EXPECT: UI verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/장기요양계산기; path=51ff6ffb235d/26 entries; output=UI verification passed

- [x] G3: 페이지에 기준일·출처·면책(참고용 추정치, 공단 확인)·비급여 미포함 문구가 존재한다
  CHECK: node scripts/check-disclaimer.mjs
  EXPECT: disclaimer verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/장기요양계산기; path=51ff6ffb235d/26 entries; output=disclaimer verification passed

- [x] G4: data.js의 모든 수치가 블로그 아카이브 원문(확인일 2026-08-24)과 1:1 일치한다 — 독립 subagent 대조 검수
  EVIDENCE: 2026-08-26 독립 subagent 전수 대조 — 수치 불일치 0건 (한도 6, 방문요양 8, 방문목욕·간호 6, 주야간 5×6 매트릭스, 단기보호 5, 시설 3종, 부담률·URL 전부 일치). 지적 1건은 면제 라벨 과대 표기([중요], 숫자 아님)로, data.js:40을 '의료급여법 제3조제1항제1호 수급자'로 수정 완료

- [x] G5: 스펙 문서와 구현 계획 문서가 저장소에 존재하고 git에 커밋되어 있다
  CHECK: node scripts/check-docs.mjs
  EXPECT: docs verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/장기요양계산기; path=51ff6ffb235d/26 entries; output=docs verification passed

- [x] G6: 4-pass 개선 루프(전문가 재독·결함 사냥·폴리시) 마지막 회차에서 신규 발견 0건
  EVIDENCE: 2026-08-26 1회차 발견 — [중요] 면제 라벨 과대 표기(수정), [사소] og 메타·README 부재(추가). 2회차 재독(라벨 길이/셀렉트 폭, 상태 보존, 라운딩, cog 처리, 에러 경로) — 신규 발견 0건
