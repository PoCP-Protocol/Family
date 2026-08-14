"""W2R-103B 负向 / 防 E7 洗白 治理测试(裁决 §14/§15)。
自包含可运行:  python -m byresearch.test_evidence_gate   (退出码非 0 = 有失败)
不依赖 pytest。
"""
from __future__ import annotations

import sys

from .evidence import Evidence, Grade, Provenance
from .compile_principal_bundle import _is_external_source, _external_verified, _source_in_registry, compile_bundle
from .library import Library

CASES: list[tuple[str, callable]] = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


# §14.1 E7 + unverified → gate FAIL(非 decisive)
@case("E7+unverified -> gate FAIL")
def _c1():
    e = Evidence(claim="x", grade=Grade.E7, provenance=Provenance.UNVERIFIED, source="doi:10.x/y")
    ok, _ = e.gate(Grade.E6)
    assert not ok and not e.decisive


# §14.2 E7 + 无 source → gate FAIL
@case("E7+no source -> gate FAIL")
def _c2():
    e = Evidence(claim="x", grade=Grade.E7, provenance=Provenance.THIRD_PARTY_REAL, source="")
    ok, why = e.gate(Grade.E6)
    assert not ok, why


# §14.3 fake/内部 source → 不算 external verified
@case("internal/fake source -> not external_verified")
def _c3():
    assert _is_external_source("doi:10.1016/j.adolescence.2015.04.005")
    assert not _is_external_source("FPAI-METHOD-TAXONOMY-V1:CONNECT_BEFORE_CORRECT")
    assert not _is_external_source("VERIFY: Gottman 1996")
    assert not _is_external_source("")


# §15 防 E7 洗白:内部 taxonomy 标 E7 + real provenance → 不算 external verified
@case("anti-E7-washing: E7 + internal source -> NOT external verified")
def _c4():
    e = Evidence(claim="washed", grade=Grade.E7, provenance=Provenance.THIRD_PARTY_REAL,
                 source="FPAI-METHOD-TAXONOMY-V1:CONNECT_BEFORE_CORRECT")
    assert not _external_verified(e)  # 内部出处不能镀成真实外部证据


# §14.4 只有内部 E1 → 该证据非 decisive-external(Principal 将 grounded=false)
@case("internal E1 only -> not external verified")
def _c5():
    e = Evidence(claim="internal", grade=Grade.E1, provenance=Provenance.INFERRED,
                 source="FPAI-SCENARIO-TAXONOMY-V1:x")
    assert not _external_verified(e) and not e.decisive


# §14.5 family_decision_non_decisive 不变量:真实 bundle 每个节点恒 true
@case("bundle nodes always family_decision_non_decisive=true")
def _c6():
    lib = Library.load()
    b = compile_bundle("LISTEN_BEFORE_RESPOND", lib)
    nodes = b["theories"] + b["constructs"] + b["methods"] + b["modalities"]
    assert nodes and all(n["family_decision_non_decisive"] is True for n in nodes)


# 正向锚:真实链 gate=PASS,method 最高 E7,external>=2
@case("real chain -> gate PASS, method E7, external>=2")
def _c7():
    lib = Library.load()
    assert not [i for i in lib.validate() if i.severity == "error"]
    b = compile_bundle("LISTEN_BEFORE_RESPOND", lib)
    s = b["evidence_summary"]
    assert s["python_evidence_gate"] == "PASS"
    assert s["source_registry_gate"] == "PASS"  # CLOSURE-001:来源机器可核验
    assert s["gate_checks"]["method_evidence_max_grade"] == "E7"
    assert s["external_verified_count"] >= 2


# §CLOSURE-001.1 语法合法但不存在/未登记的假 DOI + real provenance + E7 → 仍不算 external verified
@case("fake DOI (valid syntax, absent from registry) -> NOT external_verified")
def _c8():
    e = Evidence(claim="agent self-minted", grade=Grade.E7, provenance=Provenance.THIRD_PARTY_REAL,
                 source="doi:10.9999/family.fake.001")
    assert _is_external_source(e.source)          # 形态合法(旧检查会误判)
    assert not _source_in_registry(e.source)      # 但不在 verified_sources
    assert not _external_verified(e)               # → 机器判定未核验,Evidence Grounding FAIL


# §CLOSURE-001.2 真实 DOI 语法但未登记于 verified_sources → NOT verified(Agent 不能自编 DOI 再自给 E7)
@case("real-DOI syntax absent from verified_sources -> NOT verified")
def _c9():
    e = Evidence(claim="unregistered", grade=Grade.E7, provenance=Provenance.THIRD_PARTY_REAL,
                 source="doi:10.1234/not.registered.2020")
    assert not _external_verified(e)


# §CLOSURE-001.3 已登记来源(TinT 2015)→ external_verified 且过 gate
@case("registered TinT 2015 -> external_verified + gate PASS")
def _c10():
    e = Evidence(claim="method effect", grade=Grade.E7, provenance=Provenance.THIRD_PARTY_REAL,
                 source="doi:10.1016/j.adolescence.2015.04.005")
    assert _source_in_registry(e.source) and _external_verified(e)
    assert e.gate(Grade.E6)[0]


def main() -> int:
    failed = 0
    for name, fn in CASES:
        try:
            fn()
            print(f"  PASS  {name}")
        except AssertionError as e:
            failed += 1
            print(f"  FAIL  {name}  :: {e}")
    print(f"\nEVIDENCE GATE TESTS: {'PASS' if not failed else 'FAIL'} ({len(CASES)-failed}/{len(CASES)})")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
