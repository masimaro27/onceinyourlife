# 구현 계획

순서대로 진행. 각 단계 산출물이 다음 단계 입력.

1. **data.js** — 아카이브에서 수가·한도·부담률을 옮긴다. 항목마다 출처 섹션 주석.
   완료 기준: G4 대조 검수에서 불일치 0
2. **calc.js** — 순수 함수 `calcHome(grade, items, burden)` / `calcFacility(grade, type, staffing, days, burden)`.
   UI 의존 없음. 완료 기준: G1 테스트 통과
3. **test/calc.test.mjs** — 스펙의 계산 규칙을 케이스로 고정
4. **index.html + app.js** — 모바일 우선 UI. 등급 → 재가/시설 탭 → 조합 입력 → 감경 → 결과.
   완료 기준: G2·G3
5. **검증 스크립트** — ui_check.py, check-disclaimer.mjs, check-docs.mjs
6. **4-pass 개선 루프** — 전문가 재독, 결함 사냥(계산 경계·모바일·문구), 폴리시. G6
7. **subagent 데이터 검수** — G4 증거 기록
8. **게이트 전체 실행 → 커밋 → 보고**. 배포는 사용자 확인 후 별도
