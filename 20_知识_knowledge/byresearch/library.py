"""加载体系五层卡片，并做完整性与一致性校验。

体系的价值不在卡片数量，而在**层与层之间的连接是否闭合**。
一个没有测量通道的构念、一个没有理论根的方法，都是空话，校验器会把它们指出来。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

from .evidence import Grade
from .schema import ID_PREFIX, LAYERS, Card, build

DEFAULT_ROOT = Path(__file__).resolve().parent.parent / "library"


@dataclass
class Issue:
    """一条校验问题。"""

    severity: str      # "error" | "warn"
    card: str
    message: str

    def __str__(self) -> str:
        mark = "✗" if self.severity == "error" else "!"
        return f"{mark} [{self.card}] {self.message}"


@dataclass
class Library:
    cards: dict[str, Card] = field(default_factory=dict)
    by_layer: dict[str, list[Card]] = field(default_factory=dict)

    # ---------- 加载 ----------

    @classmethod
    def load(cls, root: Path | str = DEFAULT_ROOT) -> "Library":
        root = Path(root)
        lib = cls()
        for layer in LAYERS:
            path = root / f"{layer}.yaml"
            items = []
            if path.exists():
                doc = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
                items = doc.get(layer) or []
            lib.by_layer[layer] = []
            for raw in items:
                card = build(layer, raw)
                if card.id in lib.cards:
                    raise ValueError(f"卡片 id 重复: {card.id}")
                lib.cards[card.id] = card
                lib.by_layer[layer].append(card)
        return lib

    # ---------- 查询 ----------

    def get(self, card_id: str) -> Card | None:
        return self.cards.get(card_id)

    def layer(self, name: str) -> list[Card]:
        return self.by_layer.get(name, [])

    def search(self, keyword: str) -> list[Card]:
        k = keyword.lower()
        hits = []
        for c in self.cards.values():
            blob = " ".join(
                [c.id, c.name, c.summary, " ".join(c.tags), " ".join(c.open_questions)]
            ).lower()
            if k in blob:
                hits.append(c)
        return hits

    def links_from(self, card: Card) -> dict[str, list[str]]:
        """列出一张卡片指向的所有其他卡片，按字段名归组。"""
        out: dict[str, list[str]] = {}
        for fname in (
            "defines",
            "grounded_in",
            "measured_by",
            "targets_constructs",
            "measures_constructs",
            "derived_from",
        ):
            vals = getattr(card, fname, None)
            if vals:
                out[fname] = list(vals)
        return out

    def referrers(self, card_id: str) -> list[Card]:
        """谁引用了这张卡片。"""
        out = []
        for c in self.cards.values():
            for vals in self.links_from(c).values():
                if card_id in vals:
                    out.append(c)
                    break
        return out

    # ---------- 校验 ----------

    def validate(self) -> list[Issue]:
        issues: list[Issue] = []
        expect_layer = {
            "defines": "constructs",
            "grounded_in": "theories",
            "measured_by": "modalities",
            "targets_constructs": "constructs",
            "measures_constructs": "constructs",
            "derived_from": "programs",
        }

        for layer, cards in self.by_layer.items():
            prefix = ID_PREFIX[layer]
            for c in cards:
                if not c.id.startswith(prefix + "-"):
                    issues.append(Issue("error", c.id, f"{layer} 的 id 应以 {prefix}- 开头"))
                if not c.summary:
                    issues.append(Issue("warn", c.id, "缺少 summary"))

                # 引用目标必须存在，且必须指向正确的层
                for fname, refs in self.links_from(c).items():
                    want = expect_layer[fname]
                    for r in refs:
                        target = self.cards.get(r)
                        if target is None:
                            issues.append(Issue("error", c.id, f"{fname} 指向不存在的卡片 {r}"))
                        elif target.layer != LAYERS[want].layer:
                            issues.append(
                                Issue("error", c.id, f"{fname} 应指向 {want}，但 {r} 属于 {target.layer}")
                            )

        issues += self._structural_issues()
        return issues

    def _structural_issues(self) -> list[Issue]:
        """体系闭合性检查 —— 这几条才是这个模块真正想守住的东西。"""
        issues: list[Issue] = []

        # 1. 构念必须能被测量，否则整层无法验证
        for c in self.layer("constructs"):
            if not getattr(c, "measured_by", None):
                issues.append(Issue("error", c.id, "构念没有任何测量通道，无法验证"))
            if not getattr(c, "grounded_in", None):
                issues.append(Issue("error", c.id, "构念没有挂上理论，来源不明"))

        # 2. 方法必须有理论根、目标构念和剂量，否则只是经验之谈
        for m in self.layer("methods"):
            if not getattr(m, "grounded_in", None):
                issues.append(Issue("error", m.id, "方法没有理论根"))
            if not getattr(m, "targets_constructs", None):
                issues.append(Issue("error", m.id, "方法没说明要改变哪个构念"))
            if not getattr(m, "dose", None):
                issues.append(Issue("warn", m.id, "方法缺少剂量，无法执行也无法复核"))
            if not getattr(m, "contraindication", None):
                issues.append(Issue("warn", m.id, "方法缺少禁忌说明"))
            # 高风险家庭场景必须 Human Gate(ISSUES.md B1):没有 risk_level,Gate 无从判定
            if not getattr(m, "risk_level", None):
                issues.append(Issue("warn", m.id, "方法未声明 risk_level，Policy/Human Gate 无字段可判"))
            elif str(getattr(m, "risk_level")).strip().lower() in {"high", "高", "medium", "中"} \
                    and not getattr(m, "human_requirement", None):
                issues.append(Issue("error", m.id, "中/高风险方法未声明 human_requirement，违反 Human Gate 硬规则"))

        # 3. 实践项目必须声明授权要求 —— 商用前的硬约束
        for p in self.layer("programs"):
            if not getattr(p, "licensing", None):
                issues.append(Issue("warn", p.id, "未声明授权/认证要求，商用有风险"))
            if p.strongest < Grade.E6:
                issues.append(
                    Issue("warn", p.id, f"最强证据仅 {p.strongest.label}，不宜宣称为循证项目")
                )

        # 4. 涉未成年人的测量通道必须写明处理要求
        for mm in self.layer("modalities"):
            if not getattr(mm, "minors_handling", None):
                issues.append(Issue("error", mm.id, "未说明涉未成年人时的处理要求"))
            if not getattr(mm, "privacy_risk", None):
                issues.append(Issue("error", mm.id, "未评估隐私风险"))

        # 5. 孤岛检查：没有被任何方法或实践指向的构念，说明体系里悬空
        for c in self.layer("constructs"):
            if not any(
                c.id in (getattr(x, "targets_constructs", None) or [])
                for x in self.layer("methods") + self.layer("programs")
            ):
                issues.append(Issue("warn", c.id, "没有任何方法或实践指向它，构念悬空"))

        return issues

    # ---------- 统计 ----------

    def stats(self) -> dict:
        out = {}
        for layer, cards in self.by_layer.items():
            grades = [int(c.strongest) for c in cards]
            out[layer] = {
                "count": len(cards),
                "with_evidence": sum(1 for c in cards if c.evidence),
                "max_grade": max(grades) if grades else 0,
                "median_grade": sorted(grades)[len(grades) // 2] if grades else 0,
            }
        return out
