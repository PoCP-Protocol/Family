"""W2R-103B build-time 编译器:把经 Python Evidence SSOT 校验/门禁的知识链,
编译为 Principal runtime 消费的 compiled bundle JSON。

裁决 M3-W2R-CONV-001:
- Python = build/curation time 的唯一 Evidence 权威(Library.validate + Evidence.gate)。
- 不把 Grade/Provenance/NON_DECISIVE 枚举复制进 JS;JS 只消费本产物。
- 两层拆分:Evidence.decisive(研究结论层)≠ family_decision_non_decisive(家庭决策层)。
  ResearchEvidence 永远不直接决定某个家庭"必须做什么" → 每个节点 family_decision_non_decisive=true。
- 防 E7 洗白:声称 decisive(real provenance)却用内部/缺失出处 → gate FAIL。

用法: python -m byresearch.compile_principal_bundle   (或 python byresearch/compile_principal_bundle.py)
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from .evidence import Grade, Provenance
from .library import Library
from .schema import Card

# intervention_id → 链的 root method 卡(从它沿 grounded_in/targets_constructs/measured_by 遍历)
INTERVENTION_ROOT_METHOD = {
    "LISTEN_BEFORE_RESPOND": "MD-001",
}

REAL_PROVENANCE = {Provenance.THIRD_PARTY_REAL, Provenance.PRIMARY_REAL}
OUT_DIR = Path(__file__).resolve().parents[2] / "50_开发_dev" / "knowledge" / "compiled"
REGISTRY_PATH = Path(__file__).resolve().parents[1] / "library" / "verified_sources.yaml"


def _load_verified_registry() -> set[str]:
    """机器可读的已核验来源注册表 → {已 VERIFIED 的 doi(小写) 与 'pmid:<n>'}。
    找不到/解析失败 → 空集(FAIL SAFE:一切外部来源都视为未核验)。"""
    try:
        import yaml  # PyYAML(library 加载已依赖)
        doc = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8")) or {}
    except Exception:
        return set()
    ids: set[str] = set()
    for s in (doc.get("sources") or []):
        if str(s.get("verification_status", "")).upper() != "VERIFIED":
            continue
        if s.get("doi"):
            ids.add(str(s["doi"]).strip().lower())
        if s.get("pmid"):
            ids.add("pmid:" + str(s["pmid"]).strip().lower())
    return ids


_VERIFIED_IDS = _load_verified_registry()


def _source_ids(source: str) -> set[str]:
    """从 source 串抽取可比对标识(裸 DOI 与 pmid:<n>)。"""
    import re
    s = (source or "").strip().lower()
    out: set[str] = set()
    if not s:
        return out
    m = re.search(r"(10\.\d{4,9}/[^\s\"]+)", s)
    if m:
        out.add(m.group(1).rstrip(").,;"))
    m2 = re.search(r"pmid[:\s]*([0-9]{5,9})", s)
    if m2:
        out.add("pmid:" + m2.group(1))
    return out


def _source_in_registry(source: str) -> bool:
    """来源是否登记且已核验(机器可验证,不再只看 DOI 形态)。"""
    return bool(_source_ids(source) & _VERIFIED_IDS)


def _is_external_source(source: str) -> bool:
    s = (source or "").strip().lower()
    if not s:
        return False
    if s.startswith(("fpai-", "verify")):  # 内部 taxonomy / 待核验占位,不算真实外部出处
        return False
    return ("doi:" in s) or s.startswith(("http://", "https://", "10.")) or ("pmid" in s)


def _external_verified(ev) -> bool:
    """真实外部已核验证据:real provenance + 真实外部出处形态 + 【机器可核验(注册表 VERIFIED)】。
    语法合法但不在注册表的 DOI(含 Agent 自编 DOI)→ False。"""
    return (
        ev.provenance in REAL_PROVENANCE
        and _is_external_source(ev.source)
        and _source_in_registry(ev.source)
    )


def _decisive_refs(card: Card, min_grade: Grade = Grade.E6) -> list[str]:
    """节点用于 grounding 的真实外部出处:external_verified 且【实际过 Python Evidence.gate(min_grade)】。
    如 Rogers E2 → gate(E4/E6) FAIL → 不进 decisive refs(背景证据,不洗白)。"""
    refs: list[str] = []
    for e in card.evidence:
        if not _external_verified(e):
            continue
        ok, _reason = e.gate(min_grade)  # 逐条真调 Evidence.gate(),Python 为唯一权威
        if ok:
            refs.append(e.source)
    return refs


def _node(card: Card) -> dict:
    ext = [e for e in card.evidence if _external_verified(e)]
    highest = max((int(e.grade) for e in ext), default=0)
    return {
        "id": card.id,
        "title": card.name,
        "summary": card.summary,
        "evidence_grade": Grade(highest).name if highest else "E0",
        "external_evidence_count": len(ext),
        # 家庭决策层:研究证据永不直接决定家庭行为(≠ Evidence.decisive)
        "family_decision_non_decisive": True,
        "source_refs": _decisive_refs(card),
    }


def compile_bundle(intervention_id: str, lib: Library) -> dict:
    root_id = INTERVENTION_ROOT_METHOD.get(intervention_id)
    method = lib.get(root_id) if root_id else None
    if method is None:
        raise SystemExit(f"no root method for intervention {intervention_id}")

    theory_ids = list(getattr(method, "grounded_in", []) or [])
    construct_ids = list(getattr(method, "targets_constructs", []) or [])
    modality_ids: list[str] = []
    for cid in construct_ids:
        c = lib.get(cid)
        for mm in (getattr(c, "measured_by", []) or []):
            if mm not in modality_ids:
                modality_ids.append(mm)

    theories = [_node(lib.get(i)) for i in theory_ids if lib.get(i)]
    constructs = [_node(lib.get(i)) for i in construct_ids if lib.get(i)]
    methods = [_node(method)]
    modalities = [_node(lib.get(i)) for i in modality_ids if lib.get(i)]

    chain_cards = [method] + [lib.get(i) for i in theory_ids + construct_ids + modality_ids if lib.get(i)]

    # ---- gate 判据(§16)----
    validate_errors = [i for i in lib.validate() if i.severity == "error"]
    all_ev = [e for c in chain_cards for e in c.evidence]
    external = [e for e in all_ev if _external_verified(e)]
    external_verified_count = len(external)
    adolescent_direct = sum(1 for e in external if "adolescence" in [t.lower() for t in e.tags])
    method_max_grade = max((int(e.grade) for e in method.evidence if _external_verified(e)), default=0)
    construct_external = sum(1 for cid in construct_ids
                             if any(_external_verified(e) for e in (lib.get(cid).evidence if lib.get(cid) else [])))
    # 防 E7 洗白 / 造假:声称 real provenance 却用内部/缺失出处
    fake_or_missing_source = sum(1 for e in all_ev
                                 if e.provenance in REAL_PROVENANCE and not _is_external_source(e.source))
    # CLOSURE-001:声称 real provenance + 外部形态出处,却未登记于 verified_sources(含语法合法的假/自编 DOI)
    unregistered_external = sum(1 for e in all_ev
                                if e.provenance in REAL_PROVENANCE and _is_external_source(e.source)
                                and not _source_in_registry(e.source))
    # decisive 却 unverified(结构上不可能,做冗余护栏)
    unverified_decisive = sum(1 for e in all_ev if e.decisive and e.provenance in
                              {Provenance.UNVERIFIED, Provenance.INFERRED, Provenance.SIMULATED, Provenance.UNKNOWN})

    checks = {
        "library_validate_errors": len(validate_errors),
        "external_verified_count": external_verified_count,
        "adolescent_direct_evidence": adolescent_direct,
        "method_evidence_max_grade": Grade(method_max_grade).name if method_max_grade else "E0",
        "construct_external_evidence": construct_external,
        "unverified_decisive_evidence": unverified_decisive,
        "fake_or_missing_source": fake_or_missing_source,
        "unregistered_external_source": unregistered_external,
    }
    source_registry_pass = unregistered_external == 0
    gate_pass = (
        len(validate_errors) == 0
        and external_verified_count >= 2
        and adolescent_direct >= 1
        and method_max_grade == int(Grade.E7)
        and construct_external >= 1
        and unverified_decisive == 0
        and fake_or_missing_source == 0
        and source_registry_pass
    )

    highest_grade = max((int(e.grade) for e in external), default=0)
    limitations = [
        "ResearchEvidence 恒 family_decision_non_decisive:不直接决定任何家庭必须做什么。",
        "强制/防御循环证据为早期儿童样本,外推到 12-15 岁青少年 LIMITED(见 CN-002)。",
        "被听见感(CN-001)当前直接实证有限,未过度赋级。",
        "微动作(今晚复述一句)本身直接效果证据有限;方法效果来自情绪教练式家长干预整体证据。",
        "Gottman 1996 待核验(unverified,非 decisive);Rogers/Gottman&DeClaire 仅理论背景。",
    ]

    bundle = {
        "schema_version": "KNOWLEDGE_CHAIN_V2",
        "intervention_id": intervention_id,
        "compiled_by": "byresearch/compile_principal_bundle.py",
        "source_ssot": "20_知识_knowledge/library + byresearch/evidence.py",
        "theories": theories,
        "constructs": constructs,
        "methods": methods,
        "modalities": modalities,
        "evidence_summary": {
            "external_verified_count": external_verified_count,
            "highest_grade": Grade(highest_grade).name if highest_grade else "E0",
            "has_third_party_real": any(e.provenance == Provenance.THIRD_PARTY_REAL for e in external),
            "source_registry_gate": "PASS" if source_registry_pass else "FAIL",
            "python_evidence_gate": "PASS" if gate_pass else "FAIL",
            "gate_checks": checks,
        },
        "limitations": limitations,
    }
    payload = json.dumps(bundle, ensure_ascii=False, sort_keys=True).encode("utf-8")
    bundle["bundle_version"] = "sha256:" + hashlib.sha256(payload).hexdigest()[:16]
    return bundle


def main() -> int:
    lib = Library.load()
    errors = [i for i in lib.validate() if i.severity == "error"]
    if errors:
        print("LIBRARY VALIDATE FAILED:", file=sys.stderr)
        for e in errors:
            print(" ", e, file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rc = 0
    for iid in INTERVENTION_ROOT_METHOD:
        bundle = compile_bundle(iid, lib)
        out = OUT_DIR / f"{iid.lower()}.json"
        out.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
        gate = bundle["evidence_summary"]["python_evidence_gate"]
        print(f"compiled {iid} -> {out.name}  gate={gate}  ext={bundle['evidence_summary']['external_verified_count']}  highest={bundle['evidence_summary']['highest_grade']}")
        if gate != "PASS":
            rc = 2
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
