# 장기요양 본인부담금 계산기

장기요양등급을 받은 가족의 보호자가 재가 서비스 조합 또는 시설 입소 시
월 급여비용·공단부담·본인부담금을 추정하는 정적 웹 계산기.

- 수가 기준일 2026-01-01 (노인장기요양보험 고시), 원문 확인일 2026-08-24
- 프레임워크·백엔드 없음. `index.html`을 브라우저로 열면 동작
- 설계: [docs/specs/2026-08-26-ltc-copay-calculator-design.md](docs/specs/2026-08-26-ltc-copay-calculator-design.md)

## 구조

| 파일 | 역할 |
|---|---|
| `data.js` | 수가·한도·부담률 데이터 (출처·기준일 주석 포함) |
| `calc.js` | 순수 함수 계산 엔진 (UI 무관, node에서 테스트 가능) |
| `app.js` | UI 로직 |
| `index.html` | 페이지·스타일 |

## 검증

```bash
node test/calc.test.mjs        # 계산 엔진 단위 테스트
node scripts/check-disclaimer.mjs  # 필수 고지 문구 검사
python3 scripts/ui_check.py    # 브라우저 E2E (playwright 필요)
```

수가는 매년 바뀐다. 갱신 시 `data.js`만 고치고 위 검증을 다시 돌린다.
