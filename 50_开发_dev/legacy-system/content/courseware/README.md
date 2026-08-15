# Family 课件生产 AI 系统 · 评审包(FCPS)

分支 `fels/courseware-commercial-v2`(基于 `fels/bangyang-course-service-port`)。**未合并,待评审。**
一句话:一条"**库先行 + 生成式填充 + 护栏守真 + 人审背书**"的课件生产线;首个实例 = `PARENT_21D_V1`(21 天家长训练营)。

## 1. 怎么跑(一源多出)
```bash
cd 50_开发_dev/legacy-system/content/courseware/tools
python build_deck.py             # → ../decks/PARENT_21D_V1/index.html      HTML deck(26页)
python build_pptx.py             # → ../decks/PARENT_21D_V1/PARENT_21D_V1.pptx 真PPT(26页, python-pptx)
python build_workbook.py         # → ../workbooks/PARENT_21D_V1/index.html   家长工作簿(22页,可打印/填写)
python build_facilitator_guide.py# → ../guides/PARENT_21D_V1/index.html     讲师手册(22页,DRAFT脚手架)
```
源 = `parent_21day_camp.yaml`;改内容只改 YAML,四产物重生成即可。

## 2. 文件地图
```
content/courseware/
├── parent_21day_camp.yaml                      课件源(21天/8实核源/商业化缺口登记)
├── library/                                    方法库(库先行)
│   ├── constructs.yaml (7) · methods.yaml (17) · sources_handoff_to_platform.yaml (8 DOI)
│   ├── research_log.md (R1 诚实空结果) · README.md (分层/治理/边界)
├── decks/PARENT_21D_V1/{index.html, PARENT_21D_V1.pptx}
├── workbooks/PARENT_21D_V1/index.html
├── guides/PARENT_21D_V1/index.html
├── tools/{build_deck,build_pptx,build_workbook,build_facilitator_guide}.py
├── COURSEWARE_AUTHORING_METHOD_V1.md           六步循证生产 SOP
├── COMMERCIAL_COURSEWARE_METHOD_V1.md          怎么做高质量/商业化课件
├── FAMILY_COURSEWARE_DESIGN_SYSTEM_V1.md       设计系统母版(色板/字阶/网格/组件)
└── FAMILY_COURSEWARE_PRODUCTION_SYSTEM_V1.md   FCPS 系统架构 + 能力真相
Agent: .claude/agents/courseware-author.md      编排 Agent v2(needs-analysis/deep-research/iterative-refine/…)
```

## 3. 能力真相(诚实:EXISTS / PARTIAL / DECLARED / MISSING)
| 能力 | 状态 |
|---|---|
| 方法库(constructs/methods) | **EXISTS** |
| 一源多出四产物(deck/pptx/workbook/guide) | **EXISTS**(真产物,可打开) |
| 设计系统组件化 + 一页一观点 + 叙事弧 | **EXISTS** |
| 证据实核(8 DOI,crossref) | **EXISTS**;canonical verified_sources 归 W2R-103B(交待入清单) |
| deep-research 多通道 / iterative-refine 视觉闭环 | **DECLARED**(契约;当前 evidence-research 仅 crossref 单通道) |
| 讲师手册话术/卡点 | **DRAFT 脚手架**(43 处待专家补) |
| chart/diagram / 插画 / 多媒体 / render+多模态视觉自评 | **MISSING** |
| 专家终审签名 | **MISSING(强制,AI 不可代签)** |
| 接产品消费闭环(baseline→打卡→观察→报告→复购) | **HOLD**(需架构师放行) |
| 合规法务(PIPL/未成年人/营销/版权) | **MISSING** |
| 真实家庭验证 | **MISSING** |

## 4. 商业就绪门(10 项)
✅ EVIDENCE_BREADTH(8实核源) · ✅ 内容/设计系统 · ⚠️ FACILITATOR_GUIDE(草稿脚手架) · ⚠️ PARENT_WORKBOOK(草稿) ·
❌ HUMAN_EXPERT_SIGNOFF · ❌ VISUAL_MEDIA(仍文字卡) · ❌ ASSESSMENT_REPORT_LOOP(HOLD) · ⚠️ SEGMENTATION(单轨) ·
❌ COMPLIANCE · ❌ REAL_VALIDATION_PLAN
> 结论:`EVIDENCE_READY / CONTENT_DRAFT`,**非 COMMERCIAL_READY**。

## 5. 缺口与归属(谁来解锁)
- 专家终审签名 → **人类持证专家**(AI 不代签)
- 接产品 runtime / 消费闭环 → **架构师放行**(课程平台/FELS-2 HOLD)
- 合规法务 → **法务/外部**
- canonical verified_sources 硬化 → **W2R-103B(Principal AI)**;本域已交 `sources_handoff_to_platform.yaml`
- 视觉多媒体 + render 多模态闭环 → 需实现 + 多模态模型(经 Model Gateway)
- 真实验证 → alpha(~20 家庭)→ pilot(~100 家庭)

## 6. 边界(全程遵守)
FELS/课件 lane;未接 Family canonical、未触发 FELS-2 能力;verified_sources canonical 不由本域写;
未合并 master;证据诚实(无编造 DOI/无套高等级);红线内建(不诊断/不承诺疗效/危机转人工);视觉提升不改"什么算真"。
