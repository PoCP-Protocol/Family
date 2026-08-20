# Family App-first 体验 Gate 裁决输入草案 001

> **文档状态：`DRAFT_FOR_APP_GATE_DECISION_INPUT`。**
>
> 本文仅把用户提供的两份榜样教育材料映射为未来 Family App 主体验的可裁决设计输入。它**不是**业务代码、PRD 执行授权、DTO/API/数据库变更、Web HOME 或移动端 Runtime 启动授权；也不解除任何 HOLD。

## 1. 设计命题与材料边界

榜样教育材料把“孩子的现实问题”定义为进入点，将父母/家庭的长期支持定义为价值，并提出从触发、理解、行动、陪伴到长期关系的产品旅程。[1] [2] Family V3 应吸收这一**服务体验意图**：以手机为家庭的主入口、以 Web 为辅助可访问与运营验证载体、以一次家庭明确选择后的服务过程为最小可信闭环。

但材料是 **E1 自家材料**。它可以证明已有内容资产、服务设想、品牌语言和商业叙事；不能证明干预效果、预测孩子发展、自动形成家庭画像，或为 AI、社群、分享、顾问、会员、支付、生态交易等能力自证放行。

> **本 Gate 的唯一问题：** 是否允许在既有 Family V3 基座上，设计并实施一个“家庭私有的当下支持”App 纵切，让监护人通过移动优先界面表达当下需要、看见已准入候选、作出明确决定、理解下一步并可给出主观回访？

## 2. 建议的最小 App 纵切

建议采用单一、低承诺、可暂停的场景：**“亲子沟通紧张时，家长需要一个安全的当下支持入口。”** 这既对应材料中“关系焦虑、亲子冲突、每日可执行支持”的高频场景，也复用 PR #36 已通过的可信链，而不要求一次性建设测评、挑战、社群、会员或生态。[2]

| 阶段 | 监护人可见任务 | 家庭系统的确定性职责 | 绝不宣称 |
|---|---|---|---|
| 表达 | 用文字说明“刚刚发生了什么、现在最想处理什么” | 建立受 consent/年龄/家庭范围约束的 Need | 诊断、贴标签或判断孩子有问题 |
| 确认 | 用自己的语言确认服务意图 | 将 Intent 与服务端派生 subject 绑定 | 自动认定家庭目标 |
| 选择 | 查看已准入的候选与“暂不行动” | 只展示 T1 合格且被资源 Gate 放行的候选 | 资源已被证明有效 |
| 决定 | 接受、选择替代或明确暂不行动 | Family Decision 是 Plan / Case 的唯一前置；NO_ACTION 不执行 | 平台替家庭作决定 |
| 支持 | 仅对明确选择且 T2 仍合格的资源进入服务过程 | 创建声明性 Plan / ServiceCase；需要人工时显示等待/交接状态 | 已完成真人服务或已发生教育交付 |
| 回访 | 记录“对我是否有帮助”的主观感受，可跳过 | 记录 FollowUp 与私有过程投影 | 孩子已改变、效果已证实 |

## 3. App 体验正清单

| 体验/页面候选 | 允许范围 | 现有基座或需在后续 App Gate 明确的依赖 |
|---|---|---|
| 移动优先的家庭欢迎与“说说现在的需要”入口 | 单一文本输入、暂停/返回、无 UUID、无隐式授权 | 已有 strict Account → binding → membership → family scope 与 Need action；App 仅需消费既有 API。 |
| 确认与候选页 | 显示家庭可读的意图、资格说明、来源/版权/风险提示、NO_ACTION | 已有 Intent、Resource Asset Gate、T1/T2、NO_ACTION 语义。 |
| 家庭决定页 | 显式确认、替代选择、暂不行动；不得自动推进 | 已有 Named Action、idempotency、Decision integrity。 |
| 服务过程与主观回访页 | 仅显示状态、下一步、人工交接等待、可选主观帮助感 | 已有 Plan/Case/FollowUp、handoff traceability、Context Reuse 的最小边界。 |
| 家庭私有历史摘要 | 同一家庭的服务过程事实、撤回后最小可见 | 已有 Context Reuse / data lifecycle consent gate；需独立 UI 文案审阅。 |
| 无障碍与文本等价 | 全部关键动作可用文本完成；无图/语音时路径完整 | 新 App 验收必须覆盖。 |

## 4. 负清单与继续 HOLD

以下内容不得被本 App Gate 暗中带入实现：Web HOME 全量重做、移动端原生 Runtime、公开社区、分享/邀请/积分、成长身份等级、课程商城、Payment、Entitlement、Enrollment/Delivery、会员续费、真人顾问预约/交付、组织/学校/城市访问、Provider 市场、外部模型外呼、训练/自学习、跨家庭统计/推荐、儿童公开 IP、成长结果、永久标签、公开画像、真实数据导出/删除/外发、加密文件交付、PR37 Runtime 或 master 合入。

材料中“成长报告、画像、分享、社群、AI 越用越懂、服务档案、会员权益”等表述，在当前阶段均只能作为**未来设计输入**。其中服务档案可被降维为家庭私有、最小化、可撤回的服务过程视图；其余必须等待独立 Gate。

## 5. 数据、Consent 与隐私边界

| 数据类别 | App 可显示/写入 | 必要 Gate | 默认 fail-closed 行为 |
|---|---|---|---|
| 家庭、监护人、child subject 范围 | 仅服务端 trusted context 已解析的最小展示名/关系文案 | ACTIVE account、binding、membership、family scope | 无会话 `401`；无 membership/ambiguous `403`；前端范围字段无效。 |
| Need / Intent 文本 | 仅用于当前家庭服务链；遵循最小化与可见性 | SERVICE consent、年龄范围、Named Action | 缺 SERVICE consent、跨家庭/非 child subject → 拒绝且零写入。 |
| 资源候选 | admission、provenance、evidence tier、风险、版权的家庭可读摘要 | Resource Asset Gate、T1/T2 | 未准入/降级/无 executor → 不可见、不可选。 |
| 服务过程 / 回访 | Plan、Case、状态、主观帮助感 | 家庭明确决定、T2、FollowUp action | NO_ACTION 不建 Plan/Case；主观感受不得转为成长效果。 |
| 历史复用 | 同家庭且有有效 SERVICE consent 的最小过程事实 | Context Reuse consent gate | consent 撤回 → 空投影，不删除历史事实。 |

## 6. 多模态入口的前置条件

本 Gate 不启用多模态 Runtime。后续若提出语音、图片、截图或材料理解入口，必须逐个独立说明输入来源、目的限定、Consent、保留期、E1/E2 证据、风险路由、文本等价、人工 Gate、Model Gateway、输出可见性和删除/撤回路径。任何条件不成立时，必须只保留文本路径并 fail-closed。

## 7. DTO/API 与数据库影响声明

本草案**不提出变更**。若 App Gate 获准，首选原则是只消费已存在的、经过 P0 收口的 Named Action 与读取接口。任何新增 DTO、API、表、迁移、事件、Cookie 或权限动作都必须在 App Gate 中逐条列为“新增”，说明家庭范围、数据最小化、Consent、幂等、审计、测试和回滚/退出条件；不可由 UI 需求隐式引入。

## 8. 必须覆盖的 fail-closed 负例

| 编号 | 负例 | 预期 |
|---|---|---|
| AF-01 | 无会话或仅伪造 actor/family | `401/403`，不显示家庭数据。 |
| AF-02 | disabled account、撤销 binding/membership、ambiguous context | 拒绝，不任选 person context。 |
| AF-03 | cookie 跨 Origin 写操作 | `403`；Bearer 测试客户端遵循受控 API 契约。 |
| AF-04 | 无 SERVICE consent、跨家庭 child、年龄不在范围 | Need 写入拒绝，零服务输入/信号。 |
| AF-05 | 未准入、版权/风险降级、E1 效果表述或 PRACTICE 无 executor | 不展示/不选择；不把内容引用包装成已交付。 |
| AF-06 | NO_ACTION 被接受为资源 | 拒绝；仅 `DISMISS + []`，不建 Plan / Case。 |
| AF-07 | T1 后 consent/provider 条件变化 | T2 要求重新推荐，零 ServiceCase。 |
| AF-08 | 任意写动作网络重试或同键异请求 | 同键重放零重复；异请求 `409`。 |
| AF-09 | REVIEW/HIGH_RISK | 显示受控等待/安全状态；不显示被扣留内容；trace 可审计。 |
| AF-10 | 主观回访或 UI 文案试图生成效果结论/标签 | 不写 canonical outcome、不展示“已证明改变”。 |

## 9. App Gate 验证矩阵与退出条件

| 层级 | 必需证据 | 通过条件 |
|---|---|---|
| 单元 | UI 状态、文案边界、文本等价、资源卡/NO_ACTION | 不包含成长效果、永久标签、公开分享或绕过服务端范围。 |
| API 合同 | 既有 Named Action / DTO / error contract | UI 不能构造越权 body；所有写经服务端 scope、Consent、idempotency。 |
| 真实 PostgreSQL | 合成家庭、最小数据、撤回/跨家庭/重复请求 | 所有负例 fail-closed，正向链不污染其他家庭。 |
| 浏览器 / App E2E | 移动视口 + 文本等价路径 | 从表达 Need 到明确决定、回访和私有进度可完成；无内部 ID/令牌。 |
| 静态审计 | 代码、路由、依赖、日志 | 无外部模型、训练、支付、公开分享、跨家庭统计、未授权 I/O。 |
| 浏览器后回归 | E2E 后 API 全量真实 DB 回归 | 合成会话/种子不污染基线。 |

退出条件为：若 Gate 中出现需要真实导出、外部模型、组织访问、真人顾问、支付/权益、公开内容、跨家庭数据或成长结果的需求，必须停止当前 App 工作包，分离成新契约并请求新的 Human Gate。

## 10. 请求总架构师裁决的问题

1. 是否接受“亲子沟通紧张时的家庭私有当下支持”作为第一条 App-first 体验纵切，而非一次性推进测评、挑战、社区和会员？
2. 是否同意 App 第一阶段仅消费既有可信 API，默认不新增 DTO/API/数据库；任何新增接口另行裁决？
3. 是否确认 UI 中的“进展”只限服务过程与家庭主观帮助感，明确不得成为成长效果、画像或标签？
4. 是否确认材料中的内容资产在 UI 中必须继承 resource evidence/provenance/admission/risk/copyright Gate，并将 E1 限定为来源/版权事实？
5. 是否确认多模态仅保留设计入口和文本等价路径，任何语音/图像/截图处理须独立 Gate？
6. 是否确认 App Gate 通过后仍是开发分支内部确定性验证，不自动导致 PR merge、master、试点或生产？

## References

[1] 用户提供：《榜样教育新商业模式对外宣发PPT_原图版(2)》，重点见第 1、2、7、11、15、17、18、20 页。  
[2] 用户提供：《榜样教育战略白皮书_30页演讲汇报版》，重点见第 3–6、9、12–19、27–30 页。  
[3] `FAMILY_APP_FIRST_SOURCE_FINDINGS_2026-08-16.md`，两份材料的 E1 边界与 App-first 映射摘录。  
[4] `governance/PR36_P0_RUNTIME_TRUST_EVIDENCE_INDEX_2026-08-16.md`，PR #36 P0 Runtime Trust Closeout 证据索引。

---

**作者：Manus AI**  
**日期：2026-08-16（GMT+8）
