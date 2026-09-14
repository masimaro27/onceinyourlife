# G4 — 실제 브라우저에서 계산 흐름과 모바일 폭을 검증한다.
# 루트 상대 경로(/assets/tokens.css)를 쓰므로 로컬 HTTP 서버로 띄운다.
# python3 gift/scripts/ui_check.py
import functools, http.server, pathlib, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent   # 사이트 루트
failures = []

def _token_bg():
    import re as _re, pathlib as _pl
    css = _pl.Path(__file__).resolve().parent.parent.parent.joinpath("assets/tokens.css").read_text()
    m = _re.search(r"--bg:\s*#([0-9a-fA-F]{6})", css.split("@media")[0])
    h = m.group(1)
    return "rgb(%d, %d, %d)" % (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))

def check(name, cond, detail=""):
    if not cond: failures.append(f"{name}: {detail}")

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT))) as httpd:
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}/gift/"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1000, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base, wait_until="networkidle")

        check("js.error", not errors, str(errors[:3]))
        check("css.applied",
              page.evaluate("getComputedStyle(document.body).backgroundColor") == _token_bg(),
              page.evaluate("getComputedStyle(document.body).backgroundColor"))

        # 기본값(부모→3억)이 렌더되는가
        txt = page.inner_text("#resultBody")
        check("result.rendered", "낼 세금" in txt, txt[:120])
        check("result.amount", "38,800,000원" in txt, txt[:200])

        # 억 단위 되읽기
        check("readback", "3억" in page.inner_text("#giftReadback"), page.inner_text("#giftReadback"))

        # 관계에 따라 물어볼 것만 보인다
        check("skip.hidden.parent", page.is_hidden("#skipCard"), "부모인데 세대생략 카드가 보임")
        check("mb.visible.parent", page.is_visible("#mbCard"), "부모인데 결혼·출산 카드가 안 보임")
        page.click("#relSeg button[data-id='grandparent']"); page.wait_for_timeout(150)
        check("skip.visible.grandparent", page.is_visible("#skipCard"), "조부모인데 세대생략 카드가 안 보임")
        page.click("#relSeg button[data-id='relative']"); page.wait_for_timeout(150)
        check("mb.hidden.relative", page.is_hidden("#mbCard"), "친척인데 결혼·출산 카드가 보임")

        # 세대생략 할증이 실제로 결과를 바꾸는가
        page.click("#relSeg button[data-id='grandparent']"); page.wait_for_timeout(120)
        before = page.inner_text("#resultBody")
        page.click("#skipYn button:text-is('예')"); page.wait_for_timeout(150)
        after = page.inner_text("#resultBody")
        check("skip.changes", "할증" in after and before != after, after[:150])
        check("skipExempt.appears", page.is_visible("#skipExemptField"), "할증 예인데 사망 질문이 안 나옴")

        # 채무 추정 — 가족이면 입증 질문이 뜨고, 미입증이면 경고가 나온다
        page.click("#relSeg button[data-id='parent']"); page.wait_for_timeout(120)
        page.fill("#debtAmount", "100000000"); page.wait_for_timeout(200)
        check("debt.proven.appears", page.is_visible("#debtProvenField"), "가족 채무인데 입증 질문이 안 나옴")
        check("debt.warn", "빚을 빼지 않고" in page.inner_text("#resultBody"), page.inner_text("#resultBody")[-200:])
        page.click("#debtProvenYn button:text-is('예')"); page.wait_for_timeout(200)
        check("debt.proven.applied", "넘겨받은 빚" in page.inner_text("#resultBody"), page.inner_text("#resultBody")[:200])
        page.fill("#debtAmount", "0"); page.wait_for_timeout(150)

        # 10년 합산 — 문턱을 넘으면 세금 입력이 나타난다
        page.fill("#priorGift", "100000000"); page.wait_for_timeout(200)
        check("prior.taxfield", page.is_visible("#priorTaxField"), "합산인데 낸 세금 칸이 안 나옴")
        check("prior.warn", "0으로 두고 계산" in page.inner_text("#resultBody"), page.inner_text("#resultBody")[-200:])
        page.fill("#priorGift", "0"); page.wait_for_timeout(150)

        # 모바일 390px — 가로 넘침 없음
        page.set_viewport_size({"width": 390, "height": 844}); page.wait_for_timeout(200)
        ov = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("mobile.overflow", ov <= 1, f"{ov}px")
        wide = page.evaluate("[...document.querySelectorAll('body *')]"
                             ".filter(e=>e.getBoundingClientRect().right>window.innerWidth+1)"
                             ".map(e=>e.tagName+(e.className?'.'+e.className:'')).slice(0,4)")
        check("mobile.wide", not wide, str(wide))
        check("js.error.final", not errors, str(errors[:3]))
        browser.close()
    httpd.shutdown()

if failures:
    for f in failures: print("FAIL " + f, file=sys.stderr)
    print(f"{len(failures)} failure(s)", file=sys.stderr); sys.exit(1)
print("UI verification passed")
