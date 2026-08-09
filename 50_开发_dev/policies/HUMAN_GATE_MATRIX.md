# Human Gate Matrix V0.1

| 场景 | 默认风险 | AI可做 | 人必须做 |
|---|---|---|---|
| 普通知识解释 | LOW | 回答/引用知识 | 无 |
| 今日低风险行动建议 | LOW | Recommendation | 家庭自行选择 |
| 修改GrowthProfile | MEDIUM | 提交Update Recommendation | 顾问/授权规则确认 |
| 确认GrowthPriority | MEDIUM | 推荐候选 | 家庭/顾问确认 |
| 中高风险Intervention | MEDIUM/HIGH | 提供候选和Evidence | 顾问/专家批准 |
| 测量Outcome | MEDIUM | 草拟结构化结果 | 授权人确认 |
| 矛盾Perspective | MEDIUM | 标记冲突 | 人判断，不能自动变Fact |
| 未成年人高敏感数据外用 | HIGH | 不自动执行 | Consent + Human Review |
| 自伤/伤人/虐待/暴力等信号 | CRITICAL | 停止普通自动化并升级 | Safety Reviewer |
| 临床诊断请求 | HIGH | 不诊断，建议专业路径 | 必要时人工/专业转介 |

## Gate结果
- ALLOW
- ALLOW_WITH_CONFIRMATION
- ABSTAIN
- ESCALATE_DOMAIN
- ESCALATE_EXPERT
- ESCALATE_SAFETY
