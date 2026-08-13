# LIVE2D_LICENSE_REVIEW_REQUIRED (MM1-B1 §33)

## 结论

```
LIVE2D_RUNTIME                = NOT_AUTHORIZED
COMMERCIAL_AVATAR_PROVIDER    = NONE
```

## 原因

1. Live2D Cubism SDK (及其 Web / Native runtime) 的商业发布 / 可扩展应用 (SaaS/内嵌产品/商业课程等) 授权需 **单独商业许可 (Publish/Extended License)**,当前 Family 项目 **未完成许可评审**。
2. 本轮 MM1-B1 目的是"打通真实语音数字人纵向切片",不引入任何未获授权的商用 avatar runtime。
3. 因此:
   - `packages/avatar-gateway/src/providers/familyLocal2d.ts` = 完全自研的 2D FSM/嘴型/表情/手势合成层,**不含任何 Live2D 依赖**。
   - `products/famili-principal/apps/avatar-lab/` 客户端渲染(将在后续任务中完成)采用 **Canvas/SVG + 静态资产**,**不加载任何 Live2D runtime**。
   - 严禁 `import { Live2D... } from '@live2d/*'` / 引入 `Cubism` / `Live2DCubismCore.js` 等。

## 若未来要重新评审

必须至少完成:
- [ ] 联系 Live2D Inc. 明确 "商业发布许可" vs "可扩展应用许可" 覆盖范围。
- [ ] 明确 SaaS / 移动端 App / 智能硬件端 分别所需的授权级别。
- [ ] 明确付费模型(单次/年费/收入分成)与用户量门槛。
- [ ] 明确二次工具链(动作编辑器、面部捕捉)是否被同一许可覆盖。
- [ ] 明确 Family 自建 avatar 的美术素材是否属于"Live2D 派生作品"而受限。
- [ ] 明确 EULA 与 Family 隐私红线(§27)冲突项。

任一项未闭合前, **保持本状态: LIVE2D_RUNTIME = NOT_AUTHORIZED**。

## 相关条款

- Family CLAUDE.md 三层结构 → 概念权威规格 § 商用 provider 引入门禁。
- FPAI_MM1B_PROVIDER_SELECTION_V1 §11.A.3: family_local_2d = 参考栈唯一 avatar。
- 本轮 START_MM1_B2 = NO,任何"引入商业 avatar SDK"提案必须走独立议题、独立门禁。
