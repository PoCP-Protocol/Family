# Family / 伐木累：产品命名与历史素材 Alias Mapping 001

**状态：** `CANONICAL_NAMING_RULE_ACTIVE`
**适用范围：** Family 产品文档、DEV/TEST 可见文案、架构说明、验收资产与 34 页 UI 的运行时 display label。
**不适用范围：** 已提交 Git 路径、代码包名、路由 ID、asset ID、上传文件名、PPT 原始文件名、截图文件名、source_file 字段和历史 evidence 引用。

## 1. 规范名称

| 对象 | 规范名称 | 使用位置 | 说明 |
|---|---|---|---|
| 产品中文显示名 | **伐木累** | 新文档标题/正文、用户可见 display label | Family 的中文产品名。 |
| 产品英文显示名 | **Family** | 新文档标题/正文、系统边界、API/架构说明 | 产品的规范英文名。 |
| 对外角色名 | **法咪莉校长** | 用户可见角色、服务/助手说明 | 不改变旧代码标识符或历史审计字段。 |
| 历史素材名称 | **原素材/历史命名：榜样教育（Bangyang）** | Source citation、evidence inventory、asset alias | 仅表示来源与历史可追溯性；不作为当前产品名。 |

> 历史命名不是产品名称替换对象。任何原始路径、哈希、PPT/截图文件名、`source_file`、`asset_id`、`route_id` 或 Git commit 中的 `bangyang/BANGYANG` 必须保持不变，以保证 34 页视觉证据与既有交付的可追溯性。

## 2. 允许与禁止的替换规则

新建或修订的产品叙述一律使用 **Family / 伐木累**。当语句描述 PPT、UI 截图、上传材料、历史文档或素材来源时，必须使用“原素材/历史命名：榜样教育（Bangyang）”，而不是机械改写来源名。所有新建面向用户的导航、按钮、标题、提示和无障碍标签不得出现 `Bangyang`、`榜样教育` 或 `波波校长`。

| 项目 | 规则 | 示例 |
|---|---|---|
| 新产品标题 | 使用规范产品名 | `Family / 伐木累 34 页 UI 交付计划` |
| 历史材料引用 | 保留并声明 alias | `原素材/历史命名：榜样教育（Bangyang）PPT` |
| 原始文件/asset 路径 | 保持原值 | `/public/bangyang-reference/...` |
| route/page ID | 保持原值 | `UI-01`、`commerce-mall` |
| 代码包名/数据库表 | 保持原值，除非独立迁移授权 | `@family/web`、`family_llm_gateway_audits` |
| 角色 display label | 统一为法咪莉校长 | `法咪莉校长` |

## 3. 34 页 UI 的显示与素材分离

34 页截图是原始视觉证据，图片像素内的历史文字不得通过文件改名或覆盖文本破坏。运行时产品容器、页面元数据、ARIA label、新增提示和后续新增 display label 使用 Family/伐木累。图片地址继续指向 `bangyang-reference`，并由本文件和 page baseline 将其解释为**原素材/历史命名**。

## 4. 品牌命名验收

| 检查项 | 通过条件 | 当前验证方式 |
|---|---|---|
| 产品正文 | 新增/修订产品叙述使用 Family/伐木累 | 文档关键字扫描与人工抽样。 |
| 历史证据 | 原始路径、文件名、source_file 保留；引用带 alias 说明 | evidence inventory、page baseline、Git diff。 |
| 对外角色 | 新增用户可见角色不出现原素材/历史人物名：波波校长；统一使用法咪莉校长 | Web 文案/ARIA 与文档扫描。 |
| UI 内部术语 | 用户可见 UI 不出现 DEV、stub、Gate、policy、contract | Web gateway spec + 浏览器抽样。 |
| 运行时路由 | `route_id` 与 asset 路径不因改名断裂 | 34 页 manifest test 与浏览器直达路由。 |

## 5. 持续约束

命名统一不会改变证据等级。原素材/历史命名：榜样教育（Bangyang）相关 PPT、截图、课程与案例仍受 Family `evidence.py` 和 Evidence Gate 约束，自家材料仍为 E1 上限，不能用作教育效果、成长结果、模型正确性或生产放行证明。
