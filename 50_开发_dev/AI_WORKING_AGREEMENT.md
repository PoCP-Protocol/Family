# AI Working Agreement

Family使用AI开发，但AI不是Accountable Owner。

## 1. 四种AI岗位

### Planner AI
只负责：
- 阅读WBS/状态
- 任务拆解
- 依赖分析
- Task Pack建议

不得直接写业务代码。

### Builder AI
只执行一个Approved Task。

### Reviewer AI
独立检查Builder结果：
- Spec compliance
- scope
- domain
- security
- tests
- architecture

### Release AI
只检查：
- acceptance criteria
- tests
- migrations
- rollback
- release gate

---

## 2. One Task One Context

Coding AI不应该每次加载所有战略文档。

它只需要：
- CLAUDE.md
- PROJECT_STATUS.md
- CURRENT_SPRINT.md
- 当前Task
- Task引用的Spec
- 当前相关代码

---

## 3. One Writer, One Reviewer

同一个Task：
- Builder负责实现
- Reviewer必须用独立上下文做Review

---

## 4. Human Decision Points

必须由人决定：
- 是否批准新Epic
- 是否批准Ontology变化
- 是否接受Breaking Change
- 是否调整Safety/Consent
- 是否进入Pilot
- 是否进入下一Milestone
