import React, { useEffect, useRef, useState } from 'react';
import { Globe, Plus, Minus, Target, ArrowRight, ChevronDown } from 'lucide-react';
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
}

const LOCATIONS: ThreatLocation[] = [
  { id: 'us', country: 'United States', code: 'US', flag: '🇺🇸', count: 12, severity: 'high', lat: 37.0902, lng: -95.7129 },
  { id: 'sg', country: 'Singapore', code: 'SG', flag: '🇸🇬', count: 5, severity: 'medium', lat: 1.3521, lng: 103.8198 },
  { id: 'de', country: 'Germany', code: 'DE', flag: '🇩🇪', count: 5, severity: 'medium', lat: 51.1657, lng: 10.4515 },
  { id: 'id', country: 'Indonesia', code: 'ID', flag: '🇮🇩', count: 2, severity: 'low', lat: -0.7893, lng: 113.9213 },
  { id: 'br', country: 'Brazil', code: 'BR', flag: '🇧🇷', count: 2, severity: 'low', lat: -14.2350, lng: -51.9253 },
];

interface InteractiveThreatMapProps {
  onOpenFullMap?: () => void;
}

export function InteractiveThreatMap({ onOpenFullMap }: InteractiveThreatMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<ThreatLocation | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 1.2,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    LOCATIONS.forEach((loc) => {
      const color = loc.severity === 'high' ? '#EF4444' : loc.severity === 'medium' ? '#F59E0B' : '#8B5CF6';
      
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; width: 22px; height: 22px;">
            <div style="position: absolute; width: 100%; height: 100%; background-color: ${color}; opacity: 0.4; border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 14px; height: 14px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px ${color};"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="padding: 4px; text-align: center; font-family: sans-serif; min-width: 110px;">
          <div style="font-size: 13px; font-weight: bold;">${loc.flag} ${loc.country}</div>
          <div style="font-size: 10px; color: ${color}; font-weight: 800; margin-top: 2px;">
            ${loc.count} ${loc.severity.toUpperCase()} THREATS
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false });
      marker.on('mouseover', () => {
        marker.openPopup();
        setSelectedCountry(loc);
      });
      marker.on('click', () => {
        setSelectedCountry(loc);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetZoom = () => mapInstanceRef.current?.setView([20, 0], 1.2);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={14} className="text-indigo-600 dark:text-indigo-400" /> THREAT MAP (LIVE)
          </h3>
          <p className="text-[10.5px] text-slate-400 font-medium">Interactive global threat heatmap</p>
        </div>
        <button
          onClick={onOpenFullMap}
          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>View full map</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Map Canvas + Controls */}
      <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
        <div ref={mapContainerRef} className="size-full z-0" />

        {/* Map Control Buttons (+ / - / target) */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-md">
          <button onClick={handleZoomIn} title="Zoom in" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer">
            <Plus size={13} />
          </button>
          <button onClick={handleZoomOut} title="Zoom out" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer">
            <Minus size={13} />
          </button>
          <button onClick={handleResetZoom} title="Reset view" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer">
            <Target size={13} />
          </button>
        </div>

        {/* Selected Location Pill */}
        {selectedCountry && (
          <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg border border-slate-700">
            <span>{selectedCountry.flag}</span>
            <span>{selectedCountry.country}: <span className="text-rose-400 font-extrabold">{selectedCountry.count} {selectedCountry.severity}</span></span>
          </div>
        )}
      </div>

      {/* Threat Summary Legend Bar */}
      <div className="flex items-center justify-between text-[10px] font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-rose-600"><span className="size-2 rounded-full bg-rose-500" /> High 5</span>
          <span className="flex items-center gap-1 text-amber-600"><span className="size-2 rounded-full bg-amber-500" /> Medium 12</span>
          <span className="flex items-center gap-1 text-blue-600"><span className="size-2 rounded-full bg-blue-500" /> Low 23</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="font-extrabold text-slate-800 dark:text-slate-200">Total 40</span>
          <span className="flex items-center gap-0.5 text-slate-400 cursor-pointer hover:text-slate-600">Last 24h <ChevronDown size={10} /></span>
        </div>
      </div>

      {/* TOP AFFECTED LOCATIONS */}
      <div className="space-y-1.5 text-xs pt-1">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Top Affected Locations</span>
        {LOCATIONS.map((loc) => (
          <div 
            key={loc.id} 
            onClick={() => {
              setSelectedCountry(loc);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([loc.lat, loc.lng], 3);
              }
            }}
            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{loc.flag}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{loc.country}</span>
            </div>
            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded uppercase ${
              loc.severity === 'high' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' :
              loc.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' :
              'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}>
              {loc.count} {loc.severity.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
