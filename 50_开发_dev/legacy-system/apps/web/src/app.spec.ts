import { renderFelsAdminShell } from './app';

describe('FELS internal admin shell', () => {
  it('keeps the web surface operational and old-world scoped', () => {
    const shell = renderFelsAdminShell();
    expect(shell.title).toBe('FELS Legacy Operations');
    expect(shell.referenceImplementation).toBe(true);
    expect(shell.realBangyangSource).toBe(false);
    expect(shell.screens).toContain('Legacy Dashboard');
    expect(shell.screens).toContain('Consent Evidence');
    expect(shell.forbiddenNativeLanguage).toContain('GrowthProfile');
    expect(shell.screens).not.toContain('GrowthProfile editor');
  });
});