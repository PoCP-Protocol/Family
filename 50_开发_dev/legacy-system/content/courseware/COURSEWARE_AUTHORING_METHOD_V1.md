# 课件生产方法论 SOP V1(可交 Agent 执行)

```text
PURPOSE = 把"做 21天家长训练营课件"的过程固化为可复制方法,供 courseware-author Agent 生成任意课程课件
PRINCIPLE = 生成式而非手搓;循证而非营销;证据诚实不硬凑;红线内建
```

## 输入(course spec)
```yaml
course_code: 唯一码(如 PARENT_21D_V1)
title: 课程名
audience: 对象(家长/孩子/家庭;默认父母先改变)
duration: 课时数/天数
goal: 一句话目标
phase_arc: 阶段弧线(可空,由 Agent 依循证范式提议)
home: 挂载去处(FELS content_ref / Family 知识库 / 中立源)
```

## 六步法(Agent 逐步执行)

**P1 定题与结构**
- 依循证家长项目范式(6–8 次课技能建构 + 课间练习)把 duration 拆成"阶段弧线 + 每课时一个可练技能"。
- 阶段默认:看见与连接 → 家长先改变(PARENT_FIRST)→ 共创与稳定。

**P2 循证地基(必须先做,禁止跳过)**
- 用 `curl api.crossref.org/works?query=…` 检索该主题的循证项目/方法,取真实标题/摘要/DOI。
- 用 `curl api.crossref.org/works/<DOI>` 逐条机器核验(返回真实标题=真源)。
- 抽方法内核(如情绪教练/先连接再纠正/主动倾听/打断强制循环/家长调节)。
- **证据诚实铁律**:可引证处引 crossref 已核验 DOI + 诚实 Grade;无直接来源的技能标 `practitioner`(实践方法,证据待验);**严禁编造 DOI/等级、严禁给营销话术套 E7**。

**P3 逐课时生成**
- 每课时 = 一个可练技能,填统一模板:
  `theme(主题) · skill(技能) · why(为何有效+机制) · evidence_refs(引证或 practitioner) · parent_action(今日一件小事,低剂量可执行) · say_it_tonight(今晚可说的话,话术示范) · look_for(观察什么,非评判) · boundary(边界/免责)`

**P4 红线校验(逐课时过)**
```text
父母先改变(不把孩子当被改造对象)· 不贴标签/不诊断 · 不制造焦虑/不比较排名
打卡≠Outcome · 完课≠改变 · 观察≠事实 · 顾问/点评≠事实 · 危机(自伤/家暴)→ 不在课件内处理,转人工
```

**P5 结构化产出 + 挂载**
- 产出 YAML(meta + days[]),字段同模板;`content_ref` 挂 FELS `legacy_daily_tasks`/`legacy_training_camps`(或 Family 知识库)。
- 忠实领域模型,不新增 canonical、不越授权。

**P6 自检(产出后)**
```text
[ ] 每课时单技能、可执行(parent_action 不空泛)
[ ] evidence_refs 要么是 crossref 可核 DOI,要么诚实标 practitioner —— 无编造
[ ] 红线逐条守(尤其 打卡≠结果 / 不贴标签 / 危机转人工)
[ ] 阶段弧线连贯(前后课时递进,不重复堆概念)
[ ] content_ref 命名规则一致(course_code#Dn)
```

## 参考实现
`content/courseware/parent_21day_camp.yaml`(PARENT_21D_V1)= 本方法的首个完整产物。
证据地基见 `architecture/FAMILY_EDUCATION_COURSE_SYSTEM_RESEARCH_V1.md`。

## 反例(禁止)
- 直接抄营销大纲当课件(未循证)。
- 给没有来源的技能套学术 DOI/高证据等级("洗白")。
- 把课件写成"评分/排名/贴标签/制造焦虑"。
- 用坏掉的 WebSearch/WebFetch 假装搜过 —— 本环境用 `curl+crossref`。
