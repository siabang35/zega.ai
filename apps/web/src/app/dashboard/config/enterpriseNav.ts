import { 
  Terminal, Cpu, Layers, Database, Link2, CreditCard, Activity, Cpu as Orchestrator, Settings 
} from 'lucide-react';
import { NavItem } from './umkmNav';

export const ENTERPRISE_NAV_ITEMS: NavItem[] = [
  { id: 'console', label: 'Console Overview', icon: Terminal },
  { id: 'sandbox', label: 'Workflow Sandbox', icon: Cpu },
  { id: 'agent_swarms', label: 'Agent Swarms', icon: Layers },
  { id: 'vector_db', label: 'Vector Store (RAG)', icon: Database },
  { id: 'mcp_connectors', label: 'MCP Connectors', icon: Link2 },
  { id: 'm2m_payments', label: 'M2M Payments', icon: CreditCard },
  { id: 'cost_telemetry', label: 'Cost Telemetry', icon: Activity },
  { id: 'zega_orchestrator', label: 'ZEGA Orchestrator', icon: Orchestrator },
  { id: 'settings', label: 'Settings & API Keys', icon: Settings },
];
