# GATES — 배포 D: 자동차 클러스터 /car/ (허브 + 가이드 3편)

스펙: docs/specs/2026-09-13-site-v2-redesign.md 배포 D.
원칙: 사실은 원문 아카이브(자동차_*.md 8건)에서 가져온다. 빈 페이지·준비중 문구 금지.
/gift/ 링크 금지(미배포 상태이므로 죽은 링크가 된다).

- [x] G1: 토큰 단일 소스
  CHECK: node scripts/check-tokens.mjs
  EXPECT: token verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=token verification passed (스케일 7단계)
- [x] G2: 원본성 — 신규 3편이 블로그 자동차 편들과 문장 일치 0%·n-gram 20% 미만
  CHECK: node scripts/check-guide-originality.mjs
  EXPECT: guide originality verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=silup/guide/why-different/index.html — 문장 일치 0.0% / n-gram 1.5% | guide originality verification passed
- [x] G3: 링크 무결성
  CHECK: node scripts/check-links.mjs
  EXPECT: link verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=link verification passed
- [x] G4: SEO — canonical 자기참조·sitemap 정합
  CHECK: node scripts/check-seo.mjs
  EXPECT: seo verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=seo verification passed (28 urls)
- [x] G5: v2 크롬 — 신규 페이지 topbar·크럼·글꼴
  CHECK: node scripts/check-v2-chrome.mjs
  EXPECT: v2 chrome verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=v2 chrome verification passed (28 pages)
- [x] G6: 라이트 대비
  CHECK: python3 scripts/ui_check_design.py --light
  EXPECT: light contrast verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=light contrast verification passed
- [x] G7: 다크 대비
  CHECK: python3 scripts/ui_check_design.py --dark
  EXPECT: dark contrast verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=dark contrast verification passed
- [x] G8: 터치 타깃
  CHECK: python3 scripts/ui_check_design.py --tap
  EXPECT: tap target verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=tap target verification passed
- [x] G9: 줄 길이
  CHECK: python3 scripts/ui_check_design.py --measure
  EXPECT: line measure verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=line measure verification passed
- [ ] G9b: 도해 글자 viewBox 적합
  CHECK: python3 scripts/ui_check_design.py --figfit
  EXPECT: fig fit verification passed
- [x] G10: 회귀 — 기존 스위트 전부
  CHECK: node scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=regression suite verification passed
- [x] G11: 사실 검증 (수동) — 3편의 모든 수치·조문 인용을 아카이브 원문과 대조
  종합검사 대상지역·차령(별표1: 비사업용 승용 4년 초과, 유효기간 2년) /
  정기검사 주기(비사업용 승용 2년, 신조차 최초 5년) / 기산(시행규칙 제74조:
  신규등록일 · 받은 날 다음날 · 기간 내 합격 시 종전 만료일 다음날) /
  검사기간(제77조②: 만료일 전 90일~후 31일, 2024-12-17 개정) /
  만료 후 소유권 변동 시 이전등록일부터 31일(제77조③) /
  검사 지연 과태료(4만 → 3일마다 2만 가산 → 115일 이상 60만) /
  이전등록 기한(등록령 제26조: 매수한 날부터 15일) /
  미신청은 과태료가 아니라 벌칙+범칙금(제80조1호·제85~87조, 별표3:
  10일 내 10만 → 1일 1만 가산 → 50일 이상 50만, 분할 불가) /
  양도자 대신 신청(제12조④·등록령 제27조) / 재양도 벌칙(제79조: 3년/3천만) /
  차량 취득세(지방세법 제12조: 비영업용 승용 7%, 경차 4%)
  EVIDENCE: 2026-09-13(집필 당일) 아카이브 원문(블로그/_자료/원문/자동차_*.md 8건)을
  열어 조문을 인용하며 썼고, 탈고 후 위 목록 11개 주장을 재대조. 전건 일치.
  특기 2건은 본문에 구조를 명시했다 — ① 검사기간 후 31일은 2024-12-17 개정 신설,
  ② 이전등록 미신청은 제84조(과태료)에 없고 제80조1호 벌칙→제85~87조 통고처분
  구조다(아카이브 머리말의 경고를 본문 각도로 채택).
- [ ] G12: 라이브 검증 (배포 후) — 27 URL 200·canonical·/car/ 서빙·gift 404
  CHECK: node /tmp/verify-live-v2d.mjs
  EXPECT: LIVE VERIFICATION PASSED
