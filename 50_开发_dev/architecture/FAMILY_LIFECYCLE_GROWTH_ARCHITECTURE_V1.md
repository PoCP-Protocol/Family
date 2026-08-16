# Family 完整成长生命周期架构 V1

```text
DOC_KIND            = LIFECYCLE_ARCHITECTURE_MEMO（非 SSOT、非 runtime 授权）
STATUS              = DRAFT_FOR_ARCHITECT_REVIEW
PLATFORM_SCOPE      = Child & Family Growth · 跨越孩子完整成长生命周期
ENTRY_NARROW        = 12–15 岁亲子沟通冲突，仅作为首条可验证纵切
INVARIANT           = 入口场景不得被误写为平台年龄上限、唯一用户旅程或唯一资源结构。
```

## 1. 定义

Family 面向孩子从孕育/迎接新生命、婴幼儿、学龄前、学龄、青春期、青年早期直至独立成人前后的完整成长历程，也面向父母、共同照护者和家庭关系在相应阶段的持续成长。生命周期不是一组彼此割裂的产品，也不是按年龄推送课程的营销分层；它是 Family 用来理解“此刻谁在成长、需要什么能力、哪些资源合适、如何尊重家庭节奏”的上下文。

当前首条纵切仍选择 12–15 岁亲子沟通冲突，是因为它可以在受限风险、明确场景和已有榜样教育资产内验证主链；它**不代表** Family 只服务青春期，亦不代表所有家庭必须通过沟通冲突进入平台。

## 2. 生命周期上下文模型

| 生命周期区间 | 家庭可能关心的成长主题举例 | Family 应组织的资源类型 | 必须避免的误区 |
|---|---|---|---|
| 孕育/迎接新生命 | 角色转变、家庭准备、照护支持、关系协商 | 内容、同伴支持、合格外部转介、家庭计划 | 医疗诊断、替代临床建议、把准备程度评分化 |
| 婴幼儿 | 依恋、照护协作、睡眠/节律困扰、亲子回应 | 低风险内容、练习、真人支持、合格转介 | 将正常发展差异病理化或给儿童贴标签 |
| 学龄前 | 游戏、边界、情绪表达、家庭规则 | 内容、游戏化练习、家长支持、服务跟进 | 用“乖/不乖”或排名代替理解家庭需要 |
| 学龄 | 学习习惯、同伴关系、家校协同、独立性 | Practice、Program、教练/专家资源、服务路径 | 将学业表现直接等同于成长价值 |
| 青春期 | 自主、沟通、关系、身份、数字生活、未来选择 | AI Coach、Practice、Program、Human/External Resource | 以家长单方叙述替代孩子视角或强制画像 |
| 青年早期/独立过渡 | 生涯、家庭边界、责任、持续关系 | Program、顾问、Peer/Community、外部资源 | 持续以儿童治理模式控制已具自主能力的人 |

这张表是“能力/资源适配的起点”，不是平台的测评量表、儿童标签体系或自动路由规则。

## 3. 代码与数据不变量

1. **`GrowthIntent` 以 family-confirmed need 为中心，不能把年龄段写成意图类型。**一个孩子/家庭在不同阶段可表达不同需要，生命周期只是上下文。
2. **`GrowthCapability` 独立于生命周期和资源。**同一能力可由不同年龄适配的 Content、Practice、AI Coach、Program、Human Coach、Qualified Expert 或 External Referral 提供。
3. **`ResourceOffer` 使用可扩展的 `age_scope` / `life_stage_scope` / `problem_scope` / `risk_boundary` / `requires_consent` 等资格元数据。**初始资源可以只覆盖 12–15 岁，但表结构和 DTO 不把该值设为平台默认。
4. **Eligibility Gate 在 T1/T2 基于当前家庭上下文检验适龄、风险、同意、资格、可用性与专业范围。**不因孩子年龄自动拒绝或默认推荐；无法确定时 fail closed，提供 `NO_ACTION` 或受控转介。
5. **App 入口是“现在有什么需要 Family 帮忙”，而不是“选择一个年龄产品”。**家庭页可维护当前成长阶段；首页、成长、服务和家庭四个入口跨阶段保持稳定。
6. **从儿童走向青年早期时，访问、同意、家庭角色和数据权利必须随着法律与实际自主性重新核验。**不得把儿童时期的数据控制逻辑无限延长。

## 4. 首条纵切的明确适配

`PARENT_CHILD_COMMUNICATION_CONFLICT` 和 `DE_ESCALATION / COMMUNICATION_REOPENING` 仍可在首条纵切中以“早期青春期”范围运行；但是：

```text
首条资源适龄范围 = 当前资源资格的配置
≠ Family 平台默认适龄范围
≠ 数据库/DTO 的固定枚举
≠ App 的唯一入口
```

首条迁移应支持 8 型资源网络、独立 Capability 表及其多对多映射、可表达多阶段/年龄范围的资源资格字段。当前 seeded offers 可以声明自身只适合 12–15 岁；未来资源按独立准入加入，不需改写核心编排链。

## 5. 阶段扩展顺序

每新增一个生命周期场景，都遵循同一受控步骤：`家庭与孩子的真实需要 → capability 定义 → 已有榜样教育或合格新资源 → 资格/安全/证据/同意准入 → 小范围服务路径 → 家庭帮助感回访 → 只读上下文复用`。平台不以“覆盖多少年龄段”计成就，而以不同阶段的家庭是否获得适合、尊重且安全的帮助衡量。

## 参考

[1]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§0–4、§8
[2]: `architecture/FAMILY_GROWTH_VERTICAL_SLICE_001_IMPLEMENTATION_PLAN.md`
[3]: `architecture/BANGYANG_EDUCATION_ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_V1.md`
