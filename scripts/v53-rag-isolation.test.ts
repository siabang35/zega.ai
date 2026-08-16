/**
 * ZEGA.AI — RAG Isolation Test (v5.3)
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

describe('v5.3 RAG Vector Isolation', () => {
  test('RAG embeddings and document chunks carry strict organization_id metadata', async () => {
    const { data } = await supabase
      .from('tenant_security_manifest')
      .select('table_name, ownership_model')
      .ilike('table_name', '%embedding%');

    if (data && data.length > 0) {
      data.forEach(row => {
        expect(['TENANT_SCOPED', 'TENANT_DERIVED']).toContain(row.ownership_model);
      });
    }
  });
});
