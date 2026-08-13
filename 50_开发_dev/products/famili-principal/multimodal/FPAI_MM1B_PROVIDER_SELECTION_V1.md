# FPAI-MM1B · Real Provider Selection SSOT V1

**状态**: DRAFT · Living Document (MM1-B0)
**首版**: 2026-08-13
**上位**: `d:/Family/CLAUDE.md` §一,§三；`50_开发_dev/CLAUDE.md`；`FPAI_MULTIMODAL_ARCHITECTURE_V1.md`
**授权**: MM1-B0 = Provider Selection + Benchmark Foundation。**本文件不授权任何真实厂商生产接入**。
**Baseline**: `feature/fpai-multimodal-ip-mm1` @ `371b192a4f9a2fc7ebb8ea169fe95d49645ec7d9` (MM1-A CLOSED)

---

## 0. 目的

在 provider-neutral 的 FPAI-MM runtime 已经闭合(MM1-A PASS)之后,为**真实** STT/TTS/Avatar/Lip-sync 建立:

1. 统一 **Provider Capability Contract**(能力描述模型,可机器读)
2. **Benchmark Harness**(以 Fake baseline 先跑通)
3. **Selection Matrix**(候选表,基于官方证据)
4. **Lab Adapter Slot**(供未来接真实 provider 的空位)

本文件回答的问题:
- 我们的 Voice / Visual / Motion IP 目标是什么?
- 一个真实 Provider 要成为候选,必须提供哪些能力?
- 我们的候选是谁,证据在哪?
- 第一次真实 Vertical Slice 应该选哪一套?

**本文件不回答**:
- 具体某个 SDK 怎么接
- 某个厂商 API key 从哪来
- 什么时候上生产
以上留给 MM1-B1 及之后阶段,由总架构师另行授权。

---

## 1. 冻结前置条件

以下 MM1-A 能力**冻结**,MM1-B 之后任何 Provider 接入都必须**适配这些**,而不是让 runtime 迁就 Provider:

| 能力 | 位置 | 状态 |
|---|---|---|
| Authoritative Principal | `packages/principal-ai` | FROZEN |
| Realtime Orchestrator | `products/famili-principal/apps/avatar-lab/src/orchestrator.ts` | FROZEN |
| WebSocket Session | `products/famili-principal/apps/avatar-lab/src/realtimeServer.ts` | FROZEN |
| server-authoritative session_id / turn_id / generation_id | 同上 | FROZEN |
| Performance Planner | `packages/fpai-performance-planner` | FROZEN |
| Barge-in (interrupt + stale-drop) | orchestrator + client | FROZEN |
| High Risk Human Gate | orchestrator | FROZEN |
| Multi-client isolation | realtimeServer(每 WS 一个 session) | FROZEN |
| Browser Contract | `apps/avatar-lab/src/{index.html, client.ts}` | FROZEN |

**推论**:

- Provider 是 **replaceable**,以上是 **family-owned**。
- 任何 Provider-specific SDK 不得进入 `packages/principal-ai` / Family Core。
- 只允许在 `packages/speech-gateway/providers/*` 和 `packages/avatar-gateway/providers/*` 内落地。

---

## 2. 核心原则(冻结)

```
MODEL PROVIDER     = REPLACEABLE
STT PROVIDER       = REPLACEABLE
TTS PROVIDER       = REPLACEABLE
AVATAR PROVIDER    = REPLACEABLE
TRANSPORT PROVIDER = REPLACEABLE

PRINCIPAL SOUL      = FAMILY OWNED
VOICE IDENTITY      = FAMILY OWNED
VISUAL IDENTITY     = FAMILY OWNED
MOTION IDENTITY     = FAMILY OWNED
PERFORMANCE GRAMMAR = FAMILY OWNED
```

任何 Provider-specific SDK **不得**进入 Principal AI、不得进入 Family Core、不得成为业务合同。

---

## 3. 用户实际体验目标(MM1-B 最终真实版)

```
用户自然说话
  → Streaming ASR partial
  → Final Transcript
  → Authoritative Principal
  → Performance Planner
  → Streaming TTS first audio
  → Lip-sync / Avatar motion
  → 用户随时打断
  → audio + avatar 快速停止
  → 下一轮继续
```

Provider 选择标准**不是** "demo 漂亮",而是:

- 实时性
- 中文质量
- 情感表达
- 可打断性
- 时间戳能力
- Avatar 控制能力
- 商业授权
- 成本
- 稳定性
- 可替换性

---

## 4. 不合并 TTS + Avatar

**默认**采用独立 TTS + 独立 Avatar 组合:

```
Principal → Performance Planner → Independent TTS + Independent Avatar
```

只有**某套 integrated provider 经过 benchmark 显著更优**时,才允许进入候选。理由:避免 vendor lock-in,Voice IP 与 Visual IP 独立演进,便于分别替换。

---

## 5. Lip-sync 策略矩阵

| 策略 | 描述 | latency | 中文质量 | interrupt | provider 依赖 | 实现复杂度 | GPU 要求 |
|---|---|---|---|---|---|---|---|
| **L1 Audio amplitude** | 幅度驱动张合嘴 | **~10ms** | 低(不区分音素) | 立即停 | 无 | 低 | 无 |
| **L2 Audio-driven neural** | 神经网络从音频推断 viseme | 100~500ms | 中(取决于模型) | 中(需 flush pipeline) | 依赖 lipsync model | 中 | 中(可能需 GPU) |
| **L3 Phoneme / timestamp** | TTS 直出音素/字级时戳,前端映射 viseme | ~50ms | 高(与音频对齐) | 立即停 | **需 TTS 提供 timing** | 中 | 无 |
| **L4 Viseme driven** | TTS 直出 viseme 序列 | ~30ms | 最高(TTS 保证一致) | 立即停 | **需 TTS 提供 viseme** | 低 | 无 |

**MM1-B 第一真实版优先**:**L3 或 L4**,取决于 TTS 供应商的 timing/viseme 能力。**L2 保留为 fallback**,仅在 TTS 无 timing 时启用。**L1 只作为 emergency degrade**。

---

## 6. Realtime Latency Budget

统一测量点定义(参见 `FPAI_MM1B_BENCHMARK_SPEC_V1.md` §3):

```
T0  user speech starts
T1  ASR first partial
T2  ASR final
T3  Principal start
T4  Principal result
T5  TTS request
T6  TTS first audio
T7  Avatar first motion
T8  speech complete

INTERRUPT_T0  user interrupts
INTERRUPT_T1  TTS stopped
INTERRUPT_T2  Avatar stopped
```

派生指标:
- `asr_partial_ms = T1 - T0`
- `asr_final_ms = T2 - T0`
- `principal_ms = T4 - T3`
- `tts_first_audio_ms = T6 - T5`
- `avatar_first_motion_ms = T7 - T5`
- `turn_first_response_ms = T6 - T0`
- `tts_cancel_ms = INTERRUPT_T1 - INTERRUPT_T0`
- `avatar_cancel_ms = INTERRUPT_T2 - INTERRUPT_T0`
- `overall_barge_in_ms = max(tts_cancel_ms, avatar_cancel_ms)`

**Lab engineering target(非市场承诺)**:
- P50 first responsive voice: `< 1500 ms`
- P95 first responsive voice: `< 2500 ms`
- P95 barge-in cancel: `< 300 ms`

必须**实测**。不得因 Fake runtime `6.5ms` 就推断真实 provider 有等同性能。

---

## 7. STT Shortlist(候选,基于**待核验**的官方文档)

**证据规矩**: 每个候选的能力字段必须来源于**官方 documentation / API spec / pricing / commercial license**。**博客/论坛/AI 记忆不可作最终 capability truth**。凡未在本 SSOT 中标注 `evidence_ref`(官方链接 URL 或文档标题)的字段,视为 `UNKNOWN`。

**MM1-B0 阶段本表不做官方文档验证**(那属于 MM1-B1 preflight)。以下候选列出的是"值得走进 MM1-B1 preflight 官方核验"的名单,理由是它们**在生态内以中文实时 ASR 场景被公开列名**。字段全部标 `UNKNOWN`,由 MM1-B1 preflight 填充官方证据。

### 候选(每类 3–5 个)

| provider_id 建议 | 位置 | 备注 |
|---|---|---|
| `stt.aliyun_paraformer_realtime` | 阿里云 语音识别 Paraformer 实时 | 中文实时流式常见列名 |
| `stt.tencent_asr_realtime` | 腾讯云 实时语音识别 | 中文实时流式常见列名 |
| `stt.iflytek_iat` | 讯飞 语音听写(流式版) | 中文 ASR 生态常见列名 |
| `stt.azure_speech_realtime` | Azure Speech to Text · Real-time | 国际候选,中文 zh-CN locale |
| `stt.deepgram_nova` | Deepgram Nova(如中文覆盖足够) | 国际候选,mixed_cn_en 待验 |

**每个候选的详细字段**:见 §11 STT Descriptor 空表模板。**所有 field 默认 UNKNOWN**,由 MM1-B1 preflight 填。

### RECOMMENDED_STT_TEST_CANDIDATES (MM1-B0 推荐 preflight 首批 2 家)

**方向建议(非商业结论)**:优先 `stt.aliyun_paraformer_realtime` 与 `stt.tencent_asr_realtime`,因为它们在**中文实时流式 + 商用区域可达性**上是国内团队的常见起点。**这只是"值得优先做 preflight 官方核验"的建议**,一旦 MM1-B1 preflight 发现商业条款或实时能力不匹配,立即替换。

---

## 8. TTS Shortlist(候选,基于**待核验**的官方文档)

同样的证据规矩。以下是"值得走 MM1-B1 preflight 官方核验"的名单,字段全部标 `UNKNOWN`。

| provider_id 建议 | 位置 | 备注 |
|---|---|---|
| `tts.minimax_speech_02` | MiniMax Speech(如支持 streaming + emotion) | 国内情感 TTS 生态常被列名 |
| `tts.aliyun_cosyvoice` | 阿里 CosyVoice / TTS realtime | 中文情感与 emotion label 常被列名 |
| `tts.bytedance_volc_tts` | 火山引擎 语音合成(流式) | 中文实时 TTS 生态常被列名 |
| `tts.azure_tts_neural` | Azure Neural TTS(zh-CN) | 有 word/phoneme timing 与 SSML |
| `tts.elevenlabs_multilingual` | ElevenLabs Multilingual(如中文质量达标) | 情感/克隆能力常被列名,商用条款待验 |

### RECOMMENDED_TTS_TEST_CANDIDATES (MM1-B0 推荐 preflight 首批 2–3 家)

**方向建议**:优先 `tts.minimax_speech_02` + `tts.aliyun_cosyvoice` + `tts.azure_tts_neural`。选择理由:
1. 前两者的**中文情感与 emotion 控制**是 Voice IP "知性温暖" 的关键
2. `tts.azure_tts_neural` 通常公开有 **word/phoneme timing + viseme**,能直接支撑 **L3/L4 lip-sync**

**这些结论待 MM1-B1 preflight 用官方文档验证。**

---

## 9. Avatar Shortlist(候选,基于**待核验**的官方文档)

同样的证据规矩。

| provider_id 建议 | renderer_type | 备注 |
|---|---|---|
| `avatar.heygen_realtime` | VIDEO_GENERATIVE / cloud | Interactive Avatar 常被列名 |
| `avatar.did_agents_realtime` | VIDEO_GENERATIVE / cloud | Real-Time Streaming Avatars 常被列名 |
| `avatar.sensetime_xiaohui` | HYBRID / cloud | 商汤如影,国内 realtime 常被列名 |
| `avatar.readyplayerme_local_l1l3` | 3D / local (Three.js) | 本地渲染 + 我们自绘 L3 lip-sync |
| `avatar.local_2d_l1l3` | 2D / local | 本地静态形象 + L1/L3 lip-sync,identity_lock=YES |

### RECOMMENDED_AVATAR_TEST_CANDIDATES (MM1-B0 推荐 preflight 首批 2–3 条路线)

**方向建议**:
1. `avatar.did_agents_realtime` / `avatar.heygen_realtime` —— 快速拿到 realtime 云端 avatar,验证 first_motion 与 interrupt latency;但 **identity_lock、commercial_license、data_retention 三项必须 preflight 前先核验**
2. `avatar.local_2d_l1l3` —— **最保险的备选**,identity 完全由 Family 拥有,不依赖任何云厂商;缺点是表现力弱
3. `avatar.readyplayerme_local_l1l3` —— 3D 本地 + 自绘 lip-sync,identity 由 Family 拥有,视觉更强

**"知性邻家姐姐" 的 identity 归属决定这一层不能过早锁死云端厂商**。这就是为什么本 shortlist 同时保留**本地渲染路线**。

---

## 10. Lip-sync Strategy Recommendation

结合 §5 矩阵 + §8 候选 + §9 候选,MM1-B 第一真实 Vertical Slice 的推荐:

```
RECOMMENDED_LIPSYNC_STRATEGY = L3 (phoneme / timestamp driven)
                               fallback -> L1 (audio amplitude)
```

理由:
- 若 TTS 候选(Azure/CosyVoice/MiniMax)中至少一家在 preflight 中确认 **word_timing 或 phoneme_timing 公开可用**,即可实现 L3。
- L3 满足**低 latency + 可 cancel + 与音频对齐**三大要求,是"实时可打断家庭对话"场景的最佳折衷。
- L1 作为 fallback,当 TTS 未提供 timing 时前端仍能出嘴形。
- **L2 (audio-driven neural)** 保留为长期演进方向,但引入模型 latency 与 GPU 依赖,**不作为第一版**。
- **L4 (viseme driven)** 是最优,但对 TTS 侧要求最高;若候选 preflight 显示公开 viseme,可直接跳到 L4。

---

## 11. Descriptor 空表模板

参见 `packages/speech-gateway/providers/registry.ts`、`packages/avatar-gateway/providers/registry.ts` 中的 `SttProviderDescriptor`、`TtsProviderDescriptor`、`AvatarProviderDescriptor` 类型定义。

每个候选在 MM1-B1 preflight 时**必须**填写至少:
- `evidence_ref` (官方文档 URL / 官方 spec 版本号 / 官方 pricing 页 / 官方 commercial license 文档)
- 已核验的 boolean/enum 字段
- 未核验字段一律 `UNKNOWN`

---

## 12. Realtime Transport Recommendation

`RECOMMENDED_REALTIME_TRANSPORT = WebSocket (unchanged)`

- 当前 avatar-lab 前端 ↔ realtimeServer 是 `ws://127.0.0.1:8765`,已经在 MM1-A 4 Gates 全绿。
- 客户端 → server 是 **文本 + 控制事件**,不含大流量音频,WebSocket 足够。
- 若未来某 STT provider **要求** WebRTC 端到端(把用户麦克风原始 PCM 直接给到云端),那也是**浏览器 → provider 直连的独立通道**,不是我们 server ↔ client 通道的替代。这种情况下需要新增 `TRANSPORT_PROVIDER = WebRTC` 适配槽,但**现有 WS session 主控不变**。

---

## 13. RECOMMENDED_FIRST_REAL_STACK(仅方向建议,待架构师裁决)

在**总架构师授权 MM1-B1 之前**,以下只是"如果要接第一套真实 stack,方向可能是这样":

```
STT     : stt.aliyun_paraformer_realtime  (或 stt.tencent_asr_realtime)
TTS     : tts.azure_tts_neural            (因公开 word/phoneme timing → 支持 L3)
Avatar  : avatar.local_2d_l1l3            (identity 由 Family 拥有,最保险起步)
Lip-sync: L3 driven by TTS timing         (fallback L1 amplitude)
Transport: WebSocket (unchanged)
```

**这不是决定**,仅供架构师阅读。真正的 vertical slice 选型必须走 MM1-B1 preflight + benchmark 之后再定。

---

## 14. 什么必须由 Family 自己拥有

MM1-B0 冻结的 "family-owned" 边界:

1. **Voice Identity** (定义"法咪莉之声" 的音色/情感基线;所有 TTS provider 只是"合成载体")
2. **Visual Identity** (定义 "知性邻家姐姐" 的形象基线;所有 Avatar provider 只是"渲染载体")
3. **Motion / Performance Grammar** (Performance Planner 输出的 tone/pace/expression/gesture DSL)
4. **Principal Soul** (`packages/principal-ai` 中的规则与安全护栏)
5. **Realtime FSM & Barge-in Semantics** (`orchestrator.ts` 的状态机)
6. **Consent / Data Retention Contract** (决定哪些音频/视频/文本能出境、能给哪家 provider、保留多久)

任何 provider 都**不得**成为以上任何一项的**唯一实现**。

---

## 15. 不做

MM1-B0 明确**不做**:

- 购买 API / 充值 / 提交信用卡
- 上传真实家庭音频
- 申请 voice clone / face clone
- 把 API key 写入代码或提交 `.env`
- 训练模型
- 接任何真实 provider(即使是免费额度)

以上必须**MM1-B1 由总架构师另行授权**。

---

## 16. 交叉引用

- `FPAI_MM1B_BENCHMARK_SPEC_V1.md` — 测量点与指标定义
- `FPAI_MM1B_COST_MODEL_V1.md` — 成本假设与单价模型
- `FPAI_MM1B_PROVIDER_RISK_REGISTER_V1.md` — 已知风险登记
- `FPAI_VOICE_BENCHMARK_RUBRIC_V1.md` — 声音质量评分
- `FPAI_VISUAL_BENCHMARK_RUBRIC_V1.md` — 视觉质量评分
- `packages/speech-gateway/src/providers/registry.ts` — STT/TTS 能力契约代码
- `packages/avatar-gateway/src/providers/registry.ts` — Avatar 能力契约代码
- `packages/fpai-multimodal-benchmark/` — Benchmark Harness

---

## 17. 变更记录

| 版本 | 日期 | 变更 | 责任 |
|---|---|---|---|
| V1 | 2026-08-13 | MM1-B0 初版。列 shortlist 但**所有 provider capability 字段 = UNKNOWN**,等 preflight 填 evidence_ref。 | family-task-executor |
