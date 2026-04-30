import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUrgencyColors, UrgencyLevel } from '../utils/urgencyColors';
import { formatDistanceToNow } from 'date-fns';
import { useEffect } from 'react';

const { BaseLayer } = LayersControl;

interface Report {
  id: string;
  latitude: number | null;
  longitude: number | null;
  urgencyLevel: UrgencyLevel;
  issueType?: string;
  translatedSummary: string;
  createdAt: Date | string;
}

interface MapComponentProps {
  reports: Report[];
  selectedReport?: Report | null;
  focusTrigger?: number;
}

const createDonutIcon = (urgency: UrgencyLevel, isSelected: boolean) => {
  const colors = getUrgencyColors(urgency);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${urgency === 'High' ? `<div class="absolute w-10 h-10 rounded-full bg-red-500/20 animate-ping"></div>` : ''}
        ${isSelected ? `<div class="absolute w-12 h-12 rounded-full border-2 border-blue-500 animate-pulse"></div>` : ''}
        <div class="absolute w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center ring-2 ring-white">
          <div class="w-4 h-4 rounded-full ${colors.strip} border border-white"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const NGO_ICON = L.divIcon({
  className: 'ngo-marker',
  html: `
    <div class="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border-2 border-white shadow-2xl">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapController({ selectedReport, focusTrigger }: { selectedReport?: any, focusTrigger?: number }) {
  const map = useMap();
  useEffect(() => {
    if (selectedReport?.latitude && selectedReport?.longitude) {
      map.flyTo([selectedReport.latitude, selectedReport.longitude], 15, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedReport, map, focusTrigger]);
  return null;
}

export default function MapComponent({ reports, selectedReport, focusTrigger }: MapComponentProps) {
  const validReports = reports.filter(r => r.latitude && r.longitude);
  const NGO_HQ = { lat: 34.0151, lng: 71.5249 }; // NGO Center Peshawar

  return (
    <div className="h-full w-full rounded-[2rem] overflow-hidden relative shadow-inner bg-[#E3F2FD]/50 group">
      <MapContainer
        center={[NGO_HQ.lat, NGO_HQ.lng]}
        zoom={8}
        className="h-full w-full z-10"
        zoomControl={false}
      >
        <MapController selectedReport={selectedReport} focusTrigger={focusTrigger} />
        <ZoomControl position="bottomright" />
        
        <LayersControl position="topright">
          <BaseLayer checked name="Standard">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
            />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri"
            />
          </BaseLayer>
          <BaseLayer name="Terrain">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri"
            />
          </BaseLayer>
        </LayersControl>

        {/* NGO HQ Marker */}
        <Marker position={[NGO_HQ.lat, NGO_HQ.lng]} icon={NGO_ICON}>
          <Popup>
            <div className="p-2 font-bold text-slate-800">NGO Central Command - Peshawar</div>
          </Popup>
        </Marker>

        {validReports.map((report) => {
          const colors = getUrgencyColors(report.urgencyLevel);
          const date = typeof report.createdAt === 'string' ? new Date(report.createdAt) : report.createdAt;
          const isSelected = selectedReport?.id === report.id;

          return (
            <Marker
              key={report.id}
              position={[report.latitude!, report.longitude!]}
              icon={createDonutIcon(report.urgencyLevel, isSelected)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 min-w-[200px]">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
                        {report.urgencyLevel}
                      </span>
                      {report.issueType && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {report.issueType}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold italic whitespace-nowrap">
                      {formatDistanceToNow(date, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Incident Message</p>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed italic">
                      "{report.translatedSummary}"
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl border border-white/10 pointer-events-auto">
          KPK Disaster Response Command
        </div>
        {selectedReport && (
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg pointer-events-auto">
            Focus: {selectedReport.issueType || 'Incident'} #{selectedReport.id.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
