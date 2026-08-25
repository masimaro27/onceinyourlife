// calc.js 단위 테스트 — node test/calc.test.mjs
// 케이스는 스펙(docs/specs/2026-08-26-ltc-copay-calculator-design.md)의 계산 규칙을 고정한다.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../calc.js');
const DATA = require('../data.js');

let failed = 0;
let passed = 0;
function eq(name, actual, expected) {
  if (actual === expected) { passed++; return; }
  failed++;
  console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
}
function throws(name, fn, msgPart) {
  try { fn(); failed++; console.error(`FAIL ${name}: expected throw`); }
  catch (e) {
    if (msgPart && String(e.message).indexOf(msgPart) === -1) {
      failed++; console.error(`FAIL ${name}: wrong error ${e.message}`);
    } else passed++;
  }
}

// 1. 한도 이내 — 3등급, 방문요양 60분 × 월 20회
{
  const r = CALC.calcHome('g3', [{ serviceId: 'visitCare', optionId: 'm60', count: 20 }], 'normal');
  eq('이내.total', r.total, 25320 * 20);            // 506,400
  eq('이내.overLimit', r.overLimit, 0);
  eq('이내.copay', r.copay, Math.round(506400 * 0.15)); // 75,960
  eq('이내.publicShare', r.publicShare, 506400 - 75960);
}

// 2. 한도 초과 — 5등급, 주야간 6~8h × 26일 + 방문요양 60분 × 10회
{
  const r = CALC.calcHome('g5', [
    { serviceId: 'dayNight', optionId: 'h6', count: 26 },
    { serviceId: 'visitCare', optionId: 'm60', count: 10 }
  ], 'normal');
  const total = 44650 * 26 + 25320 * 10; // 1,160,900 + 253,200 = 1,414,100
  eq('초과.total', r.total, total);
  eq('초과.limit', r.limit, 1208900);
  eq('초과.overLimit', r.overLimit, total - 1208900); // 205,200
  eq('초과.copay', r.copay, Math.round(1208900 * 0.15) + 205200); // 181,335 + 205,200
}

// 3. 감경 60% 재가 = 6%
{
  const r = CALC.calcHome('g3', [{ serviceId: 'visitCare', optionId: 'm60', count: 20 }], 'reduce60');
  eq('감경60.copay', r.copay, Math.round(506400 * 0.06));
}

// 4. 면제 = 0 (한도 이내분), 초과분은 면제여도 전액 본인부담
{
  const r = CALC.calcHome('g3', [{ serviceId: 'visitCare', optionId: 'm60', count: 20 }], 'exempt');
  eq('면제.copay', r.copay, 0);
  const over = CALC.calcHome('cog', [{ serviceId: 'dayNight', optionId: 'h6', count: 20 }], 'exempt');
  // 인지지원 6~8h 44,650 × 20 = 893,000 > 한도 676,320 → 초과 216,680은 전액
  eq('면제.초과분', over.copay, 893000 - 676320);
}

// 5. 시설 — 1등급 요양시설(2.1:1 이상) × 30일 × 20%
{
  const r = CALC.calcFacility('g1', 'nursingHigh', 30, 'normal');
  eq('시설.total', r.total, 93070 * 30);          // 2,792,100
  eq('시설.copay', r.copay, Math.round(2792100 * 0.20)); // 558,420
  eq('시설.경고', r.warnings.includes('facilityNonCovered'), true);
}

// 6. 시설 감경 40% = 12%
{
  const r = CALC.calcFacility('g2', 'groupHome', 30, 'reduce40');
  eq('시설감경.copay', r.copay, Math.round(69210 * 30 * 0.12));
}

// 7. 단기보호 9일 초과 경고 / 9일 이하 무경고
{
  const over = CALC.calcHome('g4', [{ serviceId: 'shortStay', optionId: 'day', count: 10 }], 'normal');
  eq('단기.경고', over.warnings.includes('shortStayOverCap'), true);
  const ok = CALC.calcHome('g4', [{ serviceId: 'shortStay', optionId: 'day', count: 9 }], 'normal');
  eq('단기.무경고', ok.warnings.includes('shortStayOverCap'), false);
}

// 8. 인지지원등급 — 단기보호·시설 수가 없음
{
  eq('cog.단기보호불가', CALC.serviceAvailable('shortStay', 'cog'), false);
  eq('cog.주야간가능', CALC.serviceAvailable('dayNight', 'cog'), true);
  throws('cog.단기보호계산', () =>
    CALC.calcHome('cog', [{ serviceId: 'shortStay', optionId: 'day', count: 1 }], 'normal'), 'no_rate');
  throws('cog.시설계산', () => CALC.calcFacility('cog', 'nursingHigh', 30, 'normal'), 'no_rate');
}

// 9. 입력 방어 — 음수·소수·31일 초과
{
  const r = CALC.calcHome('g3', [{ serviceId: 'visitCare', optionId: 'm60', count: -5 }], 'normal');
  eq('방어.음수', r.total, 0);
  const f = CALC.calcFacility('g1', 'nursingHigh', 99, 'normal');
  eq('방어.일수상한', f.days, 31);
}

// 10. 방문간호 경고
{
  const r = CALC.calcHome('g3', [{ serviceId: 'visitNurse', optionId: 'n30', count: 4 }], 'normal');
  eq('간호.경고', r.warnings.includes('visitNurseNeedsOrder'), true);
}

if (failed > 0) {
  console.error(`${failed} FAILED / ${passed} passed`);
  process.exit(1);
}
console.log(`ALL TESTS PASSED (${passed} assertions)`);
