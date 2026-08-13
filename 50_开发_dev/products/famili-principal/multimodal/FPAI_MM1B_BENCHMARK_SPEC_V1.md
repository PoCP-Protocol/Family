# FPAI-MM1B · Benchmark Spec V1

**状态**: DRAFT · MM1-B0
**首版**: 2026-08-13
**上位**: `FPAI_MM1B_PROVIDER_SELECTION_V1.md`
**作用域**: 定义"如何 benchmark 一个 STT / TTS / Avatar / 端到端 realtime pipeline"

---

## 1. 目标

统一测量点、指标、utterance 集、评分规则,让不同 provider 的评测结果**可比较**、**可重复**、**machine-readable**。

MM1-B0 的目标是把 harness 跑通(Fake baseline),**不产出真实 provider 商业结论**。

---

## 2. Benchmark 类别

| 类别 | 输入 | 输出 |
|---|---|---|
| **STT Benchmark** | 音频文件(或注入文本模拟) → STT provider | `asr_partial_ms`、`asr_final_ms`、`wer(如可算)`、`vad_accuracy(如可算)` |
| **TTS Benchmark** | 文本 → TTS provider | `tts_first_audio_ms`、`tts_complete_ms`、`chunk_count`、`viseme_provided`、`timing_provided` |
| **Avatar Benchmark** | Performance Plan + 音频(或 viseme) → Avatar provider | `avatar_first_motion_ms`、`avatar_cancel_ms`、`identity_stability_score(人工)` |
| **Realtime E2E Benchmark** | 完整对话流 (utterance → 用户看到 avatar 讲完) | `turn_first_response_ms`、`overall_barge_in_ms`、`schema_validation` |

---

## 3. 测量点(与 Provider Selection §6 一致)

```
T0  user speech starts               (utterance 播放起点或注入起点)
T1  ASR first partial                (STT 第一次 TRANSCRIPT_PARTIAL)
T2  ASR final                        (STT TRANSCRIPT_FINAL)
T3  Principal start                  (orchestrator dispatch principal.generateStreaming)
T4  Principal result                 (PRINCIPAL_RESPONSE 发出)
T5  TTS request                      (orchestrator 调 speech.synthesizeStream)
T6  TTS first audio                  (第一个 AUDIO_CHUNK / TTS_STARTED 音频到达)
T7  Avatar first motion              (第一个 AVATAR_EVENT != PERFORMANCE_STARTED 且带 motion)
T8  speech complete                  (TTS_COMPLETE)

INTERRUPT_T0  客户端发 INTERRUPT / cancelTurn 时间
INTERRUPT_T1  TTS_ERROR('tts-cancelled') 到达时间
INTERRUPT_T2  AVATAR_EVENT('PERFORMANCE_CANCELLED') 到达时间
```

所有时间戳:客户端本地 `performance.now()` 或 server side `Date.now()`,harness 必须**记录时钟来源**(避免跨机器比较)。

---

## 4. 派生指标(必须在 harness 中实现)

```
asr_partial_ms          = T1 - T0
asr_final_ms            = T2 - T0
principal_ms            = T4 - T3
tts_first_audio_ms      = T6 - T5
avatar_first_motion_ms  = T7 - T5
turn_first_response_ms  = T6 - T0    # 用户开口 → 听到第一段音
tts_cancel_ms           = INTERRUPT_T1 - INTERRUPT_T0
avatar_cancel_ms        = INTERRUPT_T2 - INTERRUPT_T0
overall_barge_in_ms     = max(tts_cancel_ms, avatar_cancel_ms)
```

**统计**:
- p50、p95、p99
- 每个 utterance 的单次值
- 每次 benchmark 运行的 mean/stddev

---

## 5. Utterance Suite

至少 30 个中文家庭场景 utterance,分成 8 类:

| 类别 | 数量 | 举例 |
|---|---|---|
| 普通话正常语速 | 6 | "我今天下班晚了,能不能你先去接孩子" |
| 快速说话 | 4 | (同上文本 + `speed=fast`) |
| 停顿 / 犹豫词 | 4 | "嗯...就是那个...孩子最近...怎么说呢" |
| 轻微方言口音 | 3 | (北方腔 / 川渝腔 变体,合成或授权录音) |
| 中英混说 | 3 | "他 iPad 玩太久了,homework 都没做" |
| 数字 / 时间 | 3 | "下午三点半、七十五分、二零二六年" |
| 家庭日常场景词 | 4 | "手机、作业、辅导班、家长会、跟他讲道理" |
| 高风险关键词 | 3 | (触发 HIGH_RISK 分类的场景,如 §MM1-A3 已有的 3 条 fixture) |

**数据规矩**:
- 禁止使用**真实孩子隐私音频**
- 允许:开发者自录、合成音频、经授权的内部测试音频
- 每条 utterance 必须携带 `intended_route: NORMAL | REVIEW | HIGH_RISK`,便于分类断言

Utterance suite 的实际文件:`packages/fpai-multimodal-benchmark/fixtures/utterances.zh.json`(MM1-B0 里包含 seed 集,后续可扩到 30+)。

---

## 6. Voice Rubric(TTS Benchmark 人工评分)

参见 `FPAI_VOICE_BENCHMARK_RUBRIC_V1.md`。9 个维度,每个 1–5 分,不做总分。

---

## 7. Visual Rubric(Avatar Benchmark 人工评分)

参见 `FPAI_VISUAL_BENCHMARK_RUBRIC_V1.md`。10 个维度,每个 1–5 分,不做总分。

---

## 8. 输出格式

Harness 每次运行输出**两份**:

### 8.1 Machine-readable (`benchmark.result.json`)

```json
{
  "harness_version": "0.1.0",
  "run_id": "run-2026-08-13T00:00:00Z-xxx",
  "provider_class": "FAKE_BASELINE" | "REAL",
  "stt": { "provider_id": "...", "metrics": { "asr_partial_ms": {"p50":..., "p95":...}, ... } },
  "tts": { "provider_id": "...", "metrics": { "tts_first_audio_ms": {...}, ... } },
  "avatar": { "provider_id": "...", "metrics": { "avatar_first_motion_ms": {...}, ... } },
  "e2e": { "metrics": { "turn_first_response_ms": {...}, "overall_barge_in_ms": {...} } },
  "utterance_count": 30,
  "notes": [ "..." ]
}
```

### 8.2 Human-readable (`benchmark.result.md`)

Markdown summary,人可以直接读。

---

## 9. Fake Baseline

MM1-B0 用 `FakeSttProvider` + `FakeTtsProvider` + `FakeAvatarProvider`(封装现有 `FakeSpeechToTextGateway` 等)跑一次完整 benchmark:

- `provider_class = FAKE_BASELINE`
- 输出 `benchmark.result.json` 和 `benchmark.result.md`
- **不得**将 fake 结果与真实 provider 结果横向对比得出商业结论

**Fake baseline 的存在只用于**:
1. 验证 harness 本身能跑
2. 建立各字段的示例值(如 `viseme_provided=true`、`timing_provided=false`)
3. 提供回归基线,防止 harness 本身劣化

---

## 10. Harness 责任分层

```
packages/fpai-multimodal-benchmark/
  src/
    metrics.ts          # 计时器、p50/p95、时间点定义
    runner.ts           # 组合 provider,跑 utterance suite
    stt.harness.ts
    tts.harness.ts
    avatar.harness.ts
    e2e.harness.ts
    reporters/
      json.ts           # 8.1 输出
      markdown.ts       # 8.2 输出
    fakeProviders.ts    # 引用 speech-gateway/avatar-gateway 的 Fake
  fixtures/
    utterances.zh.json  # seed utterances
```

- **不引入 provider-specific SDK**
- **不发起真实网络请求**
- **不读取 process.env 中的真实 key**

Real provider 接入是 MM1-B1 的事,那时新增 `packages/fpai-*-provider-<name>/`,harness 通过 `ProviderRegistry.lookup(id)` 拿到 factory,harness 本身**不变**。

---

## 11. Regression Guarantee

Benchmark Harness 必须提供:
- Fake baseline `benchmark.spec.ts`:确保跑通 harness 且指标字段完整
- 输出 schema 校验:`benchmark.result.json` 必须满足 §8.1 schema

若 MM1-B0 之后有人改 provider registry 或 gateway,harness 测试必须仍 PASS,否则回归失败。
