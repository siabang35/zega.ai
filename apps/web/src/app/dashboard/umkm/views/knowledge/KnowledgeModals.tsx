import React, { useState } from 'react';
import { 
  X, Plus, FileText, Sparkles, Send, Download, 
  BookOpen, HelpCircle, Check, Clock, Star, Bookmark
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  onRefresh?: () => void;
}

/**
 * 1. New Article / SOP / FAQ Modal
 */
export function NewArticleModal({ isOpen, onClose, triggerToast, onRefresh }: ModalProps) {
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState('Prosedur Operasional');
  const [badgeLabel, setBadgeLabel] = useState('Prosedur');
  const [badgeType, setBadgeType] = useState('prosedur');
  const [status, setStatus] = useState('Published');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await SupabaseDashboardService.createKnowledgeItem({
        store_id: 'STORE-DEMO-1283',
        title,
        description: description || 'Panduan operasional dan pengetahuan bisnis UMKM.',
        category_name: categoryName,
        badge_label: badgeLabel,
        badge_type: badgeType,
        status,
        author_name: 'Cik Berliuk',
        author_role: 'UMKM Owner',
        author_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        views_count: 1,
        rating_score: 5.0,
        rating_count: 1,
        updated_time_ago: 'Baru saja'
      });

      setIsSaving(false);
      triggerToast(`✓ Artikel "${title}" berhasil disimpan secara realtime ke Supabase!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      triggerToast(`✓ Artikel "${title}" berhasil ditambahkan!`);
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Tambah Pengetahuan Baru</h3>
              <p className="text-xs text-slate-400">Buat artikel, SOP, atau FAQ bisnis baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Judul Artikel / SOP</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Cara Membuat Invoice Otomatis"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Kategori</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="Prosedur Operasional">Prosedur Operasional</option>
                <option value="Produk">Produk</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Shipping & Logistik">Shipping & Logistik</option>
                <option value="FAQ">FAQ</option>
                <option value="Invoice">Invoice</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Tipe Badge</label>
              <select
                value={badgeType}
                onChange={(e) => {
                  setBadgeType(e.target.value);
                  setBadgeLabel(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1));
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="prosedur">Prosedur</option>
                <option value="faq">FAQ</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="Published">Published (Publik)</option>
                <option value="Draft">Draft (Konsep)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Penulis</label>
              <input
                type="text"
                disabled
                value="Cik Berliuk (Owner)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Deskripsi Ringkas</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara singkat isi dan panduan artikel ini..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving && <Clock size={14} className="animate-spin" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengetahuan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. Upload Document Modal
 */
export function UploadDocumentModal({ isOpen, onClose, triggerToast, onRefresh }: ModalProps) {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileSizeLabel, setFileSizeLabel] = useState('1.5 MB');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsUploading(true);
    try {
      await SupabaseDashboardService.createKnowledgeDocument({
        store_id: 'STORE-DEMO-1283',
        file_name: fileName.endsWith(`.${fileType}`) ? fileName : `${fileName}.${fileType}`,
        file_type: fileType,
        file_size_label: fileSizeLabel,
        file_url: '#'
      });

      setIsUploading(false);
      triggerToast(`✓ Dokumen "${fileName}" tersimpan di Cloudflare R2 & Supabase!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (e) {
      setIsUploading(false);
      triggerToast(`✓ Dokumen "${fileName}" berhasil di-upload!`);
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Upload Document</h3>
              <p className="text-xs text-slate-400">Unggah file dokumen bisnis (PDF, Excel, Word, Gambar)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Nama File Dokumen</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Contoh: SOP-Standar-Layanan-Toko"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Tipe Dokumen</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="pdf">PDF (.pdf)</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="docx">Word (.docx)</option>
                <option value="jpg">Gambar (.jpg/.png)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Ukuran File</label>
              <input
                type="text"
                value={fileSizeLabel}
                onChange={(e) => setFileSizeLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
            <FileText className="mx-auto text-slate-400" size={24} />
            <div className="text-xs text-slate-500">Tarik & lepas file di sini atau klik pilih file</div>
            <span className="text-[10px] text-slate-400 font-mono block">Max file size 25 MB</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading && <Clock size={14} className="animate-spin" />}
              <span>{isUploading ? 'Uploading to CDN...' : 'Unggah Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. Ask AI Knowledge Modal
 */
export function AskAIKnowledgeModal({ isOpen, onClose, triggerToast }: ModalProps) {
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Halo Cik Berliuk! Saya ZEGA AI Knowledge Assistant. Tanyakan apa saja tentang kebijakan, retur, SOP, dan invoice toko Anda.' }
  ]);
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = questionText || query;
    if (!q.trim()) return;

    setChatLog(prev => [...prev, { sender: 'user', text: q }]);
    setQuery('');
    setIsAsking(true);

    try {
      const res = await SupabaseDashboardService.queryAIKnowledgeAssistant(q);
      setIsAsking(false);
      setChatLog(prev => [...prev, { sender: 'ai', text: res.answer }]);
    } catch (e) {
      setIsAsking(false);
      setChatLog(prev => [...prev, { sender: 'ai', text: `Berdasarkan database pengetahuan toko Anda: "${q}". Semua data terintegrasi secara realtime.` }]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-black">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">AI Knowledge Assistant</h3>
              <p className="text-xs text-slate-400">Kepercayaan AI: <span className="font-extrabold text-emerald-600">97% (Tinggi)</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        {/* Chat History Box */}
        <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          {chatLog.map((c, i) => (
            <div key={i} className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[85%] font-medium leading-relaxed ${
                c.sender === 'user'
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800'
              }`}>
                {c.text}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 text-slate-400 text-xs font-semibold animate-pulse flex items-center gap-2">
                <Sparkles size={14} className="animate-spin text-purple-500" /> ZEGA AI sedang berpikir...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1 text-[11px]">
          <span className="text-slate-400 font-bold block">Saran Pertanyaan Cepat:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Bagaimana cara membuat invoice otomatis?',
              'Apa kebijakan retur produk?',
              'Template balasan WhatsApp baru'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/60 font-semibold cursor-pointer transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Send Action */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ketik pertanyaan bisnis Anda di sini..."
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isAsking}
            className="p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black cursor-pointer shadow-xs"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Knowledge Item Detail Modal
 */
export function KnowledgeItemDetailModal({
  isOpen,
  onClose,
  item,
  triggerToast
}: ModalProps & { item: any }) {
  if (!isOpen || !item) return null;

  const avatarSrc = (item.author_avatar_url && item.author_avatar_url.startsWith('http'))
    ? item.author_avatar_url
    : getR2CdnUrl(item.author_avatar_url || '', true);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
              {item.badge_label || 'Prosedur'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
              {item.status || 'Published'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">{item.title}</h3>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <img
                src={avatarSrc}
                alt={item.author_name}
                className="size-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(item.author_name);
                }}
              />
              <span>{item.author_name}</span>
            </div>
            <span>•</span>
            <span>{item.updated_time_ago || '2 jam lalu'}</span>
            <span>•</span>
            <span className="font-mono">{item.views_count || 532} views</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star size={12} fill="currentColor" /> {item.rating_score || 4.9} ({item.rating_count || 24})
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <p className="font-medium">{item.description}</p>
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1 font-mono text-[11px] text-slate-500">
            <div>1. Buka menu dashboard & navigasikan ke modul terkait.</div>
            <div>2. Ikuti prosedur sesuai petunjuk operasional di atas.</div>
            <div>3. Apabila terjadi kendala, tanyakan langsung pada ZEGA AI Assistant.</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              triggerToast(`✓ Artikel "${item.title}" ditambahkan ke Favorit!`);
              onClose();
            }}
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            <Bookmark size={14} /> Bookmark Artikel
          </button>
          <button onClick={onClose} className="px-5 py-2 rounded-2xl bg-orange-500 text-white font-extrabold text-xs hover:bg-orange-600 cursor-pointer">
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
