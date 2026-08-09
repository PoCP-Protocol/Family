"""体系五层卡片的数据模型。

五层是有方向的，不能跳层：

    理论 Theory ──定义──> 构念 Construct ──测量──> 多模态 Modality
                              ↑                        │
                              │作用于                   │反馈
                        方法 Method <──打包── 实践 Program

- 理论回答"为什么会这样"
- 构念回答"到底在改变什么"（这一层最容易被跳过，跳过就没法测量）
- 实践回答"别人已经验证过什么整套方案"
- 方法回答"今晚这个家庭具体做什么"
- 多模态回答"怎么知道它真的变了"
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .evidence import Evidence, Grade, summarize


@dataclass
class Card:
    """所有卡片的共同字段。"""

    id: str
    name: str
    summary: str = ""
    evidence: list[Evidence] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    open_questions: list[str] = field(default_factory=list)

    layer: str = "card"

    @property
    def evidence_line(self) -> str:
        return summarize(self.evidence)

    @property
    def strongest(self) -> Grade:
        return max((e.grade for e in self.evidence), default=Grade.E0)


@dataclass
class Theory(Card):
    """理论卡：学理根系。"""

    layer: str = "theory"
    originators: list[str] = field(default_factory=list)
    year: str = ""
    core_claim: str = ""            # 一句话核心主张
    defines: list[str] = field(default_factory=list)   # 定义了哪些 construct id
    boundary: str = ""             # 适用边界与已知反驳
    china_fit: str = ""            # 在中国家庭情境下的适配与存疑之处


@dataclass
class Construct(Card):
    """构念卡：可测量的中间变量。理论与测量之间的接头。"""

    layer: str = "construct"
    definition: str = ""
    grounded_in: list[str] = field(default_factory=list)  # theory id
    measured_by: list[str] = field(default_factory=list)  # modality id
    direction: str = ""            # 期望改变方向，例如 "越高越好" / "越低越好" / "适中"
    proxy_risk: str = ""           # 用代理指标测它的风险


@dataclass
class Program(Card):
    """实践卡：已被外部验证过的成套干预项目。"""

    layer: str = "program"
    origin: str = ""               # 来源国家/机构
    target: str = ""               # 目标人群与年龄段
    dose: str = ""                 # 剂量（周数、时长）
    delivery: str = ""             # 交付形式（团体/个体/线上/视频反馈）
    targets_constructs: list[str] = field(default_factory=list)
    effect_note: str = ""          # 效应量与已知局限
    licensing: str = ""            # 版权/认证要求 —— 直接决定能不能商用
    transferability: str = ""      # 可迁移到榜样教育产品的程度


@dataclass
class Method(Card):
    """方法卡：可执行到家庭日常粒度的动作。"""

    layer: str = "method"
    grounded_in: list[str] = field(default_factory=list)   # theory id
    targets_constructs: list[str] = field(default_factory=list)
    derived_from: list[str] = field(default_factory=list)  # program id
    steps: list[str] = field(default_factory=list)
    dose: str = ""                 # 频率与时长，例如 "每日 10-15 分钟，连续 2 周"
    age_range: str = ""
    observable_signal: str = ""    # 家长自己能看到的变化信号
    contraindication: str = ""     # 禁忌：什么情况下不能用
    failure_mode: str = ""         # 典型做坏的方式
    risk_level: str = ""           # 风险等级，例如 low / medium / high —— Policy Gate 据此判定
    human_requirement: str = ""    # 人工要求：none / review / mandatory —— 高风险场景必须 Human Gate
    # ↑ 与 spec 02 §3.5 Intervention 的 risk_level / human_requirement 同名同义(ISSUES.md B1 裁决)


@dataclass
class Modality(Card):
    """多模态测量卡：一种获取家庭真实信号的通道。"""

    layer: str = "modality"
    channel: str = ""              # 量表 / 语音 / 视频 / 文本 / 行为日志 / 生理
    measures_constructs: list[str] = field(default_factory=list)
    instrument: str = ""           # 具体工具或编码体系
    reliability: str = ""          # 信效度已知情况
    cost: str = ""                 # 采集成本
    home_feasible: str = ""        # 家庭场景可行性
    privacy_risk: str = ""         # 隐私风险等级与处理要求
    minors_handling: str = ""      # 涉未成年人时的额外要求


LAYERS: dict[str, type[Card]] = {
    "theories": Theory,
    "constructs": Construct,
    "programs": Program,
    "methods": Method,
    "modalities": Modality,
}

#: 每层 id 的前缀约定，用于交叉引用校验时判断引用目标是否指向了正确的层
ID_PREFIX = {
    "theories": "TH",
    "constructs": "CN",
    "programs": "PG",
    "methods": "MD",
    "modalities": "MM",
}


def build(layer: str, raw: dict) -> Card:
    """从 YAML 字典构造卡片。未知字段直接报错，避免拼错字段被静默忽略。"""
    cls = LAYERS[layer]
    data = dict(raw)
    data["evidence"] = [Evidence.from_dict(e) for e in (data.get("evidence") or [])]
    known = {f for f in cls.__dataclass_fields__}
    unknown = set(data) - known
    if unknown:
        raise ValueError(f"{layer} 卡片 {data.get('id')!r} 含未知字段: {sorted(unknown)}")
    data.pop("layer", None)
    return cls(**data)
