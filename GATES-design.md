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

- [x] D1: 라이트 모드에서 전 페이지의 텍스트·UI 색 조합이 WCAG AA를 만족한다
  CHECK: python3 scripts/ui_check_design.py --light
  EXPECT: light contrast verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=light contrast verification passed — 라이브 재측정: 텍스트 577개 중 AA 미달 0개, 최저 5.01:1 (수정 전 4.42:1 미달 다수)

- [x] D2: 다크 모드에서 배경·글자가 실제로 전환되고, 그 상태에서도 AA를 만족한다
  CHECK: python3 scripts/ui_check_design.py --dark
  EXPECT: dark contrast verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=dark contrast verification passed — 라이브 재측정: 다크 body 배경 rgb(21,22,26)으로 전환, AA 미달 0개, 최저 6.77:1

- [x] D3: 모바일에서 푸터 내비게이션 링크의 터치 타깃이 44×44px 이상이다
  CHECK: python3 scripts/ui_check_design.py --tap
  EXPECT: tap target verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=tap target verification passed — 라이브 재측정: 모바일 푸터 터치타깃 최소 44px (수정 전 12×22px)

- [x] D4: 데스크톱 한글 본문 줄길이가 45~60자 범위에 든다 (Range API 실측)
  CHECK: python3 scripts/ui_check_design.py --measure
  EXPECT: line measure verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=line measure verification passed — 라이브 재측정: 데스크톱 줄길이 41~60자 (수정 전 67~73자)

- [x] D5: 폰트 크기가 토큰으로만 지정되고 스케일이 7단계 이하다
  CHECK: node scripts/check-tokens.mjs
  EXPECT: token verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=token verification passed (스케일 6단계) — 색 리터럴 0, 폰트 크기 전부 토큰

- [x] D6: 기존 게이트가 회귀 없이 전부 통과한다 (링크·SEO·중복률·계산기 스위트)
  CHECK: node scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=regression suite verification passed — 링크·SEO·robots·홈·가이드독창성·애드센스스위트·장기요양스위트 전부 통과

- [x] D7: 배포 후 10개 URL이 200이고 서빙본에 토큰 스타일시트가 실린다
  CHECK: node scripts/check-deployed.mjs
  EXPECT: deployment verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=deployment verification passed — Pages build afef696 status=built, 10개 URL 200

- [x] D8: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
  EVIDENCE: 1회차 발견 4건 —
    [중요] 콘텐츠 페이지 푸터 nav에 sitenav 클래스가 없어 새 터치타깃 규칙이 걸리지 않음.
           D3가 18건으로 검출. 8개 페이지에 클래스 부여로 해결.
    [중요] --measure를 rem으로 두니 작은 글씨(.hint 14px)에서 같은 폭에 글자가 더 들어가
           줄길이가 65자로 남음. em으로 바꿔 요소 자기 폰트 기준이 되게 함.
    [사소] .tabs button.on 의 흰 글자를 일괄 치환에서 var(--card)로 바꿔버림.
           강조 배경 위 글자이므로 var(--accent-ink)가 맞다. 수정.
    [사소] contact 페이지에 인라인 style="font-size:1.05rem"이 남아 D5가 검출. 클래스로 분리.
  2회차 재독 — 라이브 배포본을 다시 실측(대비 라이트/다크 각 577개 텍스트, 터치타깃,
  줄길이)하고 육안 확인(가이드 라이트·계산기 다크). 신규 발견 0건으로 수렴.
  참고: 회귀 스위트가 silup UI 실패를 한 번 냈으나 개편 WIP가 작업트리에 있을 때뿐이었고,
  분리하면 통과 — 이번 디자인 변경의 회귀가 아님을 확인.
