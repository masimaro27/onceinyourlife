/*
 * 계산 엔진 — 순수 함수. UI/DOM 의존 없음.
 * 규칙 근거: 노인장기요양보험법 제40조(한도 초과분 전액 본인부담),
 * 시행령 제15조의8(재가 15%·시설 20%), 감경 고시.
 * 원단위 처리 고시는 아카이브에 없어 반올림 사용(결과 화면에 고지).
 */
(function (root) {
  'use strict';

  var DATA = (typeof module !== 'undefined' && module.exports)
    ? require('./data.js')
    : root.LTC_DATA;

  function findBurden(burdenId) {
    for (var i = 0; i < DATA.burden.length; i++) {
      if (DATA.burden[i].id === burdenId) return DATA.burden[i];
    }
    throw new Error('unknown burden: ' + burdenId);
  }

  function findService(serviceId) {
    for (var i = 0; i < DATA.homeServices.length; i++) {
      if (DATA.homeServices[i].id === serviceId) return DATA.homeServices[i];
    }
    throw new Error('unknown service: ' + serviceId);
  }

  function findOption(service, optionId) {
    for (var i = 0; i < service.options.length; i++) {
      if (service.options[i].id === optionId) return service.options[i];
    }
    throw new Error('unknown option: ' + service.id + '/' + optionId);
  }

  // 단가 조회. 등급별 수가가 고시표에 없으면(예: 인지지원등급 단기보호) null.
  function unitPrice(serviceId, optionId, gradeId) {
    var service = findService(serviceId);
    var option = findOption(service, optionId);
    if (service.priceBy === 'flat') return option.price;
    return Object.prototype.hasOwnProperty.call(option.price, gradeId)
      ? option.price[gradeId] : null;
  }

  // 등급이 그 서비스를 이용할 수 있는가 = 고시표에 수가가 있는가
  function serviceAvailable(serviceId, gradeId) {
    var service = findService(serviceId);
    if (service.priceBy === 'flat') return true;
    for (var i = 0; i < service.options.length; i++) {
      if (Object.prototype.hasOwnProperty.call(service.options[i].price, gradeId)) return true;
    }
    return false;
  }

  /**
   * 재가 조합 계산.
   * items: [{ serviceId, optionId, count }]  count = 월 이용 횟수(방문당) 또는 일수(1일당)
   * return { lines, total, limit, withinLimit, overLimit, copay, publicShare, warnings }
   */
  function calcHome(gradeId, items, burdenId) {
    if (!Object.prototype.hasOwnProperty.call(DATA.monthlyLimit, gradeId)) {
      throw new Error('unknown grade: ' + gradeId);
    }
    var burden = findBurden(burdenId);
    var warnings = [];
    var lines = [];
    var total = 0;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var count = Number(it.count);
      if (!isFinite(count) || count < 0) count = 0;
      count = Math.floor(count);
      var service = findService(it.serviceId);
      var price = unitPrice(it.serviceId, it.optionId, gradeId);
      if (price === null) {
        throw new Error('no_rate:' + it.serviceId + ':' + gradeId);
      }
      var subtotal = price * count;
      total += subtotal;
      lines.push({
        serviceId: it.serviceId, optionId: it.optionId,
        label: service.label + ' · ' + findOption(service, it.optionId).label,
        unitPrice: price, count: count, subtotal: subtotal
      });
      if (service.id === 'shortStay' && count > service.monthlyDayCap) {
        warnings.push('shortStayOverCap');
      }
      if (service.id === 'visitNurse' && count > 0) {
        warnings.push('visitNurseNeedsOrder');
      }
    }

    var limit = DATA.monthlyLimit[gradeId];
    var withinLimit = Math.min(total, limit);
    var overLimit = Math.max(0, total - limit);
    // 한도 이내분 × 부담률 + 초과분 전액
    var copay = Math.round(withinLimit * burden.home) + overLimit;
    var publicShare = withinLimit - Math.round(withinLimit * burden.home);

    return {
      type: 'home', gradeId: gradeId, burdenId: burdenId,
      lines: lines, total: total, limit: limit,
      withinLimit: withinLimit, overLimit: overLimit,
      copay: copay, publicShare: publicShare,
      warnings: dedupe(warnings)
    };
  }

  /**
   * 시설 계산. days = 그 달의 입소일수.
   * return { daily, days, total, copay, publicShare, warnings }
   */
  function calcFacility(gradeId, facilityId, days, burdenId) {
    var burden = findBurden(burdenId);
    var facility = null;
    for (var i = 0; i < DATA.facilities.length; i++) {
      if (DATA.facilities[i].id === facilityId) facility = DATA.facilities[i];
    }
    if (!facility) throw new Error('unknown facility: ' + facilityId);
    if (!Object.prototype.hasOwnProperty.call(facility.price, gradeId)) {
      throw new Error('no_rate:' + facilityId + ':' + gradeId);
    }
    var d = Number(days);
    if (!isFinite(d) || d < 0) d = 0;
    d = Math.floor(d);
    if (d > 31) d = 31;

    var daily = facility.price[gradeId];
    var total = daily * d;
    var copay = Math.round(total * burden.facility);
    return {
      type: 'facility', gradeId: gradeId, burdenId: burdenId,
      facilityId: facilityId, daily: daily, days: d,
      total: total, copay: copay, publicShare: total - copay,
      warnings: ['facilityNonCovered'] // 식사재료비·상급침실·이미용비 별도
    };
  }

  function dedupe(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (out.indexOf(arr[i]) === -1) out.push(arr[i]);
    }
    return out;
  }

  var CALC = {
    unitPrice: unitPrice,
    serviceAvailable: serviceAvailable,
    calcHome: calcHome,
    calcFacility: calcFacility
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CALC;
  else root.LTC_CALC = CALC;
})(this);
