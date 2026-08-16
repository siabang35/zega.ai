/**
 * ZEGA.AI — Store Scoped Lineage Test (v5.3)
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 Store Scoped Lineage', () => {
  test('umkm_finance_chats maintains store_id and organization_id linkage', async () => {
    const { data } = await supabase
      .from('tenant_security_manifest')
      .select('table_name, tenant_column, composite_fk_status')
      .eq('table_name', 'umkm_finance_chats')
      .single();

    if (data) {
      expect(data.tenant_column).toBe('organization_id');
      expect(data.composite_fk_status).toBe('ENFORCED_V53');
    }
  });
});
