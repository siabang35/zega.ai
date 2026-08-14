import React, { useState } from 'react';
import { 
  ArrowLeft, BookOpen, Star, Bookmark, Share2, 
  Download, FileText, CheckCircle2, Clock, 
  BrainCircuit, ExternalLink, UserCheck, ShieldCheck, Sparkles, MessageSquare,
  Edit3, Trash2
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';

interface ArticleReaderSubViewProps {
  article: any;
  onNavigateBack: () => void;
  triggerToast: (msg: string) => void;
  onBookmarkToggle?: (id: string) => void;
  onOpenAskAiModal?: (queryContext?: string) => void;
  onEditArticle?: (article: any) => void;
  onDeleteArticle?: (articleId: string, articleTitle: string) => void;
}

export function ArticleReaderSubView({
  article,
  onNavigateBack,
  triggerToast,
  onBookmarkToggle,
  onOpenAskAiModal,
  onEditArticle,
  onDeleteArticle
}: ArticleReaderSubViewProps) {
  const [isBookmarked, setIsBookmarked] = useState(article?.is_bookmarked || false);

  if (!article) return null;

  const avatarSrc = (article.author_avatar_url && article.author_avatar_url.startsWith('http'))
    ? article.author_avatar_url
    : getR2CdnUrl(article.author_avatar_url || '', true);

  const mediaFiles = Array.isArray(article.cdn_media_urls) 
    ? article.cdn_media_urls 
    : (typeof article.cdn_media_urls === 'string' ? JSON.parse(article.cdn_media_urls || '[]') : []);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('✓ Tautan artikel berhasil disalin ke clipboard!');
    } else {
      triggerToast('✓ Tautan artikel: ' + window.location.href);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (onBookmarkToggle) onBookmarkToggle(article.id);
    triggerToast(!isBookmarked ? '✓ Artikel disimpan ke Bookmark!' : '✓ Bookmark dihapus.');
  };

  // Helper to parse **bold** and inline formatting
  const renderFormattedInlineText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} className="font-black text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-extrabold"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span>Knowledge Base</span>
              <span>/</span>
              <span className="text-orange-500 font-extrabold">{article.category_name || 'Umum'}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight line-clamp-1 mt-0.5">
              {article.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Author/Owner Action Controls: Edit & Delete */}
          {onEditArticle && (
            <button
              onClick={() => onEditArticle(article)}
              className="p-2.5 rounded-2xl border border-orange-200 dark:border-orange-900 bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Edit Artikel SOP"
            >
              <Edit3 size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {onDeleteArticle && (
            <button
              onClick={() => onDeleteArticle(article.id, article.title)}
              className="p-2.5 rounded-2xl border border-red-200 dark:border-red-950 bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Hapus Artikel SOP"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}

          <button
            onClick={handleBookmark}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isBookmarked 
                ? 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{isBookmarked ? 'Tersimpan' : 'Bookmark'}</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
          {onOpenAskAiModal && (
            <button
              onClick={() => onOpenAskAiModal(`Tanyakan tentang SOP: ${article.title}`)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <BrainCircuit size={16} />
              <span>Tanyakan Copilot</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Article Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Main Article Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Badges & Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                {article.badge_label || article.badge_type || 'Prosedur'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>{article.status || 'Published'}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {article.category_name}
              </span>
            </div>

            {/* Title & Short Description */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {article.title}
              </h1>
              {article.description && (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed border-l-4 border-orange-500 pl-4 py-1 bg-orange-50/40 dark:bg-orange-950/20 rounded-r-2xl">
                  {renderFormattedInlineText(article.description)}
                </p>
              )}
            </div>

            {/* Author & Telemetry Info Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-3">
                <img
                  src={avatarSrc}
                  alt={article.author_name || 'Author'}
                  className="size-10 rounded-full object-cover border border-orange-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = generateInitialsAvatar(article.author_name || 'UMKM');
                  }}
                />
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{article.author_name || 'Tim UMKM'}</span>
                    <ShieldCheck size={14} className="text-blue-500" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{article.author_role || 'UMKM Owner'} • Store AI Copilot</span>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" />
                  <span>{article.updated_time_ago || 'Terbaru'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={14} className="text-slate-400" />
                  <span>{article.views_count ?? 0} Dibaca</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={14} fill="currentColor" />
                  <span>{article.rating_score ?? 0.0}</span>
                </div>
              </div>
            </div>

            {/* Main Article Content Body */}
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 pt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {article.content ? (
                <div className="whitespace-pre-wrap font-sans space-y-3">
                  {article.content.split('\n').map((line: string, idx: number) => {
                    if (line.startsWith('# ')) {
                      return <h2 key={idx} className="text-xl font-black text-slate-900 dark:text-slate-100 pt-3 border-b border-slate-100 dark:border-slate-800 pb-2">{renderFormattedInlineText(line.replace('# ', ''))}</h2>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={idx} className="text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2">{renderFormattedInlineText(line.replace('## ', ''))}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={idx} className="flex items-start gap-2 pl-2">
                          <span className="size-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                          <span>{renderFormattedInlineText(line.replace(/^[-*]\s+/, ''))}</span>
                        </div>
                      );
                    }
                    if (/^\d+\.\s+/.test(line)) {
                      return (
                        <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 font-semibold text-slate-900 dark:text-slate-100">
                          <span className="size-6 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0">{line.match(/^\d+/)?.[0]}</span>
                          <span className="pt-0.5">{renderFormattedInlineText(line.replace(/^\d+\.\s+/, ''))}</span>
                        </div>
                      );
                    }
                    if (!line.trim()) return <div key={idx} className="h-1" />;
                    return <p key={idx} className="text-slate-700 dark:text-slate-300 font-medium">{renderFormattedInlineText(line)}</p>;
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                  <FileText className="mx-auto text-slate-400" size={32} />
                  <p className="font-bold text-slate-600 dark:text-slate-300">Dokumen SOP ini belum memiliki isi konten teks tambahan.</p>
                  <p className="text-xs text-slate-400">Silakan unduh berkas lampiran resmi di panel samping kanan.</p>
                </div>
              )}
            </div>

            {/* Attached Media & Documents (R2 CDN) */}
            {mediaFiles.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Download size={14} /> Berkas Lampiran Resmi (Cloudflare R2 CDN)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mediaFiles.map((url: string, idx: number) => {
                    const fileName = url.split('/').pop() || `Lampiran-${idx + 1}`;
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-orange-400 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="size-9 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-black shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-600 transition-colors">{fileName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">PDF / File Resmi • Cloudflare R2</span>
                          </div>
                        </div>
                        <Download size={16} className="text-slate-400 group-hover:text-orange-500 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Summary & Quick Actions Sidebar */}
        <div className="space-y-5">
          {/* AI Assistance Sidebar Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-lg space-y-4 border border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">ZEGA AI Copilot</h4>
                <span className="text-[10px] text-slate-300 font-medium">Verified Store Knowledge</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Memiliki pertanyaan khusus mengenai SOP ini? Tanyakan langsung ke AI Copilot untuk panduan langkah demi langkah.
            </p>
            {onOpenAskAiModal && (
              <button
                onClick={() => onOpenAskAiModal(`Tanyakan tentang SOP: ${article.title}`)}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-2xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={14} />
                <span>Tanyakan AI Copilot</span>
              </button>
            )}
          </div>

          {/* Quick Details Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xs text-xs font-semibold">
            <h4 className="font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Informasi Dokumentasi
            </h4>
            <div className="space-y-2 text-slate-500">
              <div className="flex justify-between">
                <span>Kategori:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{article.category_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Versi SOP:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">v2.4 Enterprise</span>
              </div>
              <div className="flex justify-between">
                <span>Akses:</span>
                <span className="font-bold text-emerald-600">Seluruh Staf Toko</span>
              </div>
              <div className="flex justify-between">
                <span>Status Audit:</span>
                <span className="font-bold text-blue-600">Terverifikasi 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
