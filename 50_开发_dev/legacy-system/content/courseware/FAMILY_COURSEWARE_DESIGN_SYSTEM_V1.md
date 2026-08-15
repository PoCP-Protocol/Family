# Family 课件设计系统 · 母版 V1

```text
PURPOSE = 把"版面/视觉"从逐页即兴变成可继承的设计系统:LLM 只填内容槽,布局/视觉由母版承载。
OWNER   = FELS / courseware line
STATUS  = SPEC_V1(从现有 build_deck.py / build_pptx.py 的在用配色抽象而来,向后一致)
BINDS   = deck-generation Skill 的版面来源;视觉质量门(见 courseware-author)以此校验
```

## 0. 设计原则(源于第一性)
- **一页一观点 + 一个视觉载体**;认知负荷为约束,不以"信息完整"为目标。
- **内容/版面分离**:内容填槽,版面继承母版;风格一致靠系统不靠即兴。
- **诚实优先于好看**:不做评分/排名/贴标签/疗效的视觉;图表不误导(不截断坐标轴、不夸张比例)。

## 1. 色板(与现有 deck 一致)
```
ORANGE  #EA7317   主色/强调(day badge、"今日一件小事"暖卡、CTA)
BLUE    #2563EB   次色(skill、"今晚可说的话"蓝卡、链接/证据)
INK     #1F2937   正文主色
GREY    #6B7280   次要文字/phase 标签
BG_WARM #FFF7ED   暖底(action 卡 / cover 渐变起)
BG_BLUE #EFF6FF   蓝底(say 卡 / cover 渐变止)
BG_CARD #F8FAFC   观察卡   ·   BG_MUTED #F9FAFB 边界卡   ·   PAGE_BG #EEF2F7
WARN    #B45309   红线/免责提示(低调,不制造焦虑)
```
可及性:正文对底对比 ≥ AA;颜色不作唯一信号(配文字/图标)。

## 2. 字阶
```
H1 封面标题 44 · H2 页标题 34 · Skill 20(蓝) · 正文 17–18 · 卡标题 15(灰) · 说明/证据 13–14
字体栈: -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif
行高 正文 1.5;每页正文最多约 52 em 宽,避免长行。
```

## 3. 网格与版面
```
比例 16:9(13.333in × 7.5in / 或 100vh 全屏页)
页边距 6vh × 8vw(打印/投屏安全区);page-break-after: always
主体网格 2 列卡片(gap 16),卡片圆角 14、内边距 18–20、1px 描边、无重阴影
```

## 4. 组件库(deck-generation 只填槽)
| 组件 | 用途 | 槽位 |
|---|---|---|
| `cover` | 封面 | tag(course_code) · title · philosophy · arc · audience |
| `phase-divider` | 阶段分隔 | phase_code · phase_title · day_range |
| `daily-lesson` | 每日课(核心) | day · phase · theme(H2) · skill · why · 4 卡(action/say/observe/boundary) · evidence 行 |
| `four-card` | 一页一观点的承载 | 暖卡=今日一件小事 · 蓝卡=今晚可说的话 · 观察卡=看什么(过程非评分) · 边界卡 |
| `evidence-row` | 证据脚注 | DOI 链接(蓝)/ practitioner(灰);外推等级 |
| `weekly-review` | 周复盘 | 关注点 · 试了什么 · 观察到什么 · 还不能确定 · 下一步 |
| `closing` | 结营/下一步 | 综合复盘 · 值得继续 · 下一优先项 · 需要专家吗 |
| `chart` / `diagram` | 数据/概念可视化 | 走图表库/diagram-as-code,**不由 LLM 硬画** |

## 5. 一页一观点版式模板(强制)
- **daily-lesson 页**:H2=当日主张(一句),下挂 4 卡;bullet 上限 = 每卡 1–2 行;禁止把 why 写成长段。
- **每页必须有一个视觉载体**:4 卡布局本身即视觉载体;概念页可用 diagram,数据页用 chart。
- 超限(多主张/多 bullet/无视觉载体)→ 回炉(命中视觉质量门 `ONE_POINT_PER_SLIDE` / `VISUAL_CARRIER_PRESENT` 失败)。

## 6. 与视觉质量门的绑定
| 门 | 母版如何满足 |
|---|---|
| ONE_POINT_PER_SLIDE | daily-lesson 强制 H2 单主张 + bullet 上限 |
| VISUAL_CARRIER_PRESENT | four-card / chart / diagram 组件 |
| NARRATIVE_ARC | phase-divider + weekly-review + closing 承载 problem→insight→action |
| DESIGN_SYSTEM_CONSISTENT | 全页继承本母版(色板/字阶/网格/组件) |
| RENDER_VISUAL_SELFCHECK | render→多模态自评(iterative-refine 驱动) |
| AUDIENCE_EFFECT_REVIEWED | 观众视角评审(记住主张/可行动/低负荷) |

## 7. 落地与边界(诚实)
- **现状**:`build_deck.py`(HTML)/`build_pptx.py`(python-pptx)已在用本色板/4 卡,但**尚未组件化、无 render 视觉自评、无 chart/diagram、无插画**。本文件把"在用样式"升为**规格**,后续 deck-generation 按此组件化。
- **未做(DECLARED)**:组件库实现、chart/diagram 能力、插画/多媒体、render+多模态视觉闭环。涉及实现/多模态模型,须在授权与 Model Gateway 内做,不夸大为"已具备"。
- **纪律**:视觉一致/美观不得越过证据/红线/人审;不做评分/排名/疗效视觉。
