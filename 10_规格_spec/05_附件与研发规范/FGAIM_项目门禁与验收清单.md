# 06｜FGAIM 项目门禁与验收清单

# Definition of Ready

任何Story进入开发前必须回答：

- [ ] 当前LifeStage是什么？
- [ ] 属于Child / Parent / Relationship哪个Domain？
- [ ] 涉及哪个Object？
- [ ] 支持哪个Decision？
- [ ] Evidence是什么？
- [ ] 是否涉及Perspective/Hypothesis？
- [ ] Recommendation是什么？
- [ ] 最终Named Action是什么？
- [ ] Human Gate是什么？
- [ ] Outcome是什么？
- [ ] 如何Eval？
- [ ] 是否涉及Consent/Safety？

关键项缺失不得进入Sprint。

---

# Definition of Done

- [ ] 功能可运行
- [ ] Domain Contract通过
- [ ] Schema校验通过
- [ ] 权限正确
- [ ] Audit完整
- [ ] Evidence可追溯
- [ ] AI版本可追踪
- [ ] Unit/Integration Test通过
- [ ] Golden Set通过
- [ ] Safety Set通过
- [ ] Adversarial Set通过
- [ ] Observability可用
- [ ] Rollback可用
- [ ] Outcome可记录

---

# Architecture Review

## Value
- [ ] 有明确家庭价值
- [ ] 有明确Outcome

## Ontology
- [ ] Object/Link/State/Event正确
- [ ] Perspective != Fact
- [ ] Recommendation != Decision != Action

## Data
- [ ] 来源合法
- [ ] Consent明确
- [ ] 数据最小化
- [ ] Lineage存在

## AI
- [ ] Model Gateway
- [ ] Structured Output
- [ ] Human Gate
- [ ] Evaluation

## Platform
- [ ] 不绑定单一模型
- [ ] 不绑定单一Ontology平台
- [ ] Commodity capability优先集成

## Safety
- [ ] 未成年人数据处理正确
- [ ] 高风险信号有升级路径

---

# Release Gate

DEV → TEST → EVAL → PILOT → PROD

禁止DEV直发PROD。

每次AI发布检查：
- Domain
- Professional
- Grounding
- Safety
- Adversarial
- Human review
- Latency
- Cost
- Traceability
- Rollback
