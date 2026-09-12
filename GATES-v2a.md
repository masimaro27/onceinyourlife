# GATES — 배포 A: v2 리스킨 + 포털 홈

스펙: docs/specs/2026-09-13-site-v2-redesign.md

- [x] G1: 토큰 단일 소스 — v2 팔레트로 교체 후에도 색·크기 리터럴 금지 유지
  CHECK: node scripts/check-tokens.mjs
  EXPECT: token verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=token verification passed (스케일 7단계)
- [x] G2: 라이트 대비 (WCAG AA, 갈래 색 6종 + 명조 헤드라인 포함 실측)
  CHECK: python3 scripts/ui_check_design.py --light
  EXPECT: light contrast verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=light contrast verification passed
- [x] G3: 다크 대비
  CHECK: python3 scripts/ui_check_design.py --dark
  EXPECT: dark contrast verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=dark contrast verification passed
- [x] G4: 터치 타깃 44px — 신설 topbar·breadcrumb·카드 pill 포함
  CHECK: python3 scripts/ui_check_design.py --tap
  EXPECT: tap target verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=tap target verification passed
- [x] G5: 줄 길이 — 명조·새 타입 스케일에서도 본문 measure 유지
  CHECK: python3 scripts/ui_check_design.py --measure
  EXPECT: line measure verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=line measure verification passed
- [x] G6: 링크 무결성 — 홈 개편 후 죽은 내부 링크 0
  CHECK: node scripts/check-links.mjs
  EXPECT: link verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=link verification passed
- [x] G7: SEO — 18 URL 불변·canonical 자기참조·sitemap 정합
  CHECK: node scripts/check-seo.mjs
  EXPECT: seo verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=seo verification passed (19 urls)
- [x] G8: 회귀 — 두 계산기 전 케이스 + 정적 페이지 스위트
  CHECK: node scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=regression suite verification passed
- [x] G9: topbar·breadcrumb 전면 적용 — 배포 대상 전 페이지에 공통 내비 존재
  CHECK: node scripts/check-v2-chrome.mjs
  EXPECT: v2 chrome verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=v2 chrome verification passed (19 pages)
- [x] G10: 프라이버시 정합 — 글꼴 외부 로딩을 방침이 밝히고 있는지
  CHECK: node scripts/check-privacy.mjs
  EXPECT: privacy policy verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=privacy policy verification passed
- [ ] G11: 라이브 검증 (배포 후) — 전 URL 200·canonical·gift 잔재 0·v2 토큰 서빙
  CHECK: node /tmp/verify-live-v2.mjs
  EXPECT: LIVE VERIFICATION PASSED
