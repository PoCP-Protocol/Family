# 循证知识体系(byresearch)

**本 README 按代码实况书写。** 前一版描述的是另一个设计(商业假设证伪),与本目录代码不符,已移交 `..\25_研究_research\`。

一个可运行的循证知识库:把「家庭教育该怎么做」从说法变成**带证据等级、可交叉校验、能落到今晚一个具体动作**的结构化卡片。

它不是资料汇编,也不是提示词库。它的价值在**层与层之间的连接是否闭合** —— 一个没有测量通道的构念、一个没有理论根的方法,都是空话,校验器会把它们指出来。

---

## 五层卡片

五层有方向,不能跳层:

```
理论 Theory ──定义──> 构念 Construct ──测量──> 多模态 Modality
                          ↑                        │
                          │作用于                   │反馈
                    方法 Method <──打包── 实践 Program
```

| 层 | id 前缀 | 回答什么 | 关键字段 |
|---|---|---|---|
| **Theory** 理论 | `TH-` | 为什么会这样 | `core_claim` `boundary` `china_fit` |
| **Construct** 构念 | `CN-` | 到底在改变什么 | `measured_by` `direction` `proxy_risk` |
| **Program** 实践 | `PG-` | 别人已验证过什么整套方案 | `dose` `effect_note` `licensing` `transferability` |
| **Method** 方法 | `MD-` | 今晚这个家庭具体做什么 | `steps` `dose` `observable_signal` `contraindication` `failure_mode` |
| **Modality** 测量 | `MM-` | 怎么知道它真的变了 | `instrument` `reliability` `privacy_risk` `minors_handling` |

**构念层最容易被跳过,跳过就没法测量。** 这是整个设计的用意所在。

`Program.licensing`(版权/认证要求)直接决定能不能商用 —— 别把需要认证的外部项目当自有方法交付。

---

## 证据治理

等级与溯源是**两个正交维度**:等级说「证据有多强」,溯源说「这数字是哪来的」。

**等级 E0–E7**:

| | 含义 |
|---|---|
| E0 | 传闻、个案、无来源 |
| E1 | **内部材料主张**(自家 PPT、口头共识、未验证经验) |
| E2 | 二手媒体、自媒体、行业访谈 |
| E3 | 商业机构行业报告、白皮书(方法通常不透明) |
| E4 | 官方统计、监管文件、权威机构指南 |
| E5 | 一手运营数据(可复核、可追溯到原始记录) |
| E6 | 观察性研究、准实验(队列、面板、断点回归、工具变量) |
| E7 | 随机对照试验、系统综述与元分析 |

分级刻意把「内部主张」和「外部真实数据」分开:**榜样教育自己的材料再详尽也只是 E1,不能用来证明自己。**

**溯源 Provenance**:`primary_real` / `third_party_real` / `self_report` / `unverified` / `inferred` / `simulated` / `unknown`

其中 `inferred`、`simulated`、`unknown`、`unverified` 属 `NON_DECISIVE` —— **不允许用来支撑「成立/有效」结论**。这条门是地基:推算和未核验的引用可以生成假设,不能结案。

一个 E7 元分析,如果只是凭记忆写的、没核验过 DOI,它的溯源仍是 `unverified`,不能当定论用。默认结论门 `gate(min_grade=E4)`。

---

## 校验器管什么

`Library.validate()` 分两类检查。

**跨层引用**(error):id 前缀不符、引用了不存在的卡片、引用指向了错误的层。

**结构闭合**:

| 判定 | 级别 | 理由 |
|---|---|---|
| 构念没有任何测量通道 | error | 无法验证 |
| 构念没有挂上理论 | error | 来源不明 |
| 方法没有理论根 | error | — |
| 方法没说明要改变哪个构念 | error | — |
| **测量卡未说明涉未成年人时的处理要求** | **error** | 合规红线 |
| **测量卡未评估隐私风险** | **error** | 合规红线 |
| 方法缺剂量 | warn | 无法执行也无法复核 |
| 方法缺禁忌 | warn | — |
| 实践未声明授权/认证 | warn | 商用有风险 |
| 实践最强证据不足 | warn | 不宜宣称为循证项目 |
| 构念无任何方法或实践指向 | warn | 构念悬空 |

未知字段直接报错,避免拼错字段名被静默忽略。

---

## 当前状态(诚实版)

装置完好,**卡片库是空的**:

```
cards: 0
by_layer: {'theories': 0, 'constructs': 0, 'programs': 0, 'methods': 0, 'modalities': 0}
issues: []
```

`library/` 下五个 YAML 是本次归档时补的**骨架**,只有结构没有卡片。`issues: []` 不代表健康,代表没东西可校验。

要让它产生价值,必须往 `library/*.yaml` 填真实卡片,且每张卡的 `evidence` 挂 E4 及以上、溯源为真实来源的证据。

---

## 目录

```
20_知识_knowledge\
  byresearch\
    schema.py      五层卡片数据模型 + 跨层 id 前缀约定
    evidence.py    证据等级 E0-E7、溯源、结论门禁
    library.py     加载 YAML + 完整性/一致性校验
    citations.py   CrossRef 引文核验(查 DOI,防凭记忆编引用)
  library\
    theories.yaml constructs.yaml programs.yaml methods.yaml modalities.yaml
```

无 `cli.py`、无 `tests/` —— 见 `..\25_研究_research\BACKLOG.md`。

## 用法

```powershell
cd D:\family\20_知识_knowledge
python -c "from byresearch.library import Library; lib=Library.load(); print(lib.stats()); [print(i) for i in lib.validate()]"
```

依赖:`pyyaml`(`library.py`)、`requests` 或标准库 http(`citations.py` 访问 CrossRef)。

## 与规格的关系

本目录的五层卡片,与 `..\10_规格_spec\02_Family业务架构与Ontology.md` 的 Knowledge/Intervention Ontology **是同一个模型的两次独立设计**。`Method` ↔ `Intervention`、`Construct` ↔ `GrowthDimension` 字段大部分能对上,但有 5 处不对齐(含 `risk_level`/`human_requirement` 缺失、规格缺 `Modality` 层、证据刻度只存在于代码)。

逐条见 `..\10_规格_spec\ISSUES.md` B 节。**两边必须对齐成一套**,否则一期会长出两个互不相认的知识模型。
