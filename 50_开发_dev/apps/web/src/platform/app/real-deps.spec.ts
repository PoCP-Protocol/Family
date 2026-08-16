// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { submitStep } from './real-deps';
import { screenFor } from '../onboarding/onboarding-flow';
import type { PlatformApi } from './platform-app';

function apiSpy(ok = true): { api: PlatformApi; posts: Array<{ path: string; body: unknown }> } {
  const posts: Array<{ path: string; body: unknown }> = [];
  const api: PlatformApi = {
    async get<T>() { return { ok: true, data: {} as T }; },
    async post<T>(path: string, body?: unknown) { posts.push({ path, body }); return ok ? { ok: true, data: {} as T } : { ok: false, error: { status: 400, code: 'bad', message: 'bad' } }; },
  };
  return { api, posts };
}
const status = (step: 'create_family' | 'add_child', fid = 'fam-1') => screenFor({ family_id: fid, complete: false, current_step: step, steps: [], child_id: null });

describe('submitStep create_family', () => {
  it('渲染家庭名/称呼表单;提交 POST /auth/families', async () => {
    const root = document.createElement('div');
    const { api, posts } = apiSpy();
    const p = submitStep(api, root, status('create_family'));
    (root.querySelector('.f-display_name') as HTMLInputElement).value = '王家';
    (root.querySelector('.f-guardian_name') as HTMLInputElement).value = '妈妈';
    (root.querySelector('.form-submit') as HTMLButtonElement).click();
    expect(await p).toBe(true);
    expect(posts[0].path).toBe('/auth/families');
    expect(posts[0].body).toMatchObject({ display_name: '王家', guardian_name: '妈妈' });
  });
});

describe('submitStep add_child', () => {
  it('POST /families/{fid}/children,含 idempotency_key;birth_date 留空则不带', async () => {
    const root = document.createElement('div');
    const { api, posts } = apiSpy();
    const p = submitStep(api, root, status('add_child', 'fam-9'));
    (root.querySelector('.f-display_name') as HTMLInputElement).value = '小明';
    (root.querySelector('.form-submit') as HTMLButtonElement).click();
    expect(await p).toBe(true);
    expect(posts[0].path).toBe('/families/fam-9/children');
    const body = posts[0].body as Record<string, unknown>;
    expect(body.display_name).toBe('小明');
    expect(typeof body.idempotency_key).toBe('string');
    expect('birth_date' in body).toBe(false);
  });

  it('填了 birth_date 则带上', async () => {
    const root = document.createElement('div');
    const { api, posts } = apiSpy();
    const p = submitStep(api, root, status('add_child', 'fam-9'));
    (root.querySelector('.f-display_name') as HTMLInputElement).value = '小明';
    (root.querySelector('.f-birth_date') as HTMLInputElement).value = '2015-06-01';
    (root.querySelector('.form-submit') as HTMLButtonElement).click();
    expect(await p).toBe(true);
    expect((posts[0].body as Record<string, unknown>).birth_date).toBe('2015-06-01');
  });
});

describe('submitStep 未建表单步骤', () => {
  it('如 grant_consent → 诚实提示"建设中",不假前进', async () => {
    const root = document.createElement('div');
    const { api, posts } = apiSpy();
    const consentScreen = screenFor({ family_id: 'fam-1', complete: false, current_step: 'grant_consent', steps: [], child_id: 'c1' });
    const ok = await submitStep(api, root, consentScreen);
    expect(ok).toBe(false);
    expect(root.querySelector('.step-todo')).toBeTruthy();
    expect(posts.length).toBe(0);
  });
});
