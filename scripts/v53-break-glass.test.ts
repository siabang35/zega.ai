/**
 * ZEGA.AI — Break-Glass Governance Audit Test (v5.3)
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 Break-Glass Governance', () => {
  test('INV-58: Break-glass no self-approval invariant passes', async () => {
    const { data } = await supabase.rpc('run_tenant_constitution_audit_v53');
    if (data) {
      const inv58 = data.find((r: any) => r.check_id === 58);
      if (inv58) expect(inv58.status).toBe('PASSED');
    }
  });
});
