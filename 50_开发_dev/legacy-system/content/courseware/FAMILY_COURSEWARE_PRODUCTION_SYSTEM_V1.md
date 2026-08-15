# Family 课件生产 AI 系统(FCPS)架构 V1

```text
CAPABILITY_THESIS = 高质量课件是家庭教育产品的核心能力;把"研究→设计→撰写→质检→交付"变成
                    可复制、可治理、可放量的生产线,大幅提效,而不牺牲证据诚实与专业权威。
OWNER  = FELS / courseware line(家庭教育课件内容)
STATUS = SPEC_V1(系统规格;组件部分已实现,部分仅声明——见 §3 能力真相)
```

## 0. 一句话
**FCPS = 一条"库先行 + 生成式填充 + 护栏守真 + 人审背书"的课件生产线**:证据/方法采一次治理一次(库),生成式只按情境实例化(不发明证据),护栏守红线,人类专家终审背书,最终交付可消费、可复购的课件包。

## 1. 第一性地基(为什么是这个形状)
- 课件的价值单位 = **真实行为改变并复现**,非"讲了多少"。→ 系统围绕"转化循环"产出,不产讲义堆。
- 改变的物理学 = 动机→可做的小事→反馈→反思→留存→迁移。→ 课件形态由此推导(行动优先/低剂量/间隔/反馈)。
- 领域约束 = 家长时间少、目标不可直控、因果弱、信任稀缺。→ 父母先改变、不承诺疗效、诚实不可选。
- 不变量 vs 变量 = 机制/证据/红线(固定,库+护栏) vs 具体表达(生成,按人)。→ 对象+属性树+生成式。

## 2. 系统架构(组件与数据流)
```
                         course spec (对象/时长/问题域/受众)
                                    │
   ┌──────────────── LIBRARY (库先行, 单一真相) ────────────────┐
   │ constructs(要培养什么) · methods(怎么练) · modalities(形态)   │
   │ verified_sources(循证来源, canonical 在平台 20_知识 / W2R-103B) │
   └───────────────────────────┬────────────────────────────────┘
                               │ 查库(不够→evidence-research 采集→核验→并入)
                               ▼
                 ORCHESTRATOR AGENT (courseware-author v2)
                               │  编排 Skill,经 Model Gateway 路由到"最擅长写课件"的 LLM/Skill
        ┌──────────┬──────────┼──────────┬───────────┬──────────┐
        ▼          ▼          ▼          ▼           ▼          ▼
  lesson-      deck-      facilitator- parent-   instructional- compliance-
  authoring   generation   guide       workbook   design         gate
        └──────────┴──────────┴──────────┴───────────┴──────────┘
                               ▼
                     GATES: quality-gate(红线+教学质检) → evidence 门(evidence.py E0–E7)
                               ▼
                     HUMAN: expert-signoff(持证专家终审, AI 不可代签)
                               ▼
   DELIVERY: content YAML + deck + 讲师手册 + 家长工作簿 + 设计稿 + 合规档 + 质检报告 + 签名位
                               ▼
   BINDING(授权后): content_ref → 产品消费闭环(baseline→打卡→观察→Growth Report→复购)
```

## 3. 组件能力真相(诚实登记:EXISTS / PARTIAL / DECLARED / MISSING)
| 组件 | 状态 | 证据/说明 |
|---|---|---|
| LIBRARY: constructs/methods | **EXISTS** | `library/constructs.yaml`(7)`methods.yaml`(17),证据引用无悬空,4 无源诚实标 practitioner |
| LIBRARY: verified_sources(canonical) | **EXISTS_ELSEWHERE** | 归平台 20_知识 + evidence.py,W2R-103B 硬化;本域交 `sources_handoff_to_platform.yaml`(8 实核 DOI) |
| ORCHESTRATOR: courseware-author v2 | **EXISTS(定义)** | `.claude/agents/courseware-author.md`;含商业就绪门 + 模型/Skill 路由 |
| Skill: evidence-research | **PARTIAL** | 已有可跑路径(curl+crossref,8 源实核);未固化为独立 Skill |
| Skill: lesson-authoring | **EXISTS(产物)** | 首个完整产物 PARENT_21D_V1(21 天) |
| Skill: deck-generation | **PARTIAL** | HTML deck 已生成;`build_pptx.py` 真 python-pptx,但仅文字 4 卡版式 |
| Skill: facilitator-guide / parent-workbook | **DECLARED** | v2 已声明,**未实现**(商业就绪 blocker) |
| Skill: instructional-design(视觉/多媒体) | **MISSING** | 仅文字 MVP,无视觉系统/插画/音视频 |
| Skill: compliance-gate | **DECLARED** | PIPL/未成年人/营销/版权 未审 |
| GATE: quality-gate(红线) | **EXISTS(规则)** | 红线内建于方法/课件;自动校验待固化 |
| HUMAN: expert-signoff | **MISSING** | 持证专家终审签名(强制,AI 不可代签) |
| BINDING: 产品消费闭环 | **HOLD** | content_ref 仅挂旧表;接产品 runtime 需架构师放行(课程平台/FELS-2 HOLD) |
| 真实验证 | **MISSING** | 0 真实家庭;完成率/留存为假设 |

> 纪律:**声明 ≠ 实现;生成 ≠ 可上市**。任一 blocker 未过,系统产物标 `CONTENT_DRAFT`/`EVIDENCE_READY`,不得标 `COMMERCIAL_READY`。

## 4. 治理与门(与平台一致)
- **证据门**:evidence.py 的 E0–E7 + provenance;越强的写手,溯源门越硬(防幻觉 DOI)。
- **红线门**:父母先改变/不诊断/不承诺疗效/不打分排名/危机转人工。
- **商业就绪门**:见 `COMMERCIAL_COURSEWARE_METHOD_V1` 的 10 项。
- **模型**:一律经 Model Gateway(`gateway_only`),不绑 provider;模型可换,真相不换。
- **人审**:专家终审为发布前置;AI 不代签、不判临床有效。

## 5. 边界与归属(不越权)
- FCPS 归 FELS/课件内容线;**verified_sources canonical 归 W2R-103B**(Principal AI),本系统只引用+交待入清单。
- **接产品 runtime = HOLD**,需架构师放行;当前只产内容与交付物,不写 Family canonical、不触发 FELS-2 能力。
- 专家终审、合规法务 = 人类/外部,系统只产"待签/待审包"。

## 6. Roadmap(建议,逐段需授权)
```
P1 库先行         constructs/methods(已) + verified_sources 收编(W2R-103B)      [进行中]
P2 编排闭环        evidence-research/lesson-authoring/deck 固化为可跑 Skill 链      [PARTIAL]
P3 完整交付物      facilitator-guide + parent-workbook + 视觉/多媒体设计            [DECLARED→实现]
P4 合规 + 人审     compliance-gate 过审 + 持证专家终审签名                          [MISSING]
P5 产品绑定        接 baseline→打卡→观察→Growth Report→复购(需架构师放行)        [HOLD]
P6 真实验证        alpha(~20 家庭)→pilot(~100 家庭),用真实数据反哺库与课件      [MISSING]
```

## 7. 成功判据(第一性,可证伪)
不看产量、不看完课率(代理指标)。只问:
1. 目标行为在真实生活里**发生并复现**了吗?
2. 家庭**回来了**吗(继续做/续购)?
其余皆过程代理;且测量必须诚实,不靠把数字做大假装"好"。
