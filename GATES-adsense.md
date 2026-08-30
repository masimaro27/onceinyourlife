# Gates: 애드센스 승인 게이트 — 필수 페이지 3종 + ads.txt

OWNS: privacy/**, contact/**, about/**, ads.txt, scripts/check-static-pages.mjs, scripts/check-privacy.mjs, scripts/check-contact.mjs, scripts/check-about.mjs, scripts/check-links.mjs, scripts/check-adstxt.mjs, scripts/check-deployed.mjs, scripts/ui_check_pages.py, index.html, silup/index.html

Scope: onceinyourlife.co.kr에 애드센스 심사 통과에 필요한 신뢰 페이지 3종(개인정보처리방침·문의·소개)과
ads.txt를 추가하고, 기존 도구 2개와 상호 링크해 사이트 구조를 완성한다.

전제(2026-08-30 코드 스캔으로 확인): 사이트는 완전 정적이며 분석 스크립트·외부 리소스·
네트워크 전송·쿠키/브라우저 저장소가 전부 없다. 개인정보처리방침은 이 사실과 일치해야 한다.

- [x] G1: privacy/·contact/·about/ 세 페이지가 존재하고 GitHub Pages 디렉터리 URL로 해소되는 구조(각 index.html)이며 lang·title·description 메타를 갖춘다
  CHECK: node scripts/check-static-pages.mjs
  EXPECT: static pages verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=static pages verification passed

- [x] G2: 개인정보처리방침이 저장소의 실제 코드와 모순되지 않는다 — "수집하지 않는다"고 진술하면 실제로 추적·저장소·전송 코드가 0이어야 하고, 법정 기재사항(처리 목적·항목·보유기간·제3자 제공·책임자 연락처·시행일)과 광고 쿠키 고지를 모두 포함한다
  CHECK: node scripts/check-privacy.mjs
  EXPECT: privacy policy verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=privacy policy verification passed

- [x] G3: 문의 페이지에 실제 동작하는 mailto 연락 수단이 있고, 저장소 어디에도 회사 이메일 도메인이 들어가지 않는다 — 부정 검사는 알려진 양성 대조군으로 먼저 검증한다
  CHECK: node scripts/check-contact.mjs
  EXPECT: contact verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=contact verification passed

- [x] G4: 소개 페이지가 사이트 정체성·운영 주체·도구 2개를 설명하고 각 도구로 링크한다
  CHECK: node scripts/check-about.mjs
  EXPECT: about verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=about verification passed

- [x] G5: 5개 페이지(도구 2 + 신규 3) 전부에 3종 페이지로 가는 푸터 링크가 있고, 사이트 내부 링크가 전부 실제 파일로 해소된다(깨진 링크 0)
  CHECK: node scripts/check-links.mjs
  EXPECT: link verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=link verification passed

- [x] G6: 신규 3개 페이지가 390px 폭에서 가로 넘침 없이 렌더되고 콘솔 에러가 없다
  CHECK: python3 scripts/ui_check_pages.py
  EXPECT: pages UI verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=pages UI verification passed

- [x] G7: ads.txt가 유효한 AdSense 형식이다 — google.com, pub-<16자리 숫자>, DIRECT, f08c47fec0942fa0
  CHECK: node scripts/check-adstxt.mjs
  EXPECT: ads.txt verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; path=f681d46c4e3d/27 entries; output=ads.txt verification passed

- [x] G8: 배포 후 실제 URL 5개가 200을 반환하고 신규 3종의 내용이 실제로 서빙된다
  CHECK: node scripts/check-deployed.mjs
  EXPECT: deployment verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/minhyuk/Documents/_개인/앱/onceinyourlife; output=deployment verification passed — Pages build b0bb9c1 status=built; /, /silup/, /about/, /privacy/, /contact/ 전부 200 + 기대 문구 일치; /assets/site.css 200; 자리표시자 미배포 확인; 존재하지 않는 경로 200 아님(양성 대조군)

- [x] G9: 4-pass 개선 루프(전문가 재독·결함 사냥·폴리시) 마지막 회차에서 신규 발견 0건
  EVIDENCE: 1회차(2026-08-30) 발견 3건 —
    [중요] GitHub Pages가 저장소 전체를 서빙하므로 scripts/check-contact.mjs와 이 원장에 있던
           회사 도메인 리터럴이 그대로 공개됨. G3 게이트가 스스로 검출했고, 패턴을 런타임 조합으로
           바꿔 서빙 파일에서 리터럴을 제거함(재검증: 잔존 0).
    [중요] silup 작업트리 테스트 2건 실패(경과.기초일액/일액). 귀속 확인 결과 HEAD는 52/52 통과이고
           calc.js·data.js·test는 이번 작업 착수 전부터 있던 미커밋 WIP — 본 작업의 회귀가 아님.
           단 배포 시 이 WIP가 함께 나가므로 G8의 선행 차단 사유로 승격.
    [사소] 신규 페이지가 루트 상대 경로(/assets/site.css)를 쓰므로 file:// 검증이 무의미.
           ui_check_pages.py를 로컬 HTTP 서버 기동 방식으로 교체함.
  2회차 재독(구조 태그 중복·DOM 정합성·기존 게이트 회귀·임시 파일 잔존) — 신규 발견 0건.
  3회차 — 검증 공백 1건 메움: silup의 기존 UI 게이트가 WIP로 실패해 이번에 추가한 푸터 nav가
  미검증 상태였음. 도구 2개 페이지를 390px로 독립 검증 — overflow=0px, nav 표시됨(우측 374px),
  넘치는 요소 0. 신규 결함 발견 0건으로 루프 수렴.
  범위 밖 관찰 3건은 결함이 아니라 사이트 구조 사안이므로 최종 보고서로 넘김
  (홈페이지 부재, robots.txt/sitemap.xml 부재, 404 페이지 부재).
