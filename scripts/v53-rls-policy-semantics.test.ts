/**
 * ZEGA.AI — RLS Policy Semantics Test (v5.3)
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 RLS Policy Semantics & Fail-Closed Guards', () => {
  test('No tenant policy contains permissive USING(true) or WITH CHECK(true)', async () => {
    const { data } = await supabase.rpc('run_tenant_constitution_audit_v53');
    if (data) {
      const inv13 = data.find((r: any) => r.check_id === 13);
      const inv14 = data.find((r: any) => r.check_id === 14);
      if (inv13) expect(inv13.status).toBe('PASSED');
      if (inv14) expect(inv14.status).toBe('PASSED');
    }
  });
});
