import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Download, Upload, Filter, Search, UserPlus, RefreshCw, 
  Heart, DollarSign, Calendar, Eye, Edit, Trash2, MoreVertical, ChevronLeft, 
  ChevronRight, Sparkles, ArrowRight, MessageSquare, ShoppingBag, Link as LinkIcon,
  X, Check, AlertCircle
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  AddCustomerModal, EditCustomerModal, CustomerDetailModal, 
  AIRetentionCampaignModal, ImportCustomerModal, ExportCustomerDataModal 
} from './customers/CustomerModals';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CustomersViewProps {
  triggerToast: (msg: string) => void;
}

export function CustomersView({ triggerToast }: CustomersViewProps) {
  const [customerData, setCustomerData] = useState<any>({
    metrics: {
      total_customers: 1248,
      new_customers: 126,
      repeat_customers: 312,
      retention_rate_pct: 68,
      avg_order_value_idr: 1250000.00
    },
    segments: [
      { name: 'VIP', percentage: 18, count: 224, color: '#f97316' },
      { name: 'Loyal', percentage: 32, count: 399, color: '#3b82f6' },
      { name: 'Repeat', percentage: 28, count: 349, color: '#8b5cf6' },
      { name: 'New', percentage: 22, count: 276, color: '#10b981' }
    ],
    growth: [
      { period_label: '1 Jul', total_customers: 250 },
      { period_label: '6 Jul', total_customers: 480 },
      { period_label: '11 Jul', total_customers: 750 },
      { period_label: '16 Jul', total_customers: 1020 },
      { period_label: '21 Jul', total_customers: 1150 },
      { period_label: '26 Jul', total_customers: 1200 },
      { period_label: '31 Jul', total_customers: 1248 }
    ],
    customers: [
      { id: 'c1', name: 'Siti Aisyah', email: 'siti.aisyah@email.com', phone: '+62 812-3456-7890', segment: 'VIP', total_orders: 12, total_spend_idr: 3200000, last_order_at: '28 Jul 2026', status: 'Aktif', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { id: 'c2', name: 'Budi Santoso', email: 'budi.santoso@email.com', phone: '+62 813-2345-6789', segment: 'Loyal', total_orders: 9, total_spend_idr: 2180000, last_order_at: '27 Jul 2026', status: 'Aktif', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'c3', name: 'Dewi Lestari', email: 'dewi.lestari@email.com', phone: '+62 821-3456-9876', segment: 'Repeat', total_orders: 8, total_spend_idr: 1950000, last_order_at: '26 Jul 2026', status: 'Aktif', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'c4', name: 'Rizky Pratama', email: 'rizky.pratama@email.com', phone: '+62 822-4567-8901', segment: 'Repeat', total_orders: 7, total_spend_idr: 1120000, last_order_at: '26 Jul 2026', status: 'Tidak Aktif', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { id: 'c5', name: 'Maya Putri', email: 'maya.putri@email.com', phone: '+62 823-5678-9012', segment: 'New', total_orders: 6, total_spend_idr: 1450000, last_order_at: '25 Jul 2026', status: 'Aktif', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }
    ],
    activityStream: [
      { id: 'a1', customer_name: 'Siti Aisyah', action_description: 'Melakukan pembelian Rp450.000', time_ago: '2 jam lalu', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { id: 'a2', customer_name: 'Budi Santoso', action_description: 'Membuka pesan WhatsApp promo', time_ago: '3 jam lalu', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'a3', customer_name: 'Dewi Lestari', action_description: 'Klik link promo diskon', time_ago: '5 jam lalu', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'a4', customer_name: 'Rizky Pratama', action_description: 'Menambahkan produk ke keranjang', time_ago: '1 hari lalu', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { id: 'a5', customer_name: 'Maya Putri', action_description: 'Mendaftar sebagai pelanggan baru', time_ago: '1 hari lalu', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }
    ],
    regionalDistribution: [
      { region: 'Jakarta', percentage: 35 },
      { region: 'Jawa Barat', percentage: 25 },
      { region: 'Jawa Tengah', percentage: 18 },
      { region: 'Jawa Timur', percentage: 12 },
      { region: 'Lainnya', percentage: 10 }
    ]
  });

  const [growthTab, setGrowthTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('Semua Segment');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [dateFilterRange, setDateFilterRange] = useState('1 Jul – 31 Jul 2026');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAIRetentionModalOpen, setIsAIRetentionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRegionalModalOpen, setIsRegionalModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Load real-time data from Supabase
  const loadCustomerOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmCustomersOverview();
      if (data) {
        setCustomerData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          customers: data.customers?.length > 0 ? data.customers.map((c: any) => ({
            ...c,
            avatar_url: (c.avatar_url && c.avatar_url.startsWith('http')) ? c.avatar_url : (
              c.name === 'Siti Aisyah' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' :
              c.name === 'Budi Santoso' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' :
              c.name === 'Dewi Lestari' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' :
              c.name === 'Rizky Pratama' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' :
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
            )
          })) : prev.customers,
          activityStream: data.activityStream?.length > 0 ? data.activityStream.map((a: any) => ({
            ...a,
            avatar_url: (a.avatar_url && a.avatar_url.startsWith('http')) ? a.avatar_url : (
              a.customer_name === 'Siti Aisyah' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' :
              a.customer_name === 'Budi Santoso' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' :
              a.customer_name === 'Dewi Lestari' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' :
              a.customer_name === 'Rizky Pratama' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' :
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
            )
          })) : prev.activityStream
        }));
      }
    } catch (e) {
      console.warn('Customer overview load error:', e);
    }
  };

  useEffect(() => {
    loadCustomerOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToCustomersRealtime(() => {
      loadCustomerOverview();
    });
    return () => unsubscribe();
  }, []);

  // Handle Realtime Customer Delete
  const handleDeleteCustomer = async (cust: any) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${cust.name}"?`)) {
      try {
        if (cust.id && !cust.id.startsWith('c')) {
          await SupabaseDashboardService.deleteCustomer(cust.id);
        }
        setCustomerData((prev: any) => ({
          ...prev,
          customers: prev.customers.filter((c: any) => c.id !== cust.id)
        }));
        triggerToast(`✓ Pelanggan "${cust.name}" berhasil dihapus`);
      } catch (err) {
        triggerToast('⚠️ Gagal menghapus pelanggan');
      }
    }
  };

  // Filtered customers table
  const filteredCustomers = customerData.customers.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.phone && c.phone.includes(searchQuery));
    const matchesSegment = segmentFilter === 'Semua Segment' || c.segment === segmentFilter;
    const matchesStatus = statusFilter === 'Semua Status' || c.status === statusFilter;
    return matchesSearch && matchesSegment && matchesStatus;
  });

  // Customer Segment Donut Setup
  const donutData = {
    labels: ['VIP', 'Loyal', 'Repeat', 'New'],
    datasets: [
      {
        data: [18, 32, 28, 22],
        backgroundColor: ['#f97316', '#3b82f6', '#8b5cf6', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const donutOptions = {
    cutout: '76%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        bodyFont: { size: 11, weight: 'bold' as const },
        cornerRadius: 10
      }
    }
  };

  // Customer Growth Area Chart Setup
  const growthLabels = customerData.growth.map((g: any) => g.period_label);
  const growthValues = customerData.growth.map((g: any) => g.total_customers);

  const growthData = {
    labels: growthLabels,
    datasets: [
      {
        label: 'Total Customers',
        data: growthValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  const growthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 11, weight: 'normal' as const },
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (ctx: any) => ` Total Customers: ${ctx.parsed.y.toLocaleString('id-ID')}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          color: '#94a3b8',
          callback: (val: any) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Customers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Kelola pelanggan, pahami perilaku mereka, dan tingkatkan loyalitas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Badge (Interactive Selector) */}
          <button
            onClick={() => {
              const ranges = ['1 Jul – 31 Jul 2026', '1 Jun – 30 Jun 2026', 'Tahun 2026'];
              const next = ranges[(ranges.indexOf(dateFilterRange) + 1) % ranges.length];
              setDateFilterRange(next);
              triggerToast(`Periode Laporan disesuaikan ke: ${next}`);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 shadow-xs hover:border-orange-500 cursor-pointer transition-colors"
          >
            <Calendar size={14} className="text-orange-500" />
            <span>{dateFilterRange}</span>
          </button>

          <button 
            onClick={() => {
              setSegmentFilter(segmentFilter === 'Semua Segment' ? 'VIP' : 'Semua Segment');
              triggerToast(segmentFilter === 'Semua Segment' ? 'Filter Segment: VIP' : 'Filter Reset: Semua Segment');
            }}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Filter size={14} /> <span>Filter ({segmentFilter})</span>
          </button>

          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Download size={14} /> <span>Import Customers</span>
          </button>

          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Upload size={14} /> <span>Export Data</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus size={16} /> <span>+ Tambah Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Customers */}
        <div 
          onClick={() => { setSegmentFilter('Semua Segment'); triggerToast('Menampilkan seluruh basis pelanggan'); }} 
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-orange-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Total Customers</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {customerData.metrics.total_customers.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 12% vs last month</div>
          </div>
        </div>

        {/* Card 2: New Customers */}
        <div 
          onClick={() => { setSegmentFilter('New'); triggerToast('Filter: Pelanggan Baru (New)'); }} 
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-blue-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>New Customers</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <UserPlus size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData.metrics.new_customers}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 15% vs last month</div>
          </div>
        </div>

        {/* Card 3: Repeat Customers */}
        <div 
          onClick={() => { setSegmentFilter('Repeat'); triggerToast('Filter: Pelanggan Repeat'); }} 
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-purple-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Repeat Customers</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <RefreshCw size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData.metrics.repeat_customers}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 22% vs last month</div>
          </div>
        </div>

        {/* Card 4: Retention Rate */}
        <div 
          onClick={() => { setIsAIRetentionModalOpen(true); }} 
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-pink-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Retention Rate</span>
            <div className="size-8 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400 flex items-center justify-center">
              <Heart size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData.metrics.retention_rate_pct}%</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 5% vs last month</div>
          </div>
        </div>

        {/* Card 5: Avg. Order Value */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Avg. Order Value</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(customerData.metrics.avg_order_value_idr).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 8% vs last month</div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Donut Chart, Area Chart, & Distribusi Pelanggan */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Col 1: Customer Segment Donut (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Customer Segment</h3>

          {/* Donut Canvas */}
          <div className="relative size-40 mx-auto">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">1.248</span>
              <span className="text-[10px] font-bold text-slate-400">Total</span>
            </div>
          </div>

          {/* Legend Grid (Interactive Segment Filters) */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
            <button 
              onClick={() => setSegmentFilter('VIP')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                segmentFilter === 'VIP' ? 'bg-orange-50 border-orange-500 dark:bg-orange-950/60' : 'bg-slate-50 border-transparent dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-700 dark:text-slate-300">VIP</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">18% (224)</span>
            </button>

            <button 
              onClick={() => setSegmentFilter('Loyal')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                segmentFilter === 'Loyal' ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/60' : 'bg-slate-50 border-transparent dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-700 dark:text-slate-300">Loyal</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">32% (399)</span>
            </button>

            <button 
              onClick={() => setSegmentFilter('Repeat')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                segmentFilter === 'Repeat' ? 'bg-purple-50 border-purple-500 dark:bg-purple-950/60' : 'bg-slate-50 border-transparent dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-700 dark:text-slate-300">Repeat</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">28% (349)</span>
            </button>

            <button 
              onClick={() => setSegmentFilter('New')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                segmentFilter === 'New' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/60' : 'bg-slate-50 border-transparent dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300">New</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">22% (276)</span>
            </button>
          </div>

          <button 
            onClick={() => { setSegmentFilter('Semua Segment'); triggerToast('Menampilkan seluruh segmentasi'); }}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>Lihat Semua Segmentasi</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Col 2: Customer Growth Area Chart (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Customer Growth</h3>

            {/* Time Horizon Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-extrabold">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGrowthTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    growthTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <Line data={growthData} options={growthOptions} />
          </div>
        </div>

        {/* Col 3: Distribusi Pelanggan Progress Bars (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Distribusi Pelanggan</h3>

            <div className="space-y-3.5 text-xs font-bold">
              {customerData.regionalDistribution.map((item: any, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px]">
                    <span>{item.region}</span>
                    <span className="font-mono text-slate-500">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsRegionalModalOpen(true)}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>Lihat Selengkapnya</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Bottom Section: Main Customers Table & Side Panels */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Main Customer Table (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Daftar Pelanggan</h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pelanggan..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500 w-44"
                />
              </div>

              {/* Segment Filter */}
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Semua Segment">Semua Segment</option>
                <option value="VIP">VIP</option>
                <option value="Loyal">Loyal</option>
                <option value="Repeat">Repeat</option>
                <option value="New">New</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>

              {/* Filter Button */}
              <button 
                onClick={() => triggerToast(`Status Filter: ${statusFilter}, Segment: ${segmentFilter}`)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <Filter size={12} /> <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Table Rendering */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">PELANGGAN</th>
                  <th className="py-2.5 px-3 text-center">SEGMENT</th>
                  <th className="py-2.5 px-3 text-center">TOTAL ORDER</th>
                  <th className="py-2.5 px-3 text-right">TOTAL SPEND</th>
                  <th className="py-2.5 px-3 text-center">LAST ORDER</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((customer: any, idx: number) => {
                  const avatarSrc = (customer.avatar_url && customer.avatar_url.startsWith('http')) 
                    ? customer.avatar_url 
                    : getR2CdnUrl(customer.avatar_url || '', true);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={avatarSrc} 
                            alt={customer.name}
                            className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer shadow-xs"
                            loading="lazy"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDetailModalOpen(true);
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = generateInitialsAvatar(customer.name);
                            }}
                          />
                          <div className="min-w-0">
                            <span 
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsDetailModalOpen(true);
                              }}
                              className="font-extrabold text-slate-900 dark:text-slate-100 block truncate hover:text-orange-500 cursor-pointer"
                            >
                              {customer.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">{customer.email} • {customer.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          customer.segment === 'VIP' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/60' :
                          customer.segment === 'Loyal' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60' :
                          customer.segment === 'Repeat' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/60' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60'
                        }`}>
                          {customer.segment}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold text-slate-900 dark:text-slate-100">
                        {customer.total_orders}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                        Rp{(customer.total_spend_idr || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                        {customer.last_order_at || '28 Jul 2026'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          customer.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                        }`}>
                          {customer.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400">
                          {/* Eye / View Detail Button */}
                          <button 
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDetailModalOpen(true);
                            }} 
                            className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                            title="Lihat Detail CRM"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit Button */}
                          <button 
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsEditModalOpen(true);
                            }} 
                            className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit Profil"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDeleteCustomer(customer)} 
                            className="p-1 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span>Menampilkan 1 - {filteredCustomers.length} dari {customerData.metrics.total_customers.toLocaleString('id-ID')} pelanggan</span>
            <div className="flex items-center gap-1">
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <button className="size-7 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center shadow-xs">1</button>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">2</button>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">3</button>
              <span className="px-1 text-slate-400">...</span>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">250</button>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel Column (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Customer Activity Stream Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Customer Activity Stream</h3>
              <button onClick={() => triggerToast('Log Aktivitas diperbarui (Realtime active)')} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {customerData.activityStream.map((a: any, i: number) => {
                const avatarSrc = (a.avatar_url && a.avatar_url.startsWith('http')) 
                  ? a.avatar_url 
                  : getR2CdnUrl(a.avatar_url || '', true);

                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={avatarSrc} 
                        alt={a.customer_name} 
                        className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = generateInitialsAvatar(a.customer_name);
                        }}
                      />
                      <div className="truncate min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{a.customer_name}</span>
                        <span className="text-slate-500 font-medium ml-1 text-[11px] block truncate">{a.action_description}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 flex-shrink-0 ml-2">{a.time_ago}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Customer Insight Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">AI Customer Insight</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              312 pelanggan belum repeat order lebih dari 30 hari. Potensi revenue hilang: <span className="font-black text-slate-900 dark:text-slate-100">Rp4.120.000</span>
            </p>
            <button 
              onClick={() => setIsAIRetentionModalOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={14} className="text-orange-500" />
              <span>Lihat Rekomendasi AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Regional Distribution Modal */}
      {isRegionalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Distribusi Wilayah Pelanggan</h3>
              <button onClick={() => setIsRegionalModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs font-bold">
              {customerData.regionalDistribution.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-800 dark:text-slate-200">{item.region}</span>
                  <span className="text-emerald-600 font-mono font-black">{item.percentage}% ({Math.round(1248 * item.percentage / 100)} Pelanggan)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Modals */}
      <AddCustomerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        triggerToast={triggerToast} 
        onRefresh={loadCustomerOverview} 
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadCustomerOverview}
        customer={selectedCustomer}
      />

      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        triggerToast={triggerToast}
        customer={selectedCustomer}
      />

      <AIRetentionCampaignModal
        isOpen={isAIRetentionModalOpen}
        onClose={() => setIsAIRetentionModalOpen(false)}
        triggerToast={triggerToast}
      />

      <ImportCustomerModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        triggerToast={triggerToast} 
      />

      <ExportCustomerDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        triggerToast={triggerToast} 
      />
    </div>
  );
}
