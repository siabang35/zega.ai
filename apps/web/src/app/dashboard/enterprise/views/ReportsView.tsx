import React, { useState } from 'react';
import { ScheduledReportsView } from './ScheduledReportsView';
import { Download, Plus, ChevronDown, Upload, X } from 'lucide-react';

interface ReportsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function ReportsView({ onTriggerToast }: ReportsViewProps) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // New Schedule Form State
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState('Audit Logs');
  const [scheduleFreq, setScheduleFreq] = useState('Daily (08:00 WIB)');
  const [scheduleFormat, setScheduleFormat] = useState('PDF');
  const [scheduleRecipients, setScheduleRecipients] = useState('execs@zenith.co.id');

  const triggerToast = (msg: string) => {
    if (onTriggerToast) onTriggerToast(msg);
  };

  const handleExport = (format: string) => {
    setShowExportDropdown(false);
    triggerToast(`📥 Memproses ekspor laporan (${format}) via Cloudflare R2 CDN...`);
    setTimeout(() => {
      triggerToast(`✓ Export ${format} berhasil diunduh!`);
    }, 1500);
  };

  const handleImportSchedule = () => {
    setImportJsonText(`{\n  "report_name": "Quarterly PCI-DSS Compliance Summary",\n  "report_type": "Security",\n  "schedule_frequency": "Monthly",\n  "format": "Encrypted PDF",\n  "recipients": ["compliance@zegaai.com", "security@zegaai.com"],\n  "filters": {\n    "severity": ["High", "Critical"],\n    "categories": ["Authentication", "Data Access"]\n  }\n}`);
    setImportError(null);
    setShowImportModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      setImportError(null);
      triggerToast(`📄 File configuration "${file.name}" loaded!`);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    try {
      if (!importJsonText.trim()) {
        setImportError('Silakan masukkan isi JSON / YAML konfigurasi laporan.');
        return;
      }
      const parsed = JSON.parse(importJsonText);
      if (!parsed.report_name && !parsed.name) {
        setImportError('Konfigurasi valid JSON harus memiliki field "report_name" atau "name".');
        return;
      }
      const importedName = parsed.report_name || parsed.name;
      setShowImportModal(false);
      triggerToast(`✨ Berhasil mengimpor jadwal laporan "${importedName}"!`);
    } catch (err: any) {
      setImportError(`Syntax error pada JSON: ${err.message}`);
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName) return;
    setShowNewScheduleModal(false);
    setScheduleName('');
    triggerToast(`✨ Scheduled report "${scheduleName}" berhasil dibuat!`);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER SECTION MATCHING EXECUTIVE SPECIFICATION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor, analyze, and automate scheduled report generation across your enterprise.
          </p>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowNewScheduleModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>New Scheduled Report</span>
          </button>

          <button
            onClick={handleImportSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Upload size={14} />
            <span>Import Schedule</span>
          </button>
        </div>
      </div>

      {/* SCHEDULED REPORTS VIEW CONTENT */}
      <ScheduledReportsView
        onTriggerToast={onTriggerToast}
        onOpenNewModal={() => setShowNewScheduleModal(true)}
      />

      {/* IMPORT SCHEDULE MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Import Report Schedule Configuration</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">Upload File (.json / .yaml)</label>
                <label className="text-indigo-600 hover:underline cursor-pointer font-bold flex items-center gap-1">
                  <span>Browse File</span>
                  <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <textarea
                  rows={8}
                  value={importJsonText}
                  onChange={(e) => { setImportJsonText(e.target.value); setImportError(null); }}
                  placeholder="Paste JSON configuration payload here..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed focus:outline-none"
                />
              </div>

              {importError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                  ⚠️ {importError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setImportJsonText(`{\n  "report_name": "Weekly Security Vulnerability Digest",\n  "report_type": "Security",\n  "schedule_frequency": "Weekly",\n  "format": "PDF",\n  "recipients": ["ciso@zegaai.com"]\n}`);
                  setImportError(null);
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Load Sample JSON
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold">Cancel</button>
                <button type="button" onClick={handleExecuteImport} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs">Import & Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW SCHEDULE MODAL */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateSchedule} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">New Scheduled Report</h3>
              <button type="button" onClick={() => setShowNewScheduleModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Report Name</label>
                <input type="text" placeholder="e.g. Daily System Audit Summary" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Report Type</label>
                <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <option>Audit Logs</option><option>Security</option><option>Cost Intelligence</option><option>AI Agents</option><option>Workflow Studio</option><option>MCP Hub</option><option>Integrations</option><option>Custom</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Frequency</label>
                  <select value={scheduleFreq} onChange={(e) => setScheduleFreq(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <option>Daily 09:00 AM WIB</option><option>Weekly Monday, 08:00</option><option>Monthly Day 1, 10:00 AM</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Format</label>
                  <select value={scheduleFormat} onChange={(e) => setScheduleFormat(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <option>PDF</option><option>Encrypted PDF</option><option>CSV / Excel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Recipient Emails</label>
                <input type="text" placeholder="execs@zenith.co.id, wildan@zenith.co.id" value={scheduleRecipients} onChange={(e) => setScheduleRecipients(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowNewScheduleModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">Create Schedule</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
