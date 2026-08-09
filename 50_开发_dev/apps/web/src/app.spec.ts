import { describe, expect, it, vi } from 'vitest';
import { createGrowthApp, submitStartGrowthOnboarding, type AppConfig } from './app';

const config: AppConfig = {
  apiBaseUrl: 'http://api.test',
  actorPersonId: 'guardian-1',
  familyId: 'family-1',
  childId: 'child-1',
  guardianPersonId: 'guardian-1',
};

describe('M2-101 Family web onboarding', () => {
  it('renders F01 family context and F02 onboarding controls', () => {
    const root = document.createElement('main');

    createGrowthApp(root, config);

    expect(root.textContent).toContain('F01 Family Home');
    expect(root.textContent).toContain('F02 Growth Onboarding');
    expect(root.textContent).toContain('EARLY_ADOLESCENCE_12_15');
    expect(root.textContent).toContain('AI optional');
  });

  it('submits StartGrowthOnboarding with named-action headers and no AI personalization payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        onboarding: {
          onboardingId: 'journey-1',
          familyId: config.familyId,
          childId: config.childId,
          guardianPersonId: config.guardianPersonId,
          status: 'STARTED',
          phase: 'ONBOARDING',
          lifeStage: 'EARLY_ADOLESCENCE_12_15',
          journeyType: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
          dimensions: ['P03', 'R03', 'R04', 'R05'],
          safetyScreeningResult: 'LOW',
          createdAt: '2026-08-09T00:00:00.000Z',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await submitStartGrowthOnboarding(config, 'LOW');

    expect(response.onboarding.status).toBe('STARTED');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/families/family-1/growth/onboarding',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Actor-Person-Id': 'guardian-1',
          'Idempotency-Key': 'm2-101-family-1-child-1',
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      childId: 'child-1',
      guardianPersonId: 'guardian-1',
      safetyScreeningResult: 'LOW',
    });
    expect(body).not.toHaveProperty('aiPersonalization');
  });
});
