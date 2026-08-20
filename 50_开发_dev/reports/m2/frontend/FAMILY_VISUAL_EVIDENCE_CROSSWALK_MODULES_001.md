# Family 可移植视觉证据审计模块

**文档编号：** `FAMILY_VISUAL_EVIDENCE_CROSSWALK_MODULES_001`
**目的：** 将“PPT 场景页与单张 UI 原图的交叉核对”沉淀为 Family 可复用能力，而不是一次性的人工看图流程。该能力只建立视觉与产品证据，不直接改写 global UI 编号、领域事实、用户数据或业务代码。

## 能力链路

```text
PPT/图片输入
→ 渲染与素材定位
→ 局部屏幕识别
→ OCR/可见文案读取
→ 视觉信号抽取
→ 34 UI baseline crosswalk
→ 冲突与人工确认门
→ 报告/READY marker
→ Git 与证据隔离自检
```

| 模块 | 输入 | 核心处理 | 输出 | 不可越过的边界 |
|---|---|---|---|---|
| 1. PPT / 图片渲染 | PPT/PPTX、页面号、单张 UI 图、用户直接附件。 | 解析 PPT、渲染指定页、定位同页局部 screen；对长图按可读密度分块。 | `source_anchor`、渲染图、单图可用性。 | 局部 PPT 序号不等于 global UI ID。用户附件可作 P0 视觉证据。 |
| 2. 局部屏幕识别 | PPT 场景页。 | 标识每一个局部屏的标题、局部序号、入口/出口和所属场景。 | `ppt_scene_id`、`ppt_local_sequence`、屏幕清单。 | 同一 PPT 页中的 L1–L6 只描述局部叙事。 |
| 3. OCR / 可见文案 | 清晰单图和 PPT screen。 | 读取标题、CTA、步骤、状态、任务、服务、资产和风险提示。 | 可追溯文本信号。 | OCR 不清或文字模糊时标 `NEEDS_CONFIRMATION`，不补写。 |
| 4. 视觉信号抽取 | 图片、文案、页面上下文。 | 同时抽取：**结构**（顶栏/卡片/tab/导航）、**文案**、**动作**、**对象/能力边界**。 | `visual_signals`、`action_signals`、`object_boundary`。 | 颜色或名称相似不能单独构成 exact 映射。 |
| 5. 34 UI baseline crosswalk | global UI 表、PPT 局部屏、视觉信号。 | 对照四类信号，登记 `EXACT / REUSE / OVERLAP / NO_GLOBAL_SCREEN / CONFLICT`。 | 一行一个 local screen 的交叉表。 | 不自动顺延或重排 global UI ID；只对直接确认的 UI 做单点校正。 |
| 6. 冲突 / 人工确认门 | Crosswalk 差异、缺图、版本重叠、对象边界冲突。 | 建立 `conflict_id`、受影响 UI、来源、候选处理与最小人工确认问题。 | `CONFLICT`、`MISSING_IMAGE`、`PPT-only gap` register。 | `Perspective != Fact`；视觉证据不能授权数据写入、排名、诊断或外部 action。 |
| 7. 报告 / READY marker | 完整 crosswalk 和 gap register。 | 输出基线、视觉审计、差距分析或裁决包；写入明确 marker。 | Markdown 报告和 `*_READY` marker。 | READY 只表示审计产物完成，不表示冲突已裁决或页面已开发。 |
| 8. 自检命令 | 报告路径、Git 状态、staged candidate。 | marker grep、路径状态、cached name-only、staged leak、diff check。 | 可复核的 PASS/FAIL。 | 未通过隔离自检不得将研究文档混入功能切片。 |

## 标准 Crosswalk 记录

| global_ui_id | ui_image_file | visual_signals | ppt_scene_id | ppt_local_sequence | ppt_visual_signals | visual_match_level | mapping_type | evidence_note | conflict_or_gap |
|---|---|---|---|---|---|---|---|---|---|
| `UI-##` | `<P0/P2 source anchor>` | `<结构+文案+动作+对象>` | `<scene>` | `<L#>` | `<同四类信号>` | `EXACT_VISUAL / PARTIAL_VISUAL / SEMANTIC_ONLY / NO_VISUAL_MATCH / MISSING_IMAGE` | `EXACT / REUSE / OVERLAP / NO_GLOBAL_SCREEN / CONFLICT` | `<可追溯来源>` | `<明确缺口或 none>` |

## 处理规则

| 结果 | 处理动作 | 是否允许继续开发 |
|---|---|---|
| `MISSING_IMAGE` | 记录应有路径与缺失原因；请求 P0 用户原图或确认 source anchor。 | 否。 |
| `REUSE` | 保持一个 global UI，记录多个 PPT 场景复用。 | 可以，但不能重复建设对象。 |
| `CONFLICT` | 保留双方来源，创建 correction proposal 和人工确认项。 | 受影响页面暂停动态化。 |
| `PPT-only gap` | 标为 `NO_GLOBAL_SCREEN`，决定其是内部状态、待增页面还是不纳入。 | 否，直到产品裁决。 |
| `SEMANTIC_ONLY` | 记录业务关联，不称视觉复用。 | 仅可用作领域关系，不可用于页面复刻或对象合并。 |

## 最小自检命令

```bash
# marker
rg -n '<READY_MARKER>' 50_开发_dev/reports/m2/frontend/*.md

# 文档不进入功能切片
cd /home/ubuntu/family-repo-review
git status --short -- 50_开发_dev/reports/m2/frontend
git diff --cached --name-only | grep -F '50_开发_dev/reports/m2/frontend/'

# 已有 staged candidate 不被覆盖
git diff --cached --name-only | wc -l
git diff --cached --check
```

> **当前实例。** Family 的 34 UI × PPT 视觉审计使用该链路处理同一份商业模式 PPT 的第 5、6、8、10、12、14 页。`UI-01`、`UI-02`、`UI-03` 的用户直接原图作为 P0 证据，只做三项单点映射校正；UI-04 至 UI-34 未自动重排。

**FAMILY_VISUAL_EVIDENCE_CROSSWALK_MODULES_READY** `50_开发_dev/reports/m2/frontend/FAMILY_VISUAL_EVIDENCE_CROSSWALK_MODULES_001.md`
