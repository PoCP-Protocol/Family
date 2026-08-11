# M3 Line — Consolidation & Integration Readiness

date: 2026-08-11
branch: `m3/fpai-runtime-readiness`(off baseline `8cadeb6`,承 M3-000 契约门)
purpose: 对整条 Famili Principal Runtime(FPAI)增量做一次 CI 级别整分支验证 + 收口,交架构师决定并入路径。**不直推 master/wave;仅出集成就绪结论。**

## 本线交付全景(全部 PASS_CLOSED)
```
M3-000        契约门(contracts only, no runtime)                       — 既有
M3-101A A/B/C 运行时地基 / 受控真实 Runtime / Action Bridge             — PASS
M3-101B       真实外部模型 Runtime(cc switch / Anthropic,env-gated)    — PASS
M3-102        多模态图片通道(image content block)                      — PASS
M3-103        REVIEW 人工复核工作流(队列 + 解决)                        — PASS
M3-104        每日配额守卫(前置拦截,危机豁免)                          — PASS
M3-105        智谱 GLM-4V 独立视觉 Provider(厂商可选)                    — PASS
M3-106        跨厂商受控 failover 路由(仅基础设施瞬时错误)              — PASS
M3-107        REVIEW 队列运营台(自包含 HTML)                            — PASS
M3-108        配额用量 API + 阈值告警                                    — PASS
```

## 整分支验证(本轮,fresh PostgreSQL 迁移 0001–0013)
```
builds(contracts/ai-gateway/principal-runtime/principal-ai/api)   PASS(tsc 0 error)
typecheck(api)                                                    PASS
package units    principal-runtime 15 · ai-gateway 28 · principal-ai 15   ALL PASS
api unit         (vitest.unit.config)     20 files / 79           PASS
api integration  (vitest.integration.config) 6 files / 40         PASS
api e2e          (vitest.e2e.config)     11 files / 79            PASS
contract validate (tools/validate-contracts.mjs)  69 files / 0 fail    PASS
dangerous-auth scan (tools/m3-dangerous-authorization-scan.mjs)   PASS (0 hits)
LIVE(cc switch + 智谱,手动 .livecheck,不入 CI)  文本/多模态/failover/配额/危机短路  ALL PASS
```

## 收口期修复(整分支验证暴露,已修)
1. `ai-gateway` `tsc build` 失败:`routing.spec.ts` 测试替身泛型签名不匹配 `AiGateway`(vitest esbuild 不报、tsc build 报)→ 替身以 `as unknown as AiGateway` 收敛。
2. `m3-dangerous-authorization-scan` FAIL:该扫描断言"principal 模块不得存在"属 M3-000 阶段约束,**已被 M3-101A 运行时授权取代** → 解除该单项(改为 `M3_FORBID_PRINCIPAL_RUNTIME=1` 才强制);**其余真危险检查(AI 自授权 token、AI 直写 canonical 面、ai-gateway 触碰仓储、必需契约)一律保留不放松**。

## 安全不变量(全线保持,已实测)
```
危机(HIGH_RISK)precheck 短路 → 绝不外呼真实模型;转人工。
AI(含真实模型/多模态)只产结构化陪练文本 → 绝不写 Growth canonical;proposal 恒 canonical=false。
Action Bridge 不绕任何 canonical 门(consent/safety/priority/权限/幂等由既有 Named Action 再校验)。
FAIL CLOSED:超时/网络/4xx/5xx/非法JSON/schema 不过 → 不 500、不返原始文本,安全降级人工复核。
failover 仅对基础设施瞬时错误切换厂商,不对安全失败兜底。
真实调用 env-gated(FPAI_PRINCIPAL_PROVIDER=real);默认确定性回退零外呼;keys 仅本机 gitignored .env。
```

## 集成就绪结论(交架构师决策)
```
整分支 CI 级别全绿,建议进入并入评审。
候选并入基:m3/fpai-intelligence-contract-gate(M3 契约线,baseline 8cadeb6 所在)或 master。
并入方式:PR(遵循"只推隔离分支、不直推 master/wave");合并前建议在 GitHub 实跑 family-required + m3-foundation CI。
未决(需授权后另起):真实模型 SFT/蒸馏、REVIEW/配额指标看板、运营台并入正式前端、生产 provider 配额持久化到独立表。
```
