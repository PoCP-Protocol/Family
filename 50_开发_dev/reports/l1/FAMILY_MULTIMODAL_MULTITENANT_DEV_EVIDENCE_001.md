# Family / 伐木累多模态与多租户 DEV 证据包 001

## 状态

当前状态为 `DEV_STRUCTURED_AND_FOCUSED_VALIDATED`。多模态主数据、事实对象、租户/家庭双范围、Consent、处理生命周期、私有派生草稿和最小审计已建立并通过焦点验证；尚未宣称 34 页多模态 UI 全部接入、真实 LLM live-call 完成或生产/真实家庭就绪。

## 已实现文件

| 文件 | 内容 |
|---|---|
| `database/migrations/0025_tenant_master_data_foundation.sql` | Tenant、租户账号成员、Tenant↔Family、租户策略、目录绑定 |
| `database/migrations/0026_multimodal_control_and_facts.sql` | 3 个多模态控制主数据和 5 个多模态事实/审计表 |
| `apps/api/src/modules/orchestration/multimodal/multimodal.contract.ts` | 模态、用途、页面、状态上限、禁止写回和响应契约 |
| `apps/api/src/modules/orchestration/multimodal/multimodal.service.ts` | Context 不可用、页面不允许、运行失败时安全停止；成功只返回私有派生草稿 |
| `apps/api/src/modules/orchestration/multimodal/multimodal.service.spec.ts` | 4 个服务单测 |
| `apps/api/src/modules/orchestration/multimodal/multimodal.integration.spec.ts` | 3 个 PostgreSQL 集成用例 |
| `apps/api/src/test/test-database.ts` | Tenant、控制主数据和多模态事实清理顺序 |

## 验证结果

| 命令/范围 | 结果 |
|---|---|
| 多模态服务单测 | 1 file / 4 tests passed |
| 多模态 + Tenant PostgreSQL 集成 | 1 file / 3 tests passed |
| 原 L0/L1 + Test Experience + 多模态焦点回归 | 3 files / 13 tests passed |
| API typecheck | passed |
| Web 全套回归 | 10 files / 63 tests passed |
| Web typecheck | passed |
| Web build | passed |

## 关键负例

已验证第二个 ACTIVE Tenant 绑定同一 Family 被 PostgreSQL 唯一约束拒绝；撤回 Consent 保留最小事实并作为停止条件；多模态输出超过 `DERIVED_DRAFT_PRIVATE`、声明外部副作用或指向 Diagnosis/Need/Intent 等核心事实时被服务端校验拒绝；Context 不可用和模型/页面配置不满足时不运行 runtime。

## 密钥与审计边界

真实 LLM API key 只允许在测试时由本地环境变量、未提交 `.env.local` 或受控 secret 注入。代码、文档、fixture、日志、回放、数据库审计和测试快照不保存或回显真实 key。多模态数据库只保存引用、hash、策略版本、schema 版本、决策和阻断摘要，不保存原始媒体、provider 原文、真实 prompt 或认证 header。

## 尚未完成

多模态尚未在 34 页用户可见 UI 中开放家庭材料上传；`MultimodalService` 还需要绑定正式的 TenantPolicy/Consent 查询适配器和既有 Family LLM Gateway 的真实多模态 Context 入口。视频理解、儿童行为/情绪推断、生物特征、危机自动处置、跨家庭多模态推荐和生产外部副作用继续 HOLD。

## Oracle EBS 风格物理模型增量

本轮新增研究包与实施文件：

- `governance/FAMILY_ORACLE_EBS_DATA_MODEL_RESEARCH_PACK_001.md`
- `governance/FAMILY_ORACLE_EBS_PHYSICAL_MODEL_GAP_REVIEW_V1.md`
- `governance/FAMILY_ORACLE_EBS_PHYSICAL_DATA_MODEL_STANDARD_V1.md`
- `governance/FAMILY_ORACLE_EBS_OBJECT_REFACTOR_PLAN_V1.md`
- `database/migrations/0027_oracle_style_reference_and_object_metadata.sql`
- `database/migrations/0028_family_core_object_registry_seed.sql`
- `database/migrations/0029_oracle_style_read_views.sql`

0027 在隔离 `family_test` 成功创建 3 个 reference code set、11 个初始 code value、3 个 reference validation/object metadata 结构；重复迁移可重跑，重复业务键、非法对象层级、无效生效期负例均被 PostgreSQL 拒绝。

0028 注册 10 个核心对象：5 个 BASE、1 个 INTERFACE、3 个 PROJECTION、1 个 AUDIT；每个对象记录 scope、业务键、生命周期和审计定义。

0029 创建只读视图 `family_active_reference_values_v` 和 `family_data_object_catalog_v`。前者返回 3 个 active code set、22 个 active values；后者按 BASE/TENANT、BASE/TENANT_FAMILY、INTERFACE/TENANT_FAMILY、PROJECTION/TENANT_FAMILY、AUDIT/TENANT_FAMILY 输出当前对象目录。

最新回归保持全绿：后端 3 files / 13 integration tests passed，API typecheck passed；Web 10 files / 63 tests passed，Web typecheck and build passed。jsdom navigation warning 为既有测试环境 warning，不是失败。

## 当前边界

本轮只实施参考值集、对象注册元数据、种子和只读视图，没有对 68 张历史表做破坏性批量加列或重命名。Tenant/Family 全库双范围回填、统一 WHO 审计列和正式目录基表重构仍是下一批 P0/P1 工作；在这些完成前，不能宣称生产多租户商业化就绪。
