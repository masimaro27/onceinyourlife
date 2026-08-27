/* UI 로직 — 입력을 모아 calc.js에 넘기고 결과를 그린다. */
(function () {
  'use strict';
  var DATA = window.SILUP_DATA;
  var CALC = window.SILUP_CALC;

  var state = { ageGroup: 'under50' };

  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function el(id) { return document.getElementById(id); }

  var APPLIED_TEXT = {
    cap: { badge: '상한 적용', cls: 'cap' },
    floor: { badge: '하한 적용', cls: 'floor' },
    normal: { badge: '평균임금의 60%', cls: 'normal' }
  };

  function renderAges() {
    var seg = el('ageSeg');
    seg.innerHTML = '';
    DATA.ageGroups.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = g.label;
      b.className = state.ageGroup === g.id ? 'on' : '';
      b.addEventListener('click', function () {
        state.ageGroup = g.id;
        renderAges();
        recompute();
      });
      seg.appendChild(b);
    });
  }

  function renderPeriods() {
    var sel = el('insuredPeriod');
    sel.innerHTML = '';
    DATA.insuredPeriods.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.label;
      sel.appendChild(o);
    });
    sel.value = 'p5';
  }

  function renderSources() {
    var ul = el('sourceList');
    DATA.sources.forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.label;
      a.rel = 'noopener';
      a.target = '_blank';
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  function updatePeriodHint(leaveDate) {
    var hint = el('periodHint');
    try {
      var p = CALC.wagePeriod(leaveDate);
      hint.textContent = '평균임금 산정기간: ' + p.start + ' ~ ' + p.end + ' (' + p.totalDays + '일)';
    } catch (e) {
      hint.textContent = '';
    }
  }

  function recompute() {
    var body = el('resultBody');
    var leaveDate = el('leaveDate').value;
    updatePeriodHint(leaveDate);

    var r;
    try {
      r = CALC.calc({
        leaveDate: leaveDate,
        threeMonthPay: el('threeMonthPay').value,
        dailyWorkHours: el('dailyWorkHours').value,
        ageGroup: state.ageGroup,
        insuredPeriod: el('insuredPeriod').value
      });
    } catch (e) {
      var msg = (String(e.message).indexOf('unsupported_date') === 0 || e.message === 'unsupported_date')
        ? '이 계산기는 이직일 ' + DATA.supportedFrom + ' ~ ' + DATA.supportedTo +
          ' 구간만 지원합니다. 그 밖의 시기는 최저임금·상한액이 달라 고용센터에 확인하세요.'
        : '이직일과 급여를 확인해 주세요.';
      body.innerHTML = '<p class="hint" style="color:var(--warn)">' + msg + '</p>';
      el('earlyBody').innerHTML = '';
      return;
    }

    var a = APPLIED_TEXT[r.applied];
    var html = '';
    html += '<div class="rline"><span>평균임금 (일)</span><span>' + won(r.averageWage) + '</span></div>';
    html += '<div class="rline"><span>구직급여일액<span class="badge ' + a.cls + '">' + a.badge +
            '</span></span><span><strong>' + won(r.dailyBenefit) + '</strong></span></div>';
    html += '<div class="rline"><span>소정급여일수</span><span>' + r.payableDays + '일</span></div>';
    html += '<div class="rline total"><span>총 예상 수령액</span><span class="val">' + won(r.total) + '</span></div>';

    if (r.applied === 'cap') {
      html += '<div class="warn-box">평균임금이 상한을 넘어 <strong>' + won(r.capDaily) +
        '</strong>으로 깎였습니다. 월급이 높을수록 계산해보면 생각보다 적게 나오는 이유입니다. ' +
        '(기초일액 상한 ' + won(r.capBase) + ' × 60%)</div>';
    } else if (r.applied === 'floor') {
      html += '<div class="info-box">하한액이 적용됐습니다. 이직일 기준 최저임금 ' +
        won(r.minWage) + '(시간급) × 소정근로시간 × 80% = <strong>' + won(r.minBenefit) +
        '</strong>이 최저 보장액입니다.</div>';
    }

    // 2026년 기준 상·하한 폭이 매우 좁다는 사실을 알려준다 — 다른 계산기에 없는 설명
    var spread = r.capDaily - r.minBenefit;
    if (spread >= 0) {
      html += '<details><summary>왜 상한이나 하한에 걸리나요?</summary>' +
        '<p class="hint">이직일 기준 하한은 ' + won(r.minBenefit) + ', 상한은 ' + won(r.capDaily) +
        '입니다. 둘의 차이가 ' + won(spread) + '뿐이라, 평균임금이 일 ' +
        won(Math.floor(r.minBenefit / 0.6)) + '보다 낮으면 하한, 일 ' + won(r.capBase) +
        '보다 높으면 상한에 걸립니다. 그 사이 구간에서만 평균임금의 60%가 그대로 적용됩니다.</p>' +
        '</details>';
    }

    body.innerHTML = html;
    renderEarly(r);
  }

  function renderEarly(r) {
    var box = el('earlyBody');
    var remaining = Number(el('remainingDays').value);
    if (!isFinite(remaining) || remaining <= 0) { box.innerHTML = ''; return; }

    var e = CALC.earlyReemployment(remaining, r.dailyBenefit, r.payableDays);
    var html = '<div class="rline"><span>남은 소정급여일수</span><span>' + e.remainingDays + '일</span></div>';
    html += '<div class="rline"><span>조기재취업수당 (잔여일수의 1/2)</span><span><strong>' +
      won(e.amount) + '</strong></span></div>';
    if (e.meetsHalfRule === false) {
      html += '<div class="warn-box">소정급여일수 ' + r.payableDays + '일의 <strong>1/2 이상</strong>(' +
        Math.ceil(r.payableDays / 2) + '일 이상)을 남기고 재취업해야 요건을 채웁니다. ' +
        '지금 입력한 ' + e.remainingDays + '일로는 받지 못합니다.</div>';
    } else {
      html += '<div class="info-box">일수 요건은 채웠습니다. 다만 12개월 계속 고용과 제외 사유를 ' +
        '모두 통과해야 하고, <strong>12개월이 지난 뒤 신청하는 사후지급</strong>입니다.</div>';
    }
    box.innerHTML = html;
  }

  ['leaveDate', 'threeMonthPay', 'dailyWorkHours', 'insuredPeriod', 'remainingDays'].forEach(function (id) {
    el(id).addEventListener('input', recompute);
    el(id).addEventListener('change', recompute);
  });

  renderAges();
  renderPeriods();
  renderSources();
  recompute();
})();
