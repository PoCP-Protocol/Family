# UI-30 年度陪伴说明 PDCA 001

## 用户问题与本轮目标

UI-30 原始页面展示年度会员、陪伴天数、成长积分、等级、累计服务、邀请奖励、服务进度和权益查看。家庭在这里真正需要的，是清楚地知道目前有哪些服务说明可以回看、下一步应从哪里继续，而不是通过等级、积分、邀请或续费压力理解自己与孩子的价值。

本轮将 UI-30 定位为**家庭服务回看**。它只复用已经存在的家庭范围服务投影，按中性标题列出可慢慢了解的支持，并衔接 UI-31 我的服务与 UI-05 成长计划。它不将原图中的称谓、天数、积分、等级、次数、奖励、到期日或服务进度变成动态事实，也不创建任何消费、权益或外部联系动作。

| 用户 | 需要的体验 | 本轮设计 |
|---|---|---|
| 家长 | 明白当前可以从哪些支持继续，不被销售压力催促 | 展示中性服务说明与“查看我的服务”“回到成长计划”入口。 |
| 孩子 | 不因家庭拥有的服务、等级或使用情况被评价 | 动态区域不显示孩子表现、使用次数、等级、积分、奖励或比较。 |
| 家庭 | 自主决定何时了解和使用支持 | 不提供购买、续费、退款、邀请、客服、通知或外发操作。 |
| 平台 | 与既有服务范围数据保持单一来源 | 只读取 `MembershipCustomerProjection`，不复制会员、权益、订单或账本。 |

## 研究输入与设计判断

Family Voices 将以家庭为中心的服务描述为尊重家庭优势、文化、传统与经验的家庭—专业伙伴关系，并强调以家庭觉得有用的方式持续提供诚实、无偏的信息。[1] Head Start 将家庭参与界定为基于合作、优势和相互尊重的持续关系。[2] 这些原则支持 UI-30 用清楚的服务说明和可逆入口服务家庭，而不把服务包装成成长承诺、身份层级或消费激励。

> UI-30 中“可慢慢了解的支持”只说明相应服务资料可被当前家庭阅读；它不表示购买、续费、资格、权益生效、服务交付、教师匹配或教育效果已经成立。

## 视觉基线与动态内容边界

UI-30 对标 `apps/web/public/bangyang-reference/annual-member-mine-reference-532x994.png`。基线图为常规可读的 532×994 纵向页面，不需要分块处理。图中的“年度会员”、陪伴天数、成长积分、家庭等级、累计服务、邀请奖励、服务进度、教师、到期和“查看权益”仅作为既有视觉基线保留，**不会被动态逻辑读取、计算或解释为家庭服务事实**。动态服务回看卡追加在基线之后。

| 动态可呈现 | 本轮不呈现、不创建或不推断 |
|---|---|
| 当前家庭可阅读的服务说明标题 | 会员称谓、到期、等级、积分、奖励、使用次数、价格或购买资格 |
| 中性服务介绍与按节奏了解的提示 | 续费、购买、退款、权益授予或消耗、订单、发票与客服建单 |
| 前往我的服务与成长计划的入口 | 邀请、联系人、外发、通知、分享、下载与教师联络 |

## 数据与流程边界

> UI-18 家庭服务范围 → UI-30 年度陪伴说明 → UI-31 我的服务 → UI-05 成长计划。

UI-30 仅读取既有 `MembershipCustomerProjection` 中属于当前家庭的服务范围与支持项目摘要，并把它渲染为“可以慢慢了解的支持”。读取失败时提示稍后重试；没有可读项目时提示返回成长计划。页面不提交写请求、不会在本地伪造会员事实，亦不把页面文案作为服务权益或效果凭证。

## 验收标准

1. UI-30 只读取同一家庭的既有服务范围投影，服务名称来自已存在的投影项目。
2. 动态卡不显示或推断等级、积分、奖励、到期、价格、权益、支付、订单、续费、退款、邀请、客服或儿童评价。
3. UI-30 仅可前往 UI-31 我的服务或 UI-05 成长计划，且两条入口不产生网络写入。
4. 自动化测试覆盖服务可读、无可读项目、跨家庭投影拒绝、无额外写入以及入口血缘。
5. 移动端复核确认动态卡位于原始会员视觉基线之后，不遮挡其顶部、服务卡或底部导航。

## Dev 环境扩展范围

根据本轮产品要求，UI-30 在 Dev 环境不回避积分、邀请和续费体验。三者必须进入可演示的家庭流程，但不能混成真实生产权益或外部效果：

| 能力 | Dev 可演示形态 | 状态边界 |
|---|---|---|
| 积分 | 家庭积分只读快照与“查看积分”入口，使用 synthetic fixture 或既有家庭记录 | 只读 `FamilyPointsProjection`；不兑换、不提现、不授予、不改变正式积分账本。 |
| 邀请 | 从 UI-30 进入已有 UI-15 邀请说明草稿，保存后回到家庭服务页 | `CreateInvitationDraft`；只保存家庭意向，不读取联系人、不生成二维码、不发送通知、不外发。 |
| 续费 | 在 UI-30 记录“想了解续费”意向，回显已记下状态 | `CreateRenewalInterestDraft`；只写 Dev 受控草稿和审计，不扣款、不续费、不变更 Membership/Entitlement。 |

积分属于 Fact projection，邀请和续费意向属于 Controlled Draft；Recommendation、Decision 和 Action 仍然分开。任何未来支付、通知、权益变更、兑换和邀请外发都必须沿用 Named Action、Idempotency、Audit 和 no-op Adapter 边界。

## References

[1] [Family Voices, *Family-Centered Care*](https://familyvoices.org/familycenteredcare/)

[2] [U.S. Head Start, *Family Engagement*](https://headstart.gov/family-engagement)

[3] [UI-18 家庭服务范围与计划入口 PDCA 001](UI-18_FAMILY_SERVICE_SCOPE_PDCA_001.md)

[4] [UI-30 Phase C Pre-API Gate 001](UI-30_PHASE_C_PRE_API_GATE_001.md)

## 浏览器视觉复核与测试结果

本轮在本地 `annual-member-mine` 路由完成移动端浏览器复核，运行截图由浏览器生成，路径为 `/home/ubuntu/screenshots/localhost_2026-08-19_03-30-08_2493.webp`。原始年度会员、静态积分、邀请奖励、当前服务卡和底部导航保持完整，新增区域仅在受控会员投影成功后追加，不覆盖原始基线。无认证的普通静态壳不伪造动态会员、积分或续费状态；动态成功与续费草稿状态由前端定向测试和 API 集成测试覆盖。

| 验证层级 | 命令或证据 | 结果 |
|---|---|---|
| Web UI-30 定向 | `pnpm --filter @family/web exec vitest run src/test-loop.commerce-service.spec.ts` | 9/9 通过。 |
| Web 全量 | `pnpm --filter @family/web exec vitest run` | 14 个测试文件、106 个测试通过。既有 jsdom navigation stderr 仍存在但未导致失败。 |
| API UI-30 动作 | `pnpm --filter @family/api exec vitest run src/modules/orchestration/test-experience.focused.integration.spec.ts` | 3/3 通过；六类 Dev 体验操作均为幂等且 `external_effect=false`。 |
| API 全量 PostgreSQL | `pnpm --filter @family/api exec vitest run` | 52 个测试文件、275 个测试通过。 |
| 数据库迁移 | `pnpm run testdb:migrate` | `0023_ui30_renewal_interest_operation.sql` 已应用。 |

本轮结论为：**UI-30 Dev 扩展闭环通过**。积分表现为只读家庭过程快照；邀请进入既有家庭邀请说明草稿；续费只记录家庭了解意向，不扣款、不变更会员或权益、不通知、不外发。用户界面未出现 DEV、SYNTHETIC、contract、Model Gateway、receipt 或其他工程术语。
