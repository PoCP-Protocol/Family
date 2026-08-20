// @ts-nocheck
import { TeacherSupplyProjectionError, loadTeacherSupply } from './teacher-supply-client.js';

/** @typedef {import('./teacher-supply-client.js').TeacherSupplyFilters} TeacherSupplyFilters */

const referenceImage = '/public/bangyang-reference/teacher-zone-reference-458x1008.png';

/** @param {unknown} value */
function text(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character] ?? character));
}

/** @param {string | null} value */
function timeText(value) {
  if (!value) return '目前暂无安排信息';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '目前暂无安排信息' : date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** @param {string | null} value */
function channelText(value) {
  return ({ VIDEO: '线上交流', TEXT: '文字交流', OFFLINE: '线下交流' }[String(value)] || '可进一步了解');
}

/** @param {import('./teacher-supply-client.js').TeacherSupplyProjection} projection */
function availableServiceTypes(projection) {
  return [...new Set(projection.offerings.map((item) => item.service_type).filter((item) => typeof item === 'string' && item))];
}

/** @param {import('./teacher-supply-client.js').TeacherSupplyProjection} projection */
function availableAgeBands(projection) {
  return [...new Set(projection.offerings.map((item) => item.age_band).filter((item) => typeof item === 'string' && item))];
}

/**
 * Renders UI-19 as a family support-topic read projection. A selected topic can open UI-20 using only the already-read summary; no booking is created.
 * @param {HTMLElement} root
 * @param {{ apiBaseUrl: string, familyId: string, fetchImpl?: typeof fetch, onOpenTopic?: (topic: any) => void, onOpenActivityCatalog?: () => void, onRender?: (projection?: any) => void }} config
 */
export function mountTeacherSupplyView(root, config) {
  /** @type {TeacherSupplyFilters} */
  let filters = { availableOnly: true };
  let projection = null;

  const style = 'width:min(100%,458px);margin:0 auto;background:#f4f8ff;color:#10233f;font-family:system-ui,-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;';
  const cardStyle = 'margin:12px 16px;padding:14px;border:1px solid #d8e8f8;border-radius:14px;background:#fff;box-shadow:0 4px 14px rgba(24,92,156,.08);';

  function filtersHtml() {
    if (!projection) return '';
    const typeButtons = availableServiceTypes(projection).map((value) => `<button type="button" data-ui19-service-type="${text(value)}" aria-pressed="${filters.serviceType === value}" style="margin:4px;padding:6px 10px;border:1px solid #9fc6eb;border-radius:999px;background:${filters.serviceType === value ? '#1677d2' : '#fff'};color:${filters.serviceType === value ? '#fff' : '#135a93'}">${text(value)}</button>`).join('');
    const ageButtons = availableAgeBands(projection).map((value) => `<button type="button" data-ui19-age-band="${text(value)}" aria-pressed="${filters.ageBand === value}" style="margin:4px;padding:6px 10px;border:1px solid #9fc6eb;border-radius:999px;background:${filters.ageBand === value ? '#1677d2' : '#fff'};color:${filters.ageBand === value ? '#fff' : '#135a93'}">${text(value)}</button>`).join('');
    return `<div style="padding:4px 12px 10px" aria-label="服务供给筛选">
      <p style="margin:8px 4px 2px;font-size:13px;color:#4c6987">服务类型</p>
      <button type="button" data-ui19-service-type="" aria-pressed="${!filters.serviceType}" style="margin:4px;padding:6px 10px;border:1px solid #9fc6eb;border-radius:999px;background:${!filters.serviceType ? '#1677d2' : '#fff'};color:${!filters.serviceType ? '#fff' : '#135a93'}">全部</button>${typeButtons}
      <p style="margin:8px 4px 2px;font-size:13px;color:#4c6987">适龄范围</p>
      <button type="button" data-ui19-age-band="" aria-pressed="${!filters.ageBand}" style="margin:4px;padding:6px 10px;border:1px solid #9fc6eb;border-radius:999px;background:${!filters.ageBand ? '#1677d2' : '#fff'};color:${!filters.ageBand ? '#fff' : '#135a93'}">全部</button>${ageButtons}
      <label style="display:flex;gap:8px;align-items:center;margin:10px 4px;font-size:13px;color:#355b7c"><input type="checkbox" data-ui19-available-only ${filters.availableOnly ? 'checked' : ''}> 仅看当前可用服务</label>
    </div>`;
  }

  function offeringsHtml() {
    if (!projection) return '';
    if (!projection.offerings.length) return `<p style="${cardStyle}color:#4c6987" data-ui19-empty="true">暂时没有符合当前筛选的支持主题。可以调整筛选，或之后再来看看。</p>`;
    return projection.offerings.map((item) => `<article style="${cardStyle}" data-ui19-offering-ref="${text(item.service_offering_ref)}">
      <div><strong style="font-size:16px">${text(item.title)}</strong><p style="margin:4px 0;color:#315b84;font-size:14px">这是一个可以慢慢了解的家庭支持方向。</p></div>
      <p style="margin:8px 0 0;color:#4c6987;font-size:13px">${item.service_type ? `支持主题：${text(item.service_type)} · ` : ''}${item.age_band ? `适龄参考：${text(item.age_band)}` : '可按家庭当前情境了解'}</p>
      <p style="margin:6px 0 0;color:#315b84;font-size:13px">${item.availability_status === 'AVAILABLE' ? `可以了解的方式：${channelText(item.next_available_channel)} · ${text(timeText(item.next_available_at))}` : '目前暂无安排信息，仍可先了解这个支持方向。'}</p>
      <button type="button" class="by-btn by-btn-ghost" data-ui19-open-topic="${text(item.service_offering_ref)}">了解这个主题</button>
    </article>`).join('');
  }

  function renderLoading() {
    root.innerHTML = `<section class="by-app by-clear-reference" data-ui-id="UI-19" style="${style}"><img class="by-screen" role="img" src="${referenceImage}" alt="名师专区原图：搜索、咨询横幅、热门领域、推荐名师与底部导航" style="display:block;width:100%;height:auto"><div style="${cardStyle}" aria-live="polite">正在准备家庭支持主题…</div></section>`;
    config.onRender?.();
  }

  function renderReady() {
    if (!projection) return;
    root.innerHTML = `<section class="by-app by-clear-reference" data-ui-id="UI-19" style="${style}"><img class="by-screen" role="img" src="${referenceImage}" alt="名师专区原图：搜索、咨询横幅、热门领域、推荐名师与底部导航" style="display:block;width:100%;height:auto"><div style="padding:14px 16px 2px"><h1 style="margin:0;color:#123d68;font-size:19px">家庭支持主题</h1><p style="margin:6px 0;color:#4c6987;font-size:13px">可以按家庭当前的情境慢慢了解。浏览不会替家庭作出安排。</p><button type="button" class="by-btn by-btn-ghost" data-ui19-open-activity-catalog>看看家庭成长活动</button></div>${filtersHtml()}<section aria-live="polite" aria-label="家庭支持主题列表">${offeringsHtml()}</section><p class="by-assistive-status" aria-live="polite">家庭支持主题已准备好。可以按自己的节奏慢慢了解。</p></section>`;
    bindFilters();
    config.onRender?.(projection);
  }

  function renderBlocked() {
    root.innerHTML = `<section class="by-app by-clear-reference" data-ui-id="UI-19" style="${style}"><img class="by-screen" role="img" src="${referenceImage}" alt="名师专区原图：搜索、咨询横幅、热门领域、推荐名师与底部导航" style="display:block;width:100%;height:auto"><p style="${cardStyle}" aria-live="polite" data-ui19-boundary="blocked">家庭支持主题暂时无法加载，请稍后再试。</p></section>`;
    config.onRender?.();
  }

  async function reload() {
    renderLoading();
    try {
      projection = await loadTeacherSupply({ ...config, filters });
      root.dataset.ui19SupplyStatus = 'READ_ONLY_READY';
      root.dataset.ui19SupplyExternalEffect = 'false';
      root.dataset.ui19SupplyTenant = projection.tenant_id;
      root.dataset.ui19SupplyFamily = projection.family_id;
      renderReady();
    } catch (error) {
      root.dataset.ui19SupplyStatus = error instanceof TeacherSupplyProjectionError ? 'BOUNDARY_BLOCKED' : 'CLIENT_FAILURE';
      root.dataset.ui19SupplyExternalEffect = 'false';
      renderBlocked();
    }
  }

  function bindFilters() {
    root.querySelectorAll('[data-ui19-service-type]').forEach((element) => element.addEventListener('click', () => {
      filters = { ...filters, serviceType: element.getAttribute('data-ui19-service-type') || undefined };
      void reload();
    }));
    root.querySelectorAll('[data-ui19-age-band]').forEach((element) => element.addEventListener('click', () => {
      filters = { ...filters, ageBand: element.getAttribute('data-ui19-age-band') || undefined };
      void reload();
    }));
    root.querySelector('[data-ui19-available-only]')?.addEventListener('change', (event) => {
      filters = { ...filters, availableOnly: /** @type {HTMLInputElement} */ (event.currentTarget).checked };
      void reload();
    });
    root.querySelectorAll('[data-ui19-open-topic]').forEach((element) => element.addEventListener('click', () => {
      const selected = projection?.offerings.find((item) => item.service_offering_ref === element.getAttribute('data-ui19-open-topic'));
      if (selected) config.onOpenTopic?.(selected);
    }));
    root.querySelector('[data-ui19-open-activity-catalog]')?.addEventListener('click', () => config.onOpenActivityCatalog?.());
  }

  void reload();
  return { reload };
}
