# M2 Screen Map

date: 2026-08-10
status: PROPOSED_REQUIRED_FOR_M2
implementation_started: NO

Each screen must be implemented with explicit empty, loading, error, permission, and consent states. Screen IDs are canonical for M2 planning.

## F01 Family Home

| Field | Definition |
|---|---|
| USER | Parent / Guardian |
| PURPOSE | Show current family journey, LifeStage, current practice, today action, recent changes, insight, and AI entry points. |
| INPUT | `familyId`, actor context |
| DISPLAY STATE | Family summary, child age/context, `EARLY_ADOLESCENCE_12_15`, current journey Day N/7, Today Action, recent changes, Family Insight, evidence counts. |
| EMPTY STATE | Family Core exists but no Growth journey: invite Growth Onboarding. |
| LOADING STATE | Skeleton for family summary, journey card, insight card. |
| ERROR STATE | Aggregate unavailable or network failure. |
| PERMISSION STATE | Missing/unauthorized actor shows access denied. |
| CONSENT STATE | Missing required purpose shows consent-required banner before Growth entry. |
| BACKEND API | `GET /families/{familyId}`, future Growth current-journey read API. |
| DOMAIN OBJECT | FamilyAggregate, GrowthJourney, GrowthAction, GrowthInsight. |
| PRIMARY ACTION | Start or continue current journey. |
| NEXT SCREEN | F02 or F08 depending journey state. |

## F02 Growth Onboarding

| Field | Definition |
|---|---|
| USER | Parent / Guardian |
| PURPOSE | Establish first M2 context for 12-15 parent-child communication conflict. |
| INPUT | Family aggregate, relationship context, consent snapshot, safety screening answers. |
| DISPLAY STATE | Scenario confirmation, selected parent-child relationship, required consent checklist, safety gate status. |
| EMPTY STATE | No eligible parent-child relationship or missing active LifeStage. |
| LOADING STATE | Checking family aggregate and consent. |
| ERROR STATE | Family context cannot be loaded or onboarding creation fails. |
| PERMISSION STATE | Actor lacks family manage/growth permission. |
| CONSENT STATE | SERVICE, ASSESSMENT, GROWTH_TRACKING required; AI_PERSONALIZATION deferred until AI use. |
| BACKEND API | `StartGrowthOnboarding` future Named Action. |
| DOMAIN OBJECT | M2GrowthOnboarding. |
| PRIMARY ACTION | Start onboarding. |
| NEXT SCREEN | F03. |

## F03 Parent Perspective

| Field | Definition |
|---|---|
| USER | Parent / Guardian |
| PURPOSE | Record how the parent sees current communication friction. |
| INPUT | Parent answers to guided prompts. |
| DISPLAY STATE | Parent-oriented questions, selected options, free reflection. |
| EMPTY STATE | No parent perspective recorded. |
| LOADING STATE | Saving perspective. |
| ERROR STATE | Validation or save failure. |
| PERMISSION STATE | Actor cannot represent this parent/guardian. |
| CONSENT STATE | ASSESSMENT and GROWTH_TRACKING required. |
| BACKEND API | `RecordPerspective` future Named Action. |
| DOMAIN OBJECT | Perspective, EvidenceRecord. |
| PRIMARY ACTION | Submit Parent Perspective. |
| NEXT SCREEN | F04. |

## F04 Child Perspective

| Field | Definition |
|---|---|
| USER | Child, with guardian-approved context |
| PURPOSE | Record child's experience in child-appropriate language, separate from parent interpretation. |
| INPUT | Child answers to separate prompts. |
| DISPLAY STATE | Child-friendly question set, feeling/experience choices, optional note. |
| EMPTY STATE | Child perspective not yet recorded. |
| LOADING STATE | Saving child perspective. |
| ERROR STATE | Validation, permission, or safety routing failure. |
| PERMISSION STATE | Child access unavailable or guardian consent missing. |
| CONSENT STATE | Minor-data and assessment consent required; safety signal can route to review. |
| BACKEND API | `RecordPerspective` future Named Action. |
| DOMAIN OBJECT | Perspective, EvidenceRecord, SafetySignal. |
| PRIMARY ACTION | Submit Child Perspective. |
| NEXT SCREEN | F05. |

## F05 Growth Insight

| Field | Definition |
|---|---|
| USER | Parent / Family |
| PURPOSE | Explain what Family understands from perspectives and evidence without pretending hypothesis is fact. |
| INPUT | Parent Perspective, Child Perspective, evidence records, limited profile. |
| DISPLAY STATE | Insight summary, Parent Perspective vs Child Perspective, Evidence counts, AI Hypothesis label, confidence boundary. |
| EMPTY STATE | Not enough evidence yet. |
| LOADING STATE | Building insight. |
| ERROR STATE | Insight generation or profile read failure. |
| PERMISSION STATE | Actor lacks read access. |
| CONSENT STATE | AI_PERSONALIZATION required if AI wording/personalization is used. |
| BACKEND API | Future GrowthProfile/Insight read API. |
| DOMAIN OBJECT | M2GrowthProfile, M2EvidenceRecord, Insight. |
| PRIMARY ACTION | Review why Family thinks this matters. |
| NEXT SCREEN | F06. |

## F06 Growth Priority

| Field | Definition |
|---|---|
| USER | Parent / Guardian, optionally advisor |
| PURPOSE | Confirm what is most worth practicing in the next 7 days. |
| INPUT | Profile dimension states, evidence, human confirmation. |
| DISPLAY STATE | One or two suggested priorities, rationale, evidence sources, no score/ranking. |
| EMPTY STATE | No confirmed priority. |
| LOADING STATE | Loading candidate priorities. |
| ERROR STATE | Confirmation fails. |
| PERMISSION STATE | Actor cannot confirm priority. |
| CONSENT STATE | GROWTH_TRACKING required; AI_PERSONALIZATION required for AI recommendation. |
| BACKEND API | `ConfirmGrowthPriority` future Named Action. |
| DOMAIN OBJECT | M2GrowthPriority. |
| PRIMARY ACTION | Confirm priority. |
| NEXT SCREEN | F07. |

## F07 Intervention Detail

| Field | Definition |
|---|---|
| USER | Parent / Guardian |
| PURPOSE | Present `INTERVENTION-001 / LISTEN_BEFORE_RESPOND` as a practical 7-day plan. |
| INPUT | Confirmed priority, intervention seed. |
| DISPLAY STATE | Why this intervention, what to do, what not to do, safety/contraindication note, 7-day outline. |
| EMPTY STATE | No intervention assigned. |
| LOADING STATE | Loading intervention. |
| ERROR STATE | Intervention unavailable. |
| PERMISSION STATE | Actor cannot view assigned plan. |
| CONSENT STATE | GROWTH_TRACKING required. |
| BACKEND API | Intervention read API, `AssignGrowthAction` future Named Action. |
| DOMAIN OBJECT | M2Intervention, M2GrowthAction. |
| PRIMARY ACTION | Start 7-day plan. |
| NEXT SCREEN | F08. |

## F08 Today Growth Action

| Field | Definition |
|---|---|
| USER | Parent / Guardian |
| PURPOSE | Tell parent exactly what to practice today. |
| INPUT | Assigned GrowthAction. |
| DISPLAY STATE | Today's instruction, context tips, start/mark complete actions, AI help entry. |
| EMPTY STATE | No action assigned today. |
| LOADING STATE | Loading today's action. |
| ERROR STATE | Action unavailable. |
| PERMISSION STATE | Actor cannot operate this action. |
| CONSENT STATE | GROWTH_TRACKING required. |
| BACKEND API | GrowthAction read/update future APIs. |
| DOMAIN OBJECT | M2GrowthAction. |
| PRIMARY ACTION | Start or complete action. |
| NEXT SCREEN | F09. |

## F09 Action Reflection

| Field | Definition |
|---|---|
| USER | Parent / Guardian |
| PURPOSE | Record complete/partial/skipped action and reflection while preserving raw note boundary. |
| INPUT | Completion status, reflection note, conflict/repair indicators. |
| DISPLAY STATE | Check-in options, reflection prompts, evidence boundary note. |
| EMPTY STATE | No reflection yet. |
| LOADING STATE | Saving check-in. |
| ERROR STATE | Save or safety routing failure. |
| PERMISSION STATE | Actor cannot record event. |
| CONSENT STATE | GROWTH_TRACKING required; safety signals may escalate. |
| BACKEND API | `RecordGrowthEvent` future Named Action. |
| DOMAIN OBJECT | M2GrowthEvent, M2EvidenceRecord. |
| PRIMARY ACTION | Submit reflection. |
| NEXT SCREEN | F10. |

## F10 Family Timeline

| Field | Definition |
|---|---|
| USER | Parent / Family |
| PURPOSE | Show what happened across the 7-day journey. |
| INPUT | Growth events, milestones, action history. |
| DISPLAY STATE | Day-by-day events, action completion, repair signals, milestone cards. |
| EMPTY STATE | No events yet. |
| LOADING STATE | Loading timeline. |
| ERROR STATE | Timeline unavailable. |
| PERMISSION STATE | Actor lacks read access. |
| CONSENT STATE | GROWTH_TRACKING required. |
| BACKEND API | Growth timeline read API. |
| DOMAIN OBJECT | M2GrowthEvent, M2Milestone. |
| PRIMARY ACTION | View details or continue next action. |
| NEXT SCREEN | F08 or F11. |

## F11 Growth Review

| Field | Definition |
|---|---|
| USER | Parent / Family, optionally advisor |
| PURPOSE | Explain what changed over the outcome window without score/ranking. |
| INPUT | Outcomes, milestones, evidence, review window. |
| DISPLAY STATE | Dimension summaries, observed changes, evidence, confounders, next step. |
| EMPTY STATE | Outcome window not complete. |
| LOADING STATE | Loading review. |
| ERROR STATE | Review unavailable. |
| PERMISSION STATE | Actor lacks read access. |
| CONSENT STATE | GROWTH_TRACKING required; AI explanation requires AI_PERSONALIZATION. |
| BACKEND API | `EvaluateGrowthOutcome` future Named Action, GrowthReview read API. |
| DOMAIN OBJECT | M2Outcome, M2GrowthReview. |
| PRIMARY ACTION | Understand change and choose next step. |
| NEXT SCREEN | F12 or next journey. |

## F12 Family AI

| Field | Definition |
|---|---|
| USER | Parent / Guardian, scoped family context |
| PURPOSE | Provide journey-scoped assistance: Today Insight, Why this Priority, Help me do this Action, Reflect after Action, Explain Growth Review. |
| INPUT | Current screen context, evidence references, consent snapshot, user prompt if any. |
| DISPLAY STATE | Contextual AI cards and optional conversation, with evidence links and hypothesis labels. |
| EMPTY STATE | AI not enabled or no eligible context. |
| LOADING STATE | Waiting for AI response. |
| ERROR STATE | Model Gateway unavailable or safety refusal. |
| PERMISSION STATE | Actor cannot use AI for this family/context. |
| CONSENT STATE | AI_PERSONALIZATION required; MODEL_IMPROVEMENT separate and not implied. |
| BACKEND API | Future Model Gateway / AI Companion API. |
| DOMAIN OBJECT | AIRecommendation, EvidenceReference, SafetyRoute. |
| PRIMARY ACTION | Ask journey-scoped question or choose guided AI action. |
| NEXT SCREEN | Return to originating journey screen. |
