"""从课件 YAML 生成 FELS seed SQL(忠实源,不手抄)。
把 PARENT_21D_V1 / FAMILY_90D_V1 灌进 legacy_training_camps + legacy_program_phases + legacy_daily_tasks(content_ref)。
用法: python build_seed_sql.py > ../../db/seeds/bangyang_courseware_seed.sql
"""
from __future__ import annotations
from pathlib import Path
import yaml

HERE = Path(__file__).resolve().parent
CW = HERE.parent
FILES = [CW / "parent_21day_camp.yaml", CW / "family_90day_program.yaml"]


def q(s) -> str:
    return "'" + str(s if s is not None else "").replace("'", "''") + "'"


def main() -> None:
    print("-- 榜样教育课件 seed(由 build_seed_sql.py 从课件 YAML 生成;幂等 ON CONFLICT DO NOTHING)")
    print("-- 依赖迁移 0001-0004。Legacy semantics only,非 Family canonical。content_ref 指向 content/courseware/*.yaml")
    for f in FILES:
        doc = yaml.safe_load(f.read_text(encoding="utf-8"))
        m = doc.get("meta", {})
        code = m["camp_code"]
        camp_id = f"camp_{code}"
        days = int(m.get("duration_days", 0))
        print(f"\n-- ===== {code} ({f.name}) =====")
        print(f"INSERT INTO fels.legacy_training_camps(training_camp_id,camp_code,title,duration_days,status,semantic_classification,created_at)")
        print(f"VALUES ({q(camp_id)},{q(code)},{q(m.get('title',''))},{days},'ACTIVE','LEGACY_PROGRAM_NOT_JOURNEY',now()) ON CONFLICT (training_camp_id) DO NOTHING;")
        # phases
        for p in m.get("phases", []):
            pid = f"phase_{code}_{p['code']}"
            print(f"INSERT INTO fels.legacy_program_phases(program_phase_id,training_camp_id,phase_code,phase_title,day_from,day_to,semantic_classification,created_at)")
            print(f"VALUES ({q(pid)},{q(camp_id)},{q(p['code'])},{q(p.get('title',''))},{int(p['day_from'])},{int(p['day_to'])},'LEGACY_PHASE_NOT_GROWTH_STAGE',now()) ON CONFLICT (program_phase_id) DO NOTHING;")
        # daily tasks:21天用 days(day_index=day);90天用 weeks(day_index=day_from)
        lessons = doc.get("days") or doc.get("weeks") or []
        for d in lessons:
            if "day" in d:
                di = int(d["day"]); title = d.get("theme", ""); instr = d.get("parent_action", ""); ref = d.get("content_ref", f"{code}#D{di}")
                tid = f"task_{code}_D{di}"
            else:
                di = int(d["day_from"]); title = d.get("theme", ""); instr = d.get("weekly_focus", ""); ref = d.get("content_ref", f"{code}#W{d['week']}")
                tid = f"task_{code}_W{d['week']}"
            print(f"INSERT INTO fels.legacy_daily_tasks(daily_task_id,training_camp_id,day_index,title,instruction_text,content_ref,semantic_classification,created_at)")
            print(f"VALUES ({q(tid)},{q(camp_id)},{di},{q(title)},{q(instr)},{q(ref)},'LEGACY_TASK_NOT_GROWTH_ACTION',now()) ON CONFLICT (daily_task_id) DO NOTHING;")


if __name__ == "__main__":
    main()
