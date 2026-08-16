# FAMILY_PHASE10J_SYNTHETIC_EXPORT_SECURITY_EXERCISE_001 任务契约

**状态：** 内部确定性开发与验证授权。  
**目标：** 为 Phase 10G 的固定内存 synthetic export format 增加安全演练 Gate evaluator 与审计断言，验证其在错误输入下 fail-closed。

## 1. 固定边界

演练只接受代码内固定 synthetic request descriptor；不得接收 HTTP/API 输入、数据库记录、真实家庭标识、真实字段值、文件路径、接收方、密钥、下载 URL 或网络地址。输出是内存中的 `PASS`/`BLOCKED` 结果与非敏感 reason code，供单元测试断言；不得写 audit 表、outbox、文件、日志或外部系统。

## 2. Gate 检查表

| Gate | 正常条件 | 阻断输入 | 预期证据 |
|---|---|---|---|
| S0 fixture | `synthetic=true`、固定 schema | 非 synthetic 或未知 schema | `SYNTHETIC_FIXTURE_REQUIRED` |
| S1 policy/范围 | approved + 当前 policy + 匹配 whitelist digest | policy/version/scope 漂移 | `POLICY_OR_SCOPE_MISMATCH` |
| S2 consent | synthetic export consent 仍有效 | 撤回、过期、缺失 | `EXPORT_CONSENT_NOT_ACTIVE` |
| S3 third-party | 无第三方/儿童高风险字段 | third-party 或 child-sensitive 标记 | `THIRD_PARTY_OR_CHILD_RISK_REVIEW_REQUIRED` |
| S4 identity | binding/membership 仍 active | 撤销或不可信 actor | `TRUSTED_FAMILY_CONTEXT_REQUIRED` |
| S5 delivery grant | 未使用、未过期、接收方验证通过 | 重放、过期、接收方未知 | `DELIVERY_GRANT_INVALID` |
| S6 audit linkage | correlation、policy、whitelist、consent 证据完整 | 缺失任一必要证据 | `AUDIT_EVIDENCE_INCOMPLETE` |

## 3. 演练场景

必须在单元测试中覆盖：范围漂移、撤回竞态、第三方/儿童混入、重放、过期、身份撤销、审计异常，以及全 Green 的 synthetic-only 正常路径。演练正向通过不产生真实导出授权；它只证明 synthetic descriptor 满足当前 Gate 逻辑。

## 4. 禁止项

真实家庭数据、数据库查询、HTTP、文件系统、加密/密钥、下载、网络、真实审计写入、导出包持久化、删除/保留清理、试点、生产和 master 合入仍禁止。
