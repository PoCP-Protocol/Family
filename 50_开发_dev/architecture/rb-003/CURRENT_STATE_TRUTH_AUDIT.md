# CURRENT_STATE_TRUTH_AUDIT — M3-RB-003 (§24)

解决 `code truth != status truth`。以 master `f062ace`(fetch 2026-08-12)为准核对。

## 一、真相基线(实测)
```
DEFAULT_BRANCH = master @ f062ace
已并入主线: M1 Family Core · M2 Growth OS(W1/W2/W3)· M3-000 契约 · M3-101A/B · M3-102/103/104
           · M3-105/106/107/108 · M3-INT-001(治理整改)· RB-002 V3.3 SSOT · W2-101/102 消费校长
           · IAM-101(令牌)· IAM-102(OTP 流程,stub sender)
PR 历史: #1 admission→family-1-0-mos(merged)· #2/#3 →master(merged)· #4 IAM-101(merged)· #5 IAM-102(merged)
授权真相(AUTHORIZATION_REGISTRY):
  真实外部模型默认/ pilot = NOT_AUTHORIZED(默认确定性,零外呼)
  WAF_WF1_C / IAM_101/102/103 = INTERNAL_ALLOWED(pilot=NO)
  IAM_REAL_SMS_PROVIDER / WECHAT / SFT / DH1 = NOT_AUTHORIZED
撤除(未并入): 手写 IAM-103 + 阿里云 adapter(分支已删,用户指示"不手搓假能力")
```

## 二、发现的漂移(PROJECT_STATUS.md)
| 位置 | 旧(漂移) | 真相 | 处置 |
|---|---|---|---|
| 顶部 phase/milestone | M3_FAMILY_1_0_MOS / RB-002 CLOSED | 正确(RB-002 已更新) | 保留 |
| 行~100 | `M3_INT_001 = TRANCHE_1_2_DONE;PR_THEN_W1` | 已 `PASS_CLOSED`(与行 38 一致) | **已改** |
| CURRENT_EXECUTION_GATE | `M3_INT_001_RUNTIME_ADMISSION_PR_THEN_M3_W1` | 已闭;当前 = `M3_RB_003` | **已改** |
| READY/START_M3_RUNTIME | `NO / NO` | `YES / DONE`(runtime 已 admitted) | **已改** |
| M3_RUNTIME | `NOT_AUTHORIZED`(M2 期残留) | `ADMITTED_TO_MOS`(真实外部模型默认关另计) | **已改** |
| MODEL_GATEWAY_RUNTIME | `NOT_AUTHORIZED` | `ADMITTED_INTERNAL`(真实外呼默认关) | **已改** |
| M3_REAL_EXTERNAL_MODEL / AGENT / WORLD / CAUSAL | `NOT_AUTHORIZED` | 仍为真 | 保留 |

## 三、结论
```
PROJECT_STATUS 顶部已随 RB-002 更新;但"Current Ruling"下半段残留 M2 期 M3_RUNTIME=NOT_AUTHORIZED 与
M3_INT_001/W1 PASS_CLOSED 直接矛盾 —— 已在本 RB-003 分支按真相校正(经 PR 评审,不直推 master)。
校正后:PROJECT_STATUS 内部一致;"真实外部模型默认关 + pilot 未授权"作为独立事实明确保留(不因 runtime admitted 而误开)。
Gate E(PROJECT_STATUS_DRIFT=0)见 FAMILY_ARCHITECTURE_TRUTH_GATE。
```
