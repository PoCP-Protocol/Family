# M3_MOS_CLOSEOUT 阶段报告 与 指令请示

```text
DOC_KIND        = PHASE_REPORT_AND_INSTRUCTION_REQUEST
TO              = 总架构师 (Chief Architect)
FROM            = M3 收口会话(branch: m3/w2r-104-final)
DATE            = 2026-08-14
RULING_BASIS    = 架构师代码级复盘 2026-08-14(PROGRAM_MODE = M3_MOS_CLOSEOUT)
DECISION_REQUIRED = YES
FAMILY_CANONICAL_WRITE = 0 · MASTER_MERGE = 0 · NEW_CAPABILITY = 0 · SELF_AUTHORIZATION = 0
```

> 本报告为请示。所有"启用/合并/PASS_CLOSED"待架构师签署;在此之前 flag 默认关、不合 master、不自评。

---

## 一、模式已切换并遵守
`PROGRAM_MODE = M3_MOS_CLOSEOUT`:NO NEW CAPABILITY UNLESS IT CLOSES A MOS GATE。
**冻结**(未动):课件产线 / FELS-2·3 深化 / FELS UI(降 P1)/ Object-Tree P2·生成式层 / 更多 Dimension·Intervention·LifeStage / SFT·LoRA·数字人·World Model。

---

## 二、本轮已完成(授权内,均 in-mode)

### 1. W2R-104 → Agent 天花板(PASS_CANDIDATE,仅剩 L4 人工)
```text
L1 Deterministic Invariants = PASS(quality-gate 10/10)
L2 Gold                     = PASS(首轮 HIGH_RISK 4/10 缺口→授权修 HIGH_RISK_TERMS→10/10;NORMAL 70/70;禁语 0)
L3 Model Judge              = RUN_COMPLETE(cc-switch 真实内部 eval,synthetic gold)
    sample=9,model_called=7,生成式 judge 实跑 5/7(2 例回退确定性底座 fail-closed),judge_pass=6/fail=1,errors=0
    SEPARATE_MODEL_JUDGE_RUN=PASS · MODEL_INDEPENDENCE=PARTIAL · CORRELATED_MODEL_RISK=PRESENT · INDEPENDENT_MODEL_JUDGE=NOT_CLAIMED
L4 Human Expert             = REQUIRED(裁决硬约束,Agent 不可自评)
证据:evals/gold-v1/results/L3_model_judge_result.json;harness:tools/run-model-judge-eval.mjs
```

### 2. 真相对齐(补复盘 §25–28 #3 系统性债)
- `governance/TRUTH_HIERARCHY.md`:机器化权威序(Runtime/DB > GitHub > Registry > Gate > Roadmap/Status > PR > README;授权单独通道,AGENT_SELF_AUTHORIZATION=NO)。
- `PROJECT_STATUS.md`:校正过期 `CURRENT_EXECUTION_GATE`(W2R-101→W2R-104_FINAL);标 PROGRAM_MODE。
- `README.md`:加"最低权威序"横幅 + 修"卡片库为空"过期行。
- `M3_W2R_104_FINAL_STATUS.md`:修自相矛盾(L2 安全缺口已修/结论区残留 BLOCKER)。

### 3. P0 设计稿(DESIGN_ONLY)
- `reports/m3/IAM_103_DESIGN.md`:Bearer 进消费路径 + Review Queue reviewer 授权(§7)+ ops 三角色。
- `reports/m3/PROVIDER_POLICY_RUNTIME_001_DESIGN.md`:Provider Registry → runtime policy loader(§15)。

### 4. P0 实现(behind flag,默认关=零行为变化,已测试)
- **PROVIDER_POLICY_RUNTIME_001**:`principal-runtime/provider-policy.ts`(`resolveProviderPolicy`+registry snapshot,FAIL CLOSED)+ `principal.service` flag 接线(`FPAI_PROVIDER_POLICY_RUNTIME=on`)。开启后按 registry 收紧(minor/private_text external 拒);+5 单测。
- **IAM-103 reviewer-auth 核心**:`reviewer-policy.ts`(`assertReviewer`,flag `FPAI_REQUIRE_REVIEWER_AUTH=on`,名单 `FPAI_REVIEWER_IDS`)+ handoffs list/resolve 接入;+3 单测。

**验证(全绿)**:api 单测 95 · principal-runtime 35 · typecheck 21/21 · M3 授权扫描 0 命中。

---

## 三、提交与分支(GitHub 观测真相)
```text
branch m3/w2r-104-final:
  81d4859 truth-sync 修 FINAL_STATUS 矛盾
  9883fe6 L3 Model Judge 跑通
  13eeaae A 真相对齐 + B/C 设计
  d634167 P0 实现(PROVIDER_POLICY + IAM-103 reviewer-auth,behind flag)
相关 PR:#16(w2r-104-final)· #10(W2R-105,stale,待 clean-forward)· #9(object-tree,MERGE_HOLD)· #11(integration review)· #12 已合(103B→w2r-104@15cf231)
```

---

## 四、请示裁决(需架构师;Agent 不能自决)
```text
1) L4 人工专家评审(按 M3_W2R_104_HUMAN_EXPERT_REVIEW_PACKET.md)→ 裁 W2R_104 = PASS_CLOSED
2) 授权 m3/w2r-104 → master(带 103B/104;不可逆,影响主线)
3) 授权【启用】P0(flag on / 生产):PROVIDER_POLICY_RUNTIME、IAM-103;及 IAM-103 完整 Bearer 消费强制、TENANCY-001、W2R-105 clean-forward 的实现令
```

## 五、边界声明
```text
未合 master;未启用任何 flag(默认关);未自增授权;未写 canonical;未涉真实家庭数据(L3 仅 synthetic gold)。
真实家庭外呼前置:PROVIDER_POLICY_RUNTIME + IAM-103 启用 = PASS(现仅设计+flag-gated 实现,待授权启用)。
```

## 六、签署栏
```text
W2R_104_L4_HUMAN = ____________  → W2R_104 = PASS_CLOSED? YES/NO
AUTHORIZE_MERGE_W2R104_TO_MASTER = YES/NO
AUTHORIZE_ENABLE_PROVIDER_POLICY_RUNTIME = YES/NO
AUTHORIZE_ENABLE_IAM_103 / FULL_IAM_103 / TENANCY_001 = ____________
SIGNOFF = ____________  DATE = __________
```
