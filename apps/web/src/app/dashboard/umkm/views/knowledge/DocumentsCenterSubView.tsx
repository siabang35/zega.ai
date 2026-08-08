import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, UploadCloud, Search, ExternalLink, FileSpreadsheet, FileCode, Image as ImageIcon } from 'lucide-react';

interface DocumentsCenterSubViewProps {
  documents: any[];
  onNavigateBack: () => void;
  onOpenUploadModal: () => void;
  triggerToast: (msg: string) => void;
}

export function DocumentsCenterSubView({
  documents,
  onNavigateBack,
  onOpenUploadModal,
  triggerToast
}: DocumentsCenterSubViewProps) {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('All');

  const getFormatIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (t.includes('xls') || t.includes('xlsx')) return <FileSpreadsheet size={20} className="text-emerald-500" />;
    if (t.includes('doc') || t.includes('docx')) return <FileCode size={20} className="text-blue-500" />;
    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return <ImageIcon size={20} className="text-purple-500" />;
    return <FileText size={20} className="text-orange-500" />;
  };

  const docList = Array.isArray(documents) ? documents : [];
  const filteredDocs = docList.filter(d => {
    const matchesSearch = d.file_name?.toLowerCase().includes(search.toLowerCase());
    if (formatFilter === 'All') return matchesSearch;
    return matchesSearch && d.file_type?.toLowerCase().includes(formatFilter.toLowerCase());
  });

  const handleDownload = (doc: any) => {
    triggerToast(`Mengunduh "${doc.file_name}" dari Cloudflare R2 CDN...`);
    if (doc.file_url && doc.file_url !== '#') {
      window.open(doc.file_url, '_blank');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            <span>Pusat Dokumen & SOP File</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Semua berkas operasional tersimpan aman di Cloudflare R2 CDN dengan enkripsi SSL.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari dokumen..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-2xl cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <UploadCloud size={14} /> <span>+ Unggah Dokumen</span>
          </button>
        </div>
      </div>

      {/* Format Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'PDF', 'XLSX', 'DOCX', 'JPG'].map(fmt => (
          <button
            key={fmt}
            onClick={() => setFormatFilter(fmt)}
            className={`px-3.5 py-1.5 rounded-2xl font-extrabold cursor-pointer transition-all ${
              formatFilter === fmt
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {fmt === 'All' ? 'Semua Format' : fmt}
          </button>
        ))}
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc, idx) => (
          <div
            key={doc.id || idx}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs hover:border-orange-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  {getFormatIcon(doc.file_type)}
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold uppercase text-slate-500">
                  {doc.file_size_label || '1.2 MB'}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-3 truncate" title={doc.file_name}>
                {doc.file_name}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                CDN Domain: <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">Cloudflare R2</span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDownload(doc)}
                className="w-full py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/60 font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> <span>Unduh via CDN</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
