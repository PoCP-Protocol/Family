// @ts-nocheck
/**
 * UI-19 teacher supply client. It reads admitted, family-scoped supply only.
 * It never creates a booking, contacts a provider, or triggers an external effect.
 */

/**
 * @typedef {{
 *   service_offering_id: string,
 *   service_offering_ref: string,
 *   version_no: number,
 *   title: string,
 *   provider_ref: string,
 *   provider_display_name: string,
 *   provider_kind: 'TEACHER',
 *   qualification_status: 'ACTIVE',
 *   admission_status: 'ADMITTED',
 *   offering_status: 'ACTIVE',
 *   service_type: string | null,
 *   age_band: string | null,
 *   next_available_at: string | null,
 *   next_available_channel: 'VIDEO' | 'TEXT' | 'OFFLINE' | null,
 *   availability_status: 'AVAILABLE' | 'UNAVAILABLE',
 *   fixture_only: true,
 *   attributes_schema_version: number,
 * }} TeacherSupplyOffering
 */

/** @typedef {{ session_ref: string, title: string, topic: string, starts_at: string, status: 'SCHEDULED'|'LIVE'|'ENDED', host_display_name: string, fixture_only: true, external_effect: false }} ExpertLiveSession */

/** @typedef {{ serviceType?: string, ageBand?: string, availableOnly?: boolean }} TeacherSupplyFilters */

/**
 * @typedef {{
 *   tenant_id: string,
 *   family_id: string,
 *   source_page_id: 'UI-19',
 *   projection_version: number,
 *   as_of: string,
 *   source_refs: string[],
 *   policy_version: string | null,
 *   visibility: 'FAMILY_SCOPED_ADMITTED_SUPPLY',
 *   expires_at: string | null,
 *   external_effect: false,
 *   filters: { provider_kind: 'TEACHER', service_type: string | null, age_band: string | null, available_only: boolean },
 *   offerings: TeacherSupplyOffering[],
 *   live_session: ExpertLiveSession | null,
 *   text_equivalent: string,
 * }} TeacherSupplyProjection
 */

export class TeacherSupplyProjectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TeacherSupplyProjectionError';
  }
}

/** @param {unknown} value @returns {value is TeacherSupplyProjection} */
function isTeacherSupplyProjection(value) {
  if (!value || typeof value !== 'object') return false;
  const payload = /** @type {Record<string, unknown>} */ (value);
  return payload.source_page_id === 'UI-19'
    && payload.visibility === 'FAMILY_SCOPED_ADMITTED_SUPPLY'
    && payload.external_effect === false
    && Array.isArray(payload.offerings)
    && (payload.live_session === null || (payload.live_session && payload.live_session.fixture_only === true && payload.live_session.external_effect === false && typeof payload.live_session.session_ref === 'string'))
    && typeof payload.tenant_id === 'string'
    && typeof payload.family_id === 'string';
}

/**
 * Loads only admitted TEACHER supply for the trusted family context resolved by the server.
 * @param {{ apiBaseUrl: string, familyId: string, authToken?: string, filters?: TeacherSupplyFilters, fetchImpl?: typeof fetch }} config
 * @returns {Promise<TeacherSupplyProjection>}
 */
export async function loadTeacherSupply(config) {
  const filters = config.filters ?? {};
  const params = new URLSearchParams({ page_id: 'UI-19' });
  if (filters.serviceType) params.set('service_type', filters.serviceType);
  if (filters.ageBand) params.set('age_band', filters.ageBand);
  if (filters.availableOnly) params.set('available_only', 'true');
  const fetchImpl = config.fetchImpl ?? fetch;
  const correlationId = `family-ui19-supply-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await fetchImpl(
    `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/offerings?${params.toString()}`,
    {
      method: 'GET',
      credentials: config.authToken ? 'omit' : 'include',
      headers: { 'x-correlation-id': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
    },
  );
  if (!response.ok) throw new TeacherSupplyProjectionError(`teacher_supply_read_failed_${response.status}`);
  const payload = await response.json();
  if (!isTeacherSupplyProjection(payload)) throw new TeacherSupplyProjectionError('teacher_supply_projection_invalid');
  if (payload.family_id !== config.familyId || payload.filters.provider_kind !== 'TEACHER') {
    throw new TeacherSupplyProjectionError('teacher_supply_scope_or_kind_invalid');
  }
  if (!payload.offerings.every((item) => item?.provider_kind === 'TEACHER'
    && item?.qualification_status === 'ACTIVE'
    && item?.admission_status === 'ADMITTED'
    && item?.offering_status === 'ACTIVE')) {
    throw new TeacherSupplyProjectionError('teacher_supply_admission_invalid');
  }
  return payload;
}
