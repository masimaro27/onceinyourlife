# GATES — 배포 C: 상속 클러스터 /inherit/ (허브 + 가이드 4편)

스펙: docs/specs/2026-09-13-site-v2-redesign.md 배포 C.
원칙: 사실은 블로그가 아니라 원문 아카이브에서 가져온다. 빈 페이지·준비중 문구 금지.
/gift/ 링크 금지(미배포 상태이므로 죽은 링크가 된다).

- [x] G1: 토큰 단일 소스
  CHECK: node scripts/check-tokens.mjs
  EXPECT: token verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=token verification passed (스케일 7단계)
- [x] G2: 원본성 — 신규 4편이 블로그 상속 편들과 문장 일치 0%·n-gram 20% 미만
  CHECK: node scripts/check-guide-originality.mjs
  EXPECT: guide originality verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=silup/guide/why-different/index.html — 문장 일치 0.0% / n-gram 1.5% | guide originality verification passed
- [x] G3: 링크 무결성 (신규 5페이지 포함, /gift/ 참조 금지 상태에서)
  CHECK: node scripts/check-links.mjs
  EXPECT: link verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=link verification passed
- [x] G4: SEO — 23 URL·canonical 자기참조·sitemap 정합
  CHECK: node scripts/check-seo.mjs
  EXPECT: seo verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=seo verification passed (24 urls)
- [x] G5: v2 크롬 — 신규 페이지 topbar·크럼·글꼴
  CHECK: node scripts/check-v2-chrome.mjs
  EXPECT: v2 chrome verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=v2 chrome verification passed (24 pages)
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
- [x] G9b: 도해 글자 viewBox 적합 — 라벨 잘림 방지 (이번 배포에서 3건 실측 적발 후 신설)
  CHECK: python3 scripts/ui_check_design.py --figfit
  EXPECT: fig fit verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=fig fit verification passed
- [x] G10: 회귀 — 기존 스위트 전부
  CHECK: node scripts/check-regression-suite.mjs
  EXPECT: regression suite verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=b62e9a293bcf/28 entries; output=regression suite verification passed
- [x] G11: 사실 검증 (수동) — 4편의 모든 수치·조문 인용을 아카이브 원문과 대조
  기한: 사망신고 1개월(가족관계등록법 제84조)·과태료 5만원 이하(제122조) /
  승인·포기 3월, 안 날 기준(민법 제1019조①)·특별한정승인(③④) /
  상속세 말일+6개월(상증법 제67조①) / 취득세 말일+6개월(지방세법 제20조①) /
  배우자 분할기한 신고기한 다음날+9개월(상증법 제19조②) /
  안심상속 말일+1년 / 등기 기한 없음(민법 제187조) /
  법정상속분 균분+배우자 5할 가산(제1009조) / 특별수익(제1008조, 2026-03-17 단서) /
  기여분(제1008조의2) / 서류 유효기간 3개월(부동산등기규칙 제62조) /
  상속등기 관할 무관(부동산등기법 제7조의3) / 1주택 상속 취득세 0.8% /
  동거주택: 100% 한도 6억(제23조의2)·요건 3호·예외(영 제20조의2·규칙 제9조의2)
  EVIDENCE: 2026-09-13 집필 방식 자체가 대조였다 — 블로그가 아니라 아카이브 원문
  (블로그/_자료/원문/상속_*.md 11건)을 열어 조문을 인용하며 썼고, 탈고 후 위 목록의
  18개 주장 각각을 해당 조문 원문과 재대조했다. 전건 일치. 특기: 등기 관할 특례는
  2025-01-31 시행이라 구 안내와 상충하며(아카이브 [치명적1] 기록), 제1008조 단서는
  2026-03-17 신설이라 개정 전 자료에 없다 — 두 곳 모두 본문에 시행일을 명기했다.
- [ ] G12: 라이브 검증 (배포 후) — 23 URL 200·canonical·/inherit/ 서빙·gift 404
  CHECK: node /tmp/verify-live-v2c.mjs
  EXPECT: LIVE VERIFICATION PASSED
