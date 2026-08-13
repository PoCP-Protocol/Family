# AZURE_TTS_VS_QWEN_TTS_PREFLIGHT (MM1-B1 §32)

**用途**: 预飞对比 Qwen (DashScope / 阿里云百炼) Realtime TTS 系列与参考栈 Azure TTS。**不含 SDK 引入,不含 credential**;字段以 UNKNOWN 为主,evidence_refs 指向 DashScope 官方文档,**未在本任务中活体校验**。

> 定位: MM1-B1 = Reference Stack A (Azure Neural TTS)。Qwen TTS 属于后续 MM1-B2 候选;本文只是**结构化占位**。

## 1. Provider Descriptors (Qwen)

```
provider_id:  tts.qwen3_tts_instruct_flash_realtime
provider_id:  tts.qwen3_tts_vd_realtime
provider_class: REAL
kind: TTS
```

## 2. Capabilities (U=UNKNOWN)

| 字段 | qwen3-tts-instruct-flash-realtime | qwen3-tts-vd-realtime |
|---|---|---|
| realtime_streaming | UNKNOWN (声称支持) | UNKNOWN |
| streaming_audio_chunks | UNKNOWN | UNKNOWN |
| ssml_input | UNKNOWN (可能仅支持自有 prompt DSL) | UNKNOWN |
| viseme_output | UNKNOWN (预计 FALSE — 未见公开 viseme 通道) | UNKNOWN |
| word_boundary_output | UNKNOWN | UNKNOWN |
| audio_formats | UNKNOWN (预计 pcm/mp3/wav) | UNKNOWN |
| sample_rates | UNKNOWN | UNKNOWN |
| voice_catalog | UNKNOWN (需列公开可用声音) | UNKNOWN |
| voice_cloning_supported | UNKNOWN | UNKNOWN (VD 系列命名暗示 voice-design) |
| voice_rights_ownership | UNKNOWN | UNKNOWN |
| style_control | UNKNOWN | UNKNOWN |
| rate_control | UNKNOWN | UNKNOWN |
| pitch_control | UNKNOWN | UNKNOWN |
| pause_control | UNKNOWN | UNKNOWN |
| cancel_supported | UNKNOWN | UNKNOWN |
| first_audio_latency_p95_ms | UNKNOWN | UNKNOWN |
| concurrent_session_model | UNKNOWN | UNKNOWN |

## 3. Commercial

| 字段 | 值 |
|---|---|
| commercial_terms_reviewed | UNKNOWN |
| data_retention_policy_known | UNKNOWN |
| training_use_policy_known | UNKNOWN (可能允许 opt-out) |
| paid_test_required | UNKNOWN (预计 TRUE — DashScope 按 tokens/秒计费) |
| regional_endpoint | UNKNOWN (dashscope.aliyuncs.com) |

## 4. Evidence Refs (未活体校验)

- DashScope 语音合成产品文档 (占位): `https://help.aliyun.com/zh/dashscope/`
- Qwen-TTS 模型分发页 (占位): `https://help.aliyun.com/zh/model-studio/`
- API Reference (占位): `https://help.aliyun.com/zh/dashscope/developer-reference/`

> 上述 URL **未在本任务中访问校验**。

## 5. 与 Azure TTS 的对比 (骨架)

| 维度 | Azure Neural TTS | Qwen Realtime TTS |
|---|---|---|
| Realtime streaming | TRUE (§11.A.2) | UNKNOWN |
| SSML | TRUE | UNKNOWN (可能自有格式) |
| Viseme 22-set | TRUE (SAPI 0..21) | UNKNOWN (预计 FALSE) |
| 中文声音 (zh-CN female) | TRUE (Xiaoxiao/Xiaochen/Xiaohan 等) | UNKNOWN |
| Style control | TRUE (mstts:express-as) | UNKNOWN |
| Voice cloning | 独立服务 Custom Neural Voice,合规审核 | VD 系列命名暗示支持,未证 |
| 训练是否复用 (default opt-in?) | 见 §11.A.2 (MIXED,需 opt-out) | UNKNOWN |
| First-audio latency 目标 | ≤ 600ms (需 §26.A 实测) | UNKNOWN |

## 6. 结论 (MM1-B1)

- MM1-B1 不切换到 Qwen TTS。参考栈锁定 = Azure Neural TTS。
- Qwen 系列缺 **公开 viseme 通道** 是关键差异。若接入,必须落到 L1_AMPLITUDE_FALLBACK,并在 §17 telemetry 中标记 `LIPSYNC_MODE=L1_AMPLITUDE_FALLBACK`。
- **本文件不构成商业承诺;不代表 Qwen 已被评审通过。**
