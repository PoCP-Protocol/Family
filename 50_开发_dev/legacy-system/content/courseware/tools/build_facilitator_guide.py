"""facilitator-guide Skill:课件 YAML → 讲师引导手册(DRAFT 脚手架)HTML。
诚实:把每日内容渲染成讲师带练布局 + 通用带练步骤(从现有字段确定性推导);
具体话术/常见卡点标 [待讲师/专家补],不虚构成成品。证据一句话供讲师回答"凭什么"。
用法: python build_facilitator_guide.py [courseware.yaml]   输出: ../guides/<code>/index.html
"""
from __future__ import annotations
import html, sys
from pathlib import Path
import yaml

HERE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "parent_21day_camp.yaml"
PHASE_ACCENT = {"SEE_CONNECT": "#ea7317", "PARENT_FIRST": "#2563eb", "CO_STABILIZE": "#0f766e"}


def esc(x) -> str:
    return html.escape(str(x if x is not None else ""))


def is_review(d):
    s = str(d.get("skill", "")) + str(d.get("theme", ""))
    return "复盘" in s or "回看" in s


def build(doc: dict) -> str:
    m = doc.get("meta", {})
    code = m.get("camp_code", "COURSE")
    ev = {e["id"]: e for e in m.get("evidence_grounding", [])}
    phases = {p["code"]: p for p in m.get("phases", [])}

    def ev_one(refs):
        if not refs:
            return 'practitioner(实践方法,证据待验)'
        parts = []
        for r in refs:
            e = ev.get(r)
            parts.append(f'{esc(e.get("grade",""))} doi:{esc(e["doi"])}' if e else f'{esc(r)}')
        return " · ".join(parts)

    pages = [f'''<section class="page cover">
      <div class="tag">{esc(code)} · 讲师引导手册(DRAFT 脚手架)</div>
      <h1>{esc(m.get("title",""))}</h1>
      <p class="phil">{esc(m.get("philosophy",""))}</p>
      <div class="warn"><b>本手册状态 = DRAFT 脚手架</b>:每课的"带练步骤/证据一句话"由课件内容确定性生成;
      标 [待讲师/专家补] 的"具体话术、常见卡点与应对、现场分寸"须由**持证讲师/教研专家**补写并终审。AI 不代签、不判临床有效。</div>
      <p class="rl">红线:{esc(" · ".join(m.get("red_lines", [])))} · 危机(自伤/家暴)→ 停课转人工。</p>
    </section>''']
    days = doc.get("days") or []
    total = len(days)
    for d in days:
        pcode = d.get("phase", ""); accent = PHASE_ACCENT.get(pcode, "#ea7317")
        num = d.get("day"); ptitle = phases.get(pcode, {}).get("title", "")
        review = is_review(d)
        goal = f'让家长练习「{esc(d.get("skill",""))}」;理解:{esc(d.get("why",""))}'
        if review:
            steps = ('<li>带家长回看:'+esc(d.get("parent_action",""))+'</li>'
                     '<li>只谈"过程里发生了什么",不下结论、不评分。</li>'
                     '<li>各自选"下一步继续做的一件事"。</li>')
        else:
            steps = ('<li>1. 引入(为何有效):'+esc(d.get("why",""))+'</li>'
                     '<li>2. 示范(今晚可说的话):"'+esc(d.get("say_it_tonight",""))+'"</li>'
                     '<li>3. 布置今日一件小事:'+esc(d.get("parent_action",""))+'</li>'
                     '<li>4. 说明观察什么(过程非评分):'+esc(d.get("look_for",""))+'</li>'
                     '<li>5. 守边界/提醒:'+esc(d.get("boundary",""))+'</li>')
        pages.append(f'''<section class="page" style="--accent:{accent}">
      <div class="head"><span class="day" style="background:{accent}">Day {esc(num)} / {total}</span><span class="phase">{esc(ptitle)}{" · 复盘" if review else ""}</span></div>
      <h2>{esc(d.get("theme",""))}</h2>
      <div class="row"><b>本课目标</b><p>{goal}</p></div>
      <div class="row"><b>建议时长</b><p>自学 10–15 分钟 / 团体带练 20–30 分钟(建议,按班型调整)</p></div>
      <div class="row"><b>带练步骤</b><ul>{steps}</ul></div>
      <div class="row todo"><b>常见卡点 & 应对</b><p>[待讲师/专家补:家长在本技能上的典型困难与现场应对]</p></div>
      <div class="row todo"><b>现场话术/分寸</b><p>[待讲师/专家补:开场、追问、收束的具体措辞]</p></div>
      <div class="ev">凭什么(证据一句话):{ev_one(d.get("evidence_refs"))}</div>
    </section>''')

    css = """
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;color:#1f2937;background:#eef2f7}
    .page{position:relative;min-height:100vh;padding:7vh 9vw;background:#fff;border-top:6px solid var(--accent,#ea7317);
      border-bottom:1px solid #dde3ea;page-break-after:always}
    .cover{background:linear-gradient(135deg,#fff7ed,#eff6ff);border-top:none}
    .tag{font-size:13px;letter-spacing:2px;color:#ea7317;font-weight:600}
    h1{font-size:36px;margin:12px 0}.phil{font-size:18px;color:#374151}
    .warn{margin:18px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;color:#92400e;font-size:14px;max-width:52em}
    .head{display:flex;gap:12px;align-items:center;margin-bottom:6px}
    .day{color:#fff;border-radius:20px;padding:2px 14px;font-weight:600}.phase{color:#9ca3af;font-size:14px}
    h2{font-size:28px;margin:6px 0 14px}
    .row{margin:12px 0}.row b{color:#374151;font-size:15px}.row p,.row li{font-size:16px;color:#4b5563;line-height:1.5}
    .row ul{margin:6px 0 0 18px}
    .todo p{color:#b45309;background:#fffbeb;border:1px dashed #fde68a;border-radius:8px;padding:8px 10px}
    .ev{margin-top:16px;font-size:13px;color:#6b7280}
    .rl{margin-top:16px;color:#b45309;font-size:13px}
    @media print{.page{min-height:auto;height:100vh}}
    """
    return f'''<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(m.get("title",""))} · 讲师手册</title><style>{css}</style></head>
<body>{''.join(pages)}</body></html>'''


def main() -> int:
    doc = yaml.safe_load(SRC.read_text(encoding="utf-8"))
    code = doc.get("meta", {}).get("camp_code", "COURSE")
    out_dir = HERE.parent / "guides" / code
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(build(doc), encoding="utf-8")
    n = len(doc.get("days") or [])
    print(f"facilitator guide built: {out_dir/'index.html'}  ({n} day-pages + cover) [DRAFT scaffold]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
