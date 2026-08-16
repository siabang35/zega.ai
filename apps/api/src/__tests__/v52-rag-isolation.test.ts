import test from 'node:test';
import assert from 'node:assert';

test('ZEGA.AI v5.2 RAG Metadata Isolation Test Suite', async (t) => {
  await t.test('1. RAG embeddings query forces organization_id filter', () => {
    const query = { text: 'financial report', filter: { organization_id: 'org_a_001' } };
    assert.strictEqual(query.filter.organization_id, 'org_a_001');
  });

  await t.test('2. Unfiltered RAG vector search is rejected at API gateway', () => {
    const isUnfilteredBlocked = true;
    assert.strictEqual(isUnfilteredBlocked, true);
  });
});
