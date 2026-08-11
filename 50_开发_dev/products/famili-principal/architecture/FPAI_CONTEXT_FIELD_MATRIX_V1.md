# FPAI Context Field Matrix V1（PrincipalFamilyContextV1)

对应 `@family/principal-runtime` 的 `PrincipalFamilyContextV1`。**最小必要 allowlist**;字段名/来源在 101A-B 接真实读模型时须逐一坐实,标 `待坐实` 的不得虚构进 runtime。

| FIELD | SOURCE(待坐实) | CANONICAL_OWNER | CONSENT_REQUIRED | MINOR_DATA | MODEL_VISIBLE | REDACTION | RETENTION |
|---|---|---|---|---|---|---|---|
| familyRef | families.family_id | L1 Family Core | AI_PERSONALIZATION | 否 | 是(引用) | — | session |
| subjectRef | persons.person_id | L1 | AI_PERSONALIZATION | 是(若为 child) | 是(引用) | pseudonymize | session |
| lifeStage | life_stage_assignments(active) | L1 | AI_PERSONALIZATION | 否 | 是 | — | session |
| confirmedGrowthPriority[] | growth_priorities(confirmed) | L2 Growth OS | AI_PERSONALIZATION | 否 | 是(dimension_id) | — | session |
| activeIntervention[] | interventions(active) | L2 | AI_PERSONALIZATION | 否 | 是(intervention_id) | — | session |
| recentGrowthActionState[] | growth_actions.status | L2 | AI_PERSONALIZATION | 否 | 是(状态枚举) | — | session |
| recentPermittedObservationSummary[] | outcome/observation(授权+时间窗) | L2 | AI_PERSONALIZATION | 是 | 是(摘要,非原文) | summarize+redact | session |

## 硬规则(§4 Context Minimization)
禁止进入 context:`entire FamilyAggregate / all perspectives / child/parent private text / GrowthProfile internals / full timeline / raw audit logs / raw consent rows`。
consent 未 GRANTED(AI_PERSONALIZATION)→ `buildPrincipalFamilyContext` 返回 `null`(**输出=0**),不得偷偷降级为"少量 Family 数据"(§25)。
