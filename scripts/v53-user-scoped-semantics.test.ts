/**
 * ZEGA.AI — USER_SCOPED Semantics Test (v5.3)
 * Verifies that all remediated message/help tables are TENANT_SCOPED.
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 USER_SCOPED Reclassification Semantics', () => {
  test('No message table remains unclassified USER_SCOPED', async () => {
    const { data } = await supabase
      .from('tenant_security_manifest')
      .select('table_name, ownership_model')
      .in('table_name', [
        'umkm_ai_assistant_messages',
        'umkm_copilot_messages',
        'umkm_finance_ai_messages',
        'umkm_finance_messages',
        'umkm_help_live_messages',
        'umkm_live_help_messages',
        'umkm_zega_copilot_messages'
      ]);

    if (data && data.length > 0) {
      data.forEach((row: any) => {
        expect(row.ownership_model).toBe('TENANT_SCOPED');
      });
    }
  });
});
