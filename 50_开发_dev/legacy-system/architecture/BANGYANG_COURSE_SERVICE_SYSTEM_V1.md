# 榜样教育 课程与服务体系 研究总结(FELS 移植依据 V1)

```text
DOC_KIND        = RESEARCH_SUMMARY_FOR_FELS_PORT
SCOPE           = 榜样教育(邦阳)成功经验:课程体系 + 服务体系
SOURCE_TIER     = E1(自家战略/商业材料 S1–S4;上限 E1,仅用于忠实理解"教什么/怎么服务",不用于证明成立)
SOURCE_REFS     = 30_素材_materials/_extracted/逐页文本_含页码/ · S1 战略白皮书 · S2 新商业模式
NON_SOURCE      = 不采用 all_materials.txt 第1656行起自家生成物(自证污染)
TARGET          = FELS(legacy-system 参考系),忠实建模旧世界 → 再迁移 Family
```

> 目的:把榜样教育**被验证跑通的课程+服务打法**,先在 FELS 里忠实建成"旧世界模型"(含其真实摩擦),为后续 FLM 迁移到 Family 做锚。**FELS=参考实现,非真实邦阳生产库。**

---

## 一、成长漏斗(榜样教育的经营主线,S2 p7)

```text
触发 → 觉醒 → 行动 → 改变 → 长期 → 传播
```
| 阶段 | 家长心理 | 平台动作 | 核心产品 | 关键指标 |
|---|---|---|---|---|
| 触发 | 孩子出现现实问题 | 问题场景吸引进入 | 内容 / 沙龙 / 家庭测评 | 访问、测评启动率 |
| 觉醒 | 想找到原因 | 温和呈现家庭互动影响 | **AI 诊断 + 父母成长报告** | 测评完成率 |
| 行动 | 愿意尝试改变 | **把学习变成每日小行动** | **21天挑战 · 每日任务** | 挑战参与/完成率 |
| 改变 | 想看到真实效果 | **系统陪跑 + 反馈** | **90天计划 · 顾问 · 社群** | 结果案例、满意度 |
| 长期 | 需要持续支持 | 沉淀会员/档案/关系 | 年度会员 · 活动 · AI 管家 | 续费、活跃 |
| 传播 | 愿展示成长 | 生成可分享身份/结果 | 成长报告 · 社区 · 邀请 | 分享、邀请成功率 |

核心命题(S1/S2):**孩子问题是入口,父母成长是价值,家庭改变是结果**;**从提分转向成长、从课堂转向家庭、从课程转向陪伴**;**用户买的不是 AI,是"孩子改变 + 家庭关系改善"的确定性**。

---

## 二、课程体系(Course System)

1. **入口内容/沙龙**:以真实问题场景(手机、写作业拖延、顶嘴、厌学、亲子冲突)切入,低门槛触发。
2. **家庭测评(诊断)**:父母画像 / 孩子画像 / 家庭画像;维度含"教育方式、沟通风格、焦虑点、参与度"(S1 p19)。→ 产出**父母成长报告** + 成长优先级。
3. **课程/知识**:课程是"入口 + 能力载体",非终点;真正沉淀的是家庭成长数据与陪伴。→ FELS 里 Course/Lesson/Class/Enrollment/Attendance(完成=学习历史,**非 Outcome**)。

> 注:S1–S4 为战略/商业文档,**未含具体课程大纲**;课程内容细节在本材料层缺失(不臆造),需另取教学材料补。

---

## 三、服务体系(Service System)—— 榜样教育留存与价值的主体

### 3.1 21天挑战(行动段,首个可见改变)
- 机制:**每日小任务 → 打卡 → 反馈 → 坚持感**;第一次让家长看到行为改变。
- FELS 实体:TrainingProgram(21-day)· LegacyTask(每日任务)· LegacyCheckIn(打卡)· HomeworkReview(反馈)。
- 红线:**Check-in ≠ Outcome**(打卡不是成长结果)。

### 3.2 90天系统陪跑(改变段,四阶段)
S1/详细方案四阶段:
```text
Phase1 SEE(D1–14)         看见孩子/家长/关系真实状态 → 初始 Profile + Priority
Phase2 PARENT_FIRST(D15–35) 家长先改变自己能改变的(情绪调节/理解倾听/自主支持/期待/边界)★一等价值
Phase3 CO_CREATE(D36–60)  孩子参与目标与家庭规则(能动性/选择/自我调节/协作)
Phase4 STABILIZE(D61–90)  新互动方式跨场景稳定 → 综合 Review + Milestone + 下一步
```
- FELS 实体:TrainingProgram(90-day)· ProgramEnrollment · 阶段任务/打卡 · ProgramReport(阶段报告)。
- 内核:**家长先改变("先连接再纠正")**——与平台唯一干预 LISTEN_BEFORE_RESPOND 同源。

### 3.3 人工服务角色(Human Service)
| 角色 | 职责 | 节奏 | FELS 实体 |
|---|---|---|---|
| **助教** | 每日提醒 + 打卡反馈 + 行为观察 | 每日 | Staff · HomeworkReview · LegacyCheckIn |
| **顾问(Advisor)** | 解读测评、制定/调整计划、阶段沟通 | 阶段/关键点 | AdvisorSession · AdvisorNote |
| **专家(Specialist)** | 疑难/高风险个案介入 | 按需 | ServiceCase |
- 红线:AdvisorNote/观察 = **Perspective / HumanObservation 候选,非 Fact**。

### 3.4 会员/社群(长期段)
- 年度会员(持续陪伴/档案/AI 管家)· 社群(同伴陪伴/话题/活动)。
- FELS 实体:Membership · Community/CommunityMember · Activity/ActivityEnrollment。
- 红线:群成员 ≠ FamilyRelationship/Consent;商业 ref 不授权数据使用。

### 3.5 裂变/口碑
- 原则:**传播结果,不传播焦虑**(S2 p9);推荐靠成长权益/身份荣誉,非现金佣金;传播内容=测评报告/成长案例/挑战邀请。

---

## 四、教育红线(与 Family 硬规则呼应,FELS 建模须显式保留为"旧世界摩擦 + Family 边界")

```text
不做 Family Total Score · 不做家庭 Ranking · Growth Profile 是阶段状态非人格标签
不把 Child Growth 定义为"服从" · 传播结果不传播焦虑
Check-in ≠ Outcome · AdvisorNote ≠ Fact · 测评分数/标签 = 历史证据候选(旧世界有总分/排行,迁移时 RETIRE)
```

---

## 五、映射到 FELS 12 域(MODULE_CONTRACTS)与移植状态

| 榜样教育环节 | FELS 域/实体 | FELS 现状 | 移植动作 |
|---|---|---|---|
| 测评诊断 | 04 Assessment(Template/Session/Score/Report) | FELS-1 已建(0002) | 复用 |
| 课程/LMS | 05 Course/Lesson/Class/Enrollment/Attendance | FELS-1 已建(0002) | 复用 |
| 商业/会员 | 10 Order/Payment/Membership | Order/Payment 已(0002);Membership 待 | 补 Membership(FELS-3) |
| 21天/90天陪跑 | 06 Program/Coaching(TrainingProgram/ProgramEnrollment) | 0003 program lifecycle 部分 | **深化 FELS-2**:阶段化 program + ProgramReport |
| 每日任务/打卡/作业 | 07 Task/CheckIn/Homework(LegacyTask/CheckIn/HomeworkReview) | 待 | **新增 FELS-2** |
| 助教/顾问/专家 | 08 Human Service(Staff/Advisor/AdvisorSession/AdvisorNote/ServiceCase) | 待 | **新增 FELS-2** |
| 社群/活动 | 09 Community/Activity | 待 | 补 FELS-3 |
| 旧 AI/分数/排行 | 11 Legacy AI/Analytics | 待(脏世界) | FELS-4(诱饵,后置) |

**结论:榜样教育课程体系已由 FELS-1(测评+课程+订单)覆盖;其"服务体系"主体(21/90天陪跑 + 每日任务打卡 + 助教/顾问 + 会员/社群)= FELS-2 + FELS-3,是本次移植重点。**

---

## 六、下一步(移植清单,请架构师确认后落 schema/module)

```text
P1 FELS-2 Program & Human Service(榜样教育服务体系主体):
   TrainingProgram(7/21/90-day 阶段化)· ProgramEnrollment · ProgramReport(阶段报告)
   LegacyTask(每日任务)· LegacyCheckIn(打卡)· Homework · HomeworkReview(助教反馈)
   Staff · Advisor · AdvisorSession · AdvisorNote · ServiceCase
   语义否定内建:Check-in≠Outcome · AdvisorNote≠Fact · Program 阶段≠成长结果
P2 FELS-3 Ecosystem:Membership · Community/CommunityMember · Activity
边界:FELS=参考实现;不接真实邦阳源;不写 Family canonical;红线(不总分/排行/贴标签/传播焦虑)显式保留为迁移时 RETIRE/Annotation。
```
