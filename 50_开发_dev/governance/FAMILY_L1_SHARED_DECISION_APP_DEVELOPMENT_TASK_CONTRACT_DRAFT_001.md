# Family L1「共同决策与已准入候选」
## App 开发任务契约与独立 Gate 裁决输入（草案 001）

> **状态：`DRAFT_FOR_APP_GATE_DECISION_INPUT`。**
>
> 本文是对“继续开发 App”请求的最小、可裁决任务契约。它不是开发授权。当前授权登记中 `FAMILY_APP_FIRST_EXPERIENCE_MAPPING_DRAFT` 的 `code_authorized=false`、`runtime_authorized=false`；因此未获得总架构师明确书面裁决前，不得据此修改业务代码、API、DTO、数据库、Web/App/小程序运行时或执行真实 DB/E2E。

## 1. 请求的最小纵切

请求未来仅在现有 Family V3 模块化单体与既有可信编排语义内，实施一个**确定性、无模型、无商业化、无真人服务**的 L1 App-first 纵切。该纵切必须能在纯文本路径中完成：查看当前 admitted candidates、无排序比较、明确选择、返回、暂停、`NO_ACTION` 与安全停止。

> **核心不变量：** 候选展示不等于 Decision；`Decision ≠ Action`；`NO_ACTION → 0 Plan / 0 ServiceCase / 0 Task / 0 Reminder`。

## 2. 正清单：若被放行，允许实施的范围

| 范围 | 拟复用的既有能力 | 允许结果 |
|---|---|---|
| 可信入口 | 既有 server cookie、FamilyPlatformAuthGuard、RequireTrustedFamilyContext、Account → ACTIVE binding → ACTIVE membership → role → family scope。 | 仅可信家庭监护人可进入 L1；context 不可信/歧义即拒绝。 |
| L1 候选只读展示 | 既有 Need/Intent、资源资产目录、资源准入与风险/版权/证据门禁、admitted candidate 查询语义。 | 仅展示当前已准入、范围可见、资格完整、文本可解释的候选。 |
| 无排序比较 | 既有候选摘要字段的等量展示。 | 家庭查看相同粒度的名称、类型、来源/准入摘要与适用边界；零排名、零推荐。 |
| 家庭决定 | 既有 `Decide` Named Action 与服务端审计/幂等边界。 | 只有家庭明确确认且全部服务端门禁复核通过时，才可能写 `Decision`。 |
| 暂停与 NO_ACTION | 既有 `DISMISS` / `NO_ACTION` 语义、可信上下文和审计边界。 | 暂停不写新事实；显式 NO_ACTION 只写 NO_ACTION，绝不写 Plan/Case。 |
| fail-closed | 既有 consent、身份、候选准入、T2/PRACTICE、executor、风险路由、版本检查。 | 任一前提未知/缺失/失效即不显示、不选择或安全停止。 |
| 纯文本 App 体验 | 现有 Web App 的原生 TypeScript 页面与沙箱浏览器验证方式。 | 不依赖模型、图片、动效或语音；可返回、退出、暂停、NO_ACTION。 |
| 验证 | Vitest 单元/真实 PostgreSQL 集成/E2E、沙箱浏览器黄金路径。 | 仅内部确定性验证；提交前形成可审计证据。 |

## 3. 负清单：本任务契约绝不包含的范围

| 禁止类别 | 明确禁止 |
|---|---|
| 模型与 Gateway | Gateway 实现、任何模型调用、外部模型外呼、AI 助手 UI、训练、微调、记忆、自学习或真实数据评测。 |
| 数据与敏感输入 | 真实家庭/儿童新数据采集、儿童直接作答、ADT、指纹、图像、生物特征、学校/医疗资料、通讯录、定位、第三方数据或完整自由文本对话。 |
| 专业与高风险 | L2/L3 工具、标准化量表题项/计分/报告、诊断、风险判断、危机处置、自动报警、自动转介、专业结论。 |
| 候选与服务执行 | 未准入资源、资源搜索/抓取、外部链接、真人顾问、组织跨边界访问、Enrollment/Delivery、自动 Plan/Case、预约、派单、第三方外发。 |
| 商业化 | 支付、会员、权益、优惠、积分、增长/裂变、广告、商业推荐。 |
| 数据衍生 | 成长结果、Family Total Score、排名、儿童/家庭标签、画像、跨家庭统计/推荐、公开分享/公开成长 IP。 |
| 发布与运行 | master 合入、PR 自动合并、移动端运行时、真实家庭试点、生产、公开发布。 |

## 4. 拟影响面：必须在实施前逐项裁决

下表不是变更清单，而是独立 App Gate 必须明确的影响面。若任何条目不获批准，则从实现范围剔除并保持 fail-closed。

| 技术面 | 拟定最小策略 | 需要裁决的事项 |
|---|---|---|
| 页面 | 在现有 Web App 增加/调整 L1 候选列表、详情/比较、选择确认、暂停/NO_ACTION 与安全停止状态。 | 是否批准页面范围、路由/入口及 App-first 布局；是否允许仅沙箱 Web 验证。 |
| API | 仅复用或最小扩展已有受保护查询/Named Action；所有写操作经认证、可信家庭上下文和服务端派生范围。 | 是否允许 API 改动；若允许，确切 endpoint、请求/响应字段与错误码。 |
| DTO | 优先复用已有 DTO；如无法表达 UI 所需的只读准入摘要，单独提交最小字段清单。 | 是否允许新增/调整 DTO；每个字段的目的、来源、可见性与删除/撤回语义。 |
| 数据库 | 默认 **零迁移**；只使用既有 Need/Intent/Resource/Decision/Plan/Case 表和准入投影。 | 若零迁移不能满足，必须暂停并单独申请 schema Gate。 |
| Named Action | 仅复用 `Decide`、`DISMISS` 或现有等价动作；幂等键冲突必须显式拒绝。 | 哪些既有动作可复用；是否允许封装新的动作适配层。 |
| 认证/范围 | 强制 cookie、可信 principal 与 family scope；不接受前端 actor/family/subject。 | 内部验证可否使用既有测试身份；不得降低 strict consumer auth。 |
| 日志/审计 | 只记录已有的 action、候选准入版本、consent/资格检查结果、失败原因类别和关联 ID。 | 具体日志字段、保留策略；禁止记录不必要的原文。 |

## 5. 运行时行为契约

| 用户动作 | 预期服务端条件 | 最大允许状态 | 绝不允许发生 |
|---|---|---|---|
| 打开 L1 | 可信 context、有效 SERVICE consent。 | 无。 | 画像、行为追踪、写 Need/Intent/Decision。 |
| 查看候选 | admitted、资格完整、版本一致、风险路由清晰、文本等价。 | 只读 admitted candidates。 | 自动 Decision/Plan/Case、排序、推荐。 |
| 比较候选 | 家庭主动打开；字段等量。 | 只读 admitted candidates。 | 星级、热度、默认选中、效果断言、跨家庭数据。 |
| 选择一个下一步 | 家庭显式确认；重新核验 consent、候选准入、T2/PRACTICE、executor、风险路由、审计/幂等。 | Decision。 | 自动 Plan/ServiceCase/预约/支付/外发。 |
| 返回或暂停 | 家庭主动操作。 | 无。 | 自动 NO_ACTION、任务、提醒或负面标签。 |
| 现在先不行动 | 家庭显式确认。 | NO_ACTION。 | Intent、Plan、Case、Task、Reminder、营销或推荐。 |
| 任意检查失败 | context/consent/资格/版本/路由任一项失败。 | 无或明确 NO_ACTION。 | 兜底展示未准入资源、外部链接、真人服务或专业建议。 |

## 6. 未来实施的验收矩阵

| 验证层 | 最小必测项 | 通过条件 |
|---|---|---|
| 单元 | 候选准入投影、无排序字段、文案禁用项、Decision/NO_ACTION 状态上限、模板选择。 | 每条规则确定性通过；高危规则零例外。 |
| API / 集成 | strict consumer auth、family scope、ACTIVE 账号/绑定/成员、consent 撤回、context ambiguity、候选准入/降级、T2/executor/风险门禁、幂等重放与冲突。 | 所有拒绝分支 fail-closed；无越权写入。 |
| 真实 PostgreSQL | 已应用迁移数据库上的既有表/动作复用；检查事务与审计关联。 | 候选展示只读；Decision 与 NO_ACTION 符合上限；无自动 Plan/Case。 |
| 浏览器 | 纯文本黄金路径：列表 → 详情/比较 → 返回/暂停/NO_ACTION → 选择确认 → 安全停止。 | 无模型、无图片、无动效时仍可完整完成或安全退出。 |
| 回归 | 既有家庭可信编排、资源资产准入、Phase 8/9/10 和 P0 Runtime Trust 测试。 | 不降低认证、家庭范围、Named Action、资源证据或 consent 约束。 |

## 7. 必测 fail-closed 负例

1. 无可信 Account、ACTIVE binding、ACTIVE membership、角色或唯一 family scope。
2. account disabled 或 context ambiguous。
3. SERVICE consent 缺失、无效或撤回。
4. admitted candidate 为空、未准入、过期、撤销、版权/证据不完整。
5. T2/PRACTICE 不合格、executor 缺失、资格版本不一致。
6. 风险路由未知，或涉及危机、诊断、L2/L3、ADT/生物特征、儿童直接作答。
7. 家庭仅浏览/比较/查看详情而未明确确认。
8. 尝试候选排序、最佳推荐、评分、标签、效果承诺、跨家庭比较、会员/付费诱导。
9. `NO_ACTION` 后出现任何 Intent、Plan、ServiceCase、Task、Reminder 或营销事件。
10. 已记录 Decision 后 consent/准入/executor/风险路由变化却自动进入 Action。
11. 同一幂等键重放或同键内容冲突。
12. 图片、动效或模型不可用时关键操作不可达。
13. 前端伪造 actor/subject/family，或绕过 Named Action。
14. 尝试外发、预约真人、支付、分享、公开画像、训练或跨家庭再利用。

## 8. 本 Gate 的明确裁决问题

请总架构师对以下问题逐项作出 **GO / HOLD / MODIFY** 裁决：

1. 是否批准 L1 的实施范围仅限本任务契约第 2 节的确定性、无模型、无商业化 Web App 纵切？
2. 是否确认 L1 只复用现有 Family V3 的 Need、Intent、admitted candidates、Decision/NO_ACTION、Plan/ServiceCase 语义，不另起系统或微服务？
3. 是否批准在现有开发分支内改动页面，并在必要时最小改动 API/DTO；数据库默认零迁移，任何迁移另行 Gate？
4. 是否确认 `Decision ≠ Action`，且只有 T2/PRACTICE、executor、consent、风险路由、审计和独立后续 Gate 同时成立时，才可能进入既有 Plan/Case 链？
5. 是否确认 NO_ACTION 严格保持 `0 Plan / 0 ServiceCase / 0 Task / 0 Reminder`，且暂停无新写入？
6. 是否批准仅使用现有内部确定性测试身份、真实 PostgreSQL 测试库与沙箱浏览器验证；不启动 mobile runtime、真实家庭试点或生产？
7. 是否确认候选必须全部满足展示前准入清单，任一缺失即 fail-closed；无未准入资源、外部资源、真人服务或商业化兜底？
8. 是否确认本任务不包含 Gateway、模型调用、外部模型、训练、真实数据处理、L2/L3、ADT/生物特征、组织访问、支付/权益、Enrollment/Delivery、公开画像或跨家庭统计？
9. 是否要求实现完成后只提交 Draft PR 的代码、测试、真实 DB/浏览器证据与持续 HOLD 报告，且继续 `AUTO_MERGE=NO`、`master=HOLD`？

## 9. 退出条件

| 结果 | 条件 |
|---|---|
| `GO` | 总架构师对第 8 节明确书面批准，并具体写明允许的页面/API/DTO/测试边界。 |
| `MODIFY` | 总架构师缩小、调整或增加条件；据此重写任务契约，再次等待裁决。 |
| `HOLD` | 继续保留为 Gate 草案；不启动任何代码、运行时、真实 DB/E2E 或浏览器操作。 |
| 实施完成后的候选关闭 | 已批准范围内代码、测试、真实 DB、浏览器和审计证据均通过；形成 Gate Report；仍等待进一步架构师审阅，绝不自动合入 master/试点/生产。 |

## 10. 持续 HOLD 项

无论本任务契约是否获批，除非未来另有明确书面裁决，下列持续 HOLD：master 合入、真实家庭试点、生产、公开发布、移动端 runtime、外部模型外呼、Gateway、训练/微调、自学习、真实家庭/儿童数据处理、L2/L3、ADT/生物特征、真人顾问、组织跨边界访问、第三方外发、支付/会员/权益/商业化、Enrollment/Delivery、成长 IP 运行时、成长结果、永久标签、公开画像、跨家庭统计与推荐。

## 参考与依赖

[1] `architecture/FAMILY_L1_SHARED_DECISION_ADMITTED_CANDIDATES_UX_GATE_DRAFT_001.md`。
[2] `architecture/FAMILY_ASSESSMENT_GOVERNANCE_SUBSYSTEM_GATE_DRAFT_001.md`。
[3] `architecture/FAMILY_L0_CURRENT_NEED_SERVICE_PREFERENCE_UX_GATE_DRAFT_001.md`。
[4] `governance/AUTHORIZATION_REGISTRY.yaml`，`FAMILY_APP_FIRST_EXPERIENCE_MAPPING_DRAFT`。
[5] `governance/PROGRAM_STATUS_PLATFORM_V1.md`。

---

**作者：Manus AI**
**日期：2026-08-17（GMT+8）
