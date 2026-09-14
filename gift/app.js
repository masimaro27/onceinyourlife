(function () {
  'use strict';
  var DATA = window.GIFT_DATA, CALC = window.GIFT_CALC;
  var el = function (id) { return document.getElementById(id); };
  var won = function (n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString('ko-KR') + '원';
  };

  /* 억 단위 입력의 자릿수 사고를 막는다.
     350000000 -> "3억 5,000만원". 0을 하나 빠뜨려도 본인이 알아채도록 되읽어 준다. */
  function readback(n) {
    n = Math.floor(Number(n));
    if (!isFinite(n) || n <= 0) return '';
    var eok = Math.floor(n / 100000000);
    var man = Math.floor((n % 100000000) / 10000);
    var rest = n % 10000;
    var parts = [];
    if (eok) parts.push(eok.toLocaleString('ko-KR') + '억');
    if (man) parts.push(man.toLocaleString('ko-KR') + '만');
    if (rest) parts.push(rest.toLocaleString('ko-KR'));
    return parts.join(' ') + '원';
  }

  /* 금액 입력에 천단위 콤마를 넣는다. type=number 로는 콤마를 못 넣어 text 로 두고
     직접 서식한다. 커서는 앞쪽 숫자 개수로 위치를 되돌려 편집 중에 튀지 않게 한다. */
  function digitsBefore(str, pos) {
    var n = 0;
    for (var i = 0; i < pos && i < str.length; i++) if (str[i] >= '0' && str[i] <= '9') n++;
    return n;
  }
  function posForDigits(str, n) {
    if (n <= 0) return 0;
    var c = 0;
    for (var i = 0; i < str.length; i++) {
      if (str[i] >= '0' && str[i] <= '9') { c++; if (c === n) return i + 1; }
    }
    return str.length;
  }
  function formatMoneyInput(input) {
    var raw = input.value;
    var caret = input.selectionStart == null ? raw.length : input.selectionStart;
    var wanted = digitsBefore(raw, caret);
    var digits = raw.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    var formatted = digits === '' ? '' : Number(digits).toLocaleString('ko-KR');
    if (formatted !== raw) {
      input.value = formatted;
      try { var p = posForDigits(formatted, wanted); input.setSelectionRange(p, p); } catch (e) { /* 무시 */ }
    }
    return digits === '' ? 0 : Number(digits);
  }
  function moneyValue(id) { return Number(String(el(id).value).replace(/[^0-9]/g, '')) || 0; }

  var state = {
    relationId: 'parent', isMinor: false, generationSkip: false, skipExempt: false, debtProven: false
  };

  function renderRelations() {
    el('relSeg').innerHTML = DATA.relations.map(function (r) {
      return '<button type="button" data-id="' + r.id + '">' + r.label + '</button>';
    }).join('');
    el('relSeg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.relationId = b.getAttribute('data-id');
      syncVisibility(); recompute();
    });
  }

  function makeYn(id, key, onChange) {
    el(id).innerHTML = '<button type="button" data-v="1">예</button><button type="button" data-v="0">아니오</button>';
    el(id).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state[key] = b.getAttribute('data-v') === '1';
      if (onChange) onChange();
      syncVisibility(); recompute();
    });
  }

  function paintSelections() {
    Array.prototype.forEach.call(el('relSeg').children, function (b) {
      b.classList.toggle('on', b.getAttribute('data-id') === state.relationId);
    });
    [['minorYn', 'isMinor'], ['skipYn', 'generationSkip'],
     ['skipExemptYn', 'skipExempt'], ['debtProvenYn', 'debtProven']].forEach(function (p) {
      var box = el(p[0]); if (!box) return;
      Array.prototype.forEach.call(box.children, function (b) {
        b.classList.toggle('on', (b.getAttribute('data-v') === '1') === !!state[p[1]]);
      });
    });
  }

  /* 관계에 따라 물어볼 것만 보여준다 — 해당 없는 질문은 아예 감춘다 */
  function syncVisibility() {
    var rel = CALC.relationOf(state.relationId);
    var canSkip = !!rel.canSkip;
    el('skipCard').hidden = !canSkip;
    if (!canSkip) { state.generationSkip = false; state.skipExempt = false; }
    el('skipExemptField').hidden = !(canSkip && state.generationSkip);

    var mbEligible = rel.category === 'ascendant';
    el('mbCard').hidden = !mbEligible;
    if (!mbEligible) el('marriageBirth').value = '0';

    var presumed = DATA.debtPresumed.indexOf(rel.id) !== -1;
    var hasDebt = Number(moneyValue('debtAmount')) > 0;
    el('debtProvenField').hidden = !(presumed && hasDebt);

    var hasPrior = Number(moneyValue('priorGift')) >= DATA.priorGiftThreshold;
    el('priorTaxField').hidden = !hasPrior;
    // 종전 할증세액은 세대생략과 10년 합산이 겹칠 때만 의미가 있다
    el('priorSurchargeField').hidden = !(hasPrior && state.generationSkip);

    // 단계 번호를 보이는 카드 순서에 맞춘다
    var n = 2;
    if (canSkip) el('skipCard').querySelector('.step').textContent = (++n) + '.';
    if (mbEligible) el('mbCard').querySelector('.step').textContent = (++n) + '.';
    el('stepDebt').textContent = (++n) + '.';
    el('stepPrior').textContent = (++n) + '.';

    paintSelections();
  }

  function syncReadbacks() {
    [['giftValue', 'giftReadback'], ['marriageBirth', 'mbReadback'], ['debtAmount', 'debtReadback'],
     ['priorGift', 'priorReadback'], ['priorTax', 'priorTaxReadback'], ['priorSurcharge', 'priorSurchargeReadback'],
     ['priorDeduction', 'priorDedReadback']].forEach(function (p) {
      var input = el(p[0]), out = el(p[1]);
      if (input && out) out.textContent = readback(moneyValue(p[0]));
    });
  }

  function recompute() {
    syncReadbacks();
    var r;
    try {
      r = CALC.calc({
        giftValue: moneyValue('giftValue'),
        relationId: state.relationId,
        isMinor: state.isMinor,
        generationSkip: state.generationSkip,
        skipExempt: state.skipExempt,
        debtAmount: moneyValue('debtAmount'),
        debtProven: state.debtProven,
        priorGift10y: moneyValue('priorGift'),
        priorTaxPaid: moneyValue('priorTax'),
        priorDeduction10y: moneyValue('priorDeduction'),
        priorSurchargePaid: moneyValue('priorSurcharge'),
        marriageBirth: moneyValue('marriageBirth')
      });
    } catch (e) {
      el('resultBody').innerHTML = '<p class="hint">입력을 확인해 주세요.</p>';
      return;
    }

    var h = '';
    h += '<div class="rline"><span>받은 재산</span><span>' + won(r.giftValue) + '</span></div>';
    if (r.effectiveDebt > 0) h += '<div class="rline"><span class="minus">넘겨받은 빚</span><span class="minus">− ' + won(r.effectiveDebt) + '</span></div>';
    if (r.addedPrior > 0) h += '<div class="rline"><span>지난 10년 증여 합산</span><span>+ ' + won(r.addedPrior) + '</span></div>';
    if (r.deduction > 0) h += '<div class="rline"><span class="minus">관계에 따른 공제</span><span class="minus">− ' + won(r.deduction) + '</span></div>';
    if (r.marriageBirthDeduction > 0) h += '<div class="rline"><span class="minus">결혼·출산 공제</span><span class="minus">− ' + won(r.marriageBirthDeduction) + '</span></div>';
    h += '<div class="rline"><span>세금을 매기는 금액</span><span>' + won(r.taxBase) + '</span></div>';

    if (r.belowMinimum) {
      h += '<div class="rline total"><span>낼 세금</span><span class="val">0원</span></div>';
      h += '<div class="warn-box">세금을 매기는 금액이 50만원보다 적어 증여세를 물리지 않습니다.</div>';
    } else {
      h += '<div class="rline"><span>세율을 곱한 세금</span><span>' + won(r.computedTax) + '</span></div>';
      if (r.surcharge > 0) h += '<div class="rline"><span>세대를 건너뛴 할증 (' + Math.round(r.surchargeRate * 100) + '%)</span><span>+ ' + won(r.surcharge) + '</span></div>';
      if (r.priorTaxCredit > 0) h += '<div class="rline"><span class="minus">전에 낸 세금 공제</span><span class="minus">− ' + won(r.priorTaxCredit) + '</span></div>';
      h += '<div class="rline"><span class="minus">기한 안에 신고하면 (3%)</span><span class="minus">− ' + won(r.filingCredit) + '</span></div>';
      h += '<div class="rline total"><span>낼 세금</span><span class="val">' + won(r.payable) + '</span></div>';
      if (r.payable > 0) h += '<div class="rline"><span></span><span class="minus">' + readback(r.payable) + '</span></div>';
    }

    if (r.warnings.indexOf('debtPresumedNotAssumed') !== -1) {
      h += '<div class="warn-box"><strong>넘겨받은 빚을 빼지 않고 계산했습니다.</strong> ' +
           '가족끼리 주고받은 경우에는 빚을 넘겨받았다는 서류가 있어야만 빼줍니다. ' +
           '서류가 있다면 위에서 “예”를 골라 주세요.</div>';
    }
    if (r.warnings.indexOf('priorTaxUnknown') !== -1) {
      h += '<div class="warn-box"><strong>그때 낸 세금을 0으로 두고 계산했습니다.</strong> ' +
           '실제로 세금을 냈다면 그만큼 빼주므로, 지금 나온 금액보다 적게 나옵니다.</div>';
    }
    if (r.warnings.indexOf('priorSurchargeUnknown') !== -1) {
      h += '<div class="warn-box"><strong>지난 10년 증여에서 할증으로 낸 세금을 0으로 두고 계산했습니다.</strong> ' +
           '그때도 세대를 건너뛴 증여였다면 그만큼 빼주므로, 지금 나온 금액보다 적게 나옵니다.</div>';
    }
    if (r.warnings.indexOf('priorGiftBelowThreshold') !== -1) {
      h += '<div class="warn-box">지난 10년 증여가 1,000만원보다 적어 합치지 않았습니다. ' +
           '1,000만원 이상일 때만 합쳐서 계산합니다.</div>';
    }
    el('resultBody').innerHTML = h;
  }

  function renderSources() {
    el('sourceList').innerHTML = DATA.sources.map(function (s) {
      return '<li><a href="' + s.url + '" rel="noopener noreferrer nofollow" target="_blank">' + s.label + '</a></li>';
    }).join('');
  }

  renderRelations();
  makeYn('minorYn', 'isMinor');
  makeYn('skipYn', 'generationSkip');
  makeYn('skipExemptYn', 'skipExempt');
  makeYn('debtProvenYn', 'debtProven');
  renderSources();

  ['giftValue', 'marriageBirth', 'debtAmount', 'priorGift', 'priorTax', 'priorDeduction', 'priorSurcharge'].forEach(function (id) {
    el(id).addEventListener('input', function () { formatMoneyInput(el(id)); syncVisibility(); recompute(); });
    el(id).addEventListener('change', function () { syncVisibility(); recompute(); });
  });

  syncVisibility();
  recompute();
})();
