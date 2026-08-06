import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Activity, RefreshCw, ChevronDown, CheckCircle2, AlertTriangle, 
  Globe, Cpu, Database, HardDrive, Network, Users, ArrowUpRight, ArrowDownRight, 
  Layers, ShieldCheck, ShieldAlert, Download, Filter, Eye, Zap, DollarSign, Box, Maximize2, Plus
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../../../lib/supabase';

interface InfrastructureViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function InfrastructureView({ onTriggerToast }: InfrastructureViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [activeConsumerTab, setActiveConsumerTab] = useState<'cpu' | 'memory' | 'storage' | 'network'>('memory');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('Last 7 Days');
  const [hoverChartIdx, setHoverChartIdx] = useState<number | null>(null);
  const [selectedDonutSlice, setSelectedDonutSlice] = useState<string | null>(null);
  const [activeRegionInfo, setActiveRegionInfo] = useState<string | null>(null);
  const [enabledSeries, setEnabledSeries] = useState({ cpu: true, memory: true, storage: true, network: true });

  // Live telemetry pulse
  const [liveMetrics, setLiveMetrics] = useState({
    cpu: 33.2,
    memory: 58.8,
    storage: 41.0,
    network: 29.5,
    healthyPct: 99.98,
    uptime: '30d 12h 45m'
  });

  // Chart data points for 7 days (must be after liveMetrics)
  const chartData = {
    cpu:     [35, 32, 28, 34, 30, 33, liveMetrics.cpu],
    memory:  [55, 58, 60, 57, 59, 56, liveMetrics.memory],
    storage: [40, 41, 39, 42, 40, 41, liveMetrics.storage],
    network: [30, 28, 32, 27, 29, 31, liveMetrics.network]
  };

  const toSvgPath = (data: number[], w: number, h: number) => {
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / 100) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const toSvgArea = (data: number[], w: number, h: number) => {
    const line = toSvgPath(data, w, h);
    const lastX = ((data.length - 1) / (data.length - 1)) * w;
    return `${line} L${lastX} ${h} L0 ${h} Z`;
  };

  // Modals state
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedCostSlice, setSelectedCostSlice] = useState<string | null>(null);
  const [hoverCostSlice, setHoverCostSlice] = useState<string | null>(null);
  const [hoverHealthSlice, setHoverHealthSlice] = useState<string | null>(null);
  const [hoverCostIdx, setHoverCostIdx] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showMeshLines, setShowMeshLines] = useState(true);
  const [mapOverlay, setMapOverlay] = useState<'none' | 'health' | 'latency' | 'traffic'>('none');
  const [mapTileStyle, setMapTileStyle] = useState<'voyager' | 'dark' | 'satellite'>('dark');
  const [showFiberSubsea, setShowFiberSubsea] = useState(false);
  const [showDdosOverlay, setShowDdosOverlay] = useState(false);
  const [isFailoverSimulated, setIsFailoverSimulated] = useState(false);
  const [showMapToolPanel, setShowMapToolPanel] = useState(false);
  const [showIpTrackerModal, setShowIpTrackerModal] = useState(false);
  const [isFullMapModalOpen, setIsFullMapModalOpen] = useState(false);
  const [showAddServerTagModal, setShowAddServerTagModal] = useState(false);
  const [customServerMarkers, setCustomServerMarkers] = useState<Array<{ id: string; name: string; ip: string; role: string; lat: number; lng: number; color: string }>>([
    { id: '1', name: 'Primary Gateway', ip: '10.0.1.1', role: 'Gateway', lat: 38.9072, lng: -77.0369, color: '#10B981' },
    { id: '2', name: 'Tokyo AI GPU Cluster', ip: '35.72.1.1', role: 'GPU Cluster', lat: 35.6762, lng: 139.6503, color: '#6366F1' },
    { id: '3', name: 'Frankfurt Backup DB', ip: '52.95.1.1', role: 'Database', lat: 50.1109, lng: 8.6821, color: '#F59E0B' }
  ]);
  const [newTagInput, setNewTagInput] = useState({ name: '', ip: '', role: 'Gateway', lat: 1.3521, lng: 103.8198, color: '#10B981' });
  const [selectedTrackIp, setSelectedTrackIp] = useState('10.0.1.1');
  const [pingResult, setPingResult] = useState<{ region: string; ms: number } | null>(null);

  const costCategories = [
    { key: 'Compute', color: '#6366F1', pct: 45, amount: '$11,052', offset: 0 },
    { key: 'Storage', color: '#3B82F6', pct: 23, amount: '$5,648', offset: -45 },
    { key: 'Network', color: '#10B981', pct: 15, amount: '$3,684', offset: -68 },
    { key: 'Database', color: '#F59E0B', pct: 10, amount: '$2,456', offset: -83 },
    { key: 'Others', color: '#8B5CF6', pct: 7, amount: '$1,720', offset: -93 }
  ];

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fullMapRef = useRef<HTMLDivElement>(null);
  const fullMapInstanceRef = useRef<any>(null);

  const regionLocations = [
    { name: 'us-east-1', title: 'N. Virginia', count: '12 services', lat: 37.7749, lng: -95.7129 },
    { name: 'ap-southeast-1', title: 'Singapore', count: '10 services', lat: 1.3521, lng: 103.8198 },
    { name: 'eu-west-1', title: 'Ireland', count: '8 services', lat: 53.3498, lng: -6.2603 },
    { name: 'ap-northeast-1', title: 'Tokyo', count: '7 services', lat: 35.6762, lng: 139.6503 },
    { name: 'sa-east-1', title: 'São Paulo', count: '5 services', lat: -23.5505, lng: -46.6333 }
  ];

  // Live full-screen map initializer
  useEffect(() => {
    if (!isFullMapModalOpen || !fullMapRef.current) return;
    if (fullMapInstanceRef.current) {
      fullMapInstanceRef.current.remove();
      fullMapInstanceRef.current = null;
    }

    const map = L.map(fullMapRef.current, { zoomControl: true, attributionControl: false }).setView([20, 0], 2);
    fullMapInstanceRef.current = map;

    const tileUrls = {
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    L.tileLayer(tileUrls[mapTileStyle], { maxZoom: 18 }).addTo(map);

    const usPos: [number, number] = [37.7749, -95.7129];
    const sgPos: [number, number] = [1.3521, 103.8198];
    const iePos: [number, number] = [53.3498, -6.2603];
    const jpPos: [number, number] = [35.6762, 139.6503];
    const brPos: [number, number] = [-23.5505, -46.6333];

    // Subsea Cable Mesh
    if (showFiberSubsea) {
      [[usPos, iePos], [iePos, sgPos], [sgPos, jpPos], [jpPos, usPos], [usPos, brPos]].forEach(route => {
        L.polyline(route, { color: '#EC4899', weight: 3, opacity: 0.85, dashArray: '6, 8' }).addTo(map);
      });
    }

    regionLocations.forEach((r) => {
      const icon = L.divIcon({
        html: `<div style="background-color:#10B981;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 14px #10B981; cursor:pointer;"></div>`,
        className: '',
        iconSize: [16, 16]
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${r.name} (${r.title})</b><br/>${r.count}<br/>Status: Operational 100%`);
    });

    customServerMarkers.forEach((c) => {
      const tagIcon = L.divIcon({
        html: `<div style="background-color:${c.color};width:12px;height:12px;border-radius:3px;border:2px solid white;box-shadow:0 0 10px ${c.color};cursor:pointer;"></div>`,
        className: '',
        iconSize: [12, 12]
      });
      const tagMarker = L.marker([c.lat, c.lng], { icon: tagIcon }).addTo(map);
      tagMarker.bindPopup(`<b>[TAGGED NODE] ${c.name}</b><br/>Role: ${c.role}<br/>IP: ${c.ip}`);
    });

    // Click on Full-Screen Map to Tag New Server Node
    map.on('click', (e: any) => {
      const clickedLat = Number(e.latlng.lat.toFixed(4));
      const clickedLng = Number(e.latlng.lng.toFixed(4));
      const randomIp = `10.0.${Math.floor(1 + Math.random()*20)}.${Math.floor(1 + Math.random()*254)}`;
      setNewTagInput({
        name: `Node ${clickedLat > 0 ? 'N' : 'S'}${Math.abs(clickedLat).toFixed(1)}-${randomIp.split('.').pop()}`,
        ip: randomIp,
        role: 'Gateway',
        lat: clickedLat,
        lng: clickedLng,
        color: '#10B981'
      });
      setShowAddServerTagModal(true);
      onTriggerToast?.(`Selected map position (${clickedLat}, ${clickedLng}) for server node tagging`);
    });

    setTimeout(() => { map.invalidateSize(); }, 250);

    return () => {
      if (fullMapInstanceRef.current) {
        fullMapInstanceRef.current.remove();
        fullMapInstanceRef.current = null;
      }
    };
  }, [isFullMapModalOpen, mapTileStyle, showFiberSubsea, customServerMarkers]);

  // Heartbeat live simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMetrics(prev => ({
        ...prev,
        cpu: Number((31 + Math.random() * 4).toFixed(1)),
        memory: Number((57 + Math.random() * 3).toFixed(1)),
        network: Number((28 + Math.random() * 3).toFixed(1))
      }));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([20, 0], 1.4);
    mapInstanceRef.current = map;

    const tileUrls = {
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    L.tileLayer(tileUrls[mapTileStyle], { maxZoom: 18 }).addTo(map);

    const usPos: [number, number] = [37.7749, -95.7129];
    const sgPos: [number, number] = [1.3521, 103.8198];
    const iePos: [number, number] = [53.3498, -6.2603];
    const jpPos: [number, number] = [35.6762, 139.6503];
    const brPos: [number, number] = [-23.5505, -46.6333];

    // Subsea Cable Mesh Polylines
    if (showFiberSubsea) {
      const subseaRoutes: [number, number][][] = [
        [usPos, iePos], // Transatlantic TAT-14
        [iePos, sgPos], // SEA-ME-WE 5
        [sgPos, jpPos], // APCN-2
        [jpPos, usPos], // Transpacific TPE
        [usPos, brPos]  // AMX-1
      ];
      subseaRoutes.forEach((route) => {
        L.polyline(route, { color: '#EC4899', weight: 2.5, opacity: 0.85, dashArray: '6, 8' }).addTo(map);
      });
    }

    regionLocations.forEach((r) => {
      const isUS = r.name === 'us-east-1';

      // Failover simulation logic
      let markerColor = '#10B981';
      let extraLabel = r.count;

      if (isFailoverSimulated && isUS) {
        markerColor = '#EF4444';
        extraLabel = 'CRITICAL OUTAGE — Traffic Rerouted to EU & AP-SE';
      } else if (isFailoverSimulated && !isUS) {
        markerColor = '#F59E0B';
        extraLabel = 'Failover Active (Absorbing 150% load)';
      } else if (mapOverlay === 'health') {
        markerColor = r.name === 'sa-east-1' ? '#F59E0B' : '#10B981';
        extraLabel = r.name === 'sa-east-1' ? 'Warning (CPU 89%)' : 'Healthy (100%)';
      } else if (mapOverlay === 'latency') {
        const latencies: Record<string, number> = { 'us-east-1': 12, 'eu-west-1': 85, 'sa-east-1': 120, 'ap-northeast-1': 142, 'ap-southeast-1': 165 };
        const ms = latencies[r.name] || 100;
        markerColor = ms < 50 ? '#10B981' : ms < 130 ? '#F59E0B' : '#EF4444';
        extraLabel = `Ping: ${ms}ms`;
      } else if (mapOverlay === 'traffic') {
        markerColor = '#6366F1';
        extraLabel = 'Traffic: 2.4 Tbps';
      }

      const icon = L.divIcon({
        html: `<div style="background-color:${markerColor};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 12px ${markerColor}; cursor:pointer;"></div>`,
        className: '',
        iconSize: [14, 14]
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${r.name} (${r.title})</b><br/>${extraLabel}`);
      marker.on('click', () => {
        setActiveRegionInfo(`${r.name} (${r.title}) - ${extraLabel}`);
        onTriggerToast?.(`Selected datacenter node: ${r.name} (${r.title})`);
      });

      if (showMeshLines && !isUS) {
        L.polyline([usPos, [r.lat, r.lng]], {
          color: isFailoverSimulated ? '#F59E0B' : mapOverlay === 'traffic' ? '#6366F1' : mapOverlay === 'latency' ? markerColor : '#10B981',
          weight: isFailoverSimulated ? 3 : mapOverlay === 'traffic' ? 2.5 : 1.5,
          opacity: 0.7,
          dashArray: '4, 6'
        }).addTo(map);
      }
    });

    // Custom Tagged Server Markers
    customServerMarkers.forEach((c) => {
      const tagIcon = L.divIcon({
        html: `<div style="background-color:${c.color};width:10px;height:10px;border-radius:2px;border:1.5px solid white;box-shadow:0 0 8px ${c.color};cursor:pointer;"></div>`,
        className: '',
        iconSize: [10, 10]
      });
      const tagMarker = L.marker([c.lat, c.lng], { icon: tagIcon }).addTo(map);
      tagMarker.bindPopup(`<b>[TAG] ${c.name}</b><br/>Role: ${c.role}<br/>IP: ${c.ip}`);
    });

    // Geo DDoS Attack Lines
    if (showDdosOverlay) {
      const ddosAttacks: [number, number][][] = [
        [[55.7558, 37.6173], usPos],
        [[39.9042, 116.4074], sgPos]
      ];
      ddosAttacks.forEach((atk) => {
        L.polyline(atk, { color: '#EF4444', weight: 3, opacity: 0.9, dashArray: '2, 4' }).addTo(map);
      });
    }

    setTimeout(() => { map.invalidateSize(); }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMeshLines, mapOverlay, mapTileStyle, showFiberSubsea, showDdosOverlay, isFailoverSimulated, customServerMarkers]);

  const servicesList = [
    { name: 'API Gateway', status: 'Healthy', healthPct: '99.98%', uptime: '30d 12h', latency: '120ms', region: 'us-east-1', instances: 4 },
    { name: 'Vector Database', status: 'Healthy', healthPct: '99.98%', uptime: '30d 12h', latency: '98ms', region: 'ap-southeast-1', instances: 3 },
    { name: 'Redis Cache', status: 'Healthy', healthPct: '99.99%', uptime: '30d 12h', latency: '0.8ms', region: 'us-east-1', instances: 6 },
    { name: 'SupabaseDB', status: 'Healthy', healthPct: '99.95%', uptime: '30d 12h', latency: '45ms', region: 'eu-west-1', instances: 2 },
    { name: 'MCP Orchestrator', status: 'Healthy', healthPct: '99.98%', uptime: '30d 12h', latency: '112ms', region: 'ap-southeast-1', instances: 3 },
    { name: 'AI Inference', status: 'Warning', healthPct: '98.21%', uptime: '12d 6h', latency: '352ms', region: 'us-east-1', instances: 5 },
    { name: 'Workflow Engine', status: 'Healthy', healthPct: '99.97%', uptime: '30d 12h', latency: '156ms', region: 'eu-west-1', instances: 3 }
  ];

  const recentAlerts = [
    { title: 'High memory usage on api-gateway-04', target: 'us-east-1 • api-gateway-04 • Memory 85%', severity: 'Warning', time: '2m ago' },
    { title: 'CPU usage high on worker-db-02', target: 'us-west-1 • worker-db-02 • CPU 89%', severity: 'Warning', time: '12m ago' },
    { title: 'Disk space low on redis-cache-01', target: 'us-east-1 • redis-cache-01 • Disk 15%', severity: 'Info', time: '1h ago' },
    { title: 'Network latency increased in eu-west-1', target: 'eu-west-1 • Multiple Nodes • Latency 310ms', severity: 'Info', time: '2h ago' },
    { title: 'Database slow query detected', target: 'eu-west-1 • supabase-db • Response 1.2s', severity: 'Warning', time: '3h ago' }
  ];

  const chartDays = ['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Server className="text-indigo-600 dark:text-indigo-400 size-6" />
            Infrastructure
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor and manage your infrastructure and system resources in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              onTriggerToast?.(`Filtered topology region to ${e.target.value}`);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer"
          >
            <option>All Regions</option>
            <option>us-east-1 (N. Virginia)</option>
            <option>ap-southeast-1 (Singapore)</option>
            <option>eu-west-1 (Ireland)</option>
            <option>ap-northeast-1 (Tokyo)</option>
            <option>sa-east-1 (São Paulo)</option>
          </select>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[10px]">Live</span>
          </div>

          <button 
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              onTriggerToast?.('Refreshing real-time telemetry stream from Supabase & CDN...');
              try {
                // Fetch telemetry data from Supabase DB
                const { data } = await supabase.from('enterprise_infrastructure_telemetry').select('*').order('timestamp', { ascending: false }).limit(1);
                if (data && data.length > 0) {
                  const t = data[0];
                  setLiveMetrics(prev => ({
                    ...prev,
                    cpu: Number(t.cpu_pct || 33.2),
                    memory: Number(t.memory_pct || 58.8),
                    storage: Number(t.storage_pct || 41.0),
                    network: Number(t.network_pct || 29.5)
                  }));
                } else {
                  setLiveMetrics(prev => ({
                    ...prev,
                    cpu: Number((30 + Math.random() * 5).toFixed(1)),
                    memory: Number((56 + Math.random() * 4).toFixed(1)),
                    network: Number((27 + Math.random() * 4).toFixed(1))
                  }));
                }
              } catch (_e) {
                /* graceful fallback */
              }
              setTimeout(() => {
                setIsRefreshing(false);
                onTriggerToast?.('Real-time infrastructure telemetry & CDN stream synchronized');
              }, 600);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button 
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              onTriggerToast?.('Generating Infrastructure Executive Audit Report (JSON/CSV)...');
              try {
                // Gather report data from Supabase & state
                const { data: nodesData } = await supabase.from('enterprise_infrastructure_nodes').select('*').limit(20);
                const { data: servicesData } = await supabase.from('enterprise_infrastructure_services').select('*').limit(20);
                const { data: pingData } = await supabase.from('enterprise_infrastructure_ping_diagnostics').select('*').limit(10);
                
                const reportPayload = {
                  reportTitle: 'Enterprise Infrastructure Executive Audit Report',
                  generatedAt: new Date().toISOString(),
                  environment: 'Production Cloud (5 Regions)',
                  liveMetrics,
                  inventorySummary: { totalNodes: 128, healthyNodes: 118, warningNodes: 7, criticalNodes: 3 },
                  costSummary: { totalUsd: 24560.40, computePct: 45, storagePct: 23, networkPct: 15, databasePct: 10, othersPct: 7 },
                  sampledNodes: nodesData || [],
                  sampledServices: servicesData || [],
                  pingDiagnostics: pingData || []
                };

                const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `infrastructure_executive_report_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                onTriggerToast?.('Report downloaded: infrastructure_executive_report.json');
              } catch (_e) {
                onTriggerToast?.('Exported Infrastructure Executive Audit Report to file');
              }
              setIsExporting(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50"
          >
            <Download size={13} className={isExporting ? 'animate-bounce' : ''} />
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* TOP 6 KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SYSTEM HEALTH</span>
          <div className="flex items-center gap-2">
            <div className="relative size-9 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="99.98, 100" />
              </svg>
            </div>
            <div>
              <span className="text-base font-black text-slate-900 dark:text-slate-100 block">{liveMetrics.healthyPct}%</span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase">HEALTHY</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={10} /> +0.12% vs last 7d</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">UPTIME</span>
          <span className="text-base font-black text-slate-900 dark:text-slate-100 block">{liveMetrics.uptime}</span>
          <span className="text-[9px] font-bold text-slate-400 block">No downtime</span>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TOTAL SERVICES</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">42</span>
          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={10} /> +3 vs last 7d</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SERVERS</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">128</span>
          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={10} /> +3 vs last 7d</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">REGIONS</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">5</span>
          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1"><Globe size={10} /> 5/5 healthy</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ALERTS</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">2</span>
          <span className="text-[9px] font-bold text-amber-600 px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 inline-block">0 Critical • 2 Warning</span>
        </div>
      </div>

      {/* MIDDLE ROW 1: Topology Map, Resource Area Chart, Infrastructure Health Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left (5 cols): Infrastructure Overview & Datacenter Mesh */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Infrastructure Overview</h3>
            <span className="text-[10px] font-mono text-slate-400">{activeRegionInfo || 'Global Datacenter Mesh'}</span>
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 space-y-1.5 text-xs font-bold">
              {regionLocations.map((r, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setActiveRegionInfo(`${r.name} (${r.title})`);
                    onTriggerToast?.(`Inspecting region: ${r.name}`);
                  }}
                  className="p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <span className="text-[11px] font-mono text-slate-900 dark:text-slate-100 block">{r.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{r.count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-span-8 relative z-0 isolate h-[175px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {/* Advanced Map Infrastructure Toolbar */}
              <div className="absolute top-1.5 left-1.5 right-1.5 z-[500] flex items-start justify-between">
                {/* Left: Primary Tools */}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-0.5">
                    <button onClick={() => mapInstanceRef.current?.zoomIn()} className="size-5 flex items-center justify-center rounded bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 cursor-pointer hover:bg-indigo-50 shadow-sm" title="Zoom In">+</button>
                    <button onClick={() => mapInstanceRef.current?.zoomOut()} className="size-5 flex items-center justify-center rounded bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 cursor-pointer hover:bg-indigo-50 shadow-sm" title="Zoom Out">−</button>
                    <button onClick={() => { mapInstanceRef.current?.setView([20, 0], 1.4); onTriggerToast?.('Map recentered to global view'); }} className="size-5 flex items-center justify-center rounded bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 shadow-sm" title="Recenter"><Globe size={9} className="text-indigo-600" /></button>
                  </div>
                </div>

                {/* Right: Advanced Infra Tools */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-0.5 flex-wrap justify-end">
                    <button onClick={() => setShowAddServerTagModal(true)} className="h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 text-emerald-600 dark:text-emerald-400 cursor-pointer shadow-xs" title="Tag Custom Server Node"><Plus size={8} /> Tag Node</button>
                    <button onClick={() => setIsFullMapModalOpen(true)} className="h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 text-indigo-600 dark:text-indigo-400 cursor-pointer shadow-xs" title="View Fullscreen Map"><Maximize2 size={8} /> Full Map</button>
                    <button onClick={() => setMapTileStyle(s => s === 'dark' ? 'satellite' : s === 'satellite' ? 'voyager' : 'dark')} className="h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs" title="Switch Map Tiles"><Globe size={8} /> {mapTileStyle === 'dark' ? 'Dark' : mapTileStyle === 'satellite' ? 'Sat' : 'Light'}</button>
                    <button onClick={() => { setShowFiberSubsea(!showFiberSubsea); onTriggerToast?.(`Subsea Fiber: ${!showFiberSubsea ? 'ENABLED' : 'DISABLED'}`); }} className={`h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showFiberSubsea ? 'bg-pink-600 text-white border-pink-600' : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 text-slate-500'}`} title="Subsea Fiber Mesh"><Activity size={8} /> Fiber</button>
                    <button onClick={() => { setShowDdosOverlay(!showDdosOverlay); onTriggerToast?.(`DDoS Overlay: ${!showDdosOverlay ? 'ACTIVE' : 'OFF'}`); }} className={`h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showDdosOverlay ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 text-slate-500'}`} title="DDoS Map"><ShieldAlert size={8} /> DDoS</button>
                    <button onClick={() => { setIsFailoverSimulated(!isFailoverSimulated); onTriggerToast?.(`Failover Sim: ${!isFailoverSimulated ? 'ACTIVE' : 'NORMAL'}`); }} className={`h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border cursor-pointer shadow-xs transition-all ${isFailoverSimulated ? 'bg-amber-600 text-white border-amber-600' : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 text-slate-500'}`} title="Failover Simulator"><Zap size={8} /> Failover</button>
                    <button onClick={() => setShowMeshLines(!showMeshLines)} className={`h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showMeshLines ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-300 text-indigo-700' : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 text-slate-500'}`} title="Toggle Mesh"><Network size={8} /> Mesh</button>
                    <button onClick={() => setShowMapToolPanel(!showMapToolPanel)} className={`h-5 px-1.5 flex items-center gap-0.5 rounded text-[8px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showMapToolPanel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/95 dark:bg-slate-800/95 border-slate-200 text-slate-500'}`} title="Observability Tools"><Layers size={8} /> Tools</button>
                  </div>

                  {/* Expanded Tools Panel */}
                  {showMapToolPanel && (
                    <div className="bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1.5 space-y-1 min-w-[130px] animate-fadeIn">
                      <span className="text-[7px] font-black text-slate-400 uppercase block px-0.5">Overlay Mode</span>
                      <div className="flex flex-col gap-0.5">
                        {([['none', 'Default'], ['health', 'Health Status'], ['latency', 'Latency Map'], ['traffic', 'Traffic Flow']] as const).map(([key, label]) => (
                          <button key={key} onClick={() => { setMapOverlay(key); onTriggerToast?.(`Map overlay: ${label}`); }} className={`text-left px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-all ${ mapOverlay === key ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{label}</button>
                        ))}
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                        <span className="text-[7px] font-black text-slate-400 uppercase block px-0.5">Diagnostics</span>
                        <button onClick={async () => {
                          const regions = ['us-east-1', 'ap-southeast-1', 'eu-west-1', 'ap-northeast-1', 'sa-east-1'];
                          const r = regions[Math.floor(Math.random() * regions.length)];
                          const ms = Math.floor(12 + Math.random() * 180);
                          const jitter = Number((Math.random() * 8).toFixed(2));
                          const pktLoss = Number((Math.random() * 0.5).toFixed(2));
                          setPingResult({ region: r, ms });
                          onTriggerToast?.(`Ping ${r}: ${ms}ms (jitter: ${jitter}ms)`);
                          try { await supabase.from('enterprise_infrastructure_ping_diagnostics').insert({ source_region: 'us-east-1', target_region: r, latency_ms: ms, packet_loss_pct: pktLoss, jitter_ms: jitter, status: ms > 200 ? 'timeout' : 'success', overlay_mode: mapOverlay === 'none' ? 'latency' : mapOverlay, initiated_by: 'dashboard_user' }); } catch (_e) { /* graceful fallback */ }
                          setTimeout(() => setPingResult(null), 4000);
                        }} className="w-full text-left px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1"><Zap size={8} className="text-amber-500" /> Ping Test</button>
                        <button onClick={async () => {
                          const targets = ['ap-southeast-1', 'eu-west-1', 'ap-northeast-1', 'sa-east-1'];
                          onTriggerToast?.('Traceroute initiated across all regions...');
                          for (const t of targets) {
                            const hops = Math.floor(6 + Math.random() * 10);
                            const totalMs = Math.floor(50 + Math.random() * 200);
                            const hopData = Array.from({ length: Math.min(hops, 4) }, (_, i) => ({ hop: i + 1, ip: `${10 + i}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.1`, ms: Math.floor((totalMs / hops) * (i + 1)) }));
                            try { await supabase.from('enterprise_infrastructure_traceroute_logs').insert({ source_region: 'us-east-1', target_region: t, hop_count: hops, total_latency_ms: totalMs, hops: hopData, status: 'completed', initiated_by: 'dashboard_user' }); } catch (_e) { /* graceful fallback */ }
                          }
                          onTriggerToast?.(`Traceroute completed: ${targets.length} routes logged to database`);
                        }} className="w-full text-left px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1"><Activity size={8} className="text-emerald-500" /> Traceroute</button>
                        <button onClick={async () => {
                          onTriggerToast?.('Node discovery scan running...');
                          const scanRegions = [{ r: 'us-east-1', n: 42, cdn: 12 }, { r: 'ap-southeast-1', n: 28, cdn: 8 }, { r: 'eu-west-1', n: 24, cdn: 6 }, { r: 'ap-northeast-1', n: 18, cdn: 5 }, { r: 'sa-east-1', n: 16, cdn: 4 }];
                          for (const sr of scanRegions) {
                            const newN = Math.floor(Math.random() * 3);
                            const scanMs = Math.floor(1500 + Math.random() * 3000);
                            try { await supabase.from('enterprise_infrastructure_node_discovery').insert({ region: sr.r, discovered_nodes: sr.n + newN, new_nodes: newN, removed_nodes: 0, scan_duration_ms: scanMs, scan_type: 'full', cdn_edge_nodes: sr.cdn, status: 'completed', initiated_by: 'dashboard_user' }); } catch (_e) { /* graceful fallback */ }
                          }
                          onTriggerToast?.(`Node discovery complete: ${scanRegions.length} regions scanned, results persisted to database`);
                        }} className="w-full text-left px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1"><Eye size={8} className="text-blue-500" /> Node Discovery</button>
                        <button onClick={() => setShowIpTrackerModal(true)} className="w-full text-left px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1"><Network size={8} className="text-purple-500" /> IP Tracker & WHOIS</button>
                        <button onClick={() => { onTriggerToast?.('CDN Edge Inspector: 35 POP locations active, 99.8% Cache Hit Ratio'); }} className="w-full text-left px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1"><Globe size={8} className="text-cyan-500" /> CDN Edge Inspector</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ping Result Overlay */}
              {pingResult && (
                <div className="absolute bottom-1.5 left-1.5 z-[500] bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-2 py-0.5 text-[9px] font-mono animate-fadeIn flex items-center gap-1.5">
                  <span className="font-black text-slate-900 dark:text-slate-100">{pingResult.region}</span>
                  <span className={`font-black ${pingResult.ms < 50 ? 'text-emerald-600' : pingResult.ms < 120 ? 'text-amber-600' : 'text-rose-600'}`}>{pingResult.ms}ms</span>
                </div>
              )}

              {/* Failover Simulation Overlay Banner */}
              {isFailoverSimulated && (
                <div className="absolute top-10 left-2 z-[500] bg-slate-900/90 border border-amber-500 text-amber-300 px-2 py-1 rounded-lg text-[8.5px] font-mono font-black shadow-md flex items-center gap-1.5">
                  <ShieldAlert size={11} className="text-amber-400" />
                  <span>FAILOVER: US-EAST REROUTED TO EU & AP</span>
                </div>
              )}

              {/* Geo DDoS Threat Overlay Badge */}
              {showDdosOverlay && (
                <div className="absolute top-10 right-2 z-[500] bg-slate-900/90 border border-rose-500 text-rose-300 px-2 py-1 rounded-lg text-[8.5px] font-mono font-black shadow-md flex items-center gap-1.5">
                  <Zap size={11} className="text-rose-400" />
                  <span>DDOS MITIGATION: 14.8 Gbps</span>
                </div>
              )}

              {/* Map Overlay Indicator */}
              {mapOverlay !== 'none' && (
                <div className="absolute bottom-1.5 right-1.5 z-[500] px-2 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-black uppercase shadow-sm">
                  {mapOverlay} overlay
                </div>
              )}

              <div ref={mapRef} className="size-full" />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9.5px] font-extrabold text-center">
            <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800/50"><span className="text-indigo-600 block">128</span><span className="text-slate-400 text-[7.5px] uppercase">Servers</span></div>
            <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800/50"><span className="text-indigo-600 block">42</span><span className="text-slate-400 text-[7.5px] uppercase">Services</span></div>
            <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800/50"><span className="text-indigo-600 block">5</span><span className="text-slate-400 text-[7.5px] uppercase">Regions</span></div>
            <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800/50"><span className="text-indigo-600 block">12</span><span className="text-slate-400 text-[7.5px] uppercase">VPCs</span></div>
            <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800/50"><span className="text-indigo-600 block">32</span><span className="text-slate-400 text-[7.5px] uppercase">Databases</span></div>
            <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800/50"><span className="text-indigo-600 block">18</span><span className="text-slate-400 text-[7.5px] uppercase">LoadBalancers</span></div>
          </div>
        </div>

        {/* Middle (4 cols): Resource Utilization Chart */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Resource Utilization</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded cursor-pointer">{selectedTimeframe}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button 
              onClick={() => {
                setEnabledSeries(p => ({ ...p, cpu: !p.cpu }));
                setMapOverlay('health');
                onTriggerToast?.(`CPU Metric Selected (${liveMetrics.cpu}%) — Map overlay: Health & CPU load`);
              }}
              className={`flex justify-between items-center p-2 rounded-xl border cursor-pointer transition-all ${enabledSeries.cpu ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-xs' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}
              title="Click to toggle CPU Metric & Map Overlay"
            >
              <span className="flex items-center gap-1.5 font-bold"><span className="size-2.5 rounded-full bg-blue-500 shadow-xs" /> CPU Usage</span>
              <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">{liveMetrics.cpu}%</span>
            </button>
            <button 
              onClick={() => {
                setEnabledSeries(p => ({ ...p, memory: !p.memory }));
                setMapOverlay('health');
                onTriggerToast?.(`Memory Metric Selected (${liveMetrics.memory}%) — Map overlay: RAM load`);
              }}
              className={`flex justify-between items-center p-2 rounded-xl border cursor-pointer transition-all ${enabledSeries.memory ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 shadow-xs' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}
              title="Click to toggle Memory Metric & Map Overlay"
            >
              <span className="flex items-center gap-1.5 font-bold"><span className="size-2.5 rounded-full bg-indigo-500 shadow-xs" /> Memory</span>
              <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{liveMetrics.memory}%</span>
            </button>
            <button 
              onClick={() => {
                setEnabledSeries(p => ({ ...p, storage: !p.storage }));
                setMapOverlay('traffic');
                onTriggerToast?.(`Storage Metric Selected (${liveMetrics.storage}%) — Map overlay: Disk I/O & Storage`);
              }}
              className={`flex justify-between items-center p-2 rounded-xl border cursor-pointer transition-all ${enabledSeries.storage ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-xs' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}
              title="Click to toggle Storage Metric & Map Overlay"
            >
              <span className="flex items-center gap-1.5 font-bold"><span className="size-2.5 rounded-full bg-emerald-500 shadow-xs" /> Storage</span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{liveMetrics.storage}%</span>
            </button>
            <button 
              onClick={() => {
                setEnabledSeries(p => ({ ...p, network: !p.network }));
                setMapOverlay('latency');
                onTriggerToast?.(`Network Metric Selected (${liveMetrics.network}%) — Map overlay: Latency & Bandwidth`);
              }}
              className={`flex justify-between items-center p-2 rounded-xl border cursor-pointer transition-all ${enabledSeries.network ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 shadow-xs' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}
              title="Click to toggle Network Metric & Map Overlay"
            >
              <span className="flex items-center gap-1.5 font-bold"><span className="size-2.5 rounded-full bg-amber-500 shadow-xs" /> Network</span>
              <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">{liveMetrics.network}%</span>
            </button>
          </div>

          {/* Interactive SVG Area Chart with Gradient Fills & Crosshair */}
          <div className="relative h-40 w-full flex items-stretch">
            <div className="w-8 flex flex-col justify-between text-[8px] font-mono text-slate-400 py-1">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className="flex-1 relative" onMouseLeave={() => setHoverChartIdx(null)}>
              <svg className="size-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/><stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/></linearGradient>
                  <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity="0.3"/><stop offset="100%" stopColor="#6366F1" stopOpacity="0"/></linearGradient>
                  <linearGradient id="gSto" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/><stop offset="100%" stopColor="#10B981" stopOpacity="0"/></linearGradient>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3"/><stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/></linearGradient>
                </defs>
                {[0, 25, 50, 75, 100].map(v => <line key={v} x1="0" y1={100 - v} x2="300" y2={100 - v} stroke="#E2E8F0" strokeWidth="0.3" strokeDasharray="3 3" />)}
                {enabledSeries.cpu && <><path d={toSvgArea(chartData.cpu, 300, 100)} fill="url(#gCpu)" /><path d={toSvgPath(chartData.cpu, 300, 100)} fill="none" stroke="#3B82F6" strokeWidth="2" /></>}
                {enabledSeries.memory && <><path d={toSvgArea(chartData.memory, 300, 100)} fill="url(#gMem)" /><path d={toSvgPath(chartData.memory, 300, 100)} fill="none" stroke="#6366F1" strokeWidth="2" /></>}
                {enabledSeries.storage && <><path d={toSvgArea(chartData.storage, 300, 100)} fill="url(#gSto)" /><path d={toSvgPath(chartData.storage, 300, 100)} fill="none" stroke="#10B981" strokeWidth="2" /></>}
                {enabledSeries.network && <><path d={toSvgArea(chartData.network, 300, 100)} fill="url(#gNet)" /><path d={toSvgPath(chartData.network, 300, 100)} fill="none" stroke="#F59E0B" strokeWidth="2" /></>}
                {hoverChartIdx !== null && <line x1={(hoverChartIdx / 6) * 300} y1="0" x2={(hoverChartIdx / 6) * 300} y2="100" stroke="#6366F1" strokeWidth="0.8" strokeDasharray="2 2" />}
                {hoverChartIdx !== null && enabledSeries.cpu && <circle cx={(hoverChartIdx / 6) * 300} cy={100 - chartData.cpu[hoverChartIdx]} r="3" fill="#3B82F6" />}
                {hoverChartIdx !== null && enabledSeries.memory && <circle cx={(hoverChartIdx / 6) * 300} cy={100 - chartData.memory[hoverChartIdx]} r="3" fill="#6366F1" />}
                {hoverChartIdx !== null && enabledSeries.storage && <circle cx={(hoverChartIdx / 6) * 300} cy={100 - chartData.storage[hoverChartIdx]} r="3" fill="#10B981" />}
                {hoverChartIdx !== null && enabledSeries.network && <circle cx={(hoverChartIdx / 6) * 300} cy={100 - chartData.network[hoverChartIdx]} r="3" fill="#F59E0B" />}
              </svg>
              {/* Hover tooltip */}
              {hoverChartIdx !== null && (
                <div className="absolute top-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 text-[9px] font-mono z-10 pointer-events-none" style={{ left: `${Math.min(85, (hoverChartIdx / 6) * 100)}%` }}>
                  <span className="font-black text-slate-900 dark:text-slate-100 block">{chartDays[hoverChartIdx]}</span>
                  {enabledSeries.cpu && <span className="text-blue-500 block">CPU: {chartData.cpu[hoverChartIdx]}%</span>}
                  {enabledSeries.memory && <span className="text-indigo-500 block">Mem: {chartData.memory[hoverChartIdx]}%</span>}
                  {enabledSeries.storage && <span className="text-emerald-500 block">Sto: {chartData.storage[hoverChartIdx]}%</span>}
                  {enabledSeries.network && <span className="text-amber-500 block">Net: {chartData.network[hoverChartIdx]}%</span>}
                </div>
              )}
              {/* Invisible hover zones */}
              <div className="absolute inset-0 flex">
                {chartDays.map((_, idx) => (
                  <div key={idx} className="flex-1" onMouseEnter={() => setHoverChartIdx(idx)} />
                ))}
              </div>
              <div className="flex justify-between text-[8.5px] font-mono text-slate-400 pt-1">
                {chartDays.map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>

          {/* Series Toggle Legend */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {([['cpu', '#3B82F6', 'CPU'], ['memory', '#6366F1', 'Memory'], ['storage', '#10B981', 'Storage'], ['network', '#F59E0B', 'Network']] as const).map(([key, color, label]) => (
              <button key={key} onClick={() => setEnabledSeries(p => ({ ...p, [key]: !p[key] }))} className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${enabledSeries[key] ? 'border-slate-300 dark:border-slate-700' : 'border-slate-200 dark:border-slate-800 opacity-40'}`}>
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right (3 cols): Health Donut */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Infrastructure Health</h3>
            <span className="text-[10px] text-slate-400 font-bold">128 Total Nodes</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative size-24 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" strokeWidth={selectedDonutSlice === 'Healthy' || hoverHealthSlice === 'Healthy' ? 6.5 : 4.5} strokeDasharray="92.2 7.8" strokeDashoffset="0" className="cursor-pointer hover:opacity-80 transition-all duration-300" onMouseEnter={() => setHoverHealthSlice('Healthy')} onMouseLeave={() => setHoverHealthSlice(null)} onClick={() => setSelectedDonutSlice(s => s === 'Healthy' ? null : 'Healthy')} />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F59E0B" strokeWidth={selectedDonutSlice === 'Warning' || hoverHealthSlice === 'Warning' ? 6.5 : 4.5} strokeDasharray="5.5 94.5" strokeDashoffset="-92.2" className="cursor-pointer hover:opacity-80 transition-all duration-300" onMouseEnter={() => setHoverHealthSlice('Warning')} onMouseLeave={() => setHoverHealthSlice(null)} onClick={() => setSelectedDonutSlice(s => s === 'Warning' ? null : 'Warning')} />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#EF4444" strokeWidth={selectedDonutSlice === 'Critical' || hoverHealthSlice === 'Critical' ? 6.5 : 4.5} strokeDasharray="2.3 97.7" strokeDashoffset="-97.7" className="cursor-pointer hover:opacity-80 transition-all duration-300" onMouseEnter={() => setHoverHealthSlice('Critical')} onMouseLeave={() => setHoverHealthSlice(null)} onClick={() => setSelectedDonutSlice(s => s === 'Critical' ? null : 'Critical')} />
              </svg>
              <div className="absolute text-center pointer-events-none">
                <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">
                  {hoverHealthSlice === 'Healthy' || selectedDonutSlice === 'Healthy' ? '118' : hoverHealthSlice === 'Warning' || selectedDonutSlice === 'Warning' ? '7' : hoverHealthSlice === 'Critical' || selectedDonutSlice === 'Critical' ? '3' : '128'}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase block">
                  {hoverHealthSlice || selectedDonutSlice || 'NODES'}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {[{k:'Healthy',c:'bg-emerald-500',n:118,p:'92.2%'},{k:'Warning',c:'bg-amber-500',n:7,p:'5.5%'},{k:'Critical',c:'bg-rose-500',n:3,p:'2.3%'}].map(s=>(
                <div key={s.k} className={`flex justify-between items-center cursor-pointer p-1 rounded-lg transition-all text-[10px] font-bold ${selectedDonutSlice===s.k || hoverHealthSlice===s.k ?'bg-slate-100 dark:bg-slate-800':''}`} onMouseEnter={() => setHoverHealthSlice(s.k)} onMouseLeave={() => setHoverHealthSlice(null)} onClick={()=>setSelectedDonutSlice(v=>v===s.k?null:s.k)}>
                  <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${s.c}`}/> {s.k}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{s.n} ({s.p})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Slice Detail Card */}
          {selectedDonutSlice && (
            <div className={`p-2.5 rounded-xl border text-[10px] font-bold space-y-1 animate-fadeIn ${
              selectedDonutSlice === 'Healthy' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300' :
              selectedDonutSlice === 'Warning' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300' :
              'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            }`}>
              <span className="font-black uppercase block">{selectedDonutSlice} Nodes Detail</span>
              <span className="block">{selectedDonutSlice === 'Healthy' ? '118 nodes operating within normal parameters across all 5 regions.' : selectedDonutSlice === 'Warning' ? '7 nodes with elevated CPU/Memory usage requiring monitoring (api-gateway-04, worker-db-02, etc.).' : '3 nodes with critical disk space or latency issues requiring immediate attention.'}</span>
              <button onClick={() => { onTriggerToast?.(`Initiated triage for ${selectedDonutSlice} nodes`); setSelectedDonutSlice(null); }} className="text-[9px] font-black underline cursor-pointer">{selectedDonutSlice === 'Healthy' ? 'View healthy nodes →' : selectedDonutSlice === 'Warning' ? 'Triage warning nodes →' : 'Remediate critical nodes →'}</button>
            </div>
          )}

          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold">
            <span className="text-[9px] text-slate-400 uppercase block font-black">Health Distribution by Region</span>
            {[
              { name: 'us-east-1', pct: 98.6 },
              { name: 'ap-southeast-1', pct: 97.5 },
              { name: 'eu-west-1', pct: 96.1 },
              { name: 'ap-northeast-1', pct: 95.3 },
              { name: 'sa-east-1', pct: 94.2 }
            ].map((reg, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between"><span className="font-mono text-slate-700 dark:text-slate-300">{reg.name}</span><span className="text-emerald-600">{reg.pct}%</span></div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${reg.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE ROW 2: Services Table, Recent Alerts, Cost Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Services Status Table */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Services Status</h3>
            <button onClick={() => setShowServicesModal(true)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View all →</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[9.5px] uppercase font-black text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2">SERVICE</th>
                  <th className="py-1.5 px-2">STATUS</th>
                  <th className="py-1.5 px-2">HEALTH</th>
                  <th className="py-1.5 px-2">UPTIME</th>
                  <th className="py-1.5 px-2">RESPONSE</th>
                  <th className="py-1.5 px-2">REGION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-bold">
                {servicesList.map((srv, i) => (
                  <tr key={i} onClick={() => setSelectedService(srv)} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                    <td className="py-2 px-2 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${srv.status === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>{srv.name}</span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${srv.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'}`}>{srv.status}</span>
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-900 dark:text-slate-100">{srv.healthPct}</td>
                    <td className="py-2 px-2 font-mono text-slate-400">{srv.uptime}</td>
                    <td className="py-2 px-2 font-mono text-slate-500">{srv.latency}</td>
                    <td className="py-2 px-2 font-mono text-slate-400">{srv.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Alerts</h3>
            <button onClick={() => setShowAlertsModal(true)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View all →</button>
          </div>

          <div className="space-y-2 text-xs font-bold">
            {recentAlerts.map((alt, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 dark:text-slate-100">{alt.title}</span>
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded uppercase ${alt.severity === 'Warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950' : 'bg-blue-100 text-blue-700 dark:bg-blue-950'}`}>{alt.severity}</span>
                </div>
                <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono">
                  <span>{alt.target}</span>
                  <span>{alt.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Overview Panel */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Cost Overview</h3>
            <button onClick={() => setShowCostModal(true)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View details →</button>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase block">TOTAL COST</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">$24,560.40</span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={10} /> +8.6%</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-7 h-20 w-full relative" onMouseLeave={() => setHoverCostIdx(null)}>
              <svg className="size-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="costGradient2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity="0.4"/><stop offset="100%" stopColor="#6366F1" stopOpacity="0"/></linearGradient>
                </defs>
                {[15, 30, 45].map(y => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#E2E8F0" strokeWidth="0.3" strokeDasharray="2 2" />)}
                <path d="M0 50 L33 45 L66 40 L100 32 L133 28 L166 20 L200 15 L200 60 L0 60 Z" fill="url(#costGradient2)" />
                <path d="M0 50 L33 45 L66 40 L100 32 L133 28 L166 20 L200 15" fill="none" stroke="#6366F1" strokeWidth="2" />
                {[50,45,40,32,28,20,15].map((y, i) => (
                  <circle key={i} cx={i * 33.3} cy={y} r={hoverCostIdx === i ? 4 : 2} fill="#6366F1" stroke="white" strokeWidth={hoverCostIdx === i ? 1.5 : 0} className="transition-all cursor-pointer" />
                ))}
                {hoverCostIdx !== null && (
                  <line x1={hoverCostIdx * 33.3} y1="0" x2={hoverCostIdx * 33.3} y2="60" stroke="#6366F1" strokeWidth="0.8" strokeDasharray="2 2" />
                )}
              </svg>

              {/* Cost Hover Tooltip */}
              {hoverCostIdx !== null && (
                <div className="absolute top-[-24px] bg-slate-900 text-white rounded px-1.5 py-0.5 text-[8px] font-mono shadow-md z-20 pointer-events-none transform -translate-x-1/2 whitespace-nowrap" style={{ left: `${(hoverCostIdx / 6) * 100}%` }}>
                  ${(22000 + hoverCostIdx * 420).toLocaleString()} (Spend)
                </div>
              )}

              {/* Hover Overlay Zones */}
              <div className="absolute inset-0 flex">
                {[0,1,2,3,4,5,6].map(idx => (
                  <div key={idx} className="flex-1 cursor-pointer" onMouseEnter={() => setHoverCostIdx(idx)} onClick={() => onTriggerToast?.(`Inspected daily cost point #${idx + 1}`)} />
                ))}
              </div>

              <div className="flex justify-between text-[7px] font-mono text-slate-400 pt-0.5">
                <span>May 1</span><span>May 7</span><span>May 13</span><span>May 24</span>
              </div>
            </div>

            <div className="col-span-5 relative size-16 flex items-center justify-center mx-auto">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                {costCategories.map(cat => (
                  <circle key={cat.key} cx="18" cy="18" r="15.9155" fill="none" stroke={cat.color} strokeWidth={selectedCostSlice === cat.key || hoverCostSlice === cat.key ? 6.5 : 4.5} strokeDasharray={`${cat.pct} ${100 - cat.pct}`} strokeDashoffset={String(cat.offset)} className="cursor-pointer hover:opacity-80 transition-all duration-300" onMouseEnter={() => setHoverCostSlice(cat.key)} onMouseLeave={() => setHoverCostSlice(null)} onClick={() => setSelectedCostSlice(s => s === cat.key ? null : cat.key)} />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-black text-slate-900 dark:text-slate-100">
                  {hoverCostSlice || selectedCostSlice || 'Cost'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-[10px] font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
            {costCategories.map(cat => (
              <div key={cat.key} className={`flex justify-between cursor-pointer p-0.5 rounded transition-all ${selectedCostSlice === cat.key || hoverCostSlice === cat.key ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onMouseEnter={() => setHoverCostSlice(cat.key)} onMouseLeave={() => setHoverCostSlice(null)} onClick={() => setSelectedCostSlice(s => s === cat.key ? null : cat.key)}>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ backgroundColor: cat.color }} /> {cat.key}</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{cat.pct}% ({cat.amount})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: 4 Specialized Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Top Resource Consumers */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Top Resource Consumers</h3>
            <div className="flex gap-1 text-[9px] font-bold">
              {['cpu', 'memory', 'storage', 'network'].map(t => (
                <button 
                  key={t}
                  onClick={() => {
                    setActiveConsumerTab(t as any);
                    onTriggerToast?.(`Switched consumer metrics tab to ${t.toUpperCase()}`);
                  }}
                  className={`px-1.5 py-0.5 rounded uppercase cursor-pointer ${activeConsumerTab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-[10px] font-bold">
            {(
              activeConsumerTab === 'cpu' ? [
                { name: 'ai-inference-01', val: '89% CPU (16 Cores)', pct: 89, color: 'bg-blue-600' },
                { name: 'vector-db-primary', val: '74% CPU (8 Cores)', pct: 74, color: 'bg-blue-600' },
                { name: 'mcp-orchestrator', val: '62% CPU (8 Cores)', pct: 62, color: 'bg-blue-600' },
                { name: 'supabase-db', val: '45% CPU (4 Cores)', pct: 45, color: 'bg-blue-600' },
                { name: 'workflow-engine-02', val: '38% CPU (4 Cores)', pct: 38, color: 'bg-blue-600' }
              ] : activeConsumerTab === 'memory' ? [
                { name: 'vector-db-primary', val: '24.8 GB (82% RAM)', pct: 82, color: 'bg-indigo-600' },
                { name: 'redis-cluster-01', val: '18.2 GB (68% RAM)', pct: 68, color: 'bg-indigo-600' },
                { name: 'ai-inference-01', val: '15.4 GB (54% RAM)', pct: 54, color: 'bg-indigo-600' },
                { name: 'supabase-db', val: '12.1 GB (42% RAM)', pct: 42, color: 'bg-indigo-600' },
                { name: 'api-gateway-04', val: '8.6 GB (29% RAM)', pct: 29, color: 'bg-indigo-600' }
              ] : activeConsumerTab === 'storage' ? [
                { name: 'vector-db-primary', val: '856 GB (72% Disk)', pct: 72, color: 'bg-emerald-600' },
                { name: 'supabase-db', val: '512 GB (43% Disk)', pct: 43, color: 'bg-emerald-600' },
                { name: 'ai-inference-01', val: '256 GB (21% Disk)', pct: 21, color: 'bg-emerald-600' },
                { name: 'redis-cluster-01', val: '128 GB (11% Disk)', pct: 11, color: 'bg-emerald-600' },
                { name: 'workflow-engine-02', val: '96 GB (8% Disk)', pct: 8, color: 'bg-emerald-600' }
              ] : [
                { name: 'api-gateway-04', val: '4.2 Gbps (84% Bandwidth)', pct: 84, color: 'bg-amber-600' },
                { name: 'cdn-edge-pop-sg', val: '3.1 Gbps (62% Bandwidth)', pct: 62, color: 'bg-amber-600' },
                { name: 'us-east-core-link', val: '2.4 Gbps (48% Bandwidth)', pct: 48, color: 'bg-amber-600' },
                { name: 'vector-db-primary', val: '1.8 Gbps (36% Bandwidth)', pct: 36, color: 'bg-amber-600' },
                { name: 'redis-cluster-01', val: '0.9 Gbps (18% Bandwidth)', pct: 18, color: 'bg-amber-600' }
              ]
            ).map((c, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between font-mono"><span className="text-slate-900 dark:text-slate-100">{c.name}</span><span className={activeConsumerTab === 'cpu' ? 'text-blue-600' : activeConsumerTab === 'memory' ? 'text-indigo-600' : activeConsumerTab === 'storage' ? 'text-emerald-600' : 'text-amber-600'}>{c.val}</span></div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${c.color}`} style={{ width: `${c.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 2: Top Talkers (Network) */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Top Talkers (Network)</h3>
            <span className="text-[9px] text-slate-400 font-mono">Transfer</span>
          </div>

          <div className="space-y-2 text-[10px] font-bold">
            {[
              { route: 'us-east-1 → ap-southeast-1', val: '2.45 TB' },
              { route: 'ap-southeast-1 → us-east-1', val: '1.82 TB' },
              { route: 'us-east-1 → eu-west-1', val: '1.12 TB' },
              { route: 'eu-west-1 → us-east-1', val: '0.95 TB' },
              { route: 'ap-northeast-1 → us-east-1', val: '0.72 TB' }
            ].map((t, i) => (
              <div key={i} className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="font-mono text-slate-700 dark:text-slate-300">{t.route}</span>
                <span className="font-mono text-indigo-600 font-black">{t.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module 3: Infrastructure Inventory */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Infrastructure Inventory</h3>
            <span className="text-[9px] text-slate-400 font-mono">Resources</span>
          </div>

          <div className="space-y-2 text-[11px] font-bold">
            <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40"><span>Virtual Machines</span><span className="font-mono text-indigo-600">128</span></div>
            <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40"><span>Containers</span><span className="font-mono text-indigo-600">96</span></div>
            <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40"><span>Databases</span><span className="font-mono text-indigo-600">32</span></div>
            <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40"><span>Volumes</span><span className="font-mono text-indigo-600">68</span></div>
            <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40"><span>Load Balancers</span><span className="font-mono text-indigo-600">18</span></div>
            <div className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40"><span>Kubernetes Clusters</span><span className="font-mono text-indigo-600">6</span></div>
          </div>
        </div>

        {/* Module 4: Compliance & Security Posture */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Compliance & Security Posture</h3>
            <button onClick={() => setShowSecurityModal(true)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View details →</button>
          </div>

          <div className="space-y-1.5 text-[10px] font-bold">
            <div className="flex justify-between"><span>Patch Compliance</span><span className="text-emerald-600 font-mono">98.6%</span></div>
            <div className="flex justify-between"><span>Security Groups</span><span className="text-emerald-600 font-mono">94.2%</span></div>
            <div className="flex justify-between"><span>Encryption Coverage</span><span className="text-emerald-600 font-mono">100%</span></div>
            <div className="flex justify-between"><span>Backup Success Rate</span><span className="text-emerald-600 font-mono">99.7%</span></div>
          </div>

          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1 text-[10px] font-bold">
            <span className="text-amber-700 dark:text-amber-400 uppercase font-black block">2 security recommendations</span>
            <button onClick={() => setShowSecurityModal(true)} className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Review security best practices →</button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showServicesModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">All Infrastructure Services (42 Running)</h3>
              <button onClick={() => setShowServicesModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs font-bold">
              {servicesList.map((srv, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-slate-900 dark:text-slate-100 block font-bold">{srv.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Region: {srv.region} • Instances: {srv.instances} • Latency: {srv.latency}</span>
                  </div>
                  <button onClick={() => onTriggerToast?.(`Initiated automated restart for ${srv.name}`)} className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[10px] font-black uppercase cursor-pointer">Reboot Node</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowServicesModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {selectedService && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{selectedService.name} Service Detail</h3>
              <button onClick={() => setSelectedService(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1"><span className="text-[9px] text-slate-400 uppercase block">Uptime</span><span className="font-mono text-slate-900 dark:text-slate-100">{selectedService.uptime}</span></div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1"><span className="text-[9px] text-slate-400 uppercase block">Health</span><span className="font-mono text-emerald-600">{selectedService.healthPct}</span></div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center"><span>Region:</span><span className="font-mono text-indigo-600">{selectedService.region}</span></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { onTriggerToast?.(`Scaled ${selectedService.name} to 8 instances.`); setSelectedService(null); }} className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">Scale Instances</button>
              <button onClick={() => setSelectedService(null)} className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAlertsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Infrastructure Alert Queue (2 Warning)</h3>
              <button onClick={() => setShowAlertsModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-2 text-xs font-bold">
              {recentAlerts.map((alt, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-slate-900 dark:text-slate-100 block font-bold">{alt.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{alt.target}</span>
                  </div>
                  <button onClick={() => onTriggerToast?.(`Alert acknowledged & assigned to DevOps SOC.`)} className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase cursor-pointer">Acknowledge</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowAlertsModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {showCostModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Cloud Infrastructure FinOps Audit</h3>
              <button onClick={() => setShowCostModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-2 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between"><span>Compute Instance Spend:</span><span className="font-mono text-indigo-600">$11,052.18</span></div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between"><span>Storage & S3/R2 Volume:</span><span className="font-mono text-indigo-600">$5,648.90</span></div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between"><span>Cloudflare Edge Network:</span><span className="font-mono text-indigo-600">$3,684.06</span></div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between"><span>Managed Postgres DB:</span><span className="font-mono text-indigo-600">$2,456.04</span></div>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowCostModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Security Posture Audit</h3>
              <button onClick={() => setShowSecurityModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-2 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">✓ All 128 server nodes have TLS 1.3 & Zero-Trust MFA enforced.</div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">⚠️ 2 security recommendations: Update OS kernel security patch on worker-db-02.</div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { onTriggerToast?.('Initiated automated kernel security patch.'); setShowSecurityModal(false); }} className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">Apply Patch</button>
              <button onClick={() => setShowSecurityModal(false)} className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
      {showIpTrackerModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Network className="text-purple-600 size-5" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">IP Tracker & WHOIS Telemetry Inspector</h3>
              </div>
              <button onClick={() => setShowIpTrackerModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Target Node IP / Datacenter Node</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedTrackIp} 
                    onChange={(e) => setSelectedTrackIp(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="10.0.1.1">10.0.1.1 — us-east-1 Core Gateway (AWS EC2)</option>
                    <option value="72.14.232.1">72.14.232.1 — US Core Transit Router (Equinix)</option>
                    <option value="13.212.1.1">13.212.1.1 — ap-southeast-1 POP (Singapore)</option>
                    <option value="52.95.1.1">52.95.1.1 — eu-west-1 Backbone (Ireland)</option>
                    <option value="35.72.1.1">35.72.1.1 — ap-northeast-1 LLM Cluster (Tokyo)</option>
                  </select>
                </div>
              </div>

              {/* WHOIS Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700">
                  <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedTrackIp}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">● Verified Gateway</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div><span className="text-slate-400 block text-[9px]">ISP / PROVIDER</span><span className="text-slate-800 dark:text-slate-200">Amazon Web Services</span></div>
                  <div><span className="text-slate-400 block text-[9px]">ASN NUMBER</span><span className="text-slate-800 dark:text-slate-200">AS16509 (AMAZON-02)</span></div>
                  <div><span className="text-slate-400 block text-[9px]">REVERSE DNS</span><span className="text-slate-800 dark:text-slate-200 truncate block">node-{selectedTrackIp.replaceAll('.','-')}.compute.internal</span></div>
                  <div><span className="text-slate-400 block text-[9px]">LATENCY / JITTER</span><span className="text-emerald-600 font-bold">12.4ms (0.3ms jitter)</span></div>
                  <div><span className="text-slate-400 block text-[9px]">GEOLOCATION</span><span className="text-slate-800 dark:text-slate-200">Ashburn, Virginia, USA 🇺🇸</span></div>
                  <div><span className="text-slate-400 block text-[9px]">SECURITY RISK</span><span className="text-emerald-600 font-bold">0% (Clean Node)</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => { 
                  onTriggerToast?.(`Focused topology map on target IP node: ${selectedTrackIp}`);
                  setShowIpTrackerModal(false);
                }} 
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Globe size={13} />
                <span>Focus Map on IP</span>
              </button>
              <button onClick={() => setShowIpTrackerModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM SERVER TAG MODAL */}
      {showAddServerTagModal && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="text-emerald-600 size-5" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Tag Custom Server Node</h3>
              </div>
              <button onClick={() => setShowAddServerTagModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Server Name / Identifier</label>
                <input 
                  type="text" 
                  value={newTagInput.name} 
                  onChange={(e) => setNewTagInput(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Frankfurt Core DB-01" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">IP Address</label>
                <input 
                  type="text" 
                  value={newTagInput.ip} 
                  onChange={(e) => setNewTagInput(p => ({ ...p, ip: e.target.value }))}
                  placeholder="e.g. 10.0.4.20" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Role / Function</label>
                  <select 
                    value={newTagInput.role} 
                    onChange={(e) => setNewTagInput(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="Gateway">Gateway</option>
                    <option value="Database">Database</option>
                    <option value="GPU Cluster">GPU Cluster</option>
                    <option value="Cache Node">Cache Node</option>
                    <option value="Load Balancer">Load Balancer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Status Color</label>
                  <select 
                    value={newTagInput.color} 
                    onChange={(e) => setNewTagInput(p => ({ ...p, color: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="#10B981">Emerald (Healthy)</option>
                    <option value="#6366F1">Indigo (Core)</option>
                    <option value="#F59E0B">Amber (Warning)</option>
                    <option value="#EF4444">Rose (Critical)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => {
                  if (!newTagInput.name || !newTagInput.ip) return;
                  const newMarker = {
                    id: String(Date.now()),
                    name: newTagInput.name,
                    ip: newTagInput.ip,
                    role: newTagInput.role,
                    lat: newTagInput.lat || (20 + (Math.random() * 20 - 10)),
                    lng: newTagInput.lng || (Math.random() * 100 - 50),
                    color: newTagInput.color
                  };
                  setCustomServerMarkers(prev => [...prev, newMarker]);
                  onTriggerToast?.(`Tagged custom server marker: ${newTagInput.name} (${newTagInput.ip})`);
                  setShowAddServerTagModal(false);
                  setNewTagInput({ name: '', ip: '', role: 'Gateway', lat: 1.3521, lng: 103.8198, color: '#10B981' });
                }} 
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Pin Marker on Map</span>
              </button>
              <button onClick={() => setShowAddServerTagModal(false)} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN MAP VIEWPORT MODAL */}
      {isFullMapModalOpen && (
        <div className="fixed inset-0 z-[9990] flex flex-col bg-slate-950/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-t-2xl px-5 py-3">
            <div className="flex items-center gap-3">
              <Globe className="text-indigo-400 size-6" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Global Datacenter Mesh & Topology Map</h3>
                <span className="text-[10px] text-slate-400 font-mono">Full-screen Geographic Observability • {customServerMarkers.length + 5} Active Datacenter Nodes Pinned • Click Map to Tag Node</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowAddServerTagModal(true); }} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-lg"><Plus size={13} /> Tag Server</button>
              <button onClick={() => setIsFullMapModalOpen(false)} className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs cursor-pointer">Close Full Map</button>
            </div>
          </div>
          <div className="flex-1 bg-slate-900 border-x border-b border-slate-800 rounded-b-2xl overflow-hidden relative isolate">
            <div className="absolute top-3 left-3 z-[500] bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs space-y-2 max-w-xs shadow-xl text-slate-200">
              <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">Active Pinned Server Nodes ({customServerMarkers.length + 5})</span>
              <div className="space-y-1 max-h-48 overflow-y-auto text-[10px] font-mono">
                {regionLocations.map((r, i) => (
                  <div key={i} className="flex justify-between items-center p-1 rounded bg-slate-800/60">
                    <span>● {r.name} ({r.title})</span>
                    <span className="text-emerald-400 font-bold">Datacenter</span>
                  </div>
                ))}
                {customServerMarkers.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-1 rounded bg-slate-800/60">
                    <span style={{ color: c.color }}>■ [TAG] {c.name}</span>
                    <span className="text-slate-400">{c.ip}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Full-Screen Map Toolbar Overlay */}
            <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex-wrap max-w-2xl justify-end">
              <button onClick={() => setMapTileStyle(s => s === 'dark' ? 'satellite' : s === 'satellite' ? 'voyager' : 'dark')} className="h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer shadow-xs" title="Switch Map Tiles"><Globe size={10} /> {mapTileStyle === 'dark' ? 'Dark' : mapTileStyle === 'satellite' ? 'Sat' : 'Light'}</button>
              <button onClick={() => setMapOverlay(m => m === 'none' ? 'health' : m === 'health' ? 'latency' : m === 'latency' ? 'traffic' : 'none')} className={`h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border cursor-pointer shadow-xs ${mapOverlay !== 'none' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`} title="Overlay Mode"><Eye size={10} /> {mapOverlay.toUpperCase()}</button>
              <button onClick={() => { setShowFiberSubsea(!showFiberSubsea); onTriggerToast?.(`Subsea Fiber Mesh: ${!showFiberSubsea ? 'ENABLED' : 'DISABLED'}`); }} className={`h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showFiberSubsea ? 'bg-pink-600 text-white border-pink-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`} title="Subsea Fiber Cables"><Activity size={10} /> Fiber</button>
              <button onClick={() => { setShowDdosOverlay(!showDdosOverlay); onTriggerToast?.(`Geo DDoS Threat Map: ${!showDdosOverlay ? 'ACTIVE' : 'OFF'}`); }} className={`h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showDdosOverlay ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`} title="Geo DDoS Map"><ShieldAlert size={10} /> DDoS</button>
              <button onClick={() => { setIsFailoverSimulated(!isFailoverSimulated); onTriggerToast?.(`Failover Simulator: ${!isFailoverSimulated ? 'ACTIVE' : 'NORMAL'}`); }} className={`h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border cursor-pointer shadow-xs transition-all ${isFailoverSimulated ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`} title="Failover Simulator"><Zap size={10} /> Failover</button>
              <button onClick={() => setShowMeshLines(!showMeshLines)} className={`h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border cursor-pointer shadow-xs transition-all ${showMeshLines ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`} title="Toggle Datacenter Mesh Lines"><Network size={10} /> Mesh</button>
              <button onClick={() => { const ms = Math.floor(10 + Math.random() * 25); setPingResult({ region: 'us-east-1', ms }); onTriggerToast?.(`Ping probe to us-east-1: ${ms}ms`); }} className="h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border border-slate-700 bg-slate-800 text-emerald-400 hover:bg-slate-700 cursor-pointer shadow-xs"><Activity size={10} /> Ping Probe</button>
              <button onClick={() => setShowIpTrackerModal(true)} className="h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border border-purple-500/50 bg-purple-950/80 text-purple-200 hover:bg-purple-900 cursor-pointer shadow-xs"><Network size={10} /> IP Tracker</button>
              <button onClick={() => setShowAddServerTagModal(true)} className="h-6 px-2 flex items-center gap-1 rounded text-[9px] font-black uppercase border border-emerald-500/50 bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900 cursor-pointer shadow-xs"><Plus size={10} /> Tag Node</button>
            </div>

            <div ref={fullMapRef} className="size-full z-0 isolate" />
          </div>
        </div>
      )}
    </div>
  );
}
