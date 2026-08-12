# Secrets & Credentials Security Audit

## 1. Secret Columns Forensic Audit

The live database was audited for secret storage across all 295 tables. Identified secret columns:
- `users.password_hash`
- `enterprise_webhook_settings.signature_secret`
- `umkm_settings_api_keys_list.key_token`
- `enterprise_mcp_configs.api_key`
- `otps.code_hash`

## 2. Hardened Secrets Standards

1. **No Plaintext Storage**: All API keys, tokens, and webhook secrets MUST be hashed (SHA-256 for verification-only) or encrypted at rest using AES-256-GCM (for retrieval).
2. **API Exposure Exclusion**: Secret columns MUST be marked as unselectable in standard ORM default queries and excluded from API response serializations.
