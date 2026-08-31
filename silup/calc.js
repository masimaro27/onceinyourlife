/*
 * 구직급여 계산 엔진 — 순수 함수. UI/DOM 의존 없음.
 *
 * 법 제45조·제46조를 조문 순서 그대로 적용한다.
 *   기초일액 A = 평균임금(3개월 총급여 ÷ 3개월 총일수)
 *   제45조④  A < 최저기초일액 M(= 1일 소정근로시간 × 이직일 당시 시간급 최저임금) → A = M,
 *             이 경우 구직급여일액 = A × 80% (제46조①2)
 *   제45조⑤  A > 상한 기초일액 → A = 상한, 구직급여일액 = A × 60% (제46조①1)
 *   제46조②  산정된 구직급여일액 < 최저구직급여일액(M × 80%) → 최저구직급여일액
 *
 * 원 미만 처리 방식은 고시에서 확인하지 못했다. 버림(floor)을 쓰고 화면에 고지한다.
 */
(function (root) {
  'use strict';

  var DATA = (typeof module !== 'undefined' && module.exports)
    ? require('./data.js')
    : root.SILUP_DATA;

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }

  function fmt(dt) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return dt.getUTCFullYear() + '-' + p(dt.getUTCMonth() + 1) + '-' + p(dt.getUTCDate());
  }

  // 월 단위 가감. 말일 초과는 그 달의 말일로 맞춘다 (5/31 −3개월 → 2/28).
  function addMonths(dt, n) {
    var y = dt.getUTCFullYear(), m = dt.getUTCMonth() + n, d = dt.getUTCDate();
    var lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(d, lastDay)));
  }

  var DAY = 86400000;

  /**
   * 평균임금 산정기간.
   * 산정사유 발생일은 퇴직일(= 마지막 근무일의 다음 날)이고, 근로기준법은 그 "이전 3개월"을
   * 본다. 따라서 기간의 끝은 마지막 근무일(이직일) 당일이고, 시작은 3개월 전 다음 날이다.
   * return { start, end, totalDays }
   */
  function wagePeriod(leaveDateStr) {
    var leave = parseDate(leaveDateStr);
    if (!leave) throw new Error('bad_date');
    var end = leave;
    var start = new Date(addMonths(leave, -3).getTime() + DAY);
    var totalDays = Math.round((end.getTime() - start.getTime()) / DAY) + 1;
    return { start: fmt(start), end: fmt(end), totalDays: totalDays };
  }

  // 이직일에 적용되는 기초일액 상한
  function baseCapFor(leaveDateStr) {
    for (var i = 0; i < DATA.capTable.length; i++) {
      if (leaveDateStr >= DATA.capTable[i].from) return DATA.capTable[i];
    }
    return null;
  }

  // 이직일 연도의 시간급 최저임금
  function minWageFor(leaveDateStr) {
    var year = +leaveDateStr.slice(0, 4);
    return Object.prototype.hasOwnProperty.call(DATA.minWageByYear, year)
      ? DATA.minWageByYear[year] : null;
  }

  function payableDaysFor(ageGroup, insuredPeriod) {
    var row = DATA.payableDays[ageGroup];
    if (!row) throw new Error('bad_age_group');
    if (!Object.prototype.hasOwnProperty.call(row, insuredPeriod)) throw new Error('bad_insured_period');
    return row[insuredPeriod];
  }

  /**
   * 구직급여 계산.
   * input: { leaveDate:'YYYY-MM-DD', threeMonthPay, dailyWorkHours, ageGroup, insuredPeriod }
   */
  function calc(input) {
    var leaveDate = String(input.leaveDate || '').trim();
    if (!parseDate(leaveDate)) throw new Error('bad_date');
    if (leaveDate < DATA.supportedFrom || leaveDate > DATA.supportedTo) throw new Error('unsupported_date');

    var minWage = minWageFor(leaveDate);
    var cap = baseCapFor(leaveDate);
    if (minWage === null || !cap) throw new Error('unsupported_date');

    var pay = Number(input.threeMonthPay);
    if (!isFinite(pay) || pay < 0) pay = 0;

    var hours = Number(input.dailyWorkHours);
    if (!isFinite(hours) || hours <= 0) hours = 8;
    if (hours > 8) hours = 8; // 소정근로시간은 1일 8시간을 넘지 않는다

    var period = wagePeriod(leaveDate);
    var average = pay / period.totalDays;          // 제45조① 평균임금
    var minBase = minWage * hours;                 // 제45조④ 최저기초일액
    var minBenefit = Math.floor(minBase * DATA.minBenefitRate); // 최저구직급여일액

    // 상한은 구간에 따라 두 가지 형태로 들어온다.
    //   baseCap  — 시행령 제68조 원문에서 기초일액 상한을 확보한 구간
    //   dailyCap — 기초일액 상한 원문을 못 구하고 구직급여일액 상한만 확인한 구간
    // 둘 다 없는 행은 데이터 오류다. undefined와 비교하면 조용히 false가 되어
    // 상한이 통째로 누락되므로 여기서 명시적으로 막는다.
    var hasBaseCap = typeof cap.baseCap === 'number';
    var hasDailyCap = typeof cap.dailyCap === 'number';
    if (!hasBaseCap && !hasDailyCap) throw new Error('bad_cap_row:' + cap.from);

    // 구직급여일액 상한 — baseCap 구간은 60%를 곱해 얻고, dailyCap 구간은 그 값 자체다
    var capDaily = hasBaseCap ? Math.floor(cap.baseCap * DATA.benefitRate) : cap.dailyCap;

    var base = average;
    var applied = 'normal';   // normal | floor | cap
    if (hasBaseCap && base > cap.baseCap) { base = cap.baseCap; applied = 'cap'; }
    if (base < minBase) { base = minBase; applied = 'floor'; }

    var daily = (applied === 'floor')
      ? Math.floor(base * DATA.minBenefitRate)   // 제46조①2
      : Math.floor(base * DATA.benefitRate);     // 제46조①1

    if (daily > capDaily) {                      // 제46조① 단서 (상한액)
      daily = capDaily;
      applied = 'cap';
    }

    if (daily < minBenefit) {                    // 제46조②
      daily = minBenefit;
      applied = 'floor';
    }

    var days = payableDaysFor(input.ageGroup, input.insuredPeriod);

    return {
      leaveDate: leaveDate,
      period: period,
      averageWage: average,
      baseDaily: base,
      applied: applied,
      capBase: hasBaseCap ? cap.baseCap : null,   // 원문 미확보 구간은 null
      capDaily: capDaily,
      minWage: minWage,
      minBase: minBase,
      minBenefit: minBenefit,
      dailyBenefit: daily,
      payableDays: days,
      total: daily * days
    };
  }

  /** 조기재취업수당 = 잔여 소정급여일수 × 구직급여일액 × 1/2 */
  function earlyReemployment(remainingDays, dailyBenefit, payableDays) {
    var r = Math.floor(Number(remainingDays));
    if (!isFinite(r) || r < 0) r = 0;
    if (payableDays && r > payableDays) r = payableDays;
    var eligibleByDays = payableDays ? (r >= payableDays / 2) : null;
    return {
      remainingDays: r,
      amount: Math.floor(r * dailyBenefit * DATA.earlyRate),
      meetsHalfRule: eligibleByDays
    };
  }

  var CALC = {
    parseDate: parseDate,
    wagePeriod: wagePeriod,
    baseCapFor: baseCapFor,
    minWageFor: minWageFor,
    payableDaysFor: payableDaysFor,
    calc: calc,
    earlyReemployment: earlyReemployment
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CALC;
  else root.SILUP_CALC = CALC;
})(this);
