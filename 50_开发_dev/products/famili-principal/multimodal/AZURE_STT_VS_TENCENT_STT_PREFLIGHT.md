# AZURE_STT_VS_TENCENT_STT_PREFLIGHT (MM1-B1 §31)

**用途**: 预飞对比 Tencent Realtime ASR 与本轮参考栈 Azure STT。**不含 SDK 引入,不含 credential**;所有字段以 UNKNOWN 为主,evidence_refs 指向 Tencent Cloud 官方文档路径,**未在本任务中做活体校验**。

> 定位: MM1-B1 = Reference Stack A (Azure)。Tencent 属于后续 MM1-B2 的候选真实商业 provider,本文只是**结构化占位 + 证据链清单**,便于下一轮以最小切换成本迁移。

## 1. Provider Descriptor (Tencent)

```
provider_id:            stt.tencent_asr_realtime
provider_class:         REAL
provider_version:       UNKNOWN
kind:                   STT
```

## 2. Capabilities (T=verified, F=verified-not-supported, U=UNKNOWN)

| 字段 | 值 | 说明 |
|---|---|---|
| realtime_streaming | UNKNOWN | 官方文档声称支持,但未在本任务中活体校验 |
| streaming_partial_transcript | UNKNOWN | |
| streaming_final_transcript | UNKNOWN | |
| supported_sample_rates | UNKNOWN | 常见 8000/16000;需现场核 |
| supported_encodings | UNKNOWN | PCM/OPUS/其他 |
| lang_code_zh_CN | UNKNOWN | |
| interim_words | UNKNOWN | |
| punctuation | UNKNOWN | |
| speaker_diarization | UNKNOWN | |
| dictionary_hotwords | UNKNOWN | |
| endpoint_detection | UNKNOWN | |
| interrupt_cancel | UNKNOWN | 关键:barge-in 是否支持 |
| max_session_seconds | UNKNOWN | |
| concurrent_session_model | UNKNOWN | |
| cancel_latency_p95_ms | UNKNOWN | 未测 |
| first_partial_latency_p95_ms | UNKNOWN | |
| final_latency_after_finish_p95_ms | UNKNOWN | |

## 3. Commercial

| 字段 | 值 |
|---|---|
| commercial_terms_reviewed | UNKNOWN |
| data_retention_policy_known | UNKNOWN |
| training_use_policy_known | UNKNOWN |
| paid_test_required | UNKNOWN (预计 TRUE:Tencent 按秒计费) |
| regional_endpoint | UNKNOWN (预计 ap-guangzhou 等) |
| known_limitations | 待录 |

## 4. Evidence Refs (未活体校验)

- Tencent Cloud ASR 产品概述 (占位): `https://cloud.tencent.com/document/product/1093`
- Realtime ASR API 文档 (占位): `https://cloud.tencent.com/document/product/1093/48982`
- SDK 分发页 (占位): `https://cloud.tencent.com/document/product/1093/35799`

> 上述 URL **未在本任务中访问校验**。真实迁移前必须由人类先访问原文页面、录入实际版本号 / 定价 / 保留策略 / 隐私政策语句。

## 5. 与 Azure STT 的对比 (骨架, 待填)

| 维度 | Azure Speech STT | Tencent ASR |
|---|---|---|
| Realtime streaming | TRUE (§11.A.1) | UNKNOWN |
| Interrupt/cancel | TRUE | UNKNOWN |
| 16kHz PCM 支持 | TRUE | UNKNOWN |
| 中文识别 | TRUE (zh-CN) | UNKNOWN (预计 TRUE) |
| Region 覆盖 | eastasia / eastus 等 | ap-* |
| SDK 分发 | microsoft-cognitiveservices-speech-sdk | tencentcloud-sdk-js / SIG-v1 |
| Voice cloning coupling | NO (STT 与 TTS 分离) | NO |
| 训练数据是否复用 | 见 §11.A.1 (MIXED,需 opt-out) | UNKNOWN |

## 6. 结论 (MM1-B1)

- MM1-B1 不切换到 Tencent。参考栈锁定 = Azure STT。
- 若 MM1-B2 决定引入 Tencent,须先补齐本表 UNKNOWN → TRUE/FALSE,并新建 `packages/speech-gateway/src/providers/tencent/` (对齐 azure/ 的 transport port 模式,禁止 side-effect import SDK)。
- **本文件不构成任何商业承诺;不代表 Tencent 已被评审通过。**
