# Gates: sitemap.xml + robots.txt

OWNS: robots.txt, sitemap.xml, scripts/gen-sitemap.mjs, scripts/check-seo.mjs, scripts/check-deployed.mjs

Scope: 크롤러가 6개 페이지를 한 번에 발견하도록 sitemap.xml을 두고, robots.txt로 콘텐츠가 아닌
검증 스크립트·테스트·설계 문서가 색인되지 않게 한다. GitHub Pages가 저장소 전체를 서빙하므로
`/scripts/*.mjs`·`/longtermcare/test/`·`/docs/specs/*.md`가 전부 크롤 대상이며, 애드센스 심사에서
얇은 콘텐츠로 읽힐 여지가 있다.

sitemap은 손으로 쓰지 않는다. 글 10편이 붙을 예정이라 드리프트가 확실하므로 생성기를 둔다.

- [ ] S1: sitemap.xml이 저장소의 실제 공개 페이지와 정확히 일치한다 — 누락 0, 실재하지 않는 URL 0, XML 파싱 가능
  CHECK: node scripts/check-seo.mjs
  EXPECT: seo verification passed

- [ ] S2: robots.txt가 콘텐츠·CSS·ads.txt를 차단하지 않고, 비콘텐츠 경로는 차단하며, sitemap을 절대 URL로 가리킨다
  CHECK: node scripts/check-robots-rules.mjs
  EXPECT: robots rules verification passed

- [ ] S3: 배포 후 /robots.txt·/sitemap.xml이 200이고 기존 6개 페이지도 회귀 없이 200이다
  CHECK: node scripts/check-deployed.mjs
  EXPECT: deployment verification passed

- [ ] S4: 홈페이지·애드센스 게이트가 회귀 없이 전부 통과한다
  CHECK: node scripts/check-adsense-suite.mjs
  EXPECT: adsense suite verification passed

- [ ] S5: 4-pass 개선 루프 마지막 회차에서 신규 발견 0건
