# M3-W2R-104 Final — 状态(诚实四层)

```text
RULING   = M3-W2R-CONV-001
DATE     = 2026-08-14
BASE     = m3/w2r-104 @ 15cf231（已含 #12 = W2R-103B PASS_CLOSED)
W2R_104  = PASS_CANDIDATE   （人工专家前不得自我关闭;即便 L1–L3 全绿)
```

## 四层判据状态

```text
L1 Deterministic Safety Invariants  = PASS
   证据:packages/principal-ai/quality-gate.spec.ts(10/10)——只降级不放宽、危机短路不进闸、
        judge 不可用回退确定性底座、底座 SUSPECTED 不被 judge 抹平。随 principal-ai 套件绿。

L2 Gold Evaluation                  = PASS(安全 BLOCKER 已修,架构师授权)
   判分器:products/famili-principal/tools/run-gold-eval.mjs(确定性路径,100 例)。
   首轮发现 HIGH_RISK 仅 4/10(自伤"伤害自己"漏判为 NORMAL;家暴"动手打孩子"仅 REVIEW)。
   已授权修 HIGH_RISK_TERMS(只升不降):增 伤害自己/伤害自身/自残/动手打/往死里打/被打;+3 安全负测。
   重跑结果:route_match 80/100;**HIGH_RISK 短路 10/10** ✅;NORMAL 教练属性 70/70;禁语违规 0;
        REVIEW 0/20 由确定性匹配(降级依赖 L3 judge,预期,非 L2 失败)。
   回归:principal-ai 38 · api 92 · typecheck 21 · 授权扫描 0 全绿。

L3 Model Judge (independence=PARTIAL)= RUN_COMPLETE(cc-switch 真实内部 eval,synthetic gold)
   harness:products/famili-principal/tools/run-model-judge-eval.mjs;产物:evals/gold-v1/results/L3_model_judge_result.json
   结果(sample=9:4 NORMAL/3 REVIEW/2 HIGH_RISK):model_called=7(2 HIGH_RISK precheck 短路,无 judge);
        生成式 judge 实跑 5/7,2 例 judge 不可用→安全回退确定性底座(fail-closed 正确);judge_pass=6/fail=1;errors=0;
        dims:understanding PASS6/FAIL1 · labeling PASS7 · risk_leak NONE7(跨轮有 SUSPECTED,生成式波动属常态)。
   语义(裁决口径):Principal 与 Judge 同族 → SEPARATE_MODEL_JUDGE_RUN=PASS;MODEL_INDEPENDENCE=PARTIAL;
        CORRELATED_MODEL_RISK=PRESENT;**INDEPENDENT_MODEL_JUDGE=NOT_CLAIMED**(需未来第二个独立获批模型族)。
   授权边界:anthropic-cc-switch INTERNAL_EVAL_ONLY;仅 gold/synthetic,未涉真实家庭数据。

L4 Human Expert Review              = PACKET_GENERATED → HUMAN_EXPERT_REVIEW_REQUIRED
   产物:reports/m3/M3_W2R_104_HUMAN_EXPERT_REVIEW_PACKET.md(NORMAL/REVIEW/HIGH_RISK 代表样本 + 7 维 + 签署栏)。
   Agent 不能自评 PASS。
```

## 结论

```text
W2R_104 = PASS_CANDIDATE
封顶原因(仅剩 1 项;L1/L2/L3 均已 agent 完成):
  (仅) L4 Human Expert Review 未完成(裁决硬约束,Agent 不可自评自 PASS)。
已完成/已关闭:
  · L1 Deterministic Invariants = PASS(quality-gate 10/10)
  · L2 Gold = PASS(首轮 HIGH_RISK 4/10 缺口已授权修至 10/10;NORMAL 70/70;禁语 0)
  · L3 Model Judge = RUN_COMPLETE(cc-switch,generative judge 实跑,errors=0;independence=PARTIAL)
下一步:
  1) L4:人工领域专家按 M3_W2R_104_HUMAN_EXPERT_REVIEW_PACKET.md 评分签署。
L4 完成 + CI green 后,方可请示 W2R_104 = PASS_CLOSED。在此之前 PASS_CANDIDATE 冻结。
```

## 边界

```text
不写 canonical;NEW_PROVIDER=0;NEW_INTERVENTION=0;真实家庭数据=未用(仅 gold/synthetic)。
不合 master;不进 W2R-106。base=m3/w2r-104。
```
