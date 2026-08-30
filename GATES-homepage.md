# Gates: 홈페이지 신설 + 장기요양 계산기 /longtermcare/ 이동

OWNS: index.html, longtermcare/**, silup/index.html, silup/scripts/check-crosslink.mjs, about/index.html, privacy/index.html, contact/index.html, README.md, scripts/check-links.mjs, scripts/check-deployed.mjs, scripts/check-about.mjs, scripts/check-home.mjs, scripts/ui_check_home.py, GATES.md

Scope: 루트 `/`가 장기요양 계산기라 사이트에 홈페이지가 없다. 계산기를 `/longtermcare/`로 옮기고
`/`에 도구·글을 모으는 홈페이지를 신설한다. 첫 배포가 2026-08-26로 나흘밖에 안 됐고 블로그 링크도
아직 붙지 않아 URL 이동 비용이 가장 싼 시점이다.

전제: `silup/scripts/check-crosslink.mjs`에 "루트 도구가 여전히 장기요양 계산기여야 한다"는 검사가
있어 이 이동으로 의도적으로 깨진다. 새 구조에 맞게 갱신하되 상호 링크 보증은 유지한다.

- [x] H1: 이동한 장기요양 계산기의 기존 게이트 4개(계산 엔진·UI·고지문구·문서)가 새 위치에서 전부 통과한다
  CHECK: node scripts/check-ltc-suite.mjs
  EXPECT: ltc suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=ltc suite verification passed

- [x] H2: 새 홈페이지가 사이트 정체성을 설명하고 도구 2개와 신뢰 페이지 3종으로 모두 연결된다
  CHECK: node scripts/check-home.mjs
  EXPECT: home verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=home verification passed

- [x] H3: 6개 페이지 전부 푸터 내비게이션이 일관되고 저장소 내부 링크가 전부 해소된다(깨진 링크 0)
  CHECK: node scripts/check-links.mjs
  EXPECT: link verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=link verification passed

- [x] H4: 홈페이지가 390px에서 가로 넘침·콘솔 에러 없이 렌더된다
  CHECK: python3 scripts/ui_check_home.py
  EXPECT: home UI verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=home UI verification passed

- [x] H5: 애드센스 게이트 9개가 새 구조에서도 회귀 없이 전부 통과한다
  CHECK: node scripts/check-adsense-suite.mjs
  EXPECT: adsense suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=adsense suite verification passed

- [ ] H6: 배포 후 /, /longtermcare/, /silup/, /about/, /privacy/, /contact/ 6개가 200이고 각 페이지 내용이 의도대로 서빙된다
  CHECK: node scripts/check-deployed.mjs
  EXPECT: deployment verification passed

- [ ] H7: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
