# UI-33 家庭档案 PDCA 001

## 用户问题与本轮目标

UI-33 的原始页面将孩子资料、家庭类型、当前关注问题、AI 诊断报告、90 天成长方案、成长记录、测评历史和时间轴放在同一屏。家长需要一个稳定的家庭资料入口，能够确认页面正在回看的是什么、哪些内容只是当前家庭的关注方向，以及如何回到成长计划；孩子不应被页面上的标签、历史次数或资料字段定义，更不能被生成儿童诊断结论。本轮将 UI-33 收敛为**家庭范围只读档案回看**，复用已有 Platform Surfaces UI-33 卡片和 Core Growth UI-07 关注方向投影，不新增儿童资料、身份关系、Consent 或成长结论写入。

| 用户 | 需要的体验 | 本轮设计 |
|---|---|---|
| 家长 | 看懂家庭档案中的事实与当前工作方向 | 成员资料回看、关注方向回看、成长计划入口。 |
| 孩子 | 不被诊断、排名或总分定义 | 不展示结论性诊断、不把标签写成能力事实。 |
| 家庭 | 可以回到正在进行的计划 | 只提供家庭内路由，不提供编辑、导出或外部分享。 |
| 平台 | 保持 Family/Person/GrowthProfile 关系可追溯 | 复用家庭范围 projection，AI 不直写核心本体。 |

## 数据与安全边界

候选对象包括 `FamilyProjection`、`PersonProjection`、`RoleMembershipProjection`、`GrowthProfileProjection`、`ConsentGrant`、`AccessPolicy` 和 `AuditEvent`。本轮只读现有 projection；资料纠错、成员关系变更、Consent 撤回、导出和删除均不在 UI-33 产生写入。儿童姓名、年龄等字段若无明确家庭范围来源则不显示；当前 Core Growth 关注方向只作为家庭工作视角，不是儿童诊断或效果事实。

`Fact` 仅指来源明确的家庭成员资料或已存在的记录；`Perspective` 表示家庭当前关注方向；`Recommendation` 只能作为可选择的成长计划入口；`Action` 不由 UI-33 创建。AI 如参与解释，只能经过 Model Gateway 形成草稿或说明，不得直接修改 Family、Person、GrowthProfile、Consent 或 AccessPolicy ontology。

## 视觉基线

UI-33 对标 `apps/web/public/bangyang-reference/family-profile-reference-542x1002.png`，尺寸为 542×1002 纵向移动页面。原始页面包括顶部家庭档案标题、孩子头像与资料、家庭类型、三个关注问题标签、AI 诊断报告/90 天成长方案/成长记录/测评历史入口、成长档案时间轴和“查看完整档案”按钮。原始静态基线完整保留；只读家庭档案卡在页面底部追加，不覆盖原始成员资料、标签、时间轴或 CTA。

| 可回看 | 本轮禁止 |
|---|---|
| 家庭档案范围、关注方向、计划与过程记录入口 | 儿童诊断、能力结论、风险结论、排名、总分 |
| 当前 Core Growth 关注方向与其事实边界 | AI 自由文本写入儿童资料或成长档案 |
| 回到 90 天成长计划、我的服务 | 编辑成员、修改监护关系、导出、删除、外部分享 |

## 数据血缘与状态

```text
Family
  ├─ PersonProjection[] (FAMILY_SCOPED, READ_ONLY)
  ├─ RoleMembershipProjection[] (FAMILY_SCOPED, READ_ONLY)
  └─ GrowthProfileProjection (PERSPECTIVE, READ_ONLY)

UI-33 FamilyProfileView
  ├─ IDLE → LOADING → READY | EMPTY | ERROR
  ├─ next_route = core-plan | my-services
  └─ external_effect = false
```

当 Platform Surfaces 投影可用时，UI-33 追加家庭档案说明；当 Core Growth UI-07 投影可用时，追加当前关注方向及“这是当前家庭工作视角”的自然说明。任何加载失败都保留原始页面并提供自然回退，不伪造资料成功状态。

## 验收标准

1. UI-33 在受控读取成功时展示家庭范围档案说明和关注方向；没有投影时保持原始静态页面。
2. 页面不出现工程术语，不把儿童资料、Perspective 或 Hypothesis 写成诊断、效果、排名或总分。
3. 所有请求为家庭范围 GET；不修改 persons、relationships、growth_profiles、consents 或审计状态。
4. 自动化测试覆盖 Platform/Core 投影成功、空态/错误态、无敏感结论文案、UI-33→UI-05/UI-31 路由和零写入。
5. 移动端复核确认原始档案视觉完整保留，动态回看卡只位于基线之后。

## References

[1] [UI-33 Phase C Pre-API Gate 001](UI-33_PHASE_C_PRE_API_GATE_001.md)

[2] [UI-31 我的服务 PDCA 001](UI-31_MY_SERVICES_PDCA_001.md)

[3] [UI-29 成长回顾 PDCA 001](UI-29_GROWTH_REVIEW_PDCA_001.md)

## 浏览器视觉复核与测试结果

本轮在本地 `family-profile` 路由完成移动端浏览器复核，运行截图路径为 `/home/ubuntu/screenshots/localhost_2026-08-19_03-41-15_8610.webp`。原始家庭档案中的孩子资料、家庭类型、关注问题、报告/计划/记录/历史入口、成长档案时间轴与“查看完整档案”按钮均保持完整；家庭档案动态回看只在受控投影成功后追加，不覆盖原始布局。

| 验证层级 | 结果 |
|---|---|
| UI-33 定向页面对象测试 | `src/test-loop.page-objects.spec.ts` 28/28 通过。 |
| Web 全量回归 | 14 个测试文件、109 个测试通过；既有 jsdom navigation stderr 未导致失败。 |
| 浏览器视觉复核 | 原始基线完整保留，动态回看区域未替换敏感资料视觉。 |

本轮结论为：**UI-33 家庭档案只读回看通过**。页面不创建儿童资料、诊断、Consent、导出、删除或身份关系变更；关注方向只作为家庭工作视角，后续入口仅回到成长计划或我的服务。
