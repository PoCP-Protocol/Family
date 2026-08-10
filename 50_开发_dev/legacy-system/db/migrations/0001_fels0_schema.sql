-- FELS-0 schema contract.
-- REFERENCE_IMPLEMENTATION = TRUE
-- REAL_BANGYANG_SOURCE = FALSE
-- Target database: family_legacy, configured by LEGACY_DATABASE_URL.
--
-- SCHEMA_CONVERGENCE_DECISION = PASS_SQL_CONVERGED
-- FELS-0 is a logical/domain coverage contract only.
-- FELS-1 runtime tables are the fels.legacy_* tables in 0002_fels1_core_business.sql.
-- This migration must not create active business source tables such as fels.customer,
-- fels.student, or fels.assessment_session, because that would create a second
-- physical source-of-truth for the same FELS-1 concepts.

CREATE SCHEMA IF NOT EXISTS fels;

COMMENT ON SCHEMA fels IS 'FELS reference schema. FELS-0 is logical contract only; FELS-1 runtime source tables are fels.legacy_* from 0002.';