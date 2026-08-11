# M3-101A-C — Real Action Bridge Gate

date: 2026-08-11
baseline: `8cadeb6`(M3_000 PASS_CLOSED);承接 101A-A PASS、101A-B PASS。
isolation: branch `m3/fpai-runtime-readiness` @ worktree `D:\Family-m3-fpai-runtime`;M2 worktree `D:\Family` 未用于本阶段。
scope: 101A-C Real Action Bridge —— 被人类采纳的 NORMAL proposal → **既有 `StartIntervention` Named Action**(intervention_code=`LISTEN_BEFORE_RESPOND`)。**Provider 仍 Fake,REAL_MODEL_CALLS=0。桥接不新建/不复制任何 canonical 门;不弱化任何既有校验。**

## 核心不变量
```
桥接 = 翻译层,不是旁路。accept 端点仅把 proposal 映射为 StartInterventionRequest 并调用既有 Named Action;
consent(SERVICE+ASSESSMENT+GROWTH_TRACKING)/ NORMAL safety / ACTIVE R03 priority(WORKING confirmed profile)/
family-manage 权限 / 幂等键 / 无活动 episode —— 全部由 InterventionService 在其自身事务内独立再校验。
任一门失败 → 该事务回滚 → Growth 零写 → proposal 保持 PROPOSED。Recommendation≠Action + Human Gate 保持。
```

## 判定
```
BRIDGE_ENDPOINT              = PASS   # POST /families/:familyId/principal/proposals/:proposalId/accept;x-actor-id 必填;body 需 onboarding_id+priority_id+idempotency_key
CANONICAL_ACTION_REUSE       = PASS   # 复用既有 InterventionService.startIntervention;FamilyModule 导出、PrincipalModule 导入;无第二套干预实现
NO_GATE_BYPASS               = PASS   # 桥接不含 consent/safety/priority/permission 逻辑;全部委托既有 Named Action 再校验(见负例矩阵)
INTERVENTION_ALLOWLIST       = PASS   # 仅 recommended_intervention_id∈{LISTEN_BEFORE_RESPOND} 可桥接;其余 → 409 intervention_not_bridgeable(不静默造干预)
RISK_ROUTE_GUARD             = PASS   # proposal.risk_route≠NORMAL → 403(纵深防御;HIGH_RISK 本就不产生 proposal)
PROPOSAL_SINGLE_USE          = PASS   # status≠PROPOSED → 409 proposal_not_acceptable;二次 accept 不产生第二个 episode
CROSS_FAMILY_404             = PASS   # proposal 不存在或不属该 family → 404(防跨家庭枚举)
PROVENANCE_RECORDED          = PASS   # 迁移 0012:accepted_episode_id(FK→intervention_episodes)+accepted_at+accepted_by_actor_id;成功后标 ACCEPTED 并回填
PROPOSAL_STAYS_NONCANONICAL  = PASS   # 0011 的 canonical=false CHECK 不变;canonical 事实/状态仍只在 Growth OS
PRODUCT_EVENTS               = PASS   # principal_proposal_accepted + principal_action_bridged 落 product_events
GROWTH_ZERO_WRITE_ON_FAILURE = PASS   # 权限缺失/无 active priority/非桥接干预 三类失败均 intervention_episodes=0 且 growth_actions=0,proposal 仍 PROPOSED
REAL_MODEL_CALLS             = 0      # Provider=Fake;桥接不触及模型
CROSS_PROVIDER_FALLBACK      = NO     # 未建 Model Router(同前)

M3_101A_C                    = PASS
```

## 证据(本轮实测,真实 PostgreSQL,fresh `family_m3_test` 迁移 0001–0012)
- **Principal Bridge E2E**:`5/5 PASS`
  - POSITIVE:accept NORMAL proposal → episode.status=ACTIVE、priority 关联、`growth_actions=7`(boundary 全 `ACTION_IS_NOT_OUTCOME`);intervention_episodes=1;proposal→ACCEPTED + accepted_episode_id 回填 + accepted_by_actor_id 记录 + canonical=false;product_events 含 accepted+bridged;**二次 accept → 409 且 episode 仍=1**(单次可用)。
  - NEGATIVE 未知/跨家庭 proposal → `404`(两例)。
  - NEGATIVE 非桥接干预(改 recommended_intervention_id)→ `409`;episodes=0、actions=0、proposal 仍 PROPOSED。
  - NEGATIVE 缺 canonical 权限(bare family,无 CreateFamily 审计)→ `403`;Growth 零写;proposal 仍 PROPOSED。
  - NEGATIVE canonical family 但未确认 priority → `404 active_growth_priority_not_found`;episodes=0。
- **Principal B E2E**:`3/3 PASS`(回归,未受影响)。
- **全量 E2E(fresh DB,11 文件)**:`75/75 PASS`(family 9 + principal B 1 + principal C 1;共存无污染)。
- **api 单测+集成**:`26 文件 / 119 PASS`。
- **typecheck + build(@family/api)**:PASS。

## 新增/改动文件
- `database/migrations/0012_principal_action_bridge.sql`(溯源列,幂等)
- `apps/api/src/modules/principal/principal.{service,controller,repository}.ts`(acceptProposal + accept 端点 + loadProposal/markProposalAccepted)
- `apps/api/src/modules/principal/principal.module.ts`(imports FamilyModule)
- `apps/api/src/modules/family/family.module.ts`(exports InterventionService)
- `apps/api/src/modules/principal/principal-bridge.e2e-spec.ts`(正例 + 负例矩阵)

## 边界与未决(交总架构师)
```
REAL_MODEL_RUNTIME / REAL_EXTERNAL_MODEL_CALL = NOT_AUTHORIZED（101A 全程 Provider=Fake）
101A(A→B→C)= 全部 PASS_CLOSED。
下一步候选(待授权)= 101B:接 cc switch 真实多模态 Provider(env-gated,首次引入 REAL_MODEL_CALLS>0,属更高授权边界)。
API keys(智谱/Gemini)仅在本机 gitignored .env,未入库。
M2 core 未改动;既有 70 项 e2e 全部保持绿。
```

## 结论
```
M3_101A_C = PASS  →  M3_101A(受控真实 Runtime + Action Bridge)= COMPLETE(PASS_CLOSED)
于本 gate 停下待审:未经架构师授权,不启动 101B(真实外部模型),不擅自跑 101。
```
