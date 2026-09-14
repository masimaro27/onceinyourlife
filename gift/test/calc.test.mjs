// 증여세 계산 엔진 단위 테스트 — node gift/test/calc.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../calc.js');
const DATA = require('../data.js');

let failed = 0, passed = 0;
function eq(name, actual, expected) {
  if (actual === expected) { passed++; return; }
  failed++; console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
}
function throws(name, fn, part) {
  try { fn(); failed++; console.error(`FAIL ${name}: expected throw`); }
  catch (e) {
    if (part && String(e.message).indexOf(part) === -1) { failed++; console.error(`FAIL ${name}: wrong error ${e.message}`); }
    else passed++;
  }
}
const C = (o) => CALC.calc(o);

// 1. 기본 — 부모가 성년 자녀에게 3억
{
  const r = C({ giftValue: 300000000, relationId: 'parent' });
  eq('기본.공제', r.deduction, 50000000);
  eq('기본.과세표준', r.taxBase, 250000000);
  eq('기본.산출세액', r.computedTax, 40000000);      // 2.5억×20% − 1천만
  eq('기본.신고세액공제', r.filingCredit, 1200000);   // 4천만 × 3%
  eq('기본.납부', r.payable, 38800000);
}

// 2. 증여재산공제 한도 — 관계별
{
  eq('공제.배우자', C({ giftValue: 1000000000, relationId: 'spouse' }).deduction, 600000000);
  eq('공제.부모', C({ giftValue: 1000000000, relationId: 'parent' }).deduction, 50000000);
  eq('공제.조부모', C({ giftValue: 1000000000, relationId: 'grandparent' }).deduction, 50000000);
  eq('공제.자녀', C({ giftValue: 1000000000, relationId: 'child' }).deduction, 50000000);
  eq('공제.친척', C({ giftValue: 1000000000, relationId: 'relative' }).deduction, 10000000);
  eq('공제.그밖', C({ giftValue: 1000000000, relationId: 'other' }).deduction, 0);
  // 미성년은 직계존속에게서 받을 때만 2천만
  eq('공제.미성년.부모', C({ giftValue: 1000000000, relationId: 'parent', isMinor: true }).deduction, 20000000);
  eq('공제.미성년.자녀', C({ giftValue: 1000000000, relationId: 'child', isMinor: true }).deduction, 50000000);
  eq('공제.미성년.배우자', C({ giftValue: 1000000000, relationId: 'spouse', isMinor: true }).deduction, 600000000);
}

// 3. 10년 누계 한도 — 이미 쓴 만큼 줄어든다
{
  eq('누계.일부사용', C({ giftValue: 300000000, relationId: 'parent', priorDeduction10y: 30000000 }).deduction, 20000000);
  eq('누계.전부사용', C({ giftValue: 300000000, relationId: 'parent', priorDeduction10y: 50000000 }).deduction, 0);
  eq('누계.초과사용', C({ giftValue: 300000000, relationId: 'parent', priorDeduction10y: 90000000 }).deduction, 0);
}

// 4. 10년 합산 문턱 — 1천만원
{
  const under = C({ giftValue: 300000000, relationId: 'parent', priorGift10y: 9999999 });
  eq('합산.문턱미만.가산', under.addedPrior, 0);
  eq('합산.문턱미만.무시표시', under.priorGiftIgnored, true);
  const over = C({ giftValue: 300000000, relationId: 'parent', priorGift10y: 10000000 });
  eq('합산.문턱이상.가산', over.addedPrior, 10000000);
  eq('합산.문턱이상.과세가액', over.taxableGift, 310000000);
}

// 5. 납부세액공제 — 이중과세 방지
{
  const noCredit = C({ giftValue: 300000000, relationId: 'parent', priorGift10y: 100000000 });
  eq('납부공제.미입력.경고', noCredit.warnings.includes('priorTaxUnknown'), true);
  const withCredit = C({ giftValue: 300000000, relationId: 'parent', priorGift10y: 100000000, priorTaxPaid: 5000000 });
  eq('납부공제.적용', withCredit.priorTaxCredit, 5000000);
  if (!(withCredit.payable < noCredit.payable)) { failed++; console.error('FAIL 납부공제: 세금이 줄지 않음'); }
  // 한도 — 과다 입력해도 안분 한도를 넘지 않는다
  const capped = C({ giftValue: 300000000, relationId: 'parent', priorGift10y: 100000000, priorTaxPaid: 999999999 });
  if (!(capped.priorTaxCredit < 999999999)) { failed++; console.error('FAIL 납부공제: 한도가 걸리지 않음'); }
}

// 6. 혼인·출산공제 — 직계존속만, 합쳐 1억 상한, 제53조와 별개
{
  const m = C({ giftValue: 300000000, relationId: 'parent', marriageBirth: 100000000 });
  eq('혼인출산.공제', m.marriageBirthDeduction, 100000000);
  eq('혼인출산.제53조와별개', m.deduction, 50000000);
  eq('혼인출산.과세표준', m.taxBase, 150000000);
  // 상한 — 이미 쓴 만큼 줄어든다
  eq('혼인출산.기사용', C({ giftValue: 300000000, relationId: 'parent', marriageBirth: 100000000, marriageBirthUsed: 60000000 }).marriageBirthDeduction, 40000000);
  eq('혼인출산.상한초과', C({ giftValue: 300000000, relationId: 'parent', marriageBirth: 300000000 }).marriageBirthDeduction, 100000000);
  // 직계존속이 아니면 적용되지 않는다
  eq('혼인출산.배우자불가', C({ giftValue: 300000000, relationId: 'spouse', marriageBirth: 100000000 }).marriageBirthDeduction, 0);
  eq('혼인출산.자녀불가', C({ giftValue: 300000000, relationId: 'child', marriageBirth: 100000000 }).marriageBirthDeduction, 0);
  eq('혼인출산.친척불가', C({ giftValue: 300000000, relationId: 'relative', marriageBirth: 100000000 }).marriageBirthDeduction, 0);
}

// 7. 세율 구간 — 각 구간 대표값
{
  eq('세율.1억이하', CALC.taxOf(100000000), 10000000);
  eq('세율.5억', CALC.taxOf(500000000), 90000000);
  eq('세율.10억', CALC.taxOf(1000000000), 240000000);
  eq('세율.30억', CALC.taxOf(3000000000), 1040000000);
  eq('세율.30억초과', CALC.taxOf(4000000000), 1540000000);
}

// 8. 과세최저한 50만원
{
  const below = C({ giftValue: 50499999, relationId: 'parent' });   // 과세표준 499,999
  eq('최저한.미만.표시', below.belowMinimum, true);
  eq('최저한.미만.세액', below.payable, 0);
  const at = C({ giftValue: 50500000, relationId: 'parent' });      // 과세표준 500,000
  eq('최저한.도달.표시', at.belowMinimum, false);
  if (!(at.payable > 0)) { failed++; console.error('FAIL 최저한.도달: 세액이 0'); }
}

// 9. 세대생략 할증 — 산출세액 전액 기준, 안분 없음
{
  const plain = C({ giftValue: 1000000000, relationId: 'grandparent' });
  const skip = C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true });
  eq('할증.비율', skip.surchargeRate, 0.30);
  eq('할증.금액', skip.surcharge, Math.floor(plain.computedTax * 0.3));
  // 최근친 사망 제외
  eq('할증.제외', C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true, skipExempt: true }).surcharge, 0);
  // 40% — 미성년 + 증여재산가액 20억 초과 (과세표준이 아니라 재산가액 기준)
  eq('할증.40%.경계아래', C({ giftValue: 2000000000, relationId: 'grandparent', generationSkip: true, isMinor: true }).surchargeRate, 0.30);
  eq('할증.40%.경계위', C({ giftValue: 2000000001, relationId: 'grandparent', generationSkip: true, isMinor: true }).surchargeRate, 0.40);
  eq('할증.40%.성년은30%', C({ giftValue: 5000000000, relationId: 'grandparent', generationSkip: true, isMinor: false }).surchargeRate, 0.30);
}

// 9-2. 시행령 제46조의3 — 할증 계산방법
{
  // ① 40% 트리거의 증여재산가액에 10년 가산분이 포함된다
  const only = C({ giftValue: 1500000000, relationId: 'grandparent', generationSkip: true, isMinor: true });
  eq('할증.가산전.30%', only.surchargeRate, 0.30);
  const withPrior = C({ giftValue: 1500000000, relationId: 'grandparent', generationSkip: true, isMinor: true,
                        priorGift10y: 1000000000, priorTaxPaid: 1 });
  eq('할증.가산포함.40%', withPrior.surchargeRate, 0.40);   // 15억 + 10억 = 25억 > 20억

  // ② 종전에 납부한 할증과세액을 뺀다
  const noPrev = C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true });
  const withPrev = C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true, priorSurchargePaid: 5000000 });
  eq('할증.종전차감', withPrev.surcharge, noPrev.surcharge - 5000000);

  // ③ 음수면 0
  const negative = C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true, priorSurchargePaid: 999999999 });
  eq('할증.음수는0', negative.surcharge, 0);

  // ④ 안분 비율 — 이 계산기 범위에서는 1
  eq('할증.안분비율', noPrev.skipRatio, 1);
  eq('할증.비적용시비율0', C({ giftValue: 1000000000, relationId: 'grandparent' }).skipRatio, 0);

  // ⑤ 세대생략 + 10년 합산이면 종전 할증세액을 묻는 경고가 뜬다
  eq('할증.종전미입력경고', withPrior.warnings.includes('priorSurchargeUnknown'), true);
  eq('할증.종전입력시경고없음',
     C({ giftValue: 1500000000, relationId: 'grandparent', generationSkip: true,
         priorGift10y: 1000000000, priorTaxPaid: 1, priorSurchargePaid: 1000 })
       .warnings.includes('priorSurchargeUnknown'), false);
}

// 9-3. 제58조② 납부세액공제 한도 — 기준액은 산출세액(할증 제외)
{
  const r = C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true,
                priorGift10y: 500000000, priorTaxPaid: 999999999 });
  // 한도가 산출세액 기준이면 할증을 포함한 gross 기준보다 작아야 한다
  const capOnComputed = Math.floor(r.computedTax * (Math.min(r.addedPrior, r.taxBase) / r.taxBase));
  eq('납부공제.한도기준.산출세액', r.priorTaxCredit, capOnComputed);
  if (r.priorTaxCredit >= r.gross) { failed++; console.error('FAIL 납부공제: 한도가 gross 기준으로 계산됨'); }
}

// 10. 신고세액공제 3% — 기준액에 할증을 포함한다 (제69조②)
{
  const r = C({ giftValue: 1000000000, relationId: 'grandparent', generationSkip: true });
  eq('신고공제.할증포함', r.filingCredit, Math.floor((r.computedTax + r.surcharge) * 0.03));
  const noSkip = C({ giftValue: 1000000000, relationId: 'grandparent' });
  if (!(r.filingCredit > noSkip.filingCredit)) { failed++; console.error('FAIL 신고공제: 할증이 기준액에 안 들어감'); }
  // 납부세액공제를 뺀 잔액이 기준이다
  const withPrior = C({ giftValue: 300000000, relationId: 'parent', priorGift10y: 100000000, priorTaxPaid: 5000000 });
  eq('신고공제.잔액기준', withPrior.filingCredit, Math.floor((withPrior.gross - withPrior.priorTaxCredit) * 0.03));
}

// 11. 비정상 입력
{
  eq('입력.0원', C({ giftValue: 0, relationId: 'parent' }).payable, 0);
  eq('입력.음수', C({ giftValue: -100, relationId: 'parent' }).payable, 0);
  eq('입력.문자', C({ giftValue: 'abc', relationId: 'parent' }).payable, 0);
  throws('입력.잘못된관계', () => C({ giftValue: 100000000, relationId: 'nope' }), 'bad_relation');
}

// 12. 데이터 무결성
{
  eq('데이터.구간수', DATA.brackets.length, 5);
  eq('데이터.신고공제율', DATA.filingCreditRate, 0.03);
  eq('데이터.과세최저한', DATA.minTaxBase, 500000);
  eq('데이터.혼인출산한도', DATA.marriageBirthLimit, 100000000);
  eq('데이터.할증기준', DATA.surchargeMinorThreshold, 2000000000);
}

if (failed) { console.error(`${failed} FAILED / ${passed} passed`); process.exit(1); }
console.log(`ALL TESTS PASSED (${passed} assertions)`);
