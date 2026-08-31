# 디자인 게이트 — 대비·터치타깃·줄길이를 실제 브라우저에서 측정한다.
# python3 scripts/ui_check_design.py [--light|--dark|--tap|--measure]
import functools, http.server, pathlib, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
# 페이지 목록은 sitemap에서 유도한다 — 글이 늘어도 이 파일을 손대지 않기 위함
import re
_sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
PAGES = re.findall(r"<loc>https://onceinyourlife\.co\.kr([^<]*)</loc>", _sm)
assert PAGES, "sitemap.xml에서 URL을 읽지 못했습니다"

mode = next((a[2:] for a in sys.argv[1:] if a.startswith("--")), "light")
failures = []

CONTRAST = r"""
() => {
  const lum=(c)=>{const [r,g,b]=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*r+0.7152*g+0.0722*b;};
  const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
  const bgOf=(el)=>{let e=el;while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement;}return 'rgb(255, 255, 255)';};
  const out=[];
  for(const e of document.querySelectorAll('body *')){
    if(e.offsetParent===null) continue;
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>2)) continue;
    const cs=getComputedStyle(e), px=parseFloat(cs.fontSize);
    const large = px>=24 || (px>=18.66 && parseInt(cs.fontWeight)>=700);
    const need = large?3:4.5, r=ratio(cs.color,bgOf(e));
    if(r<need) out.push({r:+r.toFixed(2),need,color:cs.color,bg:bgOf(e),px,t:(e.textContent||'').trim().slice(0,26)});
  }
  return out;
}
"""
TAP = r"""
() => [...document.querySelectorAll('footer nav a')].map(a=>{
  const r=a.getBoundingClientRect();
  return {t:a.textContent.trim(), w:Math.round(r.width), h:Math.round(r.height)};
}).filter(o=>o.w<44||o.h<44)
"""
MEASURE = r"""
() => {
  const out=[];
  for(const p of document.querySelectorAll('section.card p, .lead')){
    const t=p.firstChild; if(!t||t.nodeType!==3||t.textContent.trim().length<60) continue;
    const r=document.createRange(), s=t.textContent;
    let prev=null,c=0,lines=[];
    for(let i=0;i<s.length;i++){ r.setStart(t,i); r.setEnd(t,i+1);
      const top=Math.round(r.getBoundingClientRect().top);
      if(prev===null) prev=top;
      if(top!==prev){ lines.push(c); c=0; prev=top; } c++; }
    if(c) lines.push(c);
    if(lines.length>1) out.push(Math.max(...lines.slice(0,-1)));
  }
  return out;
}
"""

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT))) as httpd:
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"
    with sync_playwright() as p:
        b = p.chromium.launch()
        if mode in ("light", "dark"):
            ctx = b.new_context(viewport={"width": 1280, "height": 900},
                                color_scheme=("dark" if mode == "dark" else "light"))
            if mode == "dark":
                pg = ctx.new_page(); pg.goto(base + "/", wait_until="networkidle")
                bgc = pg.evaluate("getComputedStyle(document.body).backgroundColor")
                if bgc in ("rgb(247, 248, 250)", "rgb(255, 255, 255)"):
                    failures.append(f"다크 모드에서 배경이 전환되지 않음: {bgc}")
                pg.close()
            for path in PAGES:
                pg = ctx.new_page(); pg.goto(base + path, wait_until="networkidle")
                for v in pg.evaluate(CONTRAST):
                    failures.append(f'{path} {v["r"]}:1 (필요 {v["need"]}) {v["color"]} on {v["bg"]} {v["px"]}px · {v["t"]}')
                pg.close()
            ctx.close()
        elif mode == "tap":
            ctx = b.new_context(viewport={"width": 390, "height": 844})
            for path in PAGES:
                pg = ctx.new_page(); pg.goto(base + path, wait_until="networkidle")
                for o in pg.evaluate(TAP):
                    failures.append(f'{path} 터치타깃 {o["w"]}×{o["h"]}px · {o["t"]}')
                pg.close()
            # 양성 대조군 — 탐지기가 작은 타깃을 실제로 잡는지
            pg = ctx.new_page()
            pg.set_content("<footer><nav><a href='#' style='display:inline-block;width:10px;height:10px'>x</a></nav></footer>")
            if not pg.evaluate(TAP):
                failures.append("내부 오류: 터치타깃 탐지기가 10×10px를 잡지 못함")
            pg.close(); ctx.close()
        elif mode == "measure":
            ctx = b.new_context(viewport={"width": 1280, "height": 900})
            for path in PAGES:
                pg = ctx.new_page(); pg.goto(base + path, wait_until="networkidle")
                v = pg.evaluate(MEASURE)
                if v:
                    lo, hi = min(v), max(v)
                    if hi > 60: failures.append(f"{path} 한 줄 최대 {hi}자 (상한 60)")
                    if lo < 30: failures.append(f"{path} 한 줄 최소 {lo}자 (하한 30)")
                pg.close()
            ctx.close()
        b.close()
    httpd.shutdown()

if failures:
    for f in failures[:25]: print("FAIL " + f, file=sys.stderr)
    if len(failures) > 25: print(f"... 외 {len(failures)-25}건", file=sys.stderr)
    print(f"{len(failures)} failure(s)", file=sys.stderr); sys.exit(1)
print({"light": "light contrast verification passed", "dark": "dark contrast verification passed",
       "tap": "tap target verification passed", "measure": "line measure verification passed"}[mode])
