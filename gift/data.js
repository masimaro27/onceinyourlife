/*
 * 증여세 데이터 — 수증자가 거주자이고 기본세율이 적용되는 증여
 * 확인일: 2026-09-02
 * 출처:
 *   세액계산 흐름도·공제표·세율표  국세청 mi=2340 (블로그/_자료/원문/증여_국세청_증여세.md)
 *   증여재산공제                   상속세 및 증여세법 제53조
 *   혼인·출산 증여재산공제          제53조의2  (증여_상증세법_혼인출산공제.md)
 *   세율                           제56조 → 제26조
 *   세대생략 할증                   제57조
 *   납부세액공제                    제58조
 *   신고세액공제 3%                 제69조②   (증여_상증세법_신고세액공제.md)
 *   과세표준·과세최저한              제55조
 *   과세가액·채무·10년 합산          제47조
 * 아카이브에 없는 값은 넣지 않는다 (감정평가수수료 한도, 재해손실공제, 외국납부세액공제).
 */
(function (root) {
  'use strict';

  var DATA = {
    baseDate: '2026-09-02',      // 기준일
    verifiedDate: '2026-09-02',  // 원문 확인일

    /* 증여자와의 관계 — 화면에는 일상어로 묻는다.
       category 는 제53조 각 호의 구분이고, 화면에는 드러내지 않는다. */
    relations: [
      { id: 'spouse',     label: '배우자',        category: 'spouse' },
      { id: 'parent',     label: '부모',          category: 'ascendant' },
      { id: 'grandparent',label: '조부모',        category: 'ascendant', canSkip: true },
      { id: 'child',      label: '자녀',          category: 'descendant' },
      { id: 'grandchild', label: '손자녀',        category: 'descendant' },
      { id: 'relative',   label: '형제자매·가까운 친척', category: 'relative' },
      { id: 'other',      label: '그 밖의 사람',   category: 'other' }
    ],

    /* 증여재산공제 한도 (제53조). 10년간의 누계 한도이며 증여자별이 아니라 관계 구분별이다. */
    deductionLimit: {
      spouse:     600000000,
      ascendant:   50000000,   // 수증자가 미성년자면 아래 minorAscendant
      descendant:  50000000,
      relative:    10000000,   // 4촌 이내 혈족, 3촌 이내 인척
      other:               0
    },
    minorAscendantLimit: 20000000,   // 제53조 제2호 괄호

    /* 혼인·출산 증여재산공제 (제53조의2).
       제53조와 별개 한도이고, ①혼인 + ②출산을 합쳐 총 1억이 상한이다(③). */
    marriageBirthLimit: 100000000,

    /* 세율 (제26조). 법은 「하한 초과분」 형식으로 쓰고, 아래 누진공제액은 그 변형이다.
       누진공제액은 독립 파라미터가 아니라 d(k) = d(k-1) + (r(k) - r(k-1)) * B(k-1) 로
       파생된다 — 그래서 경계에서 세액이 연속이어야 하고, 그 연속성이 이 표의 검증이 된다. */
    brackets: [
      { upper:  100000000, rate: 0.10, deduction:         0 },
      { upper:  500000000, rate: 0.20, deduction:  10000000 },
      { upper: 1000000000, rate: 0.30, deduction:  60000000 },
      { upper: 3000000000, rate: 0.40, deduction: 160000000 },
      { upper:   Infinity, rate: 0.50, deduction: 460000000 }
    ],

    /* 세대생략 할증 (제57조① + 시행령 제46조의3).
       법 본문만 보면 산출세액 전액에 30%를 더하는 것처럼 읽히지만, 제57조②가 계산방법을
       시행령에 위임했고 시행령 제46조의3②에 다음이 있다.
         [산출세액 × (부모를 제외한 직계존속에게서 받은 재산가액 / 총증여재산가액) × 30(또는 40)/100]
         − 종전에 납부한 할증과세액        (음수면 0)
       40% 트리거의 증여재산가액에는 제47조②로 가산하는 10년 내 증여가 포함된다(같은 조 ①). */
    surchargeRate: 0.30,
    surchargeRateMinor: 0.40,
    surchargeMinorThreshold: 2000000000,   // 증여재산가액 20억 초과

    filingCreditRate: 0.03,     // 신고세액공제 (제69조②)
    minTaxBase: 500000,         // 과세최저한 (제55조②) — 미만이면 부과하지 않는다
    priorGiftThreshold: 10000000, // 10년 합산 문턱 (제47조②)

    /* 제47조③ — 배우자간·직계존비속간 부담부증여는 채무를 인수하지 않은 것으로 추정한다.
       객관적 입증이 있어야 차감된다. 아래 관계가 추정 대상이다. */
    debtPresumed: ['spouse', 'parent', 'grandparent', 'child', 'grandchild'],

    sources: [
      { label: '상속세 및 증여세법 제47조(증여세 과세가액)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제47조' },
      { label: '제53조(증여재산 공제)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제53조' },
      { label: '제53조의2(혼인·출산 증여재산 공제)', url: 'https://www.law.go.kr/법령/상속세및증여세법/%EC%A0%9C53%EC%A1%B0%EC%9D%982' },
      { label: '제55조(증여세의 과세표준과 과세최저한)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제55조' },
      { label: '제56조·제26조(세율)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제26조' },
      { label: '제57조(직계비속에 대한 증여의 할증과세)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제57조' },
      { label: '시행령 제46조의3(할증과세액 계산방법)', url: 'https://www.law.go.kr/법령/상속세및증여세법시행령/%EC%A0%9C46%EC%A1%B0%EC%9D%983' },
      { label: '제58조(납부세액공제)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제58조' },
      { label: '제69조(신고세액 공제)', url: 'https://www.law.go.kr/법령/상속세및증여세법/제69조' },
      { label: '국세청 증여세 세액계산 흐름도', url: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2340&cntntsId=7728' }
    ]
  };

  if (typeof module === 'object' && module.exports) module.exports = DATA;
  else root.GIFT_DATA = DATA;
})(typeof self !== 'undefined' ? self : this);
