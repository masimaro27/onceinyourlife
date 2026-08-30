/*
 * 장기요양 수가 데이터 — 2026.1.1. 기준 고시
 * 확인일: 2026-08-24 (브라우저 수집, 블로그/_자료/원문/노후돌봄_장기요양_급여와_본인부담.md)
 * 출처:
 *   월 한도액·급여비용  https://www.longtermcare.or.kr/npbs/e/b/502/npeb502m01.web?menuId=npe0000002742
 *   본인부담금 감경     https://www.longtermcare.or.kr/npbs/e/b/503/npeb503m01.web?menuId=npe0000002743
 *   급여 제공기준       https://www.longtermcare.or.kr/npbs/e/b/501/npeb501m01.web?menuId=npe0000002741
 *   부담률 법령         https://www.law.go.kr/법령/노인장기요양보험법시행령 (제15조의8)
 *   본인부담금 법령     https://www.law.go.kr/법령/노인장기요양보험법/제40조
 * 아카이브에 없는 값은 넣지 않는다 (인지활동형 방문요양, 복지용구 품목가, 치매전담형 시설).
 */
(function (root) {
  'use strict';

  var DATA = {
    baseDate: '2026-01-01',   // 수가 기준일
    verifiedDate: '2026-08-24', // 원문 확인일

    grades: [
      { id: 'g1', label: '1등급' },
      { id: 'g2', label: '2등급' },
      { id: 'g3', label: '3등급' },
      { id: 'g4', label: '4등급' },
      { id: 'g5', label: '5등급' },
      { id: 'cog', label: '인지지원등급' }
    ],

    // 재가급여(복지용구 제외) 월 한도액 — 법 제28조, 시행규칙 제22조
    monthlyLimit: {
      g1: 2512900, g2: 2331200, g3: 1528200,
      g4: 1409700, g5: 1208900, cog: 676320
    },

    // 본인부담률 — 시행령 제15조의8(재가 15%·시설 20%), 감경 고시(2018.8월 이후),
    // 면제: 법 제40조제2항(의료급여법 제3조제1항제1호 수급자)
    burden: [
      { id: 'normal',   label: '일반 (감경 없음)',                     home: 0.15, facility: 0.20 },
      { id: 'reduce40', label: '40% 감경 대상 (보험료 순위 25~50%)',   home: 0.09, facility: 0.12 },
      { id: 'reduce60', label: '60% 감경 대상 (보험료 순위 0~25%)',    home: 0.06, facility: 0.08 },
      { id: 'exempt',   label: '본인부담 면제 (의료급여법 제3조제1항제1호 수급자)', home: 0, facility: 0 }
    ],

    // 재가 서비스. unit: 'visit'(방문당) | 'day'(1일당)
    // priceBy: 'flat' = 등급 무관 옵션 단가, 'grade' = 등급×옵션 단가
    homeServices: [
      {
        id: 'visitCare', label: '방문요양', unit: 'visit', priceBy: 'flat',
        options: [
          { id: 'm30',  label: '30분 이상',  price: 17450 },
          { id: 'm60',  label: '60분 이상',  price: 25320 },
          { id: 'm90',  label: '90분 이상',  price: 34120 },
          { id: 'm120', label: '120분 이상', price: 43430 },
          { id: 'm150', label: '150분 이상', price: 50640 },
          { id: 'm180', label: '180분 이상', price: 57020 },
          { id: 'm210', label: '210분 이상', price: 63530 },
          { id: 'm240', label: '240분 이상', price: 70080 }
        ]
      },
      {
        id: 'visitBath', label: '방문목욕', unit: 'visit', priceBy: 'flat',
        options: [
          { id: 'carIn',  label: '차량 이용 · 차량 내 목욕', price: 88990 },
          { id: 'carHome',label: '차량 이용 · 가정 내 목욕', price: 80230 },
          { id: 'noCar',  label: '차량 미이용',              price: 50100 }
        ]
      },
      {
        id: 'visitNurse', label: '방문간호', unit: 'visit', priceBy: 'flat',
        note: '방문간호지시서가 필요하며 발급비용은 별도입니다.',
        options: [
          { id: 'n15', label: '15분 이상 30분 미만', price: 42880 },
          { id: 'n30', label: '30분 이상 60분 미만', price: 53770 },
          { id: 'n60', label: '60분 이상',           price: 64690 }
        ]
      },
      {
        id: 'dayNight', label: '주·야간보호', unit: 'day', priceBy: 'grade',
        options: [
          { id: 'h3',  label: '3시간 이상 6시간 미만',
            price: { g1: 41820, g2: 38720, g3: 35740, g4: 34120, g5: 32490, cog: 32490 } },
          { id: 'h6',  label: '6시간 이상 8시간 미만',
            price: { g1: 56060, g2: 51930, g3: 47940, g4: 46300, g5: 44650, cog: 44650 } },
          { id: 'h8',  label: '8시간 이상 10시간 미만',
            price: { g1: 69730, g2: 64590, g3: 59640, g4: 58010, g5: 56360, cog: 56360 } },
          { id: 'h10', label: '10시간 이상 13시간 이하',
            price: { g1: 76820, g2: 71160, g3: 65750, g4: 64090, g5: 62460, cog: 56360 } },
          { id: 'h13', label: '13시간 초과',
            price: { g1: 82370, g2: 76310, g3: 70500, g4: 68860, g5: 67240, cog: 56360 } }
        ]
      },
      {
        id: 'shortStay', label: '단기보호', unit: 'day', priceBy: 'grade',
        // 고시표에 인지지원등급 칸이 없다 → cog 키 없음(선택 불가 처리 근거)
        monthlyDayCap: 9, // 시행규칙 제11조: 월 9일 이내 원칙(연장 예외 있음)
        options: [
          { id: 'day', label: '1일당',
            price: { g1: 74060, g2: 68580, g3: 63350, g4: 61680, g5: 60000 } }
        ]
      }
    ],

    // 시설급여 1일당 — 고시표에 인지지원등급 칸이 없다 → cog 키 없음
    facilities: [
      { id: 'nursingHigh', label: '노인요양시설 (요양보호사 입소자 2.1명당 1명 이상)',
        price: { g1: 93070, g2: 86340, g3: 81540, g4: 81540, g5: 81540 } },
      { id: 'nursingLow',  label: '노인요양시설 (요양보호사 입소자 2.1명당 1명 미만)',
        price: { g1: 88520, g2: 82120, g3: 77540, g4: 77540, g5: 77540 } },
      { id: 'groupHome',   label: '노인요양공동생활가정 (정원 5~9명)',
        price: { g1: 74590, g2: 69210, g3: 63800, g4: 63800, g5: 63800 } }
    ],

    sources: [
      { label: '월 한도액 및 급여비용 (노인장기요양보험)', url: 'https://www.longtermcare.or.kr/npbs/e/b/502/npeb502m01.web?menuId=npe0000002742' },
      { label: '본인부담금 감경 (노인장기요양보험)', url: 'https://www.longtermcare.or.kr/npbs/e/b/503/npeb503m01.web?menuId=npe0000002743' },
      { label: '노인장기요양보험법 제40조(본인부담금)', url: 'https://www.law.go.kr/법령/노인장기요양보험법/제40조' }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.LTC_DATA = DATA;
})(this);
