// G3 — 제47조③ 부담부증여 채무 추정
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../calc.js');
const DATA = require('../data.js');

let failed = 0;
const eq = (n, a, e) => { if (a !== e) { failed++; console.error(`FAIL ${n}: expected ${e}, got ${a}`); } };
// 배우자 공제가 6억이므로 모든 관계에서 세금이 발생하도록 충분히 큰 금액을 쓴다
const base = { giftValue: 2000000000, debtAmount: 500000000 };

// 배우자·직계존비속: 미입증이면 차감되지 않는다
for (const id of DATA.debtPresumed) {
  const off = CALC.calc({ ...base, relationId: id, debtProven: false });
  eq(`${id}.미입증.차단`, off.debtBlocked, true);
  eq(`${id}.미입증.차감액`, off.effectiveDebt, 0);
  eq(`${id}.미입증.경고`, off.warnings.includes('debtPresumedNotAssumed'), true);

  const on = CALC.calc({ ...base, relationId: id, debtProven: true });
  eq(`${id}.입증.차단안됨`, on.debtBlocked, false);
  eq(`${id}.입증.차감액`, on.effectiveDebt, 500000000);
  if (!(on.payable < off.payable)) { failed++; console.error(`FAIL ${id}: 입증 시 세금이 줄지 않음`); }
}

// 기타친족·그 밖: 추정 대상이 아니라 입증 없이도 차감된다
for (const id of ['relative', 'other']) {
  const r = CALC.calc({ ...base, relationId: id, debtProven: false });
  eq(`${id}.추정아님`, r.debtBlocked, false);
  eq(`${id}.차감액`, r.effectiveDebt, 500000000);
}

// 채무가 재산을 넘으면 재산가액까지만 차감한다
{
  const r = CALC.calc({ giftValue: 100000000, debtAmount: 300000000, relationId: 'relative' });
  eq('채무초과.차감상한', r.effectiveDebt, 100000000);
  eq('채무초과.과세가액', r.taxableGift, 0);
  eq('채무초과.세액', r.payable, 0);
}

// 양성 대조군 — 추정 목록이 실제로 판정에 쓰이는가
if (DATA.debtPresumed.indexOf('relative') !== -1) { failed++; console.error('FAIL 내부 오류: 기타친족이 추정 목록에 있음'); }
if (DATA.debtPresumed.indexOf('parent') === -1) { failed++; console.error('FAIL 내부 오류: 부모가 추정 목록에 없음'); }

if (failed) { console.error(`${failed} FAILED`); process.exit(1); }
console.log('DEBT PRESUMPTION VERIFIED');
