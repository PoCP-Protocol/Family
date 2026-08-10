# FELS Module Contracts

```text
REFERENCE_IMPLEMENTATION = TRUE
REAL_BANGYANG_SOURCE = FALSE
DOMAINS = 12
```

| # | Module | Old-world entities | Family boundary |
|---|---|---|---|
| 01 | CRM | Lead, Opportunity, CustomerTag, FollowUp | Lead/Customer are candidates only, not Family. |
| 02 | Customer / Contact | Customer, Contact | Contact may be buyer or service contact, not Parent directly. |
| 03 | Student / Guardian | Student, StudentGuardian, StudentTag | Student is not Child; guardian proof may be weak. |
| 04 | Assessment | AssessmentTemplate, Session, Answer, Score, Report | Score/label/report become historical evidence candidates. |
| 05 | Course / LMS | Course, Lesson, Class, Enrollment, Attendance | Completion is learning history, not Outcome. |
| 06 | Program / Coaching | TrainingProgram, ProgramEnrollment | 7/21/90-day programs are GrowthJourney candidates only. |
| 07 | Task / Check-in / Homework | LegacyTask, LegacyCheckIn, Homework, HomeworkReview | Check-in is not Outcome. |
| 08 | Human Service | Staff, ServiceCase, AdvisorSession, AdvisorNote | Notes are Perspective/HumanObservation candidates. |
| 09 | Community / Activity | Community, CommunityMember, Activity | Group membership is not FamilyRelationship or Consent. |
| 10 | Commerce / Membership | Product, Order, OrderItem, Payment, Membership | Commerce refs do not authorize data use. |
| 11 | Legacy AI / Analytics | LegacyProfile, LegacyAIReport, LegacyAlert | AI output is hypothesis, not Fact. Scores/rankings are retired. |
| 12 | Legacy Governance | LegacyAgreement, LegacyConsent, AuditLog | Consent is evidence candidate and must be revalidated. |

FELS deliberately keeps old-world friction: duplicate customers, buyer != student, missing guardian proof, weak consent purpose, legacy family score, and ranking.