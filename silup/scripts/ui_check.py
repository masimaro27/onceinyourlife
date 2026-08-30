# UI 게이트 — 실제 브라우저에서 계산 흐름과 모바일 폭을 검증한다.
# python3 silup/scripts/ui_check.py
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

    # 기본값: 이직일 2026-08-01, 3개월 1,200만원, 8시간, 50세미만, 5~10년
    # 산정기간 2026-05-01~07-31 = 92일 → 평균임금 130,434 → 상한 걸림 → 68,100 × 210일
    hint = page.locator("#periodHint").inner_text()
    check("period.hint", "2026-05-01 ~ 2026-07-31 (92일)" in hint, hint)
    body = page.locator("#resultBody").inner_text()
    check("cap.badge", "상한 적용" in body, body[:200])
    check("cap.daily", "68,100원" in body, body[:300])
    check("cap.total", f"{68100 * 210:,}원" in body, body[:400])

    # 하한 케이스: 급여를 낮추면 하한 66,048원
    page.locator("#threeMonthPay").fill("6000000")
    body = page.locator("#resultBody").inner_text()
    check("floor.badge", "하한 적용" in body, body[:200])
    check("floor.daily", "66,048원" in body, body[:300])

    # 경과조치: 2025년 이직이면 상한 66,000원
    page.locator("#leaveDate").fill("2025-06-30")
    page.locator("#threeMonthPay").fill("30000000")
    body = page.locator("#resultBody").inner_text()
    check("legacy.cap", "66,000원" in body, body[:300])

    # 지원 범위 밖
    page.locator("#leaveDate").fill("2022-06-30")
    body = page.locator("#resultBody").inner_text()
    check("unsupported", "지원합니다" in body or "구간만" in body, body[:200])

    # 50세 이상 + 10년 이상 = 270일
    page.locator("#leaveDate").fill("2026-08-01")
    page.get_by_role("button", name="50세 이상 또는 장애인").click()
    page.locator("#insuredPeriod").select_option("p10")
    body = page.locator("#resultBody").inner_text()
    check("days.270", "270일" in body, body[:300])

    # 조기재취업수당: 135일 남김(270의 1/2 이상) → 요건 충족
    page.locator("#remainingDays").fill("135")
    early = page.locator("#earlyBody").inner_text()
    check("early.ok", "일수 요건은 채웠습니다" in early, early[:200])
    page.locator("#remainingDays").fill("100")
    early = page.locator("#earlyBody").inner_text()
    check("early.short", "받지 못합니다" in early, early[:200])

    # 장기요양 계산기로 가는 링크 (2026-08-30 홈페이지 신설로 루트 → /longtermcare/ 이동)
    check("crosslink", page.locator('a[href="/longtermcare/"]').count() >= 1,
          "장기요양 계산기 링크 없음")

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
