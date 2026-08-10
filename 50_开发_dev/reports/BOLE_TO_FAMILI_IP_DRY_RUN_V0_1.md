# Bole to 法咪莉数字人 IP Dry-run V0.1

日期: 2026-08-10

目标: 将 Bole.AI / JoySoul / AiSoul 暂存外部数据转成法咪莉数字人 IP 的受控中间资产,不写核心数据库、不写 Ontology、不写知识 YAML。

---

## 1. 输入包

| Package | Path | 用途判断 | 证据上限 |
|---|---|---|---|
| Bole distillation | `50_开发_dev/integrations/sources/bole-ai/distillation/` | 家庭教育痛点、短视频信号、SFT 风格样本 | E1 |
| JoySoul/AiSoul | `50_开发_dev/integrations/sources/bole-ai/joysoul/` | AI 陪伴产品、玩具/陪伴市场、安全边界启发 | E1 |
| Manifest | `50_开发_dev/integrations/sources/bole-ai/**/MANIFEST.json` | lineage、hash、来源记录 | provenance only |

---

## 2. Dry-run 输出

本次没有执行核心导入,只生成三类中间资产:

1. `25_研究_research/docs/FAMILI_DIGITAL_HUMAN_IP_CHARTER_V0_1.md`
2. `25_研究_research/docs/BOLE_DERIVED_SCENARIO_BANK_V0_1.md`
3. `50_开发_dev/reports/BOLE_TO_FAMILI_IP_DRY_RUN_V0_1.md`

---

## 3. 映射规则

| Source field | Intermediate field | 说明 |
|---|---|---|
| `id` | `sourceId` | 保留外部 lineage,不生成 Family canonical ID |
| `painId` | `painId` | 只作场景分类,不是用户标签 |
| `topicIds` | `topicCandidates` | 后续需人工对齐 Family dimensions |
| `text` / `input` | `userSurface` | 只保留脱敏后的用户表层问题 |
| `output` | `styleCandidate` | 作为风格候选,不能直接作为标准答案 |
| `rationale` | `rationaleCandidate` | 用于专家复核,不是专业证据 |
| `evidenceGrade` | `sourceEvidenceLimit` | 统一不得超过 E1,除非重新通过 Family evidence gates |

---

## 4. 可进入 IP 资产的内容

| 类型 | 可进入 | 条件 |
|---|---|---|
| 痛点短句 | Scenario Bank | 人工复核、去重、风险标注 |
| 家长表达 | Prompt / Eval 候选 | 脱敏、不得保留可识别个人信息 |
| 风格回答 | Persona positive sample | 专家复核、不含夸大承诺、不含诊断 |
| 反例表达 | Eval negative sample | 标注失败原因: 控制、羞辱、诊断、承诺疗效等 |
| AI 陪伴产品材料 | IP 产品边界参考 | 只用于隐私、安全、分龄启发 |

---

## 5. 不得进入的内容

1. 纯表情、广告、刷券、无意义评论。
2. 未授权现实人物独特表达、声音、肖像、课程原文。
3. 任何可识别未成年人或家庭身份的信息。
4. 宣称“保证有效”“从根上解决”“几天改变孩子”的营销语。
5. 医疗/心理诊断建议。
6. 可诱导家长秘密监控、羞辱、威胁、极端惩罚的建议。

---

## 6. 当前 dry-run 结论

| 结论 | 状态 |
|---|---|
| Bole DB 没有可导入业务/蒸馏行 | 已在既有审计确认 |
| 文件系统数据适合做 IP 场景与风格资产 | YES |
| 可直接作为 Family 专业证据 | NO |
| 可直接训练生产模型 | NO |
| 可直接写核心业务状态 | NO |
| 可支持法咪莉数字人 V0.1 Persona / Scenario / Eval | YES, with review |

---

## 7. 下一步任务包

### IP-001 Persona Charter Review

- 审阅 `FAMILI_DIGITAL_HUMAN_IP_CHARTER_V0_1.md`。
- 补现实人物授权状态: 波波校长是否可作为素材源、署名源、声音/肖像源、人格源。

### IP-002 Scenario Bank 100

- 从 Bole short-video signals 扩展到 50 条。
- 从 family_edu_sft 扩展到 30 条。
- 从人工设计补 20 条安全/Human Gate 场景。

### IP-003 Golden Set V0.1

- 正例 50。
- 反例 30。
- 安全升级 20。
- 每条包含 `expected_structure`, `failure_modes`, `eval_tags`。

### IP-004 Prompt Contract

- 输出 Parent Growth Companion prompt。
- 输出 JSON schema。
- 输出 eval checklist。
- 仅作为设计资产,不越过当前 M2 Wave 2 边界写入生产代码。
