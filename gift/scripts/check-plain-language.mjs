// G5 — 화면이 세무 용어 대신 일상어를 쓰는지, 억 단위 되읽기가 있는지
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'app.js'), 'utf8');
let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };

// 화면에 보이는 텍스트만 검사한다 (script/style 제외)
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '')
                    .replace(/<style[\s\S]*?<\/style>/g, '')
                    .replace(/<[^>]+>/g, ' ');

// (1) 세무 서식 용어가 화면에 노출되면 안 된다
const JARGON = ['수증자', '증여자와의 관계', '증여재산가액', '채무인수액', '과세가액',
                '직계존속', '직계비속', '기타친족', '피상속인', '과세표준'];
for (const w of JARGON) {
  if (visible.includes(w)) fail(`화면에 세무 용어 노출: "${w}"`);
}

// (2) 일상어 라벨이 실제로 있어야 한다
const PLAIN = ['누구에게서 받았나요', '받은 재산이 얼마인가요', '받는 분이 미성년자인가요',
               '빚도 함께 넘겨받았나요', '지난 10년 안에 같은 분께 받은 적이 있나요',
               '세금을 매기는 금액', '낼 세금'];
for (const w of PLAIN) {
  if (!visible.includes(w) && !app.includes(w)) fail(`일상어 라벨 없음: "${w}"`);
}

// (3) 억 단위 되읽기가 구현돼 있어야 한다
if (!/function readback/.test(app)) fail('억 단위 되읽기 함수(readback) 없음');
if (!/100000000/.test(app)) fail('되읽기가 억 단위를 다루지 않음');
const readbackTargets = (html.match(/class="readback"/g) || []).length;
if (readbackTargets < 3) fail(`되읽기 표시 자리가 ${readbackTargets}개뿐`);

// (4) 금액 입력마다 되읽기가 붙어 있어야 한다
// 금액 입력은 콤마를 넣기 위해 type="text" inputmode="numeric" 으로 둔다 (type=number 는 콤마 불가)
const moneyInputs = [...html.matchAll(/<input id="(\w+)" class="money"/g)].map((m) => m[1]);
if (/<input[^>]*class="money"[^>]*type="number"/.test(html)) fail("금액 입력이 type=number 라 콤마를 넣을 수 없다");
if (!/function formatMoneyInput/.test(app)) fail("천단위 콤마 서식 함수 없음");
if (!/setSelectionRange/.test(app)) fail("콤마 서식이 커서 위치를 보존하지 않음");
for (const id of moneyInputs) {
  if (!app.includes(`'${id}'`)) fail(`${id} 입력이 app.js에서 다뤄지지 않음`);
}
if (moneyInputs.length < 4) fail(`금액 입력이 ${moneyInputs.length}개뿐`);

// (5) 모르면 어떻게 할지 알려주는 안내가 있어야 한다
if (!/없으면 0으로 두세요/.test(visible)) fail('"없으면 0으로 두세요" 안내 없음');
if (!/모르면/.test(visible)) fail('모를 때의 안내 없음');

// 양성 대조군 — 용어 탐지가 실제로 동작하는가
if (!'이 문장에는 수증자라는 말이 있다'.includes('수증자')) fail('내부 오류: 용어 탐지 실패');

if (failed) { console.error(`${failed} failure(s)`); process.exit(1); }
console.log('plain language verification passed');
