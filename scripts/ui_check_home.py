# G6 — 신뢰 페이지 3종을 실제 브라우저에서 검증한다.
# 루트 상대 경로(/assets/site.css)를 쓰므로 file:// 이 아니라 로컬 HTTP 서버로 띄워 검사한다.
# python3 scripts/ui_check_pages.py
import functools
import http.server
import pathlib
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["/"]
MOBILE = 390

failures = []


def check(name, cond, detail=""):
    if not cond:
        failures.append(f"{name}: {detail}")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


handler = functools.partial(QuietHandler, directory=str(ROOT))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for path in PAGES:
            errors = []
            page = browser.new_page(viewport={"width": MOBILE, "height": 840})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            resp = page.goto(base + path, wait_until="networkidle")

            check(f"{path} status", resp is not None and resp.status == 200,
                  f"status={resp.status if resp else 'None'}")

            # 공통 스타일시트가 실제로 적용됐는지 — 링크 존재가 아니라 계산된 스타일로 확인
            bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
            check(f"{path} css applied", bg == "rgb(247, 248, 250)",
                  f"body background={bg} (기대: rgb(247, 248, 250) = --bg)")

            # 모바일 가로 넘침
            overflow = page.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check(f"{path} no h-overflow @{MOBILE}px", overflow <= 1, f"overflow={overflow}px")

            # 개별 요소 넘침 (표·긴 URL 등)
            wide = page.evaluate(
                "[...document.querySelectorAll('body *')]"
                ".filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)"
                ".map(el => el.tagName + (el.className ? '.' + el.className : '')).slice(0, 5)")
            check(f"{path} no wide element", not wide, f"넘치는 요소: {wide}")

            # 푸터 내비게이션이 렌더되고 5개 링크가 보이는지
            nav_links = page.evaluate(
                "[...document.querySelectorAll('footer nav a')].map(a => a.getAttribute('href'))")
            for href in ["/", "/silup/", "/about/", "/privacy/", "/contact/"]:
                check(f"{path} footer link {href}", href in nav_links, f"실제: {nav_links}")

            # 본문이 비어 있지 않은지
            text_len = page.evaluate("document.body.innerText.trim().length")
            check(f"{path} has content", text_len >= 300, f"본문 {text_len}자")

            check(f"{path} no js error", not errors, f"errors={errors[:3]}")
            page.close()

        # 양성 대조군 — 넘침 탐지기가 실제로 동작하는지 증명
        probe = browser.new_page(viewport={"width": MOBILE, "height": 400})
        probe.set_content("<div style='width:2000px'>overflow probe</div>")
        probe_overflow = probe.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("overflow detector control", probe_overflow > 1,
              f"양성 대조군에서 넘침을 탐지하지 못함 (overflow={probe_overflow}) — 위 통과를 신뢰할 수 없음")
        probe.close()
        browser.close()

    httpd.shutdown()

if failures:
    for f in failures:
        print(f"FAIL {f}", file=sys.stderr)
    print(f"{len(failures)} failure(s)", file=sys.stderr)
    sys.exit(1)
print("home UI verification passed")
