# Family 儿童成长 IP V1

```text
DOC_KIND        = CONCEPT_AND_GOVERNANCE_MEMO（非 SSOT、非 runtime 授权）
STATUS          = DRAFT_FOR_ARCHITECT_REVIEW
DEFAULT         = PRIVATE_TO_FAMILY
OWNERSHIP       = 家庭与孩子的表达/资料权利；平台只在被授权用途内提供工具
COMMERCIAL_USE  = DISABLED
PUBLIC_SHARING  = DISABLED
```

## 1. 概念

Family 可以为每个孩子提供一个**成长 IP（Growth Character / Growth Story）**：它是孩子与家庭共同维护、可随成长阶段变化的叙事与表达容器。它不等于用户画像、测评标签、行为评分或可对外营销的人设。它可以承载孩子愿意表达的兴趣、喜欢的主题、作品、自己的小目标、勇气时刻、成长故事和在家庭支持下尝试过的资源；这些内容用于帮助 Family 更好地组织练习、内容、Program、顾问支持和回顾，而不是让系统“定义这个孩子是谁”。

> **孩子拥有表达权；家庭拥有主权与保护责任；平台只提供受限工具。**

## 2. 允许与禁止

| 范围 | 可以做 | 不可以做 |
|---|---|---|
| 私有表达 | 由孩子/监护人选择记录兴趣、作品、愿望、故事、角色偏好与阶段主题 | 从聊天、服务记录或第三方数据自动拼出隐性“人设” |
| 家庭协作 | 家庭一起选择一个称呼、故事主题或小任务，作为沟通与练习的共同语言 | 让家长单方替孩子固定身份；以角色惩罚/羞辱孩子 |
| 资源编排 | 在家庭明确同意下，将**显式选择的**兴趣/目标作为低权重偏好，帮助解释资源选择 | 将 IP 作为资格门、风险标签、心理/发展判断或成长预测依据 |
| 生成式协作 | 草拟故事、鼓励卡、练习场景、作品说明；保留版本、来源与编辑权 | 生成真实孩子肖像、模仿声音、公开人物形象、深度伪造或不透明内容 |
| 分享 | 默认仅家庭可见；未来如要对可信共同照护者分享，必须按目的、范围、期限单独授权 | 默认公开、社区展示、广告定向、商业授权、跨家庭训练/推荐 |
| 生命周期 | 允许孩子随年龄成长修改、暂停、归档或删除 | 将儿童时期 IP 无期限延续到青年期或成人期而不重新同意 |

## 3. 融合到既有 Family 对象模型

成长 IP 不是新主域，也不应创建平行身份系统。未来的最小对象应作为 `Family Core → Person/Child` 的可选、私有扩展，并通过既有 Consent、Audit、Evidence/Content 与 ResourceOffer 使用：

```text
Person (existing Family Core)
  └─ GrowthIdentityExpression (optional, family-private, versioned)
      ├─ ChosenName / Theme / Interest / Strength-as-self-description
      ├─ StoryFragment / WorkArtifactRef / PracticePreference
      ├─ Visibility & Purpose Grant (existing consent/access semantics)
      └─ ResourcePreferenceProjection (read-only, low-weight)

GrowthIntent / ServiceCase
  └─ MAY reference an explicit GrowthIdentityExpression version
       → only to explain a family-chosen resource or practice
```

`GrowthIdentityExpression` 与 `GrowthNeedSignal`、`Perspective`、`Observation` 完全不同：它不是事实、诊断、证据、服务结果或成长结论。它也不能被 Principal、Resource Ranking 或未来 Learning-to-Rank 自动写入。

## 4. 生成式 AI 安全协议

生成式能力只能在已授权的家庭 scope 内、基于用户显式输入或已批准作品引用工作。每次生成必须显示：输入来源、生成版本、用途、局限和“编辑/不采用/删除”入口。高风险内容默认不可生成，包括真实儿童脸部/声音/身份拟真、与学校/医疗/心理状态有关的推断、对其他家庭可见的内容，以及任何商业宣传素材。

任何未来图像、音频、公开视频或跨家庭分享能力，都需要独立的儿童保护、监护人同意、年龄/当地法规、内容审核、撤回、数据留存和人工升级 Gate；不属于当前首条纵切授权。

## 5. 分期

| 阶段 | 可进入能力 | 前置条件 |
|---|---|---|
| 现在 | 架构预留、对象边界、私有文本/作品引用的设计 | 不写 runtime，不接真实模型，不创建对外内容 |
| 首次 runtime（未来） | 家庭私有的手动兴趣/主题/作品卡、版本历史、删除与导出 | Person/Consent/IAM/审计/生命周期权限 E2E 完整通过 |
| 服务融合 | 经家庭选择，将某个兴趣/主题作为资源解释的低权重偏好 | ResourceOffer 解释契约、家庭确认、不可改变 Eligibility/高影响决策 |
| 受控生成 | 文本故事/练习场景草稿 | 真实模型、输入来源、内容安全、人工升级与独立授权通过 |
| 任何分享/商业化 | 当前 HOLD | 儿童利益、独立同意、资质、法律、申诉/删除与治理 Gate；默认不启动 |

## 6. 首条纵切的约束

12–15 岁亲子沟通冲突纵切不把“孩子 IP”当作输入或输出。它只保留未来可接入的对象边界。当前仍以家庭确认的 Need、Capability、合格 Resource、家庭 Decision、服务过程与用户感知帮助感为主链，避免用有吸引力的角色叙事遮蔽真实需要或取代孩子的声音。

## 参考

[1]: `architecture/FAMILY_OBJECT_ACTION_CONTEXT_MODEL_V1.md`
[2]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§0–5
[3]: `architecture/FAMILY_LIFECYCLE_GROWTH_ARCHITECTURE_V1.md`
[4]: `governance/FAMILY_GROWTH_VERTICAL_SLICE_001_TASK_CONTRACT.md`
