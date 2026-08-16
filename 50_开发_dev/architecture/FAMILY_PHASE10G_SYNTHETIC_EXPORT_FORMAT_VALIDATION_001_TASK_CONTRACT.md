# FAMILY_PHASE10G_SYNTHETIC_EXPORT_FORMAT_VALIDATION_001 任务契约

**状态：** 内部确定性开发与隔离验证授权。  
**目标：** 验证 Phase 10F 字段白名单可形成固定、可解析、可审计的**内存合成导出包结构**，仅用于 schema 与格式断言。

## 1. 输入与输出边界

输入只能是源码内固定的 synthetic fixture，不连接数据库、不接收 API body、不读取家庭对象、不接受真实字段值。fixture 的顶层必须标明 `synthetic=true`，包含固定虚构家庭引用和虚构服务过程元数据；不得使用可识别个人姓名、邮箱、电话、地址、孩子信息、自由文本、资源内容、成长记录或生产 ID。

输出只能是 TypeScript 内存对象（及测试断言中的 JSON 序列化）。不得写文件、返回 attachment、设置下载 header、持久化 blob、调用网络 API、传输到第三方或让浏览器下载。没有新增 Web 页面、下载端点或真实数据 API。

## 2. 审批门

验证函数必须显式接收 `APPROVED_FOR_SYNTHETIC_VALIDATION` 状态和固定 policy version；其他状态或 policy 版本不匹配时抛出 fail-closed 错误。此状态只允许 synthetic fixture 的 schema 验证；不构成真实家庭数据导出授权。

## 3. 包格式

| 区块 | 允许内容 | 禁止内容 |
|---|---|---|
| manifest | schema version、synthetic 标记、policy version、生成边界 | family UUID、account、actor、时间戳、下载 URL |
| consent_lifecycle | 白名单中的 `purpose`、`status`、`policy_version`、相对时序 token | consent UUID、人员 ID、姓名、真实时间 |
| service_process | 白名单中的 `need_type`、`decision_type`、`service_case_status`、相对时序 token | child/guardian ID、自由文本、主观反馈、成长结果 |
| lifecycle_request | `request_type`、`request_scope`、`status`、相对时序 token | reason、actor、审核人、真实请求 ID |
| governance | 分类与白名单版本/摘要 | 任何实际表内容、审计 payload、模型输出 |

## 4. 验收

单元/集成测试须验证：仅 approved synthetic 状态可构造；包没有 PII、UUID、真实时间、自由文本或未白名单字段；不存在文件系统、HTTP、数据库或网络调用；状态/policy 不匹配时 fail-closed；`JSON.stringify` 可解析；全量 API 回归与静态红线审计通过。
