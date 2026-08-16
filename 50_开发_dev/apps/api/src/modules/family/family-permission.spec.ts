import { describe, expect, it } from 'vitest';
import { assertFamilyManagePermission } from './family-permission';

describe('FAMILY-GROWTH-VERTICAL-SLICE-001 Growth Mutator Permission Bridge', () => {
  it('allows only a result returned by ACTIVE binding + ACTIVE guardian membership query', async () => {
    const queries: string[] = [];
    const client = {
      query: async (sql: string) => {
        queries.push(sql.toLowerCase());
        return { rowCount: 1, rows: [{ '?column?': 1 }] };
      },
    } as any;
    await expect(assertFamilyManagePermission(client, 'family-1', 'person-1')).resolves.toBeUndefined();
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('account_person_bindings');
    expect(queries[0]).toContain("b.status='active'");
    expect(queries[0]).toContain("m.status='active'");
    expect(queries[0]).not.toContain('audit_logs');
  });

  it('fails closed for a revoked binding, revoked membership, non-member or historical creator', async () => {
    const client = { query: async () => ({ rowCount: 0, rows: [] }) } as any;
    await expect(assertFamilyManagePermission(client, 'family-1', 'person-revoked')).rejects.toThrow('trusted_family_manage_context_required');
  });
});
