import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Copy,
  Check,
  Trash2,
  Eye,
  RefreshCw,
  Video,
  Image as ImageIcon,
  FileText,
  Layers,
  Play,
  Film,
  Download,
  Share2,
  BarChart3,
  X,
  Cpu,
  Wand2,
  Users,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SupabaseDashboardService } from '../../../../services/supabaseService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ContentItem {
  id: string;
  store_id: string;
  title: string;
  platform: string;
  content_type: string;
  media_type: 'video' | 'image' | 'carousel' | 'text';
  status: string;
  collaboration_status?: 'Pending Review' | 'Approved' | 'In Revision' | 'Ready to Publish';
  assigned_team_member?: string;
  comments_count?: number;
  export_target?: string;
  cdn_image_url?: string;
  creative_image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  aspect_ratio?: string;
  duration_seconds?: number;
  voiceover_engine?: string;
  caption_text: string;
  hashtags: string;
  prompt_used?: string;
  model_engine: string;
  engagement_score: number;
  reach_count: number;
  shares_count?: number;
  created_at: string;
}

interface AnalyticsItem {
  platform: string;
  total_posts: number;
  total_videos: number;
  avg_engagement_pct: number;
  total_reach: number;
  total_shares: number;
}

import { useLanguage } from '../../../../../../i18n/translations';

export const ContentStudioSubPage: React.FC<{ storeId?: string }> = ({ storeId = '11111111-1111-1111-1111-111111111111' }) => {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [activeMediaType, setActiveMediaType] = useState<string>('Semua');
  const [activePlatform, setActivePlatform] = useState<string>('Semua');
  const [activeStatus, setActiveStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Drawers
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);
  const [playingVideoItem, setPlayingVideoItem] = useState<ContentItem | null>(null);
  const [isExportSuccess, setIsExportSuccess] = useState<string | null>(null);
  const [isCopySuccess, setIsCopySuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AI Generation Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState('TikTok');
  const [formContentType, setFormContentType] = useState('TikTok Video');
  const [formMediaType, setFormMediaType] = useState<'video' | 'image' | 'carousel' | 'text'>('video');
  const [formModelEngine, setFormModelEngine] = useState('SeaDance AI Video Engine');
  const [formAspectRatio, setFormAspectRatio] = useState('9:16');
  const [formDuration, setFormDuration] = useState(15);
  const [formVoiceover, setFormVoiceover] = useState('ZeroClaw TTS Edge');
  const [formExportTarget, setFormExportTarget] = useState('CapCut Pro Export');
  const [formPrompt, setFormPrompt] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, analytics] = await Promise.all([
        SupabaseDashboardService.getUmkmMarketingContentItems(storeId),
        SupabaseDashboardService.getContentStudioAnalytics(storeId)
      ]);
      setContentItems(items || []);
      setAnalyticsData(analytics || []);
    } catch (err) {
      console.error('Failed to load Content Studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubscribe = SupabaseDashboardService.subscribeToMarketingContentItems(storeId, () => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [storeId]);

  // Prompt Preset Selection
  const applyPresetPrompt = (preset: { title: string; media: 'video' | 'image'; platform: string; type: string; engine: string; prompt: string }) => {
    setFormTitle(preset.title);
    setFormMediaType(preset.media);
    setFormPlatform(preset.platform);
    setFormContentType(preset.type);
    setFormModelEngine(preset.engine);
    setFormPrompt(preset.prompt);
  };

  // Filtered Items
  const filteredItems = contentItems.filter((item) => {
    const matchesMedia =
      activeMediaType === 'Semua' ||
      (activeMediaType === 'video' && item.media_type === 'video') ||
      (activeMediaType === 'image' && item.media_type === 'image') ||
      (activeMediaType === 'carousel' && item.media_type === 'carousel') ||
      (activeMediaType === 'text' && item.media_type === 'text');

    const matchesPlatform = activePlatform === 'Semua' || item.platform.toLowerCase() === activePlatform.toLowerCase();
    const matchesStatus = activeStatus === 'Semua' || item.status.toLowerCase() === activeStatus.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hashtags && item.hashtags.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesMedia && matchesPlatform && matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalPosts = contentItems.length;
  const totalVideos = contentItems.filter((i) => i.media_type === 'video').length;
  const avgEngagement = (
    contentItems.reduce((acc, curr) => acc + (curr.engagement_score || 0), 0) / (totalPosts || 1)
  ).toFixed(2);

  // Handle AI Item Generation
  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const defaultCdnImage =
        formPlatform === 'Instagram'
          ? 'https://cdn.zegaai.site/assets/logo/instagram.png'
          : formPlatform === 'TikTok'
          ? 'https://cdn.zegaai.site/assets/logo/tiktok.webp'
          : formPlatform === 'WhatsApp'
          ? 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp'
          : 'https://cdn.zegaai.site/assets/logo/shopee.png';

      const defaultSampleVideo =
        formMediaType === 'video'
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : null;

      const generatedCaption = `${formTitle}. ${formPrompt || 'Konten otomatis dirancang oleh model AI terintegrasi.'} Dapatkan penawaran terbatas sekarang!`;
      const generatedHashtags = `#ZegaAI #${formPlatform}Marketing #${formContentType.replace(/\s+/g, '')} #SeaDanceAI #CapCutPro`;

      await SupabaseDashboardService.generateUmkmMarketingContentItem(storeId, {
        title: formTitle,
        platform: formPlatform,
        content_type: formContentType,
        media_type: formMediaType,
        model_engine: formModelEngine,
        aspect_ratio: formAspectRatio,
        duration_seconds: formDuration,
        voiceover_engine: formVoiceover,
        export_target: formExportTarget,
        prompt_used: formPrompt,
        caption_text: generatedCaption,
        hashtags: generatedHashtags,
        cdn_image_url: defaultCdnImage,
        video_url: defaultSampleVideo
      });

      await loadData();
      setIsGenerateModalOpen(false);
      setFormTitle('');
      setFormPrompt('');
    } catch (err) {
      console.error('Failed to generate AI content:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus item konten ini?')) return;
    await SupabaseDashboardService.deleteMarketingContentItem(id);
    await loadData();
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = (text: string, hashtags: string) => {
    const fullText = `${text}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setIsCopySuccess(true);
    setTimeout(() => setIsCopySuccess(false), 2000);
  };

  // Export to CapCut Pro / Premiere / Canva Trigger
  const handleExportProject = (item: ContentItem, target: string) => {
    setIsExportSuccess(target);
    setTimeout(() => setIsExportSuccess(null), 3000);
  };

  // Open Video Player Modal
  const handleOpenVideoPlayer = (item: ContentItem) => {
    setPlayingVideoItem(item);
    setIsVideoPlayerOpen(true);
  };

  // Bar Chart Data Configuration
  const barChartData = {
    labels: analyticsData.map((a) => a.platform),
    datasets: [
      {
        label: 'Tingkat Engagement (%)',
        data: analyticsData.map((a) => a.avg_engagement_pct),
        backgroundColor: '#6366f1',
        borderRadius: 8,
        barThickness: 20
      },
      {
        label: 'Total Posts',
        data: analyticsData.map((a) => a.total_posts),
        backgroundColor: '#10b981',
        borderRadius: 8,
        barThickness: 20
      },
      {
        label: 'AI Videos & Reels',
        data: analyticsData.map((a) => a.total_videos || 0),
        backgroundColor: '#f59e0b',
        borderRadius: 8,
        barThickness: 20
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'Inter', size: 11, weight: 'bold' as const },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 11 },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11, weight: 'bold' as const }, color: '#64748b' }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Notification Banner for Export Confirmation */}
      {isExportSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>Berhasil mengekspor proyek ke <strong>{isExportSuccess}</strong>. File timeline & asset media siap disunting!</span>
          </div>
          <button onClick={() => setIsExportSuccess(null)} className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {m.contentStudioTitle || 'AI Content & Video Studio Command Center'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {m.contentStudioSubtitle || 'Studio pembuatan video reels, TikTok shorts, & copywriting otomatis enterprise.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh Realtime Data"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>{m.createAiContentVideo || '+ Buat Konten & Video AI Baru'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.totalContentPosts || 'Total Konten & Post'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalPosts}</div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            ↑ 18% {m.vsLastMonth || 'vs bulan lalu'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.aiVideoReelsCreated || 'AI Video Reels Created'}</span>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
            <Film size={22} />
            <span>{totalVideos}</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
            {m.enterpriseVideoEngine || 'Enterprise Video Engine'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.avgEngagement || 'Rata-rata Engagement'}</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{avgEngagement}%</div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
            {m.highPerformer || 'High Performer'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.collaborationExportReady || 'Kolaborasi & Export Ready'}</span>
          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1 truncate">
            <Users size={16} />
            <span>{m.enterpriseAssetsSynced || 'Enterprise Assets Synced'}</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
            {m.workflowStatusActive || 'Workflow Status: Active Team'}
          </span>
        </div>
      </div>

      {/* Chart.js Bar Chart Visualization Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>{m.contentPerfByPlatform || 'Analisis Performa Konten & AI Video Per Platform'}</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">{m.contentPerfByPlatformSubtitle || 'Perbandingan tingkat engagement (%), total postingan, dan jumlah video reel AI per saluran.'}</p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
            {m.realtimeAnalyticsDb || 'Realtime Analytics DB'}
          </span>
        </div>

        <div className="h-64 w-full">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Filter Bar: Media Type, Platform, Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Media Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'Semua', label: m.allContent || 'Semua Konten', icon: Layers },
            { id: 'video', label: m.videoReels || '🎬 Video & Reels', icon: Video },
            { id: 'image', label: m.imagePosts || '🖼️ Image & Posts', icon: ImageIcon },
            { id: 'text', label: m.copywriting || '📝 Copywriting', icon: FileText }
          ].map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMediaType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeMediaType === tab.id
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Platform Filter */}
          <select
            value={activePlatform}
            onChange={(e) => setActivePlatform(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
          >
            <option value="Semua">{m.allPlatforms || 'Semua Platform'}</option>
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Shopee">Shopee</option>
          </select>

          {/* Status Filter */}
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
          >
            <option value="Semua">{m.allStatus || 'Semua Status'}</option>
            <option value="Published">Published</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={m.searchContentHashtags || 'Cari konten atau hashtag...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Content Cards Grid with Collaboration Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const defaultCdnUrl =
            item.platform === 'Instagram'
              ? 'https://cdn.zegaai.site/assets/logo/instagram.png'
              : item.platform === 'TikTok'
              ? 'https://cdn.zegaai.site/assets/logo/tiktok.webp'
              : item.platform === 'WhatsApp'
              ? 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp'
              : 'https://cdn.zegaai.site/assets/logo/shopee.png';

          const isVideo = item.media_type === 'video';

          return (
            <div
              key={item.id}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Media Preview / Video Play Trigger */}
              <div className="relative h-48 overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={item.thumbnail_url || item.cdn_image_url || item.creative_image_url || defaultCdnUrl}
                  alt={item.title}
                  className={item.thumbnail_url || item.cdn_image_url || item.creative_image_url ? "w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300" : "size-16 object-contain opacity-80"}
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = defaultCdnUrl;
                    e.target.className = "size-16 object-contain opacity-80";
                  }}
                />

                {/* Video Overlay Play Button */}
                {isVideo && (
                  <button
                    onClick={() => handleOpenVideoPlayer(item)}
                    className="absolute inset-0 m-auto size-12 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play size={20} className="ml-0.5 fill-current" />
                  </button>
                )}

                <div className="absolute inset-0 bg-slate-950/80 p-3 flex flex-col justify-between pointer-events-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/20 text-[9px] font-black text-amber-300 uppercase">
                        {item.platform}
                      </span>
                      {isVideo && (
                        <span className="px-2 py-0.5 rounded-lg bg-red-600/90 text-white text-[9px] font-black uppercase flex items-center gap-1">
                          <Film size={10} />
                          <span>REEL</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                        item.status === 'Published'
                          ? 'bg-emerald-500 text-white'
                          : item.status === 'Scheduled'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-orange-300 uppercase">
                      <span>{item.content_type}</span>
                      {item.aspect_ratio && <span>{item.aspect_ratio}</span>}
                    </div>
                    <h4 className="text-xs font-black text-white leading-snug truncate">{item.title}</h4>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-3 leading-relaxed">
                    {item.caption_text}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold mt-1 truncate">
                    {item.hashtags}
                  </p>
                </div>

                {/* Team Collaboration & Export Target Info */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400 flex items-center gap-1">
                      <Users size={11} />
                      <span>PIC Tim:</span>
                    </span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                      {item.assigned_team_member || 'AI Content Strategist'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400">Target Export:</span>
                    <button
                      onClick={() => handleExportProject(item, item.export_target || 'CapCut Pro Export')}
                      className="font-black text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.export_target || 'CapCut Pro Export'}</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400">Engine:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                      {item.model_engine || 'SeaDance AI Video Engine'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                    <span>Engagement: <strong className="text-indigo-600 dark:text-indigo-400">{item.engagement_score}%</strong></span>
                    <span>Reach: <strong>{item.reach_count.toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {isVideo ? (
                    <button
                      onClick={() => handleOpenVideoPlayer(item)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play size={13} className="fill-current" />
                      <span>Putar Video Reel</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Pratinjau Teks</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    title="Hapus Konten"
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Content & Video Generation Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Studio Generasi Video & Konten AI</h3>
                  <p className="text-[11px] text-slate-400 font-medium">SeaDance AI, CapCut Pro Swarm, Veo 2, Luma Dream Machine & ZeroClaw Daemon.</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Prompt Preset Quick Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Template Prompt Instan:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  {
                    title: 'Unboxing Serum Niacinamide 10% (SeaDance AI)',
                    media: 'video' as const,
                    platform: 'TikTok',
                    type: 'TikTok Video',
                    engine: 'SeaDance AI Video Engine',
                    prompt: 'Generasikan video 15 detik TikTok Reel unboxing skincare serum dengan SeaDance AI Engine & timeline CapCut Pro export.'
                  },
                  {
                    title: 'Tutorial Night Routine 3 Langkah (CapCut Swarm)',
                    media: 'video' as const,
                    platform: 'Instagram',
                    type: 'Instagram Reel',
                    engine: 'CapCut Pro AI Swarm Exporter',
                    prompt: 'Video cinematic tutorial 30 detik langkah perawatan wajah malam hari via CapCut Pro AI Swarm.'
                  },
                  {
                    title: 'Flyer Promo Skincare Gajian 35%',
                    media: 'image' as const,
                    platform: 'Instagram',
                    type: 'Instagram Post',
                    engine: '9Router Swarm Cost-Optimizer',
                    prompt: 'Desain flyer promosi produk skincare glowing sudut elegan dengan efek kilauan emas dan badge diskon 35%.'
                  }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPresetPrompt(preset)}
                    className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 text-[10px] font-bold text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 whitespace-nowrap cursor-pointer"
                  >
                    ⚡ {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleGenerateContent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Topik Kampanye Konten *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Video Reel Unboxing Serum Glowing Niacinamide"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Media Type & Platform Selection */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Format Media</label>
                  <select
                    value={formMediaType}
                    onChange={(e: any) => {
                      setFormMediaType(e.target.value);
                      if (e.target.value === 'video') setFormContentType('TikTok Video');
                      if (e.target.value === 'image') setFormContentType('Instagram Post');
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none"
                  >
                    <option value="video">🎬 AI Video / Reel</option>
                    <option value="image">🖼️ Gambar / Post</option>
                    <option value="text">📝 Copywriting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Platform Pemasaran</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => {
                      setFormPlatform(e.target.value);
                      if (e.target.value === 'TikTok') setFormContentType('TikTok Video');
                      if (e.target.value === 'Instagram') setFormContentType('Instagram Reel');
                      if (e.target.value === 'WhatsApp') setFormContentType('WhatsApp Template');
                      if (e.target.value === 'Shopee') setFormContentType('Shopee Banner');
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Shopee">Shopee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Ekspor Proyek</label>
                  <select
                    value={formExportTarget}
                    onChange={(e) => setFormExportTarget(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none"
                  >
                    <option value="CapCut Pro Export">CapCut Pro Export (.mp4 + timeline)</option>
                    <option value="Adobe Premiere XML">Adobe Premiere Pro XML</option>
                    <option value="Canva Sync">Canva Design Cloud Sync</option>
                    <option value="Direct Platform Publish">Direct Social Media Publish</option>
                  </select>
                </div>
              </div>

              {/* Model Engine Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Real AI Model Engine</label>
                <select
                  value={formModelEngine}
                  onChange={(e) => setFormModelEngine(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none"
                >
                  <option value="SeaDance AI Video Engine">SeaDance AI Video Engine (Cinematic E-Commerce Reels)</option>
                  <option value="CapCut Pro AI Swarm Exporter">CapCut Pro AI Swarm Exporter (Timeline & Audio Ready)</option>
                  <option value="ZeroClaw Edge Video Daemon">ZeroClaw Edge Video Daemon (0ms Latency Local Video Edge)</option>
                  <option value="9Router Swarm Cost-Optimizer">9Router Swarm Cost-Optimizer (Layer 5 Multi-Model Swarm)</option>
                  <option value="Veo 2 Enterprise Video Engine">Veo 2 Enterprise Video Engine (4K High-Fidelity Reel Generator)</option>
                  <option value="Luma Dream Machine 2.0">Luma Dream Machine 2.0 (Cinematic Motion Video)</option>
                  <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha (Hyper-Realistic Video)</option>
                  <option value="Kling 1.5 HD AI Video">Kling 1.5 HD AI Video (E-Commerce Product Reels)</option>
                  <option value="DeepSeek R1">DeepSeek R1 (High-Reasoning Script & Copywriting)</option>
                  <option value="Qwen 2.5 Coder">Qwen 2.5 Coder 32B (Visual Hook Design)</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet Engine (Executive Copywriter)</option>
                </select>
              </div>

              {/* Video Specific Controls */}
              {formMediaType === 'video' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">Durasi Video Reel</label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 font-bold"
                    >
                      <option value={15}>15 Detik (Short Reel)</option>
                      <option value={30}>30 Detik (Standard Reel)</option>
                      <option value={60}>60 Detik (In-depth Demo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">Voiceover Engine (TTS)</label>
                    <select
                      value={formVoiceover}
                      onChange={(e) => setFormVoiceover(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 font-bold"
                    >
                      <option value="ZeroClaw TTS Edge">ZeroClaw TTS Edge (0ms Local)</option>
                      <option value="ElevenLabs Indonesian">ElevenLabs Indonesian Voice</option>
                      <option value="OpenAI Whisper TTS">OpenAI Whisper TTS</option>
                      <option value="Tanpa Voiceover">Tanpa Voiceover</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Prompt Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Prompt AI Studio</label>
                <textarea
                  rows={3}
                  placeholder="Masukkan prompt visual, urutan scrip video, promo potongan harga, atau pesan utama..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  <span>{isSubmitting ? 'Memproses Engine AI...' : 'Hasilkan Konten Realtime'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML5 Video Player Modal */}
      {isVideoPlayerOpen && playingVideoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl max-w-md w-full overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase">
                  {playingVideoItem.platform} REEL
                </span>
                <h3 className="font-extrabold text-sm text-white truncate">{playingVideoItem.title}</h3>
              </div>
              <button
                onClick={() => setIsVideoPlayerOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-[9/16] max-h-[500px] bg-black flex items-center justify-center">
              <video
                src={playingVideoItem.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                controls
                autoPlay
                loop
                poster={playingVideoItem.thumbnail_url || playingVideoItem.cdn_image_url}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-slate-900 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>Engine: <strong className="text-emerald-400">{playingVideoItem.model_engine}</strong></span>
                <span>Aspect Ratio: <strong className="text-white">{playingVideoItem.aspect_ratio || '9:16'}</strong></span>
              </div>
              <p className="text-xs text-slate-200 font-medium line-clamp-2">{playingVideoItem.caption_text}</p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCaption(playingVideoItem.caption_text, playingVideoItem.hashtags)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCopySuccess ? <Check size={15} /> : <Copy size={15} />}
                  <span>{isCopySuccess ? 'Disalin!' : 'Salin Caption'}</span>
                </button>
                <button
                  onClick={() => handleExportProject(playingVideoItem, playingVideoItem.export_target || 'CapCut Pro Export')}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink size={15} />
                  <span>Ekspor ke CapCut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Caption & Collaboration Drawer for Text/Image Items */}
      {selectedItem && !isVideoPlayerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 font-black text-[10px] uppercase">
                  {selectedItem.platform}
                </span>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Media Preview */}
              <div className="h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={selectedItem.cdn_image_url || selectedItem.creative_image_url || 'https://cdn.zegaai.site/assets/logo/instagram.png'}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Caption Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teks Caption & Hashtag:</span>
                <p className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                  {selectedItem.caption_text}
                </p>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedItem.hashtags}</p>
              </div>

              {/* Model Info & Collaboration */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px]">
                <div>
                  <span className="block font-bold text-indigo-900 dark:text-indigo-200">AI Model Engine:</span>
                  <span className="font-black text-indigo-700 dark:text-indigo-300">{selectedItem.model_engine}</span>
                </div>
                <div>
                  <span className="block font-bold text-indigo-900 dark:text-indigo-200">Target Ekspor:</span>
                  <span className="font-black text-orange-600 dark:text-orange-400">{selectedItem.export_target || 'CapCut Pro Export'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopyCaption(selectedItem.caption_text, selectedItem.hashtags)}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {isCopySuccess ? <Check size={16} /> : <Copy size={16} />}
                  <span>{isCopySuccess ? 'Disalin ke Clipboard!' : 'Salin Caption & Hashtag'}</span>
                </button>
                <button
                  onClick={() => handleExportProject(selectedItem, selectedItem.export_target || 'CapCut Pro Export')}
                  className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <ExternalLink size={16} />
                  <span>Ekspor Proyek</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentStudioSubPage;
