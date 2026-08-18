#!/usr/bin/env python3
"""Generate Phase A of the Bangyang 34-UI / 3-PPT master delivery plan.

This script only structures previously supplied source evidence.  It does not infer
production facts from UI/PPT content and does not call external services.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path('/home/ubuntu/family-repo-review/50_开发_dev')
TRANSCRIPT = Path('/home/ubuntu/transcribe_bangyang_34_ui.json')
OUT = ROOT / 'governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md'

PAGES = [
    ('UI-01', '家庭成长平台首页（首版参考）', '核心服务闭环', '首页入口', 'UI-02 清晰首页母版', '首版已由清晰母版替代，仅保留来源追溯。'),
    ('UI-02', '家庭成长平台首页（清晰母版）', '核心服务闭环', '家庭成长平台入口', '家庭成长体检 / AI诊断 / 计划 / 社群 / 我的', '当前首页唯一清晰视觉母版。'),
    ('UI-03', '家庭测评第 2/5 步', '核心服务闭环', '家庭成长体检第 1/5 步', 'AI成长诊断报告', '仅可作为 DEV mock 表单状态。'),
    ('UI-04', 'AI 成长诊断报告', '核心服务闭环', '家庭测评', '90 天成长方案', 'DEV 只允许固定 mock 报告。'),
    ('UI-05', '90 天成长方案', '核心服务闭环', 'AI成长诊断报告', '陪跑服务 / 我的服务', 'DEV 只允许 mock 方案与测试状态。'),
    ('UI-06', '陪跑服务 / 社群服务', '核心服务闭环', '成长方案', '今日成长任务 / 社区', 'DEV 只允许 mock 陪跑记录与内部跳转。'),
    ('UI-07', '我的 / 会员中心', '核心服务闭环', '底部我的入口', '我的服务 / 订单资产 / 家庭档案 / 服务记录', 'DEV 只允许模拟身份和权益展示。'),
    ('UI-08', '家庭成长体检第 1/5 步', '增长闭环', '首页免费家庭测评', '家庭测评第 2/5 步', 'DEV 只允许固定选择，不接入真实量表。'),
    ('UI-09', '今日成长任务', '增长闭环', '成长方案 / 陪跑服务', '成长小助手 / 成长成果', 'DEV 只允许 Named Mock Action 状态切换。'),
    ('UI-10', '成长小助手', '增长闭环', '今日成长任务', '任务 / 成果', 'DEV 只允许固定素材与 mock 反馈。'),
    ('UI-11', '成长排行榜', '增长闭环', '成长入口', '成长成果海报', '仅作静态视觉；禁止真实跨家庭排序。'),
    ('UI-12', '成长成果海报', '增长闭环', '成长成果', '内部返回 / mock 分享回执', '仅作静态海报；禁止真实外发、二维码追踪和成果断言。'),
    ('UI-13', '家庭成长商城首页', '商城闭环', '商城 Tab / 首页入口', '商品详情 / 邀请 / 拼团 / 积分 / 合伙人我的', 'DEV 仅 mock 商品与权益。'),
    ('UI-14', '商品详情', '商城闭环', '商城首页', '邀请有礼 / 拼团专区', 'DEV 只允许 mock SKU 与价格展示。'),
    ('UI-15', '邀请有礼', '商城闭环', '商城首页 / 商品详情', '成长合伙人我的', 'DEV 只允许 mock 邀请进度。'),
    ('UI-16', '拼团专区', '商城闭环', '商品详情 / 商城首页', '内部返回', 'DEV 只允许 mock 团与倒计时；禁止真实拼团。'),
    ('UI-17', '积分商城', '商城闭环', '商城首页', '内部返回', 'DEV 只允许 mock 积分与兑换。'),
    ('UI-18', '成长合伙人我的', '商城闭环', '商城我的入口', '订单与资产 / 邀请有礼', 'DEV 只允许 mock 伙伴数据，禁止真实佣金和提现。'),
    ('UI-19', '名师专区', '名师沙龙闭环', '首页家庭顾问 / 服务入口', '名师详情', '静态目录；禁止真实服务提供者撮合。'),
    ('UI-20', '名师详情', '名师沙龙闭环', '名师专区', '在线咨询 / 预约', '静态详情；禁止真实评价和咨询。'),
    ('UI-21', '在线咨询 / 预约', '名师沙龙闭环', '名师详情', '线下沙龙 / 我的咨询活动', 'DEV 只允许 mock 预约回执。'),
    ('UI-22', '线下沙龙', '名师沙龙闭环', '服务入口', '活动详情', 'DEV 只允许 mock 活动目录。'),
    ('UI-23', '活动详情', '名师沙龙闭环', '线下沙龙', '我的咨询与活动', 'DEV 只允许 mock 报名状态。'),
    ('UI-24', '我的咨询与活动', '名师沙龙闭环', '我的入口', '服务记录', 'DEV 只允许 mock 服务记录。'),
    ('UI-25', '家长社区', '社区闭环', '社区 Tab', '发布动态 / 动态详情 / 我的社区', '静态内容流；禁止跨家庭外发。'),
    ('UI-26', '发布动态', '社区闭环', '家长社区', '社区首页 / mock 打卡回执', 'DEV 只允许固定 mock 内容，不写核心 Ontology。'),
    ('UI-27', '成长成果', '社区闭环', '社区 / 成长入口', '成长成果海报', '静态成果展示；禁止真实成长结论和标签。'),
    ('UI-28', '动态详情', '社区闭环', '家长社区', '内部返回', '静态评论；禁止真实互动、私聊、关注。'),
    ('UI-29', '我的社区', '社区闭环', '家长社区', '内部返回', '静态社区资产；禁止真实粉丝、积分、挑战。'),
    ('UI-30', '我的（年度会员服务）', '客户后台核心闭环', '我的首页', '我的服务 / 订单与资产 / 家庭档案 / 服务记录', 'DEV 只允许 mock 会员与服务进度。'),
    ('UI-31', '我的服务', '客户后台核心闭环', '我的首页', '家庭档案 / 服务记录', 'DEV 只允许 mock 服务任务。'),
    ('UI-32', '订单与资产', '客户后台核心闭环', '我的首页', '内部返回', 'DEV 只允许 mock 订单、券、积分、奖励。'),
    ('UI-33', '家庭档案', '客户后台核心闭环', '我的首页 / 我的服务', '内部返回', 'DEV 只允许 mock 家庭档案，禁止真实诊断/永久档案。'),
    ('UI-34', '服务记录', '客户后台核心闭环', '我的首页', '内部返回', 'DEV 只允许 mock 咨询、活动、客服记录。'),
]

PPT_SOURCES = [
    ('PPT-01', '榜样教育新商业模式对外宣发PPT_原图版(2)', '/home/ubuntu/upload/榜样教育新商业模式对外宣发PPT_原图版(2).pptx', '产品界面、商业场景与闭环需求证据；非生产事实。'),
    ('PPT-02', '榜样教育战略白皮书_30页演讲汇报版', '/home/ubuntu/upload/榜样教育战略白皮书_30页演讲汇报版.pptx', '战略定位、价值主张与场景需求证据；非生产事实。'),
    ('PPT-03', '家庭教育大模型平台科技公司项目合作方案', '/home/ubuntu/upload/家庭教育大模型平台科技公司项目合作方案.pptx', 'AI/平台愿景和技术需求证据；非模型或外呼授权。'),
]

LOOPS = [
    ('FLOW-01', '核心服务闭环', '首页 → 家庭测评 → AI成长诊断报告 → 个性化成长方案 → 陪跑服务 / 社群服务 → 我的 / 会员中心', '/home/ubuntu/upload/pasted_file_qc8HBE_image.png'),
    ('FLOW-02', '增长闭环', '家庭成长体检 → AI体检报告 → 每日任务 / AI管家 → 孩子端成长助手 → 成长排行榜 → 成长报告海报 / 一键分享', '/home/ubuntu/upload/pasted_file_KGK4lU_image.png'),
    ('FLOW-03', '商城闭环', '裂变商城首页 → 商品详情 → 邀请有礼 → 拼团专区 → 积分商城 / 任务中心 → 我的收益 / 会员中心', '/home/ubuntu/upload/pasted_file_UftWqs_image.png'),
    ('FLOW-04', '名师沙龙闭环', '名师栏目首页 → 名师详情 → 在线咨询 / 预约 → 线下沙龙列表 → 活动详情 / 报名 → 我的预约 / 我的活动', '/home/ubuntu/upload/pasted_file_E7BUOm_image.png'),
    ('FLOW-05', '社区闭环', '社区首页 / 交流广场 → 发帖 / 打卡分享 → 成果展示 / 荣誉激励 → 互动评论 / 家长互助 → 我的社区 / 社群资产', '/home/ubuntu/upload/pasted_file_6zXWa4_image.png'),
    ('FLOW-06', '客户后台核心闭环', '我的首页 / 客户总览 → 我的服务 / 陪跑进度 → 我的订单 / 资产权益 → 家庭档案 / 报告中心 → 咨询活动 / 客服支持', '/home/ubuntu/upload/pasted_file_df8LZI_image.png'),
]

ENGINEERING_EVIDENCE = [
    ('ARCH-01', 'Family V3 蓝图', 'architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md', '现有架构权威；后续仅按证据先行方式修订。'),
    ('GOV-01', '授权登记册', 'governance/AUTHORIZATION_REGISTRY.yaml', '能力授权和 HOLD 状态证据。'),
    ('GOV-02', '可变执行状态', 'governance/PROGRAM_STATUS_PLATFORM_V1.md', '执行状态来源；如不存在须显式标记。'),
    ('GOV-03', '34 页原图输入清单', 'reports/l1/bangyang_all_visual_inputs_manifest.txt', '逐页 UI 来源清单。'),
    ('GOV-04', '34 页逐图转录结果', '/home/ubuntu/transcribe_bangyang_34_ui.json', '逐字基线的机器辅助转录；人工复核仍必需。'),
    ('GOV-05', '六条闭环转录', 'governance/BANGYANG_18_UI_CLOSED_LOOP_MASTER_TRANSCRIPTION_001.md', '历史命名保留；正文按 34 页口径使用。'),
    ('GOV-06', '页面状态与闭环映射', 'governance/BANGYANG_18_UI_STATE_AND_CLOSED_LOOP_MAPPING_001.md', '历史命名保留；正文按 34 页口径使用。'),
]


def norm(value: str, limit: int = 900) -> str:
    text = ' '.join((value or '').replace('\n', ' ').split())
    return text if len(text) <= limit else text[:limit] + ' …'


def md_escape(value: str) -> str:
    return value.replace('|', '\\|').replace('\n', '<br>')


def load_transcripts() -> list[dict]:
    data = json.loads(TRANSCRIPT.read_text(encoding='utf-8'))
    return [item.get('output', {}) for item in data.get('results', [])]


def evidence_table(rows: list[tuple[str, str, str, str]]) -> str:
    lines = ['| ID | 名称 | 来源 | 证据用途与限制 |', '|---|---|---|---|']
    for row in rows:
        lines.append('| ' + ' | '.join(md_escape(str(x)) for x in row) + ' |')
    return '\n'.join(lines)


def main() -> None:
    transcripts = load_transcripts()
    if len(transcripts) != len(PAGES):
        raise RuntimeError(f'Expected {len(PAGES)} transcript items; got {len(transcripts)}')

    lines: list[str] = []
    lines.extend([
        '# 榜样教育 34 页 UI 与 3 份 PPT 总控交付计划 001',
        '',
        '> **状态：** `DRAFT_FOR_DEV_MOCK_MASTER_CONTROL`  \\n> **事实口径：** 本轮基线是 **34 页清晰单页 UI + 3 份 PPT + 6 条闭环路径图 + 既有 Family 工程/治理契约**。任何旧文件中含 `18_UI` 的命名均为历史命名，**不得再作为当前范围口径**。',
        '',
        '## 0. 使用原则与证据纪律',
        '',
        'PPT、UI 与闭环图是产品需求、场景、视觉和流程的**证据来源**，不是生产事实、真实效果证据、数据授权或运行时授权。DEV 可以采用受控测试数据、模拟角色、mock 服务、mock AI、mock 订单、mock 预约和 mock 社区互动组成完整体验闭环；任何模拟结果均不得写作真实家庭事实、真实能力证明或生产放行依据。',
        '',
        '所有涉及核心状态的 DEV 操作必须通过 Named Action 或受控 mock action；自由文本、图片、语音和模型输出不能直接写入核心 Ontology。真实家庭数据、真实支付、真实预约、真实咨询、真实社区外发、真实评分/排行、真实 Ontology 写入和生产发布继续保持 HOLD。',
        '',
        '## 1. evidence_inventory',
        '',
        '### 1.1 三份 PPT',
        '',
        evidence_table(PPT_SOURCES),
        '',
        '### 1.2 六条闭环路径图',
        '',
        '| ID | 闭环 | 原图节点序列 | 来源 |',
        '|---|---|---|---|',
    ])
    for flow in LOOPS:
        lines.append('| ' + ' | '.join(md_escape(x) for x in flow) + ' |')
    lines.extend(['', '### 1.3 既有 Family 文档与工程契约', '', evidence_table(ENGINEERING_EVIDENCE), '', '## 2. page_baseline_index（34 页）', ''])

    for idx, ((page_id, name, loop, entry, exit_, note), tx) in enumerate(zip(PAGES, transcripts), start=1):
        source = tx.get('source_file') or '[未读清]'
        lines.extend([
            f'### {page_id}｜{name}',
            '',
            '| 字段 | 基线 |',
            '|---|---|',
            f'| page_id | `{page_id}` |',
            f'| source_file | `{source}` |',
            f'| 页面名称 | {name} |',
            f'| 归属闭环 | {loop} |',
            f'| 入口 | {entry} |',
            f'| 出口 | {exit_} |',
            f'| 可见文案摘要 | {md_escape(norm(tx.get("verbatim_transcription", "[未读清]"), 1100))} |',
            f'| 关键控件 | {md_escape(norm(tx.get("controls_and_states", "[未读清]"), 850))} |',
            f'| 布局比例 | {md_escape(norm(tx.get("relative_measurements", "[未读清]"), 500))} |',
            f'| 视觉与信息层级 | {md_escape(norm(tx.get("layout_and_visual", "[未读清]"), 850))} |',
            f'| 不确定项 | {md_escape(norm(tx.get("uncertainties", "[未读清]"), 500))} |',
            f'| DEV 可模拟能力 | {note}；可通过 mock action、测试 fixture 与只读原图状态完成可体验闭环。 |',
            '| PROD 禁止能力 | 未获得独立 Gate 前，禁止将该页任何 UI 文案或 mock 状态解释为真实家庭事实、真实支付/预约/咨询/社区外发/评分排行/核心 Ontology 写入或生产发布。 |',
            '',
        ])

    lines.extend([
        '## 3. scenario_flows（待 B 阶段逐节点细化）',
        '',
        '以下六条闭环已作为场景骨架固定。B 阶段需为每条补齐角色、输入、输出、状态、异常/未完成态、Named Action 与 mock action 映射；不得因 UI 中出现的商业、咨询、社区或评分表达而越过持续 HOLD。',
        '',
        '| 闭环 | 节点数 | DEV mock 可体验范围 | 生产禁止或待 Human Gate 范围 |',
        '|---|---:|---|---|',
        '| 核心服务 | 6 | 体检、固定 mock 报告、mock 方案、mock 陪跑、我的 | 真实诊断、真人陪跑、真实会员权益 |',
        '| 增长 | 6 | mock 任务、孩子端状态、静态榜单/海报 | 真实跨家庭排行、真实成长结论、公开分享 |',
        '| 商城 | 6 | mock 商品、订单、邀请、拼团、积分、合伙人资产 | 支付、分佣、提现、真实拼团、履约 |',
        '| 名师沙龙 | 6 | 静态目录、mock 咨询预约、mock 活动记录 | 真人咨询、预约、线下活动、报名、支付 |',
        '| 社区 | 5 | mock 内容流、mock 发布回执、静态互动和社区资产 | 真实发帖、跨家庭互动、私聊、关注、审核 |',
        '| 客户后台 | 5 | mock 服务、订单、资产、档案、记录 | 真实会员、权益、档案、客服、转介绍 |',
        '',
        '## 4. capability_boundary（DEV/mock 与生产边界）',
        '',
        '| 能力 | DEV 可实现方式 | 必须保留的标识/约束 | 生产/真实数据状态 |',
        '|---|---|---|---|',
        '| AI 报告与助手 | 固定合成响应、Gateway stub、输出 schema 校验 | `mock` 来源、可回放、不可训练、不可外发 | HOLD：真实模型外呼、训练、真实家庭对话记忆 |',
        '| 订单/权益/积分 | fixture、mock order、mock entitlement、mock ledger | 仅测试 ID；所有写入经 mock Named Action | HOLD：支付、真实权益、真实分佣/提现 |',
        '| 预约/咨询/活动 | mock provider、mock slot、mock booking、mock attendance | 无真人、无电话/视频、无通知外发 | HOLD：真实咨询、预约、活动组织 |',
        '| 社区/互动 | 固定 seed 内容、mock reaction/comment/follow | 无跨家庭真实可见、无自由文本核心写入 | HOLD：公开社区、真实互动、审核 |',
        '| 成长与档案 | 可撤销的 mock 进度/案例展示 | 不产生永久标签、诊断或效果结论 | HOLD：真实成长评分、永久档案、跨家庭比较 |',
        '',
        '## 5. architecture_impact（待 C 阶段细化）',
        '',
        '应用层需从单一 test-loop 页面壳升级为可配置的 DEV mock journey shell；每条闭环的页面导航、mock action、fixture、审计回放和文本等价路径必须可追踪。数据层需将测试 fixture 与真实家庭范围严格隔离，测试对象、mock case、mock order、mock booking、mock community item 均带环境与来源标记。AI 层只能采用 gateway stub、合成输入输出契约、确定性阻断器和评测记录；不得在 DEV 中将自由文本或多模态输出直接写入核心 Ontology。',
        '',
        '## 6. delivery_plan（待 C/D/E 阶段细化）',
        '',
        '| 里程碑 | 目标 | 可立即 DEV 实现 | 需 mock adapter | 需 Human Gate / 生产禁止 |',
        '|---|---|---|---|---|',
        '| M0 | 证据与基线冻结 | 34 页母版、6 条闭环、页面基线、差异台账 | 无 | 所有真实能力继续 HOLD |',
        '| M1 | 页面与导航覆盖 | 34 页原图路由、文本等价、受控跳转 | mock journey/router | 生产发布 |',
        '| M2 | 核心服务与增长 mock 闭环 | mock 测评、报告、方案、任务、海报 | mock AI/report/task adapter | 真实诊断/排行/分享 |',
        '| M3 | 商城与服务 mock 闭环 | mock SKU/order/invite/group/booking/activity | mock commerce/service adapter | 支付、履约、真人服务 |',
        '| M4 | 社区与客户后台 mock 闭环 | mock post/comment/profile/assets/service record | mock community/customer adapter | 跨家庭可见、真实权益、真实档案 |',
        '| M5 | TEST 晋级包 | typecheck/build/API/mock action/browser evidence | test database/isolated fixtures | 生产与真实用户仍需独立 Gate |',
        '',
        '## 7. acceptance（待 E/F/G 阶段执行）',
        '',
        '| 验收项 | 最低证据 | 当前状态 |',
        '|---|---|---|',
        '| 每页原图对照 | 单页原图、同宽高浏览器截图、差异表 | `IN_RESEARCH` |',
        '| 六条闭环导航 | 入口→出口路径、未完成/返回路径、文本等价 | `IN_RESEARCH` |',
        '| mock 数据可追踪 | fixture 来源、mock action、审计记录 | `IN_RESEARCH` |',
        '| Web typecheck/build | `pnpm --filter @family/web typecheck` 与 build 输出 | `PENDING` |',
        '| 浏览器关键路径 | Home→服务、增长、商城、名师、社区、客户后台 | `IN_RESEARCH` |',
        '',
        '## 8. A 阶段修改文件清单',
        '',
        f'- `{OUT.relative_to(ROOT)}`：总控 evidence inventory 与 34 页 page baseline index。',
        '- `reports/l1/bangyang_all_visual_inputs_manifest.txt`：原图与 PPT 视觉输入清单。',
        '- `/home/ubuntu/transcribe_bangyang_34_ui.json`：逐图转录原始结果；仅为研究辅助，不替代人工复核。',
        '',
        '## 9. 历史命名更正',
        '',
        '所有已存在的 `BANGYANG_18_UI_*` 文件名仅为历史路径，不能改变当前“34 页 UI 基线”的事实口径。后续新增文档和正文应使用 `34_UI` 或明确写出 `34 页`。',
        '',
    ])
    OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    main()
