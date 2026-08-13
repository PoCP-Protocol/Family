# FPAI-MM1B · Provider Risk Register V1

**状态**: DRAFT · MM1-B0
**首版**: 2026-08-13
**上位**: `FPAI_MM1B_PROVIDER_SELECTION_V1.md`

Provider 选择必须**先看风险**,再看能力。以下 15 项风险登记必须在 MM1-B1 preflight 时逐一填 evidence。

---

## R01 · 商业授权风险

| 项 | 说明 |
|---|---|
| **风险描述** | Provider 可能对"AI 合成语音用于家庭教育对话"设定使用限制;某些 TTS 平台明确禁止用于"情感陪伴"、"心理咨询"类场景 |
| **触发条件** | 使用未经审阅的 provider 商用条款 |
| **影响** | 上线后被 provider 单方面停用 |
| **对策** | preflight 阶段必须由**人**审阅 commercial_terms,不允许 AI 自行判断 |
| **状态** | UNKNOWN(等 preflight) |

---

## R02 · 数据保留 & 训练风险

| 项 | 说明 |
|---|---|
| **风险描述** | STT / TTS 上传的音频/文本可能被 provider 保留、用于自家模型训练 |
| **触发条件** | 未阅读 provider data policy 直接接入 |
| **影响** | 家庭对话内容外泄;家长隐私违规;可能触发 GDPR / 个人信息保护法 |
| **对策** | preflight 必须核验 `data_retention_policy_known = TRUE` 且 `training_use_policy_known = TRUE`;若厂商无 opt-out,视为红线 |
| **状态** | UNKNOWN |

---

## R03 · 中文实时质量不达标

| 项 | 说明 |
|---|---|
| **风险描述** | Provider 官方宣称支持中文,但实际 partial latency 或情感表达不足 |
| **触发条件** | 未做 benchmark 直接选型 |
| **影响** | 用户体验割裂 |
| **对策** | 必须走 `FPAI_MM1B_BENCHMARK_SPEC_V1.md` §5 的 30+ utterance suite |
| **状态** | UNKNOWN |

---

## R04 · 无 timing / viseme 支持

| 项 | 说明 |
|---|---|
| **风险描述** | TTS provider 不提供 word/phoneme timing 或 viseme,导致 lip-sync 只能退化到 L1/L2 |
| **触发条件** | 选了不带 timing 的 TTS + 高质量 Avatar |
| **影响** | 唇形与语音失同步,uncanny valley |
| **对策** | preflight 核验 `word_timing` 或 `viseme` 至少一项为 TRUE,否则回退 L1 fallback |
| **状态** | UNKNOWN |

---

## R05 · Cancel latency 过高

| 项 | 说明 |
|---|---|
| **风险描述** | 某些流式 TTS/Avatar 的 cancel 响应 > 500ms,barge-in 体验差 |
| **触发条件** | 未测 cancel latency |
| **影响** | 用户打断后仍听到几百毫秒残音 |
| **对策** | 必须实测 `tts_cancel_ms`、`avatar_cancel_ms`;红线 P95 < 300ms |
| **状态** | UNKNOWN |

---

## R06 · Identity 归属丧失

| 项 | 说明 |
|---|---|
| **风险描述** | 某些云端 Avatar 平台锁死"虚拟人 identity",Family 无法带走;或某些自定义音色克隆后音频版权归 provider |
| **触发条件** | 直接使用 provider 提供的默认形象/音色 |
| **影响** | Family 失去 Voice IP / Visual IP 的主权 |
| **对策** | 必须核验 `custom_character / custom_voice / voice_rights`;identity 归属 = Family;否则**淘汰** |
| **状态** | UNKNOWN |

---

## R07 · 真人克隆合规风险

| 项 | 说明 |
|---|---|
| **风险描述** | 未经书面授权对真人 voice / face 做克隆 |
| **触发条件** | 用真人素材(BOBO 案例、家长录音、孩子肖像)直接送 provider |
| **影响** | 违反民法典肖像权 / 声音权;违反个人信息保护法 |
| **对策** | 硬约束:`REAL_PERSON_VOICE_CLONING = NO`,`REAL_PERSON_FACE_CLONING = NO`;仅 BOBO 方法遗产可用,不做 BOBO identity 克隆 |
| **状态** | **FROZEN — 硬规则** |

---

## R08 · 未成年人隐私风险

| 项 | 说明 |
|---|---|
| **风险描述** | 家庭对话包含未成年人姓名、语音、行为细节 |
| **触发条件** | STT/TTS provider 保留数据用于训练,或跨境传输 |
| **影响** | 违反未成年人保护法 / 数据出境法 |
| **对策** | 未成年人音频**不发送**到未通过 preflight 的 provider;所有 provider 必须签署"不用于训练"承诺 |
| **状态** | UNKNOWN |

---

## R09 · 区域可达性风险

| 项 | 说明 |
|---|---|
| **风险描述** | 部分国际 provider 在国内网络不稳定或需专线 |
| **触发条件** | 选国际 provider 服务国内家庭 |
| **影响** | 延迟高 / 服务中断 |
| **对策** | preflight 核验 `regional_endpoint`;国内主要 provider 优先 |
| **状态** | UNKNOWN |

---

## R10 · 并发通道成本失控

| 项 | 说明 |
|---|---|
| **风险描述** | Realtime Avatar / STT 按并发通道计费,并发上量后成本呈线性甚至阶梯式上涨 |
| **触发条件** | 未做规模成本估算就接入 |
| **影响** | 单月账单超预算 |
| **对策** | 见 `FPAI_MM1B_COST_MODEL_V1.md` §3 场景估算表 |
| **状态** | UNKNOWN |

---

## R11 · SDK 侵入 Principal

| 项 | 说明 |
|---|---|
| **风险描述** | Provider SDK 要求在 Principal / Family Core 里 import 或 monkey-patch |
| **触发条件** | 未遵守 §2 REPLACEABLE 原则 |
| **影响** | 无法替换 provider;vendor lock-in |
| **对策** | 只在 `packages/speech-gateway/providers/*` 或 `packages/avatar-gateway/providers/*` 引 SDK;registry 测试守卫此边界 |
| **状态** | **FROZEN — 架构约束** |

---

## R12 · WebRTC 强制迁移风险

| 项 | 说明 |
|---|---|
| **风险描述** | 某些实时 STT/Avatar 要求 WebRTC 端到端,不接受 server-relay |
| **触发条件** | 选了强 WebRTC 依赖的 provider |
| **影响** | 需重写客户端传输层 |
| **对策** | 保留 WebSocket 为主传输;WebRTC 只作为 provider 直连侧信道,不替换主控 |
| **状态** | UNKNOWN |

---

## R13 · TTS 情感不达标

| 项 | 说明 |
|---|---|
| **风险描述** | Voice Identity 目标是"知性温暖",许多 TTS 输出偏"客服女声" |
| **触发条件** | 未做 Voice Rubric 评分就选型 |
| **影响** | 品牌形象崩溃 |
| **对策** | 走 `FPAI_VOICE_BENCHMARK_RUBRIC_V1.md` 9 维评分,不允许某维度低分且总盘接受 |
| **状态** | UNKNOWN |

---

## R14 · Avatar Uncanny Valley

| 项 | 说明 |
|---|---|
| **风险描述** | Realtime Avatar 表情过度 / 唇形失同步 / 空闲时死板 → uncanny |
| **触发条件** | 未做 Visual Rubric 评分 |
| **影响** | 用户不适、退订 |
| **对策** | 走 `FPAI_VISUAL_BENCHMARK_RUBRIC_V1.md` 10 维评分 |
| **状态** | UNKNOWN |

---

## R15 · Provider 单点故障

| 项 | 说明 |
|---|---|
| **风险描述** | 某 provider 服务中断,整条 pipeline 挂 |
| **触发条件** | 只接 1 家 provider,无 fallback |
| **影响** | 用户对话无法进行 |
| **对策** | Provider Registry 支持**同一 slot 多个 provider + 优先级 fallback**;至少 STT 层准备 2 家可切 |
| **状态** | DESIGN — MM1-B2 落地 |

---

## 汇总

MM1-B0 交付时,15 条风险中:

- `R07 REAL_PERSON_CLONING` = **FROZEN 硬规则**
- `R11 SDK 侵入 Principal` = **FROZEN 架构约束**
- 其余 13 条 = **UNKNOWN**,等 MM1-B1 preflight 逐条填 evidence

**BLOCKERS = 0**(风险登记本身不阻塞 MM1-B0,只阻塞 MM1-B1 preflight 里未评估的 provider)。
