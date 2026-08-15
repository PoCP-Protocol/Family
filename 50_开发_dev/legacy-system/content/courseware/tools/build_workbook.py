"""parent-workbook Skill:课件 YAML → 家长工作簿(可打印/可填写)HTML。
忠实取现有字段(不虚构):每天一页 = 今日一件小事(可勾)+ 今晚可说的话 + 观察记录格(可填)+ 一句反思。
复盘/结营日 = 回看格。母版色板见 FAMILY_COURSEWARE_DESIGN_SYSTEM_V1。A4 打印,每页分栏。
用法: python build_workbook.py [courseware.yaml]   输出: ../workbooks/<code>/index.html
"""
from __future__ import annotations
import html, sys
from pathlib import Path
import yaml

HERE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "parent_21day_camp.yaml"
PHASE_ACCENT = {"SEE_CONNECT": "#ea7317", "SEE": "#ea7317", "PARENT_FIRST": "#2563eb",
                "CO_CREATE": "#0f766e", "CO_STABILIZE": "#0f766e", "STABILIZE": "#7c3aed"}


def esc(x) -> str:
    return html.escape(str(x if x is not None else ""))


def is_review(d):
    s = str(d.get("skill", "")) + str(d.get("theme", ""))
    return "复盘" in s or "回看" in s


def lines(n=3):
    return "".join('<div class="wline"></div>' for _ in range(n))


def build(doc: dict) -> str:
    m = doc.get("meta", {})
    code = m.get("camp_code", "COURSE")
    phases = {p["code"]: p for p in m.get("phases", [])}
    pages = [f'''<section class="page cover">
      <div class="tag">{esc(code)} · 家长工作簿</div>
      <h1>{esc(m.get("title",""))}</h1>
      <p class="phil">{esc(m.get("philosophy",""))}</p>
      <p class="tip">用法:每天做"一件小事",当晚记一句观察。这不是打分,不比较;记录是为了看见过程,不是给孩子或自己评级。</p>
      <p class="rl">提醒:{esc(" · ".join(m.get("red_lines", [])))}</p>
    </section>''']
    days = doc.get("days") or doc.get("weeks") or []
    unit = "Day" if doc.get("days") else "Week"
    total = len(days)
    for d in days:
        pcode = d.get("phase", ""); accent = PHASE_ACCENT.get(pcode, "#ea7317")
        num = d.get("day", d.get("week")); ptitle = phases.get(pcode, {}).get("title", "")
        if is_review(d):
            pages.append(f'''<section class="page" style="--accent:{accent}">
      <div class="head"><span class="day" style="background:{accent}">{unit} {esc(num)} / {total}</span><span class="phase">{esc(ptitle)} · 复盘</span></div>
      <h2>{esc(d.get("theme",""))}</h2>
      <div class="field"><label>回看一件事:{esc(d.get("parent_action",""))}</label>{lines(3)}</div>
      <div class="field"><label>这段时间我注意到的变化(过程,非结论):</label>{lines(3)}</div>
      <div class="field"><label>下一步我想继续做的一件事:</label>{lines(2)}</div>
      <p class="bound">{esc(d.get("boundary",""))}</p>
    </section>''')
            continue
        micro = d.get("parent_daily_micro")
        if micro:
            do_html = f'<div class="do"><div style="width:100%"><b>本周焦点:{esc(d.get("weekly_focus",""))}</b>' + "".join(f'<p><span class="chk">▢</span> {esc(x)}</p>' for x in micro) + '</div></div>'
        else:
            do_html = f'<div class="do"><span class="chk">▢</span><div><b>今日一件小事</b><p>{esc(d.get("parent_action",""))}</p></div></div>'
        pages.append(f'''<section class="page" style="--accent:{accent}">
      <div class="head"><span class="day" style="background:{accent}">{unit} {esc(num)} / {total}</span><span class="phase">{esc(ptitle)}</span></div>
      <h2>{esc(d.get("theme",""))}</h2>
      {do_html}
      <div class="say"><b>今晚可以说的话</b><p>“{esc(d.get("say_it_tonight",""))}”</p></div>
      <div class="field"><label>我观察到(看:{esc(d.get("look_for",""))}):</label>{lines(3)}</div>
      <div class="field"><label>一句话反思:</label>{lines(1)}</div>
      <p class="bound">边界/提醒:{esc(d.get("boundary",""))}</p>
    </section>''')

    css = """
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;color:#1f2937;background:#eef2f7}
    .page{position:relative;min-height:100vh;padding:7vh 9vw;background:#fff;border-top:6px solid var(--accent,#ea7317);
      border-bottom:1px solid #dde3ea;page-break-after:always}
    .cover{background:linear-gradient(135deg,#fff7ed,#eff6ff);border-top:none}
    .tag{font-size:13px;letter-spacing:2px;color:#ea7317;font-weight:600}
    h1{font-size:38px;margin:12px 0}.phil{font-size:18px;color:#374151}
    .tip{margin-top:20px;color:#4b5563;font-size:15px;max-width:46em}
    .head{display:flex;gap:12px;align-items:center;margin-bottom:8px}
    .day{color:#fff;border-radius:20px;padding:2px 14px;font-weight:600}.phase{color:#9ca3af;font-size:14px}
    h2{font-size:30px;margin:6px 0 18px}
    .do{display:flex;gap:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;margin:10px 0}
    .do .chk{font-size:22px;color:#ea7317}.do p{font-size:18px;margin-top:4px}
    .say{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 18px;margin:10px 0}
    .say p{color:#2563eb;font-size:18px;margin-top:4px}
    .field{margin:16px 0}.field label{color:#4b5563;font-size:15px}
    .wline{border-bottom:1px solid #cbd5e1;height:30px}
    .bound{margin-top:14px;color:#6b7280;font-size:13px}
    .rl{margin-top:16px;color:#b45309;font-size:13px}
    @media print{.page{min-height:auto;height:100vh}}
    """
    return f'''<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(m.get("title",""))} · 家长工作簿</title><style>{css}</style></head>
<body>{''.join(pages)}</body></html>'''


def main() -> int:
    doc = yaml.safe_load(SRC.read_text(encoding="utf-8"))
    code = doc.get("meta", {}).get("camp_code", "COURSE")
    out_dir = HERE.parent / "workbooks" / code
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(build(doc), encoding="utf-8")
    n = len(doc.get("days") or doc.get("weeks") or [])
    unit = "day" if doc.get("days") else "week"
    print(f"workbook built: {out_dir/'index.html'}  ({n} {unit}-pages + cover)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
