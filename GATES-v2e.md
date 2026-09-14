# GATES — 배포 E: 연금·건강 클러스터 /pension/ (허브 + 가이드 3편)

스펙: docs/specs/2026-09-13-site-v2-redesign.md 배포 E.
원칙: 사실은 원문 아카이브(보험금융_*.md 5건)에서 가져온다. 빈 페이지·준비중 문구 금지.
/gift/ 링크 금지(미배포 상태이므로 죽은 링크가 된다).

- [x] G1: 토큰 단일 소스
  CHECK: node scripts/check-tokens.mjs
  EXPECT: token verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=token verification passed (스케일 7단계)
- [x] G2: 원본성 — 신규 3편이 블로그 보험·금융 편들과 문장 일치 0%·n-gram 20% 미만
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
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=seo verification passed (31 urls)
- [x] G5: v2 크롬 — 신규 페이지 topbar·크럼·글꼴
  CHECK: node scripts/check-v2-chrome.mjs
  EXPECT: v2 chrome verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=v2 chrome verification passed (31 pages)
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
- [x] G9b: 도해 글자 viewBox 적합
  CHECK: python3 scripts/ui_check_design.py --figfit
  EXPECT: fig fit verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=fig fit verification passed
- [x] G10: 회귀 — 기존 스위트 전부
  CHECK: node scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=a784d83f2cdf/28 entries; output=regression suite verification passed
- [x] G11: 사실 검증 (수동) — 3편의 모든 수치·조문 인용을 아카이브 원문과 대조
  연금계좌: 공제율 12%/15%(종합소득 4,500만·총급여 5,500만 이하, 소득세법 제59조의3) /
  한도 두 층(납입 1,800만 vs 공제 연금저축 600만·합산 900만) /
  한도 초과 납입분은 과세제외금액으로 세금 없이 먼저 인출 / ISA 전환 10%·300만 中 소액 /
  IRP: 연금 55세·지급기간 5년(근퇴법 시행령 제18조) · 세법 가입 5년(이연퇴직소득 면제) /
  수령한도 = 평가액÷(11−연차)×120%(시행령 제40조의2, 11년차부터 미적용) /
  이연퇴직소득 세율: 원천징수세율의 70%(10년 이하)·60%(10~20년)·50%(20년 초과) /
  그 외 연금소득: 70세 미만 5%·70~80세 4%·80세 이상 3%·종신계약 3%, 동시 충족 시 낮은 쪽 /
  건강검진: 대상(건보법 제52조: 직장·세대주·20세 이상 지역/피부양) / 주기(시행령 제25조:
  2년 1회, 비사무직 1년) / 암검진 6종 주기·연령(암관리법 시행령 별표1) /
  과태료(산안법: 사업주 1천만 이하·근로자 300만 이하 — 건보법엔 개인 과태료 없음)
  EVIDENCE: 2026-09-13~14 아카이브(보험금융_*.md 5건) 조문 인용 집필 후 위 목록
  전건 재대조 일치. 특기: ① IRP 수령한도 산식은 조문 이미지의 alt 복구본 기준
  ② 「개인 과태료 없음」은 아카이브가 2026-09-06 스스로 정정한 자리라(산안법 제133조
  근로자 300만) 두 법을 나란히 놓는 각도로 채택 ③ 「짝·홀수 연도」 통념은 아카이브에
  원문 근거가 없어 본문에서 배제하고 공단 조회 안내로 대체.
- [ ] G12: 라이브 검증 (배포 후) — 31 URL 200·canonical·/pension/ 서빙·gift 404
  CHECK: node /tmp/verify-live-v2e.mjs
  EXPECT: LIVE VERIFICATION PASSED
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=/gift/ → 404 | LIVE VERIFICATION PASSED
