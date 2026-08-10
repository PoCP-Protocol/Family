# Family Technical Architecture V3.2 - Build-to-Operate Rebaseline

Status: ACTIVE_ARCHITECTURE_BASELINE
Date: 2026-08-10
Supersedes: runtime architecture interpretation of `docs/02_ARCHITECTURE_BASELINE.md` where product-operating boundaries are missing
Keeps: Family Strategy V3.0 / Product Vertical Slice First

## 1. Core Ruling

```text
TECH_ARCH_REBASELINE_REQUIRED = YES
CORE_ARCHITECTURE_REWRITE = NO
FAMILY_STRATEGY_VERSION = V3.0 KEEP
NEW_TECHNICAL_ARCHITECTURE = V3.2 BUILD-TO-OPERATE
```

This is a productization architecture upgrade, not a core technical rebuild.

The validated Family core remains the foundation:

```text
FAMILY_ONTOLOGY = KEEP
GROWTH_OS = KEEP
NAMED_ACTION = KEEP

BACKEND_MODULAR_MONOLITH = KEEP
POSTGRESQL = KEEP
REDIS = KEEP
OUTBOX = KEEP
```

The following areas are re-planned because Family is now an operable consumer product system, not only a single growth loop implementation:

```text
FRONTEND_ARCHITECTURE = REPLAN
PRODUCT_BOUNDARIES = REPLAN
FPAI_ARCHITECTURE = ADD
COMMUNITY_ARCHITECTURE = ADD
OPERATIONS_ARCHITECTURE = ADD
ANALYTICS_ARCHITECTURE = ADD
```

The following scale architectures remain forbidden for Family 1.0 MOS:

```text
MICROSERVICES = NO
KAFKA = NO
KUBERNETES = NO
WORLD_MODEL_RUNTIME = NO
```

Parallel systems are isolated:

```text
FELS = ISOLATED_PARALLEL
FLM = ISOLATED_PARALLEL
```

## 2. Architecture Shape

Family V3.2 is:

```text
Consumer Product
+ AI Product
+ Community Product
+ Growth System
+ Operations System
+ Data System
```

The target architecture is:

```text
USER EXPERIENCE
  Family Consumer Experience
  Family / Famili Principal / We are Famili
    -> Consumer API / BFF

APPLICATION PLATFORM
  Identity / Account
  Family Context
  Growth Journey
  Principal AI
  Community / Challenge
  Content
  Consent / Safety
  Human Handoff
  Membership / Commerce (later)
    -> Growth OS

GROWTH OS
  Family / Parent / Child / Relationship
  Evidence / Profile / Priority
  Journey / Intervention / Action
  Event / Outcome / Review / Timeline
  Only Named Actions mutate canonical state
    -> AI Platform + Data Platform

AI PLATFORM
  Principal Soul
  Context Broker
  Retrieval
  Model Gateway
  Safety
  Eval

DATA PLATFORM
  Operational Data
  Product Events
  AI Runs
  Growth Events
  Analytics
  Outcome Data

OPERATIONS & GOVERNANCE
  Ops Console
  Advisor / Safety Case
  Audit / Consent / Human Review
  Analytics Dashboard / Experiment
```

## 3. Frontend Target

Family 1.0 uses one consumer app, not three separate consumer apps.

```text
apps/consumer-web = household user experience
apps/ops-web = operations / advisor / safety / content / analytics
apps/legacy-web = FELS internal legacy reference system
```

Famili Principal and We are Famili are independent domain surfaces inside `consumer-web`.

The approved migration pattern is Strangler Migration:

```text
existing M2 pages
  -> continue working
  -> Consumer Shell
  -> Family / Principal / We are Famili modules
  -> page-by-page migration
```

Do not rewrite M2 runtime only to satisfy this document.

## 4. Backend Target

Family keeps one NestJS modular monolith runtime:

```text
apps/api

modules/
  identity/
  family/
  growth/
  consent/
  safety/
  principal/
  community/
  challenge/
  content/
  operations/
  analytics/
```

Each module must own its Controller, Application Service, Domain, Repository, Contract, and Events boundary. Module boundaries are mandatory; service extraction is not authorized.

## 5. Deployment Target for 100 Families

The physical deployment remains intentionally simple:

```text
Consumer Web
Ops Web
API
Background Worker
PostgreSQL
Redis
Object Storage
```

Background Worker owns async AI tasks, content processing, data import, analytics aggregation, and notification jobs.

## 6. Repository Target Shape

This is a target structure, not an immediate migration order:

```text
50_开发_dev/
  apps/
    api/
    consumer-web/
    ops-web/
    worker/

  packages/
    contracts/
    ui/
    sdk/
    config/

  modules/
    identity/
    consent/
    safety/
    family/
    growth/
    principal/
    community/
    challenge/
    content/
    operations/
    analytics/

  products/
    famili-principal/
    we-are-family/

  legacy-system/
  migration/
  reports/
```

Existing verified M1/M2 assets are frozen as validated core and migrated only through approved Strangler steps.

## 7. Eight Architecture Principles

```text
1. Family Core owns family truth.
2. Growth OS owns growth state.
3. Principal AI proposes; humans confirm.
4. Community participates; it does not define growth.
5. Product events are not GrowthEvents.
6. AI models are replaceable; Soul and Context are owned.
7. FELS is old world; FLM translates; Family is new world.
8. Build one operable system before scaling architecture.
```
