import type pg from 'pg';

/**
 * Reproducible TEST_DATABASE_URL-only fixture for integration and local
 * authenticated-browser checks. All identifiers are synthetic and stable.
 * It deliberately creates process records, not educational outcomes.
 */
export const FAMILY_PLATFORM_FIXTURE = Object.freeze({
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  familyId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  guardianId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  childId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  relationshipId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  journeyId: '11111111-2222-4333-8444-555555555555',
  profileId: '22222222-3333-4444-8555-666666666666',
  priorityId: '33333333-4444-4555-8666-777777777777',
  episodeId: '44444444-5555-4666-8777-888888888888',
  actionId: '55555555-6666-4777-8888-999999999999',
  providerId: '66666666-7777-4888-8999-aaaaaaaaaaaa',
  offeringId: '77777777-8888-4999-8aaa-bbbbbbbbbbbb',
  slotId: '88888888-9999-4aaa-8bbb-cccccccccccc',
  bookingId: '99999999-aaaa-4bbb-8ccc-dddddddddddd',
  serviceRecordId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
});

export async function seedFamilyPlatformFixture(pool: pg.Pool) {
  const f = FAMILY_PLATFORM_FIXTURE;
  await pool.query('begin');
  try {
    // Repeatable cleanup for this fixture only. It never touches another family.
    await pool.query('delete from family_booking_service_records where family_id = $1', [f.familyId]);
    await pool.query('delete from family_booking_requests where family_id = $1', [f.familyId]);
    await pool.query('delete from family_service_availability_slots where availability_slot_id = $1', [f.slotId]);
    await pool.query('delete from family_service_offerings where service_offering_id = $1', [f.offeringId]);
    await pool.query('delete from family_service_providers where provider_id = $1', [f.providerId]);
    await pool.query('delete from growth_actions where family_id = $1', [f.familyId]);
    await pool.query('delete from intervention_episodes where family_id = $1', [f.familyId]);
    await pool.query('delete from growth_priorities where family_id = $1', [f.familyId]);
    await pool.query('delete from growth_profiles where family_id = $1', [f.familyId]);
    await pool.query('delete from growth_journeys where family_id = $1', [f.familyId]);
    await pool.query('delete from family_relationships where family_id = $1', [f.familyId]);
    await pool.query('delete from family_memberships where family_id = $1', [f.familyId]);
    await pool.query('update families set primary_contact_person_id = null where family_id = $1', [f.familyId]);
    await pool.query('delete from persons where family_id = $1', [f.familyId]);
    await pool.query('delete from families where family_id = $1', [f.familyId]);
    await pool.query('delete from tenants where tenant_id = $1', [f.tenantId]);

    await pool.query(
      `insert into tenants(tenant_id, tenant_ref, display_name, tenant_type, status, region_ref, plan_ref)
       values ($1, 'TEST_FAMILY_PLATFORM', 'Family Test Tenant', 'INTERNAL_SANDBOX', 'ACTIVE', 'TEST', 'FAMILY_GROWTH_DEV')`,
      [f.tenantId],
    );
    await pool.query(
      `insert into families(family_id, display_name, status, version)
       values ($1, '星河家庭（测试）', 'ACTIVE', 1)`,
      [f.familyId],
    );
    await pool.query(
      `insert into persons(person_id, family_id, person_type, parent_role, display_name, account_id)
       values ($1, $2, 'PARENT', 'GUARDIAN', '林女士（测试家长）', 'test-family-guardian')`,
      [f.guardianId, f.familyId],
    );
    await pool.query(
      `insert into persons(person_id, family_id, person_type, display_name, birth_date)
       values ($1, $2, 'CHILD', '小星（测试孩子）', '2013-05-01')`,
      [f.childId, f.familyId],
    );
    await pool.query('update families set primary_contact_person_id = $1 where family_id = $2', [f.guardianId, f.familyId]);
    await pool.query(
      `insert into family_memberships(membership_id, family_id, person_id, role, status, joined_at)
       values (gen_random_uuid(), $1, $2, 'OWNER_GUARDIAN', 'ACTIVE', now()),
              (gen_random_uuid(), $1, $3, 'CHILD_SUBJECT', 'ACTIVE', now())`,
      [f.familyId, f.guardianId, f.childId],
    );
    await pool.query(
      `insert into family_relationships(relationship_id, family_id, person_a_id, person_b_id, relationship_type)
       values ($1, $2, $3, $4, 'PARENT_CHILD')`,
      [f.relationshipId, f.familyId, f.guardianId, f.childId],
    );
    await pool.query(
      `insert into growth_journeys(journey_id, family_id, journey_type, phase, status, started_at, version)
       values ($1, $2, '90_DAY_GROWTH', 'DAY_1', 'ACTIVE', now(), 1)`,
      [f.journeyId, f.familyId],
    );
    await pool.query(
      `insert into growth_profiles(profile_id, family_id, subject_type, subject_ref_id, life_stage_code, strengths, growth_opportunities, confidence, version, effective_from, profile_scope, subject_person_id, status, basis, evidence_snapshot, policy_version)
       values ($1, $2, 'CHILD', $3::text, 'EARLY_ADOLESCENCE_12_15', '["愿意尝试"]'::jsonb, '["亲子沟通"]'::jsonb, 0.7, 1, now(), 'FAMILY_PRIVATE', $3::uuid, 'ACTIVE', '{"source":"TEST_FIXTURE","truth_class":"PERSPECTIVE"}'::jsonb, '{"evidence_boundary":"NOT_OUTCOME"}'::jsonb, 'test-v1')`,
      [f.profileId, f.familyId, f.childId],
    );
    await pool.query(
      `insert into growth_priorities(priority_id, family_id, profile_id, dimension_id, rank, confirmed_by_actor_id, onboarding_id, status, version, boundary, reason_codes, evidence_refs, policy_version)
       values ($1, $2, $3, 'P03', 1, $4::text, $5, 'ACTIVE', 1, 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS', '["FAMILY_CONFIRMED"]'::jsonb, '["TEST_FIXTURE"]'::jsonb, 'test-v1')`,
      [f.priorityId, f.familyId, f.profileId, f.guardianId, f.journeyId],
    );
    await pool.query(
      `insert into intervention_episodes(episode_id, family_id, onboarding_id, priority_id, intervention_id, intervention_code, status, started_by_actor_id, planned_days, policy_version)
       values ($1, $2, $3, $4, 'INTERVENTION-001', 'LISTEN_BEFORE_RESPOND', 'ACTIVE', $5, 7, 'test-v1')`,
      [f.episodeId, f.familyId, f.journeyId, f.priorityId, f.guardianId],
    );
    await pool.query(
      `insert into growth_actions(action_id, family_id, journey_id, intervention_id, dimension_id, action_type, instruction, status, assigned_to_person_id, assigned_at, onboarding_id, priority_id, intervention_episode_id, day_index, assignment_text, due_date, completion_status, reflection_boundary, boundary)
       values ($1, $2, $3, 'INTERVENTION-001', 'P03', 'DAILY_MICRO_ACTION', '先听完再回应', 'PENDING', $4, now(), $3, $5, $6, 1, '今晚留出十分钟，先听完再回应。', current_date, null, 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME', 'ACTION_IS_NOT_OUTCOME')`,
      [f.actionId, f.familyId, f.journeyId, f.childId, f.priorityId, f.episodeId],
    );
    await pool.query(
      `insert into family_service_providers(provider_id, scope_type, tenant_id, provider_ref, display_name, provider_kind, qualification_ref, qualification_status, admission_status, source_ref, fixture_only, status)
       values ($1, 'TENANT', $2, 'TEST_TEACHER_001', '周老师（测试服务者）', 'TEACHER', 'TEST-QUALIFICATION', 'ACTIVE', 'ADMITTED', 'TEST_FIXTURE', true, 'ACTIVE')`,
      [f.providerId, f.tenantId],
    );
    await pool.query(
      `insert into family_service_offerings(service_offering_id, tenant_id, provider_id, service_offering_ref, title, admission_status, source_ref, fixture_only, status)
       values ($1, $2, $3, 'TEST_PARENT_CHILD_DIALOGUE', '亲子沟通支持（测试）', 'ADMITTED', 'TEST_FIXTURE', true, 'ACTIVE')`,
      [f.offeringId, f.tenantId, f.providerId],
    );
    await pool.query(
      `insert into family_service_availability_slots(availability_slot_id, tenant_id, provider_id, service_offering_id, availability_slot_ref, starts_at, ends_at, channel, fixture_only, status)
       values ($1, $2, $3, $4, 'TEST_SLOT_001', now() + interval '1 day', now() + interval '1 day 1 hour', 'VIDEO', true, 'AVAILABLE')`,
      [f.slotId, f.tenantId, f.providerId, f.offeringId],
    );
    await pool.query(
      `insert into family_booking_requests(booking_request_id, tenant_id, family_id, actor_person_id, booking_ref, service_offering_id, availability_slot_id, source_page_id, consent_ref, status, service_snapshot, environment, correlation_id, idempotency_key, created_by, updated_by)
       values ($1, $2, $3, $4, 'TEST_BOOKING_001', $5, $6, 'UI-21', 'TEST_CONSENT_SERVICE', 'REQUESTED', '{"source":"TEST_FIXTURE","external_effect":false}'::jsonb, 'TEST', 'test-family-booking-001', 'test-family-booking-001', $7, $7)`,
      [f.bookingId, f.tenantId, f.familyId, f.guardianId, f.offeringId, f.slotId, f.guardianId],
    );
    await pool.query(
      `insert into family_booking_service_records(booking_service_record_id, tenant_id, family_id, source_booking_request_id, status, environment, source_system, external_effect, created_by, updated_by)
       values ($1, $2, $3, $4, 'PENDING', 'TEST', 'TEST_NOOP_ADAPTER', false, $5, $5)`,
      [f.serviceRecordId, f.tenantId, f.familyId, f.bookingId, f.guardianId],
    );
    await pool.query('commit');
    return f;
  } catch (error) {
    await pool.query('rollback');
    throw error;
  }
}
