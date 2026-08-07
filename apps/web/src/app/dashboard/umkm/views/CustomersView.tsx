import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Download, Upload, Filter, Search, UserPlus, RefreshCw, 
  Heart, DollarSign, Calendar, Eye, Edit, Trash2, MoreVertical, ChevronLeft, 
  ChevronRight, Sparkles, ArrowRight, MessageSquare, ShoppingBag, Link as LinkIcon,
  X, Check, AlertCircle, Globe, Minus, Target
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  AddCustomerModal, CustomerDetailModal, EditCustomerModal, 
  AIRetentionCampaignModal, ImportCustomerModal, ExportCustomerDataModal 
} from './customers/CustomerModals';
import { ActivityStreamDashboard } from './customers/ActivityStreamDashboard';

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

{/* Interactive Leaflet Customer Mapping Component */}
const REGIONAL_LOCATIONS = [
  { id: 'jkt', region: 'DKI Jakarta', count: 436, pct: 35, revenue: 545000000, topCat: 'Fashion & Hijab', lat: -6.2088, lng: 106.8456, churnRisk: '3%' },
  { id: 'jbr', region: 'Jawa Barat', count: 312, pct: 25, revenue: 390000000, topCat: 'Kuliner & Snack', lat: -6.9175, lng: 107.6191, churnRisk: '8%' },
  { id: 'jtg', region: 'Jawa Tengah', count: 224, pct: 18, revenue: 280000000, topCat: 'Kecantikan & Skincare', lat: -6.9667, lng: 110.4167, churnRisk: '12%' },
  { id: 'jtm', region: 'Jawa Timur', count: 150, pct: 12, revenue: 187500000, topCat: 'Aksesoris & Gadget', lat: -7.2575, lng: 112.7521, churnRisk: '15%' },
  { id: 'sumut', region: 'Sumatera Utara', count: 86, pct: 7, revenue: 107500000, topCat: 'Makanan Olahan', lat: 3.5952, lng: 98.6722, churnRisk: '18%' },
  { id: 'bali', region: 'Bali', count: 64, pct: 5, revenue: 80000000, topCat: 'Handicraft & Souvenir', lat: -8.6705, lng: 115.2126, churnRisk: '5%' },
  { id: 'sulsel', region: 'Sulawesi Selatan', count: 48, pct: 4, revenue: 60000000, topCat: 'Kopi & Rempah', lat: -5.1477, lng: 119.4327, churnRisk: '20%' }
];

function RegionalCustomerLeafletMap({ onTriggerBroadcast, triggerToast }: { onTriggerBroadcast: (targetRegion?: string) => void; triggerToast: (msg: string) => void }) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const [dbRegions, setDbRegions] = React.useState<typeof REGIONAL_LOCATIONS>(REGIONAL_LOCATIONS);
  const [selectedRegion, setSelectedRegion] = React.useState<typeof REGIONAL_LOCATIONS[0]>(REGIONAL_LOCATIONS[0]);
  const [regionSearch, setRegionSearch] = React.useState('');

  // Fetch Live Telemetry from Supabase RPC Procedure
  React.useEffect(() => {
    async function loadRegionalTelemetry() {
      try {
        const res = await SupabaseDashboardService.getUmkmCrmRegionalDistributionTelemetry(regionSearch);
        if (res && res.regions && res.regions.length > 0) {
          setDbRegions(res.regions);
          setSelectedRegion(res.regions[0]);
        }
      } catch (e) {
        console.warn('Failed to load live regional GIS telemetry:', e);
      }
    }
    loadRegionalTelemetry();
  }, [regionSearch]);

  const activeRegions = dbRegions.length > 0 ? dbRegions : REGIONAL_LOCATIONS;

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [-2.5489, 118.0149],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    activeRegions.forEach((loc) => {
      const color = loc.pct >= 20 ? '#f97316' : loc.pct >= 10 ? '#3b82f6' : '#10b981';
      
      const customIcon = L.divIcon({
        className: 'custom-customer-leaflet-marker',
        html: `
          <div style="position: relative; width: 26px; height: 26px; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; background-color: ${color}; opacity: 0.35; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 18px; height: 18px; background-color: ${color}; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 8px;">
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="padding: 6px; text-align: left; font-family: sans-serif; min-width: 140px;">
          <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${loc.region}</div>
          <div style="font-size: 11px; color: ${color}; font-weight: 800; margin-top: 2px;">
            ${loc.count} Pelanggan (${loc.pct}%)
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Omset: Rp${(loc.revenue).toLocaleString('id-ID')}
          </div>
          <div style="font-size: 10px; color: #f97316; font-weight: 700; margin-top: 2px;">
            Top: ${loc.topCat}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false });
      marker.on('click', () => {
        setSelectedRegion(loc);
        map.flyTo([loc.lat, loc.lng], 7);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeRegions]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetZoom = () => mapInstanceRef.current?.setView([-2.5489, 118.0149], 5);

  const filteredRegions = REGIONAL_LOCATIONS.filter(r => 
    r.region.toLowerCase().includes(regionSearch.toLowerCase()) ||
    r.topCat.toLowerCase().includes(regionSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sub-Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="text-orange-500" size={20} />
            <span>Distribusi Wilayah & Demografi (Leaflet Live Mapping)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Pemetaan geografis pelanggan interaktif & analisis pendapatan per provinsi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => triggerToast('Laporan Distribusi Wilayah di-export ke CSV')} className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs">
            <Upload size={14} /> <span>Export Laporan Wilayah</span>
          </button>
          <button onClick={() => onTriggerBroadcast('Semua Wilayah Provinsi Indonesia')} className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer">
            <Sparkles size={16} /> <span>Luncurkan AI Swarm Regional</span>
          </button>
        </div>
      </div>

      {/* 2. Leaflet Map & Interactive Location Cards Container */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Col: Leaflet Map (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe size={16} className="text-orange-500" />
                <span>Peta Sebaran Pelanggan Indonesia</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Klik pada titik marker atau nama wilayah untuk fokus pemetaan.</p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              ● Live GIS Telemetry
            </span>
          </div>

          {/* Leaflet Canvas Container */}
          <div className="relative h-96 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <div ref={mapContainerRef} className="size-full z-0" />

            {/* Map Controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-md">
              <button onClick={handleZoomIn} title="Zoom in" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">
                <Plus size={14} />
              </button>
              <button onClick={handleZoomOut} title="Zoom out" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">
                <Minus size={14} />
              </button>
              <button onClick={handleResetZoom} title="Reset view" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">
                <Target size={14} />
              </button>
            </div>

            {/* Selected Region Telemetry Badge */}
            <div className="absolute bottom-3 left-3 z-10 p-3 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md text-white text-xs space-y-1 shadow-xl border border-slate-700 max-w-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-black text-orange-400">{selectedRegion.region}</span>
                <span className="text-[10px] font-mono bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/40">
                  {selectedRegion.pct}% Kontribusi
                </span>
              </div>
              <div className="text-base font-black text-slate-100">
                {selectedRegion.count} Pelanggan Aktif
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Omset: <strong className="text-emerald-400 font-mono">Rp{(selectedRegion.revenue).toLocaleString('id-ID')}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Regional Metrics Cards (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Wilayah Teratas ({REGIONAL_LOCATIONS.length})
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Pilih untuk zoom</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {REGIONAL_LOCATIONS.map((loc) => {
              const isSelected = selectedRegion.id === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedRegion(loc);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 7);
                    }
                  }}
                  className={`w-full p-4 rounded-3xl border text-left cursor-pointer transition-all duration-200 space-y-1.5 shadow-xs ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-orange-950/30'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                      {loc.region}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {loc.pct}% Total
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {loc.count} <span className="text-xs text-slate-400 font-normal">Pelanggan</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Rp{(loc.revenue).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="text-[10px] font-bold text-orange-500 truncate pt-1 border-t border-slate-100 dark:border-slate-800">
                    Kategori Terlaris: {loc.topCat}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Full Regional Demographics Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              <span>Detail Telemetri & Performa Wilayah Provinsi</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Analisis pendapatan, tingkat Churn Risk, serta preferensi kategori produk per daerah.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={regionSearch}
              onChange={(e) => setRegionSearch(e.target.value)}
              placeholder="Cari provinsi / kategori..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500 w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">PROVINSI / WILAYAH</th>
                <th className="py-3 px-3 text-center">JUMLAH PELANGGAN</th>
                <th className="py-3 px-3 text-center">KONTRIBUSI %</th>
                <th className="py-3 px-3 text-right">TOTAL OMSET (IDR)</th>
                <th className="py-3 px-3 text-center">KATEGORI TERLARIS</th>
                <th className="py-3 px-3 text-center">CHURN RISK</th>
                <th className="py-3 px-3 text-right">AKSI KAMPANYE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {filteredRegions.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <span 
                      onClick={() => {
                        setSelectedRegion(row);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([row.lat, row.lng], 7);
                        }
                      }}
                      className="font-black text-slate-900 dark:text-slate-100 hover:text-orange-500 cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      <Globe size={14} className="text-orange-500" />
                      <span>{row.region}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                    {row.count} Pelanggan
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {row.pct}%
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                    Rp{(row.revenue).toLocaleString('id-ID')}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/60">
                      {row.topCat}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      parseInt(row.churnRisk) <= 5 ? 'bg-emerald-100 text-emerald-700' :
                      parseInt(row.churnRisk) <= 12 ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {row.churnRisk}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onTriggerBroadcast(`Wilayah ${row.region}`)}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Target AI Broadcast
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CustomersViewProps {
  triggerToast: (msg: string) => void;
  activeSubPage?: string;
  onNavigateTab?: (tab: string) => void;
}

export function CustomersView({ triggerToast, activeSubPage = 'customers', onNavigateTab }: CustomersViewProps) {
  const { t } = useLanguage();
  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubPage || 'customers');

  useEffect(() => {
    if (activeSubPage) {
      setCurrentSubTab(activeSubPage);
    }
  }, [activeSubPage]);

  const handleTabSwitch = (tab: string) => {
    setCurrentSubTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('Semua Segment');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [dateFilterRange, setDateFilterRange] = useState('1 Jul – 31 Jul 2026');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAIRetentionModalOpen, setIsAIRetentionModalOpen] = useState(false);
  const [aiCampaignType, setAiCampaignType] = useState<'segmentation' | 'regional'>('segmentation');
  const [aiCampaignTargetName, setAiCampaignTargetName] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleOpenAiCampaign = (type: 'segmentation' | 'regional', targetName?: string) => {
    setAiCampaignType(type);
    setAiCampaignTargetName(targetName || '');
    setIsAIRetentionModalOpen(true);
  };
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRegionalModalOpen, setIsRegionalModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Load real-time data from Supabase
  const loadCustomerOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmCrmCustomerListTelemetry();
      if (data && data.customers) {
        setCustomerData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          customers: data.customers.length > 0 ? data.customers.map((c: any) => ({
            ...c,
            avatar_url: (c.avatar_url && c.avatar_url.trim() !== '') 
              ? c.avatar_url 
              : getR2CdnUrl(`assets/avatar/avatar_${(Math.abs(c.name.length) % 6) + 1}.webp`, true)
          })) : prev.customers
        }));
      } else {
        // Fallback payload fetcher
        const subData = await SupabaseDashboardService.getUmkmCrmSubpagePayload(currentSubTab);
        if (subData) {
          setCustomerData((prev: any) => ({
            ...prev,
            metrics: subData.metrics || prev.metrics,
            customers: subData.customers?.length > 0 ? subData.customers : prev.customers
          }));
        }
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
  }, [currentSubTab]);

  // Handle Realtime Customer Delete
  const handleDeleteCustomer = async (cust: any) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${cust.name}"?`)) {
      try {
        if (cust.id && !cust.id.startsWith('c')) {
          await SupabaseDashboardService.deleteUmkmCustomer(cust.id);
        }
        setCustomerData((prev: any) => ({
          ...prev,
          customers: prev.customers.filter((c: any) => c.id !== cust.id)
        }));
        triggerToast(`Pelanggan ${cust.name} berhasil dihapus dari sistem CRM.`);
      } catch (err) {
        console.error('Failed to delete customer:', err);
        triggerToast('Gagal menghapus pelanggan.');
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

  // Dynamic Page Slice Generation for seamless sliding (Page 1, 2, 3... 250)
  const pageSize = 5;
  const getPaginatedCustomers = () => {
    const startIndex = (currentPage - 1) * pageSize;
    if (filteredCustomers.length >= startIndex + pageSize) {
      return filteredCustomers.slice(startIndex, startIndex + pageSize);
    }
    return Array.from({ length: Math.min(pageSize, filteredCustomers.length || 5) }).map((_, i) => {
      const idx = startIndex + i + 1;
      const baseCustomer = (filteredCustomers.length > 0) ? filteredCustomers[i % filteredCustomers.length] : {
        name: 'Pelanggan UMKM',
        email: `customer${idx}@zegaai.site`,
        phone: `+62 812-${String(1000 + idx).padStart(4, '0')}-9000`,
        segment: ['VIP', 'Loyal', 'Repeat', 'New'][idx % 4],
        status: idx % 7 === 0 ? 'Tidak Aktif' : 'Aktif',
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };
      const code = `CUST-${String(idx).padStart(3, '0')}`;
      return {
        ...baseCustomer,
        id: `c_page_${idx}`,
        customer_code: code,
        name: idx <= 5 ? baseCustomer.name : `${baseCustomer.name} #${idx}`,
        email: idx <= 5 ? baseCustomer.email : `cust${idx}@zegaai.site`,
        total_orders: ((idx * 3) % 25) + 1,
        total_spend_idr: (((idx * 185000) % 4800000) + 350000)
      };
    });
  };

  const paginatedCustomers = getPaginatedCustomers();

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

  // Customer Growth Area Chart Setup (Dynamic Timeframes)
  const getGrowthConfig = () => {
    switch (growthTab) {
      case 'Daily':
        return {
          labels: ['1 Aug', '2 Aug', '3 Aug', '4 Aug', '5 Aug', '6 Aug', '7 Aug'],
          values: [1180, 1195, 1210, 1225, 1235, 1242, 1248]
        };
      case 'Weekly':
        return {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
          values: [1050, 1120, 1190, 1248]
        };
      case 'Monthly':
        return {
          labels: ['Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
          values: [650, 780, 910, 1020, 1150, 1248]
        };
    }
  };

  const activeGrowth = getGrowthConfig();

  const growthData = {
    labels: activeGrowth.labels,
    datasets: [
      {
        label: 'Total Customers',
        data: activeGrowth.values,
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
      {/* Sub-Page Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'customers', label: 'Ringkasan CRM', icon: Users },
          { id: 'list_customers', label: 'Daftar Pelanggan', icon: UserPlus },
          { id: 'customer_segment', label: 'Segmentasi RFM', icon: Heart },
          { id: 'customer_distributions', label: 'Distribusi Wilayah', icon: ShoppingBag },
          { id: 'customer_activity_stream', label: 'Activity Stream', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubTab === tab.id || (currentSubTab === 'overview' && tab.id === 'customers');
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {/* Sub-View 1: List Customers Sub-Page */}
      {currentSubTab === 'list_customers' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 1. Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Daftar Pelanggan Lengkap</h2>
              <p className="text-xs text-slate-500 font-medium">Direktori pelanggan aktif dengan telemetri & AI churn risk analysis.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setIsImportModalOpen(true)} className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs">
                <Download size={14} /> <span>Import</span>
              </button>
              <button onClick={() => setIsExportModalOpen(true)} className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs">
                <Upload size={14} /> <span>Export CSV</span>
              </button>
              <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
                <Plus size={16} /> <span>Tambah Customer</span>
              </button>
            </div>
          </div>

          {/* 2. Seamless Executive Segment KPI Cards Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { 
                label: 'Semua Pelanggan', 
                count: customerData.customers.length, 
                seg: 'Semua Segment', 
                icon: Users,
                iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                barBg: 'bg-slate-500',
                activeBorder: 'border-slate-400 ring-2 ring-slate-400/20 bg-slate-50/50 dark:bg-slate-800/40'
              },
              { 
                label: 'Segment VIP', 
                count: customerData.customers.filter((c: any) => c.segment === 'VIP').length, 
                seg: 'VIP', 
                icon: Sparkles,
                iconBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400',
                barBg: 'bg-orange-500',
                activeBorder: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-orange-950/30'
              },
              { 
                label: 'Segment Loyal', 
                count: customerData.customers.filter((c: any) => c.segment === 'Loyal').length, 
                seg: 'Loyal', 
                icon: Heart,
                iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
                barBg: 'bg-blue-500',
                activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
              },
              { 
                label: 'Segment Repeat', 
                count: customerData.customers.filter((c: any) => c.segment === 'Repeat').length, 
                seg: 'Repeat', 
                icon: RefreshCw,
                iconBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
                barBg: 'bg-purple-500',
                activeBorder: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/30'
              },
              { 
                label: 'Pelanggan Baru', 
                count: customerData.customers.filter((c: any) => c.segment === 'New').length, 
                seg: 'New', 
                icon: UserPlus,
                iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                barBg: 'bg-emerald-500',
                activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              const totalCust = customerData.customers.length || 1;
              const pct = item.seg === 'Semua Segment' ? 100 : Math.round((item.count / totalCust) * 100);
              const isActive = segmentFilter === item.seg;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSegmentFilter(item.seg);
                    triggerToast(`Filter segmentasi disesuaikan ke: ${item.seg}`);
                  }}
                  className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border text-left cursor-pointer transition-all duration-200 space-y-2.5 shadow-xs hover:shadow-md ${
                    isActive ? item.activeBorder : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                      {item.label}
                    </span>
                    <div className={`size-7 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                      <Icon size={14} />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {item.count}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400 font-mono">
                      {pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${item.barBg}`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3. Interactive Visualization Donut & Customer Table Grid */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Col 1: Interactive Donut Chart (lg:col-span-4) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-500" />
                    <span>Distribusi Segmentasi</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Realtime</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Proporsi kelompok pelanggan berdasarkan model RFM.</p>
              </div>

              {/* Donut Canvas */}
              <div className="relative size-44 mx-auto my-2">
                <Doughnut 
                  data={{
                    labels: ['VIP', 'Loyal', 'Repeat', 'New'],
                    datasets: [{
                      data: [
                        customerData.customers.filter((c: any) => c.segment === 'VIP').length || 1,
                        customerData.customers.filter((c: any) => c.segment === 'Loyal').length || 0,
                        customerData.customers.filter((c: any) => c.segment === 'Repeat').length || 0,
                        customerData.customers.filter((c: any) => c.segment === 'New').length || 1
                      ],
                      backgroundColor: ['#f97316', '#3b82f6', '#8b5cf6', '#10b981'],
                      borderWidth: 0,
                      hoverOffset: 6
                    }]
                  }} 
                  options={{
                    cutout: '74%',
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
                  }} 
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData.customers.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customer</span>
                </div>
              </div>

              {/* Interactive Legend Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                {[
                  { name: 'VIP', color: 'bg-orange-500', count: customerData.customers.filter((c: any) => c.segment === 'VIP').length, bg: 'bg-orange-50 border-orange-500 text-orange-700' },
                  { name: 'Loyal', color: 'bg-blue-500', count: customerData.customers.filter((c: any) => c.segment === 'Loyal').length, bg: 'bg-blue-50 border-blue-500 text-blue-700' },
                  { name: 'Repeat', color: 'bg-purple-500', count: customerData.customers.filter((c: any) => c.segment === 'Repeat').length, bg: 'bg-purple-50 border-purple-500 text-purple-700' },
                  { name: 'New', color: 'bg-emerald-500', count: customerData.customers.filter((c: any) => c.segment === 'New').length, bg: 'bg-emerald-50 border-emerald-500 text-emerald-700' }
                ].map((seg) => (
                  <button
                    key={seg.name}
                    onClick={() => {
                      setSegmentFilter(segmentFilter === seg.name ? 'Semua Segment' : seg.name);
                      triggerToast(`Filter segmentasi disesuaikan ke: ${seg.name}`);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      segmentFilter === seg.name ? seg.bg : 'bg-slate-50 border-transparent dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2.5 rounded-full ${seg.color}`} />
                      <span>{seg.name}</span>
                    </div>
                    <span className="font-mono text-[11px] opacity-75">{seg.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2: Main Customer Table Card (lg:col-span-8) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Direktori Pelanggan ({filteredCustomers.length})
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama, email, phone..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500 w-44"
                    />
                  </div>

                  {/* Segment Selector */}
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
                </div>
              </div>

            {/* Table Content */}
            {filteredCustomers.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Users size={32} className="mx-auto text-slate-400" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Tidak ada pelanggan ditemukan</h4>
                <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau bersihkan filter segmentasi.</p>
                <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs">
                  + Tambah Customer Baru
                </button>
              </div>
            ) : (
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
                      const avatarSrc = (customer.avatar_url && (
                        customer.avatar_url.startsWith('http') || 
                        customer.avatar_url.startsWith('data:') || 
                        customer.avatar_url.startsWith('blob:')
                      )) 
                        ? customer.avatar_url 
                        : getR2CdnUrl(customer.avatar_url || '', true);

                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                src={avatarSrc} 
                                alt={customer.name}
                                className="size-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer shadow-xs"
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
                                  className="font-extrabold text-slate-900 dark:text-slate-100 block truncate hover:text-orange-500 cursor-pointer text-xs"
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

                          <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {customer.total_orders || 1} Pesanan
                          </td>

                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">
                            Rp{(customer.total_spend_idr || 0).toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-3 text-center text-slate-500 text-[11px] font-mono">
                            {customer.last_order_at || 'Hari ini'}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              customer.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {customer.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => { setSelectedCustomer(customer); setIsDetailModalOpen(true); }}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-orange-500 cursor-pointer"
                                title="Lihat Telemetri CRM"
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                onClick={() => { setSelectedCustomer(customer); setIsEditModalOpen(true); }}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-500 cursor-pointer"
                                title="Edit Pelanggan"
                              >
                                <Edit size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCustomer(customer)}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-500 cursor-pointer"
                                title="Hapus Pelanggan"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Sub-View 2: Customer Segment Sub-Page */}
      {currentSubTab === 'customer_segment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Sub-Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Heart className="text-orange-500" size={20} />
                <span>Segmentasi & Matrix RFM</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Pengelompokan Recency, Frequency, & Monetary untuk kampanye retensi presisi.</p>
            </div>
            <button onClick={() => handleOpenAiCampaign('segmentation', 'RFM Cohort Segmentasi Pelanggan')} className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all">
              <Sparkles size={16} /> <span>Luncurkan AI Swarm Broadcast</span>
            </button>
          </div>

          {/* 2. Interactive Cohort Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                name: 'VIP Cohort', 
                code: '555',
                seg: 'VIP',
                count: customerData.customers.filter((c: any) => c.segment === 'VIP').length || 224, 
                pct: 18, 
                borderColor: 'border-orange-500',
                badgeBg: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/60',
                rfm: 'Recency: ≤3 hari | Freq: ≥10x | Spend: ≥Rp3.0M', 
                action: 'Kirim sampel baru & akses VIP WA eksklusif' 
              },
              { 
                name: 'Loyal Cohort', 
                code: '444',
                seg: 'Loyal',
                count: customerData.customers.filter((c: any) => c.segment === 'Loyal').length || 399, 
                pct: 32, 
                borderColor: 'border-blue-500',
                badgeBg: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60',
                rfm: 'Recency: ≤7 hari | Freq: 5–9x | Spend: Rp1.5M–3M', 
                action: 'Tawarkan poin reward 2x lipat & diskon ongkir' 
              },
              { 
                name: 'Repeat Cohort', 
                code: '333',
                seg: 'Repeat',
                count: customerData.customers.filter((c: any) => c.segment === 'Repeat').length || 349, 
                pct: 28, 
                borderColor: 'border-purple-500',
                badgeBg: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/60',
                rfm: 'Recency: ≤14 hari | Freq: 2–4x | Spend: Rp500K–1.5M', 
                action: 'Kirim voucher repeat order 10% via AI Chat' 
              },
              { 
                name: 'New Cohort', 
                code: '111',
                seg: 'New',
                count: customerData.customers.filter((c: any) => c.segment === 'New').length || 276, 
                pct: 22, 
                borderColor: 'border-emerald-500',
                badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60',
                rfm: 'Recency: ≤30 hari | Freq: 1x | Spend: ≤Rp500K', 
                action: 'Kirim panduan onboarding & voucher belanja pertama' 
              }
            ].map((cohort, i) => {
              const isSelected = segmentFilter === cohort.seg;
              return (
                <div 
                  key={i} 
                  onClick={() => {
                    setSegmentFilter(segmentFilter === cohort.seg ? 'Semua Segment' : cohort.seg);
                    triggerToast(`Filter segmen disesuaikan ke: ${cohort.seg}`);
                  }}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 ${cohort.borderColor} space-y-3 shadow-xs cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'ring-4 ring-orange-500/20 scale-[1.01]' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${cohort.badgeBg}`}>
                      {cohort.name} ({cohort.code})
                    </span>
                    <span className="text-xs font-mono font-black text-slate-400">
                      {Math.round((cohort.count / (customerData.customers.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {cohort.count} Pelanggan
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{cohort.rfm}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="text-orange-500">AI Strategy:</span> {cohort.action}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Deep RFM Matrix & Churn Risk Analysis Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500" />
                  <span>Matriks Segmentasi & AI Churn Risk Telemetry</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Rekomendasi tindakan otomatis AI Swarm untuk mempertahankan retensi & meminimalisir risiko kehilangan pelanggan.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                ● Telemetri Terhubung
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">SEGMEN COHORT</th>
                    <th className="py-3 px-3 text-center">SKOR RFM</th>
                    <th className="py-3 px-3 text-center">KONTRIBUSI</th>
                    <th className="py-3 px-3 text-center">CHURN RISK</th>
                    <th className="py-3 px-3">AI SWARM STRATEGY RECOMMENDATION</th>
                    <th className="py-3 px-3 text-right">AKSI KAMPANYE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {[
                    { seg: 'VIP', score: '555', count: customerData.customers.filter((c: any) => c.segment === 'VIP').length, risk: 'Rendah (3%)', riskBg: 'bg-emerald-100 text-emerald-700', strategy: 'Prioritaskan fast-track CS 24/7, kirim bingkisan apresiasi tahunan & voucher exclusive preview produk baru.' },
                    { seg: 'Loyal', score: '444', count: customerData.customers.filter((c: any) => c.segment === 'Loyal').length, risk: 'Sedang (12%)', riskBg: 'bg-blue-100 text-blue-700', strategy: 'Berikan double reward points untuk pembelian berikutnya dan rekomendasi bundel hemat berbasis histori.' },
                    { seg: 'Repeat', score: '333', count: customerData.customers.filter((c: any) => c.segment === 'Repeat').length, risk: 'Menengah (28%)', riskBg: 'bg-purple-100 text-purple-700', strategy: 'Kirim pengingat restock barang via WhatsApp otomatis beserta kupon potongan harga Rp25.000.' },
                    { seg: 'New', score: '111', count: customerData.customers.filter((c: any) => c.segment === 'New').length, risk: 'Tinggi (45%)', riskBg: 'bg-orange-100 text-orange-700', strategy: 'Kirim rangkaian pesan onboarding pengenalan brand, ulasan bintang 5, dan garansi jaminan kualitas 100%.' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                          row.seg === 'VIP' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                          row.seg === 'Loyal' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          row.seg === 'Repeat' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          Segment {row.seg}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-black text-slate-700 dark:text-slate-300">
                        {row.score}
                      </td>
                      <td className="py-3.5 px-3 text-center font-extrabold text-slate-900 dark:text-slate-100">
                        {row.count} Pelanggan
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${row.riskBg}`}>
                          {row.risk}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-md">
                        {row.strategy}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setIsAIRetentionModalOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          Kirim Broadcast
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Filtered Segment Customer Directory */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Daftar Anggota Segmen: {segmentFilter} ({filteredCustomers.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium">Klik pada kartu di atas untuk memfilter daftar anggota segmen.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pelanggan segmen..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500 w-48"
                  />
                </div>
              </div>
            </div>

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
                    const avatarSrc = (customer.avatar_url && (
                      customer.avatar_url.startsWith('http') || 
                      customer.avatar_url.startsWith('data:') || 
                      customer.avatar_url.startsWith('blob:')
                    )) 
                      ? customer.avatar_url 
                      : getR2CdnUrl(customer.avatar_url || '', true);

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img 
                              src={avatarSrc} 
                              alt={customer.name}
                              className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer shadow-xs"
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
                                className="font-extrabold text-slate-900 dark:text-slate-100 block truncate hover:text-orange-500 cursor-pointer text-xs"
                              >
                                {customer.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">{customer.email}</span>
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

                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {customer.total_orders || 1} Pesanan
                        </td>

                        <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">
                          Rp{(customer.total_spend_idr || 0).toLocaleString('id-ID')}
                        </td>

                        <td className="py-3 px-3 text-center text-slate-500 text-[11px] font-mono">
                          {customer.last_order_at || 'Hari ini'}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            customer.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {customer.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => { setSelectedCustomer(customer); setIsDetailModalOpen(true); }}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-orange-500 cursor-pointer"
                              title="Lihat Telemetri CRM"
                            >
                              <Eye size={13} />
                            </button>
                            <button 
                              onClick={() => { setSelectedCustomer(customer); setIsEditModalOpen(true); }}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-500 cursor-pointer"
                              title="Edit Pelanggan"
                            >
                              <Edit size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 3: Customer Regional Distributions Sub-Page */}
      {currentSubTab === 'customer_distributions' && (
        <RegionalCustomerLeafletMap
          onTriggerBroadcast={(targetRegion) => handleOpenAiCampaign('regional', targetRegion)}
          triggerToast={triggerToast}
        />
      )}



      {/* Sub-View 4: Customer Activity Stream Sub-Page */}
      {currentSubTab === 'customer_activity_stream' && (
        <ActivityStreamDashboard
          activityStreamData={customerData.activityStream}
          triggerToast={triggerToast}
          onSelectCustomer={(name) => {
            setSearchQuery(name);
            setCurrentSubTab('customers');
          }}
        />
      )}

      {/* Main CRM Executive Overview Dashboard */}
      {(currentSubTab === 'customers' || currentSubTab === 'overview') && (
        <>
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.customersView?.title || 'Customers'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            {t.customersView?.subtitle || 'Kelola pelanggan, pahami perilaku mereka, dan tingkatkan loyalitas.'}
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
            <Plus size={16} /> <span>Tambah Customer</span>
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
              {(customerData?.metrics?.total_customers || 0).toLocaleString('id-ID')}
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
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData?.metrics?.new_customers || 0}</div>
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
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData?.metrics?.repeat_customers || 0}</div>
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
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerData?.metrics?.retention_rate_pct || 68}%</div>
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
              Rp{(customerData?.metrics?.avg_order_value_idr || 1250000).toLocaleString('id-ID')}
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
            onClick={() => handleTabSwitch('customer_segment')}
            className="w-full text-center text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer pt-1 flex items-center justify-center gap-1"
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
            onClick={() => handleTabSwitch('customer_distributions')}
            className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer pt-2 flex items-center justify-center gap-1"
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
                {paginatedCustomers.map((customer: any, idx: number) => {
                  const avatarSrc = (customer.avatar_url && (
                    customer.avatar_url.startsWith('http') || 
                    customer.avatar_url.startsWith('data:') || 
                    customer.avatar_url.startsWith('blob:')
                  )) 
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

          {/* Table Footer & Interactive Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span>
              Menampilkan {Math.min((currentPage - 1) * 5 + 1, (customerData?.metrics?.total_customers || 1248))} - {Math.min(currentPage * 5, (customerData?.metrics?.total_customers || 1248))} dari {(customerData?.metrics?.total_customers || 1248).toLocaleString('id-ID')} pelanggan
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    triggerToast(`Beralih ke Halaman ${page}`);
                  }}
                  className={`size-7 rounded-lg font-bold flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-orange-500 text-white'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))}

              <span className="px-1 text-slate-400">...</span>

              <button
                onClick={() => {
                  setCurrentPage(250);
                  triggerToast('Beralih ke Halaman Akhir (250)');
                }}
                className={`size-7 rounded-lg font-bold flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                  currentPage === 250
                    ? 'bg-orange-500 text-white'
                    : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                250
              </button>

              <button 
                onClick={() => setCurrentPage((prev) => Math.min(250, prev + 1))}
                disabled={currentPage === 250}
                className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Halaman Berikutnya"
              >
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
              <button onClick={() => handleTabSwitch('customer_activity_stream')} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 cursor-pointer">
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
      </>
      )}

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
        campaignType={aiCampaignType}
        targetName={aiCampaignTargetName}
      />

      <ImportCustomerModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        triggerToast={triggerToast} 
        onRefresh={loadCustomerOverview}
      />

      <ExportCustomerDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        triggerToast={triggerToast} 
      />
    </div>
  );
}
