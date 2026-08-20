import pg from 'pg';

const { Pool } = pg;
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required');
const ids = {
  tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  account: '12121212-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  family: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  guardian: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  child: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  relationship: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  journey: '11111111-2222-4333-8444-555555555555',
  perspective: '12121212-2222-4333-8444-555555555555',
  evidence: '13131313-2222-4333-8444-555555555555',
  profile: '22222222-3333-4444-8555-666666666666',
  priority: '33333333-4444-4555-8666-777777777777',
  episode: '44444444-5555-4666-8777-888888888888',
  action: '55555555-6666-4777-8888-999999999999',
  provider: '66666666-7777-4888-8999-aaaaaaaaaaaa',
  offering: '77777777-8888-4999-8aaa-bbbbbbbbbbbb',
  slot: '88888888-9999-4aaa-8bbb-cccccccccccc',
  booking: '99999999-aaaa-4bbb-8ccc-dddddddddddd',
  serviceRecord: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  product: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
};

const pool = new Pool({ connectionString: url });
const q = (text, values = []) => pool.query(text, values);
try {
  await q('begin');
  await q('delete from audit_logs where family_id=$1', [ids.family]);
  await q('delete from family_service_records where family_id=$1', [ids.family]);
  await q('delete from family_dev_flow_events where family_id=$1', [ids.family]);
  await q('delete from test_experience_operations where family_id=$1', [ids.family]);
  await q('delete from family_llm_gateway_audits where family_id=$1', [ids.family]);
  await q('delete from family_product_events where family_id=$1', [ids.family]);
  await q('delete from product_events where family_id=$1', [ids.family]);
  await q('delete from family_product_offerings where tenant_id=$1', [ids.tenant]);
  await q('delete from family_booking_service_records where family_id=$1', [ids.family]);
  await q('delete from family_booking_requests where family_id=$1', [ids.family]);
  await q('delete from family_service_availability_slots where availability_slot_id=$1', [ids.slot]);
  await q('delete from family_service_offerings where service_offering_id=$1', [ids.offering]);
  await q('delete from family_service_providers where provider_id=$1', [ids.provider]);
  await q('delete from growth_actions where family_id=$1', [ids.family]);
  await q(`delete from family_journey_plan_phases where plan_id in (select plan_id from family_journey_plans where family_id=$1)`, [ids.family]);
  await q('delete from family_journey_plans where family_id=$1', [ids.family]);
  await q('delete from intervention_episodes where family_id=$1', [ids.family]);
  await q('delete from growth_priorities where family_id=$1', [ids.family]);
  await q('delete from growth_profiles where family_id=$1', [ids.family]);
  await q('delete from life_stage_assignments where family_id=$1', [ids.family]);
  await q('delete from evidence_records where family_id=$1', [ids.family]);
  await q('delete from perspectives where family_id=$1', [ids.family]);
  await q('delete from growth_events where family_id=$1', [ids.family]);
  await q('delete from growth_journeys where family_id=$1', [ids.family]);
  await q('delete from family_relationships where family_id=$1', [ids.family]);
  await q('delete from consents where family_id=$1', [ids.family]);
  await q('delete from identity_sessions where family_id=$1 or account_ref=$2', [ids.family, ids.account]);
  await q('delete from account_person_bindings where account_id=$1', [ids.account]);
  await q('delete from tenant_family_bindings where family_id=$1', [ids.family]);
  await q('delete from family_memberships where family_id=$1', [ids.family]);
  await q('update families set primary_contact_person_id=null where family_id=$1', [ids.family]);
  await q('delete from persons where family_id=$1', [ids.family]);
  await q('delete from families where family_id=$1', [ids.family]);
  await q('delete from accounts where account_id=$1', [ids.account]);
  await q('delete from tenants where tenant_id=$1', [ids.tenant]);

  await q(`insert into tenants(tenant_id,tenant_ref,display_name,tenant_type,status,region_ref,plan_ref)
    values($1,'TEST_FAMILY_PLATFORM','Family Test Tenant','INTERNAL_SANDBOX','ACTIVE','TEST','FAMILY_GROWTH_DEV')`, [ids.tenant]);
  await q(`insert into accounts(account_id,external_ref,status) values($1,'test-family-guardian','ACTIVE')`, [ids.account]);
  await q(`insert into families(family_id,display_name,status,version) values($1,'星河家庭（测试）','ACTIVE',1)`, [ids.family]);
  await q(`insert into tenant_family_bindings(tenant_id,family_id,status,effective_from,migration_ref)
    values($1,$2,'ACTIVE',now(),'TEST_FIXTURE')`, [ids.tenant, ids.family]);
  await q(`insert into persons(person_id,family_id,person_type,parent_role,display_name,account_id)
    values($1,$2,'PARENT','GUARDIAN','林女士（测试家长）',$3)`, [ids.guardian, ids.family, ids.guardian]);
  await q(`insert into persons(person_id,family_id,person_type,display_name,birth_date)
    values($1,$2,'CHILD','小星（测试孩子）','2013-05-01')`, [ids.child, ids.family]);
  await q(`insert into account_person_bindings(account_id,person_id,status) values($1,$2,'ACTIVE')`, [ids.account, ids.guardian]);
  await q('update families set primary_contact_person_id=$1 where family_id=$2', [ids.guardian, ids.family]);
  await q(`insert into family_memberships(membership_id,family_id,person_id,role,status,joined_at)
    values(gen_random_uuid(),$1,$2,'OWNER_GUARDIAN','ACTIVE',now()),(gen_random_uuid(),$1,$3,'CHILD_SUBJECT','ACTIVE',now())`, [ids.family, ids.guardian, ids.child]);
  await q(`insert into family_relationships(relationship_id,family_id,person_a_id,person_b_id,relationship_type)
    values($1,$2,$3,$4,'PARENT_CHILD')`, [ids.relationship, ids.family, ids.guardian, ids.child]);
  await q(`insert into life_stage_assignments(family_id,child_id,life_stage_code,effective_from,source)
    values($1,$2,'EARLY_ADOLESCENCE_12_15','2026-01-01T00:00:00.000Z','TEST_FIXTURE')`, [ids.family, ids.child]);
  await q(`insert into consents(family_id,subject_person_id,guardian_person_id,purpose,status,policy_version,granted_at)
    values($1,$2,$3,'SERVICE','GRANTED','service-v1',now()),
          ($1,$2,$3,'ASSESSMENT','GRANTED','assessment-v1',now()),
          ($1,$2,$3,'GROWTH_TRACKING','GRANTED','growth-tracking-v1',now())`, [ids.family, ids.child, ids.guardian]);
  await q(`insert into growth_journeys(journey_id,family_id,journey_type,phase,status,started_at,version)
    values($1,$2,'PARENT_CHILD_COMMUNICATION_CONFLICT','ONBOARDING','ACTIVE',now(),1)`, [ids.journey, ids.family]);
  await q(`insert into growth_events(event_id,family_id,event_type,occurred_at,source,payload)
    values(gen_random_uuid(),$1,'GrowthOnboardingStarted',now(),'TEST_FIXTURE','{"onboarding_id":"11111111-2222-4333-8444-555555555555","child_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","guardian_person_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","safety_disposition":{"severity":"LOW","disposition":"NORMAL"}}'::jsonb)`, [ids.family]);
  await q(`insert into perspectives(perspective_id,family_id,onboarding_id,subject_person_id,author_person_id,person_id,perspective_type,statement,recorded_at,capture_mode,content,fact_boundary,safety_disposition)
    values($1,$2,$3,$4,$5,$4,'CHILD_PERSPECTIVE','孩子愿意尝试新的对话方式。',now(),'TEST_FIXTURE','{"source":"TEST_FIXTURE"}'::jsonb,'PERSPECTIVE_NOT_FACT','{"severity":"LOW","disposition":"NORMAL"}'::jsonb)`, [ids.perspective, ids.family, ids.journey, ids.child, ids.guardian]);
  await q(`insert into evidence_records(evidence_id,family_id,evidence_type,source_ref,payload,observed_at,perspective_id,source,evidence_level)
    values($1,$2,'FAMILY_PERSPECTIVE','TEST_FIXTURE','{"evidence_boundary":"PERSPECTIVE_NOT_OUTCOME"}'::jsonb,now(),$3,'TEST_FIXTURE','E1')`, [ids.evidence, ids.family, ids.perspective]);
  await q(`insert into growth_profiles(profile_id,family_id,subject_type,subject_ref_id,life_stage_code,strengths,growth_opportunities,confidence,version,effective_from,profile_scope,subject_person_id,status,basis,evidence_snapshot,policy_version)
    values($1,$2,'CHILD',$3::text,'EARLY_ADOLESCENCE_12_15','["愿意尝试"]','["亲子沟通"]',0.7,1,now(),'FAMILY_PRIVATE',$4::uuid,'ACTIVE','{"source":"TEST_FIXTURE","truth_class":"PERSPECTIVE"}','{"evidence_boundary":"NOT_OUTCOME","evidence_ids":["13131313-2222-4333-8444-555555555555"]}','test-v1')`, [ids.profile, ids.family, ids.child, ids.guardian]);
  await q(`insert into growth_priorities(priority_id,family_id,profile_id,dimension_id,rank,confirmed_by_actor_id,onboarding_id,status,version,boundary,reason_codes,evidence_refs,policy_version)
    values($1,$2,$3,'P03',1,$4,$5,'ACTIVE',1,'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS','["FAMILY_CONFIRMED"]','["TEST_FIXTURE"]','test-v1')`, [ids.priority, ids.family, ids.profile, ids.guardian, ids.journey]);
  await q(`insert into intervention_episodes(episode_id,family_id,onboarding_id,priority_id,intervention_id,intervention_code,status,started_by_actor_id,planned_days,policy_version)
    values($1,$2,$3,$4,'INTERVENTION-001','LISTEN_BEFORE_RESPOND','ACTIVE',$5,7,'test-v1')`, [ids.episode, ids.family, ids.journey, ids.priority, ids.guardian]);
  await q(`insert into growth_actions(action_id,family_id,journey_id,intervention_id,dimension_id,action_type,instruction,status,assigned_to_person_id,assigned_at,onboarding_id,priority_id,intervention_episode_id,day_index,assignment_text,due_date,reflection_boundary,boundary)
    values($1,$2,$3,'INTERVENTION-001','P03','DAILY_MICRO_ACTION','先听完再回应','PENDING',$4,now(),$3,$5,$6,1,'今晚留出十分钟，先听完再回应。',current_date,'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME','ACTION_IS_NOT_OUTCOME')`, [ids.action, ids.family, ids.journey, ids.child, ids.priority, ids.episode]);
  await q(`insert into family_product_offerings(product_id,scope_type,tenant_id,product_ref,version_no,title,admission_status,source_ref,fixture_only,status,attributes)
    values($1,'TENANT',$2,'PRODUCT_PARENT_CHILD_CAMP',1,'21天亲子沟通挑战营（测试）','ADMITTED','TEST_FIXTURE',true,'ACTIVE','{"delivery_mode":"SANDBOX_NOOP","category":"PARENT_CHILD"}'::jsonb)`, [ids.product, ids.tenant]);
  await q(`insert into family_service_providers(provider_id,scope_type,tenant_id,provider_ref,display_name,provider_kind,qualification_ref,qualification_status,admission_status,source_ref,fixture_only,status)
    values($1,'TENANT',$2,'TEST_TEACHER_001','周老师（测试服务者）','TEACHER','TEST-QUALIFICATION','ACTIVE','ADMITTED','TEST_FIXTURE',true,'ACTIVE')`, [ids.provider, ids.tenant]);
  await q(`insert into family_service_offerings(service_offering_id,tenant_id,provider_id,service_offering_ref,title,admission_status,source_ref,fixture_only,status)
    values($1,$2,$3,'TEST_PARENT_CHILD_DIALOGUE','亲子沟通支持（测试）','ADMITTED','TEST_FIXTURE',true,'ACTIVE')`, [ids.offering, ids.tenant, ids.provider]);
  await q(`insert into family_service_availability_slots(availability_slot_id,tenant_id,provider_id,service_offering_id,availability_slot_ref,starts_at,ends_at,channel,fixture_only,status)
    values($1,$2,$3,$4,'TEST_SLOT_001',now()+interval '1 day',now()+interval '1 day 1 hour','VIDEO',true,'AVAILABLE')`, [ids.slot, ids.tenant, ids.provider, ids.offering]);
  await q(`insert into family_booking_requests(booking_request_id,tenant_id,family_id,actor_person_id,booking_ref,service_offering_id,availability_slot_id,source_page_id,consent_ref,status,service_snapshot,environment,correlation_id,idempotency_key,created_by,updated_by)
    values($1,$2,$3,$4::uuid,'TEST_BOOKING_001',$5,$6,'UI-21','TEST_CONSENT_SERVICE','REQUESTED','{"source":"TEST_FIXTURE","external_effect":false}','TEST','test-family-booking-001','test-family-booking-001',$7::text,$7::text)`, [ids.booking, ids.tenant, ids.family, ids.guardian, ids.offering, ids.slot, ids.guardian]);
  await q(`insert into family_booking_service_records(booking_service_record_id,tenant_id,family_id,source_booking_request_id,status,environment,source_system,external_effect,created_by,updated_by)
    values($1,$2,$3,$4,'PENDING','TEST','TEST_NOOP_ADAPTER',false,$5,$5)`, [ids.serviceRecord, ids.tenant, ids.family, ids.booking, ids.guardian]);
  await q('commit');
  console.log(JSON.stringify({ seeded: true, ...ids }, null, 2));
} catch (error) {
  await q('rollback').catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
