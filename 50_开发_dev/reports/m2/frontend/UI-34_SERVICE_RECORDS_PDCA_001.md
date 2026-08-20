# UI-34 服务记录 PDCA 001

## 用户问题与本轮目标

UI-34 原始页面把咨询、活动和客服支持放在一起。家庭需要知道哪些事情已经记下、当前处于什么阶段，以及如何继续查看支持记录；但“已预约”“已报名”不等于服务已经发生，“服务记录”也不等于教育效果、诊断或因果结论。本轮将 UI-34 接入已有 UI-24 家庭支持记录 projection，追加家庭私有过程回看卡，保留原始记录列表、状态标签、客服入口和移动端视觉，不创建新的预约、报名、客服、通知、导出或分享动作。

| 记录类型 | 可回看内容 | 不作出的推断 |
|---|---|---|
| 咨询 | 家庭已经记下的需求、状态和时间 | 不推断咨询效果、服务质量或孩子变化。 |
| 活动 | 家庭关注或留下的活动过程记录 | 不推断到场、学习效果或后续承诺。 |
| 客服支持 | 已存在的家庭支持记录 | 不把客服状态写成问题已解决。 |

## 数据与安全边界

本轮复用 `ServiceRecordProjection`、`ServiceCaseProjection`、`BookingProjection`、`EvidenceProjection` 和 `Perspective` 的只读家庭范围投影。记录的来源、时间、状态和家庭可见性保持分离；服务记录、观点和证据不被转换为 Outcome、诊断、因果或效果事实。纠错、补充说明、导出、分享、通知和跨系统同步不由 UI-34 触发。

`Fact` 只表示已有来源明确的记录字段；`Perspective` 只表示家庭自己的说明；`Recommendation` 只作为查看 UI-24 支持记录的入口；`Action` 不在本页创建。AI 若需要整理记录，只能经 Model Gateway 形成可审阅摘要草稿，不能直接写 ServiceRecord、Outcome、Evidence 或 Consent ontology。

## 视觉基线

UI-34 对标 `apps/web/public/bangyang-reference/service-records-reference-566x1008.png`，尺寸为 566×1008 纵向移动页面。原始页面包括顶部服务记录标题、我的咨询两条记录、我的活动两条记录、客服支持四个入口和底部“联系客服”按钮。原始静态基线完整保留；动态家庭过程回看卡仅在页面末尾追加，不覆盖任何原始记录或联系客服视觉。

## 数据血缘与状态

```text
Family
  └─ CustomerSupportProjection
       ├─ bookings[]        → 记录已记下的咨询需求
       ├─ service_records[] → 记录家庭支持过程
       └─ visibility=FAMILY_PRIVATE

UI-34 ServiceRecordsView
  ├─ IDLE → LOADING → READY | EMPTY | ERROR
  ├─ next_route = service-mine
  └─ external_effect = false
```

加载失败保留原始页面并给出自然回退；空态不伪造历史记录。所有请求使用家庭范围 GET，页面按钮只导航至 UI-24 “我的咨询和活动”。

## 验收标准

1. UI-34 受控读取成功时展示家庭支持记录摘要，且不把过程记录写成效果、诊断或结论。
2. 页面不出现工程术语、AI 内部状态、导出/分享/通知或真人外联承诺。
3. 原始咨询、活动、客服支持和联系客服视觉完整保留，动态卡只追加在基线之后。
4. 自动化测试覆盖 READY、EMPTY、ERROR、家庭范围校验、零写入和返回 UI-24 入口。
5. Web 全量回归和移动端浏览器复核通过后，再限定提交本轮四个相关文件。

## References

[1] [UI-34 Phase C Pre-API Gate 001](UI-34_PHASE_C_PRE_API_GATE_001.md)

[2] [UI-24 Family Support Records PDCA 001](UI-24_FAMILY_SUPPORT_RECORDS_PDCA_001.md)

## 浏览器视觉复核与测试结果

本轮在本地 `service-records` 路由完成移动端浏览器复核，运行截图路径为 `/home/ubuntu/screenshots/localhost_2026-08-19_03-44-26_2591.webp`。原始咨询记录、活动记录、客服支持四项入口和底部“联系客服”按钮保持完整；动态家庭过程回看只在受控投影成功后追加，不覆盖原始列表与客服视觉。

| 验证层级 | 结果 |
|---|---|
| UI-34 定向页面对象测试 | `src/test-loop.page-objects.spec.ts` 29/29 通过。 |
| Web 全量回归 | 14 个测试文件、110 个测试通过；既有 jsdom navigation stderr 未导致失败。 |
| 浏览器视觉复核 | 原始基线完整保留，动态过程卡未覆盖咨询、活动或客服区域。 |

本轮结论为：**UI-34 家庭服务记录只读回看通过**。记录只表示家庭曾经留下一个服务过程，不代表服务效果或孩子变化结论；页面不创建预约、活动报名、客服请求、通知、导出、分享或外部服务状态。
