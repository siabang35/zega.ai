import React, { useState } from 'react';
import { Filter, X, Check, RotateCcw, ShieldAlert, Server, Layers, Globe } from 'lucide-react';

interface SecurityFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SecurityFilters) => void;
}

export interface SecurityFilters {
  severities: string[];
  categories: string[];
  environment: string;
  mitigationStatus: string;
  location: string;
}

export function SecurityFilterModal({ isOpen, onClose, onApplyFilters }: SecurityFilterModalProps) {
  const [filters, setFilters] = useState<SecurityFilters>({
    severities: ['high', 'medium', 'low'],
    categories: ['unauth', 'malware', 'exfil', 'cred'],
    environment: 'all',
    mitigationStatus: 'all',
    location: 'all',
  });

  if (!isOpen) return null;

  const toggleSeverity = (sev: string) => {
    setFilters((prev) => ({
      ...prev,
      severities: prev.severities.includes(sev)
        ? prev.severities.filter((s) => s !== sev)
        : [...prev.severities, sev],
    }));
  };

  const toggleCategory = (cat: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleReset = () => {
    setFilters({
      severities: ['high', 'medium', 'low'],
      categories: ['unauth', 'malware', 'exfil', 'cred'],
      environment: 'all',
      mitigationStatus: 'all',
      location: 'all',
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Security Telemetry Filters</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Refine live threat telemetry & anomaly events</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 text-xs font-bold">
          {/* 1. SEVERITY LEVEL */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-rose-500" /> Event Severity Level
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: 'critical', label: 'Critical', color: 'bg-purple-600' },
                { id: 'high', label: 'High', color: 'bg-rose-500' },
                { id: 'medium', label: 'Medium', color: 'bg-amber-500' },
                { id: 'low', label: 'Low', color: 'bg-blue-500' },
              ].map((sev) => {
                const isSelected = filters.severities.includes(sev.id);
                return (
                  <button
                    key={sev.id}
                    onClick={() => toggleSeverity(sev.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${sev.color}`} />
                    <span>{sev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. THREAT CATEGORY */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-500" /> Threat Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'unauth', label: 'Unauthorized Access' },
                { id: 'malware', label: 'Malware & Payload' },
                { id: 'exfil', label: 'Data Exfiltration' },
                { id: 'cred', label: 'Credential Stuffing' },
                { id: 'lateral', label: 'Lateral Movement' },
                { id: 'ddos', label: 'DDoS & Rate Limit' },
              ].map((cat) => {
                const isSelected = filters.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`py-2 px-3 rounded-xl border text-left text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <Check size={13} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. ENVIRONMENT TARGET */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Server size={13} className="text-emerald-500" /> Target Environment
            </label>
            <select
              value={filters.environment}
              onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Enterprise Environments</option>
              <option value="prod_api">Production API Gateway</option>
              <option value="solana_gateway">Solana Pay Gateway</option>
              <option value="auth_vault">Auth & Identity Vault</option>
              <option value="qdrant_vector">Qdrant Vector DB Cluster</option>
            </select>
          </div>

          {/* 4. GEOGRAPHIC IP LOCATION */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe size={13} className="text-blue-500" /> Origin Location Filter
            </label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Geographic Origins</option>
              <option value="US">🇺🇸 United States (High Density)</option>
              <option value="SG">🇸🇬 Singapore</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="ID">🇮🇩 Indonesia</option>
              <option value="BR">🇧🇷 Brazil</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
            >
              Apply Telemetry Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
