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
  if (!value) return '当前无可用时间';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '当前无可用时间' : date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
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
 * Renders UI-19 as an admitted teacher-supply read projection. No item opens UI-20 or creates a booking.
 * @param {HTMLElement} root
 * @param {{ apiBaseUrl: string, familyId: string, fetchImpl?: typeof fetch }} config
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
    if (!projection.offerings.length) return `<p style="${cardStyle}color:#4c6987" data-ui19-empty="true">当前筛选下没有可见服务。你可以调整筛选，或稍后再查看。</p>`;
    return projection.offerings.map((item) => `<article style="${cardStyle}" data-ui19-offering-ref="${text(item.service_offering_ref)}">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><div><strong style="font-size:16px">${text(item.provider_display_name)}</strong><p style="margin:4px 0;color:#315b84;font-size:14px">${text(item.title)}</p></div><span style="padding:4px 8px;border-radius:999px;background:#e7f4ea;color:#2f7a43;font-size:12px">已准入</span></div>
      <p style="margin:8px 0 0;color:#4c6987;font-size:13px">${item.service_type ? `服务类型：${text(item.service_type)} · ` : ''}${item.age_band ? `适龄：${text(item.age_band)} · ` : ''}${item.next_available_channel ?? '暂无可用方式'}</p>
      <p style="margin:6px 0 0;color:#315b84;font-size:13px">${item.availability_status === 'AVAILABLE' ? `可查看的时间：${text(timeText(item.next_available_at))}` : '当前没有可用时间'}</p>
    </article>`).join('');
  }

  function renderLoading() {
    root.innerHTML = `<section class="by-app by-clear-reference" data-ui-id="UI-19" style="${style}"><img class="by-screen" role="img" src="${referenceImage}" alt="名师专区原图：搜索、咨询横幅、热门领域、推荐名师与底部导航" style="display:block;width:100%;height:auto"><div style="${cardStyle}" aria-live="polite">正在读取可见服务供给…</div></section>`;
  }

  function renderReady() {
    if (!projection) return;
    root.innerHTML = `<section class="by-app by-clear-reference" data-ui-id="UI-19" style="${style}"><img class="by-screen" role="img" src="${referenceImage}" alt="名师专区原图：搜索、咨询横幅、热门领域、推荐名师与底部导航" style="display:block;width:100%;height:auto"><div style="padding:14px 16px 2px"><h1 style="margin:0;color:#123d68;font-size:19px">推荐名师</h1><p style="margin:6px 0;color:#4c6987;font-size:13px">${text(projection.text_equivalent)}</p></div>${filtersHtml()}<section aria-live="polite" aria-label="服务供给列表">${offeringsHtml()}</section></section>`;
    bindFilters();
  }

  function renderBlocked() {
    root.innerHTML = `<section class="by-app by-clear-reference" data-ui-id="UI-19" style="${style}"><img class="by-screen" role="img" src="${referenceImage}" alt="名师专区原图：搜索、咨询横幅、热门领域、推荐名师与底部导航" style="display:block;width:100%;height:auto"><p style="${cardStyle}" aria-live="polite" data-ui19-boundary="blocked">当前无法显示服务供给。请确认家庭服务授权后再查看。</p></section>`;
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
  }

  void reload();
  return { reload };
}
