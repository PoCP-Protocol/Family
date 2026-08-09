"""证据治理：等级、溯源、以及"能不能用来下结论"的门。

体系里每一张卡片（理论、构念、实践、方法、测量）都必须声明自己的证据等级和来源性质。
没有这一层，知识库就只是一堆看起来专业的说法。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum, Enum
from typing import Iterable


class Grade(IntEnum):
    """证据等级 E0-E7，数值越大越强。

    分级刻意把"内部主张"和"外部真实数据"分开：榜样教育自己的材料
    再详尽也只是 E1，不能用来证明自己。
    """

    E0 = 0  # 传闻、个案、无来源
    E1 = 1  # 内部材料主张（自家 PPT、口头共识、未验证的经验）
    E2 = 2  # 二手媒体、自媒体、行业访谈
    E3 = 3  # 商业机构行业报告、白皮书（方法通常不透明）
    E4 = 4  # 官方统计、监管文件、权威机构指南
    E5 = 5  # 一手运营数据（可复核、可追溯到原始记录）
    E6 = 6  # 观察性研究、准实验（队列、面板、断点回归、工具变量）
    E7 = 7  # 随机对照试验、系统综述与元分析

    @property
    def label(self) -> str:
        return _GRADE_LABELS[self]


_GRADE_LABELS = {
    Grade.E0: "E0 传闻/个案",
    Grade.E1: "E1 内部主张",
    Grade.E2: "E2 二手报道",
    Grade.E3: "E3 行业报告",
    Grade.E4: "E4 官方/权威指南",
    Grade.E5: "E5 一手运营数据",
    Grade.E6: "E6 观察性/准实验",
    Grade.E7: "E7 RCT/元分析",
}


class Provenance(str, Enum):
    """来源性质。等级说"证据有多强"，溯源说"这数字是哪来的"。

    两者独立：一个 E7 元分析如果只是我凭记忆写的、没核验过 DOI，
    它的 provenance 仍然是 UNVERIFIED，不能当定论用。
    """

    PRIMARY_REAL = "primary_real"        # 一手真实记录（自有运营库、原始观测）
    THIRD_PARTY_REAL = "third_party_real"  # 第三方真实数据（已核验的公开文献/官方库）
    SELF_REPORT = "self_report"          # 自陈（问卷、访谈、家长口述）
    UNVERIFIED = "unverified"            # 有出处名目但未核验（如未查到 DOI）
    INFERRED = "inferred"                # 推断、专家判断
    SIMULATED = "simulated"              # 模型推算、合成数据
    UNKNOWN = "unknown"


#: 不允许用来支撑"成立/有效"结论的溯源类型。
#: 这条门是整个体系的地基：推算和未核验的引用可以生成假设，不能结案。
NON_DECISIVE = frozenset(
    {Provenance.INFERRED, Provenance.SIMULATED, Provenance.UNKNOWN, Provenance.UNVERIFIED}
)


@dataclass
class Evidence:
    """一条证据。"""

    claim: str
    grade: Grade
    provenance: Provenance
    source: str = ""                 # DOI / URL / 本地路径 / 材料页码
    year: int | None = None
    sample_n: int | None = None
    population: str = ""             # 样本人群，用于判断能否外推到中国家庭
    note: str = ""
    tags: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if isinstance(self.grade, int) and not isinstance(self.grade, Grade):
            self.grade = Grade(self.grade)
        if isinstance(self.provenance, str):
            self.provenance = Provenance(self.provenance)

    @property
    def decisive(self) -> bool:
        """能否用于支撑结论。"""
        return self.provenance not in NON_DECISIVE

    def gate(self, min_grade: Grade = Grade.E4) -> tuple[bool, str]:
        """返回 (是否可用于支撑结论, 原因)。"""
        if not self.decisive:
            return False, f"溯源为 {self.provenance.value}，按门禁不可用于结论"
        if self.grade < min_grade:
            return False, f"证据等级 {self.grade.label} 低于要求的 {Grade(min_grade).label}"
        if not self.source:
            return False, "缺少可追溯的出处"
        return True, f"{self.grade.label} / {self.provenance.value}"

    def to_dict(self) -> dict:
        return {
            "claim": self.claim,
            "grade": int(self.grade),
            "provenance": self.provenance.value,
            "source": self.source,
            "year": self.year,
            "sample_n": self.sample_n,
            "population": self.population,
            "note": self.note,
            "tags": list(self.tags),
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Evidence":
        return cls(
            claim=d.get("claim", ""),
            grade=Grade(int(d.get("grade", 0))),
            provenance=Provenance(d.get("provenance", "unknown")),
            source=d.get("source", "") or "",
            year=d.get("year"),
            sample_n=d.get("sample_n"),
            population=d.get("population", "") or "",
            note=d.get("note", "") or "",
            tags=list(d.get("tags", []) or []),
        )


def best(evidences: Iterable[Evidence]) -> Evidence | None:
    """取可用于结论的最强证据；若一条都不可用，返回 None。"""
    usable = [e for e in evidences if e.decisive]
    return max(usable, key=lambda e: int(e.grade), default=None)


def summarize(evidences: Iterable[Evidence]) -> str:
    """给卡片生成一行证据摘要。"""
    evs = list(evidences)
    if not evs:
        return "无证据"
    top = best(evs)
    if top is None:
        return f"{len(evs)} 条，但均不可用于结论（推断/未核验/合成）"
    return f"{len(evs)} 条，最强 {top.grade.label}"
