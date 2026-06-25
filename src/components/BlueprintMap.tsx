import React, { useState, useMemo, useRef, useEffect } from "react";
import { IssueReport, Hotspot, IssueCategory } from "../types";
import { AlertTriangle, MapPin, Eye, CheckCircle2, Navigation, ZoomIn, ZoomOut, Compass } from "lucide-react";

interface BlueprintMapProps {
  reports: IssueReport[];
  selectedReportId?: string;
  onSelectReport: (report: IssueReport) => void;
  onMapClick?: (lat: number, lng: number, areaName: string) => void;
  showHotspotsOnly?: boolean;
  currentUserId: string;
  userLocation: { lat: number; lng: number };
  onConfirmIssue: (reportId: string) => void;
}

// Bounding box for Sprocket District
const MIN_LAT = 37.7950;
const MAX_LAT = 37.8150;
const MIN_LNG = -122.2800;
const MAX_LNG = -122.2600;

const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function BlueprintMap({
  reports,
  selectedReportId,
  onSelectReport,
  onMapClick,
  showHotspotsOnly = false,
  currentUserId,
  userLocation,
  onConfirmIssue,
}: BlueprintMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Projection logic: converts Lat/Lng to local SVG coordinates (1000x800)
  const width = 1000;
  const height = 800;

  const project = (lat: number, lng: number) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * width;
    const y = (1 - (lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * height;
    return { x, y };
  };

  const unproject = (x: number, y: number) => {
    const lng = MIN_LNG + (x / width) * (MAX_LNG - MIN_LNG);
    const lat = MIN_LAT + (1 - y / height) * (MAX_LAT - MIN_LAT);
    return { lat, lng };
  };

  // Compute hotspots: 3+ issues of the same category within ~200m (coordinate diff approx 0.0018)
  const hotspots = useMemo(() => {
    const computed: Hotspot[] = [];
    const categories: IssueCategory[] = ["Pothole", "Streetlight", "Waste", "Water Leakage", "Other"];

    categories.forEach((cat) => {
      const catReports = reports.filter((r) => r.category === cat && r.status !== "RESOLVED");
      
      // Simple cluster clustering for hackathon (within ~200m)
      const usedIds = new Set<string>();

      catReports.forEach((r1) => {
        if (usedIds.has(r1.id)) return;

        const cluster = catReports.filter((r2) => {
          const latDiff = r1.lat - r2.lat;
          const lngDiff = r1.lng - r2.lng;
          const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          return dist <= 0.0018; // ~200m
        });

        if (cluster.length >= 3) {
          cluster.forEach((c) => usedIds.add(c.id));
          
          // Center of cluster
          const avgLat = cluster.reduce((sum, r) => sum + r.lat, 0) / cluster.length;
          const avgLng = cluster.reduce((sum, r) => sum + r.lng, 0) / cluster.length;

          computed.push({
            id: `hotspot-${cat}-${Date.now()}-${Math.random()}`,
            category: cat,
            lat: avgLat,
            lng: avgLng,
            areaName: r1.areaName,
            issueCount: cluster.length,
            issueIds: cluster.map((c) => c.id),
            radius: 200,
          });
        }
      });
    });

    return computed;
  }, [reports]);

  // Handle map interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking a button, pin, or hotspot, don't pan
    if ((e.target as HTMLElement).closest(".interactive-map-element")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!onMapClick || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    if (clickX >= 0 && clickX <= width && clickY >= 0 && clickY <= height) {
      const { lat, lng } = unproject(clickX, clickY);
      
      // Reverse-engineer area name based on coordinates
      let area = "District Grid C";
      if (lat > 37.8080) area = "North Ward";
      else if (lat < 37.8000) area = "Port Sector 1";
      else if (lng > -122.2660) area = "Lakeside Grid";
      else if (lng < -122.2740) area = "Plaza sector";
      else area = "Downtown Core";

      onMapClick(
        Math.round(lat * 10000) / 10000,
        Math.round(lng * 10000) / 10000,
        area
      );
    }
  };

  const adjustZoom = (amount: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + amount)));
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get color depending on category
  const getCategoryColor = (cat: IssueCategory) => {
    switch (cat) {
      case "Pothole": return "#E8631C"; // Safety Orange
      case "Streetlight": return "#F59E0B"; // Stamped Yellow
      case "Waste": return "#92400E"; // Wood Grey
      case "Water Leakage": return "#0D9488"; // Teal
      default: return "#6B6B63"; // Pencil Grey
    }
  };

  return (
    <div className="relative w-full h-[580px] bg-blueprint border border-pencil-grey overflow-hidden select-none cursor-grab active:cursor-grabbing">
      {/* Blueprint background grid pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" 
           style={{ 
             backgroundImage: "radial-gradient(#F2E9D8 1px, transparent 1px), linear-gradient(to right, #F2E9D8 1px, transparent 1px), linear-gradient(to bottom, #F2E9D8 1px, transparent 1px)",
             backgroundSize: "40px 40px, 40px 40px, 40px 40px"
           }} 
      />

      {/* Grid Coordinates Overlay */}
      <div className="absolute top-2 left-3 font-mono text-[10px] text-pencil-grey pointer-events-none">
        GRID SECTOR: SPROCKET-CA-04 · {MIN_LAT}°N to {MAX_LAT}°N / {Math.abs(MAX_LNG)}°W to {Math.abs(MIN_LNG)}°W
      </div>

      {/* Compass / Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
          onClick={() => adjustZoom(0.25)} 
          className="interactive-map-element bg-stamped-cream hover:bg-safety-orange hover:text-stencil-white text-blueprint p-2 border border-blueprint font-mono flex items-center justify-center transition-colors shadow-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => adjustZoom(-0.25)} 
          className="interactive-map-element bg-stamped-cream hover:bg-safety-orange hover:text-stencil-white text-blueprint p-2 border border-blueprint font-mono flex items-center justify-center transition-colors shadow-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={resetMap} 
          className="interactive-map-element bg-stamped-cream hover:bg-safety-orange hover:text-stencil-white text-blueprint px-2 py-1 border border-blueprint font-mono text-[10px] uppercase font-bold transition-colors shadow-sm"
          title="Reset"
        >
          RESET
        </button>
      </div>

      {/* Map Content Container */}
      <div 
        ref={mapRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          className="w-[1000px] h-[800px] relative"
        >
          {/* Base SVG Map Illustration */}
          <svg width={width} height={height} className="absolute inset-0 pointer-events-none">
            {/* Street Blueprint Lines */}
            {/* Broadway (vertical) */}
            <g>
              <line x1="350" y1="0" x2="350" y2="800" stroke="#F2E9D8" strokeWidth="18" strokeOpacity="0.2" />
              <line x1="350" y1="0" x2="350" y2="800" stroke="#F2E9D8" strokeWidth="2" strokeDasharray="5 5" strokeOpacity="0.8" />
              <text x="365" y="40" fill="#FAF7F0" fillOpacity="0.4" fontFamily="monospace" fontSize="10">BROADWAY SEC. 4</text>
            </g>

            {/* 14th Street (horizontal) */}
            <g>
              <line x1="0" y1="440" x2="1000" y2="440" stroke="#F2E9D8" strokeWidth="18" strokeOpacity="0.2" />
              <line x1="0" y1="440" x2="1000" y2="440" stroke="#F2E9D8" strokeWidth="2" strokeDasharray="5 5" strokeOpacity="0.8" />
              <text x="20" y="430" fill="#FAF7F0" fillOpacity="0.4" fontFamily="monospace" fontSize="10">E. 14TH STREET</text>
            </g>

            {/* Lakeside Boulevard Curve */}
            <g>
              <path d="M 150 150 Q 550 250 850 670" fill="none" stroke="#F2E9D8" strokeWidth="24" strokeOpacity="0.15" />
              <path d="M 150 150 Q 550 250 850 670" fill="none" stroke="#F2E9D8" strokeWidth="2" strokeDasharray="8 4" strokeOpacity="0.7" />
              <text x="680" y="490" fill="#FAF7F0" fillOpacity="0.4" fontFamily="monospace" fontSize="10" transform="rotate(35 680 490)">LAKESIDE BLVD</text>
            </g>

            {/* Plaza Way (vertical) */}
            <g>
              <line x1="180" y1="0" x2="180" y2="800" stroke="#F2E9D8" strokeWidth="10" strokeOpacity="0.15" />
              <line x1="180" y1="0" x2="180" y2="800" stroke="#F2E9D8" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.6" />
              <text x="195" y="600" fill="#FAF7F0" fillOpacity="0.4" fontFamily="monospace" fontSize="10" transform="rotate(-90 195 600)">PLAZA WAY</text>
            </g>

            {/* Lake Merritt (Water body outline) */}
            <g>
              <path d="M 600 50 C 750 80, 850 180, 950 280 C 900 450, 780 400, 700 350 C 620 300, 580 180, 600 50 Z" 
                    fill="none" stroke="#F2E9D8" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.4" />
              {/* Hatched lines pattern */}
              <defs>
                <pattern id="waterHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#FAF7F0" strokeWidth="1" strokeOpacity="0.15" />
                </pattern>
              </defs>
              <path d="M 600 50 C 750 80, 850 180, 950 280 C 900 450, 780 400, 700 350 C 620 300, 580 180, 600 50 Z" 
                    fill="url(#waterHatch)" />
              <text x="730" y="200" fill="#FAF7F0" fillOpacity="0.3" fontFamily="monospace" fontSize="11" letterSpacing="0.2em">SPROCKET BASIN</text>
            </g>

            {/* Sprocket Plaza Landmark Rect */}
            <g>
              <rect x="120" y="320" width="120" height="100" fill="none" stroke="#F2E9D8" strokeWidth="1.5" strokeOpacity="0.5" />
              <line x1="120" y1="320" x2="240" y2="420" stroke="#F2E9D8" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="240" y1="320" x2="120" y2="420" stroke="#F2E9D8" strokeWidth="0.5" strokeOpacity="0.3" />
              <text x="135" y="375" fill="#FAF7F0" fillOpacity="0.4" fontFamily="monospace" fontSize="10">SPROCKET PLAZA</text>
            </g>

            {/* Scale Marker */}
            <g transform="translate(50, 750)">
              <line x1="0" y1="0" x2="150" y2="0" stroke="#FAF7F0" strokeWidth="2" strokeOpacity="0.7" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#FAF7F0" strokeWidth="2" strokeOpacity="0.7" />
              <line x1="75" y1="-3" x2="75" y2="3" stroke="#FAF7F0" strokeWidth="1" strokeOpacity="0.7" />
              <line x1="150" y1="-5" x2="150" y2="5" stroke="#FAF7F0" strokeWidth="2" strokeOpacity="0.7" />
              <text x="45" y="-10" fill="#FAF7F0" fillOpacity="0.6" fontFamily="monospace" fontSize="9">SCALE: 200 METERS</text>
            </g>
          </svg>

          {/* Hotspot Radar Pings */}
          {hotspots.map((hs) => {
            const pos = project(hs.lat, hs.lng);
            return (
              <div
                key={hs.id}
                style={{ left: pos.x, top: pos.y }}
                className="absolute interactive-map-element -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto"
                onMouseEnter={() => setHoveredHotspot(hs)}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                {/* Expand pulses */}
                <div className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-safety-orange opacity-45 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-safety-orange opacity-60 animate-ping" style={{ animationDuration: '2s' }} />
                
                {/* Hotspot anchor core */}
                <div className="w-5 h-5 rounded-full bg-safety-orange border border-stamped-cream flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-stamped-cream" />
                </div>
              </div>
            );
          })}

          {/* Issue Pins */}
          {reports
            .filter((r) => !showHotspotsOnly || hotspots.some((hs) => hs.issueIds.includes(r.id)))
            .map((r) => {
              const pos = project(r.lat, r.lng);
              const color = getCategoryColor(r.category);
              const isSelected = r.id === selectedReportId;
              const isHighPriority = r.confirmCount >= 6 && r.status !== "RESOLVED";

              return (
                <React.Fragment key={r.id}>
                  {/* Pulsing Red Ring for High Priority Active Issues */}
                  {isHighPriority && (
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-600 opacity-75 animate-ping pointer-events-none" 
                      style={{ 
                        left: pos.x, 
                        top: pos.y, 
                        width: '42px', 
                        height: '42px', 
                        animationDuration: '1.2s',
                        zIndex: 10 
                      }} 
                    />
                  )}

                  <button
                    style={{ left: pos.x, top: pos.y }}
                    className="absolute interactive-map-element -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group focus:outline-none"
                    onClick={() => onSelectReport(r)}
                  >
                    {/* Outer selection glow */}
                    {isSelected && (
                      <div className="absolute inset-0 -m-3 border border-dashed border-stamped-cream animate-spin" style={{ animationDuration: '10s', borderRadius: '0' }} />
                    )}

                    {/* Pin Body: Sketchy circle tag */}
                    <div 
                      className={`w-7 h-7 flex items-center justify-center border-2 transition-all shadow-md ${
                        isSelected 
                          ? "scale-125 border-stamped-cream ring-2 ring-safety-orange bg-blueprint" 
                          : isHighPriority
                          ? "border-red-600 ring-2 ring-red-600 bg-stamped-cream scale-110"
                          : "border-blueprint hover:scale-115 hover:border-stamped-cream bg-stamped-cream"
                      }`}
                      style={{ 
                        clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", // Hexagon/irregular badge shape
                        backgroundColor: isSelected ? "#1B2A3F" : "#F2E9D8",
                      }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: isSelected ? "#E8631C" : isHighPriority ? "#dc2626" : color }} />
                    </div>

                    {/* Status Indicator Stamp Mini */}
                    {r.status === "RESOLVED" && (
                      <div className="absolute -top-1 -right-1 bg-verified-green text-stamped-cream rounded-full p-0.5 border border-stamped-cream shadow-sm scale-75">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {r.status === "VERIFIED" && (
                      <div className="absolute -top-1 -right-1 bg-blueprint text-verified-green rounded-full p-0.5 border border-verified-green shadow-sm scale-75">
                        <Eye className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {/* Monospace Quick Hover Overlay */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-blueprint border border-pencil-grey p-1.5 z-50 pointer-events-none whitespace-nowrap">
                      <p className="font-mono text-[9px] text-stamped-cream font-bold">{r.id} · {r.category.toUpperCase()}</p>
                      <p className="font-sans text-[10px] text-stencil-white leading-tight max-w-[150px] truncate">{r.description}</p>
                      <p className="font-mono text-[8px] text-pencil-grey">{r.lat.toFixed(4)}°N · {Math.abs(r.lng).toFixed(4)}°W</p>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}

          {/* Selected Report Map Popup Overlay */}
          {reports
            .filter((r) => r.id === selectedReportId)
            .map((r) => {
              const pos = project(r.lat, r.lng);
              const isConfirmedByMe = r.confirmedBy.includes(currentUserId);
              const distance = getDistanceInKm(userLocation.lat, userLocation.lng, r.lat, r.lng);
              const isLocal = distance <= 8.0;
              const isHighPriority = r.confirmCount >= 6 && r.status !== "RESOLVED";

              return (
                <div
                  key={`popup-${r.id}`}
                  style={{
                    left: pos.x,
                    top: pos.y - 30, // Position above the pin
                    zIndex: 40,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-full bg-stamped-cream text-blueprint border-2 border-blueprint p-4 w-64 shadow-[4px_4px_0px_0px_rgba(27,42,63,1)] animate-stamp-thump"
                >
                  {/* Arrow pointer down */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-blueprint" />

                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-pencil-grey/30 pb-2 mb-2">
                    <span className="font-mono text-[9px] text-pencil-grey font-bold">{r.id}</span>
                    <span className={`px-1.5 py-0.5 font-mono text-[8px] font-extrabold ${
                      r.status === "RESOLVED"
                        ? "bg-verified-green text-stamped-cream"
                        : isHighPriority
                        ? "bg-red-600 text-stencil-white animate-pulse"
                        : r.status === "VERIFIED"
                        ? "bg-safety-orange text-stencil-white"
                        : "bg-blueprint/20 text-blueprint border border-blueprint/30"
                    }`}>
                      {isHighPriority ? "URGENT" : r.status}
                    </span>
                  </div>

                  {/* Content */}
                  <h4 className="font-space text-xs font-extrabold tracking-tight uppercase mb-1 truncate text-blueprint">
                    {r.category} IN {r.areaName}
                  </h4>
                  <p className="font-sans text-[10px] text-blueprint/90 mb-3.5 line-clamp-2 leading-relaxed font-semibold">
                    {r.description}
                  </p>

                  {/* Footer with Tally Stamp */}
                  <div className="flex items-center justify-between gap-1 border-t border-pencil-grey/20 pt-2.5">
                    {isLocal ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isConfirmedByMe && r.status !== "RESOLVED") {
                            onConfirmIssue(r.id);
                          }
                        }}
                        disabled={isConfirmedByMe || r.status === "RESOLVED"}
                        className={`font-space text-[10px] font-extrabold px-2.5 py-1 border-2 transition-all cursor-pointer rotate-[-1deg] ${
                          isConfirmedByMe
                            ? "bg-blueprint text-stamped-cream border-blueprint shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)] cursor-not-allowed"
                            : r.status === "RESOLVED"
                            ? "bg-pencil-grey/10 text-pencil-grey/40 border-pencil-grey/20 cursor-not-allowed"
                            : "bg-transparent text-blueprint border-blueprint hover:bg-blueprint hover:text-stamped-cream active:scale-95"
                        }`}
                        style={{ borderRadius: "0px" }}
                      >
                        🖎 TALLY +1 ({r.confirmCount})
                      </button>
                    ) : (
                      <span className="font-mono text-[8px] text-pencil-grey font-extrabold uppercase tracking-wider">OUT OF RANGE</span>
                    )}

                    <span className="font-mono text-[8.5px] text-pencil-grey font-bold">
                      GPS NEARBY
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Double click instruction overlay */}
      <div className="absolute bottom-3 left-3 bg-blueprint/90 border border-pencil-grey/40 px-2 py-1 flex items-center gap-1.5 pointer-events-none">
        <Navigation className="w-3.5 h-3.5 text-safety-orange animate-pulse" />
        <span className="font-mono text-[9px] text-stencil-white">DOUBLE-CLICK ANYWHERE TO DOCKET COORDINATES FOR REPORT</span>
      </div>

      {/* Hotspot Floating Sidebar when hovered */}
      {hoveredHotspot && (
        <div className="absolute top-4 left-4 bg-blueprint border-2 border-safety-orange p-3 max-w-[240px] pointer-events-none z-30 shadow-[3px_3px_0px_0px_rgba(232,99,28,0.5)]">
          <div className="flex items-center gap-1.5 text-safety-orange border-b border-safety-orange pb-1 mb-1.5">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span className="font-space text-xs font-extrabold tracking-wide uppercase">HOTSPOT DETECTED</span>
          </div>
          <p className="font-sans text-xs text-stamped-cream leading-tight font-medium">
            An active cluster of <strong className="text-safety-orange">{hoveredHotspot.issueCount} {hoveredHotspot.category}s</strong> has been flagged within 200 meters.
          </p>
          <p className="font-mono text-[9px] text-pencil-grey mt-2">
            LOCATION: {hoveredHotspot.areaName.toUpperCase()}
          </p>
          <p className="font-mono text-[8px] text-pencil-grey">
            LAT/LNG: {hoveredHotspot.lat.toFixed(4)}°N, {Math.abs(hoveredHotspot.lng).toFixed(4)}°W
          </p>
        </div>
      )}
    </div>
  );
}
