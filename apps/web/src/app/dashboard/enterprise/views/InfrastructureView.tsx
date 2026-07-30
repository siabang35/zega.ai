import React, { useState } from 'react';
import { 
  Server, Activity, RefreshCw, ChevronDown, CheckCircle2, 
  AlertTriangle, Globe, Cpu, Database, HardDrive, Network, Users, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';

interface InfrastructureViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function InfrastructureView({ onTriggerToast }: InfrastructureViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');

  const services = [
    { name: 'API Gateway', status: 'Healthy', healthPct: '99.98%', uptime: '30d 12h', latency: '120ms', region: 'us-east-1' },
    { name: 'Vector Database', status: 'Healthy', healthPct: '99.98%', uptime: '30d 12h', latency: '98ms', region: 'ap-southeast-1' },
    { name: 'Redis Cache', status: 'Healthy', healthPct: '99.99%', uptime: '30d 12h', latency: '0.8ms', region: 'us-east-1' },
    { name: 'Supabase DB', status: 'Healthy', healthPct: '99.95%', uptime: '30d 12h', latency: '45ms', region: 'eu-west-1' },
    { name: 'MCP Orchestrator', status: 'Healthy', healthPct: '99.98%', uptime: '30d 12h', latency: '112ms', region: 'ap-southeast-1' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Server className="text-indigo-600 dark:text-indigo-400 size-6" />
            Infrastructure
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor and manage your infrastructure and system resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Region Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Globe size={14} className="text-slate-400" />
            <span>{selectedRegion}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </div>

          {/* Refresh Action */}
          <button 
            onClick={() => onTriggerToast?.('Infrastruktur Diperbarui')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TOP 6 KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: System Health */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">System Health</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">99.98%</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">Healthy</span>
        </div>

        {/* Card 2: Uptime */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Uptime</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">30d 12h 45m</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">No downtime</span>
        </div>

        {/* Card 3: Total Services */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Services</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">42</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">Running</span>
        </div>

        {/* Card 4: Servers */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Servers</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">128</span>
            <span className="text-[10px] font-bold text-emerald-600">+3 vs 7d</span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">Active nodes</span>
        </div>

        {/* Card 5: Regions */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Regions</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">5</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">Active</span>
        </div>

        {/* Card 6: Alerts */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Alerts</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">2</span>
          </div>
          <span className="text-[9.5px] text-amber-600 font-semibold block">Warning</span>
        </div>
      </div>

      {/* MIDDLE SECTION (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3 width): Infrastructure Overview Topology Diagram */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Infrastructure Overview
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Global Mesh Topology</span>
          </div>

          {/* Diagram Container */}
          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 overflow-x-auto min-h-[180px]">
            {/* Step 1: Users */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600">
                <Users size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Users</span>
            </div>

            {/* Connector */}
            <div className="h-0.5 w-8 bg-indigo-300 dark:bg-indigo-700 shrink-0" />

            {/* Step 2: Cloudflare Edge */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600">
                <Globe size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Cloudflare</span>
            </div>

            <div className="h-0.5 w-8 bg-indigo-300 dark:bg-indigo-700 shrink-0" />

            {/* Step 3: Global Load Balancer */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600">
                <Layers size={20} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Load Balancer</span>
              <span className="text-[8px] font-bold text-emerald-600">Healthy</span>
            </div>

            <div className="h-0.5 w-8 bg-indigo-300 dark:bg-indigo-700 shrink-0" />

            {/* Step 4: Regional Clusters */}
            <div className="space-y-1.5 shrink-0">
              {[
                { name: 'us-east-1', location: 'N. Virginia', count: '12 services' },
                { name: 'ap-southeast-1', location: 'Singapore', count: '10 services' },
                { name: 'eu-west-1', location: 'Ireland', count: '8 services' },
                { name: 'ap-northeast-1', location: 'Tokyo', count: '7 services' },
                { name: 'sa-east-1', location: 'São Paulo', count: '5 services' },
              ].map((reg, idx) => (
                <div key={idx} className="flex items-center gap-2 p-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{reg.name}</span>
                  <span className="text-[10px] text-slate-400">{reg.location}</span>
                  <span className="text-[9px] font-mono text-slate-500">{reg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (1/3 width): Resource Usage Gauges */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Resource Usage
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* CPU */}
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-1">
              <div className="relative size-16 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray="32, 100" />
                </svg>
                <span className="absolute font-bold text-xs">32%</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">CPU</span>
              <span className="text-[9px] text-slate-400 font-mono">of 640 vCPU</span>
            </div>

            {/* Memory */}
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-1">
              <div className="relative size-16 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="4" strokeDasharray="58, 100" />
                </svg>
                <span className="absolute font-bold text-xs">58%</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Memory</span>
              <span className="text-[9px] text-slate-400 font-mono">of 1.2 TB</span>
            </div>

            {/* Storage */}
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-1">
              <div className="relative size-16 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="41, 100" />
                </svg>
                <span className="absolute font-bold text-xs">41%</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Storage</span>
              <span className="text-[9px] text-slate-400 font-mono">of 50 TB</span>
            </div>

            {/* Network */}
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-1">
              <div className="relative size-16 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="28, 100" />
                </svg>
                <span className="absolute font-bold text-xs">28%</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Network</span>
              <span className="text-[9px] text-slate-400 font-mono">of 100 Gbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION (2 Columns: Services Status Table & Recent Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3 width): Services Status Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Services Status
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-time health monitoring</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Health</th>
                  <th className="py-2 px-3">Uptime</th>
                  <th className="py-2 px-3">Response Time</th>
                  <th className="py-2 px-3">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {services.map((srv, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{srv.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9.5px]">
                        {srv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                      {srv.healthPct}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {srv.uptime}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {srv.latency}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[10.5px]">
                      {srv.region}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1/3 width): Recent Alerts */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Recent Alerts
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">High memory usage on api-gateway-04</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Warning</span>
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block">2m ago</span>
            </div>

            <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">CPU usage high on worker-db-02</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Warning</span>
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block">12m ago</span>
            </div>

            <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-400">Disk space low on redis-cache-01</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Info</span>
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block">1h ago</span>
            </div>

            <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-400">Network latency increased in eu-west-1</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Info</span>
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block">2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
