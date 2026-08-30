# Gates: sitemap.xml + robots.txt

OWNS: robots.txt, sitemap.xml, scripts/gen-sitemap.mjs, scripts/check-seo.mjs, scripts/check-deployed.mjs

Scope: 크롤러가 6개 페이지를 한 번에 발견하도록 sitemap.xml을 두고, robots.txt로 콘텐츠가 아닌
검증 스크립트·테스트·설계 문서가 색인되지 않게 한다. GitHub Pages가 저장소 전체를 서빙하므로
`/scripts/*.mjs`·`/longtermcare/test/`·`/docs/specs/*.md`가 전부 크롤 대상이며, 애드센스 심사에서
얇은 콘텐츠로 읽힐 여지가 있다.

sitemap은 손으로 쓰지 않는다. 글 10편이 붙을 예정이라 드리프트가 확실하므로 생성기를 둔다.

- [x] S1: sitemap.xml이 저장소의 실제 공개 페이지와 정확히 일치한다 — 누락 0, 실재하지 않는 URL 0, XML 파싱 가능
  CHECK: node scripts/check-seo.mjs
  EXPECT: seo verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=seo verification passed (6 urls)

- [x] S2: robots.txt가 콘텐츠·CSS·ads.txt를 차단하지 않고, 비콘텐츠 경로는 차단하며, sitemap을 절대 URL로 가리킨다
  CHECK: node scripts/check-robots-rules.mjs
  EXPECT: robots rules verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=robots rules verification passed

- [x] S3: 배포 후 /robots.txt·/sitemap.xml이 200이고 기존 6개 페이지도 회귀 없이 200이다
  CHECK: node scripts/check-deployed.mjs
  EXPECT: deployment verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=deployment verification passed

- [x] S4: 홈페이지·애드센스 게이트가 회귀 없이 전부 통과한다
  CHECK: node scripts/check-adsense-suite.mjs
  EXPECT: adsense suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=adsense suite verification passed

- [x] S5: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
  EVIDENCE: 1회차 발견 2건 —
    [중요] check-robots-rules.mjs의 규칙 평가기 버그. 끝의 `$` 앵커를 이스케이프한 뒤
           slice(0,-1)로 잘라내 `\$`의 `$`만 사라지고 `\`가 남아 정규식이 깨졌다.
           `/*.md$`가 `/README.md`를 매칭하지 못해 MUST_BLOCK 검사가 실패하며 드러남.
           앵커를 이스케이프 **전에** 분리하도록 수정하고, 14개 경로로 판정을 직접 실증.
    [사소] check-deployed.mjs가 robots.txt·sitemap.xml을 보지 않아 배포 회귀를 놓칠 수 있었음.
           두 파일의 서빙·내용 검사와 `Disallow: /` 전체 차단 검사를 추가.
  2회차 재독 — 생성기 동기 검사(--check), sitemap↔파일시스템 대조, robots 규칙 14경로 판정,
  ltc/adsense/home 스위트 전부 통과. 신규 발견 0건으로 수렴.
  주: adsense-suite가 한 번 실패했으나 silup 개편 WIP가 작업트리에 있을 때뿐이었고,
  분리 후 통과 — 스위트가 배포 상태를 정확히 반영한다는 확인이 됨.
