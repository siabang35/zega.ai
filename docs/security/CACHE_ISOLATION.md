# Cache Isolation & Key Namespacing Architecture

## 1. Zero Global Cache Keys for Tenant Data

> [!WARNING]
> **Global Cache Key Risk**: Storing tenant-owned records under generic cache keys such as `product:123` or `customer:456` risks catastrophic cross-tenant cache contamination if key collisions occur across organizations.

## 2. Canonical Cache Keyspace Pattern

All Redis keys and memory cache items containing tenant-owned data MUST follow the mandatory pattern:

$$\text{org:\{organization\_id\}:ws:\{workspace\_id\}:\{entity\}:\{id\}}$$

```typescript
// Standard Tenant Cache Key Generator
export function getTenantCacheKey(
  orgId: string,
  wsId: string,
  entity: string,
  id: string
): string {
  return `org:${orgId}:ws:${wsId}:${entity}:${id}`;
}
```
