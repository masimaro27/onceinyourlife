/* UI 로직 — 상태를 모아 calc.js에 넘기고 결과를 그린다. */
(function () {
  'use strict';
  var DATA = window.LTC_DATA;
  var CALC = window.LTC_CALC;

  var state = {
    grade: 'g3',
    mode: 'home', // 'home' | 'facility'
    counts: {},   // serviceId -> count
    options: {},  // serviceId -> optionId
    facility: DATA.facilities[0].id,
    facilityDays: 30,
    burden: 'normal'
  };

  var WARN_TEXT = {
    shortStayOverCap: '단기보호는 월 9일 이내가 원칙입니다. 가족의 여행·병원치료 등 ' +
      '고시 사유가 있으면 연장할 수 있고, 가족휴가제(연 12일)는 월 한도액과 별개로 이용합니다.',
    visitNurseNeedsOrder: '방문간호는 의사의 방문간호지시서가 필요하고, 지시서 발급비용은 별도입니다.',
    facilityNonCovered: '식사재료비·상급침실 추가비용·이미용비는 비급여라서 이 금액에 ' +
      '포함되지 않았습니다. 실제 월 납부액은 이보다 큽니다.'
  };

  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function el(id) { return document.getElementById(id); }

  // ---- 1. 등급 ----
  function renderGrades() {
    var seg = el('gradeSeg');
    seg.innerHTML = '';
    DATA.grades.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = g.label;
      b.className = state.grade === g.id ? 'on' : '';
      b.addEventListener('click', function () {
        state.grade = g.id;
        renderGrades();
        renderHome();
        renderFacilityAvailability();
        recompute();
      });
      seg.appendChild(b);
    });
  }

  // ---- 2a. 재가 패널 ----
  function renderHome() {
    var panel = el('homePanel');
    panel.innerHTML = '';
    DATA.homeServices.forEach(function (svc) {
      var available = CALC.serviceAvailable(svc.id, state.grade);
      var div = document.createElement('div');
      div.className = 'svc' + (available ? '' : ' disabled');

      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = svc.label + (svc.unit === 'day' ? ' (1일당)' : ' (방문당)');
      div.appendChild(name);

      if (!available) {
        var why = document.createElement('div');
        why.className = 'why';
        why.textContent = '이 등급은 고시표에 수가가 없어 계산할 수 없습니다.';
        div.appendChild(why);
        delete state.counts[svc.id];
        panel.appendChild(div);
        return;
      }

      var row = document.createElement('div');
      row.className = 'row';

      var sel = document.createElement('select');
      sel.setAttribute('aria-label', svc.label + ' 종류');
      svc.options.forEach(function (op) {
        var price = CALC.unitPrice(svc.id, op.id, state.grade);
        if (price === null) return;
        var o = document.createElement('option');
        o.value = op.id;
        o.textContent = op.label + ' — ' + won(price);
        sel.appendChild(o);
      });
      sel.value = state.options[svc.id] || sel.options[0].value;
      state.options[svc.id] = sel.value;
      sel.addEventListener('change', function () {
        state.options[svc.id] = sel.value;
        recompute();
      });
      row.appendChild(sel);

      var input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '99';
      input.value = state.counts[svc.id] || 0;
      input.setAttribute('aria-label', svc.label + ' 월 횟수');
      input.addEventListener('input', function () {
        state.counts[svc.id] = input.value;
        recompute();
      });
      row.appendChild(input);

      var unit = document.createElement('span');
      unit.textContent = svc.unit === 'day' ? '일/월' : '회/월';
      row.appendChild(unit);

      div.appendChild(row);

      var note = document.createElement('div');
      note.className = 'unit-note';
      note.textContent = (svc.unit === 'day' ? '주 3일이면 월 약 13일' : '주 3회면 월 약 13회')
        + (svc.note ? ' · ' + svc.note : '');
      div.appendChild(note);

      panel.appendChild(div);
    });
  }

  // ---- 2b. 시설 패널 ----
  function renderFacilitySelect() {
    var sel = el('facilitySelect');
    sel.innerHTML = '';
    DATA.facilities.forEach(function (f) {
      var o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.label;
      sel.appendChild(o);
    });
    sel.value = state.facility;
    sel.addEventListener('change', function () {
      state.facility = sel.value;
      recompute();
    });
    el('facilityDays').addEventListener('input', function () {
      state.facilityDays = el('facilityDays').value;
      recompute();
    });
  }

  function renderFacilityAvailability() {
    var f = DATA.facilities[0];
    var ok = Object.prototype.hasOwnProperty.call(f.price, state.grade);
    el('facilityUnavailable').hidden = ok;
    el('facilitySelect').disabled = !ok;
    el('facilityDays').disabled = !ok;
  }

  // ---- 3. 감경 ----
  function renderBurden() {
    var sel = el('burdenSelect');
    sel.innerHTML = '';
    DATA.burden.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.id;
      o.textContent = b.label + ' — 재가 ' + (b.home * 100) + '% · 시설 ' + (b.facility * 100) + '%';
      sel.appendChild(o);
    });
    sel.value = state.burden;
    sel.addEventListener('change', function () {
      state.burden = sel.value;
      recompute();
    });
  }

  // ---- 탭 ----
  function bindTabs() {
    el('tabHome').addEventListener('click', function () { setMode('home'); });
    el('tabFacility').addEventListener('click', function () { setMode('facility'); });
  }
  function setMode(mode) {
    state.mode = mode;
    el('tabHome').className = mode === 'home' ? 'on' : '';
    el('tabFacility').className = mode === 'facility' ? 'on' : '';
    el('homePanel').hidden = mode !== 'home';
    el('facilityPanel').hidden = mode !== 'facility';
    recompute();
  }

  // ---- 결과 ----
  function recompute() {
    var body = el('resultBody');
    try {
      if (state.mode === 'home') renderHomeResult(body);
      else renderFacilityResult(body);
    } catch (e) {
      body.innerHTML = '<p class="hint">이 조합은 계산할 수 없습니다. ' +
        '등급과 서비스 선택을 확인해 주세요.</p>';
    }
  }

  function renderHomeResult(body) {
    var items = [];
    DATA.homeServices.forEach(function (svc) {
      var count = Math.floor(Number(state.counts[svc.id] || 0));
      if (count > 0 && CALC.serviceAvailable(svc.id, state.grade)) {
        items.push({ serviceId: svc.id, optionId: state.options[svc.id], count: count });
      }
    });
    var r = CALC.calcHome(state.grade, items, state.burden);

    if (items.length === 0) {
      body.innerHTML = '<p class="hint">이용할 서비스의 월 횟수를 입력하면 결과가 나옵니다. ' +
        '이 등급의 재가급여 월 한도액은 <strong>' + won(r.limit) + '</strong>입니다.</p>';
      return;
    }

    var pct = Math.min(100, Math.round(r.total / r.limit * 100));
    var html = '';
    html += '<ul class="lines">' + r.lines.map(function (l) {
      return '<li><span>' + l.label + ' × ' + l.count + '</span><span>' + won(l.subtotal) + '</span></li>';
    }).join('') + '</ul>';
    html += '<div class="gauge"><div class="bar' + (r.overLimit > 0 ? ' over' : '') + '" style="width:' + pct + '%"></div></div>';
    html += '<div class="hint">월 한도액 ' + won(r.limit) + ' 중 ' + won(r.total) + ' 사용' +
      (r.overLimit > 0 ? ' — <strong>한도 초과</strong>' : '') + '</div>';
    html += '<div class="rline total"><span>월 총 급여비용</span><span>' + won(r.total) + '</span></div>';
    html += '<div class="rline"><span>공단 부담</span><span>' + won(r.publicShare) + '</span></div>';
    html += '<div class="rline copay"><span>본인부담 (월)</span><span class="val">' + won(r.copay) + '</span></div>';
    if (r.overLimit > 0) {
      html += '<div class="warn-box">한도 초과분 ' + won(r.overLimit) +
        '은 전액 본인부담으로 계산했습니다. 조합을 줄이거나 기관과 상담해 보세요.</div>';
    }
    r.warnings.forEach(function (w) {
      if (WARN_TEXT[w]) html += '<div class="warn-box">' + WARN_TEXT[w] + '</div>';
    });
    body.innerHTML = html;
  }

  function renderFacilityResult(body) {
    var f = DATA.facilities[0];
    if (!Object.prototype.hasOwnProperty.call(f.price, state.grade)) {
      body.innerHTML = '<p class="hint" style="color:var(--warn)">인지지원등급은 시설급여 ' +
        '수가가 고시표에 없어 계산할 수 없습니다.</p>';
      return;
    }
    var r = CALC.calcFacility(state.grade, state.facility, state.facilityDays, state.burden);
    var html = '';
    html += '<div class="rline"><span>1일당 급여비용</span><span>' + won(r.daily) + '</span></div>';
    html += '<div class="rline"><span>입소일수</span><span>' + r.days + '일</span></div>';
    html += '<div class="rline total"><span>월 총 급여비용</span><span>' + won(r.total) + '</span></div>';
    html += '<div class="rline"><span>공단 부담</span><span>' + won(r.publicShare) + '</span></div>';
    html += '<div class="rline copay"><span>본인부담 (월)</span><span class="val">' + won(r.copay) + '</span></div>';
    html += '<div class="warn-box">' + WARN_TEXT.facilityNonCovered + '</div>';
    body.innerHTML = html;
  }

  // ---- 출처 ----
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

  renderGrades();
  renderHome();
  renderFacilitySelect();
  renderFacilityAvailability();
  renderBurden();
  bindTabs();
  renderSources();
  recompute();
})();
