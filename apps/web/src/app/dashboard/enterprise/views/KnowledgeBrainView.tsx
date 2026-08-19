import React, { useState, useEffect } from 'react';
import { 
  Brain, Plus, Search, Filter, Database, FileText, Globe, Upload, Sparkles, 
  Folder, Lock, Users, MoreVertical, ShieldCheck, X, LayoutGrid, List, Table, Clock, 
  MessageSquare, ChevronRight, TrendingUp, ArrowUpRight, BarChart2, CheckCircle2,
  Share2, Download, Trash2, ExternalLink, Copy, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

interface KnowledgeBrainViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function KnowledgeBrainView({ onTriggerToast }: KnowledgeBrainViewProps) {
  const [activeTab, setActiveTab] = useState('collections');
  const [selectedCollection, setSelectedCollection] = useState('Legal Documents');
  const [selectedOwner, setSelectedOwner] = useState('All Owners');
  const [selectedType, setSelectedType] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedAiMsg, setCopiedAiMsg] = useState(false);

  const handleCopyAiMsg = (text: string) => {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (error) {
        console.error('Copy fallback failed:', error);
      }
      document.body.removeChild(textArea);
    }
    setCopiedAiMsg(true);
    onTriggerToast?.('✓ Pesan AI disalin ke clipboard!');
    setTimeout(() => setCopiedAiMsg(false), 2000);
  };

  // New item modal form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemExtra1, setNewItemExtra1] = useState('');
  const [newItemExtra2, setNewItemExtra2] = useState('');
  const [newItemCollection, setNewItemCollection] = useState('Legal Documents');

  const handleCreateNewItem = async () => {
    if (!newItemName.trim()) {
      onTriggerToast?.('Please fill in the item name!');
      return;
    }

    if (activeTab === 'collections') {
      const { data, error } = await enterpriseSupabaseService.createKnowledgeCollection(newItemName);
      if (!error && data) {
        setCollections(prev => [data, ...prev]);
        onTriggerToast?.(`Collection "${newItemName}" created successfully!`);
      } else {
        onTriggerToast?.(`Created Collection "${newItemName}"!`);
      }
    } else if (activeTab === 'all_documents') {
      const { data, error } = await enterpriseSupabaseService.addKnowledgeDocument({
        name: newItemName,
        type: newItemExtra1 || 'Document',
        size_formatted: '240 KB',
        owner_name: 'Wildan A.',
        status: 'Indexed',
        access_level: 'Team',
        cdn_url: `https://cdn.zegaai.site/docs/${newItemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
      });
      if (data) setDocuments(prev => [data, ...prev]);
      onTriggerToast?.(`Document "${newItemName}" added and indexed!`);
    } else if (activeTab === 'datasets') {
      const { data, error } = await enterpriseSupabaseService.addKnowledgeDataset({
        name: newItemName,
        description: newItemExtra1 || 'New enterprise dataset',
        format: newItemExtra2 || 'CSV',
        collection_name: newItemCollection
      });
      if (data) setDatasets(prev => [data, ...prev]);
      onTriggerToast?.(`Dataset "${newItemName}" added successfully!`);
    } else if (activeTab === 'databases') {
      const { data, error } = await enterpriseSupabaseService.addKnowledgeDatabase({
        name: newItemName,
        type: newItemExtra1 || 'PostgreSQL',
        host: newItemExtra2 || 'db-prod-cluster.company.com',
        collection_name: newItemCollection
      });
      if (data) setDatabases(prev => [data, ...prev]);
      onTriggerToast?.(`Database connection "${newItemName}" added successfully!`);
    } else if (activeTab === 'websites') {
      const { data, error } = await enterpriseSupabaseService.addKnowledgeWebsite({
        url: newItemName.startsWith('http') ? newItemName : `https://${newItemName}`,
        description: newItemExtra1 || 'Enterprise web data source',
        collection_name: newItemCollection,
        frequency: newItemExtra2 || 'Daily'
      });
      if (data) setWebsites(prev => [data, ...prev]);
      onTriggerToast?.(`Website "${newItemName}" added for auto-crawling!`);
    }

    setNewItemName('');
    setNewItemExtra1('');
    setNewItemExtra2('');
    setShowAddModal(false);
  };

  // Collections list matching image
  const [collections, setCollections] = useState<any[]>([
    { id: 'c1', name: 'Company Policy', doc_count_str: '268 docs', iconColor: 'text-pink-500 bg-pink-50 dark:bg-pink-950/50' },
    { id: 'c2', name: 'HR Knowledge', doc_count_str: '142 docs', iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' },
    { id: 'c3', name: 'Financial Reports', doc_count_str: '98 docs', doc_count: 98, iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50' },
    { id: 'c4', name: 'Product Documentation', doc_count_str: '312 docs', iconColor: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50' },
    { id: 'c5', name: 'Market Research', doc_count_str: '178 docs', iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' },
    { id: 'c6', name: 'Legal Documents', doc_count_str: '74 docs', iconColor: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50', active: true },
    { id: 'c7', name: 'Customer Insights', doc_count_str: '128 docs', iconColor: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50' },
    { id: 'c8', name: 'Database', doc_count_str: '156 docs', iconColor: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50' }
  ]);

  // Documents matching exact rows in reference image
  const [documents, setDocuments] = useState<any[]>([
    { id: 'd1', name: 'Data Privacy Policy 2024', type: 'Document', size_formatted: '256 KB', owner_name: 'Wildan A.', owner_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', last_updated_str: '24 Apr 2025', status: 'Indexed', access_level: 'Team', cdn_url: 'https://cdn.zegaai.site/docs/data-privacy-2024.pdf' },
    { id: 'd2', name: 'SLA Master Agreement', type: 'Document', size_formatted: '142 KB', owner_name: 'Sarah K.', owner_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', last_updated_str: '21 Apr 2025', status: 'Indexed', access_level: 'Team', cdn_url: 'https://cdn.zegaai.site/docs/sla-agreement.pdf' },
    { id: 'd3', name: 'Terms of Service', type: 'Document', size_formatted: '96 KB', owner_name: 'Alex M.', owner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', last_updated_str: '19 Apr 2025', status: 'Indexed', access_level: 'Public', cdn_url: 'https://cdn.zegaai.site/docs/terms-of-service.pdf' },
    { id: 'd4', name: 'Contract Template.docx', type: 'Document', size_formatted: '512 KB', owner_name: 'Wildan A.', owner_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', last_updated_str: '18 Apr 2025', status: 'Indexed', access_level: 'Team', cdn_url: 'https://cdn.zegaai.site/docs/contract-template.docx' },
    { id: 'd5', name: 'Compliance Guidelines', type: 'Website', size_formatted: '178 KB', owner_name: 'Elen R.', owner_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', last_updated_str: '17 Apr 2025', status: 'Indexed', access_level: 'Team', cdn_url: 'https://docs.zegaai.site/compliance' },
    { id: 'd6', name: 'Legal Case Studies', type: 'Document', size_formatted: '74 KB', owner_name: 'Sarah K.', owner_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', last_updated_str: '16 Apr 2025', status: 'Indexed', access_level: 'Private', cdn_url: 'https://cdn.zegaai.site/docs/case-studies.pdf' },
    { id: 'd7', name: 'Regulatory Updates Q1', type: 'Database', size_formatted: '156 KB', owner_name: 'Alex M.', owner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', last_updated_str: '15 Apr 2025', status: 'Indexed', access_level: 'Team', cdn_url: 'postgresql://db-prod.zegaai.site/legal' }
  ]);

  const [datasets, setDatasets] = useState<any[]>([
    { id: 'ds1', name: 'Customer Segmentation', description: 'Data pelanggan untuk segmentasi pasar', format: 'CSV', collection_name: 'Market Research', rows_count_str: '2.3M', size_formatted: '120 MB', owner_name: 'Elena R.', last_updated_str: '18 Apr 2025', status: 'Indexed', access_level: 'Private' },
    { id: 'ds2', name: 'Sales Transactions 2024', description: 'Transaksi penjualan tahun 2024', format: 'CSV', collection_name: 'Financial Data', rows_count_str: '8.7M', size_formatted: '320 MB', owner_name: 'Wildan A.', last_updated_str: '17 Apr 2025', status: 'Indexed', access_level: 'Team' },
    { id: 'ds3', name: 'Website Analytics', description: 'Data trafik website dan perilaku', format: 'CSV', collection_name: 'Analytics', rows_count_str: '5.4M', size_formatted: '85 MB', owner_name: 'Sarah K.', last_updated_str: '16 Apr 2025', status: 'Indexed', access_level: 'Public' },
    { id: 'ds4', name: 'Product Catalog', description: 'Katalog produk terbaru', format: 'JSON', collection_name: 'Product Data', rows_count_str: '125K', size_formatted: '12 GB', owner_name: 'Wildan A.', last_updated_str: '15 Apr 2025', status: 'Indexed', access_level: 'Public' }
  ]);

  const [databases, setDatabases] = useState<any[]>([
    { id: 'db1', name: 'Customer DB', type: 'PostgreSQL', host: 'db-prod-01.company.com', collection_name: 'Customer Data', tables_count: 245, size_formatted: '120 GB', owner_name: 'Alex M.', last_sync_str: 'Today, 09:05', status: 'Connected', access_level: 'Team' },
    { id: 'db2', name: 'Analytics Warehouse', type: 'BigQuery', host: 'bigquery.company.com', collection_name: 'Analytics', tables_count: 156, size_formatted: '2.8 TB', owner_name: 'Sarah K.', last_sync_str: 'Today, 08:50', status: 'Connected', access_level: 'Team' },
    { id: 'db3', name: 'Sales DB', type: 'MySQL', host: 'mysql-prod.company.com', collection_name: 'Financial Data', tables_count: 98, size_formatted: '60 GB', owner_name: 'Wildan A.', last_sync_str: 'Today, 08:35', status: 'Connected', access_level: 'Team' }
  ]);

  const [websites, setWebsites] = useState<any[]>([
    { id: 'ws1', url: 'https://www.company.com', description: 'Website utama perusahaan', collection_name: 'Company Assets', frequency: 'Daily', last_crawled_str: 'Today, 08:45', status: 'Success', pages_count: 1245, access_level: 'Team' },
    { id: 'ws2', url: 'https://investor.company.com', description: 'Halaman investor relations', collection_name: 'Investor Relations', frequency: 'Daily', last_crawled_str: 'Today, 08:30', status: 'Success', pages_count: 356, access_level: 'Team' },
    { id: 'ws3', url: 'https://blog.company.com', description: 'Blog dan artikel perusahaan', collection_name: 'Content Marketing', frequency: 'Daily', last_crawled_str: 'Today, 07:50', status: 'Success', pages_count: 2187, access_level: 'Public' }
  ]);

  // Load Supabase Realtime Data
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const fetchRealtimeData = async () => {
      const [colRes, docRes, dsRes, dbRes, wsRes] = await Promise.all([
        enterpriseSupabaseService.getKnowledgeCollections(),
        enterpriseSupabaseService.getKnowledgeDocuments(),
        enterpriseSupabaseService.getKnowledgeDatasets(),
        enterpriseSupabaseService.getKnowledgeDatabases(),
        enterpriseSupabaseService.getKnowledgeWebsites()
      ]);

      if (colRes.data?.length) setCollections(colRes.data);
      if (docRes.data?.length) setDocuments(docRes.data);
      if (dsRes.data?.length) setDatasets(dsRes.data);
      if (dbRes.data?.length) setDatabases(dbRes.data);
      if (wsRes.data?.length) setWebsites(wsRes.data);

      unsubscribe = enterpriseSupabaseService.subscribeToKnowledgeRealtime(async () => {
        const freshDocs = await enterpriseSupabaseService.getKnowledgeDocuments();
        if (freshDocs.data?.length) setDocuments(freshDocs.data);
      });
    };

    fetchRealtimeData();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'website': return <Globe size={15} className="text-sky-500 shrink-0" />;
      case 'database': return <Database size={15} className="text-emerald-500 shrink-0" />;
      default: return <FileText size={15} className="text-indigo-500 shrink-0" />;
    }
  };

  const getAccessBadge = (access: string) => {
    switch (access.toLowerCase()) {
      case 'public': return <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400"><Globe size={12} className="text-emerald-500" /> Public</span>;
      case 'private': return <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400"><Lock size={12} className="text-amber-500" /> Private</span>;
      default: return <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400"><Users size={12} className="text-indigo-500" /> Team</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans max-w-full">
      {/* 1. TOP HEADER BAR (DYNAMICALLY ADAPTIVE BASED ON ACTIVE TAB) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {activeTab === 'collections' && 'Knowledge Hub'}
            {activeTab === 'all_documents' && 'Documents'}
            {activeTab === 'datasets' && 'Datasets'}
            {activeTab === 'databases' && 'Databases'}
            {activeTab === 'websites' && 'Websites'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'collections' && 'Kelola, temukan dan bagikan pengetahuan enterprise Anda dengan aman dan efisien.'}
            {activeTab === 'all_documents' && 'Kelola semua dokumen perusahaan dengan aman dan terstruktur.'}
            {activeTab === 'datasets' && 'Temukan, kelola, dan gunakan dataset terstruktur untuk analitik dan AI.'}
            {activeTab === 'databases' && 'Kelola koneksi database enterprise secara terpusat dan aman.'}
            {activeTab === 'websites' && 'Kelola sumber data website untuk monitoring dan pengambilan informasi.'}{' '}
            <a href="#learn-more" onClick={(e) => { e.preventDefault(); onTriggerToast?.('Opening Knowledge Hub Guide...'); }} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Learn more
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-all cursor-pointer"
          >
            <Upload size={15} className="text-slate-500" />
            <span>
              {activeTab === 'collections' && 'Import Data'}
              {activeTab === 'all_documents' && 'Import'}
              {activeTab === 'datasets' && 'Import Data'}
              {activeTab === 'databases' && 'Import Connection'}
              {activeTab === 'websites' && 'Import Website'}
            </span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>
              {activeTab === 'collections' && 'Add Knowledge'}
              {activeTab === 'all_documents' && 'Add Document'}
              {activeTab === 'datasets' && 'Add Dataset'}
              {activeTab === 'databases' && 'Add Database'}
              {activeTab === 'websites' && 'Add Website'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORY PILLS SUB-NAV & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'collections', label: 'Collections' },
            { id: 'all_documents', label: 'Documents' },
            { id: 'datasets', label: 'Datasets' },
            { id: 'websites', label: 'Websites' },
            { id: 'databases', label: 'Databases' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All Collections">All Collections</option>
            {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All Owners">All Owners</option>
            <option value="Wildan A.">Wildan A.</option>
            <option value="Sarah K.">Sarah K.</option>
            <option value="Alex M.">Alex M.</option>
            <option value="Elen R.">Elen R.</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All Types">All Types</option>
            <option value="Document">Document</option>
            <option value="Website">Website</option>
            <option value="Database">Database</option>
          </select>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-400'}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-400'}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN COLLECTIONS VIEW LAYOUT (COLUMNS: LEFT SIDEBAR & CENTER TABLE) */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: COLLECTIONS LIST, AI ASSISTANT, RECENT ACTIVITY */}
            <div className="lg:col-span-3 space-y-4">
              {/* COLLECTIONS LIST */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">COLLECTIONS</span>
                  <button
                    onClick={() => setShowNewCollectionModal(true)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    + New Collection
                  </button>
                </div>
                <div className="space-y-1">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCollection(c.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedCollection === c.name
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder size={14} className={selectedCollection === c.name ? 'text-indigo-500' : 'text-slate-400'} />
                        <span className="truncate max-w-[120px]">{c.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{c.doc_count_str}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI ASSISTANT PROMO CARD */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  AI ASSISTANT
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ask anything about your enterprise knowledge
                </p>
                <button
                  onClick={() => setShowAiModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs hover:bg-indigo-50 cursor-pointer"
                >
                  <span>Start Chat</span>
                  <Sparkles size={14} />
                </button>
              </div>

              {/* RECENT ACTIVITY */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-2">
                  RECENT ACTIVITY
                </span>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Wildan A. uploaded 12 documents</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">2m ago</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Sarah K. updated HR Policy</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">15m ago</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Alex M. added 8 documents</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">1h ago</span>
                  </div>
                </div>
                <button
                  onClick={() => onTriggerToast?.('Loading full activity log...')}
                  className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 block cursor-pointer"
                >
                  View All Activity
                </button>
              </div>
            </div>

            {/* CENTER COLUMN: DOCUMENTS TABLE */}
            <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    DOCUMENTS IN {selectedCollection.toUpperCase()}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">74 Documents</span>
                </div>

                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in collection..."
                    className="pl-8 pr-3 py-1 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 px-2">Name</th>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-2">Size</th>
                      <th className="py-2.5 px-2">Owner</th>
                      <th className="py-2.5 px-2">Last Updated</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2">Access</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {getTypeIcon(doc.type)}
                          <span className="truncate max-w-[200px]">{doc.name}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 font-medium">{doc.type}</td>
                        <td className="py-3 px-2 font-mono text-slate-500 text-[11px]">{doc.size_formatted}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <img src={doc.owner_avatar} alt="" className="size-4 rounded-full object-cover" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{doc.owner_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-400 text-[11px]">{doc.last_updated_str}</td>
                        <td className="py-3 px-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">{getAccessBadge(doc.access_level)}</td>
                        <td className="py-3 px-2 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {activeMenuId === doc.id && (
                              <div className="absolute right-0 top-6 z-20 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 text-xs">
                                <a href={doc.cdn_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                                  <ExternalLink size={12} /> Open Link
                                </a>
                                <button onClick={() => { setActiveMenuId(null); onTriggerToast?.('Re-indexing vector embeddings...'); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                                  <Sparkles size={12} /> Re-index
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>Showing 1 to 7 of 74 documents</span>
                <div className="flex items-center gap-1 font-semibold">
                  <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">1</button>
                  <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs">2</button>
                  <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs">3</button>
                  <span className="px-1 text-slate-400">... 11</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. RECHARTS ENTERPRISE ANALYTICS DIAGRAM & KPI CARDS */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <BarChart2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Vector Indexing & RAG Performance Analytics
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Powered by Recharts engine — Real-time vector QPS throughput, retrieval latency, and cache hit metrics.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {['24H', '7D', '30D', '90D'].map((tf, idx) => (
                      <button
                        key={tf}
                        onClick={() => onTriggerToast?.(`Recharts timeframe set to ${tf}`)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          idx === 0
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Recharts Telemetry
                  </span>
                </div>
              </div>

              {/* Legend & Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-indigo-600" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Vector Indexing (QPS)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold ml-1">148.2K peak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-500 border border-emerald-600" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Retrieval Latency (ms)</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-1">42ms avg</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Cache Efficiency: <strong className="text-emerald-600 dark:text-emerald-400">98.8%</strong></span>
                  <span>•</span>
                  <span>Vector DB Engine: <strong className="text-indigo-600 dark:text-indigo-400">Qdrant Cluster</strong></span>
                </div>
              </div>

              {/* Recharts AreaChart Container */}
              <div className="h-48 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { time: '00:00', qps: 45000, latency: 52, cacheHit: '97.2%' },
                      { time: '04:00', qps: 68000, latency: 48, cacheHit: '98.1%' },
                      { time: '08:00', qps: 115000, latency: 45, cacheHit: '98.4%' },
                      { time: '12:00', qps: 148250, latency: 42, cacheHit: '98.8%' },
                      { time: '16:00', qps: 135000, latency: 44, cacheHit: '98.5%' },
                      { time: '20:00', qps: 98000, latency: 46, cacheHit: '98.2%' },
                      { time: '24:00', qps: 72000, latency: 50, cacheHit: '97.8%' }
                    ]}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="rechartsQpsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="rechartsLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val / 1000}k`} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#10b981' }} tickFormatter={(val) => `${val}ms`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-2xl border border-slate-800 space-y-1">
                              <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                                <span>Timestamp: {label}</span>
                                <span className="text-emerald-400 font-mono">{data.cacheHit} cache</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-indigo-400 font-bold">
                                <span>Vector Indexing:</span>
                                <span className="font-mono">{data.qps.toLocaleString()} QPS</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                                <span>RAG Latency:</span>
                                <span className="font-mono">{data.latency} ms</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="qps" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#rechartsQpsGrad)" name="Indexing QPS" />
                    <Area yAxisId="right" type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#rechartsLatencyGrad)" name="Latency (ms)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 6 KPI STRIP CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'TOTAL COLLECTIONS', val: '42', change: '↑ 12%', sub: 'vs last month' },
                { label: 'TOTAL DOCUMENTS', val: '1,216', change: '↑ 18%', sub: 'vs last month' },
                { label: 'TOTAL STORAGE', val: '2.34 TB', change: '↑ 8%', sub: 'vs last month' },
                { label: 'EMBEDDINGS', val: '142.6M', change: '↑ 21%', sub: 'vs last month' },
                { label: 'AVG. RESPONSE TIME', val: '45ms', change: '↓ 9%', sub: 'vs last month' },
                { label: 'USERS ACTIVE', val: '128', change: '↑ 15%', sub: 'vs last month' },
              ].map((k, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{k.label}</span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{k.val}</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    <span>{k.change}</span>
                    <span className="text-slate-400">{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. ENTERPRISE SECURITY BANNER AT BOTTOM */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Enterprise Grade Security</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Semua data Anda dilindungi dengan enkripsi end-to-end, kontrol akses granular, dan audit log yang lengkap.
                </p>
              </div>
            </div>
            <button
              onClick={() => onTriggerToast?.('Opening Enterprise Security Compliance Docs...')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              Learn More
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED DOCUMENTS VIEW */}
      {activeTab === 'all_documents' && (
        <div className="space-y-6">
          {/* 5 KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL DOCUMENTS</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">3,128</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 16.8% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL STORAGE</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">1.12 TB</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 18.2% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COLLECTIONS</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">24</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OWNERS</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">68</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LAST UPDATED</span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Today, 10:30</div>
            </div>
          </div>

          {/* Main Grid: Left Column Filters + Documents Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-2">BY TYPE</span>
              <div className="space-y-1.5 text-xs font-medium">
                {[
                  { name: 'All Types', count: '3,128', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
                  { name: 'Document', count: '1,238', color: 'text-red-500 bg-red-50 dark:bg-red-950/50' },
                  { name: 'Word', count: '876', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50' },
                  { name: 'Excel', count: '534', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' },
                  { name: 'PPT', count: '296', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' },
                  { name: 'Text', count: '122', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
                  { name: 'Markdown', count: '36', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50' },
                  { name: 'Other', count: '26', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' }
                ].map(t => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedType(t.name);
                      onTriggerToast?.(`Filtering by type: ${t.name}`);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      selectedType === t.name
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${t.color}`}>{t.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 px-2">Name</th>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-2">Collection</th>
                      <th className="py-2.5 px-2">Owner</th>
                      <th className="py-2.5 px-2">Last Updated</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2">Size</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {documents.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <FileText size={15} className="text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{d.name}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 font-medium">{d.type}</td>
                        <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">Legal Documents</span></td>
                        <td className="py-3 px-2">{d.owner_name}</td>
                        <td className="py-3 px-2 font-mono text-slate-400 text-[11px]">{d.last_updated_str}</td>
                        <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">{d.status}</span></td>
                        <td className="py-3 px-2 font-mono text-slate-500 text-[11px]">{d.size_formatted}</td>
                        <td className="py-3 px-2 text-right"><button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><MoreVertical size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500">
                <span>Showing 1 to 7 of 3,128 documents</span>
                <div className="flex items-center gap-1 font-semibold">
                  <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">1</button>
                  <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">2</button>
                  <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">3</button>
                  <span className="px-1 text-slate-400">... 447</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED DATASETS VIEW */}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          {/* 5 KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL DATASETS</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">142</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 12% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL ROWS</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">18.4M</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 22% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL STORAGE</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">680 GB</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 15% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OWNERS</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">16</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LAST UPDATED</span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Today, 09:15</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-2">Name</th>
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2">Format</th>
                    <th className="py-2.5 px-2">Collection</th>
                    <th className="py-2.5 px-2">Rows</th>
                    <th className="py-2.5 px-2">Size</th>
                    <th className="py-2.5 px-2">Owner</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Access</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {datasets.map(ds => (
                    <tr key={ds.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-100">{ds.name}</td>
                      <td className="py-3 px-2 text-slate-500 truncate max-w-[180px]">{ds.description}</td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">{ds.format}</span></td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">{ds.collection_name}</span></td>
                      <td className="py-3 px-2 font-mono text-slate-700 font-bold">{ds.rows_count_str}</td>
                      <td className="py-3 px-2 font-mono text-slate-500 text-[11px]">{ds.size_formatted}</td>
                      <td className="py-3 px-2">{ds.owner_name}</td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">{ds.status}</span></td>
                      <td className="py-3 px-2">{getAccessBadge(ds.access_level)}</td>
                      <td className="py-3 px-2 text-right"><button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><MoreVertical size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500">
              <span>Showing 1 to 8 of 142 datasets</span>
              <div className="flex items-center gap-1 font-semibold">
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">1</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">2</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">3</button>
                <span className="px-1 text-slate-400">... 18</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED DATABASES VIEW */}
      {activeTab === 'databases' && (
        <div className="space-y-6">
          {/* 5 KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL DATABASES</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">28</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 16% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONNECTED</span>
              <div className="text-xl font-extrabold text-emerald-600">24</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DISCONNECTED</span>
              <div className="text-xl font-extrabold text-rose-500">4</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL TABLES</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">1,245</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 18% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LAST SYNC</span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Today, 09:05</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-2">Database</th>
                    <th className="py-2.5 px-2">Type</th>
                    <th className="py-2.5 px-2">Host</th>
                    <th className="py-2.5 px-2">Collection</th>
                    <th className="py-2.5 px-2">Tables</th>
                    <th className="py-2.5 px-2">Size</th>
                    <th className="py-2.5 px-2">Owner</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Access</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {databases.map(db => (
                    <tr key={db.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Database size={15} className="text-emerald-500 shrink-0" />
                        <span>{db.name}</span>
                      </td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-50 text-sky-700 border border-sky-200">{db.type}</span></td>
                      <td className="py-3 px-2 font-mono text-slate-500 text-[11px] truncate max-w-[150px]">{db.host}</td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">{db.collection_name}</span></td>
                      <td className="py-3 px-2 font-mono text-slate-700 font-bold">{db.tables_count}</td>
                      <td className="py-3 px-2 font-mono text-slate-500 text-[11px]">{db.size_formatted}</td>
                      <td className="py-3 px-2">{db.owner_name}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${db.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>{db.status}</span>
                      </td>
                      <td className="py-3 px-2">{getAccessBadge(db.access_level)}</td>
                      <td className="py-3 px-2 text-right"><button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><MoreVertical size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500">
              <span>Showing 1 to 8 of 28 databases</span>
              <div className="flex items-center gap-1 font-semibold">
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">1</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">2</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">3</button>
                <span className="px-1 text-slate-400">... 4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED WEBSITES VIEW */}
      {activeTab === 'websites' && (
        <div className="space-y-6">
          {/* 5 KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL WEBSITES</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">76</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 9% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE</span>
              <div className="text-xl font-extrabold text-emerald-600">62</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FAILED</span>
              <div className="text-xl font-extrabold text-rose-500">3</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL PAGES</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">24.8K</div>
              <div className="text-[10px] text-emerald-600 font-mono">↑ 14% vs last month</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LAST CRAWLED</span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Today, 08:45</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-2">Website</th>
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2">Collection</th>
                    <th className="py-2.5 px-2">Frequency</th>
                    <th className="py-2.5 px-2">Last Crawled</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Pages</th>
                    <th className="py-2.5 px-2">Access</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {websites.map(ws => (
                    <tr key={ws.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Globe size={15} className="text-sky-500 shrink-0" />
                        <a href={ws.url} target="_blank" rel="noreferrer" className="hover:underline text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[180px]">{ws.url}</a>
                      </td>
                      <td className="py-3 px-2 text-slate-500 truncate max-w-[160px]">{ws.description}</td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">{ws.collection_name}</span></td>
                      <td className="py-3 px-2 text-slate-600 font-medium">{ws.frequency}</td>
                      <td className="py-3 px-2 font-mono text-slate-400 text-[11px]">{ws.last_crawled_str}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ws.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>{ws.status}</span>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-700 font-bold">{ws.pages_count?.toLocaleString()}</td>
                      <td className="py-3 px-2">{getAccessBadge(ws.access_level)}</td>
                      <td className="py-3 px-2 text-right"><button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><MoreVertical size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500">
              <span>Showing 1 to 8 of 76 websites</span>
              <div className="flex items-center gap-1 font-semibold">
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">1</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">2</button>
                <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-xs">3</button>
                <span className="px-1 text-slate-400">... 10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. ADD KNOWLEDGE MODAL (DYNAMICALLY CUSTOMIZED PER TAB) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                {activeTab === 'collections' && 'Add New Collection'}
                {activeTab === 'all_documents' && 'Add New Document'}
                {activeTab === 'datasets' && 'Add New Dataset'}
                {activeTab === 'databases' && 'Add Database Connection'}
                {activeTab === 'websites' && 'Add Website Source'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {activeTab === 'collections' && 'Collection Name'}
                  {activeTab === 'all_documents' && 'Document Name'}
                  {activeTab === 'datasets' && 'Dataset Name'}
                  {activeTab === 'databases' && 'Connection Name'}
                  {activeTab === 'websites' && 'Website Target URL'}
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={
                    activeTab === 'collections' ? 'e.g. Q4 Financial Audit' :
                    activeTab === 'all_documents' ? 'e.g. Master SLA Agreement 2025.pdf' :
                    activeTab === 'datasets' ? 'e.g. User Behavior Analytics Q3' :
                    activeTab === 'databases' ? 'e.g. Analytics Postgres Cluster' :
                    'e.g. https://docs.zegaai.site'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {activeTab === 'all_documents' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Document Type</label>
                  <select
                    value={newItemExtra1}
                    onChange={(e) => setNewItemExtra1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Document">Document (PDF/Word)</option>
                    <option value="Spreadsheet">Spreadsheet (Excel/CSV)</option>
                    <option value="Presentation">Presentation (PPTX)</option>
                    <option value="Markdown">Markdown / Text</option>
                  </select>
                </div>
              )}

              {activeTab === 'datasets' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                    <input
                      type="text"
                      value={newItemExtra1}
                      onChange={(e) => setNewItemExtra1(e.target.value)}
                      placeholder="e.g. Transaksi penjualan semester 1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Format</label>
                    <select
                      value={newItemExtra2}
                      onChange={(e) => setNewItemExtra2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="CSV">CSV</option>
                      <option value="JSON">JSON</option>
                      <option value="Parquet">Parquet</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'databases' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Database Type</label>
                    <select
                      value={newItemExtra1}
                      onChange={(e) => setNewItemExtra1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="MySQL">MySQL</option>
                      <option value="BigQuery">BigQuery</option>
                      <option value="SQL Server">SQL Server</option>
                      <option value="MongoDB">MongoDB</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Host / URI</label>
                    <input
                      type="text"
                      value={newItemExtra2}
                      onChange={(e) => setNewItemExtra2(e.target.value)}
                      placeholder="e.g. postgres-prod.internal:5432"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'websites' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                    <input
                      type="text"
                      value={newItemExtra1}
                      onChange={(e) => setNewItemExtra1(e.target.value)}
                      placeholder="e.g. Dokumentasi API Perusahaan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Crawl Frequency</label>
                    <select
                      value={newItemExtra2}
                      onChange={(e) => setNewItemExtra2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Realtime">Realtime Sync</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Target Collection</label>
                <select
                  value={newItemCollection}
                  onChange={(e) => setNewItemCollection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">Cancel</button>
                <button onClick={handleCreateNewItem} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer">Save & Index</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC IMPORT MODAL (TAILORED TO PAGE CONTEXT) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Upload size={16} className="text-indigo-600" />
                {activeTab === 'all_documents' && 'Import Documents (PDF, DOCX, XLSX)'}
                {activeTab === 'datasets' && 'Import Structured Datasets (CSV, JSON, Parquet)'}
                {activeTab === 'databases' && 'Import Enterprise Database Connection'}
                {activeTab === 'websites' && 'Import Website Sitemap / Bulk URLs'}
                {activeTab === 'collections' && 'Bulk Import Knowledge Base'}
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs">
              {(activeTab === 'all_documents' || activeTab === 'collections') && (
                <>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2 hover:bg-slate-50/50 cursor-pointer">
                    <Upload size={24} className="mx-auto text-indigo-500" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">Drag & drop document files or click to browse</p>
                    <p className="text-[11px] text-slate-400">Supports PDF, DOCX, XLSX, PPTX, TXT, MD (Max 500MB per file)</p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Target Collection</label>
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                      {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'datasets' && (
                <>
                  <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl p-6 text-center space-y-2 hover:bg-indigo-50/20 cursor-pointer">
                    <Database size={24} className="mx-auto text-indigo-600" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">Upload Dataset File (CSV, JSON, Parquet)</p>
                    <p className="text-[11px] text-slate-400">Automatic schema detection & vector embedding generation</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Delimiter</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <option value="comma">Comma ( , )</option>
                        <option value="semicolon">Semicolon ( ; )</option>
                        <option value="tab">Tab ( \t )</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Header Row</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <option value="yes">First row is header</option>
                        <option value="no">No header</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'databases' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Connection URI / Connection String</label>
                    <input
                      type="text"
                      placeholder="postgresql://user:password@db-cluster.company.com:5432/analytics"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">SSL Mode Required</span>
                    <button onClick={() => onTriggerToast?.('SSL Mode enabled!')} className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[11px]">Enabled</button>
                  </div>
                  <button
                    onClick={() => onTriggerToast?.('Testing DB connection... Connection Successful (12ms)!')}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    Test Connection
                  </button>
                </>
              )}

              {activeTab === 'websites' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Sitemap XML URL or Bulk URLs (One per line)</label>
                    <textarea
                      rows={3}
                      placeholder="https://company.com/sitemap.xml&#10;https://docs.company.com&#10;https://blog.company.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Max Crawl Depth</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <option value="3">3 Levels</option>
                        <option value="5">5 Levels (Deep)</option>
                        <option value="1">1 Level (Exact Page Only)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Crawl Schedule</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">Cancel</button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    onTriggerToast?.(`Import process initiated for ${activeTab.replace('_', ' ')}!`);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {activeTab === 'all_documents' && 'Start Upload & Index'}
                  {activeTab === 'datasets' && 'Import Dataset Schema'}
                  {activeTab === 'databases' && 'Save & Connect DB'}
                  {activeTab === 'websites' && 'Start Web Crawler'}
                  {activeTab === 'collections' && 'Bulk Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC AI ASSISTANT CHAT MODAL (CONTEXTUAL PER TAB) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                {activeTab === 'collections' && 'Enterprise Knowledge AI Assistant'}
                {activeTab === 'all_documents' && 'Document RAG AI Assistant'}
                {activeTab === 'datasets' && 'Dataset Analytics AI Assistant'}
                {activeTab === 'databases' && 'Database Schema & Query AI Assistant'}
                {activeTab === 'websites' && 'Web Scraper & Crawler AI Assistant'}
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900 relative group">
                <button
                  onClick={() => {
                    const text = activeTab === 'collections' ? 'Halo! Saya AI Assistant Knowledge Hub ZEGA. Saya telah mengindeks 42 Koleksi dan 1,216 Dokumen.' :
                                 activeTab === 'all_documents' ? 'Halo! Saya Document RAG Assistant. Saya dapat menganalisis isi 3,128 dokumen PDF/Word perusahaan Anda.' :
                                 activeTab === 'datasets' ? 'Halo! Saya Dataset AI. Tanyakan query agregasi, statistik baris (18.4M rows), atau visualisasi data.' :
                                 activeTab === 'databases' ? 'Halo! Saya Database AI Agent. Saya dapat menginspeksi schema PostgreSQL/MySQL/BigQuery Anda.' :
                                 'Halo! Saya Web Scraper Agent. Saya dapat menganalisis 24.8K halaman web yang telah di-crawl.';
                    handleCopyAiMsg(text);
                  }}
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/80 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                  title="Copy AI Message"
                >
                  {copiedAiMsg ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                </button>
                <p className="font-semibold pr-7">
                  {activeTab === 'collections' && 'Halo! Saya AI Assistant Knowledge Hub ZEGA. Saya telah mengindeks 42 Koleksi dan 1,216 Dokumen.'}
                  {activeTab === 'all_documents' && 'Halo! Saya Document RAG Assistant. Saya dapat menganalisis isi 3,128 dokumen PDF/Word perusahaan Anda.'}
                  {activeTab === 'datasets' && 'Halo! Saya Dataset AI. Tanyakan query agregasi, statistik baris (18.4M rows), atau visualisasi data.'}
                  {activeTab === 'databases' && 'Halo! Saya Database AI Agent. Saya dapat menginspeksi schema PostgreSQL/MySQL/BigQuery Anda.'}
                  {activeTab === 'websites' && 'Halo! Saya Web Scraper Agent. Saya dapat menganalisis 24.8K halaman web yang telah di-crawl.'}
                </p>
                <p className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                  {activeTab === 'all_documents' ? 'Contoh: "Bandingkan SLA policy 2024 vs 2025"' : 'Tanyakan pertanyaan spesifik atau minta rekomendasi analitis.'}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    activeTab === 'all_documents' ? 'Cari klausa atau ringkasan dokumen...' :
                    activeTab === 'datasets' ? 'Tulis pertanyaan SQL atau analitik...' :
                    activeTab === 'databases' ? 'Inspeksi tabel atau query SQL...' :
                    'Tanyakan status crawl website...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button onClick={() => onTriggerToast?.(`AI analyzing ${activeTab.replace('_', ' ')} base...`)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer">Kirim</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. NEW COLLECTION MODAL */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Folder size={16} className="text-indigo-600" /> Create New Collection
              </h3>
              <button onClick={() => setShowNewCollectionModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Collection Name</label>
                <input type="text" placeholder="e.g. Q3 Strategic Planning" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setShowNewCollectionModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer">Cancel</button>
                <button onClick={() => { setShowNewCollectionModal(false); onTriggerToast?.('New Collection created successfully!'); }} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">Create Collection</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
