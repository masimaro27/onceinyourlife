/*
 * 구직급여(실업급여) 계산 데이터
 * 확인일: 2026-08-28 (브라우저 수집)
 * 아카이브: 블로그/_자료/원문/퇴직실직_구직급여일액_소정급여일수.md
 * 출처:
 *   고용보험법 제45조(급여의 기초가 되는 임금일액)  https://www.law.go.kr/법령/고용보험법/제45조
 *   고용보험법 제46조(구직급여일액)                  https://www.law.go.kr/법령/고용보험법/제46조
 *   고용보험법 제50조(소정급여일수)                  https://www.law.go.kr/법령/고용보험법/제50조
 *   고용보험법 시행령 제68조(상한액)                 https://www.law.go.kr/법령/고용보험법시행령/제68조
 *   시행령 부칙 제35934호(2025.12.23) 제4조 경과조치 https://www.law.go.kr/법령/고용보험법시행령/부칙
 *   소정급여일수 표 (고용24)  https://ei.work24.go.kr/ei/eih/eg/pb/pbPersonBnef/retrievePb0203Info.do
 *   연도별 최저임금           https://www.minimumwage.go.kr/minWage/policy/decisionMain.do
 *
 * ⚠ 고용24 안내 페이지의 "상한액 66,000원"은 시행령 제68조 개정(2025.12.23., 시행 2026.1.1.)이
 *   반영되지 않은 낡은 값이다. 법령이 정본이므로 아래 capTable을 쓴다.
 */
(function (root) {
  'use strict';

  var DATA = {
    verifiedDate: '2026-08-28',

    // 계산을 지원하는 이직일 범위 — 최저임금 데이터를 확보한 구간으로 한정한다
    supportedFrom: '2023-01-01',
    supportedTo: '2027-12-31',

    // 기초일액 상한 (시행령 제68조). from 이후 이직자에게 적용. 부칙 제4조 경과조치 반영.
    capTable: [
      { from: '2026-01-01', baseCap: 113500, note: '시행령 제68조 개정 2025.12.23. 시행 2026.1.1.' },
      { from: '2019-01-01', baseCap: 110000, note: '종전 규정 (고용24 안내 기준 상한 66,000원)' }
    ],

    // 최저임금법상 시간급 최저임금 (최저임금위원회 연도별 결정현황)
    minWageByYear: {
      2023: 9620,
      2024: 9860,
      2025: 10030,
      2026: 10320,
      2027: 10700
    },

    // 법 제46조 — 기초일액에 곱하는 비율
    benefitRate: 0.60,     // 제46조제1항제1호
    minBenefitRate: 0.80,  // 제46조제1항제2호 (최저구직급여일액)

    // 소정급여일수 (법 제50조 별표1 / 고용24 표, 이직일 2019.10.1. 이후)
    insuredPeriods: [
      { id: 'p0', label: '1년 미만' },
      { id: 'p1', label: '1년 이상 3년 미만' },
      { id: 'p3', label: '3년 이상 5년 미만' },
      { id: 'p5', label: '5년 이상 10년 미만' },
      { id: 'p10', label: '10년 이상' }
    ],
    ageGroups: [
      { id: 'under50', label: '50세 미만' },
      { id: 'over50', label: '50세 이상 또는 장애인' }
    ],
    payableDays: {
      under50: { p0: 120, p1: 150, p3: 180, p5: 210, p10: 240 },
      over50:  { p0: 120, p1: 180, p3: 210, p5: 240, p10: 270 }
    },

    // 조기재취업수당 — 잔여 소정급여일수의 1/2 (지급액 단일화)
    earlyRate: 0.5,

    sources: [
      { label: '고용보험법 제46조(구직급여일액)', url: 'https://www.law.go.kr/법령/고용보험법/제46조' },
      { label: '고용보험법 시행령 제68조(상한액)', url: 'https://www.law.go.kr/법령/고용보험법시행령/제68조' },
      { label: '고용24 구직급여 지급액(소정급여일수 표)', url: 'https://ei.work24.go.kr/ei/eih/eg/pb/pbPersonBnef/retrievePb0203Info.do' },
      { label: '최저임금위원회 연도별 최저임금 결정현황', url: 'https://www.minimumwage.go.kr/minWage/policy/decisionMain.do' }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.SILUP_DATA = DATA;
})(this);
