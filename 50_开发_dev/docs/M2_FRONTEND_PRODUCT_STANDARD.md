# M2 Frontend / Product Standard

## 首期终端

Family Web / Responsive Web

暂缓：
Native App / Mini Program

## Screen Baseline

F01 Family Home
F02 Growth Onboarding
F03 Parent Perspective
F04 Child Perspective
F05 Growth Insight
F06 Growth Priority
F07 Intervention Detail
F08 Today Growth Action
F09 Action Reflection
F10 Family Timeline
F11 Growth Review
F12 Family AI

每个Screen必须定义：

USER
PURPOSE
INPUT
DISPLAY_STATE
EMPTY_STATE
LOADING_STATE
ERROR_STATE
PERMISSION_STATE
CONSENT_STATE
BACKEND_API
DOMAIN_OBJECT
PRIMARY_ACTION
NEXT_SCREEN

## UX原则

- Family不是课程商城。
- 首页优先展示当前成长旅程与Today Action。
- 不展示家庭总分/排名。
- Perspective必须标来源。
- AI Hypothesis必须明确标识。
- AI Recommendation必须可解释Evidence。
- Child数据必须经过Consent与Minor Data规则。
- AI嵌入Growth Journey，不做孤立聊天壳。
