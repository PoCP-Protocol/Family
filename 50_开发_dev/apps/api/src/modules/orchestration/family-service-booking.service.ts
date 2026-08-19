import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FamilyProductEventService } from './family-product-event.service';
import { OrchestrationRepository } from './orchestration.repository';
import {
  pageAllowedForServiceBooking,
  serviceBookingTextEquivalent,
  type AvailabilitySlotReadModel,
  type BookingRequestReceipt,
  type CancelBookingDto,
  type FamilyBookingProjection,
  type FamilyServiceRecordReceipt,
  type FamilyServiceSupplyProjection,
  type RequestBookingDto,
  type ServiceOfferingReadModel,
  type ServiceSupplyListQueryDto,
  serviceSupplyListQueryAllowed,
} from './family-service-booking.contract';
import { requireDevSyntheticTestLoop } from './test-env.policy';

interface OfferingRow {
  service_offering_id: string;
  service_offering_ref: string;
  version_no: number;
  title: string;
  provider_ref: string;
  provider_display_name: string;
  provider_kind: 'TEACHER';
  qualification_status: 'ACTIVE';
  admission_status: 'ADMITTED';
  offering_status: 'ACTIVE';
  service_type: string | null;
  age_band: string | null;
  next_available_at: string | null;
  next_available_channel: 'VIDEO' | 'TEXT' | 'OFFLINE' | null;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE';
  fixture_only: true;
  attributes_schema_version: number;
}

interface SlotRow {
  availability_slot_id: string;
  availability_slot_ref: string;
  service_offering_ref: string;
  starts_at: string;
  ends_at: string;
  channel: 'VIDEO' | 'TEXT' | 'OFFLINE';
  status: 'AVAILABLE' | 'RESERVED';
}

interface BookingRow {
  booking_request_id: string;
  booking_ref: string;
  status: 'DRAFT' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  service_offering_ref: string;
  availability_slot_ref: string;
  row_version: number;
  correlation_id: string;
  starts_at: string;
  channel: 'VIDEO' | 'TEXT' | 'OFFLINE';
}

interface RecordRow {
  booking_service_record_id: string;
  source_booking_request_id: string;
  status: 'PENDING' | 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
}

@Injectable()
export class FamilyServiceBookingService {
  constructor(
    @Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository,
    @Inject(FamilyProductEventService) private readonly events: FamilyProductEventService,
  ) {}

  private environment(): 'DEV' | 'TEST' {
    return requireDevSyntheticTestLoop().environment_status === 'TEST_VALIDATED' ? 'TEST' : 'DEV';
  }

  private async tenantForFamily(familyId: string): Promise<string> {
    const result = await this.repo.query<{ tenant_id: string }>(
      `select tenant_id from tenant_family_bindings
        where family_id=$1 and status='ACTIVE'
        order by effective_from desc limit 1`,
      [familyId],
    );
    const tenantId = result.rows[0]?.tenant_id;
    if (!tenantId) throw new ForbiddenException('tenant_family_binding_required');
    return tenantId;
  }

  private async assertServiceConsent(familyId: string): Promise<void> {
    const subject = await this.repo.query<{ person_id: string }>(
      `select person_id from persons
        where family_id=$1 and person_type='CHILD' and birth_date is not null
          and date_part('year', age(current_date, birth_date)) between 12 and 15
        order by person_id limit 1`,
      [familyId],
    );
    const subjectPersonId = subject.rows[0]?.person_id;
    if (!subjectPersonId) throw new ForbiddenException('booking_synthetic_subject_unavailable');
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required');
  }

  private async activeOffering(tenantId: string, ref: string, version: number): Promise<OfferingRow> {
    const result = await this.repo.query<OfferingRow>(
      `select o.service_offering_id, o.service_offering_ref, o.version_no, o.title,
              p.provider_ref, p.display_name as provider_display_name,
              p.qualification_status, o.admission_status, o.fixture_only, o.attributes_schema_version
         from family_service_offerings o
         join family_service_providers p on p.provider_id=o.provider_id
        where o.tenant_id=$1 and o.service_offering_ref=$2 and o.version_no=$3
          and o.status='ACTIVE' and o.admission_status='ADMITTED' and o.fixture_only=true
          and p.status='ACTIVE' and p.qualification_status='ACTIVE' and p.admission_status='ADMITTED'
          and o.effective_from <= now() and (o.effective_to is null or o.effective_to > now())
        limit 1`,
      [tenantId, ref, version],
    );
    const row = result.rows[0];
    if (!row) throw new ForbiddenException('service_offering_not_admitted_or_not_visible');
    return row;
  }

  private async availableSlot(tenantId: string, ref: string, offeringId: string): Promise<SlotRow & { service_offering_id: string }> {
    const result = await this.repo.query<SlotRow & { service_offering_id: string }>(
      `select s.availability_slot_id, s.availability_slot_ref, o.service_offering_ref,
              s.starts_at, s.ends_at, s.channel, s.status, o.service_offering_id
         from family_service_availability_slots s
         join family_service_offerings o on o.service_offering_id=s.service_offering_id
        where s.tenant_id=$1 and s.availability_slot_ref=$2 and s.service_offering_id=$3
          and s.fixture_only=true and s.status='AVAILABLE' and s.reserved_count < s.capacity
          and s.starts_at > now()
        limit 1`,
      [tenantId, ref, offeringId],
    );
    const row = result.rows[0];
    if (!row) throw new ForbiddenException('service_slot_not_available');
    return row;
  }

  async offerings(familyId: string, query: ServiceSupplyListQueryDto): Promise<FamilyServiceSupplyProjection> {
    requireDevSyntheticTestLoop();
    if (!serviceSupplyListQueryAllowed(query)) throw new BadRequestException('service_supply_list_page_id_required');
    if (query.service_type !== undefined && (!query.service_type.trim() || query.service_type.length > 80)) {
      throw new BadRequestException('service_type_filter_invalid');
    }
    if (query.age_band !== undefined && (!query.age_band.trim() || query.age_band.length > 80)) {
      throw new BadRequestException('age_band_filter_invalid');
    }
    if (query.available_only !== undefined && query.available_only !== 'true' && query.available_only !== 'false') {
      throw new BadRequestException('available_only_filter_invalid');
    }

    await this.assertServiceConsent(familyId);
    const tenantId = await this.tenantForFamily(familyId);
    const serviceType = query.service_type?.trim() || null;
    const ageBand = query.age_band?.trim() || null;
    const availableOnly = query.available_only === 'true';
    const result = await this.repo.query<OfferingRow>(
      `select o.service_offering_id, o.service_offering_ref, o.version_no, o.title,
              p.provider_ref, p.display_name as provider_display_name, p.provider_kind,
              p.qualification_status, o.admission_status, o.status::varchar as offering_status,
              nullif(o.attributes->>'service_type','') as service_type,
              nullif(o.attributes->>'age_band','') as age_band,
              next_slot.starts_at as next_available_at,
              next_slot.channel as next_available_channel,
              case when next_slot.availability_slot_id is null then 'UNAVAILABLE' else 'AVAILABLE' end as availability_status,
              o.fixture_only, o.attributes_schema_version
         from family_service_offerings o
         join family_service_providers p on p.provider_id=o.provider_id
         left join lateral (
           select s.availability_slot_id, s.starts_at, s.channel
             from family_service_availability_slots s
            where s.tenant_id=o.tenant_id and s.provider_id=p.provider_id
              and s.service_offering_id=o.service_offering_id and s.fixture_only=true
              and s.status='AVAILABLE' and s.reserved_count<s.capacity and s.starts_at>now()
            order by s.starts_at
            limit 1
         ) next_slot on true
        where o.tenant_id=$1 and p.provider_kind='TEACHER'
          and o.status='ACTIVE' and o.admission_status='ADMITTED' and o.fixture_only=true
          and p.status='ACTIVE' and p.qualification_status='ACTIVE' and p.admission_status='ADMITTED'
          and o.effective_from <= now() and (o.effective_to is null or o.effective_to > now())
          and ($2::varchar is null or o.attributes->>'service_type'=$2)
          and ($3::varchar is null or o.attributes->>'age_band'=$3)
          and ($4::boolean=false or next_slot.availability_slot_id is not null)
        order by o.service_offering_ref, o.version_no desc`,
      [tenantId, serviceType, ageBand, availableOnly],
    );
    const byRef = new Map<string, OfferingRow>();
    for (const row of result.rows) if (!byRef.has(row.service_offering_ref)) byRef.set(row.service_offering_ref, row);
    const policy = await this.repo.query<{ policy_version: string }>(
      `select policy_version from tenant_policy_profiles where tenant_id=$1 and status='ACTIVE' limit 1`,
      [tenantId],
    );
    const liveSessionStart = new Date('2026-08-20T20:00:00+08:00');
    const liveSessionEnd = new Date(liveSessionStart.getTime() + 90 * 60 * 1000);
    const now = new Date();
    const liveSessionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED' = now < liveSessionStart ? 'SCHEDULED' : now < liveSessionEnd ? 'LIVE' : 'ENDED';
    const liveSession = {
      session_ref: 'EXPERT_LIVE_SESSION_FAMILY_GUIDANCE',
      title: '家庭沟通主题直播',
      topic: '在日常互动里先听见彼此',
      starts_at: liveSessionStart.toISOString(),
      status: liveSessionStatus,
      host_display_name: '家庭成长顾问',
      fixture_only: true as const,
      external_effect: false as const,
    };
    return {
      tenant_id: tenantId,
      family_id: familyId,
      source_page_id: 'UI-19',
      projection_version: 1,
      as_of: new Date().toISOString(),
      source_refs: ['family_service_providers', 'family_service_offerings', 'family_service_availability_slots'],
      policy_version: policy.rows[0]?.policy_version ?? null,
      visibility: 'FAMILY_SCOPED_ADMITTED_SUPPLY',
      expires_at: null,
      external_effect: false,
      filters: { provider_kind: 'TEACHER', service_type: serviceType, age_band: ageBand, available_only: availableOnly },
      offerings: [...byRef.values()].map((row) => ({
        service_offering_id: row.service_offering_id,
        service_offering_ref: row.service_offering_ref,
        version_no: row.version_no,
        title: row.title,
        provider_ref: row.provider_ref,
        provider_display_name: row.provider_display_name,
        provider_kind: row.provider_kind,
        qualification_status: row.qualification_status,
        admission_status: row.admission_status,
        offering_status: row.offering_status,
        service_type: row.service_type,
        age_band: row.age_band,
        next_available_at: row.next_available_at,
        next_available_channel: row.next_available_channel,
        availability_status: row.availability_status,
        fixture_only: row.fixture_only,
        attributes_schema_version: row.attributes_schema_version,
      })),
      live_session: liveSession,
      text_equivalent: '以下显示当前家庭可见、已准入的教师服务供给和一场可先了解的家庭主题直播。列表只读，不会预约、占座、通知、联系服务者或进入真实直播。',
    };
  }

  async slots(familyId: string, serviceOfferingRef: string, serviceOfferingVersion: number): Promise<{ tenant_id: string; slots: AvailabilitySlotReadModel[] }> {
    requireDevSyntheticTestLoop();
    const tenantId = await this.tenantForFamily(familyId);
    const offering = await this.activeOffering(tenantId, serviceOfferingRef, serviceOfferingVersion);
    const result = await this.repo.query<SlotRow>(
      `select s.availability_slot_id, s.availability_slot_ref, o.service_offering_ref,
              s.starts_at, s.ends_at, s.channel, s.status
         from family_service_availability_slots s
         join family_service_offerings o on o.service_offering_id=s.service_offering_id
        where s.tenant_id=$1 and s.service_offering_id=$2 and s.fixture_only=true
          and s.status='AVAILABLE' and s.reserved_count<s.capacity and s.starts_at>now()
        order by s.starts_at`,
      [tenantId, offering.service_offering_id],
    );
    return { tenant_id: tenantId, slots: result.rows };
  }

  async request(
    familyId: string,
    actorPersonId: string,
    dto: RequestBookingDto,
    correlationId: string,
    idempotencyKey?: string,
  ): Promise<{ booking: BookingRequestReceipt; service_record: FamilyServiceRecordReceipt }> {
    requireDevSyntheticTestLoop();
    if (!pageAllowedForServiceBooking(dto?.page_id) || !dto?.service_offering_ref || !Number.isInteger(dto.service_offering_version) || !dto?.availability_slot_ref) {
      throw new BadRequestException('booking_page_offering_version_and_slot_required');
    }
    if (dto.attributes && (typeof dto.attributes !== 'object' || Array.isArray(dto.attributes))) {
      throw new BadRequestException('booking_attributes_must_be_object');
    }
    await this.assertServiceConsent(familyId);
    const tenantId = await this.tenantForFamily(familyId);
    const offering = await this.activeOffering(tenantId, dto.service_offering_ref, dto.service_offering_version!);

    if (idempotencyKey) {
      const existing = await this.repo.query<BookingRow>(
        `select b.booking_request_id, b.booking_ref, b.status, o.service_offering_ref,
                s.availability_slot_ref, b.row_version, b.correlation_id, s.starts_at, s.channel
           from family_booking_requests b
           join family_service_offerings o on o.service_offering_id=b.service_offering_id
           join family_service_availability_slots s on s.availability_slot_id=b.availability_slot_id
          where b.tenant_id=$1 and b.family_id=$2 and b.idempotency_key=$3 limit 1`,
        [tenantId, familyId, idempotencyKey],
      );
      const replay = existing.rows[0];
      if (replay) {
        if (replay.service_offering_ref !== offering.service_offering_ref || replay.availability_slot_ref !== dto.availability_slot_ref) {
          throw new ConflictException('booking_idempotency_conflict');
        }
        const record = await this.repo.query<RecordRow>(
          `select booking_service_record_id, source_booking_request_id, status
             from family_booking_service_records
            where tenant_id=$1 and family_id=$2 and source_booking_request_id=$3 limit 1`,
          [tenantId, familyId, replay.booking_request_id],
        );
        const recordRow = record.rows[0];
        if (!recordRow) throw new Error('booking_idempotency_service_record_missing');
        const event = await this.events.record({
          tenantId, familyId, actorId: actorPersonId, eventType: 'booking_request_submitted',
          objectType: 'BookingRequest', objectId: replay.booking_request_id, sourcePageId: dto.page_id,
          purpose: 'SERVICE_PLANNING', consentRef: `service-consent:${familyId}`,
          correlationId: replay.correlation_id,
          payload: { booking_ref: replay.booking_ref, service_offering_ref: replay.service_offering_ref, availability_slot_ref: replay.availability_slot_ref },
          createdBy: actorPersonId,
        });
        return { booking: this.receipt(replay, event.eventId), service_record: this.recordReceipt(recordRow) };
      }
    }

    const slot = await this.availableSlot(tenantId, dto.availability_slot_ref, offering.service_offering_id);
    const persisted = await this.repo.withTransaction(async (client) => {
      const reserved = await client.query<{ availability_slot_id: string }>(
        `update family_service_availability_slots
            set reserved_count=reserved_count+1,
                status=case when reserved_count+1>=capacity then 'RESERVED'::family_availability_slot_status else 'AVAILABLE'::family_availability_slot_status end,
                row_version=row_version+1, updated_at=now()
          where availability_slot_id=$1 and tenant_id=$2 and status='AVAILABLE' and reserved_count<capacity
          returning availability_slot_id`,
        [slot.availability_slot_id, tenantId],
      );
      if (!reserved.rows[0]) throw new ConflictException('service_slot_no_longer_available');
      const bookingRef = `BOOKING-${randomUUID()}`;
      const booking = await client.query<BookingRow>(
        `insert into family_booking_requests(
           tenant_id, family_id, actor_person_id, booking_ref, service_offering_id, availability_slot_id,
           source_page_id, consent_ref, status, service_snapshot, attributes, environment, source_system,
           external_effect, correlation_id, idempotency_key, created_by, updated_by
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,'REQUESTED',$9::jsonb,$10::jsonb,$11,'TEST_FIXTURE',false,$12,$13,$14,$14)
         returning booking_request_id, booking_ref, status,
           (select service_offering_ref from family_service_offerings where service_offering_id=$5) as service_offering_ref,
           (select availability_slot_ref from family_service_availability_slots where availability_slot_id=$6) as availability_slot_ref,
           row_version, correlation_id,
           (select starts_at from family_service_availability_slots where availability_slot_id=$6) as starts_at,
           (select channel from family_service_availability_slots where availability_slot_id=$6) as channel`,
        [tenantId, familyId, actorPersonId, bookingRef, offering.service_offering_id, slot.availability_slot_id,
          dto.page_id, `service-consent:${familyId}`,
          JSON.stringify({ service_offering_ref: offering.service_offering_ref, service_offering_version: offering.version_no, provider_ref: offering.provider_ref, slot_ref: slot.availability_slot_ref }),
          JSON.stringify(dto.attributes ?? {}), this.environment(), correlationId, idempotencyKey ?? null, actorPersonId],
      );
      const bookingRow = booking.rows[0];
      if (!bookingRow) throw new Error('booking_request_persistence_failed');
      const record = await client.query<RecordRow>(
        `insert into family_booking_service_records(
           tenant_id, family_id, source_booking_request_id, status, environment, source_system,
           external_effect, attributes, created_by, updated_by
         ) values ($1,$2,$3,'PENDING',$4,'TEST_NOOP_ADAPTER',false,$5::jsonb,$6,$6)
         returning booking_service_record_id, source_booking_request_id, status`,
        [tenantId, familyId, bookingRow.booking_request_id, this.environment(), JSON.stringify({ booking_ref: bookingRow.booking_ref }), actorPersonId],
      );
      const recordRow = record.rows[0];
      if (!recordRow) throw new Error('booking_service_record_persistence_failed');
      return { booking: bookingRow, record: recordRow };
    });
    const event = await this.events.record({
      tenantId, familyId, actorId: actorPersonId, eventType: 'booking_request_submitted',
      objectType: 'BookingRequest', objectId: persisted.booking.booking_request_id, sourcePageId: dto.page_id,
      purpose: 'SERVICE_PLANNING', consentRef: `service-consent:${familyId}`, correlationId,
      payload: { booking_ref: persisted.booking.booking_ref, service_offering_ref: persisted.booking.service_offering_ref, availability_slot_ref: persisted.booking.availability_slot_ref },
      createdBy: actorPersonId,
    });
    return { booking: this.receipt(persisted.booking, event.eventId), service_record: this.recordReceipt(persisted.record) };
  }

  async cancel(familyId: string, actorPersonId: string, dto: CancelBookingDto, correlationId: string): Promise<BookingRequestReceipt> {
    requireDevSyntheticTestLoop();
    if (!pageAllowedForServiceBooking(dto?.page_id) || !dto.booking_request_id) {
      throw new BadRequestException('booking_cancel_page_and_request_required');
    }
    const tenantId = await this.tenantForFamily(familyId);
    const expected = dto.expected_row_version ?? null;
    const updated = await this.repo.withTransaction(async (client) => {
      const booking = await client.query<BookingRow>(
        `update family_booking_requests b
            set status='CANCELLED', cancelled_at=now(), row_version=b.row_version+1,
                updated_at=now(), updated_by=$4
           from family_service_offerings o, family_service_availability_slots s
          where b.booking_request_id=$1 and b.tenant_id=$2 and b.family_id=$3
            and b.service_offering_id=o.service_offering_id and b.availability_slot_id=s.availability_slot_id
            and b.status='REQUESTED' and ($5::integer is null or b.row_version=$5)
          returning b.booking_request_id, b.booking_ref, b.status, o.service_offering_ref,
                    s.availability_slot_ref, b.row_version, b.correlation_id, s.starts_at, s.channel`,
        [dto.booking_request_id, tenantId, familyId, actorPersonId, expected],
      );
      const row = booking.rows[0];
      if (!row) throw new ConflictException('booking_not_cancellable_or_version_conflict');
      await client.query(
        `update family_service_availability_slots
            set reserved_count=greatest(reserved_count-1,0),
                status=case when status='RESERVED' then 'AVAILABLE'::family_availability_slot_status else status end,
                row_version=row_version+1, updated_at=now()
          where availability_slot_id=(select availability_slot_id from family_booking_requests where booking_request_id=$1)
            and tenant_id=$2`,
        [dto.booking_request_id, tenantId],
      );
      await client.query(
        `update family_booking_service_records
            set status='CANCELLED', row_version=row_version+1, updated_at=now(), updated_by=$4
          where source_booking_request_id=$1 and tenant_id=$2 and family_id=$3
            and status in ('PENDING','SCHEDULED')`,
        [dto.booking_request_id, tenantId, familyId, actorPersonId],
      );
      return row;
    });
    const event = await this.events.record({
      tenantId, familyId, actorId: actorPersonId, eventType: 'booking_request_cancelled',
      objectType: 'BookingRequest', objectId: updated.booking_request_id, sourcePageId: dto.page_id,
      purpose: 'SERVICE_PLANNING', consentRef: `service-consent:${familyId}`, correlationId,
      payload: { booking_ref: updated.booking_ref }, createdBy: actorPersonId,
    });
    return this.receipt(updated, event.eventId);
  }

  async customerProjection(familyId: string): Promise<FamilyBookingProjection> {
    requireDevSyntheticTestLoop();
    const tenantId = await this.tenantForFamily(familyId);
    const [bookings, records, policy] = await Promise.all([
      this.repo.query<BookingRow>(
        `select booking_request_id, booking_ref, booking_status as status, service_offering_ref, availability_slot_ref,
                1 as row_version, ''::varchar as correlation_id, starts_at, channel
           from family_customer_service_booking_projection_v
          where tenant_id=$1 and family_id=$2 order by created_at desc, booking_request_id desc`,
        [tenantId, familyId],
      ),
      this.repo.query<RecordRow>(
        `select booking_service_record_id, booking_request_id as source_booking_request_id, service_record_status as status
           from family_customer_service_booking_projection_v
          where tenant_id=$1 and family_id=$2 and booking_service_record_id is not null
          order by created_at desc`,
        [tenantId, familyId],
      ),
      this.repo.query<{ policy_version: string }>(
        `select policy_version from tenant_policy_profiles where tenant_id=$1 and status='ACTIVE' limit 1`,
        [tenantId],
      ),
    ]);
    return {
      tenant_id: tenantId, family_id: familyId, projection_version: 1,
      as_of: new Date().toISOString(), source_refs: ['family_booking_requests', 'family_booking_service_records'],
      policy_version: policy.rows[0]?.policy_version ?? null, visibility: 'FAMILY_PRIVATE', expires_at: null,
      bookings: bookings.rows.map((row) => ({
        booking_request_id: row.booking_request_id, booking_ref: row.booking_ref, status: row.status,
        service_offering_ref: row.service_offering_ref, availability_slot_ref: row.availability_slot_ref,
        starts_at: row.starts_at, channel: row.channel,
      })),
      service_records: records.rows.map((row) => ({
        service_record_id: row.booking_service_record_id, source_booking_request_id: row.source_booking_request_id, status: row.status,
      })),
      text_equivalent: '以下显示当前家庭已选择的咨询与活动服务记录。不会发送通知或确认真人服务。',
    };
  }

  private recordReceipt(row: RecordRow): FamilyServiceRecordReceipt {
    return {
      service_record_id: row.booking_service_record_id,
      status: row.status,
      source_booking_request_id: row.source_booking_request_id,
      projection_version: 1,
      external_effect: false,
      text_equivalent: '已生成服务记录回执。不会发送通知或确认真人服务。',
    };
  }

  private receipt(row: BookingRow, eventId: string): BookingRequestReceipt {
    return {
      booking_request_id: row.booking_request_id, booking_ref: row.booking_ref, status: row.status,
      service_offering_ref: row.service_offering_ref, availability_slot_ref: row.availability_slot_ref,
      row_version: row.row_version, event_id: eventId, external_effect: false, environment: this.environment(),
      text_equivalent: serviceBookingTextEquivalent(row.status === 'CANCELLED' ? 'CANCEL_BOOKING' : 'REQUEST_BOOKING'),
    };
  }
}
