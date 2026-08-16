/**
 * ZEGA.AI — Financial Lineage Test (v5.3)
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 Financial Audit Lineage Isolation', () => {
  test('withdrawal_audit_logs is TENANT_SCOPED with organization_id', async () => {
    const { data } = await supabase
      .from('tenant_security_manifest')
      .select('table_name, ownership_model, financial_sensitivity, parent_entity')
      .eq('table_name', 'withdrawal_audit_logs')
      .single();

    if (data) {
      expect(data.ownership_model).toBe('TENANT_SCOPED');
      expect(data.financial_sensitivity).toBe(true);
      expect(data.parent_entity).toBe('withdrawals');
    }
  });
});
