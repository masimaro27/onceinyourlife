# onceinyourlife — 살면서 한 번은 겪는 일 계산기

행정·절차를 처음 겪는 사람이 숫자를 직접 확인해 볼 수 있는 정적 웹 계산기 모음.
블로그 「살면서 한 번은 겪는 일」과 상호 유입 구조를 이룬다.

배포: https://onceinyourlife.co.kr

| 경로 | 도구 | 기준 |
|---|---|---|
| `/` | 장기요양 본인부담금 계산기 | 2026-01-01 고시 수가, 원문 확인일 2026-08-24 |
| `/silup/` | 실업급여(구직급여) 계산기 | 고용보험법·시행령(2026-01-01 시행), 원문 확인일 2026-08-28 |

프레임워크·백엔드 없음. 각 도구는 `index.html`을 브라우저로 열면 그대로 동작한다.

## 구조

도구마다 같은 구성을 쓴다.

| 파일 | 역할 |
|---|---|
| `data.js` | 수가·요율·법정 금액 (출처 URL·확인일 주석 포함) |
| `calc.js` | 순수 함수 계산 엔진 (UI 무관, node에서 단독 테스트) |
| `app.js` | UI 로직 |
| `index.html` | 페이지·스타일·고지 |

설계 문서는 [docs/specs/](docs/specs/), 완료 조건은 각 도구의 `GATES.md`에 있다.

## 검증

```bash
node test/calc.test.mjs && python3 scripts/ui_check.py && node scripts/check-disclaimer.mjs
node silup/test/calc.test.mjs && python3 silup/scripts/ui_check.py && node silup/scripts/check-disclaimer.mjs && node silup/scripts/check-crosslink.mjs
```

playwright가 필요하다: `python3 -m pip install playwright && python3 -m playwright install chromium`

## 갱신할 때

수가·최저임금·상한액은 매년 바뀐다. `data.js`만 고치고 위 검증을 다시 돌린다.
**안내 페이지와 법령이 어긋나면 법령이 정본이다** — 실업급여 상한액이 실제로 그런 경우였다
(고용24 안내는 개정 전 66,000원을 그대로 싣고 있다).
