# UI-31 我的服务 PDCA 001

## 用户问题与本轮目标

UI-31 原始页面将 90 天成长计划、阶段进度、本周任务、成长顾问、班主任陪跑、AI 提醒与专家答疑放在同一移动端服务页。家长真正需要的是知道当前家庭正在跟进哪一段计划、哪些小行动已经记下、下一步从哪里继续，而不是把静态百分比、服务者头像或“AI提醒”视觉理解成真人服务完成、教育效果或儿童能力结论。

本轮将 UI-31 收敛为**家庭服务与成长进度回看**。页面复用已经存在的 `coreGrowthProjection`，展示家庭私有的计划摘要、任务状态和下一步入口，并保持 UI-05 成长计划、UI-09 今日行动、UI-24 支持记录的血缘。UI-31 不创建预约、客服、通知、支付、退款、权益消耗、真人联系或服务效果结论。

| 用户 | 需要的体验 | 本轮设计 |
|---|---|---|
| 家长 | 看懂计划处于哪一段、下一步做什么 | 计划阶段、家庭任务状态和回到计划/今日行动入口。 |
| 孩子 | 不被进度百分比、服务次数或 AI 文案评价 | 不显示儿童诊断、排名、总分、能力结论或比较。 |
| 家庭 | 能按自己的节奏继续或暂停 | 只读回看与路由入口，不自动推进任务、不发送提醒。 |
| 平台 | 保持 Core Growth 与 Service/Records 的数据血缘 | 读取同一家庭投影，不建立 UI-31 平行任务账本。 |

## 研究判断与数据边界

UI-24 已验证服务记录应使用“需求已记下”“可以继续了解”等中性状态，并明确服务记录不等于真人服务完成或教育效果。[1] UI-18 已验证家庭服务说明应优先透明、家庭自主与成长计划回流，而不是等级、积分或消费驱动。[2] 因此 UI-31 将 `Fact` 限定为投影中已有的计划和行动状态；家庭反思仍是 `Perspective`，AI 提醒只能作为 `Recommendation` 或 `Text Equivalent`，不能直写核心任务或 Outcome。

## 视觉基线与动态追加区域

UI-31 对标 `apps/web/public/bangyang-reference/my-services-reference-532x1000.png`。基线为 532×1000 纵向移动页面，包含顶部返回、90 天成长计划蓝色进度卡、服务入口、任务清单和查看方案/继续打卡按钮。基线完整保留；家庭进度回看卡追加在原始页面之后，不覆盖计划卡、任务清单和底部区域。

| 动态可呈现 | 本轮不呈现、不推断 |
|---|---|
| 家庭计划标题、阶段摘要、已有任务状态、下一步入口 | 儿童诊断、成长效果、因果结论、家庭排名、总分或能力等级 |
| `not_started`、`in_progress`、`checked_in` 等已定义状态的自然说明 | 把静态 78%、7/9、38/48 转成真实履约、效果或服务完成率 |
| 回到 UI-05 成长计划、UI-09 今日行动、UI-24 支持记录 | 预约、取消、改期、客服、通知、真人联络、支付、退款或权益消耗 |

## 对象关系与前端状态

```text
Family
  └─ CoreGrowthProjection (FAMILY_PRIVATE, READ_ONLY)
       ├─ GrowthPlanSummary
       ├─ GrowthTaskSummary[]
       └─ NextHint (RECOMMENDATION / no-op)

UI-31 MyServicesProjection
  ├─ plan_summary
  ├─ task_summary[]
  ├─ next_route = core-plan | growth-daily-task
  ├─ records_route = service-mine
  └─ boundary = READ_ONLY_NO_SERVICE_EFFECT
```

页面状态包括 `IDLE`、`LOADING`、`READY`、`EMPTY` 和 `ERROR`。前端只保存加载状态和当前路由，不在 UI-31 本地改变任务状态；任务完成仍必须由 UI-09 的 `CompleteGrowthAction` Named Action 负责。任何 AI 解释或下一步建议经 Model Gateway/no-op adapter 返回，不得绕过 Named Action。

## 流程血缘

> UI-30 年度陪伴说明 → UI-31 我的服务 → UI-05 90 天成长计划 → UI-09 今日行动 → UI-08 家庭回顾 → UI-29 成长过程回顾。

UI-31 也可回到 UI-24 支持记录，但该入口只读服务过程记录，不表示服务效果。页面加载时最多发起一次家庭范围 Core Growth projection GET；点击“继续打卡”只切换到 UI-09，不产生 UI-31 写入。

## 验收标准

1. UI-31 能在受控投影成功时展示家庭私有计划和任务回看，在空态与读取失败时给出自然回退。
2. 动态内容不出现 DEV、synthetic、contract、Model Gateway、回执、审计、同意或其他工程术语。
3. UI-31 不显示或推断儿童诊断、排名、总分、奖励、服务效果、真人完成、支付、通知或外部联络。
4. 自动化测试覆盖 Core Growth 读取、家庭范围、空态、错误态、UI-31→UI-05/UI-09/UI-24 路由和零写入。
5. 移动端视觉复核确认原始蓝色计划卡、任务列表和 CTA 保持完整，动态回看卡仅追加在基线之后。

## References

[1] [UI-24 家庭支持记录概览 PDCA 001](UI-24_FAMILY_SUPPORT_RECORDS_PDCA_001.md)

[2] [UI-18 家庭服务范围与计划入口 PDCA 001](UI-18_FAMILY_SERVICE_SCOPE_PDCA_001.md)

[3] [UI-31 Phase C Pre-API Gate 001](UI-31_PHASE_C_PRE_API_GATE_001.md)

## 浏览器视觉复核与测试结果

本轮在本地 `my-services` 路由完成移动端浏览器复核，运行截图路径为 `/home/ubuntu/screenshots/localhost_2026-08-19_03-35-21_5866.webp`。原始 90 天成长计划蓝色头卡、阶段环、服务入口、任务清单以及“查看方案/继续打卡”按钮均保持完整。未授权的静态壳不伪造动态家庭计划投影；受控 Core Growth 投影加载成功后，家庭服务进度卡追加在原始基线之后，并只提供家庭内回看和路由入口。

| 验证层级 | 结果 |
|---|---|
| UI-31 定向 Web 测试 | `src/test-loop.commerce-service.spec.ts` 10/10 通过。 |
| Web 全量回归 | 14 个测试文件、107 个测试通过；既有 jsdom navigation stderr 未导致失败。 |
| 浏览器视觉复核 | 基线完整保留，追加区域未覆盖原始服务卡。 |

本轮结论为：**UI-31 家庭服务进度回看通过**。它复用 Core Growth 计划投影，不创建平行任务账本；任务完成仍由 UI-09 Named Action 负责，UI-31 不修改状态、不通知、不联系真人，也不推断教育效果。
