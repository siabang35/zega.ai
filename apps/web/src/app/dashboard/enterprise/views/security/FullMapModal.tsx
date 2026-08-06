import React, { useEffect, useRef, useState } from 'react';
import { Globe, Plus, Minus, Target, X, ShieldAlert, Radio, Filter, RefreshCw, Layers, Sun, Moon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ThreatLocation {
  id: string;
  country: string;
  code: string;
  flag: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  lat: number;
  lng: number;
  targetIp: string;
}

const FULL_LOCATIONS: ThreatLocation[] = [
  { id: 'us', country: 'United States', code: 'US', flag: '🇺🇸', count: 12, severity: 'high', lat: 37.0902, lng: -95.7129, targetIp: '104.28.14.92' },
  { id: 'sg', country: 'Singapore', code: 'SG', flag: '🇸🇬', count: 5, severity: 'medium', lat: 1.3521, lng: 103.8198, targetIp: '128.199.201.4' },
  { id: 'de', country: 'Germany', code: 'DE', flag: '🇩🇪', count: 5, severity: 'medium', lat: 51.1657, lng: 10.4515, targetIp: '138.68.109.12' },
  { id: 'id', country: 'Indonesia', code: 'ID', flag: '🇮🇩', count: 2, severity: 'low', lat: -0.7893, lng: 113.9213, targetIp: '103.12.45.67' },
  { id: 'br', country: 'Brazil', code: 'BR', flag: '🇧🇷', count: 2, severity: 'low', lat: -14.2350, lng: -51.9253, targetIp: '177.126.89.10' },
  { id: 'jp', country: 'Japan', code: 'JP', flag: '🇯🇵', count: 4, severity: 'medium', lat: 36.2048, lng: 138.2529, targetIp: '133.242.18.9' },
  { id: 'uk', country: 'United Kingdom', code: 'GB', flag: '🇬🇧', count: 3, severity: 'low', lat: 55.3781, lng: -3.4360, targetIp: '51.140.89.2' },
  { id: 'au', country: 'Australia', code: 'AU', flag: '🇦🇺', count: 7, severity: 'high', lat: -25.2744, lng: 133.7751, targetIp: '139.130.4.5' },
];

interface FullMapModalProps {
  onClose: () => void;
}

export function FullMapModal({ onClose }: FullMapModalProps) {
  const modalMapContainerRef = useRef<HTMLDivElement>(null);
  const modalMapInstanceRef = useRef<L.Map | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<ThreatLocation | null>(FULL_LOCATIONS[0]);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Theme state: dark or light
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const filteredLocations = FULL_LOCATIONS.filter((loc) => 
    severityFilter === 'all' ? true : loc.severity === severityFilter
  );

  useEffect(() => {
    if (!modalMapContainerRef.current) return;

    if (modalMapInstanceRef.current) {
      modalMapInstanceRef.current.remove();
      modalMapInstanceRef.current = null;
    }

    const map = L.map(modalMapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
    });

    modalMapInstanceRef.current = map;

    // Tile layer based on theme
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    filteredLocations.forEach((loc) => {
      const color = loc.severity === 'high' ? '#EF4444' : loc.severity === 'medium' ? '#F59E0B' : '#3B82F6';
      
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker-modal',
        html: `
          <div style="position: relative; width: 26px; height: 26px;">
            <div style="position: absolute; width: 100%; height: 100%; background-color: ${color}; opacity: 0.5; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 5px; left: 5px; width: 16px; height: 16px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 12px ${color};"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="padding: 6px; text-align: center; font-family: sans-serif; min-width: 140px;">
          <div style="font-size: 14px; font-weight: bold; color: #0F172A;">${loc.flag} ${loc.country}</div>
          <div style="font-size: 11px; color: ${color}; font-weight: 800; margin-top: 2px;">
            ${loc.count} ${loc.severity.toUpperCase()} THREATS
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 4px; font-family: monospace;">IP: ${loc.targetIp}</div>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false });
      marker.on('click', () => {
        setSelectedLoc(loc);
      });
    });

    return () => {
      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
      }
    };
  }, [severityFilter, isDarkMode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Global Threat Intelligence & Live Sensor Radar
                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 text-[9.5px] font-mono uppercase tracking-widest flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-rose-500 animate-ping" /> Realtime IP Sensors
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interactive geographic IP anomaly distribution and BGP threat origins</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Switcher Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Switch to Light Map' : 'Switch to Dark Map'}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
            >
              {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
              <span>{isDarkMode ? 'Light Map' : 'Dark Map'}</span>
            </button>

            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Filter size={12} /> Severity:</span>
            {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-xl text-[10.5px] font-extrabold uppercase transition-all cursor-pointer ${
                  severityFilter === sev 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-rose-600 dark:text-rose-400 font-bold">High: 19</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Medium: 17</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Low: 8</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Total: 44 Active Sensors</span>
          </div>
        </div>

        {/* Leaflet Map Canvas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[360px]">
          {/* Map */}
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <div ref={modalMapContainerRef} className="size-full z-0" />

            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-lg">
              <button onClick={() => modalMapInstanceRef.current?.zoomIn()} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer">
                <Plus size={14} />
              </button>
              <button onClick={() => modalMapInstanceRef.current?.zoomOut()} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer">
                <Minus size={14} />
              </button>
              <button onClick={() => modalMapInstanceRef.current?.setView([20, 0], 2)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer">
                <Target size={14} />
              </button>
            </div>
          </div>

          {/* Right Location Telemetry Panel */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3 flex flex-col justify-between overflow-y-auto max-h-[380px]">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              Active Geolocation Sensors ({filteredLocations.length})
            </h4>

            <div className="space-y-2 text-xs">
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => {
                    setSelectedLoc(loc);
                    modalMapInstanceRef.current?.flyTo([loc.lat, loc.lng], 4);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedLoc?.id === loc.id 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white' 
                      : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-sm">{loc.flag} {loc.country}</span>
                    <span className={`text-[9px] font-black px-2 py-0.3 rounded uppercase ${
                      loc.severity === 'high' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' :
                      loc.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                      'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    }`}>
                      {loc.count} {loc.severity}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                    <span>IP: {loc.targetIp}</span>
                    <span>Lat: {loc.lat.toFixed(1)}°</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedLoc && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] shrink-0">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block">Sensor Insights: {selectedLoc.country}</span>
                <p className="text-slate-500 dark:text-slate-400 text-[10.5px]">Detected {selectedLoc.count} suspicious connection requests targeting ZeroClaw gateway.</p>
                <div className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400">Status: Active Sentinel Mitigation Enabled</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
