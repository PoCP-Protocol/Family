# M3-101A-B — Controlled Principal Runtime Gate

date: 2026-08-11
baseline: `8cadeb6`(m3/fpai-intelligence-contract-gate,M3_000 PASS_CLOSED);承接 101A-A PASS。
isolation: branch `m3/fpai-runtime-readiness` @ worktree `D:\Family-m3-fpai-runtime`;M2 worktree `D:\Family` 未用于本阶段。
scope: 101A-B 受控真实 Runtime —— PrincipalModule(HTTP)+ PG 持久化(principal_* / product_events)+ NORMAL·HIGH_RISK 真实 PostgreSQL E2E。**Provider = 确定性 soul(Fake 等价),REAL_MODEL_CALLS=0。不写 Growth canonical(Action Bridge 属 101A-C,须本 B-Gate PASS 后)。**

## 判定
```
PRINCIPAL_MODULE_WIRED       = PASS   # PrincipalModule(controller+service+repository)注册进 AppModule;显式 @Inject(token) 满足 esbuild 无元数据 DI(对齐 family 既有约定)
ISOLATED_PERSISTENCE         = PASS   # 迁移 0011:principal_sessions/messages/responses/action_proposals/feedback/model_runs/human_handoffs + product_events;FK 仅指 families(family_id);真实 PG 迁移 0001–0011 全通
CANONICAL_ISOLATION          = PASS   # Principal 只写 principal_*/product_events;E2E 断言 growth_actions 前后计数不变(不写 Growth canonical)
PROPOSAL_NON_CANONICAL       = PASS   # principal_action_proposals.canonical=false + CHECK(canonical=false) 硬约束;recommended_intervention_id 只指既有 LISTEN_BEFORE_RESPOND
SAFETY_ROUTE_HIGH_RISK       = PASS   # HIGH_RISK(“不想活了”)→ human_handoff=true、无 coaching response、无 proposal;落 principal_human_handoffs
SAFETY_ROUTE_NORMAL          = PASS   # NORMAL(作业拖拉)→ response + action_proposal(LISTEN_BEFORE_RESPOND)、human_handoff=false
CONSENT_FAIL_CLOSED          = PASS   # 非 person-uuid 的 subject_ref 无 canonical consent → loadConsents 返回空 → consent.allowed=false(不注入 Family context),不因类型错误 500
MODEL_RUN_RECORDED           = PASS   # 每次落 principal_model_runs;model_provider='fake';prompt/soul 版本 + input/output hash + risk_route + schema_validation + latency
PRODUCT_EVENTS_RECORDED      = PASS   # principal_question_submitted / principal_response_received(及 handoff/proposal 事件)落 product_events
GET_AGGREGATE                = PASS   # GET session 返回 session+messages+responses;未知 session → 404;跨 family 归属校验(sessionBelongsToFamily)
REAL_MODEL_CALLS             = 0      # Provider=确定性 soul;真实模型(cc switch / AnthropicAiGateway)env-gated,属 101B,本阶段未接线
CROSS_PROVIDER_FALLBACK      = NO     # 未建 Model Router(同 A-Gate)
GROWTH_CANONICAL_WRITES      = 0      # 见 CANONICAL_ISOLATION

M3_101A_B                    = PASS   # 模块 + 隔离持久化 + 双路真实 E2E + canonical 零写 全部 PASS
```

## 证据(本轮实测,真实 PostgreSQL)
- **Principal E2E(隔离,fresh `family_m3_test` 迁移 0001–0011)**:`3/3 PASS`
  - NORMAL:response_id + action_proposal_id 均在;proposal.recommended_intervention_id=`LISTEN_BEFORE_RESPOND`、canonical=false;model_runs.model_provider=`fake`;growth_actions 前后计数不变;product_events 含 submitted+received。
  - HIGH_RISK:risk_route=`HIGH_RISK`、human_handoff=true、response_id=null、action_proposal_id=null;principal_human_handoffs 计 1、principal_responses 计 0。
  - GET:aggregate messages≥1;未知 session → 404。
- **全量 E2E(fresh DB,10 文件)**:`70/70 PASS`(family M1/W2/W3 9 文件 + principal 1 文件共存,principal 套件不污染 family)。
- **api 单测+集成**:`26 文件 / 119 PASS`(含 `cleanFamilyCoreTables` 新增 principal 清理后无回归)。
- **包单测**:principal-runtime `15/15`、ai-gateway `16/16`、principal-ai `14/14`。
- **typecheck + build(@family/api)**:PASS(tsc `--noEmit` 与产物构建均通过)。

## 关键修复(本轮)
1. **DI**:vitest/esbuild 不发射 `emitDecoratorMetadata`,按类型注入拿不到 provider → 给 `PrincipalService`/`PrincipalController` 构造参数补显式 `@Inject(Token)`(对齐 family 既有写法),NestFactory E2E 恢复注入。
2. **consent uuid 守卫**:`consents.subject_person_id` 为 uuid;Principal 会话层 `subject_ref` 为自由引用,非 uuid 时 `loadConsents` 直接返回空(fail closed),不再 `invalid input syntax for type uuid` 500。
3. **共享清库健壮性**:`cleanFamilyCoreTables` 先 `cleanPrincipalTablesIfPresent`(FK 安全序 + `to_regclass` 守卫),否则末尾 `delete from families` 被 `principal_sessions_family_id_fkey` 挡住;Family-core-only 库(未迁 0011)自动逐表跳过。

## 新增/改动文件
- `apps/api/src/modules/principal/**`(controller/service/repository/module + `principal.e2e-spec.ts`)
- `apps/api/src/app.module.ts`(注册 PrincipalModule)
- `apps/api/src/test/test-database.ts`(principal 清理助手)
- `apps/api/package.json` + `pnpm-lock.yaml`(workspace deps:principal-ai / principal-runtime / ai-gateway)
- `database/migrations/0011_principal_runtime.sql`(B1,已于 802015a 提交)

## 边界与未决(交总架构师)
```
REAL_MODEL_RUNTIME / REAL_EXTERNAL_MODEL_CALL = NOT_AUTHORIZED（本阶段仍 Provider=Fake）
101A-C(Action Bridge:accept endpoint → 既有 StartIntervention Named Action + 反向桥接矩阵 + E2E)= 未开始（按裁决须 B-Gate PASS 后）
API keys（智谱/Gemini）仅在本机 gitignored .env,未入库（经用户批准“不入库”）
M2 core 未改动
```

## 结论
```
M3_101A_B = PASS
下一步(待架构师授权)= 101A-C Real Action Bridge;或先接 101B(cc switch 真实多模态 Provider,env-gated)。
在授权前不启动 101A-C、不擅自跑 101,于本 gate 停下待审。
```
