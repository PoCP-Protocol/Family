# Manus 查看 PPT / 截图能力迁移到 Family 的方法与技能框架

**文档编号：** `FAMILY_MANUS_VISUAL_CAPABILITY_TRANSFER_FRAMEWORK_001`
**状态：** 方法框架；不是已部署的 AI Agent、生产服务或实际技能包。
**目标：** 将 Manus 已使用的 PPT/截图理解能力，转化为 Family 内部可实现的“视觉证据审计与 UI 基线核对”能力。它支持产品研发前的证据化核对，不替代产品设计裁决，不自动改写 global UI ID、家庭事实或业务对象。

## 1. 可移植能力总链路

```text
[输入登记]
  → [PPT / 图片渲染与定位]
  → [局部 screen 识别]
  → [OCR / 可见文案]
  → [视觉信号抽取]
  → [34 UI baseline crosswalk]
  → [冲突 / Human Gate]
  → [审计报告 / READY marker]
  → [Git 与证据隔离自检]
```

> **核心原则：** `global_ui_id` 是 Family 的稳定页面身份；PPT `local_sequence` 是某一叙事场景内部的顺序。二者必须经视觉、文案、动作和对象边界四项证据交叉核对，不能因序号相同或标题相似而互相替代。

## 2. Family 实现模块边界

| Family 模块 | 输入 | 输出 | 实现职责 | 明确不负责 |
|---|---|---|---|---|
| `VisualSourceRegistry` | PPT/PPTX、图片、用户直接附件、source metadata。 | source ID、hash、页码、图像路径、来源等级。 | 登记视觉证据和可追溯来源。 | 不把图片内容变成家庭/儿童业务事实。 |
| `PptRenderAdapter` | PPT 文件、目标页号。 | 页面 PNG、嵌入媒体索引、文本提取。 | 在 DEV/TEST 以受控适配器渲染 PPT。 | 不直接调用不受控外部转换服务。 |
| `ScreenSegmentationService` | PPT 页面图、布局候选。 | 局部 screen boxes、`ppt_scene_id`、`local_sequence`、置信度。 | 识别一张 PPT 中的多个手机 screen。 | 不据此生成 global UI ID。 |
| `VisibleTextExtractor` | 单图/PPT screen、OCR/VLM result。 | 标题、CTA、步骤、状态、标签与置信度。 | 提供可见文案候选和证据坐标。 | 不把低置信 OCR 补写成事实。 |
| `VisualSignalExtractor` | 画面、文本、产品上下文。 | 结构、文案、用户动作、对象/能力边界四类信号。 | 生成可审阅的视觉特征。 | 不自动推断医疗/教育诊断、能力标签或排名。 |
| `UiBaselineCrosswalkService` | 34 UI baseline、PPT local screen、视觉信号。 | `EXACT / REUSE / OVERLAP / NO_GLOBAL_SCREEN / CONFLICT` 映射。 | 维护“证据 → 页面身份”的交叉表。 | 不自动顺延/重排 global UI 编号。 |
| `ConflictAndHumanGateService` | 冲突、缺图、低置信、敏感内容、业务边界。 | gap register、correction proposal、人工确认任务、NO_ACTION。 | 把不确定性显式化并阻止错误自动化。 | 不绕过 consent/Human Gate，不执行真实外部 effect。 |
| `AuditReportService` | crosswalk、缺口、确认决策。 | Markdown 审计报告、统计、READY marker。 | 输出可复核证据包。 | READY 不代表裁决完成、功能已开发或可生产。 |
| `AuditValidationRunner` | 报告路径、Git 状态、staged candidate。 | marker 校验、路径状态、staged leak、差异检查结果。 | 证明研究文档与功能切片隔离。 | 不修改 index、不做自动提交或推送。 |

## 3. 标准输入与数据契约

```yaml
visual_audit_request:
  audit_id: VA-<uuid>
  scope:
    global_ui_ids: [UI-01, UI-02]
    ppt_sources: [ppt-source-id]
    ppt_pages: [5, 6]
  source_rules:
    priority:
      - user_confirmed_p0_image
      - canonical_single_ui_image
      - canonical_ppt_scene
      - text_only_reference
    never_infer_global_id_from_local_sequence: true
  evidence_rules:
    required_signals: [layout, visible_text, user_action, object_boundary]
    missing_image_status: MISSING_IMAGE
    low_confidence_status: NEEDS_CONFIRMATION
  isolation_rules:
    no_business_code_change: true
    no_git_add_commit_push: true
    preserve_staged_candidate: true
```

## 4. 渲染、OCR 与视觉信号工作流

| 步骤 | 方法 | 产物 | 失败/低置信时的动作 |
|---|---|---|---|
| 1. 输入登记 | 为 PPT、单图、用户附件生成不可变 source record。 | `source_anchor`。 | 缺文件标 `MISSING_IMAGE`，不以标题代替。 |
| 2. 渲染 | 对 PPT 指定页生成页面图；保存页码和媒体关系。 | `ppt_page_image`。 | 渲染失败保留文本抽取，标 `SOURCE_ANCHOR_MISSING`。 |
| 3. 局部 screen 分割 | 基于画面布局识别手机 screen、序号和标签。 | `local_screen[]`。 | 无法可靠分割时采用整页人工审阅，标 `NEEDS_CONFIRMATION`。 |
| 4. OCR/文案 | 抽取标题、CTA、步骤、状态和提示。 | `visible_text[]` + confidence。 | 不清晰内容不补全；使用 `<unreadable>`。 |
| 5. 视觉信号 | 同时比较布局、文案、动作和对象边界。 | `visual_signals`。 | 任一关键维度冲突则不能写 `EXACT`。 |
| 6. Crosswalk | 生成候选 global UI 与映射类型。 | `crosswalk_row`。 | 相似但对象不同写 `SEMANTIC_ONLY/OVERLAP`。 |
| 7. 冲突门 | 检查缺图、重复、全局/局部编号冲突、敏感页面。 | `conflict/gap`。 | 转人工确认或 `NO_ACTION`。 |

## 5. 34 UI Baseline Crosswalk 规则

| 字段 | 含义 | 规则 |
|---|---|---|
| `global_ui_id` | Family 34 页中的稳定身份。 | 只能由 canonical baseline 或已确认的单点裁决修改。 |
| `ppt_scene_id` | 核心服务、增长优化、商城裂变、名师/沙龙、社区/打卡、客户后台等场景页。 | 不等于业务对象，更不等于 global ID。 |
| `ppt_local_sequence` | 场景页内部 L1/L2 或 1–5/1–6 的屏幕顺序。 | 不能自动改写 global UI 编号。 |
| `visual_match_level` | `EXACT_VISUAL / PARTIAL_VISUAL / SEMANTIC_ONLY / NO_VISUAL_MATCH / MISSING_IMAGE`。 | 由四类信号联合决定。 |
| `mapping_type` | `EXACT / REUSE / OVERLAP / NO_GLOBAL_SCREEN / CONFLICT`。 | 保留一对多/多对一关系，不强行一一映射。 |
| `object_boundary` | 页面涉及的主数据、过程数据、投影或动作边界。 | 防止把商城、会员、服务、成长事实错误合并。 |

## 6. 冲突与 Human Gate

| 触发条件 | Family 动作 | Human Gate / HOLD 规则 |
|---|---|---|
| 单图缺失或 OCR 不可读 | `MISSING_IMAGE` / `NEEDS_CONFIRMATION`。 | 需要补充原图或页面 source anchor。 |
| PPT local sequence 与 global UI 不一致 | `CONFLICT` + correction proposal。 | 人工裁决后才能更新 canonical baseline。 |
| 视觉相同但对象边界不同 | `OVERLAP` 或 `SEMANTIC_ONLY`。 | 不合并订单、权益、服务、成长或儿童事实。 |
| AI 分数、同龄平均、问题标签、敏感建议 | 仅 explanation/recommendation。 | 不写 Fact、不排名、不 Total Score；敏感情形 Human Gate。 |
| 页面含真实通知、预约、支付、日历、视频或外发 | 输出 adapter boundary。 | DEV/TEST 可 mock/stub；真实 effect 为 L4 HOLD。 |
| 用户确认原图 | 作为 P0 视觉证据登记。 | 只裁决该具体 global UI；不得级联重排其他编号。 |

## 7. 报告与 READY Marker

每次审计必须产出：visual source registry、crosswalk table、gap/conflict register、人工确认问题、统计和 READY marker。marker 的意义必须精确：

```text
*_READY = 审计产物、证据引用与隔离自检已完成。
*_READY ≠ global ID 已全部裁决。
*_READY ≠ 页面已开发、已测试、可生产或允许外部副作用。
```

## 8. 最小自检命令

```bash
# 1. 报告完成标记
rg -n '<READY_MARKER>' 50_开发_dev/reports/m2/frontend/*.md

# 2. 研究文档不能混入功能切片
cd /home/ubuntu/family-repo-review
git status --short -- 50_开发_dev/reports/m2/frontend
git diff --cached --name-only | grep -F '50_开发_dev/reports/m2/frontend/'

# 3. 保留当前 staged candidate，不改 index
git diff --cached --name-only | wc -l
git diff --cached --check

# 4. 核验本轮不含业务代码改动
# Compare changed paths against declared documentation-only scope before staging.
git status --short -- 50_开发_dev/apps 50_开发_dev/database
```

## 9. 技能框架候选

该方法可在未来包装为内部技能 `family-visual-evidence-crosswalk`。触发条件包括：34 UI 基线建立、PPT 与单图视觉核对、跨版本页面冲突、UI 开发前证据门禁以及交付前 UI/规格一致性检查。正式创建技能前应先冻结：source registry schema、mapping type 枚举、human confirmation workflow、DEV/TEST rendering adapter 及其审计保留策略。

**FAMILY_MANUS_VISUAL_CAPABILITY_TRANSFER_FRAMEWORK_READY** `50_开发_dev/reports/m2/frontend/FAMILY_MANUS_VISUAL_CAPABILITY_TRANSFER_FRAMEWORK_001.md`
