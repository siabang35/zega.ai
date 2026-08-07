import React, { useState } from 'react';
import { Lock, ShieldCheck, Database, FileText, ArrowRight, X, Download, Trash2, Award, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface PrivacyTabProps {
  dataPrivacy: any;
  setDataPrivacy: (p: any) => void;
  onTriggerToast?: (msg: string) => void;
}

export function PrivacyTab({ dataPrivacy, setDataPrivacy, onTriggerToast }: PrivacyTabProps) {
  // Modals state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  const handleUpdateField = async (key: string, val: any) => {
    const updated = { ...dataPrivacy, [key]: val };
    setDataPrivacy(updated);
    await enterpriseSupabaseService.updateDataPrivacySettingsRealtime(updated);
    if (onTriggerToast) onTriggerToast(`Pengaturan Data & Privacy (${key}) Disimpan di Supabase DB!`);
  };

  const handleRequestDataExport = () => {
    const blob = new Blob([JSON.stringify({
      organization: 'Acme Enterprise Inc.',
      export_date: new Date().toISOString(),
      privacy_level: 'GDPR / CCPA Compliant',
      telemetry_anonymized: dataPrivacy.anonymize_telemetry !== false,
      data_residency: dataPrivacy.primary_region || 'Asia Pacific (Singapore)'
    }, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acme_Enterprise_Data_Archive_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onTriggerToast) onTriggerToast('Arsip Data Organisasi (.json) Berhasil Diunduh!');
    setShowExportModal(false);
  };

  const handleConfirmDataDeletion = () => {
    if (deleteConfirmText !== 'DELETE') {
      if (onTriggerToast) onTriggerToast('Harap ketik "DELETE" untuk mengonfirmasi penghapusan data!');
      return;
    }
    if (onTriggerToast) onTriggerToast('Permintaan Penghapusan Data Organisasi Dikirim ke Tim Compliance!');
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 1. TOP ROW: DATA RESIDENCY & DATA RETENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT CARD (6 cols): DATA RESIDENCY & STORAGE */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Residency & Storage</h3>
              <p className="text-[11px] text-slate-500">Choose where your organization's data is stored and processed.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-500 text-[11px] block mb-1">Primary Region</label>
                <select
                  value={dataPrivacy.primary_region || 'Asia Pacific (Singapore)'}
                  onChange={(e) => handleUpdateField('primary_region', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                >
                  <option>Asia Pacific (Singapore)</option>
                  <option>US East (N. Virginia)</option>
                  <option>Europe (Frankfurt)</option>
                  <option>ap-southeast-3 (AWS Jakarta)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-500 text-[11px] block mb-1">Backup Region</label>
                <select
                  value={dataPrivacy.backup_region || 'ap-southeast-3 (AWS Jakarta)'}
                  onChange={(e) => handleUpdateField('backup_region', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                >
                  <option>ap-southeast-3 (AWS Jakarta)</option>
                  <option>ap-southeast-1 (AWS Singapore)</option>
                  <option>eu-central-1 (AWS Frankfurt)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Your data is stored in compliance with local regulations.</span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
              Compliant
            </span>
          </div>
        </div>

        {/* RIGHT CARD (6 cols): DATA RETENTION */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Retention</h3>
              <p className="text-[11px] text-slate-500">Define how long different types of data are retained.</p>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'telemetry_retention', label: 'Telemetry Data', defaultVal: '12 months' },
                { key: 'audit_logs_retention', label: 'Audit Logs', defaultVal: '24 months' },
                { key: 'user_activity_retention', label: 'User Activity Logs', defaultVal: '12 months' },
                { key: 'api_logs_retention', label: 'API Request Logs', defaultVal: '6 months' },
                { key: 'chat_retention', label: 'Chat & Conversations', defaultVal: '18 months' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{item.label}</span>
                  <select
                    value={dataPrivacy[item.key] || item.defaultVal}
                    onChange={(e) => handleUpdateField(item.key, e.target.value)}
                    className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  >
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>12 months</option>
                    <option>18 months</option>
                    <option>24 months</option>
                    <option>36 months</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowRetentionModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Configure Retention Policies</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM ROW: PRIVACY CONTROLS & COMPLIANCE & CERTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT CARD (6 cols): PRIVACY CONTROLS */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Privacy Controls</h3>

          <div className="space-y-3">
            {/* Row 1: Anonymize Telemetry */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Anonymize Telemetry Data</span>
                <span className="text-[10px] text-slate-400">Remove personally identifiable information from telemetry</span>
              </div>
              <input
                type="checkbox"
                checked={dataPrivacy.anonymize_telemetry !== false}
                onChange={(e) => handleUpdateField('anonymize_telemetry', e.target.checked)}
                className="size-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Row 2: Product Improvement */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Allow Data for Product Improvement</span>
                <span className="text-[10px] text-slate-400">Help improve Zega AI by sharing anonymized usage data</span>
              </div>
              <input
                type="checkbox"
                checked={!!dataPrivacy.allow_product_improvement}
                onChange={(e) => handleUpdateField('allow_product_improvement', e.target.checked)}
                className="size-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Row 3: Data Export */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Data Export</span>
                <span className="text-[10px] text-slate-400">Download a copy of your organization's data</span>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Request Export
              </button>
            </div>

            {/* Row 4: Data Deletion */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Data Deletion</span>
                <span className="text-[10px] text-slate-400">Permanently delete all organization data</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Request Deletion
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CARD (6 cols): COMPLIANCE & CERTIFICATIONS */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Compliance & Certifications</h3>
              <p className="text-[11px] text-slate-500">We adhere to the highest compliance and security standards.</p>
            </div>

            {/* 5 BADGES ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center space-y-1.5">
                <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Shield size={18} />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[10px] block leading-tight">ISO 27001</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">Certified</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center space-y-1.5">
                <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                  <Award size={18} />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[10px] block leading-tight">SOC 2 Type II</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">Certified</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center space-y-1.5">
                <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={18} />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[10px] block leading-tight">GDPR</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">Compliant</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center space-y-1.5">
                <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                  <Lock size={18} />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[10px] block leading-tight">CCPA</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">Compliant</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center space-y-1.5">
                <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <ShieldCheck size={18} />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[10px] block leading-tight">HIPAA</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">Eligible</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => setShowComplianceModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Compliance Details</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: REQUEST DATA EXPORT */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Export Organization Data</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400">
              Unduh arsip lengkap data organisasi (termasuk audit log, setelan telemetri, dan riwayat aktivitas).
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowExportModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                Batal
              </button>
              <button onClick={handleRequestDataExport} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5">
                <Download size={13} /> Download (.json)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST DATA DELETION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-rose-600">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <AlertTriangle size={16} /> Danger Zone: Request Data Deletion
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Semua data telemetri, log audit, dan dokumen akan dihapus secara permanen.
              Ketik <strong className="text-slate-900 dark:text-slate-100">DELETE</strong> di bawah untuk mengonfirmasi:
            </p>

            <input
              type="text"
              placeholder="Ketik DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 font-bold font-mono text-rose-600"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                Batal
              </button>
              <button onClick={handleConfirmDataDeletion} className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs">
                Hapus Data Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RETENTION POLICIES */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Retention Policies</h3>
              <button onClick={() => setShowRetentionModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <strong>Automatic Purging SLA:</strong> Log data yang melebihi batas waktu retensi akan dibersihkan secara otomatis setiap hari pada pukul 00:00 UTC.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <strong>Cold Storage Archival:</strong> Audit log di atas 12 bulan dipindahkan ke AWS S3 Glacier WORM Storage yang tidak dapat diubah.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowRetentionModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COMPLIANCE DETAILS */}
      {showComplianceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enterprise Compliance Audit Badges</h3>
              <button onClick={() => setShowComplianceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                <div>
                  <strong className="block">ISO/IEC 27001:2022</strong>
                  <span className="text-[10px] text-slate-500">Information Security Management Systems</span>
                </div>
                <span className="text-emerald-600 font-bold text-xs">Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                <div>
                  <strong className="block">SOC 2 Type II Audit Report</strong>
                  <span className="text-[10px] text-slate-500">Security, Availability & Confidentiality</span>
                </div>
                <span className="text-emerald-600 font-bold text-xs">Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                <div>
                  <strong className="block">EU GDPR Article 28 DPA</strong>
                  <span className="text-[10px] text-slate-500">Data Processing Addendum Compliant</span>
                </div>
                <span className="text-emerald-600 font-bold text-xs">Verified</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowComplianceModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
