# Family App 体验融合路线 V1

```text
DOC_KIND       = APP_EXPERIENCE_INTEGRATION_MEMO（非 SSOT、非 runtime 授权）
STATUS         = DRAFT_FOR_ARCHITECT_REVIEW
PRINCIPLE      = 保留榜样教育未来 App 的家庭长期服务设想；只在现有 Family Web/API/领域真相上扩展，不重建平行客户端或平行数据模型。
```

## 1. 已有 App 资产与未来 App 设想的融合原则

现有 `apps/web` 已有两类资产：其一是早期的亲子沟通成长体验，已经落实“安全信号→视角→Evidence→工作画像→练习/复盘”的过程真相边界；其二是 `PlatformApp`，已将 Account 会话、零/单/多家庭上下文、onboarding 状态恢复和 Today 聚合接入真实 API。未来 App 不应否定其中任一资产，而应以 `PlatformApp` 的可信身份和家庭上下文为入口，逐步把早期成长体验归为“成长”子域，把新 V3 编排闭环归为“首页/服务”子域。

榜样教育材料提出的家庭账户、21 天挑战、90 天陪跑、内容/课程、AI 协助、顾问协同、服务进度、成长报告、会员权益、社群/活动与经营触点，必须被翻译为 Family 的领域对象和分阶段 App 能力；不能把订单、课程、打卡、聊天量或续费直接显示成儿童成长结果。

## 2. App 信息架构：现有 V3 蓝图的四个一级入口

| 一级入口 | 用户当前问题 | 复用的已有资产 | 榜样教育 App 设想的融合能力 | 不可越过的边界 |
|---|---|---|---|---|
| **首页** | “现在有什么需要 Family 帮忙？” | `PlatformApp`、Today、Auth contexts、V3 Orchestration | 当下求助、待确认推荐、今日低风险练习、服务进度、回访、可解释的下一步 | 不强制先做测评/画像/成长规划；不以 AI 消息量或停留时长优化 |
| **成长** | “我们想理解并长期练习什么？” | Growth Onboarding、Perspective、Evidence、Profile Draft、Priority、Intervention、Review | 榜样教育课程/训练营/21 天挑战作为 approved Resource/Program；成长档案与报告投影 | Evidence/观点/画像/观察/服务过程分开；不做儿童评分、诊断或因果承诺 |
| **服务** | “Family 正在为我们组织什么，谁负责，下一步是什么？” | V3 `ResourceOffer→Decision→Plan→ServiceCase→Follow-up` | 顾问/助教后续可见的受控服务进度、SLA、恢复、专家/外部转介、预约 | ServiceCase/计划/日程不是成长结果；任何跨组织访问必须后续 AccessGrant |
| **家庭** | “谁在家庭中、同意了什么、什么可被共享？” | Account→Person→FamilyMembership、Consent、Family aggregate | 家庭账户、共同照护者、儿童资料、服务与数据控制、未来权益呈现 | 会员/付款不授予数据访问；组织角色不等于家庭角色；儿童权利与家庭主权必须可见 |

`Principal` 不应作为一级导航。它保留为首页、成长和服务中的受控 AI 资源/提案能力：帮助澄清、解释资源和准备对话，而不替代家庭决定、专业人士或服务责任。

## 3. 榜样教育未来 App 能力的落位

| 榜样教育设想 | Family App 体验 | 正确领域宿主 | 建议阶段 | 当前不可误解为 |
|---|---|---|---|---|
| 家庭/父母成长入口、现实问题触发 | 首页 Need/Intent 入口 | Orchestration + Growth OS | Phase2 | AI 诊断或强制测评漏斗 |
| 21 天挑战、每日任务、打卡 | Growth 中的 Program Resource 与 Delivery 日程 | Program Runtime + 未来 Enrollment/Delivery | Phase4 | Program schedule 或打卡即完成/成长证明 |
| 90 天陪跑、长期计划 | 服务中的长期 ServiceCase/Steward + Program/人类资源 | ServiceCase + Delivery + Steward | Phase5–6 | 自动续费、不可退出的陪跑 |
| 内容/课程/IP | 资源库与情境化练习卡 | Content Ref + ResourceOffer | Phase2 起逐项准入 | 任何旧课程自动获得推荐资格 |
| AI 成长助手/管家 | 页面内低风险提案、解释、整理与手动选择 | Principal + provider policy + Human Gate | Internal-only Phase2 | AI 自动改写家庭事实、直接执行或诊断 |
| 顾问、班主任、助教 | 服务案例中的人工接力、回访和恢复 | Family Steward / qualified human resource | Phase5–6 | 顾问天然能看到全家庭数据 |
| 成长档案、报告 | 家庭可读的过程/帮助感/观察投影 | Evidence + ServiceCase + Progress Projection | Phase3+ | 报告证明行为改变或因果效果 |
| 会员、服务包、权益 | 家庭页“可用服务/资源资格”展示 | Future Family Account Asset / Entitlement | Economics Gate 前 | 付款=家庭数据所有权/推荐排序优势 |
| 社群、城市活动、分享 | 服务/资源发现与经授权的发布入口 | Future Community / Engagement | Community Gate | 家庭困难公开、自动裂变、成员默认可见家庭内容 |
| 专家、研学、咨询/转介 | 服务中作为 qualified human/external resource | Provider/Referral domain | Provider Gate | 平台承诺专业结果或自动预约第三方 |

## 4. 首条 App 纵切的用户路径

```text
登录（现有 Account session）
→ 选择家庭（现有 contexts）
→ 首页
→ “孩子刚摔门，我今晚不知道怎么重新开口”
→ Family 确认低风险服务意图
→ 显示资格已通过的 AI Coach / 榜样教育沟通 Practice / 暂不行动 / 外部支持提示
→ 家庭选择
→ 服务卡显示“今天可尝试的一件小事”与限制
→ 次日回访“这次帮助对你有用吗？”
→ 首页/服务保留最小的非因果上下文
```

该路径直接承接榜样教育“问题入口—小行动—陪伴—回访—长期服务”的产品思想，同时使用 Family 的新 V3 真相与权限模型，避免旧 App 把画像、优先级或 7 天任务变成唯一入口。

## 5. App 设计与现有代码的接线

| 现有代码/资产 | 未来接线 | 改造规则 |
|---|---|---|
| `apps/web/src/platform/app/platform-app.ts` | 作为登录后 App Shell、家庭选择与入口恢复 | 扩展 `loadToday` 为 V3 Today 聚合；不复制 session/context 逻辑 |
| `apps/web/src/platform/today/today-view.ts` 与 renderer | 作为首页卡片机制 | 增加 V3 Need、recommendation、ServiceCase、follow-up 卡；不推翻现有 Today 空态 |
| `apps/web/src/app.js` | 作为既有 Growth OS 深度体验 | 迁入“成长”入口或保留为访问路径；逐步移除硬编码 `x-actor-id` fixture，使用现有 cookie/Bearer API client |
| `apps/web/src/principal.js` | 作为 AI 交互遗留/专项体验 | 改为嵌入首页/成长/服务的 AI Resource，遵守 V3 trusted context 和 provider policy |
| 现有 WAF 内容和榜样教育课程资产 | 作为 Content/Practice/Program source | 必须通过 ResourceOffer 准入、版本、适龄、风险、证据和许可检查 |
| Family API + AuthModule | 作为所有 App 写操作的唯一服务端入口 | V3 新端点强制 `RequireTrustedFamilyContext`；UI 绝不传 actor/family 权限声明 |

## 6. 体验验收指标

App 的体验质量应以 `TIME_TO_USEFUL_HELP`、家庭对服务的明确接受/拒绝、Follow-up 完成、`HELPFULNESS_SIGNAL`、重复解释减少、人工接力成功、恢复成功、权限/撤权正确性衡量。课程播放、任务打卡、AI 对话、页面停留、付费转化和分享数只能作为独立经营/交付过程指标，不能伪装为孩子成长或家庭关系改善。

## 参考

[1]: `apps/web/src/platform/app/platform-app.ts`
[2]: `apps/web/src/app.js`
[3]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§3–10
[4]: `architecture/BANGYANG_EDUCATION_ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_V1.md`
[5]: `/home/ubuntu/analyze_education_materials.json`
[6]: `/home/ubuntu/education-ppt-analysis/visual-business-notes.md`
