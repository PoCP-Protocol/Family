# 待建清单

本目录**只有设计,没有实现**。README 描述的整套装置需要从零建。

判定依据(2026-08-09 实测):归档前 `research/` 目录下除 `README.md` 外,只有 `byresearch/` 里的 4 个 py 文件,而那 4 个文件属于另一个设计(循证知识五层卡片库),已移交 `..\20_知识_knowledge\`。

---

## 代码

| 文件 | 职责 | 状态 |
|---|---|---|
| `byresearch/hypothesis.py` | 假设登记与裁决装置(证伪优先) | **不存在** |
| `byresearch/econ.py` | 单位经济引擎:漏斗、LTV/CAC、敏感性、蒙特卡洛 | **不存在** |
| `byresearch/report.py` | 结论卡与报告渲染 | **不存在** |
| `byresearch/cli.py` | 命令行入口 | **不存在** |
| `byresearch/evidence.py` | 证据等级 E0–E7、溯源、结论门 | **已存在**,但在 `..\20_知识_knowledge\byresearch\` —— 可直接复用,不要复制第二份 |

## 目录

| 目录 | 内容 | 状态 |
|---|---|---|
| `agenda/` | 四条研究线的议题库(YAML) | **不存在** |
| `hypotheses/` | 从材料提取的假设(YAML),带 falsifier | **不存在** |
| `scenarios/` | 单位经济情景参数(YAML),每个参数标注出处 | **不存在** |
| `findings/` | 裁决结论卡与报告输出 | **不存在** |
| `docs/METHODOLOGY.md` | 方法论:证据等级、来源门、证伪协议 | **不存在** |
| `docs/GUARDRAILS.md` | 红线:合规、伦理、不越界 | **不存在** —— 但 README 与根 `README.md` 都引用了它 |
| `tests/` | 测试 | **不存在** |

`docs/GUARDRAILS.md` 缺失影响面最大:它被多处引用为红线出处,目前是**悬空引用**。

## README 里跑不起来的命令

以下命令全部依赖上面缺失的文件,现在执行都会失败:

```
python -m byresearch.cli agenda
python -m byresearch.cli hypotheses
python -m byresearch.cli econ
python -m byresearch.cli adjudicate
python -m byresearch.cli report -o findings
pytest -q
```

---

## 建议的建设顺序

1. **`docs/GUARDRAILS.md`** —— 先把红线写下来,它已被多处引用,且不依赖任何代码。
2. **`hypotheses/*.yaml`** —— 从 `..\30_素材_materials` 提取假设并登记,每条必须带 `falsifier`(什么证据出现就算被推翻)。注意:**只能从原始 PPT 提取,不能用自家生成的解读文档**,否则构成 E1 自证;详见 `..\30_素材_materials\PROVENANCE.md`。
3. **`hypothesis.py`** —— 裁决装置。复用 `..\20_知识_knowledge\byresearch\evidence.py` 的 `Grade` / `Provenance` / `NON_DECISIVE`,不要另写一套等级。
4. **`econ.py` + `scenarios/`** —— 单位经济。所有输出必须标 `SIMULATED` 溯源,按门禁**永远不能用于裁决"成立"**,只能生成假设和设定验收门槛。
5. **`agenda/`、`report.py`、`cli.py`、`tests/`** —— 最后补。

## 与规格的接口(优先级说明)

`..\10_规格_spec\05` 的 Phase 5 已安排「30→100 家庭 Pilot」,并把商业阶梯(21天 → 90天 → 年会员)当作既定前提 —— 而这条阶梯正是本目录 BM 线要证伪的对象。

也就是说:**BM 线的裁决时间点,决定了 Pilot 的数据能不能被解释。** 建议把「BM 线出首次裁决」设为 `G5 Pilot Gate` 前置条件。见 `..\10_规格_spec\ISSUES.md` C1。

这也意味着上面的顺序里,第 2、3 步(假设登记 + 裁决装置)比 `econ.py` 更紧急。
