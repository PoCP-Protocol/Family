# Family Architecture Baseline

Status: BASELINE_FOUNDATION
Current product-operating architecture: `docs/FAMILY_TECH_ARCH_V3.2.md`

V3.2 does not rewrite this foundation. It keeps Modular Monolith, PostgreSQL, Redis, Outbox, Family Ontology, Growth OS, and Named Actions, then adds product boundaries for Family, Famili Principal, We are Famili, Operations, Analytics, and the 100-family MOS gate.

## 技术总链

```text
Experience
↓
Business Application
↓
Family Growth OS
↓
AI Intelligence + Human Service
↓
Knowledge & Evidence
↓
Data
↓
Integration
↓
Infrastructure
↓
Causal / World Model
```

## V1架构

- Modular Monolith
- PostgreSQL
- Redis（按需要）
- Object Storage
- OpenAPI
- TypeScript
- NestJS优先
- React优先
- Event Table + Outbox
- CI/CD
- Audit / Trace

## 核心边界

Family Growth OS拥有业务语义。

现有CRM/LMS/Order等通过Adapter进入Family。

AI Provider必须通过ModelGateway（后续Sprint）。

## Build

Family必须Build：
- Family Account
- Ontology
- Growth Profile
- Journey
- Intervention
- Action/Event
- Outcome
- Timeline
- Agent logic
- Knowledge domain
- Causal domain

## Integrate

优先集成：
- CRM
- LMS
- Payment
- Order
- Live
- IM
- SMS
- Invoice
