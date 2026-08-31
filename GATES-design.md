# Gates: 디자인 전면 수정

OWNS: assets/tokens.css, assets/site.css, index.html, longtermcare/index.html, longtermcare/guide/**, silup/index.html, about/index.html, privacy/index.html, contact/index.html, scripts/ui_check_design.py, scripts/check-tokens.mjs

Scope: 2026-08-31 전면 진단에서 나온 항목을 고친다. 근거는 라이브 사이트 실측.

- 강조색 #2a78d6이 흰 배경에서 4.42:1로 AA(4.5) 미달 — 10개 페이지의 모든 링크·탭이 걸림
- 푸터 내비게이션 터치 타깃이 12×22px까지 내려감 (WCAG 2.5.8 최소 24×24도 미달)
- prefers-color-scheme: dark 미대응
- 데스크톱 한글 본문 줄길이 67~73자 (권장 40~50자)
- 폰트 크기 선언 17종, 렌더된 스케일 15단계. h2가 본문과 1.4px 차이로 위계가 약함
- 가이드 글이 h2마다 카드를 써서 리듬이 단조롭고 카드가 의미를 잃음

색 토큰이 4개 파일에 흩어져 있어 다크모드를 한 곳에서 정의할 수 없다.
`assets/tokens.css`로 모으고 모든 페이지가 이를 링크한다.

- [ ] D1: 라이트 모드에서 전 페이지의 텍스트·UI 색 조합이 WCAG AA를 만족한다
  CHECK: python3 scripts/ui_check_design.py --light
  EXPECT: light contrast verification passed

- [ ] D2: 다크 모드에서 배경·글자가 실제로 전환되고, 그 상태에서도 AA를 만족한다
  CHECK: python3 scripts/ui_check_design.py --dark
  EXPECT: dark contrast verification passed

- [ ] D3: 모바일에서 푸터 내비게이션 링크의 터치 타깃이 44×44px 이상이다
  CHECK: python3 scripts/ui_check_design.py --tap
  EXPECT: tap target verification passed

- [ ] D4: 데스크톱 한글 본문 줄길이가 45~60자 범위에 든다 (Range API 실측)
  CHECK: python3 scripts/ui_check_design.py --measure
  EXPECT: line measure verification passed

- [ ] D5: 폰트 크기가 토큰으로만 지정되고 스케일이 7단계 이하다
  CHECK: node scripts/check-tokens.mjs
  EXPECT: token verification passed

- [ ] D6: 기존 게이트가 회귀 없이 전부 통과한다 (링크·SEO·중복률·계산기 스위트)
  CHECK: node scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed

- [ ] D7: 배포 후 10개 URL이 200이고 서빙본에 토큰 스타일시트가 실린다
  CHECK: node scripts/check-deployed.mjs
  EXPECT: deployment verification passed

- [ ] D8: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
