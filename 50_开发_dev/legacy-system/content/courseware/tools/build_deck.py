"""deck-generation Skill:课件 YAML → 自包含 HTML slides(设计系统组件化 · 一页一观点 · 叙事弧)。
确定性渲染(智能在已循证内容里,不由 LLM 硬画版面);组件:cover / phase-divider / daily-lesson(four-card)
/ review / closing / refs。引证映射到 meta.evidence_grounding 的真实 DOI。母版见 FAMILY_COURSEWARE_DESIGN_SYSTEM_V1。
用法: python build_deck.py [courseware.yaml]   默认 ../parent_21day_camp.yaml
输出: ../decks/<course_code>/index.html
"""
from __future__ import annotations
import html, sys
from pathlib import Path
import yaml

HERE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "parent_21day_camp.yaml"

# 设计系统 · 阶段配色带(在用色板内:橙/蓝 + 中性;不新增品牌色)
PHASE_ACCENT = {"SEE_CONNECT": "#ea7317", "SEE": "#ea7317", "PARENT_FIRST": "#2563eb",
                "CO_CREATE": "#0f766e", "CO_STABILIZE": "#0f766e", "STABILIZE": "#7c3aed"}


def esc(x) -> str:
    return html.escape(str(x if x is not None else ""))


def is_review(d: dict) -> bool:
    s = str(d.get("skill", "")) + str(d.get("theme", ""))
    return "复盘" in s or "回看" in s


def build(doc: dict) -> str:
    m = doc.get("meta", {})
    code = m.get("camp_code", "COURSE")
    ev = {e["id"]: e for e in m.get("evidence_grounding", [])}
    phases = {p["code"]: p for p in m.get("phases", [])}

    def ev_line(refs):
        if not refs:
            return '<span class="ev practitioner">practitioner · 证据待验</span>'
        out = []
        for r in refs:
            e = ev.get(r)
            if e:
                out.append(f'<span class="ev">{esc(e.get("grade",""))} · <a href="https://doi.org/{esc(e["doi"])}" target="_blank">doi:{esc(e["doi"])}</a></span>')
            else:
                out.append(f'<span class="ev practitioner">{esc(r)}</span>')
        return " ".join(out)

    def footer(unit, num, total):
        return f'<div class="foot"><span>{esc(code)}</span><span>{unit} {esc(num)} / {total}</span></div>'

    slides = []
    # 封面
    ph = " · ".join(f'{esc(p["title"])}(D{p["day_from"]}–{p["day_to"]})' for p in m.get("phases", []))
    slides.append(f'''<section class="slide cover">
      <div class="tag">{esc(code)}</div>
      <h1>{esc(m.get("title",""))}</h1>
      <p class="phil">{esc(m.get("philosophy",""))}</p>
      <p class="arc">{ph}</p>
      <p class="audience">对象:{esc(m.get("audience",""))}</p>
    </section>''')

    lessons = doc.get("days") or doc.get("weeks") or []
    unit = "Day" if doc.get("days") else "Week"
    total = len(lessons)
    seen_phase = set()
    for d in lessons:
        pcode = d.get("phase", "")
        ptitle = phases.get(pcode, {}).get("title", "")
        accent = PHASE_ACCENT.get(pcode, "#ea7317")
        num = d.get("day", d.get("week"))
        # 阶段分隔页(叙事弧:每进入新阶段插一页)
        if pcode and pcode not in seen_phase:
            seen_phase.add(pcode)
            p = phases.get(pcode, {})
            slides.append(f'''<section class="slide divider" style="--accent:{accent}">
      <div class="tag">阶段 {len(seen_phase)} / {len(phases)}</div>
      <h2 class="dtitle">{esc(ptitle)}</h2>
      <p class="drange">D{esc(p.get("day_from",""))}–{esc(p.get("day_to",""))}</p>
    </section>''')
        # 复盘/结营日:单独版式(一页一观点,不套四卡)
        if is_review(d):
            is_last = num == total
            slides.append(f'''<section class="slide review" style="--accent:{accent}">
      <div class="head"><span class="day" style="background:{accent}">{unit} {esc(num)}</span><span class="phase">{esc(ptitle)}{" · 结营" if is_last else " · 复盘"}</span></div>
      <h2>{esc(d.get("theme",""))}</h2>
      <p class="why">{esc(d.get("why",""))}</p>
      <div class="reviewcard" style="border-color:{accent}">
        <h3>回看一件事</h3><p>{esc(d.get("parent_action",""))}</p>
        <h3 style="margin-top:14px">可以说</h3><p class="say-line">“{esc(d.get("say_it_tonight",""))}”</p>
      </div>
      <p class="bound">{esc(d.get("boundary",""))}</p>
      {footer(unit, num, total)}
    </section>''')
            continue
        # 日常课:four-card 组件(一页一观点:H2=当日主张 + 4 卡承载)
        micro = d.get("parent_daily_micro")
        if micro:
            action = f'<h3>本周焦点 + 每日微行动</h3><p>{esc(d.get("weekly_focus",""))}</p><ul>' + "".join(f"<li>{esc(x)}</li>" for x in micro) + "</ul>"
        else:
            action = f'<h3>今日一件小事</h3><p>{esc(d.get("parent_action",""))}</p>'
        slides.append(f'''<section class="slide lesson" style="--accent:{accent}">
      <div class="head"><span class="day" style="background:{accent}">{unit} {esc(num)}</span><span class="phase">{esc(ptitle)}</span></div>
      <h2>{esc(d.get("theme",""))}</h2>
      <div class="skill" style="color:{accent}">技能:{esc(d.get("skill",""))}</div>
      <p class="why">{esc(d.get("why",""))}</p>
      <div class="grid">
        <div class="card action">{action}</div>
        <div class="card say"><h3>今晚可以说的话</h3><p>“{esc(d.get("say_it_tonight",""))}”</p></div>
        <div class="card look"><h3>观察什么(过程,非评分)</h3><p>{esc(d.get("look_for",""))}</p></div>
        <div class="card bound"><h3>边界 / 提醒</h3><p>{esc(d.get("boundary",""))}</p></div>
      </div>
      <div class="evrow">依据:{ev_line(d.get("evidence_refs"))}</div>
      {footer(unit, num, total)}
    </section>''')

    refs = "".join(f'<li>{esc(e.get("grade",""))} · <a href="https://doi.org/{esc(e["doi"])}" target="_blank">doi:{esc(e["doi"])}</a> — {esc(e.get("note",""))}</li>' for e in m.get("evidence_grounding", []))
    slides.append(f'''<section class="slide refs">
      <h2>循证依据(crossref 已核验)</h2><ul>{refs}</ul>
      <p class="rl">红线:{esc(" · ".join(m.get("red_lines", [])))}</p>
    </section>''')

    css = """
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;color:#1f2937;background:#eef2f7}
    .slide{position:relative;min-height:100vh;padding:6vh 8vw;display:flex;flex-direction:column;justify-content:center;
      border-bottom:1px solid #dde3ea;page-break-after:always;background:#fff;border-top:6px solid var(--accent,#ea7317)}
    .cover,.divider{align-items:flex-start}
    .cover{background:linear-gradient(135deg,#fff7ed,#eff6ff);border-top:none}
    .divider{background:linear-gradient(135deg,#ffffff, #f8fafc)}
    .divider .dtitle{font-size:52px;color:var(--accent)}
    .divider .drange{font-size:20px;color:#6b7280;margin-top:8px}
    .tag{font-size:14px;letter-spacing:2px;color:#ea7317;font-weight:600}
    h1{font-size:44px;margin:12px 0}
    .phil{font-size:20px;color:#374151;margin:8px 0}
    .arc{font-size:16px;color:#6b7280;margin-top:16px}
    .audience{margin-top:24px;color:#9ca3af}
    .head{display:flex;gap:12px;align-items:center;margin-bottom:6px}
    .day{color:#fff;border-radius:20px;padding:2px 14px;font-weight:600}
    .phase{color:#9ca3af;font-size:14px}
    h2{font-size:34px;margin:6px 0}
    .skill{font-weight:600;margin:4px 0 10px}
    .why{color:#4b5563;font-size:17px;max-width:52em}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:22px 0}
    .card{border-radius:14px;padding:18px 20px;background:#f8fafc;border:1px solid #e5e7eb}
    .card h3{font-size:15px;color:#6b7280;margin-bottom:8px;font-weight:600}
    .card p{font-size:18px;line-height:1.5}
    .action{background:#fff7ed;border-color:#fed7aa}
    .say{background:#eff6ff;border-color:#bfdbfe}
    .bound{background:#f9fafb}
    .reviewcard{border-radius:14px;padding:22px 24px;background:#f8fafc;border:1px solid;max-width:60em;margin:18px 0}
    .reviewcard h3{font-size:15px;color:#6b7280;font-weight:600}
    .reviewcard p{font-size:19px;line-height:1.5}
    .review .bound{color:#6b7280;font-size:14px;background:none}
    .say-line{color:#2563eb}
    .evrow{margin-top:auto;font-size:13px;color:#6b7280}
    .ev a{color:#2563eb;text-decoration:none}
    .ev.practitioner{color:#9ca3af}
    .foot{position:absolute;bottom:2.5vh;left:8vw;right:8vw;display:flex;justify-content:space-between;font-size:12px;color:#b8c0cc}
    .refs ul{margin:16px 0;line-height:2}
    .refs a{color:#2563eb}
    .rl{margin-top:20px;color:#b45309;font-size:14px}
    @media print{.slide{min-height:auto;height:100vh}}
    """
    return f'''<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(m.get("title",""))}</title><style>{css}</style></head>
<body>{''.join(slides)}</body></html>'''


def main() -> int:
    doc = yaml.safe_load(SRC.read_text(encoding="utf-8"))
    code = doc.get("meta", {}).get("camp_code", "COURSE")
    out_dir = HERE.parent / "decks" / code
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "index.html"
    out.write_text(build(doc), encoding="utf-8")
    n = len(doc.get("days") or doc.get("weeks") or [])
    print(f"deck built: {out}  ({n} lessons + cover + phase-dividers + refs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
