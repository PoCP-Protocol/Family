# B1 · Live Gate Runbook (MM1-B1.1)

> 本 Runbook **不是自动化脚本**。它是一份 human gate 检查表, 供拥有 Azure Speech 资源的运维人员
> 在本地(或安全的实验环境)运行、观察、并把 evidence 回填到:
> - `products/famili-principal/multimodal/FPAI_MM1B_PROVIDER_SELECTION_V1.md §11.C`
> - `AZURE_JS_TTS_NATIVE_CANCEL_EVIDENCE`
>
> 未经 human gate 确认前, 任何自动化文档 / commit / final report **禁止**声明
> `PROVIDER_NATIVE_CANCEL=PASS` 或 `MM1_B1_REAL_VERTICAL_SLICE=PASS`。

## 0. 硬约束

- 只读 `50_开发_dev/.env`(项目内)。不使用系统级或跨项目 secret。
- 不上传 credential 到 telemetry / crash log / commit。
- 每一步都由人工按 checkbox 勾选。观察项写"YES/NO/UNKNOWN"。
- LIVE_CALL_COUNT 由本 Runbook 明确记录, 与代码测试完全解耦。

## 1. Preflight

- [ ] 从 `.env.example` 复制:
  ```powershell
  Copy-Item .env.example .env
  ```
- [ ] 在 `.env` 里填入(仅本机):
  ```
  FPAI_REAL_SPEECH_ENABLED=YES
  FPAI_AVATAR_PROVIDER=FAMILY_LOCAL_2D
  FPAI_ALLOW_DEV_FAKE_FALLBACK=NO
  FPAI_AZURE_SPEECH_KEY=<你的 key>
  FPAI_AZURE_SPEECH_REGION=<你的 region, e.g. eastasia>
  ```
- [ ] 运行 preflight:
  ```powershell
  pnpm fpai:mm1b1:live
  ```
  期望输出末尾: `[fpai:mm1b1:live] READY`。

## 2. 启动

- 终端 A: `pnpm --filter @family/avatar-lab dev:server`
- 终端 B: `pnpm --filter @family/avatar-lab dev`
- 浏览器: `http://127.0.0.1:4173/mm1b1.html?real_speech=YES`

## 3. Gate 列表

### L1 · 真实 STT partial → final
- 操作: 点击 🎙 开始说话, 念一句 "我们今天要不要读一段《大学》？"
- 观察:
  - [ ] 屏幕能看到 partial transcript
  - [ ] 结束后出现 final transcript
  - [ ] 无异常关闭连接
- Evidence: `REAL_STT_PARTIAL_LATENCY_MS` 首个 partial 距离说话结束(ms) = ______
- Evidence: `REAL_STT_FINAL_TEXT` = _______________

### L2 · 真实 TTS streaming
- 操作: 让 assistant 回一句(≥ 20 字)。
- 观察:
  - [ ] 首个 AUDIO_CHUNK 到达 < 800ms(相对 TTS_STARTED)
  - [ ] 至少 5 段 chunk 连续到达, 无中断
- Evidence: `REAL_TTS_FIRST_AUDIO_MS` = ______

### L3 · 真实 viseme
- 观察:
  - [ ] 每个 chunk 附近都有 viseme 事件
  - [ ] mouth_shape 至少出现 5 种不同值
- Evidence: `REAL_VISEME_DISTINCT_SHAPES` = ______(≥ 5 通过)

### L4 · Local 2D lipsync
- 观察:
  - [ ] Avatar2DRenderer 的 mouth 与音频节拍同步(主观 A/B, 无明显滞后)
  - [ ] `VisemeScheduler.metrics.viseme_late_drop_count` ≤ 5%
- Evidence: `LATE_DROP_PCT` = _____ %

### L5 · 真实 barge-in
- 操作: assistant 讲到一半时点击 ✋ 立即打断。
- 观察:
  - [ ] StreamingAudioPlayer 立即静音(< 100ms)
  - [ ] Avatar state 切到 INTERRUPTED, mouth 回 REST
  - [ ] TTS provider 层收到取消(观察 `PROVIDER_NATIVE_CANCEL` 是否为 native 或 transport-dispose)
- Evidence: `BARGE_IN_STOP_LATENCY_MS` = ______
- Evidence: `PROVIDER_NATIVE_CANCEL_MODE` = one of {NATIVE_STOPSPEAKING, TRANSPORT_DISPOSE_CANCEL}

### L6 · 第二轮独立
- 操作: 立刻发第二个 turn "那我们从哪一段开始？"
- 观察:
  - [ ] 第二轮 turn_id 与第一轮不同
  - [ ] 上一轮残留 chunk 不再影响本轮(无幽灵声)
  - [ ] scheduler 的 `stale_drop_count` 增加

### L7 · 高风险家庭话题触发 Human Gate
- 操作: 输入含"体罚 / 冷战 / 自伤"等 high risk 关键词的 turn。
- 观察:
  - [ ] Avatar state 切到 `HUMAN_GATE`
  - [ ] 状态显示黄色 (#f6a723)
  - [ ] 无自动继续输出敏感建议

### L8 · 两标签同开(session lock)
- 操作: 在两个浏览器标签同时打开 mm1b1.html?real_speech=YES 并各自开麦。
- 观察:
  - [ ] 后开的标签明确提示 session 冲突或降级
  - [ ] 不会出现两个 mic 同时向 server 送流
- Evidence: `MULTI_TAB_BEHAVIOR` = _______________

### L9 · 30-case speech benchmark
- 操作: 按 `products/famili-principal/multimodal/eval/mm1b_speech_30cases.jsonl`
  (若无, 手工 30 case) 跑一轮。
- 观察:
  - [ ] SPEECH_STYLE_MAPPING 命中率
  - [ ] STYLE_FALLBACK_USED 计数
- Evidence: `STYLE_FALLBACK_USED_YES_COUNT` = ______ / 30
- Evidence: `SPEECH_STYLE_MAPPING_HIT_RATE` = ______ %

### L10 · 3-voice benchmark
- 操作: 分别选 zh-CN-XiaoxiaoNeural / zh-CN-YunxiNeural / zh-CN-XiaoyiNeural 各 3 句。
- 观察:
  - [ ] 均能成功 synth
  - [ ] 均能得到 viseme 流
- Evidence: `VOICE_PASS_COUNT` = ______ / 3

## 4. 汇总回填

将本 Runbook 的观察结果按 §11.C 格式追加到:
- `products/famili-principal/multimodal/FPAI_MM1B_PROVIDER_SELECTION_V1.md`

字段包括(至少):
- `AZURE_JS_TTS_NATIVE_CANCEL_EVIDENCE`: `PASS` / `FAIL` / `UNKNOWN_PENDING_LIVE_TEST`
- `LIVE_CALL_COUNT`
- `LIVE_RUN_DATE`
- `L1..L10` 每一项 pass/fail
- 观测异常的原始截图 / 网络 trace(如允许; 注意去除 credential)

只有 §11.C 齐了, 后续 commit / final report 才能把
`MM1_B1_REAL_VERTICAL_SLICE` 从 `BLOCKED_MISSING_CREDENTIAL` 提升到 `PASS`。
