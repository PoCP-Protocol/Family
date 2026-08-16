# Family Phase 10H：真实家庭数据导出未来安全架构与威胁模型

**状态：** 设计授权，非运行时授权。  
**范围：** 为未来可能的家庭私有数据导出预先定义安全架构、控制平面和 Human Gate。本文不新增数据库迁移、DTO、API、Named Action、文件服务、加密服务、下载链接、外部调用或任何真实数据处理路径。

## 1. 设计结论与边界

真实数据导出必须被视为一次**高风险、一次性、家庭私有的数据披露流程**，而非普通功能下载。它的目标是让被授权的家庭监护人，在明确目的和最小字段范围内获取自己的资料；它绝不能成为跨家庭、机构、供应商、模型训练、商业画像或儿童成长评价的数据通道。

数据最小化应优先于“尽可能多导出”。NIST 的隐私指南指出，最小化可以降低个人信息遭未授权访问或使用的暴露面，并有助于建立信任。[1] Family 因此采用“policy 白名单 + 每次请求范围 + 不包含派生结论”的三重限制。数据可移植性在适用法律和具体情形下可涉及结构化、常用、机器可读的格式，但传输仍应安全并考虑第三方权利。[2] 本文是安全架构设计，不构成任何司法辖区的合规结论或法律意见。

> **核心不变量：** 家庭是数据所有权根；孩子不是交易对象；主观帮助感、服务过程和任何未来模型输出都不能在没有独立授权的情况下被包装成成长结果、永久标签或公开画像。

## 2. 未来控制平面

| Gate | 未来必须具备的条件 | fail-closed 条件 | 当前状态 |
|---|---|---|---|
| G0：能力授权 | 总架构师单独授权真实导出开发、数据保护影响评审及明确使用场景 | 未授权、仅 Phase 10G/10H 状态、或请求指向试点/生产即拒绝 | HOLD |
| G1：可信身份 | ACTIVE account binding、ACTIVE membership、trusted family scope 与 guardian/owner guardian 资格 | 登录会话失效、撤销 binding、角色不足、family 不匹配 | HOLD |
| G2：独立导出 Consent | 清晰、单独、可理解的导出 Consent；说明目的、字段类别、交付方式、风险和撤回路径 | 使用一般 SERVICE consent、捆绑条款、儿童单独同意、撤回后继续处理 | HOLD |
| G3：二次确认 | 在可见字段清单和风险提示后，由符合条件的监护人确认；高风险类别需不同 guardian 复核 | 确认过期、scope 改变、同一人绕过双人规则、未完成 risk acknowledgement | HOLD |
| G4：字段最小化 | 只从版本化白名单选择所需字段；禁止自由 SQL、原始日志、模型输入输出和第三方资料 | 未知字段、派生/推断字段、第三方数据、成长结果/标签 | HOLD |
| G5：脱敏与第三方保护 | 默认脱敏或排除非请求人的身份数据、儿童高敏感字段、审核人及安全控制信息 | 无法可靠区分第三方、儿童利益冲突、数据混合范围不清 | HOLD |
| G6：受控构造 | 在短时、隔离、不可重放的可信环境构造；无长久明文副本 | 共享存储、可预测路径、后台重试扩大范围、未加密缓存 | HOLD |
| G7：加密交付 | 采用经评审的密钥管理、传输加密、接收方验证与一次性/短期访问机制 | 无法确认接收方、密钥/算法未经审查、访问链接不可撤销或不可过期 | HOLD |
| G8：撤销与过期 | 导出前可撤回；撤销/过期后不可再访问；保留必要不可篡改审计 | 已交付副本不可撤回时仍承诺“删除对方副本”、过期后仍可读取 | HOLD |
| G9：审计与救济 | 记录请求、consent、scope、审批、构造、访问、过期、撤销与异常；提供安全申诉路径 | 审计缺失、不可关联 family scope、向请求者泄露安全检测细节 | HOLD |

## 3. 未来对象与状态机

未来实现不得复用或把 Phase 10E `DELETE_REQUEST`、Phase 10F synthetic approval 直接升级为真实导出授权。应新增独立对象，且每个对象都需独立审计和保留策略。

| 对象 | 关键字段（未来） | 不得包含 |
|---|---|---|
| `RealExportConsent` | family、purpose、categories、delivery channel class、policy version、granted/withdrawn 事实 | 模糊“全部同意”、儿童成长评价授权、模型训练默认授权 |
| `ExportConfirmation` | request、displayed whitelist version、risk acknowledgement、confirmed by、expires at | 隐式确认、永久确认、跨请求复用 |
| `ExportApproval` | request、distinct reviewer、risk tier、decision、reason code | 外部顾问自动决定、无审计的管理员绕过 |
| `ExportManifest` | package schema、allowlisted categories、redaction profile、integrity digest、expiry | family/person 标识、内容值、可预测路径 |
| `ExportDeliveryGrant` | verified recipient class、encrypted channel profile、one-time use、expiry、revocation | 通用公开 URL、永久 token、任意第三方邮箱 |
| `ExportSecurityAudit` | 发生时间、动作、family scope、actor class、结果、相关 Gate 版本 | 原文家庭内容、密钥、密码、下载文件 |

建议的未来状态机是：`DRAFT → CONSENT_PENDING → CONFIRMATION_PENDING → HUMAN_REVIEW_PENDING → APPROVED_TO_BUILD → BUILDING → READY_FOR_ONE_TIME_DELIVERY → DELIVERED_OR_EXPIRED → REVOKED`。其中任何 consent 撤回、scope 变化、身份撤销、审批拒绝、风险检查失败均回到 `REVOKED` 或 `REJECTED`；不得自动恢复。

## 4. 关键威胁模型

| 威胁 | 攻击/失误路径 | 未来缓解控制 | 不能承诺的事项 |
|---|---|---|---|
| 账户接管后下载 | 恶意会话冒用 guardian | step-up authentication、短时二次确认、异常检测、one-time delivery grant | 不能仅因历史登录就保证真实持有人身份 |
| 跨家庭越权 | 伪造 family/request 参数、管理员查询过宽 | 仅服务端 trusted scope、family scope 二次校验、数据库约束、审计 | 不允许 client supplied family scope 成为权限依据 |
| 过度导出 | “全部数据”或自由字段选择 | 版本化白名单、最小化、字段逐项风险分类、默认排除 | 不应把便利性作为扩大范围理由 |
| 儿童/第三方权利受损 | 联合家庭、关系人、教师或服务提供者信息混入 | third-party screening、分层脱敏、共同监护/利益冲突 Human Gate | 不可用自动规则代替复杂家庭权利判断 |
| 导出文件泄露 | 长期 URL、未加密邮件、共享目录、缓存 | 加密交付、短期一次性访问、接收方验证、最小生命周期 | 不能撤回用户已下载并自行复制的内容 |
| 重放与范围漂移 | 旧确认用于新字段或新版本 policy | confirmation 与 whitelist/policy digest 强绑定，scope 变化即失效 | 不得复用过期确认 |
| 审计失真 | 无法证明谁批准、谁访问 | append-only audit、correlation ID、状态转换事件、定期审阅 | 审计不应储存家庭正文或密钥 |
| 模型/商业化滥用 | 把导出作为训练、推荐、画像或供应商数据源 | 目的限制、永不默认同意、单独且更严格的 Gate | 不得把导出 Consent 推定为训练或商业授权 |

## 5. 加密与交付设计原则

未来的加密方案必须在独立安全评审、密钥管理决策、威胁建模和测试后再实现；当前不选定算法、不写密钥代码、不生成密钥、不接入 KMS。设计层面要求：敏感数据在传输中加密；交付用的访问授予有短时有效期、一次性使用和撤销能力；任何加密密钥、密码、恢复材料和文件内容都不得进入普通应用日志、审计 payload 或客服工单。NIST 的框架将敏感数据保护与传输中加密列为数据安全的重要实践。[3]

若未来导出直接交付给另一控制者或服务提供方，需要把接收方验证、传输的技术可行性、第三方权利影响及数据最小化置于同一 Human Gate。ICO 对数据可移植性的说明强调安全传输、结构化机器可读格式，并要求考虑第三方权利；这为 Family 的“先最小化、再决定是否交付”顺序提供方法参考。[2]

## 6. Consent 与撤回原则

独立导出 Consent 必须与一般家庭服务 Consent 分离，使用清晰、易理解的目的说明；撤回路径应至少不比授予路径更困难。GDPR 第 7 条将可证明的 consent、清晰区分的表达、随时撤回和不将不必要处理作为服务条件列为基本条件。[4] Family 将这些视为安全设计启发：必须保留 consent 的版本化事实与撤回事实；撤回影响后续构造和未访问交付授予，但不虚假承诺能够收回已经由家庭保存的副本。

## 7. 未来验证与 Human Gate 清单

未来若申请真实导出实现授权，至少必须另行通过以下证据：数据保护/法律评估、逐字段 data inventory、儿童与第三方利益影响审查、密钥和交付方案安全评审、威胁建模复核、独立渗透/代码测试、完整审计演练、撤销和过期演练、事件响应与家庭救济流程、合成端到端验证、明确的试点范围及最终生产 Gate。任何一项缺失都应 fail-closed。

## 8. 当前持续禁止项

本 Phase 10H 不产生真实导出实现。真实数据查询、文件写入、下载、附件、传输、加密/密钥管理运行时、删除/保留清理、外部服务、组织访问、支付、训练、模型调用、试点、生产与 master 合入均继续 HOLD。

## References

[1]: https://pages.nist.gov/800-63-4/sp800-63a/privacy/ "NIST SP 800-63A Privacy Considerations"
[2]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-data-portability/ "ICO: Right to data portability"
[3]: https://csf.tools/reference/nist-cybersecurity-framework/v2-0/pr/pr-ds/pr-ds-02/ "NIST CSF 2.0 PR.DS-02 reference"
[4]: https://gdpr-info.eu/art-7-gdpr/ "GDPR Article 7: Conditions for consent"
