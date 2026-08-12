# Cloud Storage & CDN Multi-Tenant Isolation Security Architecture

## 1. Storage Path Namespacing Standard

All files uploaded by tenants (invoices, logos, avatars, reports, PDFs, dataset attachments) MUST be stored under physically isolated storage key prefixes:

$$\text{organizations/\{organization\_id\}/workspaces/\{workspace\_id\}/\{category\}/\{file\_id\}}$$

## 2. Direct Object Path Prevention & Signed Access

- Clients are strictly forbidden from passing arbitrary object storage keys to file retrieval endpoints.
- Private files require server-side generation of short-lived HMAC-signed URLs (expiration max 15 minutes) after validating user organization membership.
