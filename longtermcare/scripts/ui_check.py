# UI 게이트 — 실제 브라우저에서 계산 흐름과 모바일 폭을 검증한다.
# python3 scripts/ui_check.py
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()

failures = []


def check(name, cond, detail=""):
    if not cond:
        failures.append(f"{name}: {detail}")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1000, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL)

    # 재가: 기본 3등급, 방문요양 30분 × 월 20회 → 349,000 × 15% = 52,350원
    page.get_by_label("방문요양 월 횟수").fill("20")
    body = page.locator("#resultBody").inner_text()
    check("home.copay", "52,350원" in body, body[:200])
    check("home.total", "349,000원" in body, body[:200])

    # 한도 초과 경고: 5등급 + 주야간 6~8h 26일 + 방문요양(30분) 20회 유지
    page.get_by_role("button", name="5등급").click()
    page.get_by_label("방문요양 월 횟수").fill("0")
    page.get_by_label("주·야간보호 종류").select_option("h6")
    page.get_by_label("주·야간보호 월 횟수").fill("28")
    body = page.locator("#resultBody").inner_text()
    # 44,650 × 28 = 1,250,200 > 한도 1,208,900 → 초과 41,300 전액 + 이내분 15%
    check("home.over.warn", "한도 초과" in body, body[:300])
    check("home.over.copay", "222,635원" in body, body[:300])  # 181,335 + 41,300

    # 인지지원등급: 단기보호 비활성 + 시설 계산 불가 안내
    page.get_by_role("button", name="인지지원등급").click()
    check("cog.shortstay.disabled",
          page.locator(".svc.disabled", has_text="단기보호").count() == 1)
    page.get_by_role("button", name="시설 입소").click()
    body = page.locator("#resultBody").inner_text()
    check("cog.facility.blocked", "계산할 수 없습니다" in body, body[:200])

    # 시설: 1등급 요양시설(2.1명당 1명 이상) 30일 → 2,792,100 × 20% = 558,420원
    page.get_by_role("button", name="1등급", exact=True).click()
    body = page.locator("#resultBody").inner_text()
    check("facility.copay", "558,420원" in body, body[:300])
    check("facility.noncovered", "비급여" in body, body[:300])

    # 감경 60%: 시설 8% → 223,368원
    page.locator("#burdenSelect").select_option("reduce60")
    body = page.locator("#resultBody").inner_text()
    check("facility.reduce60", "223,368원" in body, body[:300])

    # 모바일 390px: 가로 넘침 없음
    page.set_viewport_size({"width": 390, "height": 844})
    scroll_w = page.evaluate("document.documentElement.scrollWidth")
    check("mobile.no-hscroll", scroll_w <= 390, f"scrollWidth={scroll_w}")

    check("js.no-errors", not errors, "; ".join(errors))
    browser.close()

if failures:
    for f in failures:
        print("FAIL", f)
    sys.exit(1)
print("UI verification passed")
