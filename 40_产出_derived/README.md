# 自家产出

本目录放**我们自己生成的成品**,以及生成它的脚本。

与 `..\30_素材_materials\` 严格分开。归档前这两者是混的:成品躺在素材目录里,生成器躺在 `.tmp\`(随时会被当垃圾清掉)。

---

## 纲领与逐页解读

| 文件 | 是什么 |
|---|---|
| `榜样教育项目纲领与五份PPT逐页解读.docx` | 成品,61 KB |
| `guideline_final.pdf` | 同一内容的 PDF,25 页,855 KB |
| `build_guideline_doc.py` | **生成器**,52 KB,python-docx 手工排版 |

### 可重新生成

```powershell
cd D:\family\40_产出_derived\纲领与逐页解读
python build_guideline_doc.py
```

⚠ **脚本里的输出路径已失效。** 第 12 行写死的是归档前的旧路径:

```python
OUT = Path(r"D:\Family\materials\榜样教育\榜样教育项目纲领与五份PPT逐页解读.docx")
```

`materials\` 已改名为 `30_素材_materials\`,而且成品**不应该再写回素材目录**。跑之前需把 `OUT` 改为:

```python
OUT = Path(r"D:\family\40_产出_derived\纲领与逐页解读\榜样教育项目纲领与五份PPT逐页解读.docx")
```

**未擅自改这一行** —— 它是既有产出的溯源证据(正是靠它才确认那份 docx 是生成物而非原始素材)。改之前请留意这一点。

依赖:`python-docx`。PDF 由 LibreOffice(`soffice`)转换,中间页图见 `..\..\90_归档_archive\纲领渲染中间产物_可再生\`。

---

## 使用上的红线

**本目录的产出不得作为证据支撑自家主张。**

这份解读是对 `S1`–`S4` 的再表述,证据等级仍是 **E1(内部材料主张)**。拿它去支撑 PPT 里的判断,等于自己证明自己 —— 见 `..\20_知识_knowledge\byresearch\evidence.py`:

> 榜样教育自己的材料再详尽也只是 E1,不能用来证明自己。

具体地:`..\25_研究_research\` 提取假设时,**只能用 `..\30_素材_materials\_extracted\逐页文本_含页码\`,不能用本目录**。

已知污染:`..\30_素材_materials\_extracted\all_materials.txt` 第 1656 行起把本目录的 docx 抽了进去。详见 `..\30_素材_materials\PROVENANCE.md`。
