// silup/calc.js 단위 테스트 — node silup/test/calc.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../calc.js');
const DATA = require('../data.js');

let failed = 0, passed = 0;
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

// 1. 평균임금 산정기간 — 마지막 근무일(이직일)까지 포함하는 3개월
{
  const p = CALC.wagePeriod('2026-08-28');
  eq('기간.start', p.start, '2026-05-29');
  eq('기간.end', p.end, '2026-08-28');        // 마지막 근무일 포함
  eq('기간.일수', p.totalDays, 92);           // 5/29~31=3 + 6월30 + 7월31 + 8/1~28=28
  eq('기간.2월포함', CALC.wagePeriod('2026-04-01').totalDays, 90); // 1/2~4/1 = 30+28+31+1
  // 말일 클램프: 5/31 −3개월 → 2/28 → 시작은 그 다음 날
  const c = CALC.wagePeriod('2026-05-31');
  eq('기간.말일클램프', c.start, '2026-03-01');
  eq('기간.말일클램프.end', c.end, '2026-05-31');
  eq('기간.말일클램프.일수', c.totalDays, 92); // 3월31 + 4월30 + 5월31
}

// 2. 상한 적용 — 2026년 이직, 고소득
{
  const r = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 30000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p10' });
  eq('상한.적용', r.applied, 'cap');
  eq('상한.기초일액', r.baseDaily, 113500);
  eq('상한.일액', r.dailyBenefit, 68100);       // 113,500 × 60%
  eq('상한.일수', r.payableDays, 240);
  eq('상한.총액', r.total, 68100 * 240);
}

// 3. 상한 경과조치 — 2025년 이직자는 구직급여일액 상한 66,000원.
//    data.js는 이 구간의 기초일액 상한 원문을 확보하지 못해 dailyCap만 기록한다.
//    66,000 ÷ 0.6 = 110,000 역산값을 기초일액으로 단정하지 않기로 했으므로,
//    기초일액은 캡되지 않고 일액 단계에서 상한이 걸리는 것이 의도한 동작이다.
{
  const r = CALC.calc({ leaveDate: '2025-12-31', threeMonthPay: 30000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p10' });
  eq('경과.적용', r.applied, 'cap');
  eq('경과.기초일액_캡없음', r.capBase, null);
  eq('경과.일액상한', r.capDaily, 66000);
  eq('경과.일액', r.dailyBenefit, 66000);
  const r26 = CALC.calc({ leaveDate: '2026-01-01', threeMonthPay: 30000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p10' });
  eq('경과.경계', r26.dailyBenefit, 68100);
}

// 4. 하한 적용 — 2026년 최저임금 10,320원, 8시간
{
  const r = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 3000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p1' });
  eq('하한.적용', r.applied, 'floor');
  eq('하한.최저기초일액', r.minBase, 10320 * 8);
  eq('하한.일액', r.dailyBenefit, Math.floor(10320 * 8 * 0.8)); // 66,048
  eq('하한.일수', r.payableDays, 150);
}

// 5. 하한 > 60% 산정액인 구간 (제46조② 발동) — 평균임금이 최저기초일액보다는 크지만 낮은 경우
{
  // 최저기초일액 82,560 / 최저구직급여일액 66,048. 평균임금 90,000 → 60% = 54,000 < 66,048
  const days = CALC.wagePeriod('2026-06-30').totalDays;
  const r = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 90000 * days,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p3' });
  eq('제46조2.평균임금', Math.round(r.averageWage), 90000);
  eq('제46조2.일액', r.dailyBenefit, 66048);
  eq('제46조2.적용', r.applied, 'floor');
}

// 6. 정상 구간 — 상·하한 모두 안 걸리는 구간은 2026년 기준 매우 좁다.
//    하한 66,048 < A×60% ≤ 상한 68,100  →  평균임금 일액 110,080원 초과 ~ 113,500원 이하
{
  const days = CALC.wagePeriod('2026-06-30').totalDays;
  const r = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 112000 * days,
    dailyWorkHours: 8, ageGroup: 'over50', insuredPeriod: 'p5' });
  eq('정상.적용', r.applied, 'normal');
  eq('정상.일액', r.dailyBenefit, 67200);     // 112,000 × 60%
  eq('정상.일수', r.payableDays, 240);        // 50세이상 5~10년
  eq('정상.총액', r.total, 67200 * 240);

  // 경계 바로 아래는 하한으로 떨어진다 (제46조②)
  const below = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 110000 * days,
    dailyWorkHours: 8, ageGroup: 'over50', insuredPeriod: 'p5' });
  eq('정상.경계아래', below.dailyBenefit, 66048);
}

// 7. 단시간 근로자 — 소정근로시간 4시간이면 하한이 절반
{
  const r = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 1000000,
    dailyWorkHours: 4, ageGroup: 'under50', insuredPeriod: 'p0' });
  eq('단시간.최저기초일액', r.minBase, 10320 * 4);
  eq('단시간.일액', r.dailyBenefit, Math.floor(10320 * 4 * 0.8)); // 33,024
  eq('단시간.일수', r.payableDays, 120);
}

// 8. 소정급여일수 표 전수 — 법 제50조 별표1 / 고용24 표
{
  const expect = {
    under50: { p0: 120, p1: 150, p3: 180, p5: 210, p10: 240 },
    over50:  { p0: 120, p1: 180, p3: 210, p5: 240, p10: 270 }
  };
  for (const age of Object.keys(expect)) {
    for (const per of Object.keys(expect[age])) {
      eq(`일수.${age}.${per}`, CALC.payableDaysFor(age, per), expect[age][per]);
    }
  }
}

// 9. 연도별 최저임금 반영
{
  const cases = [['2023-06-01', 9620], ['2024-06-01', 9860], ['2025-06-01', 10030],
                 ['2026-06-01', 10320], ['2027-06-01', 10700]];
  for (const [d, w] of cases) eq(`최저임금.${d}`, CALC.minWageFor(d), w);
}

// 10. 지원 범위 밖 이직일 / 잘못된 입력
{
  throws('범위밖.과거', () => CALC.calc({ leaveDate: '2022-12-31', threeMonthPay: 9000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p1' }), 'unsupported_date');
  throws('범위밖.미래', () => CALC.calc({ leaveDate: '2028-01-01', threeMonthPay: 9000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p1' }), 'unsupported_date');
  throws('날짜오류', () => CALC.calc({ leaveDate: '2026-02-30', threeMonthPay: 9000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p1' }), 'bad_date');
  throws('가입기간오류', () => CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: 9000000,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p99' }), 'bad_insured_period');
}

// 11. 음수 급여 방어 → 하한으로 수렴
{
  const r = CALC.calc({ leaveDate: '2026-06-30', threeMonthPay: -500,
    dailyWorkHours: 8, ageGroup: 'under50', insuredPeriod: 'p0' });
  eq('방어.음수', r.dailyBenefit, 66048);
}

// 12. 조기재취업수당 — 잔여일수 × 일액 × 1/2, 1/2 이상 남김 요건 판정
{
  const e = CALC.earlyReemployment(120, 68100, 240);
  eq('조기.금액', e.amount, Math.floor(120 * 68100 * 0.5));
  eq('조기.요건충족', e.meetsHalfRule, true);
  const e2 = CALC.earlyReemployment(119, 68100, 240);
  eq('조기.요건미달', e2.meetsHalfRule, false);
  const e3 = CALC.earlyReemployment(999, 68100, 240);
  eq('조기.상한클램프', e3.remainingDays, 240);
}

if (failed > 0) {
  console.error(`${failed} FAILED / ${passed} passed`);
  process.exit(1);
}
console.log(`ALL TESTS PASSED (${passed} assertions)`);
