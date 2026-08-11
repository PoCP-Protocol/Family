# M3-101B — Real External Model Runtime Gate

date: 2026-08-11
baseline: 承接 M3-101A(A→B→C)全部 PASS_CLOSED。
isolation: branch `m3/fpai-runtime-readiness` @ worktree `D:\Family-m3-fpai-runtime`。
scope: 101B 首次接入**真实外部模型**(cc switch 本地代理 → Anthropic `/v1/messages`,模型 `claude-opus-4-8`,IBM ICA/Bedrock 后端)。用户显式授权 `REAL_MODEL_CALLS>0`(含 live 外部调用)。

## 授权与边界
```
用户裁决:101B 全量含 live 外部调用(REAL_EXTERNAL_MODEL_CALL = AUTHORIZED,由用户本轮明确批准)。
真实调用仅在 env-gate FPAI_PRINCIPAL_PROVIDER=real 时开启;缺省(CI/测试/生产未配置)= 确定性回退,零外部调用。
API keys(cc switch/智谱)仅在本机 gitignored .env,未入库。
```

## 核心安全不变量(本轮实测证明)
```
1. HIGH_RISK 危机输入【绝不】到达外部模型 —— runPrincipalTextMvp 在 precheck=HIGH_RISK 时短路,根本不调用 gateway。
   LIVE 实测:输入“孩子说不想活了”→ model_provider=deterministic-fallback(非 anthropic-compatible)、转人工、无响应。
2. FAIL CLOSED —— 模型超时/网络/4xx/5xx/非法 JSON/ schema 不过:AiGatewayError 分类 + 绝不返原始文本;
   schema 不过 → FAIL_CLOSED 降级 REVIEW 安全响应,不生成 proposal。
3. AI 绝不写 canonical —— 真实模型只产结构化陪练文本;LIVE 实测 growth_actions 零写。
4. 单一接入点 —— 业务只经 runPrincipalTextMvp(已单测)→ Gateway;业务模块不直连 provider(AI_GATEWAY_POLICY)。
```

## 判定
```
ENV_GATED_PROVIDER          = PASS   # PrincipalModule factory:FPAI_PRINCIPAL_PROVIDER=real → createAiGatewayFromEnv(AnthropicAiGateway);否则 null → 确定性回退
SINGLE_ENTRY_ORCHESTRATION  = PASS   # handleMessage 委托 runPrincipalTextMvp(input, gateway);删除重复的手写 precheck/postcheck/validate
HIGH_RISK_NO_MODEL_CALL     = PASS   # LIVE:危机输入 model_provider=deterministic-fallback(未调用外部模型)+ 转人工
REAL_MODEL_CALL             = PASS   # LIVE:NORMAL 输入 model_provider=anthropic-compatible、model=claude-opus-4-8、schema=PASS、latency≈16s
STRUCTURED_OUTPUT_VALIDATED = PASS   # 真实输出经 PRINCIPAL_AI_OUTPUT_SCHEMA 校验 + validatePrincipalOutput;one_small_action 有值
FAIL_CLOSED_TAXONOMY        = PASS   # AnthropicAiGateway:TIMEOUT/NETWORK/4XX/5XX/INVALID_JSON;schema/JSON 失败不返原始文本(ai-gateway 单测 16/16)
GROWTH_ZERO_WRITE           = PASS   # LIVE:真实模型回合 growth_actions=0
CI_OFFLINE_DETERMINISTIC    = PASS   # 默认 gateway=null;live 测试文件命名 .livecheck.ts 不匹配 *.spec/*.e2e-spec,CI 永不收集/永不外呼
REAL_MODEL_CALLS            = >0     # 本轮 LIVE 已真实外呼(用户授权)
CROSS_PROVIDER_FALLBACK     = NO     # 仍单网关,retry=0,无跨 provider fallback

M3_101B                     = PASS
```

## 证据(本轮实测)
- **LIVE 冒烟(真实 cc switch,fresh `family_m3_test`)**:`2/2 PASS`
  - `[LIVE] provider=anthropic-compatible model=claude-opus-4-8 route=NORMAL schema=PASS latency=16050ms`;one_small_action 有值;growth_actions=0。
  - HIGH_RISK“不想活了”→ human_handoff=true、response_id=null、model_provider=`deterministic-fallback`(**危机未外呼**)。
  - 直连验证:`POST {cc switch}/v1/messages` → HTTP 200,合法 JSON(`msg_bdrk_...`,claude-opus-4-8)。
- **离线全量(gateway=null,零外部调用)**:full e2e `11 文件 / 75 PASS`(live 文件未被收集,仍 11 文件);api 单测+集成 `26 / 119 PASS`。
- **typecheck + build(@family/api)**:PASS。
- ai-gateway 单测(A5 失败分类/超时/多模态)先前 `16/16`;principal-ai `14/14`(runPrincipalTextMvp 编排含 HIGH_RISK 短路 + FAIL_CLOSED)。

## 新增/改动文件
- `apps/api/src/modules/principal/principal.service.ts`(委托 runPrincipalTextMvp + @Optional 注入 PRINCIPAL_AI_GATEWAY + token 导出)
- `apps/api/src/modules/principal/principal.module.ts`(env-gated gateway factory)
- `apps/api/src/modules/principal/principal.e2e-spec.ts`(provider 断言 → deterministic-fallback)
- `apps/api/src/modules/principal/principal-live.livecheck.ts`(LIVE 冒烟,CI 排除)

## 结论
```
M3_101B = PASS  →  Famili Principal 真实外部模型 Runtime 打通(env-gated),安全门/FAIL CLOSED/canonical 隔离全部保持。
默认仍确定性、零外呼;真实调用需显式 FPAI_PRINCIPAL_PROVIDER=real + ANTHROPIC_BASE_URL/AUTH(本机 .env)。
下一步候选(待授权):多模态(智谱 GLM-4V / cc switch 图片)接入 images 通道;或 REVIEW 路由的人工复核工作流;或生产环境 provider 配置与配额。
于本 gate 停下待审。
```
