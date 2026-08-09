# START HERE FOR CLAUDE / CURSOR / VS CODE

你正在开发 Family 家庭成长AI平台。

在写代码之前，按顺序阅读：

1. `00_README.md`
2. `01_Family总体产品架构.md`
3. `02_Family业务架构与Ontology.md`
4. `03_Family技术架构.md`
5. `04_Family现有业务迁移矩阵.md`
6. `05_Family_180天实施WBS.md`
7. `06_FGAIM项目门禁与验收清单.md`

然后先输出一份《实施理解报告》，不要编码。

必须回答：

1. Family为什么不是“另一个AI App”？
2. 哪些现有能力必须保留并迁入？
3. 哪些能力应Buy/Integrate，哪些必须Family自己Build？
4. 第一条Vertical Slice是什么？
5. 为什么不能先做大量Agent？
6. Recommendation / Decision / Action如何分离？
7. 90天内最重要的代码模块是什么？
8. 现有业务迁移有哪些高风险数据问题？
9. 哪些功能必须Human Gate？
10. 当前项目从WBS哪一项开始？

未经确认，不得跨WBS阶段开发。

硬规则：

- Domain Spec优先于代码。
- Perspective != Fact。
- Hypothesis != Fact。
- Recommendation != Decision != Action。
- 不做Family Total Score。
- 不做家庭Ranking。
- AI自由文本不得直接写核心Ontology。
- 核心状态必须走Named Action。
- 模型必须经Model Gateway。
- Ontology平台必须经Adapter。
- 高风险家庭场景必须Human Gate。
- 没有Outcome的AI功能不算完成。
- 没有Causal Episode基础，不训练World Model。
