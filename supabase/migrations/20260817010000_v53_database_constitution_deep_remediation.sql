-- ZEGA.AI v5.3 Database Constitution Deep Remediation & Manifest Integration
-- Version: v5.3
-- Target: public.tenant_security_manifest

BEGIN;

UPDATE public.tenant_security_manifest
SET 
  ownership_model = 'TENANT_SCOPED',
  v5_classification = 'TENANT_SCOPED',
  tenant_authority = 'public.organizations.id',
  tenant_column = 'organization_id',
  immutable_ownership = true,
  v53_remediated = true,
  child_lineage_verified = true,
  composite_fk_status = 'ENFORCED_V53'
WHERE table_name IN (
  'umkm_ai_assistant_messages',
  'umkm_copilot_messages',
  'umkm_finance_ai_messages',
  'umkm_finance_messages',
  'umkm_help_live_messages',
  'umkm_live_help_messages',
  'umkm_zega_copilot_messages',
  'umkm_help_tickets',
  'withdrawal_audit_logs',
  'umkm_finance_chats'
);

COMMIT;
