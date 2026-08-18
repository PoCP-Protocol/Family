# Family App 蓝图 → DEV 全量实现可追溯地图

> **状态：`DEV_IMPLEMENTING`。** 依据三张榜样教育 App 规划截图及两份既有拆解文档，将长期体验线索转化为 DEV 可实现页面、合成闭环、受治理 AI 壳和明确 HOLD 的页面占位。本文不是效果、诊断、商业化、生产或真实用户试用授权。

## 页面与能力映射

| 蓝图线索 | DEV 页面/入口 | 前端实现 | 后端/契约 | 运行分类 | 绝不宣称 |
|---|---|---|---|---|---|
| 首页/家庭成长平台 | **家庭首页**：当前服务过程、继续入口、暂停、私有边界 | `family-dev-app.js` Home | capability + audit read | DEV real UI / synthetic data | 成长已改善、系统已诊断 |
| 家庭测评/体检 | **“选择你现在需要的支持”** | L0 Need/Intent screens | `/test-loop/need`、`/intent` | DEV synthetic | 测评、分数、诊断、画像 |
| AI 成长报告 | **家庭服务过程摘要** + **AI 助手受治理壳** | Summary + Gateway stub | `/stubs/gateway` | DEV stub | AI 建议、个性化诊断、模型可用 |
| 推荐资源/服务 | **已准入候选**、详情、并列比较 | L1 candidate screens | `/intents/:id/candidates` | DEV synthetic | 最佳方案、排序、效果证据 |
| 90 天方案/每日任务 | **家庭选择与下一步**：Decision-only、暂停、NO_ACTION | Decision receipt + plan shell | `/decisions` | DEV synthetic/mock | 已建 Plan/Case、任务/提醒/打卡 |
| 陪跑/顾问 | **安全等待/Human Gate** | Handoff shell | `/stubs/human-gate` | DEV stub | 已接单、预约、真人服务 |
| 孩子端助手 | **儿童端能力占位** | HOLD shell | 无 | PROD_HOLD | 儿童账户、AI 对话、积分 |
| 我的/成长档案 | **我的家庭空间**：审计、隐私、导出/撤回状态说明 | Private space | `/audit/:correlationId` | DEV real UI / synthetic audit | 成长档案、永久画像 |
| 商城/会员/邀请/积分 | **商业能力占位** | HOLD shell | 无 | PROD_HOLD | 购买、订单、权益、增长 |
| L2/L3 工具 | **专业工具边界占位** | HOLD shell | `/stubs/intake` | DEV stub | 题项、计分、诊断、危机处置 |
| 多模态材料入口 | **动态文字/语音节奏/图像情境** | `test-loop-multimodal.js` + 波形/合成场景动效 | 本地固定 synthetic contract | DEV synthetic/read-only | 真实录音、上传、相机、人脸/生物特征、模型理解或训练 |

## 导航信息架构

| 一级导航 | 主任务 | 当前数据状态 | 可执行动作 |
|---|---|---|---|
| 首页 | 了解私有服务边界，恢复/开始合成内部演示 | 合成/最小审计 | 进入 L0、查看安全边界、退出 |
| 支持 | 表达当下 Need/Intent，查看 admitted candidates | 仅 synthetic fixture | 查看、比较、返回、暂停、Decision/NO_ACTION |
| 过程 | 查看 Decision-only 回执、mock executor、审计与安全等待 | synthetic/mock | 查看最小审计、暂停/返回 |
| 助手 | 理解 Gateway/Model/L2/L3/Human 边界 | fixed stub | 查看固定停止模板；无模型调用 |
| 我的 | 家庭私有空间、数据最小化和商业化 HOLD 说明 | 只读/合成 | 回看审计、退出 |

## 状态与环境标记

| 模块 | DEV | TEST | PROD |
|---|---|---|---|
| L0/L1 合成闭环 | `DEV_IMPLEMENTING` | 待 DEV evidence package | `PROD_HOLD` |
| App 全量导航/页面壳 | `DEV_IMPLEMENTING` | 待浏览器验证 | `PROD_HOLD` |
| Gateway/AI assistant | `DEV_STUB_ONLY` | 待 Gateway 独立 Gate | `PROD_HOLD` |
| 多模态合成情境 | `DEV_IMPLEMENTING` | 待多模态入口/Consent Gate | `PROD_HOLD` |
| L2/L3 Intake | `DEV_STUB_ONLY` | 待专业工具 Gate | `PROD_HOLD` |
| Human/Handoff | `DEV_STUB_ONLY` | 待 Human/Organization Gate | `PROD_HOLD` |
| 商业/会员/商城/裂变 | `PROD_HOLD` | 不进入 TEST 交易验证 | `PROD_HOLD` |

## 不可突破的统一边界

所有页面保留文本等价路径、退出与返回。多模态演示只展示本地合成文字、波形和匿名插画场景，最大状态上限为 `READ_ONLY_SYNTHETIC_EXPLANATION`；真实录音、上传、相机、相册、人脸/生物特征、外部模型和训练均 fail-closed。前端不得发送 actor、subject、family scope 或自由文本事实；服务端仍负责 strict consumer auth、Trusted Family Context、family scope、consent、候选资格和版本复核。任何真实模型、外呼、训练、真实家庭/儿童数据、L2/L3 题项/计分、真人服务、支付/权益、公开分享、跨家庭统计、生产发布或自动合并都保持 HOLD。

## 依据

[1] `architecture/FAMILY_APP_MINIPROGRAM_UI_BLUEPRINT_DECOMPOSITION_DRAFT_001.md`。
[2] `architecture/FAMILY_APP_FUNCTION_DECOMPOSITION_FROM_BANGYANG_PPTS_DRAFT_001.md`。
[3] `governance/FAMILY_TEST_ENV_FULL_FUNCTION_CLOSED_LOOP_PLAN_ARCH_GO_001.md`。
[4] `architecture/FAMILY_SUPPORT_ASSISTANT_AI_MODEL_GATE_ASSET_INDEX_001.md`。
[5] 总架构师裁决：`ARCH-GO-TEST-FULL-FUNCTION-001`、`ARCH-ENV-PROMOTION-SEQUENCE-001`、`ARCH-DEV-ACCELERATED-DELIVERY-001`。

---

**作者：Manus AI**
**日期：2026-08-17（GMT+8）
