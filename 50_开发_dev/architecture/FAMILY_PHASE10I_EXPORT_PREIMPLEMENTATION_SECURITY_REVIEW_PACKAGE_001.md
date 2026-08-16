# Family Phase 10I：真实导出实施前安全评审包

**状态：** 设计授权，非运行时授权。  
**审阅对象：** Family V3 当前 schema 与未来真实家庭数据导出风险。  
**禁止事项：** 本包不新增迁移、DTO、API、Named Action、加密实现、文件服务、下载、传输、删除或真实数据处理。

## 1. 评审结论框架

Family 当前数据模型已经明确家庭是范围根，并在核心对象中保留 `family_id`。但“能按家庭查询”不等于“可以导出”。真实导出必须另行证明：请求人的身份和监护人资格、用途和字段范围、孩子与第三方权益、审批和撤回、密钥与交付、有效期和审计均满足独立 Gate。NIST 的公开指导将数据最小化、清晰通知与 consent、可管理的选择性披露和隐私风险评估作为隐私设计的重要考虑。[1] ICO 对数据可移植性则强调安全传输、结构化/常用/机器可读格式以及第三方权利影响。[2]

当前裁决只允许**评审设计**。下表中的“未来控制”不是当前授权。

## 2. 字段级 Data Inventory

### 2.1 身份、家庭与同意

| 当前对象 | 字段/字段类别 | 敏感等级 | 未来默认处理 | 未来需审查的导出问题 |
|---|---|---:|---|---|
| `families` | `family_id`、`display_name`、`status`、`primary_contact_person_id`、版本与时间 | 高 | 排除或令牌化 | 是否会暴露家庭身份、主联系人或可关联 ID |
| `persons` | `person_id`、`family_id`、`person_type`、`parent_role`、`display_name`、`birth_date`、`account_id` | 极高 | 默认排除；必要时逐字段脱敏 | 儿童身份、出生日期、账号和其他家庭成员是否混入 |
| `family_relationships` | 关系双方 ID、关系类型、创建时间 | 高 | 默认排除 | 是否涉及非请求人、共同监护或第三方权益 |
| `life_stage_assignments` | child ID、生命周期阶段、有效时间、来源 | 高 | 排除派生/阶段标签；只在独立 Gate 后考虑 | 是否会被误读为成长结果、年龄标签或永久画像 |
| `consents` | purpose、status、policy version、授予/撤回时间；subject/guardian ID | 高 | 只考虑事实摘要，不导出 ID | 是否能证明目的、版本和撤回；是否把 SERVICE 同意误用为导出同意 |

### 2.2 成长编排和服务过程

| 当前对象 | 字段/字段类别 | 敏感等级 | 未来默认处理 | 未来需审查的导出问题 |
|---|---|---:|---|---|
| `growth_need_signals` | need type、source type、signal text、创建人和时间 | 极高 | `signal_text` 默认排除；只在逐项审查后考虑 | 自由文本是否含儿童、家庭成员或第三方隐私 |
| `growth_intents` | need type、goal text、状态、确认事实、时间 | 极高 | goal text 与 ID 默认排除 | 是否含成长目标、敏感推断或可被误解的评价 |
| `growth_capabilities` | code、名称、描述、policy version | 中 | 仅输出公开/内部允许的能力元数据 | 是否暴露内部策略或不应外发的能力说明 |
| `resource_offers` | 类型、标题、描述、生命周期范围、证据、风险、版权/准入、provider qualification | 中/高 | 仅可考虑已准入的资源元数据 | 是否把自家材料误作效果证据，是否暴露提供者或版权信息 |
| `resource_recommendations` 与 candidates | 资格结果、rationale、limitations、生成策略、排序 | 高 | 默认排除 rationale、limitations 与排名 | 是否产生或暴露成长结果、推荐因果或内部风控规则 |
| `family_service_decisions` | decision type、rationale、决定人、时间 | 高 | rationale 默认排除；只考虑决定事实 | 是否泄露家庭判断、孩子状态或第三方信息 |
| `orchestration_plans`、steps | 计划状态、资源、步骤顺序、触发类型 | 中/高 | 仅考虑服务过程摘要 | 是否会被误读为执行承诺、教育效果或未来保证 |
| `service_cases` | 状态、owner、下一步、SLA、escalation reason、开/关时间 | 高 | 默认只输出状态摘要；排除 escalation reason | 是否暴露内部运营、真人服务或安全处置原因 |
| `follow_up_responses` | helpfulness、response_text、truth class、记录人、时间 | 极高 | `response_text` 默认排除；helpfulness 只能标注为主观感受 | 不得写成长结果、效果、因果或永久标签 |

### 2.3 生命周期、审计与治理

| 当前对象 | 字段/字段类别 | 敏感等级 | 未来默认处理 | 未来需审查的导出问题 |
|---|---|---:|---|---|
| `family_data_lifecycle_requests` | request type/scope/status、reason text、请求人、时间 | 高 | 只输出请求治理摘要；reason 默认排除 | 是否暴露家庭敏感意图、删除请求或内部治理信息 |
| `family_data_lifecycle_request_reviews` | decision、reason code、policy version、reviewer、时间 | 高 | 默认不导出；仅保留安全审计 | 是否泄露审核人、风控规则或内部审批细节 |
| `audit_logs` | actor、action、resource、correlation、结果、metadata | 极高 | 不进入家庭导出包 | 是否含家庭正文、token、内部错误、密钥或安全检测信息 |
| `outbox_events` | event、aggregate、payload、时间 | 极高 | 不进入家庭导出包 | 是否含事件 payload、内部 ID、重放信息或未公开状态 |
| `idempotency_keys` | key、action、request hash、response | 极高 | 永不导出 | key、hash 和 response 可能被重放或推断内部操作 |

> **默认规则：** 不在白名单中的字段不导出；存在儿童、共同监护人、第三方、自由文本、派生结论、模型输入/输出、成长结果、永久标签或内部安全资料时，默认排除并进入 Human Gate。

## 3. 数据保护影响评审（DPIA）模板

未来若申请真实导出运行时，必须先完成以下模板，并由数据保护、架构、安全与家庭利益代表共同签核。

| 评审项 | 必须回答的问题 | 不通过条件 |
|---|---|---|
| 目的 | 家庭为什么需要这份数据？是否能用更少字段达到目的？ | 目的宽泛、商业画像、训练或跨家庭用途 |
| 处理基础 | 导出 Consent 是否独立、明确、可证明、可撤回？ | 复用 SERVICE consent 或捆绑授权 |
| 主体范围 | 请求涉及哪些成人、孩子和第三方？谁有权决定？ | 共同监护/第三方关系不清 |
| 数据类别 | 每个字段为何必要？是否为事实而非推断？ | 全量导出、自由 SQL、成长结论或永久标签 |
| 脱敏 | 哪些字段被排除、掩码、泛化或令牌化？ | 无字段级规则或无法验证脱敏结果 |
| 交付 | 谁接收、怎样验证、多久有效、如何撤销？ | 永久 URL、通用邮箱、无法撤回/过期 |
| 安全 | 密钥如何生成、保管、轮换、撤销和审计？ | 密钥进入日志/应用库或未经评审的算法选择 |
| 儿童/第三方 | 是否存在权益冲突、敏感内容或共同数据？ | 仅依赖自动规则或默认代表他人同意 |
| 事件 | 泄露、误交付、重放、账户接管如何发现和响应？ | 无演练、无审计或无家庭救济通道 |
| 生命周期 | 临时构造、副本、缓存、备份、审计各自保留多久？ | 宣称无法证明的“全部删除” |
| 退出 | 如何撤回、取消、申诉、纠正或重新请求？ | 撤回路径更困难或不可追踪 |

## 4. 密钥管理决策表

当前不选定算法、KMS、云服务或凭证。未来选型必须记录理由并经安全评审。

| 决策面 | 必答问题 | 暂定安全原则 |
|---|---|---|
| 密钥归属 | 由 Family 平台、家庭还是接收方控制？ | 默认平台不持有可长期解密家庭副本的万能密钥 |
| 生成 | 在何处生成？是否有硬件保护和审计？ | 禁止源码、配置、日志和普通数据库保存密钥 |
| 交付 | 如何把密钥/解密能力交给正确接收方？ | 与数据包分离、短时、一次性、可撤销 |
| 轮换 | 轮换周期、旧包、撤销和恢复怎样处理？ | 过期后旧授权不得复活 |
| 访问 | 哪些服务/人员可执行解密？ | 最小权限、双人控制、高风险操作强制人工门 |
| 失败 | 密钥丢失、误发、怀疑泄露如何处置？ | 立即撤销并保留安全审计，不自动重发 |
| 证明 | 如何证明使用了正确版本和 policy？ | package digest 与 policy/whitelist digest 绑定 |

## 5. 儿童与第三方利益审查清单

导出涉及孩子、共同监护人、其他家庭成员、老师、顾问或资源提供者时，必须逐项回答：请求人是否对该数据拥有充分权限；数据是否由多人共同提供；导出是否可能泄露孩子的敏感情况；是否可能影响孩子最佳利益；是否需要删减、泛化或延迟；是否需要另一监护人确认；是否存在法律、合同或安全风险；是否会把主观感受变成成长结论；是否会让接收方将数据用于广告、训练、推荐或商业画像。任一问题无法回答时，状态必须为 `REJECTED` 或转入独立人工审查，不得自动导出。

## 6. 事件响应演练脚本

演练只使用合成数据和虚构事件，不调用真实交付、加密或通知服务。

| 场景 | 触发 | 预期动作 | 通过标准 |
|---|---|---|---|
| E1：范围漂移 | policy digest 与确认版本不一致 | 阻止构造，标记请求失效 | 无包、无文件、无传输；审计可关联 |
| E2：撤回竞态 | 构造前撤回 consent | 取消审批/构造 | 不进入 READY 状态 |
| E3：接收方不明 | 接收方验证失败 | 拒绝交付并撤销 grant | 不重试、不降级为公开链接 |
| E4：第三方混入 | fixture 含非请求人字段 | 脱敏或拒绝 | 违规字段不出包 |
| E5：重放 | 一次性 grant 第二次访问 | 拒绝并记录 | 不返回包内容 |
| E6：过期 | 访问超过 expiry | 拒绝并记录 | 不恢复、不延长 |
| E7：账户撤销 | binding/membership 在请求后撤销 | 立即使请求失效 | 任何后续动作均 fail-closed |
| E8：审计异常 | 关联 ID 或 policy 版本缺失 | 阻止流程并告警给内部治理 | 不产生无法追溯的成功状态 |

## 7. 当前 Gate 结论

Phase 10I 仅完成安全评审包设计。它没有运行时变更，也没有真实数据处理授权。要进入任何真实导出实现，必须另行获得明确授权，并提交至少包括逐字段 inventory、DPIA 签核、儿童/第三方审查结论、密钥管理方案、安全测试、事件演练和独立生产 Gate 的证据。

## References

[1]: https://pages.nist.gov/800-63-4/sp800-63a/privacy/ "NIST SP 800-63A Privacy Considerations"
[2]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-data-portability/ "ICO: Right to data portability"
[3]: https://csf.tools/reference/nist-cybersecurity-framework/v2-0/pr/pr-ds/pr-ds-02/ "NIST CSF 2.0 PR.DS-02"
[4]: https://gdpr-info.eu/art-7-gdpr/ "GDPR Article 7: Conditions for consent"
