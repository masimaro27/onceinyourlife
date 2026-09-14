/*
 * 증여세 계산 엔진 — 수증자 거주자, 기본세율 적용 증여
 * 계산 순서는 국세청 세액계산 흐름도(mi=2340)와 조문을 따른다.
 */
(function (root) {
  'use strict';

  var DATA = (typeof module === 'object' && module.exports)
    ? require('./data.js') : root.GIFT_DATA;

  function relationOf(id) {
    for (var i = 0; i < DATA.relations.length; i++) {
      if (DATA.relations[i].id === id) return DATA.relations[i];
    }
    throw new Error('bad_relation:' + id);
  }

  /** 제53조 공제 한도 — 관계 구분별, 10년 누계 */
  function deductionLimitFor(relation, isMinor) {
    if (relation.category === 'ascendant' && isMinor) return DATA.minorAscendantLimit;
    if (!Object.prototype.hasOwnProperty.call(DATA.deductionLimit, relation.category)) {
      throw new Error('bad_category:' + relation.category);
    }
    return DATA.deductionLimit[relation.category];
  }

  /** 제26조 세율 — 과세표준에 대한 산출세액 */
  function taxOf(base) {
    if (!(base > 0)) return 0;
    for (var i = 0; i < DATA.brackets.length; i++) {
      var b = DATA.brackets[i];
      if (base <= b.upper) return base * b.rate - b.deduction;
    }
    throw new Error('no_bracket');
  }

  function num(v) {
    var n = Number(v);
    return (isFinite(n) && n > 0) ? n : 0;
  }

  /**
   * input:
   *   giftValue          증여재산가액
   *   relationId         relations[].id
   *   isMinor            수증자가 미성년자인가
   *   generationSkip     세대를 건너뛴 증여인가 (사용자 응답 — 관계로 자동 판정하지 않는다)
   *   skipExempt         최근친 직계비속 사망으로 할증에서 제외되는가 (제57조① 단서)
   *   debtAmount         수증자가 인수한 담보채무
   *   debtProven         그 채무 인수를 객관적으로 입증할 수 있는가 (제47조③)
   *   priorGift10y       10년 내 동일인에게서 받은 증여재산가액 합계
   *   priorTaxPaid       그 증여에 대해 납부한 증여세 산출세액 (제58조)
   *   priorDeduction10y  10년 내 이미 공제받은 증여재산공제액 (제53조 후단)
   *   marriageBirth      혼인·출산으로 받은 금액 (제53조의2)
   *   marriageBirthUsed  제53조의2로 이미 공제받은 금액
   */
  function calc(input) {
    var relation = relationOf(input.relationId);
    var isMinor = !!input.isMinor;

    var giftValue = num(input.giftValue);
    var debtAmount = num(input.debtAmount);
    var priorGift = num(input.priorGift10y);
    var priorTaxPaid = num(input.priorTaxPaid);
    var priorDeduction = num(input.priorDeduction10y);
    var marriageBirth = num(input.marriageBirth);
    var marriageBirthUsed = num(input.marriageBirthUsed);

    // 제47조③ — 배우자간·직계존비속간은 채무를 인수하지 않은 것으로 추정한다.
    // 객관적 입증이 있을 때만 차감한다.
    var presumed = DATA.debtPresumed.indexOf(relation.id) !== -1;
    var debtBlocked = presumed && !input.debtProven && debtAmount > 0;
    var effectiveDebt = debtBlocked ? 0 : Math.min(debtAmount, giftValue);

    // 제47조① 과세가액
    var taxableGift = giftValue - effectiveDebt;

    // 제47조② 10년 합산 — 합계가 문턱 이상일 때만 가산
    var addedPrior = (priorGift >= DATA.priorGiftThreshold) ? priorGift : 0;
    taxableGift += addedPrior;

    // 제53조 증여재산공제 — 10년 누계 한도에서 이미 쓴 만큼을 뺀 잔여
    var limit = deductionLimitFor(relation, isMinor);
    var remainingLimit = Math.max(0, limit - priorDeduction);
    var deduction = Math.min(remainingLimit, taxableGift);

    // 제53조의2 혼인·출산공제 — 직계존속에게서 받은 경우만, 제53조와 별개 한도
    var mbEligible = relation.category === 'ascendant';
    var mbRemaining = Math.max(0, DATA.marriageBirthLimit - marriageBirthUsed);
    var mbDeduction = mbEligible
      ? Math.min(mbRemaining, marriageBirth, Math.max(0, taxableGift - deduction))
      : 0;

    // 제55조 과세표준
    var taxBase = Math.max(0, taxableGift - deduction - mbDeduction);

    var result = {
      relationId: relation.id,
      giftValue: giftValue,
      debtAmount: debtAmount,
      debtBlocked: debtBlocked,
      effectiveDebt: effectiveDebt,
      addedPrior: addedPrior,
      priorGiftIgnored: priorGift > 0 && addedPrior === 0,
      deductionLimit: limit,
      deduction: deduction,
      marriageBirthDeduction: mbDeduction,
      marriageBirthEligible: mbEligible,
      taxableGift: taxableGift,
      taxBase: taxBase,
      warnings: []
    };

    // 경고는 세액과 무관한 사실이므로 과세최저한으로 빠지기 전에 채운다
    if (debtBlocked) result.warnings.push('debtPresumedNotAssumed');
    if (result.priorGiftIgnored) result.warnings.push('priorGiftBelowThreshold');

    // 제55조② 과세최저한
    if (taxBase < DATA.minTaxBase) {
      result.belowMinimum = true;
      result.computedTax = 0;
      result.surcharge = 0;
      result.surchargeRate = 0;
      result.priorTaxCredit = 0;
      result.filingCredit = 0;
      result.payable = 0;
      return result;
    }
    result.belowMinimum = false;

    // 제56조 → 제26조 산출세액
    var computedTax = Math.floor(taxOf(taxBase));
    result.computedTax = computedTax;

    // 제57조① + 시행령 제46조의3② 세대생략 할증
    //   [산출세액 × (부모 제외 직계존속에게서 받은 재산가액 / 총증여재산가액) × 비율]
    //   − 종전에 납부한 할증과세액,  음수면 0
    // 40% 트리거의 증여재산가액에는 10년 가산분을 포함한다(같은 조 ①).
    var surchargeRate = 0, surcharge = 0, skipRatio = 0;
    if (input.generationSkip && !input.skipExempt) {
      var valueForThreshold = giftValue + addedPrior;          // 시행령 제46조의3①
      surchargeRate = (isMinor && valueForThreshold > DATA.surchargeMinorThreshold)
        ? DATA.surchargeRateMinor : DATA.surchargeRate;
      // 이 계산기는 증여자가 한 사람이고 세대생략은 조부모에게서 받은 경우에만 열린다.
      // 따라서 분자(부모 제외 직계존속에게서 받은 재산) = 분모(총증여재산가액)이고 비율은 1이다.
      var totalGift = giftValue + addedPrior;
      skipRatio = totalGift > 0 ? 1 : 0;
      var priorSurcharge = num(input.priorSurchargePaid);
      surcharge = Math.max(0, Math.floor(computedTax * skipRatio * surchargeRate) - priorSurcharge);
    }
    result.surchargeRate = surchargeRate;
    result.skipRatio = skipRatio;
    result.surcharge = surcharge;

    var gross = computedTax + surcharge;
    result.gross = gross;

    // 제58조② 납부세액공제 한도 — 기준액은 "증여세산출세액"이며 제57조 할증을 포함하지 않는다.
    // (제69조②가 굳이 "제57조에 따라 가산하는 금액을 포함한다"고 밝히는 것이 그 반증이다.)
    var priorTaxCredit = 0;
    if (addedPrior > 0 && priorTaxPaid > 0) {
      var cap = taxBase > 0 ? computedTax * (Math.min(addedPrior, taxBase) / taxBase) : 0;
      priorTaxCredit = Math.floor(Math.min(priorTaxPaid, cap));
    }
    result.priorTaxCredit = priorTaxCredit;

    // 제69조② 신고세액공제 3% — 기준액에 제57조 할증을 포함하고,
    // 다른 공제·감면을 뺀 잔액에 곱한다. 반드시 마지막이다.
    var creditBase = Math.max(0, gross - priorTaxCredit);
    var filingCredit = Math.floor(creditBase * DATA.filingCreditRate);
    result.filingCredit = filingCredit;

    result.payable = Math.max(0, gross - priorTaxCredit - filingCredit);

    if (surcharge > 0 && addedPrior > 0 && num(input.priorSurchargePaid) === 0) {
      result.warnings.push('priorSurchargeUnknown');
    }
    if (addedPrior > 0 && priorTaxPaid === 0) {
      result.warnings.push('priorTaxUnknown');   // 이중과세 우려 — 화면에서 알린다
    }

    return result;
  }

  var API = { calc: calc, taxOf: taxOf, deductionLimitFor: deductionLimitFor, relationOf: relationOf };
  if (typeof module === 'object' && module.exports) module.exports = API;
  else root.GIFT_CALC = API;
})(typeof self !== 'undefined' ? self : this);
