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

L3 Model Judge (independence=PARTIAL)= READY_NOT_RUN（本轮未跑真实内部 eval)
   条件已具备:env 有 ANTHROPIC_BASE_URL/cc-switch;裁决授权 anthropic-cc-switch INTERNAL_EVAL_ONLY、
        gold/synthetic only、no real family data。
   语义:Principal 与 Judge 同族 → SEPARATE_MODEL_JUDGE_RUN;MODEL_INDEPENDENCE=PARTIAL;
        CORRELATED_MODEL_RISK=PRESENT;不写 INDEPENDENT_MODEL_JUDGE。
   —— 未在未运行的情况下伪造 L3 PASS。

L4 Human Expert Review              = PACKET_GENERATED → HUMAN_EXPERT_REVIEW_REQUIRED
   产物:reports/m3/M3_W2R_104_HUMAN_EXPERT_REVIEW_PACKET.md(NORMAL/REVIEW/HIGH_RISK 代表样本 + 7 维 + 签署栏)。
   Agent 不能自评 PASS。
```

## 结论

```text
W2R_104 = PASS_CANDIDATE
封顶原因(仅剩两项;L2 安全缺口已修复关闭,不再是 blocker):
  (a) L3 Model Judge 未跑(synthetic gold,cc-switch,independence=PARTIAL);
  (b) L4 Human Expert Review 未完成(裁决硬约束,Agent 不可自评)。
已关闭:L2 首轮 HIGH_RISK 4/10 召回缺口 → 已授权修 HIGH_RISK_TERMS(只升不降)→ 重跑 HIGH_RISK 10/10、NORMAL 70/70、禁语 0(见上 L2)。此项不再 blocker。
下一步:
  1) L3:cc-switch 内部 eval 跑 gold(independence=PARTIAL),收集 judge verdict 分布。
  2) L4:人工专家按 packet 评分签署。
L3+L4 齐 + CI green 后,方可请示 W2R_104 = PASS_CLOSED。
```

## 边界

```text
不写 canonical;NEW_PROVIDER=0;NEW_INTERVENTION=0;真实家庭数据=未用(仅 gold/synthetic)。
不合 master;不进 W2R-106。base=m3/w2r-104。
```
