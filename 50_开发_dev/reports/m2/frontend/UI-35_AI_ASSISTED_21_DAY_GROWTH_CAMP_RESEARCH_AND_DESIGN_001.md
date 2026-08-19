# UI-35 AI-Assisted 21-Day Growth Camp Research and Design 001

> **Status:** DEV design and implementation reference. This document does not claim to be an official Bangyang Education syllabus, does not make an educational-effect claim, and does not authorize production publication or automatic learner assignment.

| Field | Value |
|---|---|
| UI ID | **UI-35** — support surface outside the immutable UI-01~UI-34 supplied-baseline set |
| Route | `growth-camp-21` |
| Source entry | UI-01 `challenge_21` / “21天成长营” |
| Product layer | Growth Loop experience-layer course capability |
| Current design status | `SYNTHETIC_RULE_BASED_DRAFT` |
| Model status | `MODEL_GATEWAY_NOOP` / no direct model call |
| Human review | Required before publishing, assigning, pricing, or claiming official curriculum status |
| 90-day relationship | A possible **recommendation-only** next transition; it does not auto-create a 90-day plan |

## 1. Research Purpose and Evidence Boundary

The original 34 UI set does not supply a dedicated 21-day camp screen. UI-01 nevertheless exposes a visible “21天成长营” entry. Treating that entry as UI-05’s 90-day plan would collapse two distinct product layers and would contradict the supplied product narrative. UI-35 is therefore registered as a support surface while preserving the 34-screen coverage invariant.

The supplied Bangyang strategic material describes **“21天行动、90天陪跑、年度会员”** as layers of long-term accompaniment, and places **“21天挑战、每日任务”** in the action stage before 90-day plan, advisor, and community accompaniment.[1] It provides the product relationship, but it does **not** provide an official day-by-day 21-lesson syllabus. The external articles found during research describe a “21天智慧父母训练营” using live sessions, homework check-ins, community accompaniment, and one-to-one guidance; one article groups the subject matter into communication, emotion management, habit building, and learning motivation.[2] [3] These articles are third-party/republished sources, so their price, efficacy, service level, schedules, audience and curriculum details remain unverified.

| Evidence item | Classification | Permitted use | Prohibited use |
|---|---|---|---|
| Supplied Bangyang PPT and extracted material | E1 product-design input | Establish the 21-day action → 90-day accompaniment product-layer relationship | Claim a verified official lesson plan or educational outcome |
| Public Bangyang-course introductions | External secondary design input | Identify possible delivery components: course, homework, check-in, community accompaniment, guidance | Treat commercial claims, prices, completion rates or outcomes as fact |
| Family engagement and non-diagnostic assessment research | External design guardrail | Shape parent participation, reflection, consent and non-diagnostic wording | Diagnose a child or predict a family outcome |
| AI/rule-based curriculum draft | Recommendation / controlled draft | Propose a visible DEV course structure for review | Publish, assign, price or write core ontology autonomously |

## 2. Product Positioning and Course Boundary

UI-35 represents an **experience-layer, 21-day action course**. Its purpose is to help a parent practice small, observable actions and record a personal Perspective. It is not a diagnostic programme, therapy, formal clinical intervention, official Bangyang lesson plan, or proof that a child/family has changed.

The course boundary is deliberately narrow:

| Layer | UI-35 responsibility | Not UI-35 responsibility |
|---|---|---|
| Intake | Read parent-selected interest/attention context where consented | Determine root cause or label a child/family |
| Curriculum design | Produce a rule-based, reviewable 21-day draft | Autonomously publish/assign an official curriculum |
| Daily practice | Present one parent action, check-in, and reflection prompt | Prove behaviour or relationship effect |
| Accompaniment | Record DEV participation receipt and display a review prompt | Send real messages, notifications, or coach outreach |
| Progression | Recommend a 90-day-plan draft handoff after review | Create a 90-day plan, membership, order, or service case automatically |

## 3. AI-Assisted Curriculum Design Architecture

The designed system is **AI-assisted**, not AI-autonomous. It introduces an explicit draft and review boundary so a future Model Gateway can improve curriculum design without allowing model text to become a family fact, final course, task assignment, or outcome.

```text
Consent-scoped Family Context + Parent Perspective + Curated Course Library
        ↓
Model Gateway / Rule-Based DEV Adapter
        ↓
CurriculumDraft (source, uncertainty, stage/day rationale)
        ↓
Course Expert / Policy Review
        ↓
Named Action: Publish or Assign Curriculum (future, not implemented)
        ↓
Day Task → Check-in → Parent Reflection (Perspective) → Review
        ↓
Recommendation-only 90-day plan handoff
```

The DEV implementation currently stops at `CurriculumDraft → DEV check-in receipt`. `model_gateway_status=NOOP_NOT_INVOKED` is deliberately visible. The rule-based draft uses only product-structure and public-design research, and is marked `E1_PRODUCT_STRUCTURE_PLUS_PUBLIC_DESIGN_RESEARCH`.

## 4. DEV Curriculum Draft

Because no official day-by-day syllabus has been verified, the following stages are a **design draft** rather than an official course outline. The four topic tracks are a synthesis of publicly described delivery themes, not a representation of an approved Bangyang timetable.

| Draft stage | Days | Intent | Example bounded data |
|---|---:|---|---|
| Foundation — Observe and Connect | 1–7 | Help the parent notice interaction context and practise stable listening | Parent action, reflection prompt, optional Perspective receipt |
| Practice — Communication and Habit | 8–14 | Turn selected communication, emotion-regulation, household-habit or learning-support tools into small repeatable actions | Action attempt and self-described barrier; no child label |
| Review — Reflection and Continuation | 15–21 | Review participation records and formulate a next-step recommendation | Review draft and recommendation-only 90-day-plan handoff |

The current Day 1 design is intentionally conservative: observe one ordinary interaction, identify what was heard/seen, then decide whether to respond. Its reflection prompt explicitly says that the record is a parent Perspective, not a conclusion about the child.

## 5. Object and Data Relationship

| Object | State boundary | Relationship |
|---|---|---|
| `GrowthCamp21EnrollmentDraft` | Controlled draft | Identifies the chosen DEV course context; cannot produce an order or entitlement |
| `CurriculumDraft` | Recommendation / human review | Stores source boundary, model status, stages, current day and handoff recommendation |
| `GrowthCamp21DayTask` | Named-action candidate | A bounded parent action; no claim of intervention efficacy |
| `DevFlowReceipt` | DEV persistence | Records an idempotent, family-scoped action/check-in with no external effect |
| `Reflection` | Perspective | Optional parent reflection; not a Fact, diagnosis or OutcomeEvidence |
| `GrowthPlanDraft` | Recommendation-only handoff | May be recommended after review; never auto-created by UI-35 |

## 6. Implemented DEV Behaviour

UI-35 now exposes an AI-assisted curriculum draft state with a three-stage structure, a current-day parent action, a reflection prompt, visible `NOOP_NOT_INVOKED` status, an explicit expert-review requirement, and a daily action receipt. The UI-01 entry routes to UI-35 instead of UI-05. The existing shared Family Growth OS, family-scoped DEV receipt persistence, idempotency, audit boundary and no-external-effect policy are reused rather than replaced.

The UI still requires an authenticated synthetic DEV context to read/write actual projection state. Without it, the browser must fail closed rather than render a course result as though it were a confirmed family curriculum.

## 7. Acceptance Criteria

| Criterion | Required state |
|---|---|
| Official syllabus claim | Absent; UI visibly states that the draft is not an official syllabus |
| Model behaviour | No direct model call; `NOOP_NOT_INVOKED` is returned and tested |
| Human review | Explicitly required before publishing or assigning the course |
| Action boundary | Check-in records an action/Perspective receipt only |
| 90-day handoff | Recommendation-only; no automatic plan creation |
| UI-01 lineage | `challenge_21 → UI-35 / growth-camp-21` |
| Existing 34 UIs | Remain unchanged as the immutable supplied-baseline set |
| External effects | No payment, notification, sharing, booking, or service outreach |

## References

[1]: https://github.com/PoCP-Protocol/Family — supplied Bangyang strategic PPT/extracted material: 21-day action and daily task are an experience/action layer before 90-day accompaniment; accessed from repository evidence.

[2]: https://www.weiyangx.com/472193.html — “家庭教育课程那么多，榜样教育的课到底怎么选？一份完整的选课参考”; third-party/author-view source, accessed 2026-08-18.

[3]: http://hy.stock.cnfol.com/hangyejingcui/20260412/32138855.shtml — “明明白白选课程：从99到19800元，榜样教育课程价格全解析”; republished secondary source, accessed 2026-08-18.

[4]: https://youth.gov/youth-topics/family-engagement/impact — family engagement design guardrail, accessed 2026-08-18.

[5]: https://www.nist.gov/itl/ai-risk-management-framework — AI governance and traceability design guardrail, accessed 2026-08-18.
