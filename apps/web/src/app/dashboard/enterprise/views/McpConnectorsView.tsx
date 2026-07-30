import React from 'react';
import { Database, Zap } from 'lucide-react';
import { ZeroClawTerminalView } from './ZeroClawTerminalView';

interface McpConnectorsViewProps {
  onTriggerToast: (msg: string) => void;
}

export function McpConnectorsView({ onTriggerToast }: McpConnectorsViewProps) {
  return (
    <div className="space-y-6">
      {/* ZeroClaw Dedicated Solana Agent Terminal */}
      <ZeroClawTerminalView onTriggerToast={onTriggerToast} />

      {/* Standalone MCP Server Registry */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Database size={16} className="text-indigo-600 dark:text-indigo-400" />
              Model Context Protocol (MCP) Server Registry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Konektor standar API untuk integrasi basis data enterprise, alat internal & SaaS.
            </p>
          </div>
          <button
            onClick={() => onTriggerToast('Tambah Server MCP')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
          >
            + Register MCP Server
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'ZeroClaw Solana MCP Node', tools: '🦀 Rust Native', status: 'Active (T1 Keyless)' },
            { name: 'Postgres MCP Server', tools: '8 Tools', status: 'Connected' },
            { name: 'Salesforce CRM MCP', tools: '12 Tools', status: 'Connected' },
            { name: 'GitHub Enterprise MCP', tools: '5 Tools', status: 'Connected' },
            { name: 'Slack Bot MCP', tools: '4 Tools', status: 'Connected' },
            { name: 'Stripe M2M MCP', tools: '10 Tools', status: 'Connected' },
          ].map((mcp, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border ${
                i === 0
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {i === 0 && <Zap size={12} className="text-emerald-500" />}
                {mcp.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                {mcp.tools} • ● {mcp.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

