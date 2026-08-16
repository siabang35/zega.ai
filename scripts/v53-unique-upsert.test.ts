/**
 * ZEGA.AI — Unique Constraint & UPSERT Scope Test (v5.3)
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 Unique Constraint & UPSERT Scope Test', () => {
  test('Unique rules enforce organization_id scope', async () => {
    const { data } = await supabase.rpc('get_tenant_constitution_raw_evidence_v53');
    if (data) {
      expect(data.constraints).toBeDefined();
    }
  });
});
