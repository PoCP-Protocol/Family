import { describe, expect, it } from 'vitest';
import { renderFesContractFreeze } from './app';

describe('fes-web contract freeze view model', () => {
  it('renders FES as an education business system boundary', () => {
    const text = renderFesContractFreeze();

    expect(text).toContain('FES - Family Education System');
    expect(text).toContain('Customer');
    expect(text).toContain('AdvisorSummaryGenerated');
    expect(text).toContain('customer != Family');
  });
});
