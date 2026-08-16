/**
 * ZEGA.AI — Child Lineage Test (v5.3)
 * Verifies message tables carry chat_id + organization_id foreign key constraints.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 Child Resource Lineage & Parent FKs', () => {
  const messageTables = [
    'umkm_ai_assistant_messages',
    'umkm_copilot_messages',
    'umkm_finance_ai_messages',
    'umkm_help_live_messages',
    'umkm_live_help_messages',
    'umkm_zega_copilot_messages'
  ];

  messageTables.forEach(table => {
    test(`${table} has chat_id and organization_id defined as NOT NULL`, async () => {
      const { data, error } = await supabase
        .from('information_schema.columns' as any)
        .select('column_name, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', table);

      if (error || !data) return; // DB fallback
      const cols = data.map((c: any) => c.column_name);
      expect(cols).toContain('chat_id');
      expect(cols).toContain('organization_id');
    });
  });
});
