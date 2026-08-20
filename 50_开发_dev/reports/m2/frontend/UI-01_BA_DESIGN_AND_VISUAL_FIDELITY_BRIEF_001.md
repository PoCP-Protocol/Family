# UI-01 BA Design and Visual Fidelity Brief 001

## 1. Design Gate Position

本文件基于 `UI-01_RESEARCH_NEEDS_ANALYSIS_001.md`，只完成 UI-01 的 BA Design 和视觉复刻简报，不创建 API Contract，不修改 `apps/api`、`apps/web` 或 `database`，也不授权代码开发。

当前门禁：

```text
Broad Research + Needs Analysis = IN_PROGRESS
BA Design = CONDITIONAL_PREPARATION_ONLY
API Contract = NO_GO
Code Implementation = NO_GO
```

视觉复刻不等于业务事实；BA 建议不等于决定；推荐不等于行动；首页静态文案不等于家庭成长效果、诊断、资质或服务可用性。

## 2. Page Goal and Role Design

### 2.1 Page goal

UI-01 的页面目标是为家庭提供一个**低负担、家庭私有、可理解的成长入口总览**：让家长/监护人知道当前家庭上下文、可以从哪里开始，并安全进入测评、解释、挑战、计划、案例、直播或服务供给等共享子系统。

页面不负责完成测评诊断、不负责确认 90 天计划、不负责创建任务、不负责推荐教师优劣、不负责预约、支付、通知或公开分享。

### 2.2 Role boundaries

| 角色 | 页面允许 | 页面不允许 |
|---|---|---|
| OWNER_GUARDIAN / GUARDIAN | 查看被授权家庭上下文、读取入口状态、发起后续受控意向。 | 不能以普通导航直接创建计划、任务、预约或外部 effect。 |
| CHILD_SUBJECT | 在明确适龄和授权后查看最小必要内容。 | 默认不能成为家庭决策 actor；不得暴露成人敏感信息。 |
| TEACHER / SERVICE_PROVIDER | 作为后续供给对象被受控投影。 | 不从首页直接联系、预约或评价。 |
| ADVISOR / OPERATOR | 通过独立服务系统提供支持。 | 不把运营备注直接写入家庭核心事实。 |
| AI / MODEL | 通过 Model Gateway 生成解释、摘要或入口草稿。 | 不得直接写 Family、Person、Need、Plan、Task、Outcome 或资质事实。 |

## 3. BA Object Model

UI-01 只编排共享子系统，不重复建设对象：

| 对象 | UI-01 关系 | 页面允许的语义 |
|---|---|---|
| Tenant | 服务端作用域 | 不由客户端提交或覆盖。 |
| Family | 首页私有上下文 | 只显示服务端授权家庭。 |
| Person / Relationship | 当前成员和孩子上下文 | 只读最小必要字段；不推断能力、情绪或风险。 |
| Membership / Principal | 当前操作者和角色 | 服务端派生 actor/role。 |
| Consent | purpose、状态、有效期和撤回 | 决定入口是否可用，不得静默降级。 |
| AssessmentSession | 测评入口的后续对象 | 首页只显示入口/资格/说明，不显示诊断结论。 |
| ReportSnapshot / ExplanationDraft | AI 诊断/报告的后续对象 | 首页最多显示受控入口或解释摘要。 |
| PlanDraft / Journey / Task | 90 天计划与今日任务的后续对象 | 首页最多显示只读入口状态，不自动创建或推进。 |
| Provider / Offering / Activity | 服务、直播和顾问供给 | 只显示受控目录入口，不代表适配、资质或可预约。 |
| Evidence / CaseAsset | 成长案例/成果入口 | 只读过程素材，不当作效果证明。 |
| FamilyHomeProjection | UI-01 的核心投影 | 必须包含 source、version、visibility、as_of、policy/consent 状态。 |

## 4. State Machine

UI-01 的首轮状态机只描述页面和投影状态，不创建下游运行时对象。

| State | 进入条件 | 可见内容 | 允许动作 | 禁止升级 |
|---|---|---|---|---|
| `STATIC_BASELINE` | 无动态接线 | 完整原图画面 | 视觉浏览、安全返回 | 不把文案转为事实。 |
| `LOADING` | 请求家庭首页投影 | 保留原布局的 skeleton/占位 | 取消/返回 | 不显示未经来源确认的数据。 |
| `READY_READ_PROJECTION` | scope、visibility、policy、consent 检查通过 | 家庭摘要、入口状态、今日任务/推荐 projection | 进入受控下游页面 | 不自动创建 Plan/Task/Booking。 |
| `EMPTY_FAMILY_CONTEXT` | 无家庭或成员上下文 | 原画面骨架 + 明确空态 | 选择/申请合法上下文 | 不回退匿名或跨家庭数据。 |
| `PERMISSION_REQUIRED` | actor 无权限或角色不匹配 | 原画面骨架 + 权限提示 | 返回/请求授权 | 不通过客户端参数绕过。 |
| `CONSENT_REQUIRED` | purpose 缺失/过期/撤回 | 原画面骨架 + consent 说明 | 进入授权流程候选 | 不静默展示儿童/服务数据。 |
| `REVIEW_REQUIRED` | evidence、版本、policy 或映射不完整 | 原画面骨架 + 需复核提示 | 安全返回/人工复核 | 不把推荐或模型输出当事实。 |
| `VERSION_CONFLICT` | 投影或下游版本过期 | 原画面骨架 + 更新提示 | 刷新/返回 | 不覆盖新版本或自动合并决定。 |
| `NO_ACTION` | 用户返回或取消 | 保持上下文 | 返回首页/上一页 | 不生成事件之外的核心对象。 |

## 5. Read Projection and Candidate Actions

### 5.1 Read Projection

研究阶段建议的 `FamilyHomeProjection` 只读字段类别如下，具体 DTO 必须留待后续 Contract Gate：

```text
family_context: { family_ref, visible_member_refs, scope_status }
principal: { actor_ref, role, visibility }
consent_summary: { purpose_statuses, expires_at, withdrawal_state }
entry_cards: { entry_id, label, visual_state, availability_state, source_ref }
today_summary: { task_count_projection, visible_status, as_of }
content_service_cards: { card_ref, content_type, source_ref, visibility }
projection_meta: { projection_version, policy_version, as_of, source_refs }
```

客户端不得提交 tenant、family、actor、subject、model、eligibility、ranking、price、external URL 或计算出的核心状态。缺少 scope、source、policy、consent 或 version 时必须 fail-closed。

### 5.2 Candidate Named Actions

UI-01 目前只登记候选，不代表已注册或获准：

| Candidate | 语义 | 当前允许等级 | 约束 |
|---|---|---:|---|
| `SelectHomeContext` | 选择已授权家庭/成员上下文 | L3 候选 | actor、scope、subject、Consent、幂等和审计必须由服务端控制。 |
| `StartAssessmentIntent` | 表达开始测评意向 | L3 候选 | 只能进入受控 Assessment 流程，不生成诊断。 |
| `CreateGrowthPlanIntentDraft` | 表达查看/讨论计划的意向 | L2 候选 | 不能生成 Journey、Task 或 Plan 真相。 |
| `CreateServiceInquiryDraft` | 表达查看服务支持意向 | L2 候选 | 不联系真人、不预约、不发送通知。 |
| `RETURN_HOME / NO_ACTION` | 安全返回或取消 | 已有安全边界候选 | 不创建 Plan、Task、Booking、Reminder 或外部 effect。 |

所有候选 Named Action 都必须经过后续架构/契约评审；UI-01 当前不进入 API Contract。

## 6. Consent, Human Gate and Model Gateway

### 6.1 Consent and scope

UI-01 至少需要区分家庭读取、儿童数据、测评、计划、服务供给、社区/媒体和外部分享等 purpose。具体 purpose 名称、subject visibility、guardian 规则和撤回行为必须由架构师确认；不能以一个模糊授权覆盖所有用途。

### 6.2 Human Gate

以下情况必须返回 `REVIEW_REQUIRED` 或 `HUMAN_GATE_REQUIRED`：敏感儿童数据、情绪/风险/诊断暗示、真人服务/教师联系、预约、支付、通知、直播、视频、公开分享、家庭画像、效果承诺、排名或同龄比较。

### 6.3 Model Gateway

AI 只能通过 Model Gateway 处理明确 schema 的输入和输出。允许的首轮用途是：解释页面入口、整理家庭已表达的问题、生成供家长审阅的说明草稿。禁止用途是：自动诊断、生成 Family Need/Plan/Task/Outcome Fact、评价教师、生成家庭 Total Score、家庭 Ranking、同龄平均或自动触发 Named Action。

## 7. Visual Fidelity Brief

### 7.1 Visual baseline

| 项目 | UI-01 基线 |
|---|---|
| Global UI | `UI-01 / F01 Family Home` |
| Image path | `apps/web/public/bangyang-reference/ui18/core-01-home.png` |
| Image dimensions | 239 × 664 px |
| Device intent | 移动端手机画布；桌面展示需保持居中手机比例，不拉伸内容。 |
| Baseline status | `LOCATED`; UI-01 用户 overlay 与历史映射仍需人工确认是否为同一 canonical version。 |
| Visual source authority | 用户原图/已确认单图优先；repo 图只能作为当前可定位参考，不能替代缺失的用户确认。 |

### 7.2 Layout regions and immutable intent

| 区域 | 必须复刻的内容 | 动态化限制 |
|---|---|---|
| System/header | 手机状态栏、标题“家庭成长平台”、右上更多/圆形系统入口的相对位置 | 不改导航层级、图标位置和顶部高度。 |
| Greeting | “早上好，今天也一起陪孩子成长 ☀️”两行问候的层级和间距 | 动态问候只能在批准的 copy allowlist 内替换。 |
| Hero | 蓝色圆角卡片、白色“免费家庭测评”、副文案、白色 CTA、右侧家庭人物插画 | 不换成通用 banner；人物图像、卡片比例、按钮位置保持。 |
| Six-card grid | 两行三列：AI诊断、21天挑战营、90天成长计划、成长案例、专家直播、家庭顾问；彩色线性图标位于文字上方 | 不重排、不合并、不删卡；入口状态在原卡片内表达。 |
| Today task | “今日成长任务”标题、右侧“查看全部”、三行任务和绿色/蓝色状态 chip | loading/empty/permission 状态保留标题和列表容器，不用整页替换。 |
| Recommended content/service | “推荐内容/服务”、右侧“更多”、横向卡片和人物/内容视觉 | 推荐必须是受控 projection；不得自动排序或把推荐写成适配事实。 |
| Bottom navigation | 首页、计划、社群、我的，首页高亮蓝色 | 保持四项顺序、图标位置和 active 状态；路由动作不绕过 Gate。 |

### 7.3 Text, image, color, spacing and interaction checklist

| Dimension | Acceptance requirement |
|---|---|
| Text | DOM 中覆盖 baseline 可读文案；不得用业务动态字段无证据替换原文；低清/不确定文案标 `NEEDS_CONFIRMATION`。 |
| Image | 使用原图或已批准资产；不得用 AI 重新设计人物、图标或卡片素材冒充复刻。 |
| Color | 保持蓝色 Hero、白色卡片、浅灰背景、橙/绿/蓝入口图标和底部 active 蓝色的视觉意图。 |
| Spacing | 保持顶部安全区、问候与 Hero 间距、六卡网格间距、任务列表分隔线、横向卡片间距和底部导航高度。 |
| Interaction hotspots | Hero CTA、六个入口、查看全部/更多、任务行、底部四项导航、右上菜单/系统入口均需在原位置可操作。 |
| Responsive | 至少覆盖基线手机 viewport 和 desktop 居中手机 viewport；不得因响应式改成通用 dashboard。 |

## 8. Visual Screenshot Acceptance Criteria

未来进入实现时，必须先完成静态视觉复刻，再接入动态数据。验收至少包括：

1. baseline screenshot 与实现截图在目标手机 viewport 上逐项比较，记录布局、文本、颜色、间距、图标和卡片差异。
2. desktop viewport 保持同一手机画布结构，不拉伸或重排视觉层级。
3. DOM text coverage 覆盖标题、问候、Hero、六入口、任务标题/状态、推荐区和底部导航。
4. interaction state coverage 覆盖静态态、loading、empty、permission、consent blocked、review required、safe exit；所有状态不破坏原页面骨架。
5. CTA 行为证明不会绕过 Named Action；本轮只允许 read projection 或明确标识的 candidate/stub。
6. Playwright screenshot diff 失败时回到 Fix Loop，不得以“看起来差不多”声明完成。

## 9. Current Gate and Next Steps

UI-01 下一步门禁固定为：

```text
Architect Review
→ Blocking Questions
→ Visual Baseline Check
→ BA Design closure
→ only then reconsider API Contract
```

当前不允许：

```text
API_CONTRACT_GATE=NO_GO
CODE_GATE=NO_GO
API/DB implementation
AI free-text ontology write
real booking/payment/notification/share/human contact
```

## 10. References

[1]: `apps/web/public/bangyang-reference/ui18/core-01-home.png`
[2]: `reports/m2/frontend/UI-01_RESEARCH_NEEDS_ANALYSIS_001.md`
[3]: `reports/m2/frontend/UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md`
[4]: `reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`
[5]: `governance/FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md`
[6]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`
[7]: `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md`

**UI01_BA_DESIGN_AND_VISUAL_FIDELITY_BRIEF_READY** `reports/m2/frontend/UI-01_BA_DESIGN_AND_VISUAL_FIDELITY_BRIEF_001.md`
