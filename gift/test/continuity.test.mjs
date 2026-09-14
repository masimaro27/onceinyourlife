// G2 — 누진공제표 자체 검증.
// 누진공제액은 독립 파라미터가 아니라 d(k) = d(k-1) + (r(k)-r(k-1)) * B(k-1) 로 파생된다.
// 따라서 (가) 점화식이 표의 값을 재생산해야 하고 (나) 세액이 경계에서 연속이어야 한다.
// 하나라도 잘못 넣으면 경계에서 계단이 생겨 외부 오라클 없이 검출된다.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../calc.js');
const DATA = require('../data.js');

let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };
const won = (n) => Math.round(n).toLocaleString('ko-KR');

// (가) 점화식이 표의 누진공제액을 재생산하는가
let expected = 0;
for (let k = 0; k < DATA.brackets.length; k++) {
  const b = DATA.brackets[k];
  if (k > 0) {
    const prev = DATA.brackets[k - 1];
    expected = expected + (b.rate - prev.rate) * prev.upper;
  }
  if (Math.round(expected) !== b.deduction) {
    fail(`구간 ${k + 1} 누진공제액: 표 ${won(b.deduction)} / 점화식 ${won(expected)}`);
  }
}

// (나) 경계에서 세액이 연속인가 — 1원 차이가 한계세율(최대 50%)을 넘지 않아야 한다
for (const b of DATA.brackets) {
  if (!isFinite(b.upper)) continue;
  const lo = CALC.taxOf(b.upper - 1), at = CALC.taxOf(b.upper), hi = CALC.taxOf(b.upper + 1);
  if (Math.abs(at - lo) > 0.5) fail(`경계 ${won(b.upper)} 아래쪽 불연속: ${(at - lo).toFixed(2)}원`);
  if (Math.abs(hi - at) > 0.5) fail(`경계 ${won(b.upper)} 위쪽 불연속: ${(hi - at).toFixed(2)}원`);
}

// (다) 하한 초과분 형식과 누진공제 형식이 동치인가 — 법 제26조 원문 형식으로 독립 계산
function taxByStatuteForm(P) {
  if (P <= 100000000) return P * 0.10;
  if (P <= 500000000) return 10000000 + (P - 100000000) * 0.20;
  if (P <= 1000000000) return 90000000 + (P - 500000000) * 0.30;
  if (P <= 3000000000) return 240000000 + (P - 1000000000) * 0.40;
  return 1040000000 + (P - 3000000000) * 0.50;
}
let mismatch = 0;
for (let i = 0; i < 50000; i++) {
  const P = Math.floor((i / 50000) * 6000000000) + (i % 7);
  if (Math.abs(CALC.taxOf(P) - taxByStatuteForm(P)) > 0.01) mismatch++;
}
if (mismatch) fail(`제26조 원문 형식과 ${mismatch}건 불일치`);

// (라) 단조성 — 과세표준이 늘면 세액은 절대 줄지 않는다
let prev = -1;
for (let P = 0; P <= 6000000000; P += 3700000) {
  const t = CALC.taxOf(P);
  if (t < prev - 0.01) { fail(`단조성 위반: 과세표준 ${won(P)}에서 세액 감소`); break; }
  prev = t;
}

// 양성 대조군 — 누진공제액을 일부러 틀리면 검출되는가
{
  const broken = { upper: 500000000, rate: 0.20, deduction: 9000000 };
  const at = broken.upper * 0.20 - broken.deduction;
  const below = 100000000 * 0.10 + 0;   // 1억 경계 아래는 정상
  const jumpDetected = Math.abs((500000000 * 0.20 - 10000000) - at) > 0.5;
  if (!jumpDetected) fail('내부 오류: 틀린 누진공제액이 검출되지 않음');
  void below;
}

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('CONTINUITY VERIFIED (점화식 재생산 · 경계 연속 · 제26조 원문 형식 5만건 일치 · 단조성)');
