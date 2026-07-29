export type DashboardTab = 'overview' | 'roster' | 'sandbox' | 'mission_control' | 'integrations' | 'settings';

export interface AgentMetric {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'idle' | 'maintenance';
  tasksThisWeek: number;
  openTickets: number;
  successRate: number; // Percentage, e.g. 95
  avgResolutionDays: number;
  lastActivity: string;
}

export interface ConnectorTool {
  id: string;
  name: string;
  description: string;
  iconName: string;
  connected: boolean;
  color: string;
}

export interface WorkflowNode {
  id: string;
  title: string;
  type: 'trigger' | 'action' | 'logic' | 'integration' | 'end';
  icon: string;
  x: number;
  y: number;
  status?: 'success' | 'running' | 'idle' | 'warning';
  subText?: string;
  model?: string;
  temperature?: number;
  prompt?: string;
}

export interface MissionAgentNode {
  id: string;
  name: string;
  role: string;
  icon: string;
  tasksCount: number;
  progress: number;
  status: string;
  color: string;
}
