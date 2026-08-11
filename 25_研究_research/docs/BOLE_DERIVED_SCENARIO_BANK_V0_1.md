# Bole-derived Scenario Bank V0.1

日期: 2026-08-10

来源边界: Bole.AI / JoySoul / AiSoul 外部数据已暂存于 `50_开发_dev/integrations/sources/bole-ai/`。本场景库只抽取痛点、语境、栏目线索与训练样本候选。所有条目证据等级上限为 E1,不得作为专业事实或效果证明。

---

## 1. 使用规则

1. `sourceId` 必须保留,不得改写成 Family canonical ID。
2. `painId` 是场景分类,不是孩子或家庭标签。
3. `candidateUse` 只能是 `scenario`, `style`, `column`, `eval`, `discard-review`。
4. 进入训练前必须经过授权、脱敏、人工复核与 consent 检查。
5. 涉及自伤、家暴、虐待、严重心理危机、医疗诊断、未成年人敏感隐私的条目必须进入 Human Gate 样本,不得作为普通陪练样本。

---

## 2. Pain Taxonomy V0.1

| painId | 中文名 | Family 维度候选 | 首选能力 |
|---|---|---|---|
| screen-time | 手机/游戏/短视频冲突 | R03/R04/R05/P03 | 家庭规则共创 + 沟通改写 |
| defiance | 顶嘴/对抗/闭门 | R03/R05/P03 | 青春期沟通话术改写 |
| low-drive | 厌学/动力低/提不起劲 | C03/C05/P04 | 动机澄清 + 低剂量行动 |
| homework-drag | 作业拖拉/陪写冲突 | R03/P03/C04 | 父母情绪暂停 + 作业场景重构 |
| parent-blowup | 吼完后悔/情绪爆发 | P02/P03/R03 | 父母第二成长陪练 |
| parent-second-growth | 父母想改变自己 | P01/P02/P03 | 家长成长陪练 + 21 天挑战 |
| family-structure | 二孩/隔代/单人带娃 | R01/R06/R08 | 家庭小会 + 角色边界 |
| boy-parenting | 男孩调皮/标签担忧 | C01/P07/R03 | 非标签化观察 + 方法重构 |
| sensitive-child | 敏感/胆小/不敢表达 | C02/P02/R03 | 气质重构 + 安全感行动 |
| sibling-attention | 多孩关注不均 | R06/R08/P03 | 独处时间 + 需求识别 |

---

## 3. Seed Scenarios

| scenarioId | sourceId | painId | userSurface | 法咪莉回应方向 | candidateUse | risk |
|---|---|---|---|---|---|---|
| BOLE-SCN-001 | bbxz-v1-c1 | screen-time | 一到周末就要手机,不给就闹,不知怎么定规矩 | 不从“没收”切入,先做双方可见小约定 | scenario/column | normal |
| BOLE-SCN-002 | bbxz-v1-c2 | defiance | 好好说话就顶嘴,越讲道理越远 | 从“讲道理”改成三分钟倾听和复述 | scenario/style | normal |
| BOLE-SCN-003 | bbxz-v1-c3 | low-drive | 说不想上学、提不起劲,催了更躺 | 不贴懒标签,先找一个可完成小目标 | scenario | review |
| BOLE-SCN-004 | bbxz-v1-c4 | homework-drag | 陪写作业一催就吵,拖拉磨蹭 | 把催促改成提问,分离作业与亲子关系 | scenario/column | normal |
| BOLE-SCN-005 | bbxz-v1-c5 | parent-blowup | 吼完又后悔,控制不住脾气 | 暂停 + 修复两步,不把父母妖魔化 | scenario/style | normal |
| BOLE-SCN-006 | bbxz-v1-c6 | parent-second-growth | 想学父母怎么改变自己,而不是只改孩子 | 父母第二成长入口,今晚只观察一个触发点 | scenario/column | normal |
| BOLE-SCN-007 | bbxz-v1-c7 | family-structure | 一个人带娃太累,老人观念还不一致 | 隔代约定 + 自我关怀,不要一次解决全家系统 | scenario | review |
| BOLE-SCN-008 | bbxz-v1-c8 | boy-parenting | 男孩调皮管不住,又不敢乱贴标签 | 用行为观察替代“调皮”标签 | scenario | normal |
| BOLE-SCN-009 | family_edu_sft:L1 | parent-blowup | 辅导作业到最后控制不住吼他 | 先接住后悔循环,再找火气上来的具体瞬间 | style/eval | normal |
| BOLE-SCN-010 | family_edu_sft:L2 | defiance | 初二孩子放学后不愿说话,问一句就烦 | 区分关心与检查,找低设防时刻 | style/eval | normal |
| BOLE-SCN-011 | family_edu_sft:L3 | screen-time | 半小时游戏到点不肯停,硬关会摔东西 | 从二选一改成提前提醒和最后一局缓冲 | style/eval | review |
| BOLE-SCN-012 | family_edu_sft:L4 | sensitive-child | 孩子敏感、容易哭、不敢举手 | 把敏感重构为感受力,讨论安全感与抗挫 | style/eval | normal |
| BOLE-SCN-013 | family_edu_sft:L5 | sibling-attention | 老二一哭就去,老大眼神让人内疚 | 看见老大安静背后的需求,创造短独处时间 | style/eval | normal |
| BOLE-SCN-014 | mc-7665789405063480110 | screen-time | 作业留手机上怎么办 | 规则必须区分学习工具和娱乐入口 | scenario | normal |
| BOLE-SCN-015 | mc-7666990587383595812 | screen-time | 拖拉、沉迷手机、缺专注、缺自律混在一起 | 不混合归因,一次只选一个可观察行为 | eval | normal |
| BOLE-SCN-016 | mc-7665731122324865849 | screen-time | 不给手机也不学习 | 手机不是唯一原因,先找替代获得感和学习启动点 | scenario | normal |
| BOLE-SCN-017 | mc-7652477530066961210 | parent-second-growth | 父母二次成长才能改变孩子问题 | 可做栏目线索,但避免“父母全责”表达 | column/eval | normal |
| BOLE-SCN-018 | mc-7637816587042554651 | low-drive | 家长说法可能让孩子更厌学 | 先降压,避免恐吓式动员 | scenario | review |
| BOLE-SCN-019 | mc-7633081840819274530 | homework-drag | 作业一写错家长就控制不了情绪 | 先处理父母情绪触发,再谈作业策略 | scenario/style | normal |
| BOLE-SCN-020 | mc-7645322403128722227 | screen-time | 孩子说家长也抱着手机,没人陪 | 引入父母示范与共同替代活动 | scenario/eval | normal |

---

## 4. 推荐栏目转化

| 栏目 | 可转化 painId | 第一批题目 |
|---|---|---|
| 校长一分钟 | screen-time / defiance / parent-blowup | “孩子要手机,先别急着没收” |
| 今晚怎么说 | defiance / homework-drag | “把‘你怎么又拖拉’改成一句能继续谈的话” |
| 父母第二成长 | parent-blowup / parent-second-growth | “吼完后悔不是终点,修复才是起点” |
| 家庭小会模板 | screen-time / family-structure | “周末手机规则 10 分钟小会” |
| 校长看见了 | sensitive-child / sibling-attention | “那个安静站着的老大,也在求助” |

---

## 5. 下一轮扩展规则

1. 从 `short_video_signals_ingested.jsonl` 扩到 50 条人工复核场景。
2. 从 `family_edu_sft.jsonl` 抽 30 条风格正例,同时写 30 条反例。
3. 从 JoySoul 玩具/陪伴数据中只保留“AI 陪伴产品边界、安全、隐私、分龄”启发,不混入家庭教育建议证据。
4. 每条场景补 `ageBand`, `familyRole`, `riskFlags`, `humanGate`, `consentNeeded`, `evalTags`。
