const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  process.exit(1);
}

function classifyTable(tableName, cols) {
  const name = tableName.toLowerCase();
  
  // 1. IDENTITY
  if (name === 'users' || name === 'auth_identities' || name === 'user_profiles' || name === 'profiles' || name === 'umkm_users') {
    return {
      classification: 'IDENTITY',
      ownership: 'user',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'global_user',
      contains_business_data: false,
      contains_identity: true,
      contains_configuration: false,
      contains_audit: false,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  // 2. TENANCY
  if (name === 'organizations' || name === 'organization_members' || name === 'organization_memberships' || 
      name === 'workspaces' || name === 'workspace_members' || name === 'workspace_memberships' || 
      name === 'enterprise_members' || name === 'enterprise_organizations' || name === 'tenant_config' || name === 'umkm_stores') {
    return {
      classification: 'TENANCY',
      ownership: 'platform_tenant',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization',
      contains_business_data: false,
      contains_identity: true,
      contains_configuration: true,
      contains_audit: false,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  // 3. AUTHENTICATION
  if (name === 'otps' || name === 'auth_tokens' || name === 'session_tokens' || name === 'umkm_user_sessions' || name === 'auth_cache') {
    return {
      classification: 'AUTHENTICATION',
      ownership: 'user_auth',
      source_of_truth: false,
      derived_or_cache: true,
      tenant_scope: 'user',
      contains_business_data: false,
      contains_identity: true,
      contains_configuration: false,
      contains_audit: false,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: true,
      reset_strategy: 'SELECTIVE_RESET'
    };
  }

  // 4. AUTHORIZATION
  if (name === 'roles' || name === 'permissions' || name === 'role_permissions' || name === 'user_roles' || name === 'user_permissions' || name === 'enterprise_mcp_permissions') {
    return {
      classification: 'AUTHORIZATION',
      ownership: 'platform',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'global',
      contains_business_data: false,
      contains_identity: false,
      contains_configuration: true,
      contains_audit: false,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  // 5. PLATFORM CONTROL PLANE & SUPERADMIN
  if (name.includes('superadmin') || name.includes('control_plane') || name.includes('break_glass') || name === 'deployment_registry' || name === 'plans' || name.includes('licensing')) {
    return {
      classification: 'PLATFORM_CONTROL_PLANE',
      ownership: 'superadmin',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'platform',
      contains_business_data: false,
      contains_identity: false,
      contains_configuration: true,
      contains_audit: true,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  // 6. GLOBAL CONFIGURATION & CATALOG
  if (name.includes('catalog') || name.includes('help_faq') || name.includes('help_categories') || name.includes('code_examples') || name.includes('integration_categories') || name.includes('finops_categories')) {
    return {
      classification: 'GLOBAL_CATALOG',
      ownership: 'platform',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'global',
      contains_business_data: false,
      contains_identity: false,
      contains_configuration: true,
      contains_audit: false,
      contains_security: false,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  if (name.includes('general_settings') || name.includes('advanced_config') || name.includes('notifications_config') || name.includes('data_privacy_settings') || name.includes('infrastructure_inventory')) {
    return {
      classification: 'GLOBAL_CONFIGURATION',
      ownership: 'platform',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization_config',
      contains_business_data: false,
      contains_identity: false,
      contains_configuration: true,
      contains_audit: false,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  // 7. DERIVED KPI
  if (name.endsWith('_kpis') || name.includes('overview_kpis') || name.includes('metrics_hourly') || name.includes('kpi') || name.includes('_trends') || name.includes('finops_kpis') || name.includes('budget_overview')) {
    return {
      classification: 'DERIVED_KPI',
      ownership: 'tenant',
      source_of_truth: false,
      derived_or_cache: true,
      tenant_scope: 'organization',
      contains_business_data: true,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: false,
      contains_security: false,
      contains_financial_data: name.includes('cost') || name.includes('finops') || name.includes('budget'),
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // 8. FINANCIAL DATA
  if (name.includes('invoice') || name.includes('payment') || name.includes('wallet') || name.includes('ledger') || name.includes('withdrawal') || name.includes('billing')) {
    return {
      classification: 'FINANCIAL_DATA',
      ownership: 'tenant',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization',
      contains_business_data: true,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: true,
      contains_security: false,
      contains_financial_data: true,
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // 9. KNOWLEDGE DATA
  if (name.includes('knowledge_') || name.includes('documents') || name.includes('datasets') || name.includes('collections') || name.includes('websites')) {
    return {
      classification: 'KNOWLEDGE_DATA',
      ownership: 'tenant',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization',
      contains_business_data: true,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: false,
      contains_security: false,
      contains_financial_data: false,
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // 10. AI DATA
  if (name.includes('agent_') || name.includes('ai_') || name.includes('commander_') || name.includes('my_agents_workforce')) {
    return {
      classification: 'AI_DATA',
      ownership: 'tenant',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization',
      contains_business_data: true,
      contains_identity: false,
      contains_configuration: true,
      contains_audit: false,
      contains_security: false,
      contains_financial_data: false,
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // 11. ANALYTICS DATA
  if (name.includes('analytics_') || name.includes('live_activities') || name.includes('integration_activities') || name.includes('mcp_activities') || name.includes('organization_activities') || name.includes('telemetry') || name.includes('infrastructure_bandwidth') || name.includes('infrastructure_costs')) {
    return {
      classification: 'ANALYTICS_DATA',
      ownership: 'tenant',
      source_of_truth: false,
      derived_or_cache: true,
      tenant_scope: 'organization',
      contains_business_data: true,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: true,
      contains_security: false,
      contains_financial_data: false,
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // 12. AUDIT & LOGS
  if (name.includes('audit') || name.includes('_logs') || name.includes('api_logs') || name.includes('error_logs') || name.includes('mcp_logs')) {
    return {
      classification: 'AUDIT',
      ownership: 'platform_tenant',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization',
      contains_business_data: false,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: true,
      contains_security: true,
      contains_financial_data: false,
      safe_to_reset: false,
      reset_strategy: 'PRESERVE'
    };
  }

  // 13. CACHE
  if (name.includes('cache')) {
    return {
      classification: 'CACHE',
      ownership: 'system',
      source_of_truth: false,
      derived_or_cache: true,
      tenant_scope: 'global',
      contains_business_data: false,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: false,
      contains_security: false,
      contains_financial_data: false,
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // 14. CUSTOMER BUSINESS DATA
  if (name.includes('customer') || name.includes('product') || name.includes('order') || name.includes('crm_') || name.includes('sales_') || name.includes('inventory') || name.includes('campaign') || name.includes('help_live_chat')) {
    return {
      classification: 'CUSTOMER_BUSINESS_DATA',
      ownership: 'tenant',
      source_of_truth: true,
      derived_or_cache: false,
      tenant_scope: 'organization',
      contains_business_data: true,
      contains_identity: false,
      contains_configuration: false,
      contains_audit: false,
      contains_security: false,
      contains_financial_data: false,
      safe_to_reset: true,
      reset_strategy: 'DELETE'
    };
  }

  // Default UNKNOWN
  return {
    classification: 'UNKNOWN',
    ownership: 'unknown',
    source_of_truth: false,
    derived_or_cache: false,
    tenant_scope: 'unknown',
    contains_business_data: false,
    contains_identity: false,
    contains_configuration: false,
    contains_audit: false,
    contains_security: false,
    contains_financial_data: false,
    safe_to_reset: false,
    reset_strategy: 'NO_OP'
  };
}

async function processTable(table, definitions) {
  let rowCount = 0;
  try {
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    if (countRes.ok) {
      const contentRange = countRes.headers.get('content-range');
      if (contentRange) {
        rowCount = parseInt(contentRange.split('/')[1] || '0', 10);
      } else {
        const data = await countRes.json();
        rowCount = data.length;
      }
    }
  } catch (err) {}

  const def = definitions[table] || {};
  const props = def.properties || {};
  const sampleCols = Object.keys(props);
  const meta = classifyTable(table, sampleCols);

  return {
    table: table,
    row_count: rowCount,
    ...meta
  };
}

async function generateInventory() {
  console.log('Fetching database schema spec...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const spec = await res.json();
  const definitions = spec.definitions || {};
  const tableNames = Object.keys(definitions).sort();
  console.log(`Found ${tableNames.length} tables in PostgREST schema. Fetching row counts in parallel batches...`);

  const BATCH_SIZE = 25;
  const inventory = [];

  for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
    const batch = tableNames.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(t => processTable(t, definitions)));
    inventory.push(...batchResults);
    process.stdout.write(`Processed ${inventory.length}/${tableNames.length} tables...\r`);
  }

  console.log('\nDone processing all tables!');

  const outPath = '/tmp/zega_pre_reset_inventory.json';
  fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2));
  console.log(`Successfully written pre-reset inventory for ${inventory.length} tables to ${outPath}`);
}

generateInventory().catch(console.error);
