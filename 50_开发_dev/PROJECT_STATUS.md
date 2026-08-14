# Family Project Status

status_version: 6
phase: M3_FAMILY_1_0_MOS
milestone: M3_EXECUTION_REBASELINE_V3_3_CLOSED
as_of: 2026-08-11

## Completed Design Baseline

- FGAIM实施方法论
- Family总体蓝图
- Family整体技术架构
- Family详细方案
- 现有业务迁移思路
- 180天实施路线
- 12–15岁第一LifeStage方向
- Child / Parent / Relationship三条成长主线

## Engineering Assets Prepared

- AI Development OS V1.1（工程契约）
- Core ontology schemas V0.1
- M1 Action Contracts V0.1
- API Contract V0.1
- Sprint 0 / Sprint 1 Task Packs
- Golden / Safety / Adversarial seed cases

## Current Milestone

M3 — FAMILY 1.0 MINIMUM OPERABLE SYSTEM — NOW

## In Progress

- active_task: M3-W2-000 Consumer Golden Journey Integration Contract Gate(WAF → Principal/Growth OS 接线,不改 AI 后台)
- M2 = CLOSED
- M3_000 = PASS_CLOSED
- M3_101A = PASS_ACCEPTED
- M3_INT_001 = PASS_CLOSED;M3_W1_FAMILI_PRINCIPAL_RUNTIME = PASS_CLOSED
- FPAI_RUNTIME_ADMITTED_TO_MOS = YES(merge commit 4398a857 → m3/family-1-0-mos;post-merge CI green run 31511460551)
- FROZEN_BRANCHES = m3/fpai-runtime-readiness(@99d4797)+ m3/fpai-runtime-admission-fix(@0a65018);NO_NEW_DEVELOPMENT,保留不删
- 持续 NOT_AUTHORIZED:REAL_MODEL_DEFAULT_ENABLED=NO / IMAGE_EXTERNAL=NO / PRODUCTION_PROVIDER=NO / PILOT=NO / SFT / DH1 / VOICE / AVATAR
- FPAI_BACKEND_FEATURE_EXPANSION = HOLD(除非 W2 暴露真实 blocker)

## Completed

- TASK-000 Repo Audit → reports/REPO_AUDIT_REPORT.md
- TASK-001 Engineering Bootstrap → reports/BOOTSTRAP_REPORT.md（monorepo/api/health/audit/迁移机制;build/lint/test/typecheck/启动 实测通过）
- M1 Family Core Running → CLOSED after TASK-107 PASS
- Rebaseline V3.0 applied: Product Vertical Slice First, Frontend / UX as first-class delivery line
- Previous M2-000 planning artifacts created, but gate was NOT PASS because Frontend / UI / UX was insufficient
- M2-000 V3.0 First Growth Slice Contract Gate → PASS; BLOCKERS=0; READY_FOR_M2_WAVE1=YES
- M2-101 StartGrowthOnboarding + F01/F02 → COMPLETED with backend API, Family Web path, HTTP E2E, web tests, and browser demo check
- M2-102 RecordPerspective + EvidenceRecord + server-side safety derivation → PASS
- M2-103 Evidence Synthesis + Limited Growth Profile + ConfirmGrowthProfile + F05 → PASS
- M2 Wave 1 — UNDERSTAND → PASS / CLOSED
- M2 Wave 2 Phase A — Contract Freeze → PASS / CLOSED
- Contract Freeze and Shared File Conflict Matrix → APPROVED
- M2-104 GrowthPriority → LOCAL_GATE_PASS
- M2-105 Intervention-001 + GrowthAction → LOCAL_GATE_PASS
- B01 M2 runtime future Principal AI/FPAI rendering isolation → PASS_LOCAL_WEB_UNIT
- B02 Wave2 E2E fail-fast repair → PATCHED_AND_FAIL_FAST_VALIDATED_WITHOUT_TEST_DATABASE_URL
- B04 Required GitHub Actions workflow → CREATED_PENDING_CI_RUN
- Technical Architecture Rebaseline V3.2 SSOT → APPROVED
- M2 Wave2 real PostgreSQL HTTP E2E → PASS_REAL_POSTGRESQL_HTTP_55_TESTS
- M2 Wave2 local required gate → PASS_BUILD_TYPECHECK_UNIT_INTEGRATION_E2E
- M2 Wave2 Browser Gate → PASS_REAL_API_F06_F09
- AI-06 Governance Final Signoff → PASS
- AI-07 Independent Architecture / Product Review → PASS
- M2 Wave2 Final Gate → PASS
- V3.2 Architecture Gate → PASS
- CCR-M2-WAVE4-001 → APPROVED; M2 Wave4 Intelligence deferred to M3/FPAI
- M2 Wave3 Phase A Contract Freeze → PASS
- M2 Wave3 API Real PostgreSQL HTTP E2E → PASS_12_TESTS
- M2 Wave3 Web tests/typecheck → PASS_LOCAL
- M2 Wave3 Browser F10/F11 Gate → PASS_REAL_API_DESKTOP_MOBILE
- M2 Wave3 Governance Pre-Review Packet → CREATED_NOT_SIGNED
- M2 Wave3 API Real PostgreSQL HTTP E2E = PASS_12_TESTS
- M2 Wave3 Web = PASS_19_TESTS
- M2 Wave3 Browser F10/F11 = PASS_REAL_API_DESKTOP_MOBILE
- M2 Wave3 AI06 Governance = PASS
- M2 Wave3 AI07 Independent Review = PASS
- M2 Wave3 GitHub Required Gates = PASS
- M2 Wave3 Remote Convergence = PASS
- M2 Wave3 Final Architect Signoff = PASS
- M2 Wave3 = CLOSED

## Current Ruling

```text
M2 = CLOSED
M2_WAVE_1 = CLOSED
M2_WAVE_2 = CLOSED
M2_WAVE_3 = CLOSED
M2_DETERMINISTIC_GROWTH_LOOP = CLOSED
M3 = NOW
M3_DEFINITION = FAMILY_1_0_MINIMUM_OPERABLE_SYSTEM
M3_000 = PASS_CLOSED
M3_101A = PASS_ACCEPTED
M3_101B_108 = INTEGRATION_CANDIDATE
M3_INT_001 = PASS_CLOSED;M3_W1_FAMILI_PRINCIPAL_RUNTIME = PASS_CLOSED;FPAI_RUNTIME_ADMITTED_TO_MOS = YES
M3_RB_001 = PASS_CLOSED
M3_RB_002 = PASS_CLOSED
M3_RB_003 = PASS_CLOSED (Object & Intelligence Truth Rebaseline;架构师终裁 2026-08-12)
# 2026-08-14 真相对齐(架构师复盘 §25;权威序见 governance/TRUTH_HIERARCHY.md)——旧 CURRENT_EXECUTION_GATE=W2R-101 已过期,校正如下:
W2R_101 = PASS_CANDIDATE;W2R_102 = INTERNAL_TECHNICAL_PASS/PILOT_NO
W2R_103B = PASS_CLOSED (on m3/w2r-104@15cf231;evidence-grounded,CLOSURE-001 机器可核验来源)
W2R_104 = PASS_CANDIDATE (L1/L2/L3 agent 已完成;仅剩 L4 Human Expert;PR #16)
W2R_105 = VALID_DESIGN/STALE_BRANCH(PR #10,待 w2r-104→master 后 clean-forward)
OPS_001 = PR_OPEN(#15);FLM_FELS_CORE = PASS_CLOSED
PROGRAM_MODE = M3_MOS_CLOSEOUT(NO NEW CAPABILITY UNLESS IT CLOSES A MOS GATE)
CURRENT_EXECUTION_GATE = W2R_104_FINAL(L4 Human Expert)→ w2r-104→master → IAM-103 / TENANCY-001 / PROVIDER_POLICY_RUNTIME → Golden E2E → W2R-106/107 → M3-W3 → FAMILY_1_0_MOS_GATE
新增 P0:PROVIDER_POLICY_RUNTIME_001(真实家庭外呼前必过);IAM_103(消费/reviewer/ops 三角色)
M3_W2R = AUTHORIZED (真实模型内部默认翻转在 W2R-102 单独受控门;pilot 仍未授权)
AUTHORIZATION_SSOT = governance/AUTHORIZATION_REGISTRY.yaml (admission 分支)
EXECUTION_SSOT = V3.3
V3_0 = SUPERSEDED_FOR_EXECUTION
M2_WAVE4_INTELLIGENCE = SUPERSEDED_FOR_EXECUTION_BY_CCR
M2_WAVE4_NEW_OWNER = M3_W1_FAMILI_PRINCIPAL_RUNTIME
M2_REOPEN = NO
PROGRAM_BASELINE_SHA = 8cadeb65cca205f3d2fe23b141988d6342444cc7
PROGRAM_INTEGRATION_BRANCH = m3/family-1-0-mos
DEFAULT_BRANCH = master
M3_REAL_EXTERNAL_MODEL = NOT_AUTHORIZED
WAVE3_AI06 = PASS
WAVE3_AI07 = PASS
WAVE3_GITHUB_CI = PASS_RUN_31438263608
WAVE3_REMOTE_CONVERGENCE = PASS_758B1ED_BASELINE
FINAL_ARCHITECT_SIGNOFF = PASS
WAVE3_BLOCKERS = 0
# RB-003 漂移修正(2026-08-12):以下 M2 期旧状态与 M3_INT_001/W1 PASS_CLOSED 矛盾,已按真相校正。
READY_FOR_M3_RUNTIME = YES
START_M3_RUNTIME = DONE
M3_RUNTIME = ADMITTED_TO_MOS   # 代码已并入 master;真实外部模型默认关(见 M3_REAL_EXTERNAL_MODEL),pilot 未授权
F12_AI = NOT_STARTED
MODEL_GATEWAY_RUNTIME = ADMITTED_INTERNAL   # Gateway 已并入;真实外呼默认关,由 AUTHORIZATION_REGISTRY 管
AGENT_RUNTIME = NOT_AUTHORIZED
WORLD_MODEL = NOT_AUTHORIZED
CAUSAL_ENGINE = NOT_AUTHORIZED
V3_2_ARCHITECTURE_GATE = PASS
NEW_TECHNICAL_ARCHITECTURE = V3.2 BUILD-TO-OPERATE
CORE_ARCHITECTURE_REWRITE = NO
STATE_ALIGNMENT = PASS_WAVE3_CLOSED_M3_NOT_AUTHORIZED
```

## Known Issues

- last_completed_task: M2_WAVE3_FINAL_ARCHITECT_SIGNOFF_AND_CLOSURE
- current_gate_blocker: none for Wave3; next step is a separate M3 / Famili Principal Intelligence Architecture & Contract Gate.
- Wave3 browser F10/F11 gate passed in a continuous fresh real API UI flow; current web app still does not hydrate the full journey after reload, so reload-based proof must not be counted as browser evidence.
- Contract Freeze is now immutable baseline `M2_WAVE2_CF_V1`; changes require `CONTRACT_CHANGE_REQUEST` and AI-00 approval before any V2.
- Existing unrelated/unintegrated worktree files must not be reverted during Wave 2 integration.
- `growth_journeys.subject_person_id` must not be added for convenience; subject/consent resolution must converge through canonical relations or a minimal `GrowthSubjectResolver`.
- `growth_actions` legacy dual-write is temporary schema compatibility only and requires audit before Real PostgreSQL final gate.

## Not Started

- 90-Day Journey implementation
- AI Model Gateway
- Agent Runtime
- Knowledge Foundry
- Causal Platform
- World Model

## Explicitly Deferred

- Full 0–18 LifeStage coverage
- Child autonomous agent
- Community marketplace
- City ecosystem
- Family Total Score
- Family ranking
- Reinforcement learning
- World Model training
- M2 Wave4 Intelligence: M2_WAVE4_INTELLIGENCE = SUPERSEDED_FOR_EXECUTION_BY_CCR; NEW_OWNER = M3-W1 Famili Principal Runtime; M2_REOPEN = NO

## Architecture Decisions

- Modular Monolith First
- PostgreSQL First
- TypeScript / NestJS preferred for backend
- React / TypeScript preferred for web
- OpenAPI-first API contract
- Named Action for core state mutation
- Event + Audit from Day 1
- Family Technical Architecture V3.2 Build-to-Operate Rebaseline
- One Consumer App, Ops Web, and isolated legacy surface
- ProductEvent / GrowthEvent / AuditEvent / OutboxEvent separation
- Principal AI proposes; humans confirm through Named Action
- Community participates; it does not define growth
- FELS is old world; FLM translates; Family is new world

## Status Update Rule

每个完成Task的AI必须更新：

- Completed
- In Progress
- Known Issues
- Last completed task

但不得擅自改变milestone或phase。
