# M2 测试数据与六循环集成 PDCA 001

## 1. 本轮字段

| 字段 | 值 |
|---|---|
| `PHASE` | `M2_TEST_DATA_SIX_LOOP_INTEGRATION` |
| `SCOPE` | `Dev 测试数据库 + PostgreSQL 集成测试 + 6 循环边界 + 34 UI / UI-35 回归` |
| `DATABASE` | `family_test`（仅测试库） |
| `PPT_BASELINE_USED` | `PPT-01 榜样教育新商业模式对外宣发PPT_原图版(2)`、`PPT-02 榜样教育战略白皮书_30页演讲汇报版`、`PPT-03 家庭教育大模型平台科技公司项目合作方案` |
| `LOOP_SOURCE` | `governance/BANGYANG_GROWTH_OPTIMIZATION_CLOSED_LOOP_TRANSCRIPTION_001.md` |
| `UI_SOURCE` | `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md` |
| `BUSINESS_CODE_SCOPE` | `家庭、成长任务、服务预约、服务记录测试数据与集成验证` |
| `PRODUCTION_DATA_TOUCHED` | `NO` |
| `EXTERNAL_EFFECT` | `NO` |

## 2. 研究与设计结论

本轮将 3 份 PPT 作为产品叙事、页面编排和业务场景证据，而不是生产事实或效果证明。PPT-01 的界面和经营场景用于校验家庭入口、商城、会员与服务页面的结构；PPT-02 用于校验六个增长节点的顺序；PPT-03 用于校验 AI-native 平台、家庭成长数据沉淀和可演进架构的方向。三者都不授权真实支付、真实预约、真实社区外发、儿童诊断、跨家庭排名或真实模型调用。

34 个 UI 继续按核心成长、商城、名师服务、社区和客户后台的页面边界复用同一 `Family → Person → Journey → Profile/Priority → InterventionEpisode → GrowthAction` 数据血缘。新增测试家庭使用固定 synthetic ID，成长资料明确带有 perspective/evidence boundary，任务只写 action/check-in，服务记录只写过程状态，未将任何反思、预约或服务记录提升为 outcome。

## 3. 六循环可执行覆盖

| 循环 | UI 范围 | 本轮验证方式 | 当前边界 |
|---|---|---|---|
| 家庭体检获客 | UI-01/UI-02 | 六循环契约测试与既有 Web 路由回归 | 不写评分或诊断 |
| AI诊断分析 | UI-03/UI-04 | synthetic explanation 边界测试 | Model Gateway no-op/rule projection，不产生诊断或 outcome |
| 每日任务执行 | UI-05/UI-09 | 固定家庭成长链、今日任务和既有 check-in 集成测试 | `CompleteGrowthAction` 只记录 action/check-in |
| 孩子端参与 | UI-07/UI-10 | 受控家庭共享入口与边界测试 | 不将孩子互动直接写成成长结论 |
| 榜单激励留存 | UI-11/UI-12/UI-29 | 私有过程回顾和禁止项测试 | 禁止家庭排名、总分和儿童诊断 |
| 报告分享裂变 | UI-25/UI-26/UI-28 | 家庭分享草稿到表达小记血缘回归 | 仅家庭私有草稿，不公开发布、评论、点赞或外发 |

本轮代码中的 `FAMILY_PLATFORM_SIX_LOOP_SCENARIOS` 固化以上六个循环，测试逐项校验 UI 范围、Named Action、Model Gateway 和 external effect 边界，防止测试数据反向发明新的业务循环。

## 4. 测试数据对象与关系

| 数据层 | 已写入对象 | 关系与用途 |
|---|---|---|
| Family Core | Tenant、Family、Guardian、Child、Membership、Parent-Child Relationship | 家庭范围和角色权限验证 |
| Growth OS | Journey、Profile、Priority、Intervention Episode、Growth Action | UI-01/UI-05/UI-09 的成长任务血缘 |
| Service | Provider、Offering、Availability Slot、Booking Request、Booking Service Record | UI-19/UI-21/UI-24/UI-34 的服务过程回看 |
| Governance | Perspective boundary、evidence boundary、TEST fixture、external_effect=false | 防止事实、观点、建议、行动和外部效果混淆 |

测试家庭固定为 `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`，测试租户固定为 `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`。seed 可重复执行，重复执行只重建该固定测试家庭，不删除其他家庭数据。

## 5. IT 与 AI-native 验证

IT 结构上，本轮验证了 PostgreSQL family scope、租户隔离、外键血缘、只读服务投影、测试数据库专用连接和可重复 seed。服务预约和服务记录明确使用 `TEST_NOOP_ADAPTER`、`external_effect=false`，不会发送通知、创建真实预约或调用外部系统。

AI 结构上，本轮验证了事实、观点、推荐和行动分层：成长资料的 `truth_class` 仍是 `PERSPECTIVE`，证据边界明确为 `NOT_OUTCOME`，成长任务边界为 `ACTION_IS_NOT_OUTCOME`，反思边界为 `REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME`。AI 相关循环仅允许 no-op/rule projection；本轮没有裸模型调用，也没有让模型自由文本写入核心 Ontology。

## 6. 本轮验收标准

本轮必须同时满足：固定测试家庭可重复 seed；成员、成长旅程、成长任务、服务预约和服务记录同属一个 family scope；服务投影可读取；`external_effect=false`；六循环测试通过；Web/API 全量回归通过；旧 UI-06 草稿、PPT 资产、截图和 coverage 目录不进入提交。

## 7. 证据与待补项

当前已完成固定测试家庭和服务过程数据的写入，六循环边界测试通过。下一步继续执行 Web/API 全量回归与关键页面联调。真实 AI 模型调用、真实支付/退款、真实预约、社区公开发布、跨家庭比较和生产数据仍不属于本轮范围。

### References

[1]: ../../governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md "34 UI 与 3 份 PPT 总控交付计划"
[2]: ../../governance/BANGYANG_GROWTH_OPTIMIZATION_CLOSED_LOOP_TRANSCRIPTION_001.md "增长优化六循环转录"
[3]: ../../governance/FAMILY_34_UI_EVIDENCE_FIRST_DATA_STRUCTURE_REVISION_BLUEPRINT_V1.md "34 UI 证据优先数据结构蓝图"

## 8. 本轮运行证据

PostgreSQL 集成回归已通过 20 个测试文件、93 个测试；Web 全量回归已通过 14 个测试文件、110 个测试。UI-34 浏览器视觉复核使用 `http://localhost:5173/?product=test-loop&page=service-records`，运行截图保存为 `/home/ubuntu/screenshots/localhost_2026-08-19_03-59-24_4225.webp`。原始咨询、活动、客服支持和联系客服按钮保持完整，测试数据不会替换静态基线。

## 9. 最终验证结果

本轮发现并修复了两类真实缺口。第一类是测试 fixture 与 PostgreSQL 真实约束之间的差异，包括 UUID/text 参数推断、`growth_profiles.effective_from` 必填字段和 `intervention_code=LISTEN_BEFORE_RESPOND` 约束；第二类是 API 中 UI 事件文案映射的 TypeScript 类型收窄问题。修复后 contracts 构建和 API `tsc --noEmit` 均通过。

最终测试结果为：家庭平台 fixture 集成测试 3/3 通过；六循环边界测试 3/3 通过；PostgreSQL API 全量集成测试 20 个文件、93 个测试通过；Web 全量测试 14 个文件、110 个测试通过。Web 测试中的 jsdom navigation warning 为既有 WAF 测试环境提示，不影响测试通过结果。
