import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  Key,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } }
};

export interface AuditLogEntry {
  id: string;
  time: string;
  user_email: string;
  action: 'Updated' | 'Created' | 'Deleted' | 'Login' | 'Password' | 'MFA Verified' | 'Exported';
  resource: string;
  resource_type: string;
  details: string;
  ip_address: string;
  environment: string;
}

interface AuditLogsTabProps {
  logs?: AuditLogEntry[];
  onTriggerToast?: (msg: string) => void;
}

export function AuditLogsTab({ logs: propLogs, onTriggerToast }: AuditLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All Users');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [envFilter, setEnvFilter] = useState('All Environments');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const defaultLogs: AuditLogEntry[] = [
    {
      id: 'audit_1',
      time: 'May 27, 2025 14:32:15',
      user_email: 'cole.cox@zegaai.com',
      action: 'Updated',
      resource: 'API Key (zga_live_••••)',
      resource_type: 'API Key',
      details: 'Changed permissions',
      ip_address: '103.12.45.67',
      environment: 'Production'
    },
    {
      id: 'audit_2',
      time: 'May 27, 2025 14:28:12',
      user_email: 'sarah.admin@zegaai.com',
      action: 'Created',
      resource: 'Webhook Endpoint',
      resource_type: 'Webhook',
      details: 'Added new endpoint',
      ip_address: '185.34.21.123',
      environment: 'Production'
    },
    {
      id: 'audit_3',
      time: 'May 27, 2025 14:15:33',
      user_email: 'wildan@zegaai.com',
      action: 'Deleted',
      resource: 'Agent ID: ag_315401',
      resource_type: 'Agent',
      details: 'Removed agent',
      ip_address: '103.12.45.67',
      environment: 'Production'
    },
    {
      id: 'audit_4',
      time: 'May 27, 2025 14:10:11',
      user_email: 'system',
      action: 'Login',
      resource: 'User Session',
      resource_type: 'Auth',
      details: 'Successful login',
      ip_address: '103.12.45.67',
      environment: 'Production'
    },
    {
      id: 'audit_5',
      time: 'May 27, 2025 14:14:57',
      user_email: 'randy.dev@zegaai.com',
      action: 'Updated',
      resource: 'Workflow (wf_578901)',
      resource_type: 'Workflow',
      details: 'Updated configuration',
      ip_address: '203.0.113.45',
      environment: 'Development'
    },
    {
      id: 'audit_6',
      time: 'May 27, 2025 14:13:22',
      user_email: 'api-service',
      action: 'Password',
      resource: 'Knowledge Base',
      resource_type: 'Data',
      details: 'Document search',
      ip_address: '54.239.28.45',
      environment: 'Production'
    },
    {
      id: 'audit_7',
      time: 'May 27, 2025 14:10:41',
      user_email: 'mfa-system',
      action: 'MFA Verified',
      resource: 'User Session',
      resource_type: 'Auth',
      details: 'MFA challenge passed',
      ip_address: '103.12.45.67',
      environment: 'Production'
    }
  ];

  const logList = propLogs && propLogs.length > 0 ? propLogs : defaultLogs;

  const filteredLogs = logList.filter((l) => {
    const matchesSearch =
      l.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip_address.includes(searchTerm);
    const matchesUser = userFilter === 'All Users' || l.user_email === userFilter;
    const matchesAction = actionFilter === 'All Actions' || l.action === actionFilter;
    const matchesEnv = envFilter === 'All Environments' || l.environment === envFilter;
    return matchesSearch && matchesUser && matchesAction && matchesEnv;
  });

  return (
    <div className="space-y-5">
      {/* 5 TOP KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Events (24h) */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Events (24h)</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">25,431</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 20.1% vs last 7d
          </span>
        </div>

        {/* User Activities */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">User Activities</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">18,245</div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">71.7%</span>
        </div>

        {/* Config Changes */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Config Changes</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">4,521</div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">17.8%</span>
        </div>

        {/* Access Events */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Access Events</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">2,987</div>
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">11.7%</span>
        </div>

        {/* Security Events */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Security Events</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">1,678</div>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> -8.6%
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, action, IP..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 text-xs"
              />
            </div>

            {/* User Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Users">All Users</option>
              <option value="cole.cox@zegaai.com">cole.cox@zegaai.com</option>
              <option value="sarah.admin@zegaai.com">sarah.admin@zegaai.com</option>
              <option value="wildan@zegaai.com">wildan@zegaai.com</option>
              <option value="system">system</option>
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Actions">All Actions</option>
              <option value="Updated">Updated</option>
              <option value="Created">Created</option>
              <option value="Deleted">Deleted</option>
              <option value="Login">Login</option>
              <option value="MFA Verified">MFA Verified</option>
            </select>

            {/* Environment Filter */}
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Environments">All Environments</option>
              <option value="Production">Production</option>
              <option value="Development">Development</option>
            </select>
          </div>

          <button
            onClick={() => onTriggerToast?.('📊 Exporting Audit Trail CSV...')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <FileSpreadsheet size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">USER</th>
                <th className="py-2.5 px-3">ACTION</th>
                <th className="py-2.5 px-3">RESOURCE</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">DETAILS</th>
                <th className="py-2.5 px-3">IP ADDRESS</th>
                <th className="py-2.5 px-3">ENVIRONMENT</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{l.time}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{l.user_email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                        l.action === 'Created'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                          : l.action === 'Updated'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'
                          : l.action === 'Deleted'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                          : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60'
                      }`}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{l.resource}</td>
                  <td className="py-3 px-3 text-slate-500">{l.resource_type}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{l.details}</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{l.ip_address}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[9.5px] ${
                        l.environment === 'Production'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'
                      }`}
                    >
                      {l.environment}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-medium">
          <div>Showing 1 to 10 of 25,431 events</div>

          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronLeft size={13} />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs">1</span>
            <span className="px-2 py-1 cursor-pointer">2</span>
            <span className="px-2 py-1 cursor-pointer">3</span>
            <span>...</span>
            <span className="px-2 py-1 cursor-pointer">2,543</span>
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="font-semibold text-slate-700 dark:text-slate-300">
            <span>10 / page</span>
          </div>
        </div>
      </div>

      {/* AUDIT LOG DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Audit Trail Record</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLog.resource}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 font-mono text-xs p-3 bg-slate-950 rounded-xl text-emerald-400">
              <div><span className="text-slate-500">User:</span> {selectedLog.user_email}</div>
              <div><span className="text-slate-500">Action:</span> {selectedLog.action}</div>
              <div><span className="text-slate-500">Type:</span> {selectedLog.resource_type}</div>
              <div><span className="text-slate-500">Details:</span> {selectedLog.details}</div>
              <div><span className="text-slate-500">IP:</span> {selectedLog.ip_address}</div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
