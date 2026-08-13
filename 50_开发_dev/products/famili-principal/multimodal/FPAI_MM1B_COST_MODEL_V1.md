# FPAI-MM1B · Cost Model V1

**状态**: DRAFT · MM1-B0
**首版**: 2026-08-13
**上位**: `FPAI_MM1B_PROVIDER_SELECTION_V1.md`
**证据规矩**: 所有单价必须来源于官方 pricing 页面。**MM1-B0 阶段本文件不填真实单价**,只提供计费单位与场景估算公式,由 MM1-B1 preflight 用 `evidence_ref` 填充。

---

## 1. 计费单位(通用)

| 品类 | 常见计费单位 | 备注 |
|---|---|---|
| **STT** | 秒 / 分钟 / 小时 音频输入 | 部分厂商按并发通道另收 |
| **TTS** | 字符数 / 千字符 / 秒音频输出 | 情感/克隆音色可能溢价 |
| **Avatar** | 秒 视频输出 / 分钟对话 / 并发通道 | Realtime 通道价格 >> 离线渲染 |
| **Lip-sync 模型** | GPU 秒 / 请求数 | 若使用云端 lipsync,单独计;本地 L1/L3 免费 |
| **Transport** | 流量 (GB) / 并发连接 | WS 通常包含在应用 SLA 内 |
| **Voice clone** | 一次性建模费 + 每分钟溢价 | 涉及真人授权时另议 |
| **Custom Avatar** | 一次性建模费 + 使用溢价 | 涉及真人肖像权时另议 |

---

## 2. 场景 · 一次完整对话轮的成本参数

一轮"用户说 → 校长听 → 想 → 说 → 打断/结束"通常耗:

```
STT     : ~5–15 秒 音频输入
Principal: 500–3000 tokens (取决于场景,但当前 deterministic-fallback 无 token 成本)
TTS     : 40–200 字符 输出 → ~3–20 秒音频
Avatar  : ~3–20 秒 视频输出(若云端 realtime avatar)
```

成本估算公式(单轮):

```
cost_turn = stt_seconds * STT_UNIT_PRICE
          + tts_chars   * TTS_UNIT_PRICE
          + avatar_seconds * AVATAR_UNIT_PRICE
          + (optional) principal_tokens * MODEL_UNIT_PRICE
```

**MM1-B0 不填 UNIT_PRICE**。UNIT_PRICE 空表模板:

| provider_id | UNIT | UNIT_PRICE_CNY (or USD) | REGION | evidence_ref | 生效日期 |
|---|---|---|---|---|---|
| stt.aliyun_paraformer_realtime | 秒 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| stt.tencent_asr_realtime | 秒 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| stt.azure_speech_realtime | 秒 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| tts.minimax_speech_02 | 千字符 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| tts.aliyun_cosyvoice | 千字符 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| tts.azure_tts_neural | 百万字符 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| avatar.did_agents_realtime | 分钟 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| avatar.heygen_realtime | 分钟 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| avatar.sensetime_xiaohui | 分钟 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| avatar.local_2d_l1l3 | — | 0 (本地) | 本地 | 本包源码 | 2026-08-13 |

---

## 3. 场景估算维度

| 场景 | 每日活跃家长数 | 每人日均对话轮数 | 每日总轮数 | 备注 |
|---|---|---|---|---|
| A · 内部 lab | 5 | 5 | 25 | 完全内部测试 |
| B · Alpha 小圈 | 30 | 10 | 300 | 邀请制家庭 |
| C · Beta | 200 | 8 | 1600 | 有限公测 |
| D · GA v1 | 2000 | 6 | 12000 | 正式发布 |

**cost_per_day = 每日总轮数 × cost_turn**

MM1-B1 之后填。

---

## 4. 成本敏感项(必须在 provider 选择时权衡)

1. **Realtime Avatar 是最贵项**(通常按分钟计,~$0.05–0.3/min)
2. **TTS 情感版通常比标准版溢价 2–5×**
3. **STT 并发通道费**在多家庭并发时容易失控
4. **Voice clone 一次性费用**可能是 $30–500/音色
5. **Custom Avatar 建模费**可能是 $500–5000

**MM1-B0 结论**:

- Avatar 层从 `avatar.local_2d_l1l3` 起步(**成本 0**),识别真实 provider 是否值得溢价
- TTS 层若情感能力可达,优先"情感版";若不达标,退化到"标准版 + Performance Planner 补足 pacing/pause"

---

## 5. 成本红线(engineering guardrail,非市场承诺)

以下红线在 MM1-B1 preflight 时用于**淘汰候选**:

| 项 | 红线 |
|---|---|
| 单轮 cost | > 0.2 元人民币 → 需明确 ROI |
| Realtime Avatar 分钟价 | > 1 元 → 优先本地路线 |
| STT 每 1000 秒 | > 5 元 → 谨慎 |
| TTS 每千字符 | > 3 元 → 谨慎(情感版可放宽到 8 元) |

**红线基于目前的营收假设**,可能随产品阶段调整。

---

## 6. 输出

真实 provider preflight 完成后,更新本文件的 §2 空表,并在 `packages/fpai-multimodal-benchmark/` 里产出 `cost.snapshot.json`。

MM1-B0 不产出。
