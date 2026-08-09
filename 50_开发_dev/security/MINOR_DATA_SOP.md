# 未成年人数据处理 SOP V0.1

> 这是产品/工程内部SOP，不替代正式法律意见。上线地区的具体法律义务需由法务确认。

## 1. 数据分类

### M0 基础身份
- child_id
- display_name
- birth_date / age band

### M1 家庭关系
- guardian relation
- household relation

### M2 成长与行为
- assessment
- growth events
- profile
- actions
- outcomes

### M3 高敏感安全信息
- violence/abuse signals
- self-harm/harm-to-others signals
- severe crisis notes

## 2. 最小化
只采当前业务目的必要字段。

## 3. Purpose
每次处理绑定purpose：
SERVICE / ASSESSMENT / AI_PERSONALIZATION / GROWTH_TRACKING / ...

## 4. Guardian
涉及Child的授权动作必须验证：
- guardian belongs to same Family
- relationship is authorized
- consent is active
- policy_version current enough

## 5. AI
- AI输入按最小上下文拼装。
- 禁止把Child全部历史会话无条件送给模型。
- MODEL_IMPROVEMENT必须独立Consent。
- HIGHLY_SENSITIVE优先本地/受控模型或Abstain策略。

## 6. Staff Access
- Assignment-based access
- Need-to-know
- 所有高敏访问Audit

## 7. Export
未成年人数据导出：
- 默认禁止
- 特定角色 + purpose + audit
- 大批量导出需二次审批

## 8. Deletion / Withdrawal
Consent撤回后：
- 停止未来对应purpose处理
- 处理衍生缓存/索引
- 审计事实保留按政策
- 法律/合同必须保留的数据单独标识

## 9. Safety Signal
M3安全数据进入独立权限域，不进入普通成长评分。

## 10. Incident
发现越权/泄漏：
- suspend access
- preserve audit
- incident ticket
- security owner
- assess affected subjects
